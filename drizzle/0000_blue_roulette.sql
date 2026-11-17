CREATE TABLE `lesson_progress` (
	`user_id` text NOT NULL,
	`lesson` text NOT NULL,
	`path` text NOT NULL,
	`completed` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `lesson`)
);
