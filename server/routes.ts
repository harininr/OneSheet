import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";
import type { Domain, Layout } from "@shared/schema";
import { routeAITask } from "./services/aiRouter";
import { generateWithGroq, chatWithGroq } from "./services/groqService";
import { parseAIResponse, normaliseContent } from "./services/geminiService";
import { SYSTEM_PROMPTS, VISION_PROMPT, COMPREHENSIVE_PROMPT } from "./services/prompts";
import { extractTextWithTesseract } from "./services/ocrService";

// Upload configuration — accept images up to 10MB
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 },
});

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
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".doc": "application/msword",
    ".ppt": "application/vnd.ms-powerpoint",
  };
  return mimeMap[ext] || "application/octet-stream";
}

// ─── GENERATE EXTRAS (concept map, key terms, quiz) via Groq ────────────────
async function generateExtras(structuredContent: any, textContent: string) {
  const needsConceptMap = !structuredContent.conceptMap?.nodes?.length;
  const needsKeyTerms = !structuredContent.keyTerms?.length;
  const needsQuiz = !structuredContent.quiz?.questions?.length;

  if (!needsConceptMap && !needsKeyTerms && !needsQuiz) {
    return structuredContent; // Already complete
  }

  console.log(`[AI Router] Generating missing extras: ${needsConceptMap ? 'ConceptMap ' : ''}${needsKeyTerms ? 'KeyTerms ' : ''}${needsQuiz ? 'Quiz' : ''}`);

  try {
    if (needsKeyTerms) {
      console.log("[AI] Generating Key Terms...");
      const glossaryPrompt = `${SYSTEM_PROMPTS.glossary}\n\nContent: ${textContent}`;
      const response = await routeAITask("glossary", glossaryPrompt, undefined, SYSTEM_PROMPTS.glossary);
      const parsed = parseAIResponse(response);
      if (Array.isArray(parsed)) {
        structuredContent.keyTerms = parsed;
      } else if (parsed.keyTerms) {
        structuredContent.keyTerms = parsed.keyTerms;
      }
    }

    if (needsConceptMap) {
      console.log("[AI] Generating Concept Map...");
      const cmPrompt = `${SYSTEM_PROMPTS.conceptmap}\n\nContent: ${textContent}`;
      const response = await routeAITask("conceptmap", cmPrompt, undefined, SYSTEM_PROMPTS.conceptmap);
      const parsed = parseAIResponse(response);
      if (parsed.nodes && parsed.edges) {
        structuredContent.conceptMap = parsed;
      }
    }

    if (needsQuiz) {
      console.log("[AI] Generating Quiz...");
      const quizPrompt = `${SYSTEM_PROMPTS.quiz}\n\nContent: ${textContent}`;
      const response = await routeAITask("quiz", quizPrompt, undefined, SYSTEM_PROMPTS.quiz);
      const parsed = parseAIResponse(response);
      if (Array.isArray(parsed)) {
        structuredContent.quiz = { questions: parsed, totalPoints: parsed.length };
      } else if (parsed.questions) {
        structuredContent.quiz = parsed;
        structuredContent.quiz.totalPoints = parsed.questions.length;
      }
    }

    console.log("[AI] Extras generation completed.");
  } catch (err: any) {
    console.error("[AI] Extras generation partial fail:", err.message);
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

  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      if (!message) return res.status(400).json({ error: "Message is required" });
      
      const reply = await chatWithGroq(message, history);
      res.json({ reply });
    } catch (error) {
      console.error("Chat route error:", error);
      res.status(500).json({ error: "Failed to process chat" });
    }
  });

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
  //  PROCESS — Split Workload (Gemini for Vision, Groq for Text)
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
      console.time(`[AI PROCESS] Total ID:${id}`);
      let structuredContent: any;
      let textForMetrics: string = "";

      // ── PHASE 1: OCR / Vision (Gemini Only) ──
      if (cheatSheet.originalImageUrl && cheatSheet.originalImageUrl !== "text-input" && !cheatSheet.ocrText) {
        const imagePath = path.join(process.cwd(), cheatSheet.originalImageUrl.substring(1));
        if (!fs.existsSync(imagePath)) {
          return res.status(404).json({ message: "Image file not found on server." });
        }

        console.time(`[AI PROCESS] Phase 1: OCR`);
        
        // ── 1a: Attempt Tesseract OCR First ──
        console.log(`[AI Router] Phase 1a: local/ocr → Tesseract`);
        let extractedText = await extractTextWithTesseract(imagePath);

        // ── 1b: Fallback to Gemini if Tesseract fails/low confidence ──
        if (!extractedText) {
          console.log(`[AI Router] Phase 1b: vision/ocr fallback → Gemini`);
          const imageBuffer = fs.readFileSync(imagePath);
          const base64Image = imageBuffer.toString("base64");
          const mimeType = getMimeType(imagePath);
          extractedText = await routeAITask("ocr", VISION_PROMPT, base64Image, undefined, mimeType);
        }

        console.timeEnd(`[AI PROCESS] Phase 1: OCR`);
        
        await storage.updateCheatSheet(id, { ocrText: extractedText });
        textForMetrics = extractedText;
      } else {
        textForMetrics = cheatSheet.ocrText || "";
      }

      // ── PHASE 2: Structuring & Generation (Groq Preferred) ──
      console.log(`[AI Router] Phase 2: cheatsheet → Groq (Llama 3.3)`);
      console.time(`[AI PROCESS] Phase 2: Structure`);
      const systemPrompt = SYSTEM_PROMPTS.domain[domain] || SYSTEM_PROMPTS.domain.general;
      const responseText = await routeAITask(
        "cheatsheet", 
        COMPREHENSIVE_PROMPT(domain, layout) + `\n\nContent:\n${textForMetrics}`, 
        undefined, 
        systemPrompt
      );
      console.timeEnd(`[AI PROCESS] Phase 2: Structure`);

      structuredContent = parseAIResponse(responseText);

      // ── PHASE 3: Normalise & Extras ──
      console.time(`[AI PROCESS] Phase 3: Extras`);
      structuredContent = normaliseContent(structuredContent, textForMetrics, domain, layout);
      structuredContent = await generateExtras(structuredContent, textForMetrics);
      console.timeEnd(`[AI PROCESS] Phase 3: Extras`);

      // Save to database
      console.time(`[AI PROCESS] DB Update`);
      const updated = await storage.updateCheatSheet(id, { structuredContent });
      console.timeEnd(`[AI PROCESS] DB Update`);

      console.log(`[AI] ✅ Complete! Provider split successful.`);
      console.timeEnd(`[AI PROCESS] Total ID:${id}`);
      res.json(updated);

    } catch (error: any) {
      console.timeEnd(`[AI PROCESS] Total ID:${id}`);
      console.error("[AI] ❌ Processing error:", error.message || error);
      res.status(500).json({ message: `Processing failed: ${error.message || "Unknown error"}` });
    }
  });

  app.get("/api/cheatsheets", async (_req, res) => {
    res.json(await storage.getAllCheatSheets());
  });

  app.get("/api/cheatsheets/:id", async (req, res) => {
    const item = await storage.getCheatSheet(parseInt(req.params.id));
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  });

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
