import Groq from "groq-sdk";
import { generateWithGemini } from "./geminiService";

let groqClient: Groq | null = null;

function getGroqClient() {
  if (!groqClient) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not set.");
    }
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

export async function generateWithGroq(
  prompt: string,
  systemPrompt?: string,
  fallbackToGemini: boolean = true
): Promise<string> {
  try {
    const groq = getGroqClient();
    const messages: any[] = [];

    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    messages.push({ role: "user", content: prompt });

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      max_tokens: 4000,
      temperature: 0.3,
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    console.warn("Groq failed, falling back to Gemini:", error);
    if (fallbackToGemini) {
      return await generateWithGemini(prompt);
    }
    throw error;
  }
}

export async function chatWithGroq(
  message: string,
  history: { role: "user" | "assistant"; content: string }[] = [],
  systemPrompt: string = "You are a helpful study assistant for OneSheet. Answer student questions clearly and concisely."
): Promise<string> {
  try {
    const groq = getGroqClient();
    const messages = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: message }
    ];

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: messages as any,
      max_tokens: 1000,
      temperature: 0.7,
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    console.error("Groq chat failed:", error);
    throw error;
  }
}
