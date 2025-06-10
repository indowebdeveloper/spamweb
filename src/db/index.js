const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

// Ensure the data directory exists
const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Database file path
const dbPath = path.join(dataDir, "spam_database.sqlite");

// Create and configure the database connection
const db = new Database(dbPath, { verbose: console.log });

// Enable foreign keys
db.pragma("foreign_keys = ON");

module.exports = db;
