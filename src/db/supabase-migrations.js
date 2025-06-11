import { supabase } from "./supabase";

/**
 * Run migrations to set up the Supabase database schema
 */
export async function runMigrations() {
  console.log("Running Supabase migrations...");

  try {
    // Create spam_clicks table
    await supabase.rpc("create_table_if_not_exists", {
      table_name: "spam_clicks",
      table_definition: `
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      `,
    });

    // Create user_stats table
    await supabase.rpc("create_table_if_not_exists", {
      table_name: "user_stats",
      table_definition: `
        id SERIAL PRIMARY KEY,
        user_id TEXT UNIQUE NOT NULL,
        total_clicks INTEGER DEFAULT 0,
        streak_days INTEGER DEFAULT 0,
        last_click_date TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      `,
    });

    // Create global_stats table
    await supabase.rpc("create_table_if_not_exists", {
      table_name: "global_stats",
      table_definition: `
        id SERIAL PRIMARY KEY,
        total_spam_count INTEGER DEFAULT 0,
        total_users INTEGER DEFAULT 0,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      `,
    });

    // Create achievements table
    await supabase.rpc("create_table_if_not_exists", {
      table_name: "achievements",
      table_definition: `
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        emoji TEXT NOT NULL,
        threshold INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      `,
    });

    // Create user_achievements table
    await supabase.rpc("create_table_if_not_exists", {
      table_name: "user_achievements",
      table_definition: `
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        achievement_id INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, achievement_id)
      `,
    });

    // Create functions and triggers

    // Function to update global stats on spam click
    await supabase.rpc("create_function_if_not_exists", {
      function_name: "update_global_stats_on_spam_click",
      function_definition: `
        BEGIN
          UPDATE global_stats 
          SET 
            total_spam_count = total_spam_count + 1,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = 1;
          RETURN NEW;
        END;
      `,
      function_parameters: "",
      function_returns: "TRIGGER",
    });

    // Trigger for insert on spam_clicks
    await supabase.rpc("create_trigger_if_not_exists", {
      trigger_name: "update_global_stats_on_insert",
      table_name: "spam_clicks",
      function_name: "update_global_stats_on_spam_click",
      trigger_timing: "AFTER INSERT",
      trigger_for: "EACH ROW",
    });

    // Function to update global users on user_stats insert
    await supabase.rpc("create_function_if_not_exists", {
      function_name: "update_global_users_on_user_stats_insert",
      function_definition: `
        BEGIN
          UPDATE global_stats 
          SET 
            total_users = total_users + 1,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = 1;
          RETURN NEW;
        END;
      `,
      function_parameters: "",
      function_returns: "TRIGGER",
    });

    // Trigger for insert on user_stats
    await supabase.rpc("create_trigger_if_not_exists", {
      trigger_name: "update_global_users_on_insert",
      table_name: "user_stats",
      function_name: "update_global_users_on_user_stats_insert",
      trigger_timing: "AFTER INSERT",
      trigger_for: "EACH ROW",
    });

    // Insert initial global stats record if it doesn't exist
    const { data: globalStatsCount } = await supabase
      .from("global_stats")
      .select("count(*)", { count: "exact" });

    if (globalStatsCount === 0) {
      await supabase
        .from("global_stats")
        .insert({ id: 1, total_spam_count: 0, total_users: 0 });
    }

    // Insert default achievements if they don't exist
    const { data: achievementsCount } = await supabase
      .from("achievements")
      .select("count(*)", { count: "exact" });

    if (achievementsCount === 0) {
      const achievements = [
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
      ];

      await supabase.from("achievements").insert(achievements);
    }

    console.log("Supabase migrations completed successfully.");
    return true;
  } catch (error) {
    console.error("Error running Supabase migrations:", error);
    return false;
  }
}

// Export a function to initialize the database
export async function initializeSupabaseDatabase() {
  console.log("Initializing Supabase database...");

  try {
    // Run the migrations
    const success = await runMigrations();

    if (success) {
      console.log("Supabase database initialization complete.");
      return true;
    } else {
      console.error("Failed to initialize Supabase database.");
      return false;
    }
  } catch (error) {
    console.error("Error initializing Supabase database:", error);
    return false;
  }
}
