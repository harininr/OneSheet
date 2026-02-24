import { db } from "./db";
import { cheatSheets, type InsertCheatSheet, type CheatSheet } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
    async createCheatSheet(data: InsertCheatSheet): Promise<CheatSheet> {
        const [cheatSheet] = await db.insert(cheatSheets).values(data as any).returning();
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

    async deleteCheatSheet(id: number): Promise<void> {
        await db.delete(cheatSheets).where(eq(cheatSheets.id, id));
    }
}
