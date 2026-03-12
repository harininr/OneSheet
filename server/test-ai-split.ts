import { getAIProvider, routeAITask } from "../server/services/aiRouter";

async function testSplit() {
  console.log("--- AI Split Verification ---");

  const tasks: any[] = ["ocr", "vision", "cheatsheet", "quiz", "glossary", "conceptmap", "summary", "domain"];

  tasks.forEach(task => {
    const provider = getAIProvider(task);
    console.log(`Task: ${task.padEnd(12)} -> Provider: ${provider}`);
  });

  console.log("\n--- Logic Test ---");
  console.log("Verifying OCR routes to Gemini...");
  if (getAIProvider("ocr") !== "gemini") throw new Error("OCR should route to Gemini");

  console.log("Verifying Cheatsheet routes to Groq...");
  if (getAIProvider("cheatsheet") !== "groq") throw new Error("Cheatsheet should route to Groq");

  console.log("\n✅ AI Provider routing logic is correct.");
}

testSplit().catch(console.error);
