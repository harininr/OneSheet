import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const cheatSheets = pgTable("cheat_sheets", {
  id: serial("id").primaryKey(),
  title: text("title").notNull().default("Untitled Cheat Sheet"),
  originalImageUrl: text("original_image_url").notNull(),
  ocrText: text("ocr_text"),
  structuredContent: jsonb("structured_content").$type<{
    title: string;
    sections:Array<{
      heading: string;
      points: string[];
    }>;
  }>(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCheatSheetSchema = createInsertSchema(cheatSheets).omit({ 
  id: true, 
  createdAt: true,
  ocrText: true,
  structuredContent: true,
  imageUrl: true 
});

export type CheatSheet = typeof cheatSheets.$inferSelect;
export type InsertCheatSheet = z.infer<typeof insertCheatSheetSchema>;
