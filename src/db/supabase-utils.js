import { supabase } from "./supabase";

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
 * Ensure the database is initialized before performing operations
 * This is a soft check that won't throw errors
 * @returns {Promise<boolean>} - True if the database is initialized, false otherwise
 */
async function ensureDatabaseInitialized() {
  try {
    // Check if essential tables exist
    const tablesExist = await Promise.all([
      tableExists("spam_clicks"),
      tableExists("user_stats"),
      tableExists("global_stats"),
      tableExists("achievements"),
      tableExists("user_achievements"),
    ]);

    // If any table doesn't exist, the database is not fully initialized
    if (tablesExist.includes(false)) {
      console.warn("Database not fully initialized. Some tables are missing.");
      return false;
    }

    return true;
  } catch (error) {
    console.warn("Error checking database initialization:", error);
    return false;
  }
}

/**
 * Database utility functions for the SPAM application using Supabase
 */
const supabaseUtils = {
  /**
   * Record spam clicks for a user
   * @param {string} userId - The user ID
   * @param {number} clickCount - Number of clicks to record (default: 1)
   * @returns {Object} Result object with user stats, global stats, leaderboard position, and new achievements
   */
  recordSpamClicks: async function (userId, clickCount = 1) {
    if (!userId) {
      throw new Error("User ID is required");
    }

    // Ensure clickCount is a valid number and at least 1
    const clicks = Math.max(1, parseInt(clickCount) || 1);
    const today = new Date().toISOString().split("T")[0];

    try {
      // Check database initialization but don't throw errors
      await ensureDatabaseInitialized();

      // Start a transaction
      let userStats = null;
      let globalStats = null;
      let leaderboardPosition = null;
      let newAchievements = [];

      // 1. Record clicks - insert multiple rows based on clickCount
      try {
        const clicksToInsert = Array(clicks).fill({ user_id: userId });
        await supabase.from("spam_clicks").insert(clicksToInsert);
        console.log(`Recorded ${clicks} clicks for user ${userId}`);
      } catch (error) {
        console.error("Error recording clicks:", error.message);
        // Continue with the rest of the function even if this fails
      }

      // 2. Update global stats
      try {
        // Get current global stats
        const { data: currentGlobalStats } = await supabase
          .from("global_stats")
          .select("*")
          .eq("id", 1)
          .single();

        if (currentGlobalStats) {
          // Update global stats
          const { data: updatedGlobalStats } = await supabase
            .from("global_stats")
            .update({
              total_spam_count: currentGlobalStats.total_spam_count + clicks,
              updated_at: new Date().toISOString(),
            })
            .eq("id", 1)
            .select()
            .single();

          globalStats = updatedGlobalStats;
        } else {
          // Create global stats if they don't exist
          const { data: newGlobalStats } = await supabase
            .from("global_stats")
            .insert({
              id: 1,
              total_spam_count: clicks,
              total_users: 1,
            })
            .select()
            .single();

          globalStats = newGlobalStats;
        }
      } catch (error) {
        console.error("Error updating global stats:", error.message);
        // Continue with the rest of the function even if this fails
      }

      // 3. Update user stats
      try {
        // Check if user exists
        const { data: existingUser } = await supabase
          .from("user_stats")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (existingUser) {
          // Update existing user stats
          let newStreakDays = existingUser.streak_days;

          // Calculate streak
          if (existingUser.last_click_date === today) {
            // Same day, streak unchanged
            newStreakDays = existingUser.streak_days;
          } else {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split("T")[0];

            if (existingUser.last_click_date === yesterdayStr) {
              // Consecutive day, increase streak
              newStreakDays = existingUser.streak_days + 1;
            } else {
              // Non-consecutive day, reset streak
              newStreakDays = 1;
            }
          }

          // Update user stats
          const { data: updatedStats } = await supabase
            .from("user_stats")
            .update({
              total_clicks: existingUser.total_clicks + clicks,
              streak_days: newStreakDays,
              last_click_date: today,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId)
            .select()
            .single();

          userStats = updatedStats;

          // No need to update global total_users since user already exists
        } else {
          // Create new user stats
          const { data: newStats } = await supabase
            .from("user_stats")
            .insert({
              user_id: userId,
              total_clicks: clicks,
              streak_days: 1,
              last_click_date: today,
            })
            .select()
            .single();

          userStats = newStats;

          // Update global total_users since this is a new user
          try {
            await supabase
              .from("global_stats")
              .update({
                total_users: globalStats ? globalStats.total_users + 1 : 1,
                updated_at: new Date().toISOString(),
              })
              .eq("id", 1);
          } catch (error) {
            console.warn("Error updating global total_users:", error.message);
          }
        }
      } catch (error) {
        console.error("Error updating user stats:", error.message);
        // Continue with the rest of the function even if this fails
      }

      // 4. Get leaderboard position
      try {
        // Count total clicks per user and order by count
        const { data: userRanks } = await supabase
          .from("user_stats")
          .select("user_id, total_clicks")
          .order("total_clicks", { ascending: false });

        if (userRanks && userRanks.length > 0) {
          // Find the position of the current user
          const position = userRanks.findIndex(
            (user) => user.user_id === userId
          );
          leaderboardPosition = position >= 0 ? position + 1 : null;
        }
      } catch (error) {
        console.error("Error calculating leaderboard position:", error.message);
        // Continue with the rest of the function even if this fails
      }

      // 5. Process achievements
      try {
        // Get user's total clicks
        const { count: userClickCount } = await supabase
          .from("spam_clicks")
          .select("*", { count: "exact" })
          .eq("user_id", userId);

        // Get user's existing achievements
        const { data: existingAchievements } = await supabase
          .from("user_achievements")
          .select("achievement_id")
          .eq("user_id", userId);

        // Get all achievements
        const { data: allAchievements } = await supabase
          .from("achievements")
          .select("*")
          .order("threshold", { ascending: true });

        if (allAchievements && allAchievements.length > 0) {
          const existingIds = existingAchievements
            ? existingAchievements.map((a) => a.achievement_id)
            : [];

          // Find eligible achievements that the user doesn't already have
          const eligible = allAchievements.filter(
            (achievement) =>
              achievement.threshold <= userClickCount &&
              !existingIds.includes(achievement.id)
          );

          // Insert new achievements
          if (eligible.length > 0) {
            const newUserAchievements = eligible.map((achievement) => ({
              user_id: userId,
              achievement_id: achievement.id,
            }));

            await supabase
              .from("user_achievements")
              .insert(newUserAchievements);

            newAchievements = eligible;
          }
        }
      } catch (error) {
        console.error("Error processing achievements:", error.message);
        // Continue with the rest of the function even if this fails
      }

      // Return the results
      return {
        userStats: userStats || { total_clicks: 0, streak_days: 0 },
        globalStats: globalStats || { total_spam_count: 0, total_users: 0 },
        leaderboardPosition: leaderboardPosition,
        newAchievements: newAchievements,
      };
    } catch (error) {
      console.error("Error recording spam clicks:", error);
      // Return default values instead of throwing
      return {
        userStats: { total_clicks: 0, streak_days: 0 },
        globalStats: { total_spam_count: 0, total_users: 0 },
        leaderboardPosition: null,
        newAchievements: [],
      };
    }
  },

  /**
   * Get user statistics
   * @param {string} userId - The user ID
   * @returns {Object} User stats, achievements, global stats, and leaderboard position
   */
  getUserStats: async function (userId) {
    if (!userId) {
      throw new Error("User ID is required");
    }

    try {
      // Check database initialization but don't throw errors
      await ensureDatabaseInitialized();

      let userStats = null;
      let userAchievements = [];
      let globalStats = null;
      let leaderboardPosition = null;

      // 1. Get user stats
      try {
        const { data } = await supabase
          .from("user_stats")
          .select("total_clicks, streak_days, last_click_date")
          .eq("user_id", userId)
          .maybeSingle();

        userStats = data;
      } catch (error) {
        console.error("Error getting user stats:", error.message);
        // Continue with the rest of the function even if this fails
      }

      // 2. Get user achievements
      try {
        // Join user_achievements and achievements tables
        const { data } = await supabase
          .from("user_achievements")
          .select(
            `
            achievement_id,
            achievements:achievements(
              id, title, description, emoji, threshold
            )
          `
          )
          .eq("user_id", userId);

        if (data && data.length > 0) {
          // Extract the achievement details from the joined data
          userAchievements = data
            .map((item) => item.achievements)
            .filter(Boolean)
            .sort((a, b) => b.threshold - a.threshold);
        }
      } catch (error) {
        console.error("Error getting user achievements:", error.message);
        // Continue with empty achievements
      }

      // 3. Get global stats
      try {
        const { data } = await supabase
          .from("global_stats")
          .select("total_spam_count, total_users")
          .eq("id", 1)
          .maybeSingle();

        globalStats = data;
      } catch (error) {
        console.error("Error getting global stats:", error.message);
        // Continue with the rest of the function even if this fails
      }

      // 4. Get leaderboard position
      try {
        // Count total clicks per user and order by count
        const { data: userRanks } = await supabase
          .from("user_stats")
          .select("user_id, total_clicks")
          .order("total_clicks", { ascending: false });

        if (userRanks && userRanks.length > 0) {
          // Find the position of the current user
          const position = userRanks.findIndex(
            (user) => user.user_id === userId
          );
          leaderboardPosition = position >= 0 ? position + 1 : null;
        }
      } catch (error) {
        console.error("Error calculating leaderboard position:", error.message);
        // Continue with the rest of the function even if this fails
      }

      return {
        userStats: userStats || {
          total_clicks: 0,
          streak_days: 0,
          last_click_date: null,
        },
        achievements: userAchievements || [],
        globalStats: globalStats || { total_spam_count: 0, total_users: 0 },
        leaderboardPosition: leaderboardPosition,
      };
    } catch (error) {
      console.error("Error getting user stats:", error);
      // Return default values instead of throwing
      return {
        userStats: { total_clicks: 0, streak_days: 0, last_click_date: null },
        achievements: [],
        globalStats: { total_spam_count: 0, total_users: 0 },
        leaderboardPosition: null,
      };
    }
  },
};

export default supabaseUtils;
