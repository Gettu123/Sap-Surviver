import React from 'react';
import { Achievement } from '../types/game';
import { Award, X, CheckCircle, Lock } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  achievements: Achievement[];
}

export const AchievementsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  achievements,
}) => {
  if (!isOpen) return null;

  const unlockedCount = achievements.filter((a) => a.unlockedAt).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0a1829] border border-[#2b5170] rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] p-6 text-[#edf7ff]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1b3b55]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#ffad55] to-[#c7ff62] text-black font-bold flex items-center justify-center text-xl shadow-[0_0_15px_rgba(255,173,85,0.4)]">
              <Award size={22} className="text-[#07111f]" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-['Chakra_Petch'] tracking-wide text-white">
                CONQUISTAS & BADGES DE SUSTENTAÇÃO
              </h2>
              <p className="text-xs text-[#8ca8bf] font-mono">
                {unlockedCount} de {achievements.length} conquistas desbloqueadas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8ca8bf] hover:text-white hover:bg-[#16334d] rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="my-5">
          <div className="flex justify-between text-xs font-mono text-[#8ca8bf] mb-1.5">
            <span>Progresso da Carreira SAP</span>
            <span className="text-[#c7ff62] font-bold">
              {Math.round((unlockedCount / achievements.length) * 100)}%
            </span>
          </div>
          <div className="w-full h-2.5 bg-[#071321] rounded-full overflow-hidden border border-[#1d3d57]">
            <div
              className="h-full bg-gradient-to-r from-[#35e0d0] via-[#c7ff62] to-[#ffad55] transition-all duration-500 rounded-full"
              style={{ width: `${(unlockedCount / achievements.length) * 100}%` }}
            />
          </div>
        </div>

        {/* List */}
        <div className="space-y-3 my-4">
          {achievements.map((item) => {
            const isUnlocked = !!item.unlockedAt;
            return (
              <div
                key={item.id}
                className={`flex items-start gap-4 p-3.5 rounded-xl border transition-all ${
                  isUnlocked
                    ? 'border-[#35e0d0]/40 bg-[#10273d] shadow-[0_0_15px_rgba(53,224,208,0.1)]'
                    : 'border-[#183149] bg-[#091522] opacity-75'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 border ${
                    isUnlocked
                      ? 'bg-[#183d5a] border-[#35e0d0] shadow-[0_0_12px_rgba(53,224,208,0.3)]'
                      : 'bg-[#0f1d2b] border-[#1f374e] grayscale'
                  }`}
                >
                  {item.icon}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3
                      className={`font-['Chakra_Petch'] font-bold text-base ${
                        isUnlocked ? 'text-white' : 'text-[#8299af]'
                      }`}
                    >
                      {item.title}
                    </h3>
                    {isUnlocked ? (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-[#c7ff62] bg-[#c7ff62]/10 px-2 py-0.5 rounded border border-[#c7ff62]/30">
                        <CheckCircle size={12} /> CONCLUÍDO
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-[#678299] bg-[#142332] px-2 py-0.5 rounded">
                        <Lock size={12} /> BLOQUEADO
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#9eb6cc] mt-1 leading-relaxed">
                    {item.description}
                  </p>
                  {item.unlockedAt && (
                    <p className="text-[10px] font-mono text-[#6a8da6] mt-1.5">
                      Desbloqueado em: {new Date(item.unlockedAt).toLocaleDateString('pt-BR')} às{' '}
                      {new Date(item.unlockedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-[#1b3b55]">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-[#142f47] hover:bg-[#1b3f5f] text-white font-['Chakra_Petch'] text-xs font-bold transition-all"
          >
            FECHAR
          </button>
        </div>
      </div>
    </div>
  );
};
