// Test the handwritten notes upload with Gemini Vision
import fs from "fs";
import path from "path";

async function main() {
    const imagePath = path.resolve("test_handwritten.png");
    if (!fs.existsSync(imagePath)) {
        console.error("test_handwritten.png not found");
        process.exit(1);
    }

    // Step 1: Upload the image
    const formData = new FormData();
    const imageBuffer = fs.readFileSync(imagePath);
    const blob = new Blob([imageBuffer], { type: "image/png" });
    formData.append("file", blob, "handwritten_notes.png");

    console.log("Step 1: Uploading image...");
    const uploadRes = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        body: formData,
    });

    if (!uploadRes.ok) {
        console.error("Upload failed:", await uploadRes.text());
        return;
    }

    const { id } = await uploadRes.json();
    console.log(`Uploaded! Sheet ID: ${id}`);

    // Step 2: Process with Gemini Vision
    console.log("Step 2: Processing with AI Vision (this may take 30-60 seconds)...");
    const processRes = await fetch(`http://localhost:5000/api/cheatsheets/${id}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: "general", layout: "grid" }),
    });

    if (!processRes.ok) {
        const errText = await processRes.text();
        console.error("Processing failed:", errText);
        return;
    }

    const result = await processRes.json();
    const sc = result.structuredContent;

    console.log("\n═══════════════════════════════════════");
    console.log("✅ HANDWRITTEN NOTES PROCESSING COMPLETE!");
    console.log("═══════════════════════════════════════");
    console.log("Title:", sc?.title);
    console.log("Sections:", sc?.sections?.length);
    console.log("Total points:", sc?.sections?.reduce((a, s) => a + s.points.length, 0));
    console.log("Concept Map:", sc?.conceptMap?.nodes?.length || 0, "nodes,", sc?.conceptMap?.edges?.length || 0, "edges");
    console.log("Key Terms:", sc?.keyTerms?.length || 0);
    console.log("Quiz Questions:", sc?.quiz?.questions?.length || 0);
    console.log("\nExtracted Text (first 500 chars):");
    console.log(result.ocrText?.substring(0, 500) || "[none]");
    console.log("\n🔗 View at: http://localhost:5000/cheatsheet/" + id);
}

main().catch(console.error);
