import React from 'react';
import { GameScoreRecord } from '../types/game';
import { Trophy, X, Trash2, Calendar, Award, CheckCircle, AlertTriangle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  scores: GameScoreRecord[];
  onClearScores: () => void;
}

export const HighscoreModal: React.FC<Props> = ({
  isOpen,
  onClose,
  scores,
  onClearScores,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0a1829] border border-[#2b5170] rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] p-6 text-[#edf7ff]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1b3b55]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#c7ff62] to-[#35e0d0] text-black font-bold flex items-center justify-center text-xl shadow-[0_0_15px_rgba(199,255,98,0.4)]">
              <Trophy size={22} className="text-[#07111f]" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-['Chakra_Petch'] tracking-wide text-white">
                HISTÓRICO & RECORDES DA SUSTENTAÇÃO
              </h2>
              <p className="text-xs text-[#8ca8bf] font-mono">
                Registros salvos localmente das rodadas de fechamento
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8ca8bf] hover:text-white hover:bg-[#16334d] rounded-lg transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        {scores.length === 0 ? (
          <div className="py-12 text-center text-[#8ca8bf]">
            <Trophy size={40} className="mx-auto mb-3 opacity-30 text-[#c7ff62]" />
            <p className="font-['Chakra_Petch'] text-base">Nenhum registro de fechamento ainda!</p>
            <p className="text-xs font-mono mt-1">Jogue uma partida para gravar seu histórico no sistema.</p>
          </div>
        ) : (
          <div className="my-5 space-y-2.5">
            {scores.map((rec, index) => (
              <div
                key={index}
                className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                  index === 0
                    ? 'border-[#c7ff62]/50 bg-[#122c30] shadow-[0_0_20px_rgba(199,255,98,0.15)]'
                    : 'border-[#1b3850] bg-[#0c1f33]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-['Chakra_Petch'] font-bold text-sm ${
                      index === 0
                        ? 'bg-[#c7ff62] text-[#071521]'
                        : index === 1
                        ? 'bg-[#35e0d0] text-[#071521]'
                        : index === 2
                        ? 'bg-[#ffad55] text-[#071521]'
                        : 'bg-[#18344e] text-[#8ca8bf]'
                    }`}
                  >
                    #{index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white font-['Chakra_Petch'] text-sm">
                        {rec.characterName}
                      </span>
                      {rec.won ? (
                        <span className="text-[10px] font-mono text-[#c7ff62] flex items-center gap-1 bg-[#c7ff62]/10 px-1.5 py-0.5 rounded border border-[#c7ff62]/30">
                          <CheckCircle size={10} /> FOLHA FECHADA
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-[#ff5d6c] flex items-center gap-1 bg-[#ff5d6c]/10 px-1.5 py-0.5 rounded border border-[#ff5d6c]/30">
                          <AlertTriangle size={10} /> PAROU NA FASE {rec.level}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-[#7896ad] flex items-center gap-3 mt-1">
                      <span>{rec.tickets} chamados</span>
                      <span>•</span>
                      <span>{rec.date}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-mono text-[#8ca8bf]">PONTUAÇÃO</div>
                  <strong className="text-lg font-['Chakra_Petch'] font-bold text-[#c7ff62]">
                    {rec.score.toLocaleString('pt-BR')}
                  </strong>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-[#1b3b55]">
          {scores.length > 0 && (
            <button
              onClick={onClearScores}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-300 text-xs font-mono transition-colors cursor-pointer"
            >
              <Trash2 size={13} /> Limpar Histórico
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-auto px-5 py-2 rounded-lg bg-[#142f47] hover:bg-[#1b3f5f] text-white font-['Chakra_Petch'] text-xs font-bold transition-all cursor-pointer"
          >
            FECHAR
          </button>
        </div>
      </div>
    </div>
  );
};
