import { preprocessText } from '../server/services/ocrService';

const rawText = `
Photosynthesis   is the 
process

Photosynthesis   is the 
process by which green plants
use sunlight!! to synthesize foods @#$
from CO2 and H2O.
`;

console.log("--- Testing Preprocessing ---");
const cleaned = preprocessText(rawText);
console.log("Original Length:", rawText.length);
console.log("Cleaned Length:", cleaned.length);
console.log("Cleaned Output:\n", cleaned);

if (cleaned.includes("Photosynthesis is the process") && !cleaned.includes("@#$")) {
  console.log("\n✅ Preprocessing Test Passed!");
} else {
  console.error("\n❌ Preprocessing Test Failed!");
}
