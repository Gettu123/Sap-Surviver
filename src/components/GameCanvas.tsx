import React, { useRef, useEffect, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  CharacterProfile,
  Enemy,
  Bullet,
  PowerUpItem,
  ActiveBuffs,
  Particle,
  FloatingText,
  PhaseConfig,
  Achievement,
  GameScoreRecord,
} from '../types/game';
import { PHASES } from '../constants/gameData';
import { sounds } from '../sound/audio';
import {
  Play,
  RotateCcw,
  Zap,
  Shield,
  Coffee,
  Share2,
  Trophy,
  SlidersHorizontal,
  Flame,
  Layers,
} from 'lucide-react';

interface Props {
  character: CharacterProfile;
  scanlines: boolean;
  onOpenLinkedInShare: (score: number, tickets: number, level: number, won: boolean) => void;
  onOpenCharacterSelect: () => void;
  onUnlockAchievement: (id: string) => void;
  onSaveScore: (record: GameScoreRecord) => void;
  setCurrentTcode: (tcode: string) => void;
  onSwitchTo25D?: () => void;
}

export const GameCanvas: React.FC<Props> = ({
  character,
  scanlines,
  onOpenLinkedInShare,
  onOpenCharacterSelect,
  onUnlockAchievement,
  onSaveScore,
  setCurrentTcode,
  onSwitchTo25D,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // React state for HUD
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover' | 'victory'>('idle');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [tickets, setTickets] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [specialMeter, setSpecialMeter] = useState(0); // 0 to 100
  const [activeBoss, setActiveBoss] = useState<{ name: string; hp: number; maxHp: number; color: string } | null>(null);
  const [activeBuffs, setActiveBuffs] = useState<ActiveBuffs>({
    cafeTimeRemaining: 0,
    shieldCount: 0,
    debugTimeRemaining: 0,
    tripleShotTimeRemaining: 0,
  });
  const [autoFire, setAutoFire] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Engine refs (mutable 60fps states to avoid re-renders on every frame)
  const engineRef = useRef({
    running: false,
    score: 0,
    lives: 3,
    tickets: 0,
    level: 1,
    ticketsInPhase: 0,
    frame: 0,
    specialMeter: 0,
    bossActive: false,
    bossSpawnedInPhase: false,
    screenShake: 0,
    combo: 0,
    comboTimer: 0,
    coffeeCountTotal: 0,
    evidenceCountTotal: 0,
    player: {
      x: 480,
      y: 470,
      w: 48,
      h: 52,
      speed: character.speed,
      cooldown: 0,
      invuln: 0,
    },
    buffs: {
      cafeTimeRemaining: 0,
      shieldCount: 0,
      debugTimeRemaining: 0,
      tripleShotTimeRemaining: 0,
    },
    keys: {
      left: false,
      right: false,
      fire: false,
      special: false,
    },
    enemies: [] as Enemy[],
    bullets: [] as Bullet[],
    enemyBullets: [] as { x: number; y: number; vx: number; vy: number }[],
    powerups: [] as PowerUpItem[],
    particles: [] as Particle[],
    floatingTexts: [] as FloatingText[],
    stars: [] as { x: number; y: number; s: number; v: number; alpha: number }[],
  });

  // Keep player speed & multipliers synced when character changes
  useEffect(() => {
    engineRef.current.player.speed = character.speed;
  }, [character]);

  // Init stars
  useEffect(() => {
    const stars = [];
    for (let i = 0; i < 90; i++) {
      stars.push({
        x: Math.random() * 960,
        y: Math.random() * 540,
        s: Math.random() * 2 + 0.8,
        v: Math.random() * 1.4 + 0.4,
        alpha: Math.random() * 0.7 + 0.3,
      });
    }
    engineRef.current.stars = stars;
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 1800);
  }, []);

  // Spawn Enemy Logic
  const spawnEnemy = useCallback(() => {
    const e = engineRef.current;
    const currentPhase = PHASES[Math.min(e.level - 1, PHASES.length - 1)];

    // Check if we should trigger boss
    if (
      e.ticketsInPhase >= currentPhase.targetTickets &&
      !e.bossActive &&
      !e.bossSpawnedInPhase
    ) {
      e.bossActive = true;
      e.bossSpawnedInPhase = true;
      sounds.playBossAlert();
      showToast(currentPhase.boss.dialogIntro);

      const bossEnemy: Enemy = {
        id: Date.now(),
        x: 480,
        y: -100,
        w: currentPhase.boss.width,
        h: currentPhase.boss.height,
        hp: currentPhase.boss.hp,
        maxHp: currentPhase.boss.hp,
        type: 'DUMP_ST22',
        label: currentPhase.boss.name,
        sublabel: currentPhase.boss.title,
        color: currentPhase.boss.color,
        vy: 1.0,
        vx: 2.2,
        points: 2000,
        isBoss: true,
        bossPhase: e.level,
        patternTimer: 0,
      };
      e.enemies.push(bossEnemy);
      setActiveBoss({
        name: currentPhase.boss.name,
        hp: currentPhase.boss.hp,
        maxHp: currentPhase.boss.hp,
        color: currentPhase.boss.color,
      });
      return;
    }

    if (e.bossActive) return; // limit mobs during boss fight

    const types: { type: Enemy['type']; label: string; sublabel?: string; color: string; hp: number; points: number }[] = [
      { type: 'CHAMADO', label: 'CHAMADO P1', sublabel: 'Erro de Banco', color: '#ff5d6c', hp: 1, points: 100 },
      { type: 'BUG', label: 'BUG EM PRD', sublabel: 'Mês passado ia!', color: '#b88cff', hp: 1, points: 120 },
      { type: 'CUSTOM', label: 'CUSTOMIZAÇÃO', sublabel: 'Sem Documento', color: '#ffad55', hp: 2, points: 180 },
      { type: 'EVIDENCIA_ROGUE', label: 'EVIDÊNCIA', sublabel: '+100 PTS / ESPECIAL', color: '#35e0d0', hp: 1, points: 80 },
    ];

    const pick = types[Math.floor(Math.random() * types.length)];
    const speedMult = currentPhase.enemySpeedMultiplier;
    const hpMult = currentPhase.enemyHpMultiplier;

    const newEnemy: Enemy = {
      id: Math.random(),
      x: Math.random() * (960 - 120) + 60,
      y: -50,
      w: pick.type === 'CUSTOM' ? 52 : 44,
      h: 44,
      hp: Math.ceil(pick.hp * hpMult),
      maxHp: Math.ceil(pick.hp * hpMult),
      type: pick.type,
      label: pick.label,
      sublabel: pick.sublabel,
      color: pick.color,
      vy: (Math.random() * 1.5 + 1.8) * speedMult,
      vx: pick.type === 'BUG' ? (Math.random() > 0.5 ? 1.5 : -1.5) : 0,
      points: pick.points,
      patternTimer: 0,
    };

    e.enemies.push(newEnemy);
  }, [showToast]);

  // Burst Particles
  const createBurst = (x: number, y: number, color: string, count = 16, size = 3) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4.5 + 1;
      engineRef.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() * size + 2,
        alpha: 1,
        decay: Math.random() * 0.035 + 0.02,
      });
    }
  };

  // Add floating text
  const addFloatingText = (x: number, y: number, text: string, color = '#c7ff62') => {
    engineRef.current.floatingTexts.push({
      id: Math.random(),
      x,
      y,
      text,
      color,
      vy: -1.2,
      life: 0,
      maxLife: 40,
    });
  };

  // Trigger Special Skill
  const triggerSpecial = useCallback(() => {
    const e = engineRef.current;
    if (e.specialMeter < 100) return;

    e.specialMeter = 0;
    setSpecialMeter(0);

    if (character.id === 'keyuser') {
      // SM12 Nuke
      sounds.playSM12Nuke();
      e.screenShake = 16;
      showToast('🔓 SM12: TODAS AS TABELAS DESBLOQUEADAS!');
      addFloatingText(e.player.x, e.player.y - 30, 'SM12 DESBLOQUEIO!', '#35e0d0');

      e.enemies.forEach((en) => {
        if (en.isBoss) {
          en.hp = Math.max(1, en.hp - 18);
          createBurst(en.x, en.y, '#35e0d0', 25, 4);
        } else {
          en.hp = 0;
          createBurst(en.x, en.y, en.color, 16);
          e.score += en.points;
          e.tickets++;
        }
      });
      onUnlockAchievement('sm12_hero');
    } else if (character.id === 'consultor') {
      // Immediate OSS Note Shield
      sounds.playPowerup();
      e.buffs.shieldCount += 2;
      showToast('📄 NOTA SAP OSS: ESCUDO DUPLO ATIVADO!');
      addFloatingText(e.player.x, e.player.y - 30, 'ESCUDO OSS ATIVO!', '#c7ff62');
    } else if (character.id === 'analista') {
      // Emergency Audit & Life restoration
      sounds.playEvidencePickup();
      if (e.lives < 4) {
        e.lives++;
        setLives(e.lives);
      }
      e.score += 500;
      showToast('🧮 AUDITORIA CONCLUÍDA: +1 VIDA & +500 PTS!');
      addFloatingText(e.player.x, e.player.y - 30, '+1 VIDA & +500 PTS!', '#ffad55');
    } else if (character.id === 'abaper') {
      // /h Debugger Freeze
      sounds.playPowerup();
      e.buffs.debugTimeRemaining = 360; // ~6 seconds at 60fps
      showToast('🐛 DEBUG /h: AMBIENTE CONGELADO EM SLOW MOTION!');
      addFloatingText(e.player.x, e.player.y - 30, '/h DEBUGGING...', '#b88cff');
    }
  }, [character, onUnlockAchievement, showToast]);

  // Drop random powerup
  const maybeDropPowerup = (x: number, y: number) => {
    const rand = Math.random();
    if (rand < 0.28) {
      const types: { type: PowerUpItem['type']; label: string; icon: string; color: string }[] = [
        { type: 'CAFE', label: 'CAFÉ EXTRA', icon: '☕', color: '#ffad55' },
        { type: 'OSS_NOTE', label: 'NOTA SAP', icon: '🛡️', color: '#35e0d0' },
        { type: 'TIRO_TRIPLO', label: 'BATCH INPUT', icon: '⚡', color: '#c7ff62' },
        { type: 'DEBUG_H', label: 'DEBUG /h', icon: '🐛', color: '#b88cff' },
      ];
      const pick = types[Math.floor(Math.random() * types.length)];
      engineRef.current.powerups.push({
        id: Math.random(),
        x,
        y,
        type: pick.type,
        label: pick.label,
        icon: pick.icon,
        color: pick.color,
        vy: 1.8,
      });
    }
  };

  // Player Shoot
  const shoot = useCallback(() => {
    const e = engineRef.current;
    if (e.player.cooldown > 0) return;

    const isTriple = e.buffs.tripleShotTimeRemaining > 0;
    const isCafe = e.buffs.cafeTimeRemaining > 0;

    const baseCooldown = isCafe ? Math.floor(character.fireRate * 0.6) : character.fireRate;
    e.player.cooldown = Math.max(4, baseCooldown);

    const dmg = character.damageMultiplier;

    sounds.playShoot();

    if (isTriple) {
      // 3 bullets
      e.bullets.push({ id: Math.random(), x: e.player.x, y: e.player.y - 24, vx: 0, vy: -10, damage: dmg, color: '#c7ff62' });
      e.bullets.push({ id: Math.random(), x: e.player.x - 12, y: e.player.y - 18, vx: -2.2, vy: -9.5, damage: dmg, color: '#35e0d0' });
      e.bullets.push({ id: Math.random(), x: e.player.x + 12, y: e.player.y - 18, vx: 2.2, vy: -9.5, damage: dmg, color: '#35e0d0' });
    } else {
      e.bullets.push({ id: Math.random(), x: e.player.x, y: e.player.y - 24, vx: 0, vy: -10, damage: dmg, color: '#35e0d0' });
    }
  }, [character]);

  // Player Damaged
  const hitPlayer = useCallback(() => {
    const e = engineRef.current;
    if (e.player.invuln > 0) return;

    // Check if shield is active
    if (e.buffs.shieldCount > 0) {
      e.buffs.shieldCount--;
      e.player.invuln = 45;
      sounds.playTone(400, 0.15, 'triangle', 0.04);
      addFloatingText(e.player.x, e.player.y - 30, 'ESCUDO BLOQUEOU!', '#35e0d0');
      createBurst(e.player.x, e.player.y, '#35e0d0', 16);
      return;
    }

    e.lives--;
    setLives(e.lives);
    e.player.invuln = 90;
    e.screenShake = 12;
    e.combo = 0;
    createBurst(e.player.x, e.player.y, '#ff5d6c', 28, 4);
    sounds.playHit();
    showToast('⚠ ENERGIA DO KEY USER REDUZIDA!');

    if (e.lives <= 0) {
      endGame(false);
    }
  }, [showToast]);

  // End Game (Win or Game Over)
  const endGame = useCallback((won: boolean) => {
    const e = engineRef.current;
    e.running = false;
    setGameState(won ? 'victory' : 'gameover');

    if (won) {
      sounds.playVictory();
      confetti({
        particleCount: 160,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#35e0d0', '#c7ff62', '#ffad55', '#ffffff'],
      });
      onUnlockAchievement('survivor_legend');
    } else {
      sounds.playGameOver();
    }

    if (e.score >= 5000) {
      onUnlockAchievement('penny_pincher');
    }

    // Save record to local storage
    onSaveScore({
      score: e.score,
      tickets: e.tickets,
      level: e.level,
      character: character.id,
      characterName: character.name,
      date: new Date().toLocaleDateString('pt-BR'),
      won,
    });
  }, [character, onSaveScore, onUnlockAchievement]);

  // Advance Phase
  const advancePhase = useCallback(() => {
    const e = engineRef.current;
    if (e.level >= PHASES.length) {
      // Completed last phase!
      endGame(true);
      return;
    }

    e.level++;
    e.ticketsInPhase = 0;
    e.bossActive = false;
    e.bossSpawnedInPhase = false;
    setActiveBoss(null);
    setCurrentLevel(e.level);

    const nextPhase = PHASES[e.level - 1];
    setCurrentTcode(nextPhase.tcode);

    sounds.playPowerup();
    showToast(`🚀 FASE ${e.level}: ${nextPhase.title}`);
    addFloatingText(480, 260, `AVANÇO PARA A FASE ${e.level}!`, '#c7ff62');

    // Reward player with a health boost
    if (e.lives < 4) {
      e.lives++;
      setLives(e.lives);
    }
  }, [endGame, setCurrentTcode, showToast]);

  // Start / Restart Game
  const startGame = useCallback(() => {
    const e = engineRef.current;
    e.running = true;
    e.score = 0;
    e.lives = 3;
    e.tickets = 0;
    e.level = 1;
    e.ticketsInPhase = 0;
    e.frame = 0;
    e.specialMeter = 0;
    e.bossActive = false;
    e.bossSpawnedInPhase = false;
    e.combo = 0;
    e.comboTimer = 0;
    e.coffeeCountTotal = 0;
    e.evidenceCountTotal = 0;
    e.player.x = 480;
    e.player.y = 470;
    e.player.invuln = 0;
    e.player.cooldown = 0;
    e.buffs = {
      cafeTimeRemaining: 0,
      shieldCount: 0,
      debugTimeRemaining: 0,
      tripleShotTimeRemaining: 0,
    };
    e.enemies = [];
    e.bullets = [];
    e.enemyBullets = [];
    e.powerups = [];
    e.particles = [];
    e.floatingTexts = [];

    setScore(0);
    setLives(3);
    setTickets(0);
    setCurrentLevel(1);
    setSpecialMeter(0);
    setActiveBoss(null);
    setCurrentTcode(PHASES[0].tcode);
    setGameState('playing');

    sounds.playTone(660, 0.12, 'square');
  }, [setCurrentTcode]);

  // Keyboard Listeners
  useEffect(() => {
    const handleKeyDown = (ev: KeyboardEvent) => {
      const keys = engineRef.current.keys;
      if (['ArrowLeft', 'ArrowRight', 'Space', 'KeyA', 'KeyD', 'KeyX', 'KeyP'].includes(ev.code)) {
        ev.preventDefault();
      }
      if (ev.code === 'ArrowLeft' || ev.code === 'KeyA') keys.left = true;
      if (ev.code === 'ArrowRight' || ev.code === 'KeyD') keys.right = true;
      if (ev.code === 'Space') keys.fire = true;
      if (ev.code === 'KeyX') triggerSpecial();
      if (ev.code === 'Enter' && gameState !== 'playing') startGame();
    };

    const handleKeyUp = (ev: KeyboardEvent) => {
      const keys = engineRef.current.keys;
      if (ev.code === 'ArrowLeft' || ev.code === 'KeyA') keys.left = false;
      if (ev.code === 'ArrowRight' || ev.code === 'KeyD') keys.right = false;
      if (ev.code === 'Space') keys.fire = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, startGame, triggerSpecial]);

  // Main 60fps Game Loop
  useEffect(() => {
    let animId: number;

    const loop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const e = engineRef.current;
      const W = 960;
      const H = 540;

      // UPDATE LOGIC (only when playing)
      if (e.running) {
        e.frame++;

        // Slow motion if debug /h active
        const timeScale = e.buffs.debugTimeRemaining > 0 ? 0.35 : 1.0;

        // Player movement
        if (e.keys.left) e.player.x -= e.player.speed * (e.buffs.cafeTimeRemaining > 0 ? 1.25 : 1);
        if (e.keys.right) e.player.x += e.player.speed * (e.buffs.cafeTimeRemaining > 0 ? 1.25 : 1);
        e.player.x = Math.max(30, Math.min(W - 30, e.player.x));

        // Player shooting
        if (e.keys.fire || autoFire) {
          shoot();
        }

        if (e.player.cooldown > 0) e.player.cooldown--;
        if (e.player.invuln > 0) e.player.invuln--;

        // Decrement buffs
        if (e.buffs.cafeTimeRemaining > 0) e.buffs.cafeTimeRemaining--;
        if (e.buffs.debugTimeRemaining > 0) e.buffs.debugTimeRemaining--;
        if (e.buffs.tripleShotTimeRemaining > 0) e.buffs.tripleShotTimeRemaining--;

        // Screen shake decay
        if (e.screenShake > 0) e.screenShake *= 0.88;

        // Combo decay
        if (e.comboTimer > 0) {
          e.comboTimer--;
          if (e.comboTimer <= 0) e.combo = 0;
        }

        // Spawn enemies
        const spawnInterval = Math.max(22, 65 - e.level * 6);
        if (e.frame % spawnInterval === 0) {
          spawnEnemy();
        }

        // Update Stars
        e.stars.forEach((st) => {
          st.y += st.v * timeScale;
          if (st.y > H) {
            st.y = 0;
            st.x = Math.random() * W;
          }
        });

        // Update Bullets
        e.bullets.forEach((b) => {
          b.x += b.vx;
          b.y += b.vy;
        });
        e.bullets = e.bullets.filter((b) => b.y > -20 && b.x > 0 && b.x < W);

        // Update Enemy Bullets
        e.enemyBullets.forEach((eb) => {
          eb.x += eb.vx * timeScale;
          eb.y += eb.vy * timeScale;

          // Check hit with player
          const dist = Math.hypot(eb.x - e.player.x, eb.y - e.player.y);
          if (dist < 24) {
            eb.y = H + 100;
            hitPlayer();
          }
        });
        e.enemyBullets = e.enemyBullets.filter((eb) => eb.y < H + 20 && eb.y > -20);

        // Update Powerups
        e.powerups.forEach((p) => {
          p.y += p.vy * timeScale;
          // Magnetism / collision with player
          const dist = Math.hypot(p.x - e.player.x, p.y - e.player.y);
          const pickupRadius = 32 + character.pickupRadiusBonus;

          if (dist < pickupRadius) {
            p.y = H + 100;
            sounds.playPowerup();

            if (p.type === 'CAFE') {
              e.buffs.cafeTimeRemaining = 480; // 8s
              e.coffeeCountTotal++;
              addFloatingText(p.x, p.y, 'CAFÉ EXTRA FORTE! ☕', '#ffad55');
              showToast('☕ CAFÉ EXTRA: DISPARO E VELOCIDADE ACELERADOS!');
              if (e.coffeeCountTotal >= 3) onUnlockAchievement('coffee_addict');
            } else if (p.type === 'OSS_NOTE') {
              e.buffs.shieldCount = Math.min(3, e.buffs.shieldCount + 1);
              addFloatingText(p.x, p.y, 'NOTA SAP: ESCUDO +1 🛡️', '#35e0d0');
              showToast('🛡️ NOTA SAP: ESCUDO ABSORVEDOR ATIVADO!');
            } else if (p.type === 'TIRO_TRIPLO') {
              e.buffs.tripleShotTimeRemaining = 500; // ~8.3s
              addFloatingText(p.x, p.y, 'BATCH INPUT: TIRO TRIPLO ⚡', '#c7ff62');
              showToast('⚡ TIRO TRIPLO: BATCH INPUT ATIVADO!');
            } else if (p.type === 'DEBUG_H') {
              e.buffs.debugTimeRemaining = 360; // 6s
              addFloatingText(p.x, p.y, 'DEBUG /h: SLOW MOTION 🐛', '#b88cff');
              showToast('🐛 DEBUG /h: TEMPO CONGELADO!');
            }

            e.specialMeter = Math.min(100, e.specialMeter + 20);
          }
        });
        e.powerups = e.powerups.filter((p) => p.y < H + 30);

        // Update Enemies
        e.enemies.forEach((en) => {
          en.y += en.vy * timeScale;
          en.x += en.vx * timeScale;

          // Bounce sideways if wandering
          if (en.x < 40 || en.x > W - 40) en.vx *= -1;

          // Boss mechanics
          if (en.isBoss) {
            en.patternTimer = (en.patternTimer || 0) + 1;
            en.x = W / 2 + Math.sin(en.patternTimer * 0.035) * (W * 0.35);
            en.y = Math.min(120, en.y + 0.3); // settle near top

            // Boss shoots error packets periodically
            if (en.patternTimer % 75 === 0) {
              sounds.playTone(320, 0.05, 'sawtooth', 0.02);
              const angle = Math.atan2(e.player.y - en.y, e.player.x - en.x);
              e.enemyBullets.push({
                x: en.x,
                y: en.y + en.h / 2,
                vx: Math.cos(angle) * 3.8,
                vy: Math.sin(angle) * 3.8,
              });
            }

            // Sync boss state for HUD
            setActiveBoss({
              name: en.label,
              hp: en.hp,
              maxHp: en.maxHp,
              color: en.color,
            });
          }

          // Check bullet collisions
          e.bullets.forEach((b) => {
            const hit =
              Math.abs(b.x - en.x) < (en.w + 12) * 0.5 &&
              Math.abs(b.y - en.y) < (en.h + 16) * 0.5;

            if (hit) {
              b.y = -100;
              en.hp -= b.damage;
              createBurst(b.x, b.y, en.color, 4);

              if (en.hp <= 0) {
                // Destroyed enemy
                sounds.playEnemyExplode(en.isBoss);
                createBurst(en.x, en.y, en.color, en.isBoss ? 45 : 18, en.isBoss ? 5 : 3);
                e.screenShake = en.isBoss ? 16 : 4;

                const pts = en.points * (1 + e.combo * 0.1);
                e.score += Math.round(pts);
                e.tickets++;
                e.ticketsInPhase++;
                e.combo++;
                e.comboTimer = 140; // ~2.3s to maintain combo

                // Charge special meter
                e.specialMeter = Math.min(100, e.specialMeter + (en.isBoss ? 50 : 8));

                addFloatingText(en.x, en.y, `+${Math.round(pts)} PTS`, en.color);

                if (en.type === 'EVIDENCIA_ROGUE') {
                  e.evidenceCountTotal++;
                  sounds.playEvidencePickup();
                  addFloatingText(en.x, en.y - 15, 'EVIDÊNCIA SALVA!', '#35e0d0');
                  if (e.evidenceCountTotal >= 10) onUnlockAchievement('evidence_master');
                }

                if (en.isBoss) {
                  onUnlockAchievement('dump_slayer');
                  const currentPhase = PHASES[e.level - 1];
                  showToast(currentPhase.boss.dialogDefeated);
                  setTimeout(() => advancePhase(), 1200);
                } else {
                  maybeDropPowerup(en.x, en.y);
                }

                if (e.tickets === 1) onUnlockAchievement('first_blood');
              }
            }
          });

          // Check collision with player
          const hitPlayerBox =
            Math.abs(e.player.x - en.x) < (e.player.w + en.w) * 0.42 &&
            Math.abs(e.player.y - en.y) < (e.player.h + en.h) * 0.42;

          if (hitPlayerBox) {
            if (!en.isBoss) en.y = H + 200;
            hitPlayer();
          }

          // Enemy reaches bottom
          if (!en.isBoss && en.y > H + 40) {
            en.y = H + 200;
            hitPlayer(); // Missed ticket damages closing
          }
        });

        // Filter alive enemies
        e.enemies = e.enemies.filter((en) => en.y < H + 100 && en.hp > 0);

        // Update Particles
        e.particles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= p.decay;
        });
        e.particles = e.particles.filter((p) => p.alpha > 0);

        // Update Floating Texts
        e.floatingTexts.forEach((ft) => {
          ft.y += ft.vy;
          ft.life++;
        });
        e.floatingTexts = e.floatingTexts.filter((ft) => ft.life < ft.maxLife);

        // Sync React HUD state every 5 frames
        if (e.frame % 5 === 0) {
          setScore(e.score);
          setTickets(e.tickets);
          setSpecialMeter(e.specialMeter);
          setActiveBuffs({ ...e.buffs });
        }
      }

      // RENDER LOGIC
      ctx.save();

      // Screen shake translation
      if (e.screenShake > 0.5) {
        const shakeX = (Math.random() - 0.5) * e.screenShake;
        const shakeY = (Math.random() - 0.5) * e.screenShake;
        ctx.translate(shakeX, shakeY);
      }

      // Background
      const currentPhase = PHASES[Math.min(e.level - 1, PHASES.length - 1)];
      ctx.fillStyle = '#05111d';
      ctx.fillRect(0, 0, W, H);

      // Phase Glow Ambient
      const grad = ctx.createRadialGradient(W / 2, H / 3, 20, W / 2, H / 2, 450);
      grad.addColorStop(0, currentPhase.bgGlowColor);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Grid Lines
      ctx.strokeStyle = 'rgba(46, 111, 143, 0.12)';
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 48) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y < H; y += 48) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // Watermark code in background
      ctx.font = 'bold 72px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.fillText(currentPhase.tcode, W / 2, H / 2 + 30);

      // Stars
      e.stars.forEach((s) => {
        ctx.fillStyle = `rgba(130, 215, 240, ${s.alpha})`;
        ctx.fillRect(s.x, s.y, s.s, s.s);
      });

      // Bullets
      ctx.shadowColor = '#35e0d0';
      ctx.shadowBlur = 12;
      e.bullets.forEach((b) => {
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x - 3, b.y, 6, 16);
      });
      ctx.shadowBlur = 0;

      // Enemy Bullets
      e.enemyBullets.forEach((eb) => {
        ctx.fillStyle = '#ff5d6c';
        ctx.shadowColor = '#ff5d6c';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(eb.x, eb.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Powerups
      e.powerups.forEach((p) => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 15;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(-16, -16, 32, 32);
        ctx.fillStyle = 'rgba(8, 25, 42, 0.85)';
        ctx.fillRect(-16, -16, 32, 32);
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(p.icon, 0, 6);
        ctx.font = 'bold 8px "Chakra Petch", monospace';
        ctx.fillStyle = p.color;
        ctx.fillText(p.label, 0, 26);
        ctx.restore();
      });

      // Enemies
      e.enemies.forEach((en) => {
        ctx.save();
        ctx.translate(en.x, en.y);
        ctx.shadowColor = en.color;
        ctx.shadowBlur = en.isBoss ? 25 : 12;

        if (en.isBoss) {
          // Boss body
          ctx.fillStyle = en.color;
          ctx.fillRect(-en.w / 2, -en.h / 2, en.w, en.h);

          ctx.fillStyle = '#0b1d2e';
          ctx.fillRect(-en.w / 2 + 8, -en.h / 2 + 8, en.w - 16, en.h - 16);

          // Glowing cores / eyes
          ctx.fillStyle = en.color;
          ctx.fillRect(-en.w / 3, -10, 24, 16);
          ctx.fillRect(en.w / 3 - 24, -10, 24, 16);

          // Boss Title text
          ctx.font = 'bold 15px "Chakra Petch", monospace';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(en.label, 0, 6);

          ctx.font = 'bold 10px "JetBrains Mono", monospace';
          ctx.fillStyle = en.color;
          ctx.fillText(`HP: ${en.hp} / ${en.maxHp}`, 0, 24);
        } else {
          // Normal mob body
          ctx.fillStyle = en.color;
          ctx.fillRect(-en.w / 2, -en.h / 2, en.w, en.h);

          ctx.fillStyle = '#0a1d30';
          ctx.fillRect(-en.w / 2 + 4, -en.h / 2 + 4, en.w - 8, en.h - 8);

          // Icon / Symbol inside
          ctx.font = 'bold 18px "Chakra Petch", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#ffffff';
          const symbol =
            en.type === 'BUG' ? '🐛' : en.type === 'CUSTOM' ? '⚙️' : en.type === 'EVIDENCIA_ROGUE' ? '📄' : '🔴';
          ctx.fillText(symbol, 0, 5);

          ctx.font = 'bold 8px "Chakra Petch", monospace';
          ctx.fillStyle = en.color;
          ctx.fillText(en.label, 0, 25);
        }
        ctx.restore();
      });

      // Player
      if (e.player.invuln === 0 || Math.floor(e.frame / 6) % 2 === 0) {
        ctx.save();
        ctx.translate(e.player.x, e.player.y);

        // Shield aura if active
        if (e.buffs.shieldCount > 0) {
          ctx.strokeStyle = '#35e0d0';
          ctx.lineWidth = 3;
          ctx.shadowColor = '#35e0d0';
          ctx.shadowBlur = 18;
          ctx.beginPath();
          ctx.arc(0, 0, 36, 0, Math.PI * 2);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // Cafe boost aura
        if (e.buffs.cafeTimeRemaining > 0) {
          ctx.strokeStyle = '#ffad55';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.arc(0, 0, 32 + Math.sin(e.frame * 0.1) * 3, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Ship body
        ctx.shadowColor = character.color;
        ctx.shadowBlur = 16;
        ctx.fillStyle = character.color;
        ctx.beginPath();
        ctx.moveTo(0, -28);
        ctx.lineTo(24, 20);
        ctx.lineTo(0, 10);
        ctx.lineTo(-24, 20);
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#091d2d';
        ctx.fillRect(-12, -2, 24, 15);
        ctx.fillStyle = '#c7ff62';
        ctx.fillRect(-6, -18, 12, 8);

        // Thruster flame
        const flameH = Math.random() * 8 + 8;
        ctx.fillStyle = '#ff9248';
        ctx.beginPath();
        ctx.moveTo(-6, 12);
        ctx.lineTo(0, 12 + flameH);
        ctx.lineTo(6, 12);
        ctx.fill();

        // Player Name Pill
        ctx.font = 'bold 9px "Chakra Petch", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#edf7ff';
        ctx.fillText(character.name.toUpperCase(), 0, 34);

        ctx.restore();
      }

      // Particles
      e.particles.forEach((p) => {
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      });
      ctx.globalAlpha = 1;

      // Floating Texts
      e.floatingTexts.forEach((ft) => {
        const progress = ft.life / ft.maxLife;
        ctx.globalAlpha = 1 - progress;
        ctx.font = 'bold 12px "Chakra Petch", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, ft.x, ft.y);
      });
      ctx.globalAlpha = 1;

      // Combo Display in Canvas
      if (e.combo >= 3) {
        ctx.font = 'bold 16px "Chakra Petch", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillStyle = '#c7ff62';
        ctx.shadowColor = '#c7ff62';
        ctx.shadowBlur = 10;
        ctx.fillText(`COMBO ${e.combo}x! 🔥`, W - 25, 45);
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillStyle = '#8ca8bf';
        ctx.fillText('SUSTENTAÇÃO EM RITMO ACELERADO', W - 25, 60);
        ctx.shadowBlur = 0;
      }

      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [character, autoFire, shoot, hitPlayer, spawnEnemy, advancePhase, onUnlockAchievement]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-[#091726] border border-[#25445e] p-3 sm:p-5 shadow-[0_25px_80px_rgba(0,0,0,0.8)]">
      {/* HUD Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-3 mb-3 border-b border-[#1b3a54]">
        {/* Score */}
        <div className="bg-[#0b1f33] p-2.5 rounded-xl border border-[#1a3852]">
          <span className="block text-[10px] font-mono text-[#809bb3] uppercase tracking-wider">
            PONTUAÇÃO
          </span>
          <strong className="text-xl sm:text-2xl font-['Chakra_Petch'] font-bold text-[#c7ff62]">
            {score.toString().padStart(6, '0')}
          </strong>
        </div>

        {/* Phase / Level */}
        <div className="bg-[#0b1f33] p-2.5 rounded-xl border border-[#1a3852]">
          <span className="block text-[10px] font-mono text-[#809bb3] uppercase tracking-wider">
            FASE ATUAL
          </span>
          <div className="flex items-center gap-1.5">
            <strong className="text-xl sm:text-2xl font-['Chakra_Petch'] font-bold text-[#35e0d0]">
              FASE {currentLevel}
            </strong>
            <span className="text-[10px] font-mono text-[#8ca8bf]">/ 5</span>
          </div>
        </div>

        {/* Lives / Energy */}
        <div className="bg-[#0b1f33] p-2.5 rounded-xl border border-[#1a3852]">
          <span className="block text-[10px] font-mono text-[#809bb3] uppercase tracking-wider">
            ENERGIA DO KEY USER
          </span>
          <div className="flex items-center gap-1.5 text-xl text-[#ff5d6c] pt-0.5">
            {'♥ '.repeat(Math.max(0, lives)).trim() || '💀'}
          </div>
        </div>

        {/* Tickets resolved */}
        <div className="bg-[#0b1f33] p-2.5 rounded-xl border border-[#1a3852]">
          <span className="block text-[10px] font-mono text-[#809bb3] uppercase tracking-wider">
            CHAMADOS SALVOS
          </span>
          <strong className="text-xl sm:text-2xl font-['Chakra_Petch'] font-bold text-white">
            {tickets.toString().padStart(3, '0')}
          </strong>
        </div>
      </div>

      {/* Active Boss Bar (when boss is spawned) */}
      {activeBoss && (
        <div className="mb-3 p-3 rounded-xl bg-red-950/40 border border-red-500/50 animate-pulse">
          <div className="flex items-center justify-between text-xs font-['Chakra_Petch'] font-bold mb-1">
            <span className="text-red-400 flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              CHEFÃO ATIVO: {activeBoss.name}
            </span>
            <span className="text-white font-mono">
              HP: {activeBoss.hp} / {activeBoss.maxHp}
            </span>
          </div>
          <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden border border-red-900">
            <div
              className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400 transition-all duration-200"
              style={{ width: `${Math.max(0, (activeBoss.hp / activeBoss.maxHp) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Special Meter & Buff Status Line */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 bg-[#081726] p-2 rounded-xl border border-[#16334a] text-xs">
        {/* Special Meter */}
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <span className="font-['Chakra_Petch'] font-bold text-[#8ca8bf] text-[11px] shrink-0">
            ESPECIAL [X]:
          </span>
          <div className="flex-1 h-3 bg-[#050e18] rounded-full overflow-hidden border border-[#214360] relative">
            <div
              className="h-full bg-gradient-to-r from-[#35e0d0] via-[#c7ff62] to-[#ffad55] transition-all duration-300"
              style={{ width: `${specialMeter}%` }}
            />
            {specialMeter >= 100 && (
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-['Chakra_Petch'] font-bold text-black tracking-widest animate-pulse">
                PRONTO! PRESSIONE [X]
              </span>
            )}
          </div>
        </div>

        {/* Active Powerups indicators */}
        <div className="flex items-center gap-2">
          {activeBuffs.shieldCount > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#35e0d0]/15 text-[#35e0d0] border border-[#35e0d0]/30 font-mono text-[10px]">
              <Shield size={12} /> ESCUDO ({activeBuffs.shieldCount})
            </span>
          )}
          {activeBuffs.cafeTimeRemaining > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#ffad55]/15 text-[#ffad55] border border-[#ffad55]/30 font-mono text-[10px]">
              <Coffee size={12} /> CAFÉ EXTRA
            </span>
          )}
          {activeBuffs.tripleShotTimeRemaining > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#c7ff62]/15 text-[#c7ff62] border border-[#c7ff62]/30 font-mono text-[10px]">
              <Zap size={12} /> TIRO TRIPLO
            </span>
          )}
          {activeBuffs.debugTimeRemaining > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#b88cff]/15 text-[#b88cff] border border-[#b88cff]/30 font-mono text-[10px]">
              <Flame size={12} /> /h SLOW MO
            </span>
          )}
        </div>
      </div>

      {/* Canvas Frame Container */}
      <div className="relative w-full border border-[#2b5472] rounded-xl overflow-hidden bg-[#040e18] shadow-[inset_0_0_50px_rgba(0,0,0,0.9)]">
        <canvas
          ref={canvasRef}
          width={960}
          height={540}
          className="w-full h-auto block aspect-video image-pixelated select-none"
        />

        {/* 2D / 2.5D Badge & Quick Switch */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-[#163750] border border-[#2b5880] text-[#8ca8bf] font-mono text-[10px] font-bold tracking-wider">
            VISÃO: 2D CLÁSSICO
          </span>
          {onSwitchTo25D && (
            <button
              onClick={onSwitchTo25D}
              className="px-2 py-0.5 rounded bg-[#35e0d0]/20 hover:bg-[#35e0d0]/30 border border-[#35e0d0]/50 text-[#35e0d0] font-['Chakra_Petch'] text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow"
            >
              <Layers size={11} /> Ativar Modo 2.5D
            </button>
          )}
        </div>

        {/* Optional CRT Scanlines Effect Overlay */}
        {scanlines && (
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] opacity-80 mix-blend-overlay">
            <div className="w-full h-full bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]" />
          </div>
        )}

        {/* Toast Banner */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#ff5d6c] text-white px-4 py-2 rounded-lg font-['Chakra_Petch'] font-bold text-xs sm:text-sm tracking-wider shadow-[0_0_25px_rgba(255,93,108,0.6)] animate-bounce z-20 pointer-events-none text-center">
            {toastMessage}
          </div>
        )}

        {/* OVERLAYS: START SCREEN, GAMEOVER, VICTORY */}
        {gameState !== 'playing' && (
          <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-gradient-to-b from-[#061423ea] to-[#040d16fa] backdrop-blur-sm">
            {gameState === 'idle' && (
              <div className="max-w-md w-full text-center bg-[#0a1e33]/90 border border-[#2d587c] rounded-2xl p-6 sm:p-8 shadow-[0_15px_60px_rgba(0,0,0,0.9)]">
                <span className="text-[10px] font-mono text-[#35e0d0] tracking-widest uppercase block mb-1">
                  INCIDENTE CRÍTICO • PRIORIDADE MÁXIMA
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold font-['Chakra_Petch'] text-white mb-2">
                  A Folha está em Risco!
                </h2>
                <p className="text-xs sm:text-sm text-[#9eb6cc] leading-relaxed mb-6">
                  Você é o <b className="text-[#35e0d0]">{character.name}</b>. Elimine os chamados, colete
                  evidências, desbloqueie a SM12 e sobreviva aos chefões do DP até o grande Fechamento do Mês!
                </p>

                <div className="space-y-3">
                  <button
                    onClick={startGame}
                    className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#35e0d0] via-[#c7ff62] to-[#35e0d0] text-[#071521] font-['Chakra_Petch'] font-bold text-base tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-[0_0_30px_rgba(53,224,208,0.4)] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Play size={18} /> INICIAR MISSÃO DO FECHAMENTO
                  </button>

                  <button
                    onClick={onOpenCharacterSelect}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#122a42] hover:bg-[#1a3a5c] border border-[#254d72] text-[#8ca8bf] hover:text-white font-['Chakra_Petch'] text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <SlidersHorizontal size={14} /> Trocar Perfil ({character.name})
                  </button>
                </div>

                <div className="mt-6 pt-4 border-t border-[#18354e] text-[11px] font-mono text-[#6d8a9f] space-y-1">
                  <p>← → ou A / D para mover • ESPAÇO para disparar</p>
                  <p>X para Habilidade Especial • P para pausar</p>
                </div>
              </div>
            )}

            {gameState === 'gameover' && (
              <div className="max-w-md w-full text-center bg-[#150a10]/95 border border-red-700/60 rounded-2xl p-6 sm:p-8 shadow-[0_15px_60px_rgba(255,0,0,0.4)] animate-fadeIn">
                <span className="text-[10px] font-mono text-red-400 tracking-widest uppercase block mb-1">
                  STATUS: SLA ESTOURADO
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold font-['Chakra_Petch'] text-red-400 mb-2">
                  GAME OVER — CHAMADO REABERTO!
                </h2>
                <p className="text-xs sm:text-sm text-[#d4a5b0] leading-relaxed mb-4">
                  A folha parou, o prazo das 18h venceu e alguém comentou no Teams:
                  <br />
                  <em className="text-white italic">“Mês passado estava funcionando!”</em>
                </p>

                {/* Score recap box */}
                <div className="bg-[#240e18] border border-red-900/60 rounded-xl p-4 my-4 grid grid-cols-2 gap-3 text-left">
                  <div>
                    <span className="text-[10px] font-mono text-red-300">PONTUAÇÃO FINAL</span>
                    <strong className="block text-xl font-['Chakra_Petch'] text-white">
                      {score.toLocaleString('pt-BR')}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-red-300">CHAMADOS RESOLVIDOS</span>
                    <strong className="block text-xl font-['Chakra_Petch'] text-[#c7ff62]">
                      {tickets}
                    </strong>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={startGame}
                    className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-['Chakra_Petch'] font-bold text-base tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,80,80,0.4)] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCcw size={18} /> TENTAR FECHAR A FOLHA NOVAMENTE
                  </button>

                  <button
                    onClick={() => onOpenLinkedInShare(score, tickets, currentLevel, false)}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#0077b5] hover:bg-[#0088cc] text-white font-['Chakra_Petch'] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow"
                  >
                    <Share2 size={15} /> Compartilhar Sobrevivência no LinkedIn
                  </button>
                </div>
              </div>
            )}

            {gameState === 'victory' && (
              <div className="max-w-lg w-full text-center bg-[#071926]/95 border border-[#c7ff62]/60 rounded-2xl p-6 sm:p-8 shadow-[0_15px_60px_rgba(199,255,98,0.3)] animate-fadeIn">
                <span className="text-4xl mb-2 block">🏆</span>
                <span className="text-[10px] font-mono text-[#c7ff62] tracking-widest uppercase block mb-1">
                  SUCESSO TOTAL • AUDITORIA APROVADA
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold font-['Chakra_Petch'] text-[#c7ff62] mb-2">
                  FOLHA FECHADA COM SUCESSO!
                </h2>
                <p className="text-xs sm:text-sm text-[#b2d5ed] leading-relaxed mb-4">
                  Você sobreviveu ao Grande Chefão Final! A contabilidade confirmou saldo zero, o arquivo bancário
                  foi transmitido e os salários estão garantidos na conta!
                </p>

                {/* Score recap box */}
                <div className="bg-[#0b2438] border border-[#20496d] rounded-xl p-4 my-4 grid grid-cols-2 gap-3 text-left">
                  <div>
                    <span className="text-[10px] font-mono text-[#8ca8bf]">PONTUAÇÃO DE ELITE</span>
                    <strong className="block text-xl font-['Chakra_Petch'] text-[#c7ff62]">
                      {score.toLocaleString('pt-BR')}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-[#8ca8bf]">TOTAL DE CHAMADOS</span>
                    <strong className="block text-xl font-['Chakra_Petch'] text-[#35e0d0]">
                      {tickets}
                    </strong>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => onOpenLinkedInShare(score, tickets, currentLevel, true)}
                    className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#0077b5] to-[#0099e5] text-white font-['Chakra_Petch'] font-bold text-base tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-[0_0_25px_rgba(0,119,181,0.5)] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Share2 size={18} /> GERAR CERTIFICADO & COMPARTILHAR NO LINKEDIN
                  </button>

                  <button
                    onClick={startGame}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#122e47] hover:bg-[#1a3e5f] border border-[#254d72] text-[#c7ff62] font-['Chakra_Petch'] text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCcw size={14} /> Iniciar Novo Fechamento
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls Bar & Mobile Touch Controls */}
      <div className="mt-4 pt-3 border-t border-[#18354e] flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[#82a0b8]">
        {/* Keyboard instructions */}
        <div className="hidden sm:flex items-center gap-2">
          <span className="px-2 py-1 rounded bg-[#102438] border border-[#234563] text-white font-['Chakra_Petch']">
            ← →
          </span>
          <span>MOVER</span>
          <span className="text-[#3b5974]">/</span>
          <span className="px-2 py-1 rounded bg-[#102438] border border-[#234563] text-white font-['Chakra_Petch']">
            ESPAÇO
          </span>
          <span>DISPARAR</span>
          <span className="text-[#3b5974]">/</span>
          <span className="px-2 py-1 rounded bg-[#102438] border border-[#234563] text-[#c7ff62] font-['Chakra_Petch']">
            X
          </span>
          <span>ESPECIAL</span>
        </div>

        {/* Auto-fire toggle */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoFire}
              onChange={(e) => setAutoFire(e.target.checked)}
              className="w-4 h-4 rounded bg-[#0b1d2e] border-[#254c70] text-[#35e0d0] focus:ring-0 cursor-pointer"
            />
            <span className="text-xs font-['Chakra_Petch'] text-[#9ec4df]">
              Auto-Disparo Contínuo
            </span>
          </label>
        </div>

        {/* Mobile touch buttons for phones / tablets */}
        <div className="flex sm:hidden w-full items-center justify-between gap-2 pt-2">
          <div className="flex gap-2">
            <button
              onPointerDown={(ev) => {
                ev.preventDefault();
                engineRef.current.keys.left = true;
              }}
              onPointerUp={() => (engineRef.current.keys.left = false)}
              onPointerLeave={() => (engineRef.current.keys.left = false)}
              className="w-12 h-12 rounded-xl bg-[#12283e] active:bg-[#1a3856] border border-[#254868] text-xl font-bold flex items-center justify-center text-white"
            >
              ◀
            </button>
            <button
              onPointerDown={(ev) => {
                ev.preventDefault();
                engineRef.current.keys.right = true;
              }}
              onPointerUp={() => (engineRef.current.keys.right = false)}
              onPointerLeave={() => (engineRef.current.keys.right = false)}
              className="w-12 h-12 rounded-xl bg-[#12283e] active:bg-[#1a3856] border border-[#254868] text-xl font-bold flex items-center justify-center text-white"
            >
              ▶
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={triggerSpecial}
              className={`h-12 px-3 rounded-xl border font-['Chakra_Petch'] font-bold text-xs flex items-center justify-center gap-1 ${
                specialMeter >= 100
                  ? 'bg-gradient-to-r from-[#ffad55] to-[#c7ff62] text-black border-transparent animate-pulse'
                  : 'bg-[#102438] text-[#6d8a9f] border-[#214360]'
              }`}
            >
              <Zap size={14} /> ESPECIAL
            </button>

            <button
              onPointerDown={(ev) => {
                ev.preventDefault();
                engineRef.current.keys.fire = true;
              }}
              onPointerUp={() => (engineRef.current.keys.fire = false)}
              onPointerLeave={() => (engineRef.current.keys.fire = false)}
              className="w-14 h-12 rounded-xl bg-gradient-to-r from-[#35e0d0] to-[#c7ff62] active:brightness-90 text-[#071521] font-bold text-xl flex items-center justify-center shadow-[0_0_15px_rgba(53,224,208,0.4)]"
            >
              ✦
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
