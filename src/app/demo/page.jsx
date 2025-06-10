"use client";
import React from "react";

function MainComponent() {
  const [spamCount, setSpamCount] = React.useState(0);
  const [streak, setStreak] = React.useState(0);
  const [error, setError] = React.useState(null);
  const [userId, setUserId] = React.useState(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    let storedId = localStorage.getItem("demoUserId");
    if (!storedId) {
      storedId = `demo-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("demoUserId", storedId);
    }
    setUserId(storedId);
  }, []);

  const handleSpamClick = async () => {
    if (!userId) return;
    try {
      const response = await fetch("/api/updateSpamCount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setSpamCount(data.userStats.total_clicks);
      setStreak(data.userStats.streak_days);
    } catch (err) {
      console.error("Error:", err);
      setError("Failed to update spam count");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0039A6] to-[#002366] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <img
            src="https://ucarecdn.com/7f8c1f29-65fb-4158-b799-7c1185c3c535/-/format/auto/"
            alt="SPAM COIN"
            className="w-32 h-32 mx-auto mb-6"
          />
          <h1 className="text-4xl font-bold text-[#FFCC00] mb-4">
            Try SPAM COIN!
          </h1>
          <p className="text-white text-xl mb-8">
            Click the button to experience the SPAMtastic fun!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-[#FFCC00] rounded-xl p-6 text-center">
            <h2 className="text-2xl font-bold text-[#0039A6] mb-2">
              Your SPAM
            </h2>
            <p className="text-4xl font-bold text-[#0039A6]">{spamCount}</p>
          </div>

          <div className="bg-[#FFCC00] rounded-xl p-6 text-center">
            <h2 className="text-2xl font-bold text-[#0039A6] mb-2">Streak</h2>
            <p className="text-4xl font-bold text-[#0039A6]">
              {streak} Days 🔥
            </p>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={handleSpamClick}
            className="bg-[#FFCC00] text-[#0039A6] text-2xl font-bold px-12 py-6 rounded-xl hover:bg-[#FFD700] transform hover:scale-105 transition-all shadow-lg"
          >
            SPAM IT! 🥫
          </button>

          {error && (
            <div className="mt-6 bg-red-500 text-white p-4 rounded-lg">
              {error}
            </div>
          )}
        </div>

        <div className="mt-12 text-center">
          <a
            href="/"
            className="text-[#FFCC00] hover:text-[#FFD700] transition-colors"
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}

export default MainComponent;