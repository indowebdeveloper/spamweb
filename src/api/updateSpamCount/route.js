import { NextResponse } from "next/server";
import dbUtils from "../../db/utils";

// Initialize the database by running migrations
import "../../db/run-migrations";

async function handler(requestData) {
  const { userId, clickCount = 1 } = requestData;

  if (!userId) {
    return {
      error: "User ID is required",
      userStats: { total_clicks: 0, streak_days: 0 },
      globalStats: { total_spam_count: 0, total_users: 0 },
      leaderboardPosition: null,
      newAchievements: [],
    };
  }

  try {
    // Use the database utility function to record spam clicks
    const result = dbUtils.recordSpamClicks(userId, clickCount);

    return {
      userStats: result.userStats,
      globalStats: result.globalStats,
      leaderboardPosition: result.leaderboardPosition,
      newAchievements: result.newAchievements,
    };
  } catch (error) {
    console.error("Error updating spam count:", error);
    return {
      error: "Failed to update spam count. Please try again!",
      userStats: { total_clicks: 0, streak_days: 0 },
      globalStats: { total_spam_count: 0, total_users: 0 },
      leaderboardPosition: null,
      newAchievements: [],
    };
  }
}

export async function POST(request) {
  const data = await handler(await request.json());
  return NextResponse.json(data);
}
