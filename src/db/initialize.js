const db = require("./index");
const { runMigration } = require("./migrations/001_initial_schema");

/**
 * Initialize the database
 * This function runs the migrations to set up the SQLite database
 */
function initializeDatabase() {
  console.log("Initializing database...");

  try {
    // Run the migration
    runMigration();
    console.log("Database initialization complete.");
    return true;
  } catch (error) {
    console.error("Error initializing database:", error);
    return false;
  }
}

// Initialize the database when this module is imported
let initialized = false;
try {
  initialized = initializeDatabase();
} catch (error) {
  console.error("Failed to initialize database:", error);
}

module.exports = {
  isInitialized: () => initialized,
  initializeDatabase,
};
