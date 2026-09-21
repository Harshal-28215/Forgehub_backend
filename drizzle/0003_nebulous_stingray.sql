ALTER TABLE "users" ALTER COLUMN "avatar_url" SET DATA TYPE varchar(500);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "avatar_url" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified_at" timestamp with time zone;