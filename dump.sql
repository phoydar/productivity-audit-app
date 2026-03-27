PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE `entry_tag` (
	`entry_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`entry_id`, `tag_id`)
);
CREATE TABLE `insight` (
	`id` text PRIMARY KEY NOT NULL,
	`insight_date` text NOT NULL,
	`type` text NOT NULL,
	`message` text NOT NULL,
	`severity` text NOT NULL,
	`metadata` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
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
INSERT INTO log_entry VALUES('glwsuhogxd4aect7n7tpmbi0','hxsl1tcjdapxdj2zim5on4qd','Fetched UPS fee data for Kyle Henningson','He was able to see the cost of some returns for one of his customers',30,'INTERRUPTION',0,0,'2026-03-26 20:21:49','2026-03-26 20:21:49');
INSERT INTO log_entry VALUES('ynbhhklk9sc3nce6f1kzkvry','hxsl1tcjdapxdj2zim5on4qd','[Meeting] Switch flow overview with Brian','He showed me how to use the Submit Point app in Switch and we got it mostly set up.',45,'DEEP_WORK',1,0,'2026-03-26 20:25:36','2026-03-26 20:25:36');
INSERT INTO log_entry VALUES('ceyvm0z52bo6fld299k1vw6k','hxsl1tcjdapxdj2zim5on4qd','Pulled 3P account number data for Jake','GovDocs raised a concern about Costco''s 3P shipping account number and I cross referenced their shipments to make sure they were going through on the 3P # as expected.',60,'DEEP_WORK',2,0,'2026-03-26 20:26:58','2026-03-26 20:26:58');
INSERT INTO log_entry VALUES('q92mmyzg2oftbjpwl9vbci7f','hxsl1tcjdapxdj2zim5on4qd','[Manual Task] GovDocs Update File','Downloaded logos and loaded to S3 and moved file to Automation',15,'SHALLOW_WORK',3,0,'2026-03-26 22:05:11','2026-03-26 22:05:11');
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
CREATE TABLE `tag` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
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
INSERT INTO todo VALUES('xwd5ksdb0g0chvq2ru9gwxas','GovDocs Update','DEEP_WORK',60,1,NULL,'PENDING',NULL,NULL,'2026-03-26 22:04:08','2026-03-26 22:04:08');
CREATE TABLE IF NOT EXISTS "daily_log" (
	`id` text PRIMARY KEY NOT NULL,
	`log_date` text NOT NULL,
	`summary` text,
	`observations` text,
	`total_deep_work` real DEFAULT 0 NOT NULL,
	`total_shallow_work` real DEFAULT 0 NOT NULL,
	`total_interruptions` real DEFAULT 0 NOT NULL,
	`total_personal_misc` real DEFAULT 0 NOT NULL,
	`is_reconstructed` integer DEFAULT false NOT NULL,
	`generated_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
INSERT INTO daily_log VALUES('hxsl1tcjdapxdj2zim5on4qd','2026-03-26',NULL,NULL,1.75,0.25,0.5,0.0,0,NULL,'2026-03-26 20:21:49','2026-03-26T22:05:11.867Z');
CREATE INDEX `idx_entry_tag_entry` ON `entry_tag` (`entry_id`);
CREATE INDEX `idx_entry_tag_tag` ON `entry_tag` (`tag_id`);
CREATE INDEX `idx_insight_date` ON `insight` (`insight_date`);
CREATE INDEX `idx_entry_daily_log` ON `log_entry` (`daily_log_id`);
CREATE INDEX `idx_entry_category` ON `log_entry` (`category`);
CREATE UNIQUE INDEX `tag_name_unique` ON `tag` (`name`);
CREATE INDEX `idx_todo_status` ON `todo` (`status`);
CREATE INDEX `idx_todo_created` ON `todo` (`created_at`);
CREATE UNIQUE INDEX `daily_log_log_date_unique` ON `daily_log` (`log_date`);
CREATE UNIQUE INDEX `idx_daily_log_date` ON `daily_log` (`log_date`);
COMMIT;
