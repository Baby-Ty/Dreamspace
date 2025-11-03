import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

const quotes = [
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "Dream big, start small, act now.", author: "Robin Sharma" },
  { text: "Your dreams don't have an expiration date.", author: "Unknown" },
  { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "What you get by achieving your goals is not as important as what you become.", author: "Zig Ziglar" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Small daily improvements are the key to staggering long-term results.", author: "Unknown" },
  { text: "Your limitation—it's only your imagination.", author: "Unknown" },
  { text: "Great things never come from comfort zones.", author: "Unknown" },
  { text: "Dream it. Believe it. Build it.", author: "Unknown" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "Progress, not perfection.", author: "Unknown" },
  { text: "Every accomplishment starts with the decision to try.", author: "Gail Devers" },
  { text: "Make today so awesome, yesterday gets jealous.", author: "Unknown" },
  { text: "One day or day one. You decide.", author: "Paulo Coelho" },
  { text: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Unknown" },
  { text: "Wake up with determination. Go to bed with satisfaction.", author: "George Lorimer" }
];

const QuoteDisplay = () => {
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [isRotating, setIsRotating] = useState(false);

  // Initialize quote on mount - rotate to next quote on each login/refresh
  useEffect(() => {
    const lastQuoteIndex = localStorage.getItem('dreamspace_quote_index');
    const lastLoginTime = localStorage.getItem('dreamspace_last_login');
    const currentTime = new Date().getTime();

    // If it's a new session (more than 1 minute since last login), rotate to next quote
    if (!lastLoginTime || (currentTime - parseInt(lastLoginTime)) > 60000) {
      const nextIndex = lastQuoteIndex ? (parseInt(lastQuoteIndex) + 1) % quotes.length : 0;
      setCurrentQuoteIndex(nextIndex);
      localStorage.setItem('dreamspace_quote_index', nextIndex.toString());
      localStorage.setItem('dreamspace_last_login', currentTime.toString());
    } else if (lastQuoteIndex) {
      setCurrentQuoteIndex(parseInt(lastQuoteIndex));
    }
  }, []);

  const rotateQuote = () => {
    setIsRotating(true);
    setTimeout(() => {
      const nextIndex = (currentQuoteIndex + 1) % quotes.length;
      setCurrentQuoteIndex(nextIndex);
      localStorage.setItem('dreamspace_quote_index', nextIndex.toString());
      setIsRotating(false);
    }, 200);
  };

  const currentQuote = quotes[currentQuoteIndex];

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-6 min-h-[140px]">
      <div className="max-w-[190px] text-center">
        <p 
          className={`text-xs text-gray-500 leading-relaxed font-light transition-opacity duration-300 ${
            isRotating ? 'opacity-0' : 'opacity-100'
          }`}
        >
          "{currentQuote.text}"
        </p>
        <p 
          className={`text-[11px] text-gray-400 mt-2.5 transition-opacity duration-300 ${
            isRotating ? 'opacity-0' : 'opacity-100'
          }`}
        >
          — {currentQuote.author}
        </p>
      </div>
      <button
        onClick={rotateQuote}
        className="mt-5 p-1 opacity-20 hover:opacity-60 transition-all duration-300"
        aria-label="Rotate quote"
        tabIndex={0}
      >
        <RefreshCw 
          className={`w-3 h-3 text-gray-400 transition-transform duration-300 ${
            isRotating ? 'rotate-180' : ''
          }`}
        />
      </button>
    </div>
  );
};

export default QuoteDisplay;

