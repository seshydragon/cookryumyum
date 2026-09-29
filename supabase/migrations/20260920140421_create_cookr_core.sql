CREATE TABLE "badges" (
	"id" serial PRIMARY KEY,
	"user_id" integer NOT NULL,
	"badge_slug" text NOT NULL,
	"earned_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "challenge_entries" (
	"id" serial PRIMARY KEY,
	"user_id" integer NOT NULL,
	"challenge_slug" text NOT NULL,
	"recipe_slug" text NOT NULL,
	"photo_key" text NOT NULL,
	"caption" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cook_logs" (
	"id" serial PRIMARY KEY,
	"user_id" integer NOT NULL,
	"recipe_slug" text NOT NULL,
	"cuisine" text NOT NULL,
	"protein" integer DEFAULT 0 NOT NULL,
	"cooked_on" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entry_votes" (
	"id" serial PRIMARY KEY,
	"entry_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipe_ratings" (
	"id" serial PRIMARY KEY,
	"user_id" integer NOT NULL,
	"recipe_slug" text NOT NULL,
	"stars" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY,
	"token_digest" text NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"display_name" text NOT NULL,
	"avatar" text DEFAULT 'ember' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "xp_events" (
	"id" serial PRIMARY KEY,
	"user_id" integer NOT NULL,
	"amount" integer NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "badges_user_badge_key" ON "badges" ("user_id","badge_slug");--> statement-breakpoint
CREATE INDEX "challenge_entries_challenge_idx" ON "challenge_entries" ("challenge_slug");--> statement-breakpoint
CREATE UNIQUE INDEX "challenge_entries_user_challenge_key" ON "challenge_entries" ("user_id","challenge_slug");--> statement-breakpoint
CREATE INDEX "cook_logs_user_id_idx" ON "cook_logs" ("user_id");--> statement-breakpoint
CREATE INDEX "cook_logs_recipe_slug_idx" ON "cook_logs" ("recipe_slug");--> statement-breakpoint
CREATE UNIQUE INDEX "entry_votes_entry_user_key" ON "entry_votes" ("entry_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "recipe_ratings_user_recipe_key" ON "recipe_ratings" ("user_id","recipe_slug");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_digest_key" ON "sessions" ("token_digest");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_key" ON "users" ("email");--> statement-breakpoint
CREATE INDEX "xp_events_user_id_idx" ON "xp_events" ("user_id");--> statement-breakpoint
ALTER TABLE "badges" ADD CONSTRAINT "badges_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "challenge_entries" ADD CONSTRAINT "challenge_entries_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "cook_logs" ADD CONSTRAINT "cook_logs_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "entry_votes" ADD CONSTRAINT "entry_votes_entry_id_challenge_entries_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "challenge_entries"("id");--> statement-breakpoint
ALTER TABLE "entry_votes" ADD CONSTRAINT "entry_votes_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "recipe_ratings" ADD CONSTRAINT "recipe_ratings_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "xp_events" ADD CONSTRAINT "xp_events_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");