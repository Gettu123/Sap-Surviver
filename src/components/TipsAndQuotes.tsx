import React, { useState, useEffect } from 'react';
import { FUN_TIPS, FUN_QUOTES } from '../constants/gameData';
import { RefreshCw, Lightbulb, MessageSquareQuote } from 'lucide-react';

export const TipsAndQuotes: React.FC = () => {
  const [tipIndex, setTipIndex] = useState(0);
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % FUN_TIPS.length);
      setQuoteIndex((prev) => (prev + 1) % FUN_QUOTES.length);
    }, 12000);
    return () => clearInterval(timer);
  }, []);

  const handleNextTip = () => {
    setTipIndex((prev) => (prev + 1) % FUN_TIPS.length);
  };

  const handleNextQuote = () => {
    setQuoteIndex((prev) => (prev + 1) % FUN_QUOTES.length);
  };

  const currentTip = FUN_TIPS[tipIndex];
  const currentQuote = FUN_QUOTES[quoteIndex];

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-4">
      {/* Tip Card */}
      <article className="flex items-start gap-3.5 bg-[#0c1b2b] border border-[#1b3850] rounded-xl p-4 shadow-sm relative group">
        <div className="w-10 h-10 rounded-lg bg-[#112d46] border border-[#234b6e] text-[#35e0d0] flex items-center justify-center text-xl shrink-0">
          {currentTip.icon}
        </div>
        <div className="flex-1 pr-6">
          <div className="flex items-center gap-2">
            <b className="font-['Chakra_Petch'] text-xs font-bold tracking-wider text-[#35e0d0]">
              {currentTip.title}
            </b>
          </div>
          <p className="text-xs text-[#a9bdce] mt-1 leading-relaxed">
            {currentTip.text}
          </p>
        </div>
        <button
          onClick={handleNextTip}
          title="Próxima dica"
          className="absolute top-3 right-3 text-[#587994] hover:text-[#35e0d0] transition-colors p-1"
        >
          <RefreshCw size={14} />
        </button>
      </article>

      {/* Quote Card */}
      <article className="flex items-start gap-3.5 bg-[#0c1b2b] border border-[#1b3850] rounded-xl p-4 shadow-sm relative group">
        <div className="w-10 h-10 rounded-lg bg-[#112d46] border border-[#234b6e] text-[#c7ff62] flex items-center justify-center shrink-0">
          <MessageSquareQuote size={20} />
        </div>
        <div className="flex-1 pr-6">
          <p className="font-['Chakra_Petch'] font-semibold text-sm text-[#e5f3ff] leading-snug">
            {currentQuote.quote}
          </p>
          <small className="block text-[#7893a9] font-mono text-[11px] mt-1.5">
            — {currentQuote.author}
          </small>
        </div>
        <button
          onClick={handleNextQuote}
          title="Próxima frase"
          className="absolute top-3 right-3 text-[#587994] hover:text-[#c7ff62] transition-colors p-1"
        >
          <RefreshCw size={14} />
        </button>
      </article>
    </section>
  );
};
