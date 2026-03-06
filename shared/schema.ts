import { pgTable, text, serial, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export type Domain = "general" | "cs" | "math" | "biology" | "law";
export type Layout = "grid" | "boxed" | "column";
export type PointType =
  | "definition"
  | "formula"
  | "algorithm"
  | "case"
  | "advantage"
  | "warning"
  | "fact"
  | "default";

export interface StructuredPoint {
  text: string;
  type: PointType;
  starred?: boolean;    // ⭐ exam priority
}

export interface StructuredSection {
  heading: string;
  points: StructuredPoint[];
  relationship?: string; // e.g. "AI → Machine Learning → Deep Learning"
}

export interface StructuredMetrics {
  originalWordCount: number;
  compressedWordCount: number;
  reductionPercent: number;
  sectionCount: number;
  conceptCount: number;
  starredCount: number;
}

// ── Concept Map Types ─────────────────────────────────────────────────────────
export interface ConceptNode {
  id: string;
  label: string;
  group: string;        // section heading it belongs to
  importance: "high" | "medium" | "low";
}

export interface ConceptEdge {
  from: string;
  to: string;
  label: string;        // relationship label like "uses", "extends", "part of"
}

export interface ConceptMap {
  nodes: ConceptNode[];
  edges: ConceptEdge[];
}

// ── Key Terms Types ───────────────────────────────────────────────────────────
export interface KeyTerm {
  term: string;
  definition: string;
  importance: "critical" | "important" | "supplementary";
  relatedTerms?: string[];
}

// ── Quiz Types ────────────────────────────────────────────────────────────────
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  relatedSection: string;
}

export interface Quiz {
  questions: QuizQuestion[];
  totalPoints: number;
}

export interface StructuredContent {
  title: string;
  domain: Domain;
  layout: Layout;
  sections: StructuredSection[];
  metrics: StructuredMetrics;
  conceptMap?: ConceptMap;
  keyTerms?: KeyTerm[];
  quiz?: Quiz;
}

export const cheatSheets = pgTable("cheat_sheets", {
  id: serial("id").primaryKey(),
  title: text("title").notNull().default("Untitled Cheat Sheet"),
  originalImageUrl: text("original_image_url").notNull().default("text-input"),
  ocrText: text("ocr_text"),
  structuredContent: jsonb("structured_content").$type<StructuredContent>(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCheatSheetSchema = createInsertSchema(cheatSheets).omit({
  id: true,
  createdAt: true,
  structuredContent: true,
  imageUrl: true
});

export type CheatSheet = typeof cheatSheets.$inferSelect;
export type InsertCheatSheet = z.infer<typeof insertCheatSheetSchema>;
