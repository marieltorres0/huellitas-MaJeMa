-- Change Pet.species from PostgreSQL enum to plain text so new species can be configured from the UI.
ALTER TABLE "Pet"
  ALTER COLUMN "species" TYPE TEXT
  USING "species"::text;

DROP TYPE IF EXISTS "Species";
