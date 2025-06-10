const path = require("path");
const fs = require("fs");

// Get all migration files
const migrationsDir = path.join(__dirname, "migrations");
const migrationFiles = fs
  .readdirSync(migrationsDir)
  .filter((file) => file.endsWith(".js"))
  .sort(); // Sort to ensure migrations run in order

console.log("Running migrations...");

// Run each migration
migrationFiles.forEach((file) => {
  const migrationPath = path.join(migrationsDir, file);
  console.log(`Running migration: ${file}`);

  try {
    const migration = require(migrationPath);
    if (typeof migration.runMigration === "function") {
      migration.runMigration();
    } else {
      console.warn(
        `Warning: Migration ${file} does not export a runMigration function.`
      );
    }
  } catch (error) {
    console.error(`Error running migration ${file}:`, error);
    process.exit(1);
  }
});

console.log("All migrations completed successfully.");
