import { type InsertCheatSheet, type CheatSheet } from "@shared/schema";

export interface IStorage {
  createCheatSheet(data: InsertCheatSheet): Promise<CheatSheet>;
  getCheatSheet(id: number): Promise<CheatSheet | undefined>;
  getAllCheatSheets(): Promise<CheatSheet[]>;
  updateCheatSheet(id: number, data: Partial<CheatSheet>): Promise<CheatSheet>;
  deleteCheatSheet(id: number): Promise<void>;
}

let storage: IStorage;

if (process.env.DATABASE_URL) {
  // Use PostgreSQL storage
  const { DatabaseStorage } = await import("./dbStorage");
  storage = new DatabaseStorage();
} else {
  // Fallback to in-memory storage (no database required)
  console.log("⚠️  No DATABASE_URL set. Using in-memory storage (data will not persist across restarts).");
  const { MemoryStorage } = await import("./memoryStorage");
  storage = new MemoryStorage();
}

export { storage };
