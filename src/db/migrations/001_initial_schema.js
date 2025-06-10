const db = require("../index");

function runMigration() {
  console.log("Running initial schema migration...");

  // Run all migrations in a transaction
  db.transaction(() => {
    // Create spam_clicks table
    db.exec(`
      CREATE TABLE IF NOT EXISTS spam_clicks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create user_stats table
    db.exec(`
      CREATE TABLE IF NOT EXISTS user_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT UNIQUE NOT NULL,
        total_clicks INTEGER DEFAULT 0,
        streak_days INTEGER DEFAULT 0,
        last_click_date TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create global_stats table
    db.exec(`
      CREATE TABLE IF NOT EXISTS global_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        total_spam_count INTEGER DEFAULT 0,
        total_users INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert initial global stats record if it doesn't exist
    const globalStatsCount = db
      .prepare("SELECT COUNT(*) as count FROM global_stats")
      .get();
    if (globalStatsCount.count === 0) {
      db.prepare(
        "INSERT INTO global_stats (id, total_spam_count, total_users) VALUES (1, 0, 0)"
      ).run();
    }

    // Create achievements table
    db.exec(`
      CREATE TABLE IF NOT EXISTS achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        emoji TEXT NOT NULL,
        threshold INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create user_achievements table
    db.exec(`
      CREATE TABLE IF NOT EXISTS user_achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        achievement_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (achievement_id) REFERENCES achievements (id),
        UNIQUE(user_id, achievement_id)
      )
    `);

    // Create triggers to update global stats

    // Trigger for insert on spam_clicks
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS update_global_stats_on_insert
      AFTER INSERT ON spam_clicks
      BEGIN
        UPDATE global_stats 
        SET 
          total_spam_count = total_spam_count + 1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = 1;
      END
    `);

    // Trigger for insert on user_stats (new user)
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS update_global_users_on_insert
      AFTER INSERT ON user_stats
      BEGIN
        UPDATE global_stats 
        SET 
          total_users = total_users + 1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = 1;
      END
    `);

    // Insert some default achievements if they don't exist
    const achievementsCount = db
      .prepare("SELECT COUNT(*) as count FROM achievements")
      .get();
    if (achievementsCount.count === 0) {
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

      const insertAchievement = db.prepare(`
        INSERT INTO achievements (title, description, emoji, threshold)
        VALUES (@title, @description, @emoji, @threshold)
      `);

      for (const achievement of achievements) {
        insertAchievement.run(achievement);
      }
    }
  })();

  console.log("Initial schema migration completed successfully.");
}

// Export the migration function
module.exports = { runMigration };

// Run the migration if this file is executed directly
if (require.main === module) {
  runMigration();
}
