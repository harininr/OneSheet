import { generateWithGemini } from "./geminiService";
import { generateWithGroq } from "./groqService";

export type AITask =
  | "ocr"
  | "vision"
  | "cheatsheet"
  | "quiz"
  | "glossary"
  | "conceptmap"
  | "summary"
  | "domain";

export function getAIProvider(task: AITask): "gemini" | "groq" {
  const geminiTasks = ["ocr", "vision"];
  return geminiTasks.includes(task) ? "gemini" : "groq";
}

export async function routeAITask(
  task: AITask,
  prompt: string,
  imageData?: string,
  systemPrompt?: string,
  mimeType?: string
) {
  const provider = getAIProvider(task);
  console.log(`[AI Router] Task: ${task} → Provider: ${provider}`);

  if (provider === "gemini") {
    return await generateWithGemini(prompt, imageData, mimeType);
  } else {
    return await generateWithGroq(prompt, systemPrompt);
  }
}
