# OneSheet - Your AI Study Neural Canvas

**OneSheet** is a powerful AI-driven platform designed to transform your messy notes, slides, and textbooks into high-density, structured study materials. Whether it's a photo of your notebook or a lecture slide, OneSheet uses advanced AI to extract core concepts, build interactive concept maps, and generate exam-ready quizzes.

---

## 🚀 Key Features

### 1. Multi-Format Neural Input
- **Image OCR**: Upload photos of handwritten or printed notes.
- **Document Support**: Full support for **PDFs, Word Documents (.docx), and PowerPoint Slides (.pptx)**.
- **Direct Text Input**: Paste raw text directly for instant summarization.

### 2. Intelligent Study Components
- **Core Summary**: High-density summaries marked with critical exam points (★).
- **Dynamic Concept Maps**: Visualizing relationships between complex topics.
- **High-Fidelity Glossary**: Auto-generated key terms categorized by importance (Critical, Important, Supplementary).
- **Interactive Quizzes**: Test your knowledge with AI-generated multiple-choice questions.

### 3. "Ask AI" Global ChatBot
- Get instant clarifications on any topic using the integrated AI ChatBot.
- Accessible from any page for seamless doubt-solving.

### 4. Neural Dashboard
- Manage all your study packages in one place.
- Track processing status and easily delete outdated sheets.

### 5. Export & Offline Study
- Export your study sheets as high-quality **PDFs or PNGs** for offline revision.

---

## 🛠️ Technology Stack

- **Frontend**: React, Vite, Tailwind CSS, Framer Motion, Lucide Icons.
- **Backend**: Node.js, Express.
- **AI Orchestration**: 
  - **Google Gemini 1.5 Flash**: Handling vision, OCR, and document layout processing.
  - **Groq (Llama 3.3)**: Powering high-speed text generation, chat, and summarization.
- **Database**: Drizzle ORM with Neon (Serverless PostgreSQL).
- **Styling**: Premium "Professional Minimalism" design system.

---

## ⚙️ Setup & Installation

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v20 or higher)
- [PostgreSQL](https://www.postgresql.org/) (or a [Neon](https://neon.tech/) account)
- [Gemini API Key](https://aistudio.google.com/)
- [Groq API Key](https://console.groq.com/)

### 2. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/OneSheet.git
cd OneSheet
```

### 3. Environment Variables
Copy `.env.example` to `.env` and fill in your actual API keys and database URL:
```bash
cp .env.example .env
```

**Required Keys:**
- `GEMINI_API_KEY`: For OCR and document processing.
- `GROQ_API_KEY`: For AI Chat and text generation.
- `DATABASE_URL`: Connection string for your PostgreSQL database.

### 4. Install Dependencies
```bash
npm install
```

### 5. Start Development Server
```bash
npm run dev
```
The server will start (typically on `http://localhost:5000`), and the terminal will log the local network URL.

---

## 🛡️ Security Note
**NEVER** commit your `.env` file to GitHub. It contains private API keys and database credentials. The project is pre-configured with a `.gitignore` to prevent accidental uploads.

---
