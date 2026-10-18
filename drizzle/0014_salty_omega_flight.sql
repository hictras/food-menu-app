ALTER TABLE `push_subscriptions` RENAME COLUMN "device_name" TO "phone_number";--> statement-breakpoint
DROP INDEX "push_subscriptions_endpoint_unique";--> statement-breakpoint
ALTER TABLE `push_subscriptions` ALTER COLUMN "phone_number" TO "phone_number" text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `push_subscriptions_endpoint_unique` ON `push_subscriptions` (`endpoint`);--> statement-breakpoint
ALTER TABLE `push_subscriptions` ADD `name` text;