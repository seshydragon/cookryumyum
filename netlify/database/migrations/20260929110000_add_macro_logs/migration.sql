CREATE TABLE IF NOT EXISTS "macro_logs" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "logged_on" date NOT NULL,
  "title" text NOT NULL,
  "calories" integer DEFAULT 0 NOT NULL,
  "protein" integer DEFAULT 0 NOT NULL,
  "carbs" integer DEFAULT 0 NOT NULL,
  "fat" integer DEFAULT 0 NOT NULL,
  "items" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "notes" text DEFAULT '' NOT NULL,
  "source" text DEFAULT 'photo' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "macro_logs_user_date_idx" ON "macro_logs" ("user_id","logged_on","created_at");
