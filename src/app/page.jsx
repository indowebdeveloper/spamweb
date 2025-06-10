"use client";
import React from "react";

function MainComponent() {
  const [stats, setStats] = React.useState({
    spamCount: 0,
    globalSpamCount: 0,
    leaderboardPosition: null,
    clickStreak: 0,
  });
  const [currentFact, setCurrentFact] = React.useState(null);
  const [userId, setUserId] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [friendHandle, setFriendHandle] = React.useState("");
  const [selectedTemplate, setSelectedTemplate] = React.useState("");
  const [showVideo, setShowVideo] = React.useState(false);
  const [achievements, setAchievements] = React.useState({
    list: [],
    showLatest: null,
  });
  const [isHovered, setIsHovered] = React.useState(false);

  const pollInterval = React.useRef(null);
  const isButtonDisabled = React.useRef(false);
  const [isPolling, setIsPolling] = React.useState(false);

  const updateStats = React.useCallback(async () => {
    if (!userId || isPolling) return;

    setIsPolling(true);
    try {
      const response = await fetch("/api/getUserStats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) throw new Error(`Error: ${response.status}`);

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setStats((prev) => ({
        spamCount: data.userStats?.total_clicks ?? prev.spamCount,
        globalSpamCount:
          data.globalStats?.total_spam_count ?? prev.globalSpamCount,
        leaderboardPosition:
          data.leaderboardPosition ?? prev.leaderboardPosition,
        clickStreak: data.userStats?.streak_days ?? prev.clickStreak,
      }));
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setIsPolling(false);
    }
  }, [userId]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const storedId =
      localStorage.getItem("userId") ||
      `user-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("userId", storedId);
    setUserId(storedId);

    return () => {
      localStorage.removeItem("userId");
    };
  }, []);

  React.useEffect(() => {
    if (!userId) return;

    // Initial stats update
    updateStats();

    // Set up polling with increased interval (5s instead of 3s)
    pollInterval.current = setInterval(updateStats, 5000);

    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
        pollInterval.current = null;
      }
    };
  }, [userId, updateStats]);

  // Track pending clicks that haven't been sent to the server yet
  const pendingClicks = React.useRef(0);
  const debounceTimer = React.useRef(null);

  // Debounce function to send accumulated clicks to server
  const sendClicksToServer = React.useCallback(async () => {
    if (!userId || pendingClicks.current === 0) return;

    const clicksToSend = pendingClicks.current;
    pendingClicks.current = 0; // Reset pending clicks

    try {
      const response = await fetch("/api/updateSpamCount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          clickCount: clicksToSend, // Send the accumulated click count
        }),
      });

      if (!response.ok) throw new Error(`Error: ${response.status}`);

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      // Update with actual server values
      setStats((prev) => ({
        spamCount: data.userStats?.total_clicks ?? prev.spamCount,
        globalSpamCount:
          data.globalStats?.total_spam_count ?? prev.globalSpamCount,
        leaderboardPosition:
          data.leaderboardPosition ?? prev.leaderboardPosition,
        clickStreak: data.userStats?.streak_days ?? prev.clickStreak,
      }));

      // Only show new achievements
      if (data.newAchievements?.length > 0) {
        setAchievements((prev) => ({
          list: [...prev.list, ...data.newAchievements],
          showLatest: data.newAchievements[0],
        }));

        setTimeout(() => {
          setAchievements((prev) => ({ ...prev, showLatest: null }));
        }, 5000);
      }

      // Reduce fact frequency to 10% for better performance
      if (Math.random() < 0.1) {
        const factResponse = await fetch("/api/getRandomFact", {
          method: "POST",
        });
        if (factResponse.ok) {
          const factData = await factResponse.json();
          if (!factData.error && factData.fact) {
            setCurrentFact(`${factData.fact} ${factData.emoji}`);
            setTimeout(() => setCurrentFact(null), 5000);
          }
        }
      }
    } catch (err) {
      // Revert optimistic update on error
      setStats((prev) => ({
        ...prev,
        spamCount: prev.spamCount - clicksToSend,
      }));
      console.error("Error:", err);
      setError("Failed to update SPAM count. Please try again!");
      setTimeout(() => setError(null), 5000);
    }
  }, [userId]);

  const handleSpamClick = React.useCallback(() => {
    if (!userId || isButtonDisabled.current) return;

    // Prevent rapid clicking (still keep this to prevent UI lag)
    isButtonDisabled.current = true;
    setTimeout(() => {
      isButtonDisabled.current = false;
    }, 100);

    // Increment local counter immediately for UI feedback
    setStats((prev) => ({
      ...prev,
      spamCount: prev.spamCount + 1,
    }));

    // Increment pending clicks counter
    pendingClicks.current += 1;

    // Clear existing timer if it exists
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer - only send to server after user stops clicking for 1000ms
    debounceTimer.current = setTimeout(() => {
      sendClicksToServer();
    }, 1000);
  }, [userId, sendClicksToServer]);

  const friendSpamTemplates = [
    "Hey @{friend}! You've been SPAMMED! 🥫 Join our amazing community and become a SPAMMER! https://x.com/i/communities/1932255284581601294 #SPAMCOIN #SOL #MEMECOIN",
    "ATTENTION @{friend}! You've been chosen for a special SPAM delivery! 📦 Join the SPAMtastic community: https://x.com/i/communities/1932255284581601294 #SPAMCOIN #SOL #MEMECOIN",
    "Yo @{friend}! Consider yourself officially SPAMMED! 🎯 Come join our community of SPAMmers: https://x.com/i/communities/1932255284581601294 #SPAMCOIN #SOL #MEMECOIN",
    "@{friend} Congratulations! You've won unlimited virtual SPAM! 🏆 Join the SPAM fam: https://x.com/i/communities/1932255284581601294 #SPAMCOIN #SOL #MEMECOIN",
    "Breaking News: @{friend} just got SPAMMED! 📰 Be part of the SPAM revolution: https://x.com/i/communities/1932255284581601294 #SPAMCOIN #SOL #MEMECOIN",
    "Dear @{friend}, you've been selected for our premium SPAM service! 💫 Join our community: https://x.com/i/communities/1932255284581601294 #SPAMCOIN #SOL #MEMECOIN",
    "ALERT: @{friend} has been infected with SPAM fever! 🤒 Find the cure in our community: https://x.com/i/communities/1932255284581601294 #SPAMCOIN #SOL #MEMECOIN",
    "🚨 @{friend} This is your daily dose of SPAM! 🥫 Get more SPAM in our community: https://x.com/i/communities/1932255284581601294 #SPAMCOIN #SOL #MEMECOIN",
    "@{friend} Roses are red, violets are blue, here's some SPAM, and a community for you! 🌹 https://x.com/i/communities/1932255284581601294 #SPAMCOIN #SOL #MEMECOIN",
    "Knock knock @{friend}! Who's there? SPAM! 🚪 Open the door to our community: https://x.com/i/communities/1932255284581601294 #SPAMCOIN #SOL #MEMECOIN",
    "@{friend} has been SPAMMED with love! ❤️ Share the love in our community: https://x.com/i/communities/1932255284581601294 #SPAMCOIN #SOL #MEMECOIN",
    "Special delivery for @{friend}! 📬 It's SPAM o'clock! Join us: https://x.com/i/communities/1932255284581601294 #SPAMCOIN #SOL #MEMECOIN",
    "@{friend} Achievement unlocked: Got SPAMMED! 🎮 Level up in our community: https://x.com/i/communities/1932255284581601294 #SPAMCOIN #SOL #MEMECOIN",
    "POV: @{friend} getting SPAMMED! 👀 Be part of the SPAMtastic movement: https://x.com/i/communities/1932255284581601294 #SPAMCOIN #SOL #MEMECOIN",
  ];

  const generateFriendSpam = () => {
    if (!friendHandle) return;
    const template =
      friendSpamTemplates[
        Math.floor(Math.random() * friendSpamTemplates.length)
      ];
    const message = template.replace(
      "{friend}",
      friendHandle.startsWith("@") ? friendHandle : "@" + friendHandle
    );
    setSelectedTemplate(message);
  };

  const shareFriendSpam = React.useCallback(() => {
    if (!selectedTemplate) return;
    const tweetText = encodeURIComponent(selectedTemplate);
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, "_blank");
  }, [selectedTemplate]);

  const handleVisionClick = () => {
    setShowVideo(true);
  };

  const StaticSection = React.memo(({ children }) => children);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0039A6] to-[#002366] relative overflow-hidden">
      <StaticSection>
        <nav className="bg-[#FFCC00] p-4 relative">
          <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center">
              <img
                src="https://ucarecdn.com/7f8c1f29-65fb-4158-b799-7c1185c3c535/-/format/auto/"
                alt="SPAM COIN Logo"
                className="h-12 w-12 sm:h-16 sm:w-16"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full sm:w-auto">
              <a
                href="https://x.com/i/communities/1932255284581601294"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white px-6 py-2 rounded-lg font-bold transition-all duration-300 flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <i className="fab fa-twitter"></i>
                Join Community
              </a>
              <a
                href="https://pump.fun"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#0039A6] hover:bg-[#002366] text-[#FFCC00] px-6 py-2 rounded-lg font-bold transition-all duration-300 w-full sm:w-auto text-center"
              >
                Buy SPAM on Pump.Fun
              </a>
            </div>
          </div>
        </nav>
      </StaticSection>

      <div className="bg-[#0039A6] border-y-2 border-[#FFCC00] py-2 sm:py-3 px-4 text-center">
        <p className="text-sm sm:text-base md:text-lg text-[#FFCC00] font-bold">
          🌍 Global SPAM Count: {stats.globalSpamCount.toLocaleString()} SPAMs
          Sent! 🚀
        </p>
      </div>

      <main className="container mx-auto px-4 py-8">
        <section className="bg-[#FFCC00] p-6 sm:p-10 rounded-3xl shadow-2xl mb-12 sm:mb-16 transform hover:scale-[1.01] transition-transform duration-300 border-4 border-[#0039A6]">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0039A6] mb-6 sm:mb-8 font-roboto text-center">
            🎯 SPAM Your Friends!
          </h2>
          <div className="max-w-2xl mx-auto">
            <div className="flex flex-col gap-4 mb-6">
              <input
                type="text"
                placeholder="Enter friend's X handle"
                value={friendHandle}
                onChange={(e) => setFriendHandle(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border-2 border-[#0039A6] focus:outline-none focus:border-[#002366] text-[#0039A6] text-lg"
              />
              <button
                onClick={generateFriendSpam}
                disabled={!friendHandle}
                className="w-full bg-[#0039A6] hover:bg-[#002366] text-[#FFCC00] px-6 py-3 rounded-lg font-bold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Generate SPAM! 🎲
              </button>
            </div>

            {selectedTemplate && (
              <div className="space-y-4">
                <div className="bg-white p-4 sm:p-6 rounded-lg">
                  <p className="text-lg sm:text-xl text-[#0039A6] font-bold break-words">
                    {selectedTemplate}
                  </p>
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={shareFriendSpam}
                    className="w-full sm:w-auto bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white px-6 py-4 rounded-lg font-bold text-xl transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <i className="fab fa-twitter"></i>
                    SPAM on X!
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="text-center mb-16 relative">
          <div className="max-w-2xl mx-auto bg-[#FFCC00] p-8 sm:p-12 rounded-3xl shadow-2xl transform hover:scale-[1.02] transition-transform duration-300 border-4 border-[#0039A6]">
            <h2 className="text-3xl font-bold text-[#0039A6] mb-6 font-roboto animate-bounce">
              SMASH THAT SPAM! 🥫
            </h2>
            <div className="space-y-4 mb-6">
              <div className="text-2xl font-bold text-[#0039A6] animate-pulse">
                Your SPAM Count: {stats.spamCount.toLocaleString()}
              </div>
              {stats.clickStreak > 1 && (
                <div className="bg-[#0039A6] text-[#FFCC00] p-2 rounded-lg animate-pulse">
                  🔥 {stats.clickStreak} Day Streak! Keep it up!
                </div>
              )}
              {stats.leaderboardPosition && (
                <div className="text-lg text-[#0039A6]">
                  🏆 Rank #{stats.leaderboardPosition} Spammer
                </div>
              )}
            </div>
            <button
              onClick={handleSpamClick}
              className="relative bg-[#0039A6] hover:bg-[#002366] text-[#FFCC00] px-12 py-6 rounded-xl font-bold text-2xl transition-all duration-300 shadow-lg"
            >
              <div className="flex items-center justify-center gap-2">
                <span>SPAM</span>
                <span>🥫</span>
                <span>IT!</span>
              </div>
            </button>
            {achievements.showLatest && (
              <div className="mt-6 fixed top-4 right-4 bg-[#FFCC00] p-4 rounded-lg shadow-lg transform animate-slide-in z-50">
                <div className="text-[#0039A6] font-bold text-xl flex items-center gap-2">
                  {achievements.showLatest.emoji} Achievement Unlocked!
                </div>
                <div className="text-[#0039A6] font-bold">
                  {achievements.showLatest.title}
                </div>
                <div className="text-[#0039A6] text-sm">
                  {achievements.showLatest.description}
                </div>
              </div>
            )}
            {currentFact && (
              <div className="mt-6 bg-white p-4 rounded-lg animate-slide-in transform hover:scale-105 transition-transform cursor-pointer">
                <p className="text-[#0039A6] text-lg font-bold">
                  {currentFact}
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="text-center mb-16 sm:mb-24 relative backdrop-blur-sm bg-[#0039A6]/30 p-8 sm:p-12 rounded-3xl">
          <div className="relative z-10">
            <div className="mx-auto mb-6 sm:mb-8 relative">
              <div className="absolute w-full h-full animate-pulse-glow"></div>
              <img
                src="https://ucarecdn.com/7f8c1f29-65fb-4158-b799-7c1185c3c535/-/format/auto/"
                alt="SPAM COIN"
                className="w-[150px] h-[150px] sm:w-[200px] sm:h-[200px] mx-auto animate-float relative"
              />
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-8xl font-bold text-[#FFCC00] mb-4 sm:mb-6 font-roboto animate-text-glow">
              SPAM COIN
            </h1>
            <p className="text-xl sm:text-2xl md:text-4xl text-white mb-6 sm:mb-8 font-roboto">
              The Most Legendary Memecoin for SPAM Lovers! 🚀
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 items-center">
              <a
                href="https://pump.fun"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto bg-[#FFCC00] hover:bg-[#FFD700] text-[#0039A6] px-6 py-4 rounded-lg font-bold text-lg sm:text-xl transition-all duration-300"
              >
                Get Your SPAM on Pump.Fun Soon! 🥫
              </a>
              <button
                onClick={handleVisionClick}
                className="w-full sm:w-auto bg-[#0039A6] hover:bg-[#002366] text-[#FFCC00] px-6 py-4 rounded-lg font-bold text-lg sm:text-xl transition-all duration-300 border-2 border-[#FFCC00]"
              >
                Discover the Vision 👀
              </button>
            </div>
          </div>
        </section>

        <section
          id="about"
          className="bg-[#FFCC00] rounded-3xl p-6 sm:p-10 mb-24 transform hover:scale-[1.01] transition-transform duration-300 shadow-2xl border-4 border-[#0039A6]"
        >
          <div className="flex flex-col md:flex-row items-center gap-8 sm:gap-12">
            <div className="flex-1 space-y-6">
              <h2 className="text-3xl sm:text-4xl font-bold text-[#0039A6] font-roboto">
                The SPAM Revolution Is Here! 🚀
              </h2>
              <div className="bg-white p-6 rounded-2xl mb-6 transform -rotate-1 shadow-lg">
                <p className="text-[#0039A6] text-xl sm:text-2xl font-bold mb-3">
                  "Finally, a memecoin that speaks to my soul!"
                </p>
                <p className="text-[#0039A6] italic text-lg">
                  - Every SPAM lover ever 🥫
                </p>
              </div>
              <p className="text-[#0039A6] text-lg sm:text-xl leading-relaxed">
                SPAM COIN isn't just another memecoin – it's a celebration of
                the most legendary canned meat that has conquered hearts
                worldwide! 🌎
              </p>
            </div>
            <div className="flex-1">
              <div className="relative group">
                <img
                  src="https://ucarecdn.com/ea141a6f-d958-422c-a1a3-3725c96a0d5d/-/format/auto/"
                  alt="SPAM Meme"
                  className="w-full rounded-2xl shadow-2xl transform rotate-2 group-hover:rotate-0 transition-transform duration-300"
                />
                <div className="absolute -bottom-6 -right-6 text-6xl animate-bounce">
                  🥪
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="text-center mb-24 backdrop-blur-sm bg-[#0039A6]/30 p-8 sm:p-12 rounded-3xl">
          <h2 className="text-4xl sm:text-5xl font-bold mb-8 font-roboto text-[#FFCC00] animate-text-glow">
            Join the SPAMtastic Movement! 🚀
          </h2>
          <p className="text-xl sm:text-2xl text-white mb-8 leading-relaxed">
            Unite with fellow SPAM enthusiasts in the most flavorful community
            in crypto!
          </p>
          <div className="flex justify-center">
            <a
              href="https://twitter.com/SpamChainSol"
              target="_blank"
              rel="noopener noreferrer"
              className="text-5xl text-[#FFCC00] hover:text-[#FFD700] transition-colors duration-300 transform hover:scale-110"
            >
              <i className="fab fa-twitter"></i>
            </a>
          </div>
        </section>

        <section className="mb-24 max-w-4xl mx-auto">
          <div className="bg-[#FFCC00] p-8 sm:p-12 rounded-3xl shadow-2xl border-4 border-[#0039A6]">
            <h2 className="text-4xl font-bold mb-8 font-roboto text-[#0039A6] text-center">
              🎯 Important Notice
            </h2>
            <div className="space-y-6 text-[#0039A6]">
              <p className="text-lg sm:text-xl leading-relaxed">
                SPAM COIN is a memecoin created purely for fun and
                entertainment. This is NOT an investment vehicle or financial
                instrument.
              </p>
              <p className="text-lg sm:text-xl leading-relaxed">
                SPAM® is a registered trademark of Hormel Foods Corporation.
                SPAM COIN is not affiliated with, endorsed by, or connected to
                Hormel Foods Corporation in any way.
              </p>
            </div>
          </div>
        </section>
      </main>
      <div
        className="fixed bottom-4 right-4 z-50 cursor-pointer transform hover:scale-110 transition-transform group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className={`text-4xl ${
            isHovered ? "animate-bounce" : "animate-spin"
          }`}
          style={{ animationDuration: isHovered ? "0.5s" : "10s" }}
        >
          🥪
        </div>
        {isHovered && (
          <div className="absolute bottom-full right-0 mb-2 bg-white p-2 rounded shadow-lg text-[#0039A6] text-sm whitespace-nowrap">
            Boop the sandwich! 🥪
          </div>
        )}
      </div>
      <footer className="bg-[#FFCC00] text-[#0039A6] py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">
            SPAM COIN © 2025 | Made with 🥪 by the community
          </p>
        </div>
      </footer>
      {showVideo && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setShowVideo(false)}
        >
          <div className="relative bg-[#FFCC00] p-4 rounded-xl max-w-3xl w-full">
            <button
              onClick={() => setShowVideo(false)}
              className="absolute -top-4 -right-4 bg-[#0039A6] text-[#FFCC00] w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#002366] transition-colors"
            >
              ✕
            </button>
            <div className="relative pt-[56.25%] overflow-hidden rounded-lg">
              <iframe
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                className="absolute top-0 left-0 w-full h-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
              ></iframe>
            </div>
            <p className="text-[#0039A6] text-center mt-4 font-bold">
              The SPAMtastic Vision™ 🥫✨
            </p>
          </div>
        </div>
      )}
      {error && (
        <div className="mt-4 bg-red-500 text-white p-4 rounded-lg text-center max-w-md mx-auto">
          {error}
        </div>
      )}
      <style jsx global>{`
        @keyframes slide-in {
          0% {
            transform: translateX(100%);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-5px);
          }
          75% {
            transform: translateX(5px);
          }
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }

        @keyframes achievement-unlock {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-achievement {
          animation: achievement-unlock 0.5s ease-out forwards;
        }

        @keyframes pulse-glow {
          0%,
          100% {
            opacity: 0.5;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.1);
          }
        }

        @keyframes text-glow {
          0%,
          100% {
            text-shadow: 4px 4px 0px #0039a6, 8px 8px 0px #002366;
          }
          50% {
            text-shadow: 4px 4px 15px #ffcc00, 8px 8px 0px #002366;
          }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-pulse-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }

        .animate-text-glow {
          animation: text-glow 3s ease-in-out infinite;
        }

        .animate-pulse-subtle {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        .shadow-text {
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
        }
      `}</style>
    </div>
  );
}

export default MainComponent;
