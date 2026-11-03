import React, { useState } from 'react';
import { CharacterId, CharacterProfile, Achievement, GameScoreRecord } from './types/game';
import { CHARACTERS, INITIAL_ACHIEVEMENTS, PHASES } from './constants/gameData';
import { sounds } from './sound/audio';
import { SAPHeader } from './components/SAPHeader';
import { GameCanvas } from './components/GameCanvas';
import { GameCanvas25D } from './components/GameCanvas25D';
import { TipsAndQuotes } from './components/TipsAndQuotes';
import { CharacterSelectModal } from './components/CharacterSelectModal';
import { AchievementsModal } from './components/AchievementsModal';
import { LinkedInShareModal } from './components/LinkedInShareModal';
import { HighscoreModal } from './components/HighscoreModal';
import { UnityGuideModal } from './components/UnityGuideModal';

export default function App() {
  // Active Character
  const [characterId, setCharacterId] = useState<CharacterId>(() => {
    return (localStorage.getItem('sap_survivor_char') as CharacterId) || 'keyuser';
  });

  const activeCharacter: CharacterProfile =
    CHARACTERS.find((c) => c.id === characterId) || CHARACTERS[0];

  // View Mode: 2.5D or 2D Classic
  const [viewMode, setViewMode] = useState<'2.5d' | '2d'>(() => {
    return (localStorage.getItem('sap_survivor_view') as '2.5d' | '2d') || '2.5d';
  });

  // Settings
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [scanlines, setScanlines] = useState(false);
  const [currentTcode, setCurrentTcode] = useState(PHASES[0].tcode);

  // Modals
  const [charSelectOpen, setCharSelectOpen] = useState(false);
  const [achievementsOpen, setAchievementsOpen] = useState(false);
  const [highscoresOpen, setHighscoresOpen] = useState(false);
  const [unityGuideOpen, setUnityGuideOpen] = useState(false);
  const [linkedInModalData, setLinkedInModalData] = useState<{
    isOpen: boolean;
    score: number;
    tickets: number;
    level: number;
    won: boolean;
  }>({
    isOpen: false,
    score: 0,
    tickets: 0,
    level: 1,
    won: false,
  });

  // Local Storage Data
  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    try {
      const saved = localStorage.getItem('sap_survivor_achievements');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_ACHIEVEMENTS;
  });

  const [scores, setScores] = useState<GameScoreRecord[]>(() => {
    try {
      const saved = localStorage.getItem('sap_survivor_scores');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Save character preference
  const handleSelectCharacter = (id: CharacterId) => {
    setCharacterId(id);
    localStorage.setItem('sap_survivor_char', id);
    sounds.playTone(700, 0.08, 'sine');
  };

  // View mode switcher
  const handleToggleViewMode = () => {
    const nextMode = viewMode === '2.5d' ? '2d' : '2.5d';
    setViewMode(nextMode);
    localStorage.setItem('sap_survivor_view', nextMode);
    sounds.playTone(600, 0.08, 'triangle');
  };

  // Audio toggles
  const handleToggleSfx = () => {
    sounds.sfxEnabled = !sfxEnabled;
    setSfxEnabled(!sfxEnabled);
    if (!sfxEnabled) sounds.playTone(550, 0.08);
  };

  const handleToggleMusic = () => {
    const nextState = sounds.toggleMusic();
    setMusicEnabled(nextState);
  };

  const handleToggleScanlines = () => {
    setScanlines((prev) => !prev);
  };

  // Unlock achievement
  const handleUnlockAchievement = (id: string) => {
    setAchievements((prev) => {
      const item = prev.find((a) => a.id === id);
      if (item && !item.unlockedAt) {
        sounds.playPowerup();
        const updated = prev.map((a) =>
          a.id === id ? { ...a, unlockedAt: new Date().toISOString() } : a
        );
        try {
          localStorage.setItem('sap_survivor_achievements', JSON.stringify(updated));
        } catch {}
        return updated;
      }
      return prev;
    });
  };

  // Save game score
  const handleSaveScore = (record: GameScoreRecord) => {
    setScores((prev) => {
      const updated = [record, ...prev].slice(0, 20);
      try {
        localStorage.setItem('sap_survivor_scores', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleClearScores = () => {
    setScores([]);
    localStorage.removeItem('sap_survivor_scores');
  };

  const highscore = scores.length > 0 ? Math.max(...scores.map((s) => s.score)) : 0;
  const unlockedCount = achievements.filter((a) => a.unlockedAt).length;

  return (
    <div className="min-h-screen bg-[#07111f] text-[#edf7ff] font-['Inter',sans-serif] selection:bg-[#35e0d0] selection:text-black">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_50%_-20%,#133758_0%,#07111f_65%)]" />

      {/* Main Container */}
      <main className="relative z-10 max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-7">
        {/* Top Header */}
        <SAPHeader
          currentTcode={currentTcode}
          character={activeCharacter}
          highscore={highscore}
          sfxEnabled={sfxEnabled}
          musicEnabled={musicEnabled}
          scanlines={scanlines}
          viewMode={viewMode}
          unlockedAchievementsCount={unlockedCount}
          totalAchievementsCount={achievements.length}
          onToggleSfx={handleToggleSfx}
          onToggleMusic={handleToggleMusic}
          onToggleScanlines={handleToggleScanlines}
          onToggleViewMode={handleToggleViewMode}
          onOpenCharacterSelect={() => setCharSelectOpen(true)}
          onOpenAchievements={() => setAchievementsOpen(true)}
          onOpenHighscores={() => setHighscoresOpen(true)}
          onOpenUnityGuide={() => setUnityGuideOpen(true)}
        />

        {/* Hero Section Banner */}
        <section className="flex flex-wrap items-center justify-between gap-4 py-3 sm:py-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-['Chakra_Petch'] font-bold text-xs tracking-widest text-[#35e0d0]">
                ARCADE SURVIVOR • SAP HCM & DP
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#35e0d0]" />
              <span className="font-mono text-[11px] text-[#c7ff62]">
                MOTOR 2.5D & UNITY C#
              </span>
            </div>
            <h1 className="font-['Chakra_Petch'] font-bold text-2xl sm:text-4xl tracking-tight text-white leading-tight">
              Sobreviva ao <em className="not-italic text-[#c7ff62]">fechamento da folha.</em>
            </h1>
            <p className="text-xs sm:text-sm text-[#9eb6cc] max-w-2xl mt-1 leading-relaxed">
              Desvie de chamados urgentes, combata bugs em produção, aplique Notas SAP e enfrente os 5 chefões do DP até o lendário <b>FECHAMENTO DO MÊS</b>.
            </p>
          </div>

          <div className="hidden sm:flex flex-col items-end gap-2">
            <button
              onClick={() => setUnityGuideOpen(true)}
              className="text-xs font-mono text-[#35e0d0] hover:underline flex items-center gap-1.5 bg-[#0f253a] px-3 py-1.5 rounded-lg border border-[#204a6e] cursor-pointer"
            >
              📄 Ver Guia Unity (C#)
            </button>
            <div className="rotate-2 hover:rotate-0 transition-transform">
              <div className="border border-[#ff5d6c] bg-[#1a0e16]/80 text-[#ff818a] px-3.5 py-1.5 font-['Chakra_Petch'] font-bold text-xs tracking-widest text-center rounded-lg shadow-[0_0_20px_rgba(255,93,108,0.2)]">
                SEM JANELA DE TESTES! 💥
              </div>
            </div>
          </div>
        </section>

        {/* Arcade Game Canvas: 2.5D Mode vs 2D Classic Mode */}
        {viewMode === '2.5d' ? (
          <GameCanvas25D
            character={activeCharacter}
            scanlines={scanlines}
            setCurrentTcode={setCurrentTcode}
            onOpenLinkedInShare={(score, tickets, level, won) => {
              setLinkedInModalData({
                isOpen: true,
                score,
                tickets,
                level,
                won,
              });
            }}
            onOpenCharacterSelect={() => setCharSelectOpen(true)}
            onUnlockAchievement={handleUnlockAchievement}
            onSaveScore={handleSaveScore}
            onSwitchTo2D={() => {
              setViewMode('2d');
              localStorage.setItem('sap_survivor_view', '2d');
            }}
          />
        ) : (
          <GameCanvas
            character={activeCharacter}
            scanlines={scanlines}
            setCurrentTcode={setCurrentTcode}
            onOpenLinkedInShare={(score, tickets, level, won) => {
              setLinkedInModalData({
                isOpen: true,
                score,
                tickets,
                level,
                won,
              });
            }}
            onOpenCharacterSelect={() => setCharSelectOpen(true)}
            onUnlockAchievement={handleUnlockAchievement}
            onSaveScore={handleSaveScore}
            onSwitchTo25D={() => {
              setViewMode('2.5d');
              localStorage.setItem('sap_survivor_view', '2.5d');
            }}
          />
        )}

        {/* Tips and Quotes Section */}
        <TipsAndQuotes />

        {/* Footer */}
        <footer className="mt-8 pt-4 border-t border-[#152a3d] flex flex-wrap items-center justify-between gap-3 text-[11px] font-['Chakra_Petch'] text-[#5a778e]">
          <span>🎮 SAP SURVIVOR — UM JOGO SOBRE A VIDA REAL DA SUSTENTAÇÃO SAP 😅</span>
          <span>COMPATÍVEL COM UNITY C# & WEBGL 2.5D • <b>GGWP</b></span>
        </footer>
      </main>

      {/* Modals */}
      <CharacterSelectModal
        isOpen={charSelectOpen}
        onClose={() => setCharSelectOpen(false)}
        selectedId={characterId}
        onSelect={handleSelectCharacter}
      />

      <AchievementsModal
        isOpen={achievementsOpen}
        onClose={() => setAchievementsOpen(false)}
        achievements={achievements}
      />

      <HighscoreModal
        isOpen={highscoresOpen}
        onClose={() => setHighscoresOpen(false)}
        scores={scores}
        onClearScores={handleClearScores}
      />

      <UnityGuideModal
        isOpen={unityGuideOpen}
        onClose={() => setUnityGuideOpen(false)}
      />

      <LinkedInShareModal
        isOpen={linkedInModalData.isOpen}
        onClose={() => setLinkedInModalData((prev) => ({ ...prev, isOpen: false }))}
        score={linkedInModalData.score}
        tickets={linkedInModalData.tickets}
        level={linkedInModalData.level}
        won={linkedInModalData.won}
        character={activeCharacter}
      />
    </div>
  );
}
