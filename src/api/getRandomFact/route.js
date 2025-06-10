import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

async function handler() {
  try {
    const result = await sql`
      SELECT fact, emoji 
      FROM spam_facts 
      ORDER BY RANDOM() 
      LIMIT 1
    `;

    if (result.rows.length === 0) {
      return { fact: null, emoji: null };
    }

    return result.rows[0];
  } catch (error) {
    console.error("Error fetching random fact:", error);
    return { error: "Failed to fetch random fact" };
  }
}

export async function POST(request) {
  const data = await handler(await request.json());
  return NextResponse.json(data);
}
