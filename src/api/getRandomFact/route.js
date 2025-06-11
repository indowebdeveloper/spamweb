import { NextResponse } from "next/server";
import { supabase } from "../../db/supabase";

// Initialize the Supabase database
import "../../db/supabase-init";

// Default facts to use if the database doesn't have any
const DEFAULT_FACTS = [
  { fact: "SPAM stands for 'Spiced Ham'", emoji: "🍖" },
  { fact: "SPAM was first introduced in 1937", emoji: "📅" },
  { fact: "Over 8 billion cans of SPAM have been sold worldwide", emoji: "🌎" },
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
];

async function handler() {
  try {
    // First, check if the spam_facts table exists
    try {
      const { error } = await supabase.from("spam_facts").select("*").limit(1);

      if (error) {
        // Table doesn't exist, create it with default facts
        console.log("Creating spam_facts table with default facts");

        try {
          // Create the table
          await supabase.from("spam_facts").insert(DEFAULT_FACTS);
          console.log("Created spam_facts table successfully");
        } catch (createError) {
          console.warn("Error creating spam_facts table:", createError.message);
          // Return a random default fact
          const randomFact =
            DEFAULT_FACTS[Math.floor(Math.random() * DEFAULT_FACTS.length)];
          return randomFact;
        }
      }
    } catch (checkError) {
      console.warn("Error checking spam_facts table:", checkError.message);
      // Return a random default fact
      const randomFact =
        DEFAULT_FACTS[Math.floor(Math.random() * DEFAULT_FACTS.length)];
      return randomFact;
    }

    // Get a random fact from the database
    const { data, error } = await supabase
      .from("spam_facts")
      .select("fact, emoji")
      .order("id", { ascending: false })
      .limit(100);

    if (error || !data || data.length === 0) {
      console.warn(
        "Error or no facts found:",
        error?.message || "No facts found"
      );
      // Return a random default fact
      const randomFact =
        DEFAULT_FACTS[Math.floor(Math.random() * DEFAULT_FACTS.length)];
      return randomFact;
    }

    // Select a random fact from the results
    const randomIndex = Math.floor(Math.random() * data.length);
    return data[randomIndex];
  } catch (error) {
    console.error("Error fetching random fact:", error);
    // Return a random default fact as fallback
    const randomFact =
      DEFAULT_FACTS[Math.floor(Math.random() * DEFAULT_FACTS.length)];
    return randomFact;
  }
}

export async function POST(request) {
  const data = await handler(await request.json());
  return NextResponse.json(data);
}
