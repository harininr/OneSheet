import { type InsertCheatSheet, type CheatSheet } from "@shared/schema";
import { IStorage } from "./storage";

export class MemoryStorage implements IStorage {
    private cheatSheets: CheatSheet[] = [];
    private nextId = 1;

    async createCheatSheet(data: InsertCheatSheet): Promise<CheatSheet> {
        const cheatSheet: CheatSheet = {
            id: this.nextId++,
            title: data.title ?? "Untitled Cheat Sheet",
            originalImageUrl: data.originalImageUrl ?? "text-input",
            ocrText: (data as any).ocrText ?? null,
            structuredContent: null,
            imageUrl: null,
            createdAt: new Date(),
        };
        this.cheatSheets.push(cheatSheet);
        return cheatSheet;
    }

    async getCheatSheet(id: number): Promise<CheatSheet | undefined> {
        return this.cheatSheets.find((cs) => cs.id === id);
    }

    async getAllCheatSheets(): Promise<CheatSheet[]> {
        return [...this.cheatSheets].sort(
            (a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)
        );
    }

    async updateCheatSheet(id: number, data: Partial<CheatSheet>): Promise<CheatSheet> {
        const index = this.cheatSheets.findIndex((cs) => cs.id === id);
        if (index === -1) throw new Error(`CheatSheet ${id} not found`);
        this.cheatSheets[index] = { ...this.cheatSheets[index], ...data };
        return this.cheatSheets[index];
    }

    async deleteCheatSheet(id: number): Promise<void> {
        const index = this.cheatSheets.findIndex((cs) => cs.id === id);
        if (index !== -1) {
            this.cheatSheets.splice(index, 1);
        }
    }
}
