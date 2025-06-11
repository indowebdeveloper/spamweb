import { NextResponse } from "next/server";
import supabaseUtils from "../../db/supabase-utils";

// Initialize the Supabase database
import "../../db/supabase-init";

async function handler({ userId }) {
  if (!userId) {
    return {
      error: "User ID is required",
      userStats: { total_clicks: 0, streak_days: 0, last_click_date: null },
      achievements: [],
      globalStats: { total_spam_count: 0, total_users: 0 },
      leaderboardPosition: null,
    };
  }

  try {
    // Use the Supabase database utility function to get user stats
    const result = await supabaseUtils.getUserStats(userId);

    return {
      userStats: result.userStats,
      achievements: result.achievements,
      globalStats: result.globalStats,
      leaderboardPosition: result.leaderboardPosition,
    };
  } catch (error) {
    console.error("Database error in getUserStats:", error);
    return {
      error: "Failed to fetch user stats. Please try again later.",
      userStats: { total_clicks: 0, streak_days: 0, last_click_date: null },
      achievements: [],
      globalStats: { total_spam_count: 0, total_users: 0 },
      leaderboardPosition: null,
    };
  }
}

export async function POST(request) {
  const data = await handler(await request.json());
  return NextResponse.json(data);
}
