import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";
import { createWorker } from "tesseract.js";
import { GoogleGenAI } from "@google/genai";
import type { Domain, Layout } from "@shared/schema";

// Upload configuration
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Gemini Client (initialized lazily)
let ai: InstanceType<typeof GoogleGenAI> | null = null;
function getAI() {
  if (!ai) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set. Set it in your .env file to enable AI processing.");
    }
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
}

// ─── DOMAIN-AWARE AI PROMPT ────────────────────────────────────────────────
const DOMAIN_INSTRUCTIONS: Record<Domain, string> = {
  general: `
- Create 4–6 thematic sections covering the core content.
- Each section has 3–5 bullet points.
- Mix definitions, facts, and key takeaways.
- Use type "fact" for general information.
- Use type "definition" for explanations of terms.`,

  cs: `
- Focus on: definitions, algorithms, complexity, and code concepts.
- Each section has 3–5 bullet points.
- Use type "definition" for CS terms and data structures.
- Use type "algorithm" for step-by-step processes or pseudocode.
- Use type "formula" for time/space complexity like O(n log n).
- Highlight Big-O notations in algorithm points.`,

  math: `
- Focus on: formulas, theorems, derivation steps, and worked examples.
- Each section has 3–5 bullet points.
- Use type "formula" for ALL mathematical equations and expressions.
- Use type "definition" for theorem statements.
- Use type "fact" for properties and corollaries.
- Keep derivation steps ultra-minimal (max 1 line each).`,

  biology: `
- Focus on: processes, definitions, molecular components, and diagrams described in text.
- Each section has 3–5 bullet points.
- Use type "definition" for biological terms and taxonomy.
- Use type "fact" for biological processes and mechanisms.
- Use type "formula" for chemical equations (e.g. 6CO₂ + 6H₂O → C₆H₁₂O₆).
- Use type "advantage" for adaptive/evolutionary benefits.`,

  law: `
- Focus on: case holdings, legal rules, elements of crimes/torts, and exceptions.
- Each section has 3–5 bullet points.
- Use type "definition" for legal terms and doctrines.
- Use type "case" for case names, holdings, and legal rules derived from cases.
- Use type "warning" for exceptions, limitations, and majority vs minority splits.
- Use type "fact" for general legal principles.`,
};

const AI_PROMPT = (content: string, domain: Domain, layout: Layout) => `
You are an elite academic compression engine with domain intelligence.

Domain: ${domain.toUpperCase()}
Layout: ${layout}

Transform the following study content into a structured one-page revision sheet.

DOMAIN-SPECIFIC RULES:
${DOMAIN_INSTRUCTIONS[domain]}

UNIVERSAL RULES:
- Generate a short, accurate title (max 6 words).
- Every word must earn its place — no filler, no fluff.
- Mark the 3–5 MOST exam-critical points with "starred": true.
- For each section, optionally include a "relationship" string showing concept hierarchy using arrows (e.g. "TCP/IP → Transport Layer → Segments"). Only include if a clear hierarchy exists.
- Use type "warning" for any critical caveats or common mistakes.
- Use type "advantage" for benefits, pros, or positive outcomes.

POINT TYPES ALLOWED: "definition", "formula", "algorithm", "case", "advantage", "warning", "fact"

Output STRICTLY this JSON (no markdown, no extra text):
{
  "title": "...",
  "domain": "${domain}",
  "layout": "${layout}",
  "sections": [
    {
      "heading": "...",
      "relationship": "ConceptA → ConceptB → ConceptC",
      "points": [
        { "text": "...", "type": "definition", "starred": false },
        { "text": "...", "type": "formula", "starred": true }
      ]
    }
  ]
}

Content:
${content}
`.trim();

// ─── EVALUATION METRICS ─────────────────────────────────────────────────────
function computeMetrics(
  originalText: string,
  structured: { sections: Array<{ points: Array<{ text: string; starred?: boolean }> }> }
) {
  const originalWordCount = originalText.split(/\s+/).filter(Boolean).length;
  const allPoints = structured.sections.flatMap(s => s.points);
  const compressedText = allPoints.map(p => p.text).join(" ");
  const compressedWordCount = compressedText.split(/\s+/).filter(Boolean).length;
  const reductionPercent = Math.round(((originalWordCount - compressedWordCount) / Math.max(originalWordCount, 1)) * 100);
  return {
    originalWordCount,
    compressedWordCount,
    reductionPercent: Math.max(0, reductionPercent),
    sectionCount: structured.sections.length,
    conceptCount: allPoints.length,
    starredCount: allPoints.filter(p => p.starred).length,
  };
}

async function seedDatabase() {
  const existing = await storage.getAllCheatSheets();
  if (existing.length === 0) {
    console.log("Seeding database...");
    const seed = await storage.createCheatSheet({
      title: "Example: Photosynthesis",
      originalImageUrl: "text-input",
      ocrText: "Photosynthesis is the process by which green plants and some other organisms use sunlight to synthesize foods from carbon dioxide and water.",
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
            ]
          },
          {
            heading: "Core Equation",
            points: [
              { text: "6CO₂ + 6H₂O + Light → C₆H₁₂O₆ + 6O₂", type: "formula", starred: true },
              { text: "Products: glucose (food) + oxygen.", type: "fact", starred: false },
              { text: "Net energy stored = 686 kcal/mol glucose.", type: "formula", starred: false },
            ]
          },
        ],
        metrics: {
          originalWordCount: 42,
          compressedWordCount: 28,
          reductionPercent: 33,
          sectionCount: 2,
          conceptCount: 6,
          starredCount: 2,
        }
      }
    });
    console.log("Database seeded!");
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads");
  }

  seedDatabase();

  app.use('/uploads', express.static('uploads'));

  // ── Route: Upload an image file ──────────────────────────────────────────
  app.post("/api/upload", upload.single("file"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const cheatSheet = await storage.createCheatSheet({
      title: req.file.originalname.replace(/\.[^/.]+$/, ""),
      originalImageUrl: fileUrl,
    });

    res.status(201).json({
      id: cheatSheet.id,
      url: fileUrl,
      filename: req.file.filename
    });
  });

  // ── Route: Submit raw text ───────────────────────────────────────────────
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

  // ── Route: Process a cheat sheet (OCR → AI LLM → Save) ───────────────────
  app.post("/api/cheatsheets/:id/process", async (req, res) => {
    const id = parseInt(req.params.id);
    const domain: Domain = (req.body?.domain as Domain) || "general";
    const layout: Layout = (req.body?.layout as Layout) || "grid";
    const cheatSheet = await storage.getCheatSheet(id);

    if (!cheatSheet) {
      return res.status(404).json({ message: "Cheat sheet not found" });
    }

    try {
      let textToProcess: string;

      if (cheatSheet.ocrText && cheatSheet.ocrText.trim().length > 0) {
        textToProcess = cheatSheet.ocrText;
      } else if (cheatSheet.originalImageUrl && cheatSheet.originalImageUrl !== "text-input") {
        const imagePath = path.join(process.cwd(), cheatSheet.originalImageUrl.substring(1));
        if (!fs.existsSync(imagePath)) {
          return res.status(404).json({ message: "Image file not found on server." });
        }
        const worker = await createWorker("eng");
        const { data: { text: ocrText } } = await worker.recognize(imagePath);
        await worker.terminate();
        textToProcess = ocrText.trim();
        if (!textToProcess || textToProcess.length < 5) {
          return res.status(422).json({ message: "Could not extract readable text from the image. Please try a clearer image or use the text input option." });
        }
        await storage.updateCheatSheet(id, { ocrText: textToProcess });
      } else {
        return res.status(422).json({ message: "No content to process." });
      }

      // Step 2: Domain-aware AI compression
      const result = await getAI().models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: AI_PROMPT(textToProcess, domain, layout) }] }],
      });

      const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      const cleanJson = responseText.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

      let structuredContent: any;
      try {
        structuredContent = JSON.parse(cleanJson);
      } catch {
        const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          structuredContent = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("AI returned invalid JSON.");
        }
      }

      if (!structuredContent.title || !Array.isArray(structuredContent.sections)) {
        throw new Error("AI response missing required fields.");
      }

      // Normalise points: support both string[] (legacy) and StructuredPoint[]
      structuredContent.sections = structuredContent.sections.map((s: any) => ({
        ...s,
        points: (s.points || []).map((p: any) =>
          typeof p === "string"
            ? { text: p, type: "fact", starred: false }
            : { text: p.text || p, type: p.type || "fact", starred: p.starred || false }
        ),
      }));

      // Step 3: Compute evaluation metrics
      structuredContent.metrics = computeMetrics(textToProcess, structuredContent);
      structuredContent.domain = domain;
      structuredContent.layout = layout;

      const updated = await storage.updateCheatSheet(id, { structuredContent });
      res.json(updated);

    } catch (error: any) {
      console.error("Processing error:", error);
      if (error.message?.includes("GEMINI_API_KEY")) {
        return res.status(503).json({ message: "AI service not configured. Please set GEMINI_API_KEY in your .env file." });
      }
      if (error.message?.includes("API_KEY_INVALID") || error.message?.includes("401")) {
        return res.status(503).json({ message: "Invalid Gemini API key. Please check your GEMINI_API_KEY." });
      }
      res.status(500).json({ message: `Processing failed: ${error.message || "Unknown error"}` });
    }
  });

  // ── Route: List all cheat sheets ─────────────────────────────────────────
  app.get("/api/cheatsheets", async (req, res) => {
    const list = await storage.getAllCheatSheets();
    res.json(list);
  });

  // ── Route: Get a specific cheat sheet ────────────────────────────────────
  app.get("/api/cheatsheets/:id", async (req, res) => {
    const item = await storage.getCheatSheet(parseInt(req.params.id));
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  });

  // ── Route: Delete a cheat sheet ───────────────────────────────────────────
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
