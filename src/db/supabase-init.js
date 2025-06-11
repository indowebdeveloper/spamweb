import { supabase } from "./supabase";

/**
 * This is a simplified module that just checks if the database is accessible
 * For full database initialization, use the separate script:
 * npm run db:init
 */

// Check if we can connect to the database
const checkDatabaseConnection = async () => {
  try {
    const { error } = await supabase.from("global_stats").select("id").limit(1);

    if (error) {
      console.warn(
        "Database connection check: Tables may not be initialized yet"
      );
      console.warn("Run 'npm run db:init' to initialize the database");
      return false;
    }

    return true;
  } catch (error) {
    console.warn("Database connection error:", error.message);
    return false;
  }
};

// Initialize the connection check when this module is imported
let initialized = false;

// Use a Promise-based approach instead of top-level await
const initPromise = checkDatabaseConnection()
  .then((result) => {
    initialized = result;
    return result;
  })
  .catch((error) => {
    console.error("Failed to check database connection:", error);
    return false;
  });

export default {
  isInitialized: () => initialized,
  checkDatabaseConnection,
  initPromise,
};
