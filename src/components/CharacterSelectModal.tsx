import React from 'react';
import { CHARACTERS } from '../constants/gameData';
import { CharacterId } from '../types/game';
import { X, Check, Shield, Zap, Sparkles, User } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedId: CharacterId;
  onSelect: (id: CharacterId) => void;
}

export const CharacterSelectModal: React.FC<Props> = ({
  isOpen,
  onClose,
  selectedId,
  onSelect,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-[#0a1829] border border-[#2b5170] rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] p-6 text-[#edf7ff]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1b3b55]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#35e0d0] to-[#c7ff62] text-black font-bold flex items-center justify-center text-xl shadow-[0_0_15px_rgba(53,224,208,0.4)]">
              <User size={22} className="text-[#07111f]" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-['Chakra_Petch'] tracking-wide text-white">
                ESCOLHA SEU PERFIL SAP
              </h2>
              <p className="text-xs text-[#8ca8bf] font-mono">
                Cada função possui atributos, cadência de tiro e habilidades únicas para sobreviver ao fechamento.
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

        {/* Character Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
          {CHARACTERS.map((char) => {
            const isSelected = char.id === selectedId;
            return (
              <div
                key={char.id}
                onClick={() => onSelect(char.id)}
                className={`relative cursor-pointer rounded-xl p-5 border transition-all duration-200 ${
                  isSelected
                    ? 'border-[#35e0d0] bg-[#122b44] shadow-[0_0_25px_rgba(53,224,208,0.25)] ring-1 ring-[#35e0d0]'
                    : 'border-[#1e3c56] bg-[#0c1e30] hover:border-[#3a6a91] hover:bg-[#10253b]'
                }`}
              >
                {/* Badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{char.avatarIcon}</span>
                    <div>
                      <h3 className="font-['Chakra_Petch'] font-bold text-lg text-white">
                        {char.name}
                      </h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#193a57] text-[#93c7ec]">
                        {char.role}
                      </span>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="flex items-center gap-1 text-[11px] font-bold text-[#35e0d0] bg-[#35e0d0]/10 border border-[#35e0d0]/40 px-2 py-1 rounded">
                      <Check size={14} /> ATIVO
                    </div>
                  )}
                </div>

                <p className="text-xs text-[#9eb6cc] mb-4 leading-relaxed">
                  {char.description}
                </p>

                {/* Stat bars */}
                <div className="space-y-2 mb-4 font-mono text-[11px]">
                  <div>
                    <div className="flex justify-between text-[#809bb3] mb-0.5">
                      <span>Velocidade de Deslocamento</span>
                      <span className="text-white font-bold">{Math.round(char.speed * 10)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#071321] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#35e0d0] rounded-full"
                        style={{ width: `${(char.speed / 8) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[#809bb3] mb-0.5">
                      <span>Cadência de Disparo</span>
                      <span className="text-[#c7ff62] font-bold">
                        {char.fireRate <= 9 ? 'Rápida' : char.fireRate <= 12 ? 'Média' : 'Pesada'}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#071321] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#c7ff62] rounded-full"
                        style={{ width: `${((16 - char.fireRate) / 8) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[#809bb3] mb-0.5">
                      <span>Dano por Ticket / Chamado</span>
                      <span className="text-[#ffad55] font-bold">{char.damageMultiplier}x</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#071321] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#ffad55] rounded-full"
                        style={{ width: `${(char.damageMultiplier / 2) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Special Skill */}
                <div className="p-2.5 rounded-lg bg-[#071524] border border-[#1b354e] flex items-center gap-2 mb-3">
                  <Zap size={16} className="text-[#c7ff62] shrink-0" />
                  <div className="text-[11px]">
                    <span className="text-[#89a6be]">Especial (Tecla X): </span>
                    <strong className="text-white font-['Chakra_Petch']">{char.specialSkill}</strong>
                  </div>
                </div>

                {/* Quote */}
                <p className="text-[11px] italic text-[#6f8b9e] border-l-2 border-[#35e0d0]/40 pl-2">
                  {char.quote}
                </p>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-[#1b3b55]">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#35e0d0] to-[#c7ff62] text-[#071521] font-bold font-['Chakra_Petch'] text-sm tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(53,224,208,0.3)]"
          >
            CONFIRMAR SELEÇÃO
          </button>
        </div>
      </div>
    </div>
  );
};
