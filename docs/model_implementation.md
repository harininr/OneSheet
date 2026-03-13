# Model Implementation

This document describes the data architecture and models used in the OneSheet project.

## Database Schema

The project uses **Drizzle ORM** with a **PostgreSQL** database. The schema is defined in `shared/schema.ts`.

### Tables

#### 1. `cheat_sheets`
Stores the generated study materials and their associated metadata.
- `id`: Serial Primary Key.
- `title`: String (default: "Untitled Cheat Sheet").
- `original_image_url`: String (path to the uploaded image or "text-input").
- `ocr_text`: Raw text extracted via AI/OCR.
- `structured_content`: JSONB field containing the rich study data (see below).
- `image_url`: URL for the generated visual preview.
- `created_at`: Timestamp.

#### 2. `conversations`
Manages chat threads for the AI study assistant.
- `id`: Serial Primary Key.
- `title`: String.
- `created_at`: Timestamp.

#### 3. `messages`
Stores individual messages within a conversation.
- `id`: Serial Primary Key.
- `conversation_id`: Foreign Key referencing `conversations.id`.
- `role`: "user" | "assistant".
- `content`: Message text.
- `created_at`: Timestamp.

---

## Data Interfaces

The core of the application is the `StructuredContent` interface, which defines how a cheat sheet is organized.

### `StructuredContent`
```typescript
interface StructuredContent {
  title: string;
  domain: Domain; // "general" | "cs" | "math" | "biology" | "law"
  layout: Layout; // "grid" | "boxed" | "column"
  sections: StructuredSection[];
  metrics: StructuredMetrics;
  conceptMap?: ConceptMap;
  keyTerms?: KeyTerm[];
  quiz?: Quiz;
}
```

### Key Components

- **`StructuredSection`**: A thematic group of study points.
  - `heading`: Section title.
  - `points`: Array of `StructuredPoint` (text, type, starred).
  - `relationship`: Optional string describing flow (e.g., "A → B").

- **`PointType`**: Categorizes information for specialized rendering.
  - Types: `definition`, `formula`, `algorithm`, `case`, `advantage`, `warning`, `fact`.

- **`StructuredMetrics`**: Quantitative data about the content.
  - Word counts, reduction percentages, and counts for concepts/starred items.

- **`ConceptMap`**: Graph-based data for visualize relationships.
  - `nodes`: `id`, `label`, `importance`.
  - `edges`: `from`, `to`, `label`.

- **`Quiz`**: Interactive testing data.
  - `questions`: `question`, `options`, `correctIndex`, `explanation`, `difficulty`.

---

## Validation Schemas

We use **Zod** to ensure data integrity during API requests and database insertions.

- `insertCheatSheetSchema`: Validates data when creating a new sheet.
- `insertConversationSchema`: Validates new chat threads.
- `insertMessageSchema`: Validates individual chat messages.
- `StructuredContent` (JSONB): While stored as JSON, the server-side logic (e.g., `normaliseContent` in `geminiService.ts`) ensures the structure conforms to the TypeScript interfaces.
