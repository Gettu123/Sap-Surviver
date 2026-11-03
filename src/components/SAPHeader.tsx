import React from 'react';
import { CharacterProfile } from '../types/game';
import { Volume2, VolumeX, Music, Award, Monitor, Trophy, Code, Layers } from 'lucide-react';

interface Props {
  currentTcode: string;
  character: CharacterProfile;
  highscore: number;
  sfxEnabled: boolean;
  musicEnabled: boolean;
  scanlines: boolean;
  viewMode: '2d' | '2.5d';
  unlockedAchievementsCount: number;
  totalAchievementsCount: number;
  onToggleSfx: () => void;
  onToggleMusic: () => void;
  onToggleScanlines: () => void;
  onToggleViewMode: () => void;
  onOpenCharacterSelect: () => void;
  onOpenAchievements: () => void;
  onOpenHighscores: () => void;
  onOpenUnityGuide: () => void;
}

export const SAPHeader: React.FC<Props> = ({
  currentTcode,
  character,
  highscore,
  sfxEnabled,
  musicEnabled,
  scanlines,
  viewMode,
  unlockedAchievementsCount,
  totalAchievementsCount,
  onToggleSfx,
  onToggleMusic,
  onToggleScanlines,
  onToggleViewMode,
  onOpenCharacterSelect,
  onOpenAchievements,
  onOpenHighscores,
  onOpenUnityGuide,
}) => {
  return (
    <header className="border-b border-[#183149] pb-4 mb-4">
      {/* Top micro bar like SAP GUI status line */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-[#7896ad] pb-2 border-b border-[#122538] mb-3">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-bold text-[#ff5d6c]">
            <span className="inline-block w-2 h-2 rounded-full bg-[#ff5d6c]" />
            SISTEMA: PRD [MANDANTE 100]
          </span>
          <span className="hidden sm:inline text-[#35526e]">|</span>
          <span className="hidden sm:inline text-[#9fb8cc]">
            TRANSAÇÃO: <b className="text-[#35e0d0] font-['Chakra_Petch']">{currentTcode}</b>
          </span>
          <span className="hidden md:inline text-[#35526e]">|</span>
          <span className="hidden md:inline text-[#9fb8cc]">
            MOTOR: <b className="text-[#c7ff62] font-mono">UNITY C# / WEBGL 2.5D</b>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Unity Guide Button */}
          <button
            onClick={onOpenUnityGuide}
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#132c45] hover:bg-[#1c3f61] border border-[#2b5880] text-[#35e0d0] font-['Chakra_Petch'] font-bold transition-colors cursor-pointer text-[10px]"
          >
            <Code size={12} />
            <span>GUIA MOTOR UNITY (C#)</span>
          </button>

          <button
            onClick={onOpenHighscores}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#102438] hover:bg-[#18344e] border border-[#20415e] text-[#c7ff62] font-['Chakra_Petch'] font-bold transition-colors cursor-pointer"
          >
            <Trophy size={11} />
            <span>RECORDE: {highscore.toLocaleString('pt-BR')}</span>
          </button>
        </div>
      </div>

      {/* Main Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="grid place-items-center w-11 h-11 bg-gradient-to-br from-[#35e0d0] to-[#c7ff62] text-[#061421] font-bold text-2xl font-['Chakra_Petch'] rounded-xl shadow-[0_0_25px_rgba(53,224,208,0.35)] select-none">
            S
          </div>
          <div>
            <div className="flex items-center gap-2">
              <strong className="font-['Chakra_Petch'] font-bold text-xl sm:text-2xl tracking-wider text-white">
                SAP SURVIVOR
              </strong>
              <button
                onClick={onToggleViewMode}
                className="text-[9px] font-bold font-mono px-2 py-0.5 rounded bg-[#35e0d0]/20 text-[#35e0d0] border border-[#35e0d0]/40 uppercase tracking-widest cursor-pointer hover:bg-[#35e0d0]/30 transition-colors flex items-center gap-1"
                title="Clique para alternar entre visão 2.5D e 2D"
              >
                <Layers size={10} />
                <span>MODO {viewMode.toUpperCase()}</span>
              </button>
            </div>
            <small className="block text-[#86a2b8] text-[10px] font-mono tracking-widest uppercase">
              A FOLHA NÃO PODE PARAR! • RH / DP / SUSTENTAÇÃO
            </small>
          </div>
        </div>

        {/* Action Controls & Character */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Switcher */}
          <button
            onClick={onToggleViewMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-['Chakra_Petch'] font-bold transition-all cursor-pointer ${
              viewMode === '2.5d'
                ? 'bg-[#143d52] border-[#35e0d0] text-[#35e0d0] shadow-[0_0_15px_rgba(53,224,208,0.25)]'
                : 'bg-[#10263b] border-[#254665] text-[#8ca8bf] hover:text-white'
            }`}
          >
            <Layers size={14} />
            <span>{viewMode === '2.5d' ? 'VISÃO 2.5D' : 'VISÃO 2D'}</span>
          </button>

          {/* Character Switcher Button */}
          <button
            onClick={onOpenCharacterSelect}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#10263b] hover:bg-[#183856] border border-[#254665] text-xs font-['Chakra_Petch'] text-white transition-all shadow cursor-pointer group"
          >
            <span className="text-base group-hover:scale-110 transition-transform">{character.avatarIcon}</span>
            <div className="text-left">
              <div className="text-[9px] font-mono text-[#81a0b8] leading-tight">PERFIL ATIVO</div>
              <strong className="text-xs text-[#35e0d0] font-bold block">{character.name}</strong>
            </div>
          </button>

          {/* Achievements Button */}
          <button
            onClick={onOpenAchievements}
            title="Ver Conquistas"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#10263b] hover:bg-[#183856] border border-[#254665] text-xs font-['Chakra_Petch'] text-white transition-all cursor-pointer relative"
          >
            <Award size={15} className="text-[#ffad55]" />
            <span className="hidden sm:inline text-xs font-bold font-mono text-[#ffad55]">
              {unlockedAchievementsCount}/{totalAchievementsCount}
            </span>
          </button>

          {/* Scanlines Toggle */}
          <button
            onClick={onToggleScanlines}
            title={scanlines ? 'Desativar Efeito CRT' : 'Ativar Efeito CRT Retro'}
            className={`p-2 rounded-lg border text-xs transition-all cursor-pointer ${
              scanlines
                ? 'bg-[#183d5a] border-[#35e0d0] text-[#35e0d0]'
                : 'bg-[#10263b] border-[#254665] text-[#81a0b8] hover:text-white'
            }`}
          >
            <Monitor size={15} />
          </button>

          {/* Music Toggle */}
          <button
            onClick={onToggleMusic}
            title={musicEnabled ? 'Desligar Trilha Sonora' : 'Ligar Trilha Chiptune Retro'}
            className={`p-2 rounded-lg border text-xs transition-all cursor-pointer ${
              musicEnabled
                ? 'bg-[#1b4332] border-[#c7ff62] text-[#c7ff62]'
                : 'bg-[#10263b] border-[#254665] text-[#81a0b8] hover:text-white'
            }`}
          >
            <Music size={15} />
          </button>

          {/* SFX Toggle */}
          <button
            onClick={onToggleSfx}
            title={sfxEnabled ? 'Desligar Efeitos Sonoros' : 'Ligar Efeitos Sonoros'}
            className={`p-2 rounded-lg border text-xs transition-all cursor-pointer ${
              sfxEnabled
                ? 'bg-[#183d5a] border-[#35e0d0] text-[#35e0d0]'
                : 'bg-[#10263b] border-[#254665] text-[#81a0b8] hover:text-white'
            }`}
          >
            {sfxEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>
        </div>
      </div>
    </header>
  );
};
