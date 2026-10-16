CREATE TABLE `ingredients` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`recipe_id` integer NOT NULL,
	`name` text NOT NULL,
	`amount` text,
	`unit` text,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `instructions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`recipe_id` integer NOT NULL,
	`step_number` integer NOT NULL,
	`text` text NOT NULL,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `recipes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`prep_time` integer NOT NULL,
	`cook_time` integer NOT NULL,
	`servings` integer NOT NULL,
	`cuisine` text,
	`dietary_tags` text,
	`image_url` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
