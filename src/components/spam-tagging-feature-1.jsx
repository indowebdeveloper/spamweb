"use client";
import React from "react";



export default function Index() {
  return (function SpamTaggingFeature({ onTagFriends, loading, error }) {
  const [friends, setFriends] = React.useState([]);
  const [currentHandle, setCurrentHandle] = React.useState("");
  const [memeText, setMemeText] = React.useState("");
  const [generating, setGenerating] = React.useState(false);
  const [generationError, setGenerationError] = React.useState(null);

  const generateMeme = async () => {
    setGenerating(true);
    setGenerationError(null);
    try {
      const response = await fetch("/api/generateSpamMeme", {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error(`Failed to generate meme: ${response.status}`);
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setMemeText(data.memeText);
    } catch (error) {
      console.error("Error generating meme:", error);
      setGenerationError(error.message);
    } finally {
      setGenerating(false);
    }
  };

  const addFriend = (e) => {
    e.preventDefault();
    if (currentHandle && !friends.includes(currentHandle)) {
      const handle = currentHandle.replace("@", "").trim();
      if (handle) {
        setFriends([...friends, handle]);
        setCurrentHandle("");
      }
    }
  };

  const removeFriend = (handle) => {
    setFriends(friends.filter((f) => f !== handle));
  };

  const handleTagFriends = async () => {
    if (!memeText || friends.length === 0) return;

    const friendTags = friends.map((f) => `@${f}`).join(" ");
    const tweetText = encodeURIComponent(
      `${memeText}\n\n${friendTags}\n\nJoin the SPAMtastic revolution! 🚀\n#SPAMCOIN $SPAM`,
    );
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, "_blank");
  };

  return (
    <div className="bg-[#FFCC00] rounded-xl p-6 shadow-lg max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-[#0039A6] mb-2 font-roboto">
          Tag Your Friends with SPAM! 🥫
        </h2>
        <p className="text-[#0039A6] text-lg">
          Spread the SPAMtastic joy to your friends on Twitter!
        </p>
      </div>

      <form onSubmit={addFriend} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            name="twitter-handle"
            value={currentHandle}
            onChange={(e) => setCurrentHandle(e.target.value)}
            placeholder="@friend"
            className="flex-1 px-4 py-2 rounded-lg border-2 border-[#0039A6] focus:outline-none focus:border-[#002366]"
          />
          <button
            type="submit"
            className="bg-[#0039A6] text-[#FFCC00] px-6 py-2 rounded-lg font-bold hover:bg-[#002366] transition-colors"
          >
            Add Friend
          </button>
        </div>
      </form>

      {friends.length > 0 && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {friends.map((friend) => (
              <div
                key={friend}
                className="bg-[#0039A6] text-[#FFCC00] px-3 py-1 rounded-full flex items-center gap-2"
              >
                @{friend}
                <button
                  onClick={() => removeFriend(friend)}
                  className="hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview Window */}
      <div className="mb-6 relative">
        <div className="bg-[#0039A6] p-6 rounded-lg">
          {/* Twitter-like Preview */}
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <div className="flex items-center mb-3">
              <img
                src="https://ucarecdn.com/7f8c1f29-65fb-4158-b799-7c1185c3c535/-/format/auto/"
                alt="SPAM COIN"
                className="w-12 h-12 rounded-full"
              />
              <div className="ml-3">
                <div className="font-bold text-[#0039A6]">SPAM COIN</div>
                <div className="text-gray-500">@SpamChainSol</div>
              </div>
            </div>
            <div className="text-[#0039A6] text-xl font-bold whitespace-pre-line mb-3">
              {generating ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0039A6]"></div>
                  <span>Generating SPAMtastic meme...</span>
                </div>
              ) : generationError ? (
                <div className="text-red-500">Error: {generationError}</div>
              ) : memeText ? (
                memeText
              ) : (
                "Click generate for a random SPAM meme!"
              )}
            </div>
            {friends.length > 0 && (
              <div className="text-[#1DA1F2] mb-2">
                {friends.map((friend) => `@${friend}`).join(" ")}
              </div>
            )}
            <div className="text-[#0039A6]">
              Join the SPAMtastic revolution! 🚀
              <br />
              #SPAMCOIN $SPAM
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <button
          onClick={generateMeme}
          disabled={generating}
          className="bg-[#0039A6] text-[#FFCC00] px-6 py-3 rounded-lg font-bold text-xl hover:bg-[#002366] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#FFCC00]"></div>
              <span>Generating...</span>
            </div>
          ) : (
            "Generate Random Meme 🎲"
          )}
        </button>

        <button
          onClick={handleTagFriends}
          disabled={!memeText || friends.length === 0}
          className="bg-[#1DA1F2] text-white px-6 py-3 rounded-lg font-bold text-xl hover:bg-[#1a8cd8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <i className="fab fa-twitter"></i>
          Tag Friends on Twitter
        </button>
      </div>

      {generationError && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-center">
          {generationError}
        </div>
      )}
    </div>
  );
}

function StoryComponent() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const handleTagFriends = async (friends, meme) => {
    setLoading(true);
    setError(null);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Tagged friends:", friends, "with meme:", meme);
    } catch (err) {
      setError("Failed to tag friends. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-gradient-to-b from-[#0039A6] to-[#002366] min-h-screen">
      <div className="max-w-4xl mx-auto">
        <SpamTaggingFeature
          onTagFriends={handleTagFriends}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  );
}

// Export both components for the demo
export { SpamTaggingFeature, StoryComponent };);
}