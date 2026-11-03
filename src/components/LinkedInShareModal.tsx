import React, { useRef, useState, useEffect } from 'react';
import { CharacterProfile } from '../types/game';
import { Share2, Copy, Download, Check, X, Linkedin, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  score: number;
  tickets: number;
  level: number;
  character: CharacterProfile;
  won: boolean;
}

export const LinkedInShareModal: React.FC<Props> = ({
  isOpen,
  onClose,
  score,
  tickets,
  level,
  character,
  won,
}) => {
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('sap_survivor_player_name') || 'Consultor Especialista';
  });
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (playerName) {
      localStorage.setItem('sap_survivor_player_name', playerName);
    }
    if (isOpen) {
      renderCertificate();
    }
  }, [isOpen, playerName, score, tickets, level, won, character]);

  const shareText = `🎮 Sobrevivi ao Fechamento da Folha no SAP SURVIVOR! 🚀

Acabei de encarar a verdadeira prova de fogo do ecossistema SAP HCM:
👤 Perfil: ${character.name} (${character.role})
🎯 Pontuação Final: ${score.toLocaleString('pt-BR')} pontos
🎫 Chamados & Incidentes Resolvidos: ${tickets}
📊 Fase Atingida: Fase ${level} ${won ? '🏆 (FECHAMENTO COMPLETO - SALÁRIOS NA CONTA!)' : '⚡ (Sustentação Heroica)'}

Nem o temido DUMP ST22, nem as alterações sem request em produção conseguiram parar a folha de pagamento! 😅💼

${won ? '✅ Saldo zero conferido pela contabilidade e holerites emitidos!' : '“Mês passado estava funcionando, mas a gente resolve!”'}

Jogue também e tente fechar o mês sem derrubar o ambiente:
#SAP #SAPHCM #SAPSurvivor #FolhaDePagamento #RecursosHumanos #KeyUser #ABAP #Sustentação #Tecnologia`;

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  const handleOpenLinkedIn = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const renderCertificate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 1200;
    const H = 675; // 16:9 LinkedIn optimized
    canvas.width = W;
    canvas.height = H;

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, '#061321');
    bgGrad.addColorStop(0.5, '#0a1d30');
    bgGrad.addColorStop(1, '#050d18');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Decorative grid
    ctx.strokeStyle = 'rgba(53, 224, 208, 0.07)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // Outer cyber-border
    ctx.strokeStyle = won ? '#c7ff62' : '#35e0d0';
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 30, W - 60, H - 60);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(40, 40, W - 80, H - 80);

    // Corner marks
    const cornerSize = 24;
    ctx.fillStyle = won ? '#c7ff62' : '#35e0d0';
    [[30, 30], [W - 30 - cornerSize, 30], [30, H - 30 - cornerSize], [W - 30 - cornerSize, H - 30 - cornerSize]].forEach(([cx, cy]) => {
      ctx.fillRect(cx, cy, cornerSize, cornerSize);
    });

    // Top Header
    ctx.textAlign = 'center';
    ctx.font = 'bold 16px "Chakra Petch", monospace';
    ctx.fillStyle = '#8da7bb';
    ctx.fillText('SAP HCM • SISTEMA DE GESTÃO DA FOLHA DE PAGAMENTO', W / 2, 85);

    ctx.font = 'bold 38px "Chakra Petch", sans-serif';
    ctx.fillStyle = won ? '#c7ff62' : '#35e0d0';
    ctx.fillText(won ? '🏆 CERTIFICADO DE FECHAMENTO CONCLUÍDO' : '🎖️ CERTIFICADO DE SOBREVIVÊNCIA AO FECHAMENTO', W / 2, 135);

    ctx.font = '15px "Inter", sans-serif';
    ctx.fillStyle = '#a9c4db';
    ctx.fillText('Certifica-se formalmente para todos os devidos fins de Auditoria e RH que:', W / 2, 175);

    // Player Name
    ctx.font = 'bold 44px "Chakra Petch", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(playerName || 'Key User', W / 2, 235);

    ctx.fillStyle = 'rgba(53, 224, 208, 0.4)';
    ctx.fillRect(W / 2 - 250, 250, 500, 2);

    // Text description
    ctx.font = '16px "Inter", sans-serif';
    ctx.fillStyle = '#b7cee2';
    const textDesc = won
      ? 'Sobreviveu a todas as 5 fases críticas do ciclo da folha, neutralizou o Chefão "FECHAMENTO DO MÊS"'
      : 'Atuou bravamente na sustentação contra chamados P1, bugs em produção e divergências contábeis';
    ctx.fillText(textDesc, W / 2, 285);
    ctx.fillText('garantindo a integridade dos dados e o pagamento correto de todos os colaboradores.', W / 2, 312);

    // Stats Grid Box
    const boxY = 350;
    const boxW = 860;
    const boxH = 140;
    const boxX = (W - boxW) / 2;

    ctx.fillStyle = 'rgba(12, 29, 46, 0.85)';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = 'rgba(53, 224, 208, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // 4 Stat Columns
    const cols = [
      { label: 'FUNÇÃO ASSUMIDA', val: character.name, color: '#35e0d0' },
      { label: 'PONTUAÇÃO', val: score.toLocaleString('pt-BR'), color: '#c7ff62' },
      { label: 'CHAMADOS RESOLVIDOS', val: String(tickets), color: '#ffad55' },
      { label: 'FASE FINAL', val: won ? 'FASE 5 (VITÓRIA)' : `FASE ${level}`, color: won ? '#c7ff62' : '#ffffff' },
    ];

    cols.forEach((col, idx) => {
      const cx = boxX + (boxW / 4) * idx + boxW / 8;
      ctx.textAlign = 'center';
      ctx.font = '600 11px "Chakra Petch", monospace';
      ctx.fillStyle = '#83a1b8';
      ctx.fillText(col.label, cx, boxY + 45);

      ctx.font = 'bold 22px "Chakra Petch", sans-serif';
      ctx.fillStyle = col.color;
      ctx.fillText(col.val, cx, boxY + 85);

      if (idx < 3) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.beginPath();
        ctx.moveTo(boxX + (boxW / 4) * (idx + 1), boxY + 20);
        ctx.lineTo(boxX + (boxW / 4) * (idx + 1), boxY + boxH - 20);
        ctx.stroke();
      }
    });

    // Footer / Signatures
    ctx.textAlign = 'left';
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillStyle = '#5d7d96';
    ctx.fillText('AUTENTICIDADE: TRANSAÇÃO PC00_M37_CALC • STATUS: CONCLUÍDO', 70, H - 70);
    ctx.fillText(`DATA: ${new Date().toLocaleDateString('pt-BR')} • AMBIENTE: PRD[100]`, 70, H - 48);

    ctx.textAlign = 'right';
    ctx.font = 'italic 16px "Chakra Petch", sans-serif';
    ctx.fillStyle = '#a9c4db';
    ctx.fillText('A Folha Não Pode Parar! 🚀', W - 70, H - 65);
    ctx.font = '11px "Chakra Petch", monospace';
    ctx.fillStyle = '#5d7d96';
    ctx.fillText('SAP SURVIVOR • ARCADE EDITION', W - 70, H - 48);
  };

  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `Certificado_SAP_Survivor_${playerName.replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[94vh] overflow-y-auto bg-[#0a1829] border border-[#2b5170] rounded-xl shadow-[0_0_60px_rgba(0,0,0,0.85)] p-6 text-[#edf7ff]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1b3b55]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#0077b5] text-white flex items-center justify-center text-xl shadow-[0_0_15px_rgba(0,119,181,0.5)]">
              <Linkedin size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold font-['Chakra_Petch'] tracking-wide text-white">
                COMPARTILHAR NO LINKEDIN
              </h2>
              <p className="text-xs text-[#8ca8bf] font-mono">
                Gere seu Certificado de Sobrevivente SAP e publique seu resultado com a comunidade!
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

        {/* Player Name Input */}
        <div className="my-4 p-4 rounded-xl bg-[#0c1f33] border border-[#1d3d57]">
          <label className="block text-xs font-['Chakra_Petch'] font-semibold text-[#8ca8bf] mb-1.5">
            SEU NOME NO CERTIFICADO:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={playerName}
              maxLength={35}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Digite seu nome ou cargo..."
              className="flex-1 bg-[#06121f] border border-[#2b5170] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#35e0d0] font-['Chakra_Petch']"
            />
          </div>
        </div>

        {/* Certificate Preview */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-['Chakra_Petch'] font-bold text-[#35e0d0] flex items-center gap-1.5">
              <Sparkles size={14} /> PRÉVIA DO CERTIFICADO EXCLUSIVO (PNG 1080p):
            </span>
            <button
              onClick={handleDownloadImage}
              className="text-xs font-['Chakra_Petch'] font-bold text-[#c7ff62] hover:underline flex items-center gap-1"
            >
              <Download size={14} /> Baixar Imagem PNG
            </button>
          </div>
          <div className="border border-[#1f425f] rounded-xl overflow-hidden bg-black shadow-lg">
            <canvas ref={canvasRef} className="w-full h-auto block" />
          </div>
        </div>

        {/* Post Text Preview */}
        <div className="mb-5">
          <label className="block text-xs font-['Chakra_Petch'] font-semibold text-[#8ca8bf] mb-1.5">
            TEXTO PRONTO PARA O FEED DO LINKEDIN:
          </label>
          <div className="relative">
            <textarea
              readOnly
              rows={6}
              value={shareText}
              className="w-full bg-[#06121f] border border-[#1e3c56] rounded-xl p-3 text-xs text-[#cfe2f3] font-mono leading-relaxed resize-none focus:outline-none"
            />
            <button
              onClick={handleCopyText}
              className="absolute top-2 right-2 px-3 py-1.5 rounded-lg bg-[#183955] hover:bg-[#20496d] text-white text-xs font-['Chakra_Petch'] font-bold flex items-center gap-1.5 shadow transition-all"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-[#c7ff62]" /> Copiado!
                </>
              ) : (
                <>
                  <Copy size={14} /> Copiar Texto
                </>
              )}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#1b3b55]">
          <button
            onClick={handleDownloadImage}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#142f47] hover:bg-[#1a3d5e] text-white font-['Chakra_Petch'] text-xs font-bold transition-all"
          >
            <Download size={16} /> BAIXAR CERTIFICADO (PNG)
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#183955] hover:bg-[#20496d] text-white font-['Chakra_Petch'] text-xs font-bold transition-all"
            >
              <Copy size={16} /> COPIAR POST
            </button>
            <button
              onClick={handleOpenLinkedIn}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0077b5] hover:bg-[#0088cc] text-white font-['Chakra_Petch'] text-xs font-bold shadow-[0_0_20px_rgba(0,119,181,0.4)] transition-all"
            >
              <Linkedin size={16} /> POSTAR NO LINKEDIN
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
