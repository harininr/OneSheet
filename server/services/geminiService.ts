import { GoogleGenAI } from "@google/genai";
import type { Domain, Layout } from "@shared/schema";

// Gemini Client (initialized lazily)
let ai: InstanceType<typeof GoogleGenAI> | null = null;
function getAI() {
  if (!ai) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set.");
    }
    ai = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY,
      apiVersion: "v1"
    });
  }
  return ai;
}

export async function generateWithGemini(prompt: string, imageData?: string, mimeType: string = "image/jpeg"): Promise<string> {
  console.log(`[AI Router] Task: vision/ocr → Provider: gemini`);
  const ai = getAI();

  if (imageData) {
    const result = await (ai as any).models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType,
              data: imageData,
            },
          },
          { text: prompt },
        ],
      }],
    });
    return result.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } else {
    const result = await (ai as any).models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    return result.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }
}

// Re-export common logic needed by routes.ts but moved to service layer
export function parseAIResponse(responseText: string): any {
  const cleanJson = responseText
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  try {
    return JSON.parse(cleanJson);
  } catch {
    const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        const fixed = jsonMatch[0]
          .replace(/,\s*}/g, "}")
          .replace(/,\s*]/g, "]");
        return JSON.parse(fixed);
      }
    }
    throw new Error("AI returned invalid JSON.");
  }
}

export function computeMetrics(
  originalText: string,
  structured: { sections: Array<{ points: Array<{ text: string; starred?: boolean }> }> }
) {
  const originalWordCount = originalText.split(/\s+/).filter(Boolean).length;
  const allPoints = structured.sections.flatMap(s => s.points);
  const compressedText = allPoints.map(p => p.text).join(" ");
  const compressedWordCount = compressedText.split(/\s+/).filter(Boolean).length;
  const reductionPercent = Math.round(
    ((originalWordCount - compressedWordCount) / Math.max(originalWordCount, 1)) * 100
  );
  return {
    originalWordCount,
    compressedWordCount,
    reductionPercent: Math.max(0, reductionPercent),
    sectionCount: structured.sections.length,
    conceptCount: allPoints.length,
    starredCount: allPoints.filter(p => p.starred).length,
  };
}

export function normaliseContent(structuredContent: any, textForMetrics: string, domain: Domain, layout: Layout) {
  structuredContent.sections = (structuredContent.sections || []).map((s: any) => ({
    ...s,
    points: (s.points || []).map((p: any) =>
      typeof p === "string"
        ? { text: p, type: "fact" as const, starred: false }
        : { text: p.text || String(p), type: p.type || "fact", starred: !!p.starred }
    ),
  }));

  structuredContent.metrics = computeMetrics(textForMetrics, structuredContent);
  structuredContent.domain = domain;
  structuredContent.layout = layout;

  if (structuredContent.quiz?.questions) {
    structuredContent.quiz.totalPoints = structuredContent.quiz.questions.length;
  }

  return structuredContent;
}
