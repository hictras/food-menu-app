ALTER TABLE `game_stats` ADD `stats` text DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE `game_stats` ADD `updated_at` text DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `game_stats` DROP COLUMN `last_score`;--> statement-breakpoint
ALTER TABLE `game_stats` DROP COLUMN `best_score`;--> statement-breakpoint
ALTER TABLE `game_stats` DROP COLUMN `last_played`;--> statement-breakpoint
ALTER TABLE `game_stats` DROP COLUMN `plays_count`;--> statement-breakpoint
ALTER TABLE `recipes` ADD `latest_image_url` text;--> statement-breakpoint
ALTER TABLE `recipes` ADD `use_latest_image` integer DEFAULT false;