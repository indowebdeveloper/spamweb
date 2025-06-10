"use client";
import React from "react";

function MainComponent() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0039A6] to-[#002366] p-8 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-[#FFCC00] mb-4">
          404 - Page Not Found
        </h1>
        <p className="text-white mb-8">
          The page you're looking for doesn't exist.
        </p>
        <a
          href="/"
          className="bg-[#FFCC00] text-[#0039A6] px-6 py-3 rounded-lg font-bold hover:bg-[#FFD700] transition-colors"
        >
          Go Back Home
        </a>
      </div>
    </div>
  );
}

export default MainComponent;