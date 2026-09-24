ALTER TABLE hr_records ADD COLUMN IF NOT EXISTS profile jsonb;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS hr_weekly_tasks (
 id serial PRIMARY KEY, user_id integer NOT NULL REFERENCES users(id), request_id varchar(36) NOT NULL UNIQUE,
 day integer NOT NULL CHECK(day BETWEEN 0 AND 6), start_minute integer NOT NULL CHECK(start_minute BETWEEN 0 AND 1439),
 end_minute integer NOT NULL CHECK(end_minute BETWEEN 1 AND 1440), title varchar(255) NOT NULL,
 cancelled boolean NOT NULL DEFAULT false, created_by integer NOT NULL, created_at timestamp NOT NULL DEFAULT now(),
 CHECK(end_minute > start_minute)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS hr_weekly_tasks_user_day ON hr_weekly_tasks(user_id,day);
