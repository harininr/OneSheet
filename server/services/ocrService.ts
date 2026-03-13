import { createWorker } from 'tesseract.js';
import path from 'path';
import fs from 'fs';

/**
 * Text Preprocessing Module
 * Cleans and normalizes text extracted via OCR.
 */
export function preprocessText(rawText: string): string {
  if (!rawText) return "";

  return rawText
    // 1. Normalize line breaks and whitespace
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    
    // 2. Remove redundant duplicate lines (common in OCR artifacts)
    .split("\n")
    .map(line => line.trim())
    .filter((line, index, self) => line !== "" && (index === 0 || line !== self[index - 1]))
    
    // 3. Strip non-standard noise characters (common in bad OCR)
    // Preserving alphanumeric, common punctuation, and basic math symbols
    .map(line => line.replace(/[^\w\s.,!?;:()'"\-+*/=%$€★]/g, ""))
    
    // 4. Basic sentence joining (joining lines that don't end in punctuation)
    .reduce((acc: string[], curr: string) => {
      if (acc.length > 0 && !/[.!?:]$/.test(acc[acc.length - 1]) && curr.length > 0) {
        acc[acc.length - 1] = acc[acc.length - 1] + " " + curr;
      } else {
        acc.push(curr);
      }
      return acc;
    }, [])
    .join("\n")
    .trim();
}

/**
 * OCR Service
 * Primary engine for local text extraction.
 */
export async function extractTextWithTesseract(imagePath: string): Promise<string> {
  console.log(`[OCR Service] Starting Tesseract extraction for: ${path.basename(imagePath)}`);
  
  const worker = await createWorker('eng');
  
  try {
    const { data: { text, confidence } } = await worker.recognize(imagePath);
    console.log(`[OCR Service] Extraction complete. Confidence: ${confidence}%`);
    
    // We consider it a "failure" if confidence is extremely low (< 20%) or text is empty
    if (!text || text.trim().length < 10 || confidence < 20) {
      console.warn(`[OCR Service] Low confidence or empty result. Triggering fallback.`);
      return "";
    }

    const cleanedText = preprocessText(text);
    return cleanedText;
  } catch (error) {
    console.error(`[OCR Service] Tesseract error:`, error);
    return "";
  } finally {
    await worker.terminate();
  }
}
