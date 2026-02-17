import { db } from "./db";
import { cheatSheets, type InsertCheatSheet, type CheatSheet } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  createCheatSheet(data: InsertCheatSheet): Promise<CheatSheet>;
  getCheatSheet(id: number): Promise<CheatSheet | undefined>;
  getAllCheatSheets(): Promise<CheatSheet[]>;
  updateCheatSheet(id: number, data: Partial<CheatSheet>): Promise<CheatSheet>;
}

export class DatabaseStorage implements IStorage {
  async createCheatSheet(data: InsertCheatSheet): Promise<CheatSheet> {
    const [cheatSheet] = await db.insert(cheatSheets).values(data).returning();
    return cheatSheet;
  }

  async getCheatSheet(id: number): Promise<CheatSheet | undefined> {
    const [cheatSheet] = await db.select().from(cheatSheets).where(eq(cheatSheets.id, id));
    return cheatSheet;
  }

  async getAllCheatSheets(): Promise<CheatSheet[]> {
    return await db.select().from(cheatSheets).orderBy(desc(cheatSheets.createdAt));
  }

  async updateCheatSheet(id: number, data: Partial<CheatSheet>): Promise<CheatSheet> {
    const [updated] = await db.update(cheatSheets)
      .set(data)
      .where(eq(cheatSheets.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
