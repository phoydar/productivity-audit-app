CREATE TABLE `daily_log` (
	`id` text PRIMARY KEY NOT NULL,
	`log_date` text NOT NULL,
	`summary` text,
	`observations` text,
	`total_deep_work` real DEFAULT 0 NOT NULL,
	`total_shallow_work` real DEFAULT 0 NOT NULL,
	`total_meetings` real DEFAULT 0 NOT NULL,
	`total_interruptions` real DEFAULT 0 NOT NULL,
	`total_personal_misc` real DEFAULT 0 NOT NULL,
	`is_reconstructed` integer DEFAULT false NOT NULL,
	`generated_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `daily_log_log_date_unique` ON `daily_log` (`log_date`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_daily_log_date` ON `daily_log` (`log_date`);--> statement-breakpoint
CREATE TABLE `entry_tag` (
	`entry_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`entry_id`, `tag_id`)
);
--> statement-breakpoint
CREATE INDEX `idx_entry_tag_entry` ON `entry_tag` (`entry_id`);--> statement-breakpoint
CREATE INDEX `idx_entry_tag_tag` ON `entry_tag` (`tag_id`);--> statement-breakpoint
CREATE TABLE `insight` (
	`id` text PRIMARY KEY NOT NULL,
	`insight_date` text NOT NULL,
	`type` text NOT NULL,
	`message` text NOT NULL,
	`severity` text NOT NULL,
	`metadata` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_insight_date` ON `insight` (`insight_date`);--> statement-breakpoint
CREATE TABLE `log_entry` (
	`id` text PRIMARY KEY NOT NULL,
	`daily_log_id` text NOT NULL,
	`task` text NOT NULL,
	`outcome` text NOT NULL,
	`duration_minutes` integer NOT NULL,
	`category` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_reconstructed` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_entry_daily_log` ON `log_entry` (`daily_log_id`);--> statement-breakpoint
CREATE INDEX `idx_entry_category` ON `log_entry` (`category`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tag` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tag_name_unique` ON `tag` (`name`);--> statement-breakpoint
CREATE TABLE `todo` (
	`id` text PRIMARY KEY NOT NULL,
	`task` text NOT NULL,
	`category` text NOT NULL,
	`estimated_minutes` integer NOT NULL,
	`priority` integer DEFAULT 0 NOT NULL,
	`tags` text,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`completed_at` text,
	`log_entry_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_todo_status` ON `todo` (`status`);--> statement-breakpoint
CREATE INDEX `idx_todo_created` ON `todo` (`created_at`);