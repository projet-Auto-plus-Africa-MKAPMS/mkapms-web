ALTER TABLE in_media_productions DROP CONSTRAINT IF EXISTS in_media_productions_operation_check;
--> statement-breakpoint
ALTER TABLE in_media_productions ADD CONSTRAINT in_media_productions_operation_check CHECK(operation IN ('image','voix','transcription'));
--> statement-breakpoint
ALTER TABLE in_media_productions DROP CONSTRAINT IF EXISTS in_media_productions_mime_check;
--> statement-breakpoint
ALTER TABLE in_media_productions ADD CONSTRAINT in_media_productions_mime_check CHECK(mime IN ('image/png','audio/mpeg','text/plain'));
