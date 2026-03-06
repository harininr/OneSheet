import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";
import { GoogleGenAI } from "@google/genai";
import type { Domain, Layout } from "@shared/schema";

// Upload configuration — accept images up to 10MB
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Gemini Client (initialized lazily)
let ai: InstanceType<typeof GoogleGenAI> | null = null;
function getAI() {
  if (!ai) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set.");
    }
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
}

// ── MIME type detection ───────────────────────────────────────────────────────
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeMap: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".bmp": "image/bmp",
    ".heic": "image/heic",
    ".heif": "image/heif",
    ".tiff": "image/tiff",
    ".tif": "image/tiff",
    ".pdf": "application/pdf",
  };
  return mimeMap[ext] || "image/jpeg";
}

// ─── DOMAIN-SPECIFIC INSTRUCTIONS ──────────────────────────────────────────
const DOMAIN_INSTRUCTIONS: Record<Domain, string> = {
  general: `
- Create 4–8 thematic sections covering ALL the content thoroughly.
- Each section has 3–6 bullet points.
- Mix definitions, facts, and key takeaways.
- Use type "fact" for general information.
- Use type "definition" for explanations of terms.`,

  cs: `
- Focus on: definitions, algorithms, complexity, and code concepts.
- Each section has 3–6 bullet points.
- Use type "definition" for CS terms and data structures.
- Use type "algorithm" for step-by-step processes or pseudocode.
- Use type "formula" for time/space complexity like O(n log n).
- Highlight Big-O notations in algorithm points.`,

  math: `
- Focus on: formulas, theorems, derivation steps, and worked examples.
- Each section has 3–6 bullet points.
- Use type "formula" for ALL mathematical equations and expressions.
- Use type "definition" for theorem statements.
- Use type "fact" for properties and corollaries.
- Keep derivation steps ultra-minimal (max 1 line each).`,

  biology: `
- Focus on: processes, definitions, molecular components, and diagrams described in text.
- Each section has 3–6 bullet points.
- Use type "definition" for biological terms and taxonomy.
- Use type "fact" for biological processes and mechanisms.
- Use type "formula" for chemical equations (e.g. 6CO₂ + 6H₂O → C₆H₁₂O₆).
- Use type "advantage" for adaptive/evolutionary benefits.`,

  law: `
- Focus on: case holdings, legal rules, elements of crimes/torts, and exceptions.
- Each section has 3–6 bullet points.
- Use type "definition" for legal terms and doctrines.
- Use type "case" for case names, holdings, and legal rules derived from cases.
- Use type "warning" for exceptions, limitations, and majority vs minority splits.
- Use type "fact" for general legal principles.`,
};

// ─── VISION PROMPT (for images — handwritten OR printed) ───────────────────
const VISION_PROMPT = (domain: Domain, layout: Layout) => `
You are an elite academic AI with advanced handwriting recognition and domain expertise.

YOUR MISSION: Read EVERYTHING from this image — handwritten notes, printed text, diagrams, tables, formulas, annotations, arrows, underlines, circled text, margin notes, sticky notes, etc. — and transform it into a perfect study package.

CRITICAL HANDWRITING RULES:
- This image may contain HANDWRITTEN notes. Read ALL handwriting carefully, even messy/cursive.
- If a word is unclear, use context clues from surrounding words to infer the correct word.
- Preserve mathematical notation: fractions, exponents, subscripts, Greek letters, operators.
- Read text in ALL orientations (horizontal, diagonal, margin annotations, circled items).
- Capture diagram labels, flowchart text, table contents, and any drawn arrows/connections.
- DO NOT skip any content. Every piece of writing in the image must be captured.
- If there are bullet points or numbered lists, preserve their structure.

Domain: ${domain.toUpperCase()}
Layout: ${layout}

DOMAIN-SPECIFIC RULES:
${DOMAIN_INSTRUCTIONS[domain]}

═══════════════════════════════════════
GENERATE ALL 4 COMPONENTS:
═══════════════════════════════════════

1. STRUCTURED CHEAT SHEET
- Generate a short, accurate title (max 6 words).
- Create 4–8 sections covering ALL content from the image.
- Every word must earn its place — no filler, no fluff.
- Mark the 3–5 MOST exam-critical points with "starred": true.
- For each section, optionally include a "relationship" string showing concept hierarchy using arrows (e.g. "TCP/IP → Transport Layer → Segments"). Only include if a clear hierarchy exists.
- POINT TYPES: "definition", "formula", "algorithm", "case", "advantage", "warning", "fact"

2. CONCEPT MAP
- 8–15 concept nodes from the content.
- Each node: id (slug), label (display name), group (section heading), importance ("high"/"medium"/"low").
- 10–20 edges: from (id), to (id), label (relationship verb).

3. KEY TERMS (8–15 terms)
- term, definition (1–2 sentences), importance ("critical"/"important"/"supplementary"), relatedTerms (1–3 other terms).

4. QUIZ (8–12 MCQs)
- id, question, options (4 choices), correctIndex (0-3), explanation, difficulty ("easy"/"medium"/"hard"), relatedSection.
- Mix: ~30% easy, ~40% medium, ~30% hard. Test UNDERSTANDING, not just recall.

Output STRICTLY this JSON (no markdown fences, no commentary):
{
  "extractedText": "Full raw text extracted from the image, preserving original structure",
  "title": "...",
  "domain": "${domain}",
  "layout": "${layout}",
  "sections": [
    {
      "heading": "...",
      "relationship": "A → B → C",
      "points": [
        { "text": "...", "type": "definition", "starred": false }
      ]
    }
  ],
  "conceptMap": {
    "nodes": [ { "id": "slug", "label": "Name", "group": "Section", "importance": "high" } ],
    "edges": [ { "from": "a", "to": "b", "label": "uses" } ]
  },
  "keyTerms": [
    { "term": "Term", "definition": "...", "importance": "critical", "relatedTerms": ["Other"] }
  ],
  "quiz": {
    "questions": [
      { "id": "q1", "question": "?", "options": ["A","B","C","D"], "correctIndex": 0, "explanation": "...", "difficulty": "medium", "relatedSection": "Section" }
    ],
    "totalPoints": 10
  }
}`.trim();

// ─── TEXT-ONLY PROMPT ───────────────────────────────────────────────────────
const TEXT_PROMPT = (content: string, domain: Domain, layout: Layout) => `
You are an elite academic compression engine with domain intelligence.

Domain: ${domain.toUpperCase()}
Layout: ${layout}

Transform the following study content into a COMPREHENSIVE study package with 4 components.

DOMAIN-SPECIFIC RULES:
${DOMAIN_INSTRUCTIONS[domain]}

UNIVERSAL RULES:
- Generate a short, accurate title (max 6 words).
- Create 4–8 thematic sections covering ALL the content.
- Every word must earn its place — no filler, no fluff.
- Mark the 3–5 MOST exam-critical points with "starred": true.
- For each section, optionally include a "relationship" string.
- POINT TYPES: "definition", "formula", "algorithm", "case", "advantage", "warning", "fact"

ALSO GENERATE:
- conceptMap: 8–15 nodes + 10–20 edges showing concept relationships.
- keyTerms: 8–15 terms with definitions, importance, and relatedTerms.
- quiz: 8–12 MCQs mixing easy/medium/hard with explanations.

Output STRICTLY this JSON (no markdown fences, no commentary):
{
  "title": "...",
  "domain": "${domain}",
  "layout": "${layout}",
  "sections": [
    {
      "heading": "...",
      "relationship": "A → B → C",
      "points": [
        { "text": "...", "type": "definition", "starred": false }
      ]
    }
  ],
  "conceptMap": {
    "nodes": [ { "id": "slug", "label": "Name", "group": "Section", "importance": "high" } ],
    "edges": [ { "from": "a", "to": "b", "label": "uses" } ]
  },
  "keyTerms": [
    { "term": "Term", "definition": "...", "importance": "critical", "relatedTerms": ["Other"] }
  ],
  "quiz": {
    "questions": [
      { "id": "q1", "question": "?", "options": ["A","B","C","D"], "correctIndex": 0, "explanation": "...", "difficulty": "medium", "relatedSection": "Section" }
    ],
    "totalPoints": 10
  }
}

Content:
${content}
`.trim();

// ─── FALLBACK PROMPT (concept map + key terms + quiz only) ──────────────────
const EXTRAS_PROMPT = (content: string) => `
Analyze this text and generate supplementary study materials. Return ONLY valid JSON, no markdown.

Content: ${content}

Return this exact JSON:
{
  "conceptMap": {
    "nodes": [ { "id": "slug", "label": "Name", "group": "Category", "importance": "high|medium|low" } ],
    "edges": [ { "from": "id1", "to": "id2", "label": "relationship" } ]
  },
  "keyTerms": [
    { "term": "Term", "definition": "Brief explanation.", "importance": "critical|important|supplementary", "relatedTerms": ["Other"] }
  ],
  "quiz": {
    "questions": [
      { "id": "q1", "question": "?", "options": ["A","B","C","D"], "correctIndex": 0, "explanation": "Why", "difficulty": "easy|medium|hard", "relatedSection": "Topic" }
    ],
    "totalPoints": 8
  }
}

Rules:
- 8–15 concept nodes with edges showing relationships
- 8–15 key terms with definitions
- 8–12 quiz questions (mix easy/medium/hard)
- Questions should test UNDERSTANDING`.trim();

// ─── EVALUATION METRICS ─────────────────────────────────────────────────────
function computeMetrics(
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

// ─── ROBUST JSON PARSER ─────────────────────────────────────────────────────
function parseAIResponse(responseText: string): any {
  const cleanJson = responseText
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  try {
    return JSON.parse(cleanJson);
  } catch {
    // Try extracting JSON from surrounding text
    const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        // Try fixing common JSON issues (trailing commas)
        const fixed = jsonMatch[0]
          .replace(/,\s*}/g, "}")
          .replace(/,\s*]/g, "]");
        return JSON.parse(fixed);
      }
    }
    throw new Error("AI returned invalid JSON.");
  }
}

// ─── NORMALISE STRUCTURED CONTENT ───────────────────────────────────────────
function normaliseContent(structuredContent: any, textForMetrics: string, domain: Domain, layout: Layout) {
  // Normalise points
  structuredContent.sections = (structuredContent.sections || []).map((s: any) => ({
    ...s,
    points: (s.points || []).map((p: any) =>
      typeof p === "string"
        ? { text: p, type: "fact" as const, starred: false }
        : { text: p.text || String(p), type: p.type || "fact", starred: !!p.starred }
    ),
  }));

  // Compute metrics
  structuredContent.metrics = computeMetrics(textForMetrics, structuredContent);
  structuredContent.domain = domain;
  structuredContent.layout = layout;

  // Ensure quiz totalPoints
  if (structuredContent.quiz?.questions) {
    structuredContent.quiz.totalPoints = structuredContent.quiz.questions.length;
  }

  return structuredContent;
}

// ─── GENERATE EXTRAS (concept map, key terms, quiz) via fallback call ───────
async function generateExtras(structuredContent: any, textContent: string) {
  if (
    structuredContent.conceptMap?.nodes?.length > 0 &&
    structuredContent.keyTerms?.length > 0 &&
    structuredContent.quiz?.questions?.length > 0
  ) {
    return structuredContent; // Already has everything
  }

  console.log("[AI] Generating extras (concept map, key terms, quiz) via second call...");
  try {
    const result = await getAI().models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{ role: "user", parts: [{ text: EXTRAS_PROMPT(textContent) }] }],
    });

    const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const parsed = parseAIResponse(responseText);

    if (!structuredContent.conceptMap?.nodes?.length && parsed.conceptMap) {
      structuredContent.conceptMap = parsed.conceptMap;
    }
    if (!structuredContent.keyTerms?.length && parsed.keyTerms) {
      structuredContent.keyTerms = parsed.keyTerms;
    }
    if (!structuredContent.quiz?.questions?.length && parsed.quiz) {
      structuredContent.quiz = parsed.quiz;
      structuredContent.quiz.totalPoints = parsed.quiz.questions?.length || 0;
    }

    console.log("[AI] Extras generated successfully:",
      "conceptMap:", !!structuredContent.conceptMap?.nodes?.length,
      "keyTerms:", !!structuredContent.keyTerms?.length,
      "quiz:", !!structuredContent.quiz?.questions?.length
    );
  } catch (err: any) {
    console.error("[AI] Extras generation failed:", err.message);
  }

  return structuredContent;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

async function seedDatabase() {
  const existing = await storage.getAllCheatSheets();
  if (existing.length === 0) {
    console.log("Seeding database with example...");
    const seed = await storage.createCheatSheet({
      title: "Example: Photosynthesis",
      originalImageUrl: "text-input",
      ocrText: "Photosynthesis is the process by which green plants use sunlight to synthesize foods from CO₂ and H₂O.",
    });
    await storage.updateCheatSheet(seed.id, {
      structuredContent: {
        title: "Photosynthesis Overview",
        domain: "biology",
        layout: "grid",
        sections: [
          {
            heading: "Definition",
            relationship: "Sunlight → Chlorophyll → Glucose",
            points: [
              { text: "Light energy → chemical energy conversion.", type: "definition", starred: true },
              { text: "Occurs in plant chloroplasts.", type: "fact", starred: false },
              { text: "Uses CO₂ + H₂O as raw materials.", type: "fact", starred: false },
            ],
          },
          {
            heading: "Core Equation",
            points: [
              { text: "6CO₂ + 6H₂O + Light → C₆H₁₂O₆ + 6O₂", type: "formula", starred: true },
              { text: "Products: glucose (food) + oxygen.", type: "fact", starred: false },
            ],
          },
        ],
        metrics: { originalWordCount: 20, compressedWordCount: 15, reductionPercent: 25, sectionCount: 2, conceptCount: 5, starredCount: 2 },
      },
    });
    console.log("Database seeded!");
  }
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

  seedDatabase();

  app.use("/uploads", express.static("uploads"));

  // ── Upload an image file ──────────────────────────────────────────────────
  app.post("/api/upload", upload.single("file"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const cheatSheet = await storage.createCheatSheet({
      title: req.file.originalname.replace(/\.[^/.]+$/, ""),
      originalImageUrl: fileUrl,
    });

    res.status(201).json({ id: cheatSheet.id, url: fileUrl, filename: req.file.filename });
  });

  // ── Submit raw text ───────────────────────────────────────────────────────
  app.post("/api/upload-text", async (req, res) => {
    const { text, title } = req.body;

    if (!text || typeof text !== "string" || text.trim().length < 10) {
      return res.status(400).json({ message: "Please provide at least 10 characters of text." });
    }

    const cheatSheet = await storage.createCheatSheet({
      title: title?.trim() || "My Notes",
      originalImageUrl: "text-input",
      ocrText: text.trim(),
    });

    res.status(201).json({ id: cheatSheet.id, url: null, filename: null });
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  PROCESS — The core intelligence engine
  // ══════════════════════════════════════════════════════════════════════════
  app.post("/api/cheatsheets/:id/process", async (req, res) => {
    const id = parseInt(req.params.id);
    const domain: Domain = (req.body?.domain as Domain) || "general";
    const layout: Layout = (req.body?.layout as Layout) || "grid";
    const cheatSheet = await storage.getCheatSheet(id);

    if (!cheatSheet) {
      return res.status(404).json({ message: "Cheat sheet not found" });
    }

    try {
      let structuredContent: any;
      let textForMetrics: string;

      // ════════════════════════════════════════════════════════════════════
      //  PATH A: IMAGE → Gemini Vision (handles handwritten + printed)
      // ════════════════════════════════════════════════════════════════════
      if (cheatSheet.originalImageUrl && cheatSheet.originalImageUrl !== "text-input") {
        const imagePath = path.join(process.cwd(), cheatSheet.originalImageUrl.substring(1));
        if (!fs.existsSync(imagePath)) {
          return res.status(404).json({ message: "Image file not found on server." });
        }

        console.log(`[AI] Processing image: ${imagePath}`);
        console.log(`[AI] Using Gemini Vision (handles handwritten + printed notes)`);

        // Read image as Base64
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString("base64");

        // Detect MIME type from original filename or path
        const originalName = cheatSheet.title || "";
        const mimeType = getMimeType(
          originalName.includes(".") ? originalName : imagePath
        );

        console.log(`[AI] Image size: ${(imageBuffer.length / 1024).toFixed(1)}KB, MIME: ${mimeType}`);

        // ── Send image DIRECTLY to Gemini Vision ──
        // This is the key upgrade: Gemini Vision can read handwritten notes
        // far better than any OCR engine (Tesseract, etc.)
        const result = await getAI().models.generateContent({
          model: "gemini-1.5-flash",
          contents: [{
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: base64Image,
                },
              },
              {
                text: VISION_PROMPT(domain, layout),
              },
            ],
          }],
        });

        const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        console.log(`[AI] Vision response length: ${responseText.length} chars`);

        try {
          structuredContent = parseAIResponse(responseText);
        } catch (parseError) {
          // Robust Fallback: If JSON parsing fails, try to extract JUST the text
          // to at least save the digitized notes.
          console.warn("[AI] Full structured generation failed. Attempting OCR fallback...");
          const textOnlyResult = await getAI().models.generateContent({
            model: "gemini-1.5-flash",
            contents: [{
              role: "user",
              parts: [{ inlineData: { mimeType, data: base64Image } }, { text: "Read and return ONLY the raw text from this image. No commentary." }]
            }]
          });
          const ocrOnlyText = textOnlyResult.candidates?.[0]?.content?.parts?.[0]?.text || "";
          if (ocrOnlyText) {
            await storage.updateCheatSheet(id, { ocrText: ocrOnlyText });
            throw new Error("AI understood the text but failed to build the study package structure. Please try clicking 'Re-process'.");
          }
          throw parseError;
        }

        // Extract the raw text for metrics and saving
        textForMetrics = structuredContent.extractedText || "";

        // Save the extracted text as OCR text for the detail view
        if (textForMetrics.length > 0) {
          await storage.updateCheatSheet(id, { ocrText: textForMetrics });
        }

        // Clean up extractedText from the saved content (it's stored separately)
        delete structuredContent.extractedText;

        // ════════════════════════════════════════════════════════════════════
        //  PATH B: TEXT → Direct AI processing
        // ════════════════════════════════════════════════════════════════════
      } else if (cheatSheet.ocrText && cheatSheet.ocrText.trim().length > 0) {
        textForMetrics = cheatSheet.ocrText;

        console.log(`[AI] Processing text input (${textForMetrics.length} chars)`);

        const result = await getAI().models.generateContent({
          model: "gemini-1.5-flash",
          contents: [{ role: "user", parts: [{ text: TEXT_PROMPT(textForMetrics, domain, layout) }] }],
        });

        const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        console.log(`[AI] Text response length: ${responseText.length} chars`);

        structuredContent = parseAIResponse(responseText);
      } else {
        return res.status(422).json({ message: "No content to process." });
      }

      // ── Validate AI response ──
      if (!structuredContent.title || !Array.isArray(structuredContent.sections)) {
        throw new Error("AI response missing required fields (title or sections).");
      }

      if (structuredContent.sections.length === 0) {
        throw new Error("AI returned empty sections. The image may be unreadable.");
      }

      // ── Normalise and compute metrics ──
      structuredContent = normaliseContent(structuredContent, textForMetrics!, domain, layout);

      // ── Generate extras if missing (concept map, key terms, quiz) ──
      structuredContent = await generateExtras(structuredContent, textForMetrics!);

      // ── Save to database ──
      const updated = await storage.updateCheatSheet(id, { structuredContent });

      console.log(`[AI] ✅ Complete! Sections: ${structuredContent.sections.length}, ` +
        `ConceptMap: ${structuredContent.conceptMap?.nodes?.length || 0} nodes, ` +
        `KeyTerms: ${structuredContent.keyTerms?.length || 0}, ` +
        `Quiz: ${structuredContent.quiz?.questions?.length || 0} questions`);

      res.json(updated);

    } catch (error: any) {
      console.error("[AI] ❌ Processing error:", error.message || error);

      if (error.message?.includes("GEMINI_API_KEY") || error.message?.includes("not set")) {
        return res.status(503).json({ message: "AI service not configured. Set GEMINI_API_KEY in .env." });
      }
      if (error.message?.includes("API_KEY_INVALID") || error.message?.includes("401")) {
        return res.status(503).json({ message: "Invalid Gemini API key." });
      }
      if (error.message?.includes("SAFETY")) {
        return res.status(422).json({ message: "Content was blocked by safety filters. Try different content." });
      }
      res.status(500).json({ message: `Processing failed: ${error.message || "Unknown error"}` });
    }
  });

  // ── List all ──────────────────────────────────────────────────────────────
  app.get("/api/cheatsheets", async (_req, res) => {
    res.json(await storage.getAllCheatSheets());
  });

  // ── Get one ───────────────────────────────────────────────────────────────
  app.get("/api/cheatsheets/:id", async (req, res) => {
    const item = await storage.getCheatSheet(parseInt(req.params.id));
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  });

  // ── Delete ────────────────────────────────────────────────────────────────
  app.delete("/api/cheatsheets/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const item = await storage.getCheatSheet(id);
    if (!item) return res.status(404).json({ message: "Not found" });

    if (item.originalImageUrl && item.originalImageUrl !== "text-input") {
      const filePath = path.join(process.cwd(), item.originalImageUrl.substring(1));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await storage.deleteCheatSheet(id);
    res.json({ message: "Deleted successfully" });
  });

  return httpServer;
}
