async function handler() {
  try {
    await sql.transaction([
      sql`DELETE FROM spam_clicks WHERE id = 10`,
      sql`DELETE FROM user_stats WHERE id = 10`,
      sql`DELETE FROM user_achievements WHERE id = 10`,
      sql`DELETE FROM daily_top_spammers WHERE id = 10`,
    ]);

    return { success: true };
  } catch (error) {
    return { error: "Failed to delete module 10" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}