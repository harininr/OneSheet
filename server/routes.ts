import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCheatSheetSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";
import { createWorker } from "tesseract.js";
import { GoogleGenAI } from "@google/genai";

// Upload configuration
const upload = multer({ 
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Gemini Client (using integration env vars)
const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

async function seedDatabase() {
  const existing = await storage.getAllCheatSheets();
  if (existing.length === 0) {
    console.log("Seeding database...");
    await storage.createCheatSheet({
      title: "Example: Photosynthesis",
      originalImageUrl: "https://placehold.co/600x400?text=Photosynthesis+Slide",
      ocrText: "Photosynthesis is the process by which green plants and some other organisms use sunlight to synthesize foods from carbon dioxide and water.",
      structuredContent: {
        title: "Photosynthesis Overview",
        sections: [
          {
            heading: "Definition",
            points: ["Process used by plants to convert light energy into chemical energy.", "Occurs in chloroplasts.", "Uses CO2 and H2O."]
          },
          {
            heading: "Key Components",
            points: ["Chlorophyll: Green pigment.", "Sunlight: Energy source.", "Water & Carbon Dioxide: Raw materials."]
          },
          {
            heading: "Equation",
            points: ["6CO2 + 6H2O + Light -> C6H12O6 + 6O2", "Reactants: Carbon dioxide, water, light.", "Products: Glucose, oxygen."]
          }
        ]
      }
    });
    console.log("Database seeded!");
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Ensure uploads directory exists
  if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads");
  }

  // Seed data
  seedDatabase();

  // Serve uploaded files statically (for preview if needed, though we might just use the path)
  app.use('/uploads', express.static('uploads'));

  app.post("/api/upload", upload.single("file"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const cheatSheet = await storage.createCheatSheet({
      title: req.file.originalname.replace(/\.[^/.]+$/, ""), // Remove extension
      originalImageUrl: fileUrl,
    });

    res.status(201).json({ 
      id: cheatSheet.id, 
      url: fileUrl, 
      filename: req.file.filename 
    });
  });

  app.post("/api/cheatsheets/:id/process", async (req, res) => {
    const id = parseInt(req.params.id);
    const cheatSheet = await storage.getCheatSheet(id);

    if (!cheatSheet) {
      return res.status(404).json({ message: "Cheat sheet not found" });
    }

    try {
      // Step 1: OCR
      const imagePath = path.join(process.cwd(), cheatSheet.originalImageUrl.substring(1)); // Remove leading slash
      const worker = await createWorker("eng");
      const { data: { text: ocrText } } = await worker.recognize(imagePath);
      await worker.terminate();

      // Step 2 & 3: LLM Structuring
      const prompt = `
        You are an expert student assistant. Your task is to summarize the following text extracted from a slide or note into a structured cheat sheet.
        
        Text:
        ${ocrText}
        
        Output strictly in JSON format with the following structure:
        {
          "title": "A concise title for the cheat sheet",
          "sections": [
            {
              "heading": "Section Heading (max 5 sections)",
              "points": ["Point 1", "Point 2", "Point 3"] (max 3 points per section)
            }
          ]
        }
        Do not include markdown formatting like \`\`\`json. Just return the JSON string.
      `;

      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });
      
      const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      const cleanJson = responseText.replace(/```json|```/g, "").trim();
      const structuredContent = JSON.parse(cleanJson);

      // Step 4: Update DB
      const updated = await storage.updateCheatSheet(id, {
        ocrText,
        structuredContent,
        // For Step 5 (Image Gen), we'll let the frontend render it for now 
        // as server-side rendering of complex layouts is heavy.
        // We can add a "imageUrl" later if we implement server-side canvas.
      });

      res.json(updated);

    } catch (error) {
      console.error("Processing error:", error);
      res.status(500).json({ message: "Failed to process cheat sheet" });
    }
  });

  app.get("/api/cheatsheets", async (req, res) => {
    const list = await storage.getAllCheatSheets();
    res.json(list);
  });

  app.get("/api/cheatsheets/:id", async (req, res) => {
    const item = await storage.getCheatSheet(parseInt(req.params.id));
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  });

  return httpServer;
}
