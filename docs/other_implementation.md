# Other Implementation

This document covers the business logic, external integrations, and service layer of the OneSheet project.

## AI Service Layer

The application leverages multiple AI providers to handle different tasks efficiently.

### 1. `OcrService` (`server/services/ocrService.ts`)
- **Primary Role**: Local text extraction and normalization.
- **Engine**: `tesseract.js` (LTM model).
- **Key Functions**:
  - `extractTextWithTesseract`: Performs local OCR on uploaded images/PDFs.
  - `preprocessText`: Cleans raw output by normalizing whitespace, removing redundant lines, and stripping OCR artifacts.

### 2. `GeminiService` (`server/services/geminiService.ts`)
- **Primary Role**: Vision fallback and high-fidelity extraction.
- **Model**: `gemini-1.5-flash`.
- **Key Functions**:
  - `generateWithGemini`: Processes images (base64) along with text prompts. Acts as a fallback if Tesseract returns low-confidence results.
  - `parseAIResponse`: A robust parser that handles common AI formatting issues.
  - `normaliseContent`: Sanitizes the AI's JSON output.

### 3. `GroqService` (`server/services/groqService.ts`)
- **Primary Role**: High-speed text processing.
- **Model**: `llama-3.3-70b-versatile`.
- **Key Functions**:
  - `generateWithGroq`: Used for text-to-text transformations when performance/speed is a priority.

### 3. `AIRouter` (`server/services/aiRouter.ts`)
- Acts as a dispatcher to select the appropriate AI provider based on the task requirement (e.g., vision vs. text-only).

---

## Prompt Engineering (`server/services/prompts.ts`)

The system uses a sophisticated prompt architecture to drive high-quality study materials.

- **`SYSTEM_PROMPTS`**: Defines specialized personas (Expert Study Creator, Quiz Creator, Glossary Expert, etc.).
- **`DOMAIN_INSTRUCTIONS`**: Provides task-specific constraints for different subjects (CS, Math, Biology, Law, General).
- **`VISION_PROMPT`**: Optimized for "Academic AI" performance, specifically instructing the model to capture handwritten notes, diagrams, and formulas.
- **`COMPREHENSIVE_PROMPT`**: A dynamic function that injects domain rules and universal formatting requirements (JSON structure, 4-8 sections, MCQs) into a single master request.

---

## Storage Layer (`server/storage.ts`)

The project implements a **Repository Pattern** to abstract the data layer from the business logic.

- **`Storage` Interface**: Defines operations for cheat sheets, conversations, and messages.
- **`DatabaseStorage`**: Implementation using Drizzle ORM to interact with PostgreSQL.
- **`MemoryStorage`**: (Legacy/Development) In-memory implementation for testing without a database.

---

## System Components

### 6.1 Input Handling Module
The system supports dual-input pipelines:
- **Image/Document Input**: Handled via `multer` in [routes.ts](file:///d:/Gen-AI/OneSheet/OneSheet/server/routes.ts). Files are saved to the `uploads/` directory and routed to the `OcrService` for local Tesseract processing (with Gemini fallback).
- **Direct Text Input**: Forwarded directly to the **Text Preprocessing Module** in `ocrService.ts` before being passed to the LLM for structuring.

### 6.2 Layout Generation Engine
Unlike traditional static layouts, OneSheet uses a **Dynamic React Layout Engine**. The AI (Groq/Gemini) generates structured JSON that defines sections and relationships. The React frontend (`client/src/components/A4Preview.tsx`) then programmatically organizes this content into:
- **Grid Layouts**: High-density information blocks.
- **Boxed Layouts**: Emphasized conceptual boundaries.
- **Column Layouts**: Sequential flow for processes and algorithms.

### 6.3 Rendering Module
OneSheet bypasses backend image processing (like PIL) in favor of **Client-Side Neural Rendering**. This ensures that the final output matches exactly what the student sees on screen.
- **Engine**: React DOM with Tailwind CSS.
- **Visuals**: Programmatic placement of headings, bullet points, and concept maps using Framer Motion for micro-animations and SVG for concept maps.

### 6.4 Output Generation
The final cheat sheet is exported as a downloadable file using a specialized export pipeline:
- **PNG Export**: Uses `html2canvas` to rasterize the live preview into a high-quality image.
- **PDF Export**: Uses `jspdf` to package the rasterized canvas into a standard A4-sized document.
- **Neural Dashboard**: Allows users to manage, view, and share their generated packages.
