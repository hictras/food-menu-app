CREATE TABLE `notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`url` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
