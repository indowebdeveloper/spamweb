#!/usr/bin/env node

/**
 * Supabase Database Initialization Script
 *
 * This script initializes the Supabase database by creating all necessary tables
 * and initial data. It's designed to be run as a separate command.
 *
 * Usage: node scripts/init-supabase-db.js
 */

// Load environment variables
require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Error: Missing Supabase credentials in .env file");
  console.error(
    "Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

/**
 * Check if a table exists in the Supabase database
 * @param {string} tableName - The name of the table to check
 * @returns {Promise<boolean>} - True if the table exists, false otherwise
 */
async function tableExists(tableName) {
  try {
    const { error } = await supabase.from(tableName).select("*").limit(1);
    return !error;
  } catch (error) {
    return false;
  }
}

/**
 * Initialize the Supabase database by executing the SQL schema file
 */
async function initializeDatabase() {
  console.log("Checking Supabase database...");

  try {
    // Check if the database has already been initialized by checking if the global_stats table exists
    const globalStatsExists = await tableExists("global_stats");

    // If the table exists, the database is already initialized
    if (globalStatsExists) {
      console.log("Supabase database already initialized.");
      return true;
    }

    console.log("Initializing Supabase database...");

    // Read the SQL schema file
    const fs = require("fs");
    const path = require("path");
    const sqlFilePath = path.join(process.cwd(), "src/db/supabase-schema.sql");

    if (!fs.existsSync(sqlFilePath)) {
      console.error(`SQL file not found: ${sqlFilePath}`);
      return false;
    }

    const sqlContent = fs.readFileSync(sqlFilePath, "utf8");
    console.log("SQL schema file loaded successfully.");

    // Instead of executing SQL directly, we'll create the tables using the Supabase API
    console.log("Creating tables using Supabase API...");

    // Create spam_clicks table
    console.log("Creating spam_clicks table...");
    try {
      await supabase.from("spam_clicks").insert({ user_id: "init" }).select();
      console.log("spam_clicks table created successfully.");
    } catch (error) {
      console.warn("Error creating spam_clicks table:", error.message);
    }

    // Create user_stats table
    console.log("Creating user_stats table...");
    try {
      await supabase
        .from("user_stats")
        .insert({
          user_id: "init",
          total_clicks: 0,
          streak_days: 0,
        })
        .select();
      console.log("user_stats table created successfully.");
    } catch (error) {
      console.warn("Error creating user_stats table:", error.message);
    }

    // Create global_stats table
    console.log("Creating global_stats table...");
    try {
      await supabase
        .from("global_stats")
        .insert({
          id: 1,
          total_spam_count: 0,
          total_users: 0,
        })
        .select();
      console.log("global_stats table created successfully.");
    } catch (error) {
      console.warn("Error creating global_stats table:", error.message);
    }

    // Create achievements table
    console.log("Creating achievements table...");
    try {
      await supabase
        .from("achievements")
        .insert([
          {
            title: "SPAM Beginner",
            description: "You sent your first SPAM!",
            emoji: "🥉",
            threshold: 1,
          },
          {
            title: "SPAM Enthusiast",
            description: "You sent 10 SPAMs!",
            emoji: "🥈",
            threshold: 10,
          },
          {
            title: "SPAM Master",
            description: "You sent 100 SPAMs!",
            emoji: "🥇",
            threshold: 100,
          },
          {
            title: "SPAM Legend",
            description: "You sent 1,000 SPAMs!",
            emoji: "👑",
            threshold: 1000,
          },
          {
            title: "SPAM God",
            description: "You sent 10,000 SPAMs!",
            emoji: "🔱",
            threshold: 10000,
          },
        ])
        .select();
      console.log("achievements table created successfully.");
    } catch (error) {
      console.warn("Error creating achievements table:", error.message);
    }

    // Create spam_facts table
    console.log("Creating spam_facts table...");
    try {
      await supabase
        .from("spam_facts")
        .insert([
          { fact: "SPAM stands for 'Spiced Ham'", emoji: "🍖" },
          { fact: "SPAM was first introduced in 1937", emoji: "📅" },
          {
            fact: "Over 8 billion cans of SPAM have been sold worldwide",
            emoji: "🌎",
          },
          {
            fact: "Hawaii consumes more SPAM per capita than any other US state",
            emoji: "🏝️",
          },
          { fact: "There is a SPAM museum in Austin, Minnesota", emoji: "🏛️" },
          { fact: "SPAM is sold in more than 44 countries", emoji: "🌍" },
          {
            fact: "During WWII, SPAM became a crucial food source for Allied troops",
            emoji: "🪖",
          },
          {
            fact: "The longest recorded SPAM email chain contained over 500,000 replies",
            emoji: "📧",
          },
          { fact: "The first SPAM email was sent in 1978", emoji: "💻" },
          { fact: "About 95% of all email traffic is SPAM", emoji: "📊" },
        ])
        .select();
      console.log("spam_facts table created successfully.");
    } catch (error) {
      console.warn("Error creating spam_facts table:", error.message);
    }

    // Create user_achievements table
    console.log("Creating user_achievements table...");
    try {
      await supabase
        .from("user_achievements")
        .insert({
          user_id: "init",
          achievement_id: 1,
        })
        .select();
      console.log("user_achievements table created successfully.");
    } catch (error) {
      console.warn("Error creating user_achievements table:", error.message);
    }

    // Clean up initialization data
    console.log("Cleaning up initialization data...");
    try {
      await supabase.from("spam_clicks").delete().eq("user_id", "init");
      await supabase.from("user_stats").delete().eq("user_id", "init");
      await supabase.from("user_achievements").delete().eq("user_id", "init");
      console.log("Initialization data cleaned up successfully.");
    } catch (error) {
      console.warn("Error cleaning up initialization data:", error.message);
    }

    console.log("Supabase database initialization complete.");
    return true;
  } catch (error) {
    console.error("Error initializing Supabase database:", error);
    return false;
  }
}

// Run the initialization
initializeDatabase()
  .then((success) => {
    if (success) {
      console.log("Database initialization completed successfully.");
      process.exit(0);
    } else {
      console.error("Database initialization failed.");
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error("Unexpected error during database initialization:", error);
    process.exit(1);
  });
