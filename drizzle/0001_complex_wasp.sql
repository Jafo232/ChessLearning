CREATE TABLE `saved_games` (
	`user_id` text PRIMARY KEY NOT NULL,
	`state` text NOT NULL,
	`updated_at` integer NOT NULL
);
