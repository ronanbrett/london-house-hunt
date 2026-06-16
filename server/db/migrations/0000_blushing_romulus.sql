CREATE TABLE `app_meta` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text
);
--> statement-breakpoint
CREATE TABLE `commute_results` (
	`id` text PRIMARY KEY NOT NULL,
	`property_id` text NOT NULL,
	`destination_id` text NOT NULL,
	`minutes` integer,
	`changes` integer,
	`legs_json` text,
	`fetched_at` integer NOT NULL,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`destination_id`) REFERENCES `destinations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `comparables` (
	`id` text PRIMARY KEY NOT NULL,
	`property_id` text NOT NULL,
	`geo_level` text,
	`sample_size` integer,
	`median_ppsf` real,
	`iqr_low` real,
	`iqr_high` real,
	`fair_value` integer,
	`fair_value_low` integer,
	`fair_value_high` integer,
	`delta_pct` real,
	`verdict` text,
	`comps_json` text,
	`hpi_adjusted` integer DEFAULT false,
	`computed_at` integer NOT NULL,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `destinations` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`lat` real,
	`lng` real,
	`mode` text DEFAULT 'transit' NOT NULL,
	`importance` integer DEFAULT 3 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `enrichment_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`property_id` text NOT NULL,
	`source` text NOT NULL,
	`cache_key` text,
	`status` text NOT NULL,
	`match_confidence` real,
	`raw_json` text,
	`derived_json` text,
	`fetched_at` integer NOT NULL,
	`ttl_days` integer,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `enr_prop_source_fetched_idx` ON `enrichment_snapshots` (`property_id`,`source`,`fetched_at`);--> statement-breakpoint
CREATE TABLE `nearest_stations` (
	`id` text PRIMARY KEY NOT NULL,
	`property_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text,
	`distance_miles` real,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `notes` (
	`id` text PRIMARY KEY NOT NULL,
	`property_id` text NOT NULL,
	`body` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `profile_weights` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`metric_key` text NOT NULL,
	`weight` real DEFAULT 5 NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `profile_metric_uq` ON `profile_weights` (`profile_id`,`metric_key`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	`scoring_mode` text DEFAULT 'absolute' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `properties` (
	`id` text PRIMARY KEY NOT NULL,
	`source` text NOT NULL,
	`source_url` text,
	`source_id` text,
	`raw_payload` text,
	`status` text DEFAULT 'active' NOT NULL,
	`display_address` text,
	`postcode` text,
	`postcode_sector` text,
	`postcode_district` text,
	`lat` real,
	`lng` real,
	`uprn` text,
	`price` integer,
	`price_qualifier` text,
	`property_type` text,
	`tenure` text,
	`lease_years_remaining` integer,
	`service_charge_annual` integer,
	`ground_rent_annual` integer,
	`beds` integer,
	`baths` integer,
	`receptions` integer,
	`floor_area_sqft` real,
	`epc_current` text,
	`epc_potential` text,
	`council_tax_band` text,
	`description` text,
	`agent_name` text,
	`first_listed_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `property_media` (
	`id` text PRIMARY KEY NOT NULL,
	`property_id` text NOT NULL,
	`kind` text NOT NULL,
	`url` text NOT NULL,
	`caption` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `property_tags` (
	`property_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`property_id`, `tag_id`),
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `rent_estimates` (
	`id` text PRIMARY KEY NOT NULL,
	`property_id` text NOT NULL,
	`monthly_rent` integer,
	`source` text NOT NULL,
	`low` integer,
	`high` integer,
	`computed_at` integer NOT NULL,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `scores` (
	`id` text PRIMARY KEY NOT NULL,
	`property_id` text NOT NULL,
	`profile_id` text NOT NULL,
	`mode` text NOT NULL,
	`total` real,
	`confidence` real,
	`contributions_json` text,
	`computed_at` integer NOT NULL,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (`name`);