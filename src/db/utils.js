const db = require("./index");

/**
 * Database utility functions for the SPAM application
 */
const dbUtils = {
  /**
   * Record spam clicks for a user
   * @param {string} userId - The user ID
   * @param {number} clickCount - Number of clicks to record (default: 1)
   * @returns {Object} Result object with user stats, global stats, leaderboard position, and new achievements
   */
  recordSpamClicks: function (userId, clickCount = 1) {
    if (!userId) {
      throw new Error("User ID is required");
    }

    // Ensure clickCount is a valid number and at least 1
    const clicks = Math.max(1, parseInt(clickCount) || 1);

    try {
      // Run all operations in a transaction
      return db.transaction(() => {
        const today = new Date().toISOString().split("T")[0];

        // Record clicks - insert multiple rows based on clickCount
        const insertClick = db.prepare(
          "INSERT INTO spam_clicks (user_id) VALUES (?)"
        );
        for (let i = 0; i < clicks; i++) {
          insertClick.run(userId);
        }

        // Update or create user stats with the click count
        const upsertUserStats = db.prepare(`
          INSERT INTO user_stats (user_id, total_clicks, streak_days, last_click_date)
          VALUES (?, ?, 1, ?)
          ON CONFLICT(user_id) DO UPDATE SET
            total_clicks = total_clicks + ?,
            streak_days = CASE
              WHEN last_click_date = ? THEN streak_days
              WHEN last_click_date = date(?, '-1 day') THEN streak_days + 1
              ELSE 1
            END,
            last_click_date = ?,
            updated_at = CURRENT_TIMESTAMP
          RETURNING *
        `);

        const userStats = upsertUserStats.get(
          userId,
          clicks,
          today,
          clicks,
          today,
          today,
          today
        );

        // Get global stats
        const globalStats = db
          .prepare(
            `
          SELECT total_spam_count, total_users
          FROM global_stats
          WHERE id = 1
        `
          )
          .get();

        // Get leaderboard position
        const leaderboardPosition = db
          .prepare(
            `
          WITH user_clicks AS (
            SELECT user_id, COUNT(*) as click_count,
                   RANK() OVER (ORDER BY COUNT(*) DESC) as rank
            FROM spam_clicks
            GROUP BY user_id
          )
          SELECT rank as leaderboard_position
          FROM user_clicks
          WHERE user_id = ?
        `
          )
          .get(userId);

        // Check for new achievements
        const userClickCount = db
          .prepare(
            `
          SELECT COUNT(*) as total_clicks
          FROM spam_clicks
          WHERE user_id = ?
        `
          )
          .get(userId);

        const newAchievements = db
          .prepare(
            `
          WITH user_achievements_list AS (
            SELECT achievement_id
            FROM user_achievements
            WHERE user_id = ?
          )
          SELECT a.*
          FROM achievements a
          LEFT JOIN user_achievements_list ua ON ua.achievement_id = a.id
          WHERE a.threshold <= ? AND ua.achievement_id IS NULL
        `
          )
          .all(userId, userClickCount.total_clicks);

        // Insert new achievements
        if (newAchievements.length > 0) {
          const insertAchievement = db.prepare(`
            INSERT INTO user_achievements (user_id, achievement_id)
            VALUES (?, ?)
          `);

          for (const achievement of newAchievements) {
            insertAchievement.run(userId, achievement.id);
          }
        }

        return {
          userStats: userStats || { total_clicks: 0, streak_days: 0 },
          globalStats: globalStats || { total_spam_count: 0, total_users: 0 },
          leaderboardPosition:
            leaderboardPosition?.leaderboard_position || null,
          newAchievements: newAchievements || [],
        };
      })();
    } catch (error) {
      console.error("Error recording spam clicks:", error);
      throw error;
    }
  },

  /**
   * Get user statistics
   * @param {string} userId - The user ID
   * @returns {Object} User stats, achievements, global stats, and leaderboard position
   */
  getUserStats: function (userId) {
    if (!userId) {
      throw new Error("User ID is required");
    }

    try {
      // Run all queries in a transaction to ensure consistency
      return db.transaction(() => {
        // Get user stats with null check
        const userStats = db
          .prepare(
            `
          SELECT 
            COALESCE(total_clicks, 0) as total_clicks, 
            COALESCE(streak_days, 0) as streak_days, 
            last_click_date
          FROM user_stats
          WHERE user_id = ?
        `
          )
          .get(userId) || {
          total_clicks: 0,
          streak_days: 0,
          last_click_date: null,
        };

        // Get user achievements
        const achievements =
          db
            .prepare(
              `
          SELECT a.*
          FROM achievements a
          JOIN user_achievements ua ON ua.achievement_id = a.id
          WHERE ua.user_id = ?
          ORDER BY a.threshold DESC
        `
            )
            .all(userId) || [];

        // Get global stats with default values
        const globalStats = db
          .prepare(
            `
          SELECT 
            COALESCE(total_spam_count, 0) as total_spam_count, 
            COALESCE(total_users, 0) as total_users
          FROM global_stats
          WHERE id = 1
        `
          )
          .get() || { total_spam_count: 0, total_users: 0 };

        // Get user's leaderboard position with error handling
        const leaderboardPosition = db
          .prepare(
            `
          WITH user_clicks AS (
            SELECT user_id, COUNT(*) as click_count,
                   RANK() OVER (ORDER BY COUNT(*) DESC) as rank
            FROM spam_clicks
            GROUP BY user_id
          )
          SELECT rank as leaderboard_position
          FROM user_clicks
          WHERE user_id = ?
        `
          )
          .get(userId);

        return {
          userStats,
          achievements,
          globalStats,
          leaderboardPosition:
            leaderboardPosition?.leaderboard_position || null,
        };
      })();
    } catch (error) {
      console.error("Error getting user stats:", error);
      throw error;
    }
  },
};

module.exports = dbUtils;
