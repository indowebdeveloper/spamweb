"use client";
import React from "react";

function MainComponent() {
  const [spamCount, setSpamCount] = React.useState(0);
  const [streak, setStreak] = React.useState(0);
  const [globalSpamCount, setGlobalSpamCount] = React.useState(0);
  const [leaderboardPosition, setLeaderboardPosition] = React.useState(null);
  const [achievements, setAchievements] = React.useState([]);
  const [showAchievement, setShowAchievement] = React.useState(null);
  const [userId, setUserId] = React.useState(null);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    let storedId = localStorage.getItem("userId");
    if (!storedId) {
      storedId = `user-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("userId", storedId);
    }
    setUserId(storedId);
  }, []);

  const updateStats = async () => {
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
      setGlobalSpamCount(data.globalStats.total_spam_count);
      setLeaderboardPosition(data.leaderboardPosition);

      if (data.newAchievements?.length > 0) {
        setAchievements((prev) => [...prev, ...data.newAchievements]);
        setShowAchievement(data.newAchievements[0]);
        setTimeout(() => setShowAchievement(null), 5000);
      }
    } catch (err) {
      console.error("Error updating stats:", err);
      setError("Failed to update stats");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0039A6] to-[#002366] relative overflow-hidden">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <img
            src="https://ucarecdn.com/7f8c1f29-65fb-4158-b799-7c1185c3c535/-/format/auto/"
            alt="SPAM COIN Logo"
            className="w-32 h-32 mx-auto mb-6 animate-float"
          />
          <h1 className="text-4xl md:text-6xl font-bold text-[#FFCC00] mb-4 font-roboto">
            SPAM COIN
          </h1>
          <p className="text-xl text-white">The Most SPAMtastic Memecoin! 🚀</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div className="bg-[#FFCC00] rounded-xl p-6 text-center transform hover:scale-105 transition-transform">
            <h2 className="text-2xl font-bold text-[#0039A6] mb-2">
              Your SPAM
            </h2>
            <p className="text-4xl font-bold text-[#0039A6]">
              {spamCount.toLocaleString()}
            </p>
          </div>

          <div className="bg-[#FFCC00] rounded-xl p-6 text-center transform hover:scale-105 transition-transform">
            <h2 className="text-2xl font-bold text-[#0039A6] mb-2">Streak</h2>
            <p className="text-4xl font-bold text-[#0039A6]">
              {streak} Days 🔥
            </p>
          </div>

          <div className="bg-[#FFCC00] rounded-xl p-6 text-center transform hover:scale-105 transition-transform">
            <h2 className="text-2xl font-bold text-[#0039A6] mb-2">
              Global SPAM
            </h2>
            <p className="text-4xl font-bold text-[#0039A6]">
              {globalSpamCount.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center mb-12">
          <button
            onClick={updateStats}
            className="bg-[#FFCC00] text-[#0039A6] text-2xl font-bold px-12 py-6 rounded-xl hover:bg-[#FFD700] transform hover:scale-105 transition-all shadow-lg"
          >
            SPAM IT! 🥫
          </button>
          {leaderboardPosition && (
            <p className="text-[#FFCC00] mt-4 text-xl">
              Leaderboard Position: #{leaderboardPosition} 🏆
            </p>
          )}
        </div>

        {achievements.length > 0 && (
          <div className="bg-[#FFCC00] rounded-xl p-6 mb-12">
            <h2 className="text-2xl font-bold text-[#0039A6] mb-4 text-center">
              Achievements 🏅
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="bg-[#0039A6] text-[#FFCC00] p-4 rounded-lg"
                >
                  <div className="text-2xl mb-2">{achievement.emoji}</div>
                  <h3 className="font-bold mb-1">{achievement.title}</h3>
                  <p className="text-sm">{achievement.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500 text-white p-4 rounded-lg text-center mb-6">
            {error}
          </div>
        )}
      </div>

      {showAchievement && (
        <div className="fixed top-4 right-4 bg-[#FFCC00] p-4 rounded-lg shadow-lg transform animate-slide-in z-50">
          <div className="text-[#0039A6] font-bold text-xl flex items-center gap-2">
            {showAchievement.emoji} Achievement Unlocked!
          </div>
          <div className="text-[#0039A6] font-bold">
            {showAchievement.title}
          </div>
          <div className="text-[#0039A6] text-sm">
            {showAchievement.description}
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes slide-in {
          0% { transform: translateX(100%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-slide-in {
          animation: slide-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default MainComponent;