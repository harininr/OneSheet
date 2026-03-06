CREATE TABLE "cheat_sheets" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text DEFAULT 'Untitled Cheat Sheet' NOT NULL,
	"original_image_url" text DEFAULT 'text-input' NOT NULL,
	"ocr_text" text,
	"structured_content" jsonb,
	"image_url" text,
	"created_at" timestamp DEFAULT now()
);
