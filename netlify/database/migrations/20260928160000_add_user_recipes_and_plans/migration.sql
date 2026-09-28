CREATE TABLE IF NOT EXISTS "user_recipes" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "slug" text NOT NULL,
  "title" text NOT NULL,
  "description" text DEFAULT '' NOT NULL,
  "category" text NOT NULL,
  "cuisine" text NOT NULL,
  "difficulty" text NOT NULL,
  "servings" integer DEFAULT 2 NOT NULL,
  "prep_time" integer DEFAULT 0 NOT NULL,
  "cook_time" integer DEFAULT 0 NOT NULL,
  "ingredients" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "instructions" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "user_recipes_slug_key" UNIQUE("slug")
);
CREATE INDEX IF NOT EXISTS "user_recipes_user_id_idx" ON "user_recipes" ("user_id");

CREATE TABLE IF NOT EXISTS "recipe_favorites" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "recipe_slug" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "recipe_favorites_user_recipe_key" UNIQUE("user_id","recipe_slug")
);

CREATE TABLE IF NOT EXISTS "meal_plan_items" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "day" text NOT NULL,
  "position" integer DEFAULT 0 NOT NULL,
  "recipe_slug" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "meal_plan_items_user_day_idx" ON "meal_plan_items" ("user_id","day");
