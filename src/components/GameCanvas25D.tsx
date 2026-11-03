import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import confetti from 'canvas-confetti';
import {
  CharacterProfile,
  Enemy,
  Bullet,
  PowerUpItem,
  ActiveBuffs,
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
  onSwitchTo2D: () => void;
}

// Check software WebGL renderer for performance pacing
const isSoftwareGl = (() => {
  if (typeof document === 'undefined') return true;
  const gl = document.createElement('canvas').getContext('webgl2');
  if (!gl) return true;
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
  const gpu = String(gl.getParameter(param));
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
})();

export const GameCanvas25D: React.FC<Props> = ({
  character,
  scanlines,
  onOpenLinkedInShare,
  onOpenCharacterSelect,
  onUnlockAchievement,
  onSaveScore,
  setCurrentTcode,
  onSwitchTo2D,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // React state for HUD
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover' | 'victory'>('idle');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [tickets, setTickets] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [specialMeter, setSpecialMeter] = useState(0);
  const [activeBoss, setActiveBoss] = useState<{ name: string; hp: number; maxHp: number; color: string } | null>(null);
  const [activeBuffs, setActiveBuffs] = useState<ActiveBuffs>({
    cafeTimeRemaining: 0,
    shieldCount: 0,
    debugTimeRemaining: 0,
    tripleShotTimeRemaining: 0,
  });
  const [autoFire, setAutoFire] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Engine state refs
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
    combo: 0,
    comboTimer: 0,
    coffeeCountTotal: 0,
    evidenceCountTotal: 0,
    playerX: 0, // In 3D units: -8 to +8 (as in PlayerController.cs!)
    playerTargetX: 0,
    playerTilt: 0,
    playerCooldown: 0,
    playerInvuln: 0,
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
    },
    enemies: [] as (Enemy & { mesh?: THREE.Group; meshY?: number; meshX?: number })[],
    bullets: [] as (Bullet & { mesh?: THREE.Mesh })[],
    enemyBullets: [] as { x: number; y: number; vx: number; vy: number; mesh?: THREE.Mesh }[],
    powerups: [] as (PowerUpItem & { mesh?: THREE.Group })[],
    particles: [] as { mesh: THREE.Mesh; vx: number; vy: number; vz: number; life: number; maxLife: number }[],
  });

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 1800);
  }, []);

  // End Game
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
    e.playerX = 0;
    e.playerTargetX = 0;
    e.playerTilt = 0;
    e.playerInvuln = 0;
    e.playerCooldown = 0;
    e.buffs = {
      cafeTimeRemaining: 0,
      shieldCount: 0,
      debugTimeRemaining: 0,
      tripleShotTimeRemaining: 0,
    };

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

  // Special skill trigger
  const triggerSpecial = useCallback(() => {
    const e = engineRef.current;
    if (e.specialMeter < 100) return;

    e.specialMeter = 0;
    setSpecialMeter(0);

    if (character.id === 'keyuser') {
      sounds.playSM12Nuke();
      showToast('🔓 SM12: TODAS AS TABELAS DESBLOQUEADAS!');
      e.enemies.forEach((en) => {
        if (en.isBoss) {
          en.hp = Math.max(1, en.hp - 18);
        } else {
          en.hp = 0;
          e.score += en.points;
          e.tickets++;
        }
      });
      onUnlockAchievement('sm12_hero');
    } else if (character.id === 'consultor') {
      sounds.playPowerup();
      e.buffs.shieldCount += 2;
      showToast('📄 NOTA SAP OSS: ESCUDO DUPLO ATIVADO!');
    } else if (character.id === 'analista') {
      sounds.playEvidencePickup();
      if (e.lives < 4) {
        e.lives++;
        setLives(e.lives);
      }
      e.score += 500;
      showToast('🧮 AUDITORIA CONCLUÍDA: +1 VIDA & +500 PTS!');
    } else if (character.id === 'abaper') {
      sounds.playPowerup();
      e.buffs.debugTimeRemaining = 360;
      showToast('🐛 DEBUG /h: AMBIENTE CONGELADO EM SLOW MOTION!');
    }
  }, [character, onUnlockAchievement, showToast]);

  // Keyboard controls
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

  // 3D Scene Initialization
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene & Fog
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050e18);
    scene.fog = new THREE.FogExp2(0x050e18, 0.035);

    // Camera (2.5D perspective)
    const camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 100);
    camera.position.set(0, -9.5, 9.5);
    camera.lookAt(0, 1.2, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientWidth * (9 / 16));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Studio Environment map
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Lighting
    const ambientLight = new THREE.HemisphereLight(0x35e0d0, 0x050e18, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(4, -5, 12);
    dirLight.castShadow = !isSoftwareGl;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // Cyberspace Moving Grid Floor
    const gridTextureCanvas = document.createElement('canvas');
    gridTextureCanvas.width = 256;
    gridTextureCanvas.height = 256;
    const gctx = gridTextureCanvas.getContext('2d')!;
    gctx.fillStyle = '#05111d';
    gctx.fillRect(0, 0, 256, 256);
    gctx.strokeStyle = '#1e486d';
    gctx.lineWidth = 2;
    gctx.strokeRect(0, 0, 256, 256);
    gctx.strokeStyle = 'rgba(53, 224, 208, 0.25)';
    gctx.strokeRect(16, 16, 224, 224);

    const gridTexture = new THREE.CanvasTexture(gridTextureCanvas);
    gridTexture.wrapS = THREE.RepeatWrapping;
    gridTexture.wrapT = THREE.RepeatWrapping;
    gridTexture.repeat.set(12, 24);
    gridTexture.colorSpace = THREE.SRGBColorSpace;
    gridTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const floorGeo = new THREE.PlaneGeometry(36, 60);
    const floorMat = new THREE.MeshStandardMaterial({
      map: gridTexture,
      roughness: 0.35,
      metalness: 0.2,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.set(0, 5, -0.1);
    floorMesh.receiveShadow = !isSoftwareGl;
    scene.add(floorMesh);

    // --- PLAYER 3D COMPOSITE MODEL (3-12 parts) ---
    const playerGroup = new THREE.Group();

    // 1. Primary Hull: Chevron body
    const hullShape = new THREE.Shape();
    hullShape.moveTo(0, 0.9);
    hullShape.lineTo(0.7, -0.6);
    hullShape.lineTo(0, -0.3);
    hullShape.lineTo(-0.7, -0.6);
    hullShape.closePath();

    const extrudeSettings = { depth: 0.3, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.05, bevelThickness: 0.05 };
    const hullGeo = new THREE.ExtrudeGeometry(hullShape, extrudeSettings);
    hullGeo.center();

    const charColor = new THREE.Color(character.color);
    const hullMat = new THREE.MeshStandardMaterial({
      color: charColor,
      metalness: 0.75,
      roughness: 0.25,
      emissive: charColor,
      emissiveIntensity: 0.15,
    });
    const hullMesh = new THREE.Mesh(hullGeo, hullMat);
    hullMesh.castShadow = !isSoftwareGl;
    playerGroup.add(hullMesh);

    // 2. Cockpit Canopy (Translucent glass)
    const cockpitGeo = new THREE.BoxGeometry(0.3, 0.5, 0.22);
    const cockpitMat = new THREE.MeshStandardMaterial({
      color: 0xedf7ff,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0x35e0d0,
      emissiveIntensity: 0.4,
    });
    const cockpitMesh = new THREE.Mesh(cockpitGeo, cockpitMat);
    cockpitMesh.position.set(0, 0.1, 0.2);
    playerGroup.add(cockpitMesh);

    // 3. Left & Right Plasma Cannons
    const cannonGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8);
    const cannonMat = new THREE.MeshStandardMaterial({ color: 0x183752, metalness: 0.8, roughness: 0.2 });
    const leftCannon = new THREE.Mesh(cannonGeo, cannonMat);
    leftCannon.position.set(-0.45, 0.2, 0);
    const rightCannon = leftCannon.clone();
    rightCannon.position.set(0.45, 0.2, 0);
    playerGroup.add(leftCannon);
    playerGroup.add(rightCannon);

    // 4. Dual Thrusters with glowing exhaust
    const thrusterGeo = new THREE.ConeGeometry(0.12, 0.4, 8);
    const thrusterMat = new THREE.MeshStandardMaterial({
      color: 0xff7b25,
      emissive: 0xff5500,
      emissiveIntensity: 1.2,
      roughness: 0.4,
    });
    const leftThruster = new THREE.Mesh(thrusterGeo, thrusterMat);
    leftThruster.rotation.x = Math.PI;
    leftThruster.position.set(-0.25, -0.65, 0);
    const rightThruster = leftThruster.clone();
    rightThruster.position.set(0.25, -0.65, 0);
    playerGroup.add(leftThruster);
    playerGroup.add(rightThruster);

    // Dynamic Thruster Point Light
    const thrusterLight = new THREE.PointLight(0xff7722, 1.5, 3);
    thrusterLight.position.set(0, -0.7, 0.2);
    playerGroup.add(thrusterLight);

    // Shield Dome Mesh (visible when buff active)
    const shieldGeo = new THREE.SphereGeometry(1.2, 16, 16);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0x35e0d0,
      emissive: 0x35e0d0,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.35,
      wireframe: true,
    });
    const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    shieldMesh.visible = false;
    playerGroup.add(shieldMesh);

    playerGroup.position.set(0, -4.2, 0.5);
    scene.add(playerGroup);

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = w * (9 / 16);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Helpers to create Enemy 3D Mesh
    const createEnemyMesh = (en: Enemy): THREE.Group => {
      const g = new THREE.Group();
      const col = new THREE.Color(en.color);

      if (en.isBoss) {
        // Boss 3D Monolith Structure
        const bodyGeo = new THREE.BoxGeometry(3.5, 1.4, 0.8);
        const bodyMat = new THREE.MeshStandardMaterial({
          color: col,
          metalness: 0.8,
          roughness: 0.2,
          emissive: col,
          emissiveIntensity: 0.35,
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.castShadow = !isSoftwareGl;
        g.add(body);

        // Core pulsating orb
        const coreGeo = new THREE.SphereGeometry(0.4, 16, 16);
        const coreMat = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: col,
          emissiveIntensity: 1.5,
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        core.position.set(0, 0, 0.3);
        g.add(core);
      } else {
        // Regular mob 3D block
        const mobGeo = new THREE.BoxGeometry(0.9, 0.9, 0.3);
        const mobMat = new THREE.MeshStandardMaterial({
          color: col,
          metalness: 0.65,
          roughness: 0.3,
          emissive: col,
          emissiveIntensity: 0.2,
        });
        const mob = new THREE.Mesh(mobGeo, mobMat);
        mob.castShadow = !isSoftwareGl;
        g.add(mob);

        // Inner glowing symbol frame
        const innerGeo = new THREE.BoxGeometry(0.65, 0.65, 0.35);
        const innerMat = new THREE.MeshStandardMaterial({
          color: 0x071524,
          metalness: 0.9,
          roughness: 0.1,
        });
        const inner = new THREE.Mesh(innerGeo, innerMat);
        g.add(inner);
      }

      g.position.set(en.meshX || 0, en.meshY || 7, 0.5);
      scene.add(g);
      return g;
    };

    // Helper to create Bullet 3D Mesh
    const bulletGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.5, 8);
    const bulletMat = new THREE.MeshStandardMaterial({
      color: 0x35e0d0,
      emissive: 0x35e0d0,
      emissiveIntensity: 1.5,
      roughness: 0.1,
    });

    const createBulletMesh = (b: Bullet): THREE.Mesh => {
      const bCol = new THREE.Color(b.color);
      const bMat = b.color === '#35e0d0' ? bulletMat : new THREE.MeshStandardMaterial({
        color: bCol,
        emissive: bCol,
        emissiveIntensity: 1.5,
      });
      const m = new THREE.Mesh(bulletGeo, bMat);
      m.position.set(b.x, b.y, 0.5);
      scene.add(m);
      return m;
    };

    // Helper to create PowerUp 3D Mesh
    const powerupGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
    const createPowerupMesh = (p: PowerUpItem): THREE.Group => {
      const g = new THREE.Group();
      const pCol = new THREE.Color(p.color);
      const m = new THREE.Mesh(
        powerupGeo,
        new THREE.MeshStandardMaterial({
          color: pCol,
          emissive: pCol,
          emissiveIntensity: 0.8,
          wireframe: false,
          metalness: 0.7,
        })
      );
      g.add(m);
      g.position.set(p.x, p.y, 0.5);
      scene.add(g);
      return g;
    };

    // Player shoot logic (Unity PlayerController / Bullet.cs match)
    const doShoot = () => {
      const e = engineRef.current;
      if (e.playerCooldown > 0) return;

      const isTriple = e.buffs.tripleShotTimeRemaining > 0;
      const isCafe = e.buffs.cafeTimeRemaining > 0;
      const baseCooldown = isCafe ? Math.floor(character.fireRate * 0.6) : character.fireRate;
      e.playerCooldown = Math.max(4, baseCooldown);

      const dmg = character.damageMultiplier;
      sounds.playShoot();

      // In 3D space: player is at (e.playerX, -4.2)
      if (isTriple) {
        const b1: Bullet = { id: Math.random(), x: e.playerX, y: -3.8, vx: 0, vy: 14, damage: dmg, color: '#c7ff62' };
        const b2: Bullet = { id: Math.random(), x: e.playerX - 0.2, y: -3.8, vx: -3.2, vy: 13, damage: dmg, color: '#35e0d0' };
        const b3: Bullet = { id: Math.random(), x: e.playerX + 0.2, y: -3.8, vx: 3.2, vy: 13, damage: dmg, color: '#35e0d0' };
        b1.mesh = createBulletMesh(b1);
        b2.mesh = createBulletMesh(b2);
        b3.mesh = createBulletMesh(b3);
        e.bullets.push(b1, b2, b3);
      } else {
        const b: Bullet = { id: Math.random(), x: e.playerX, y: -3.8, vx: 0, vy: 14, damage: dmg, color: '#35e0d0' };
        b.mesh = createBulletMesh(b);
        e.bullets.push(b);
      }
    };

    // Spawn Enemy in 3D (SpawnManager.cs: Range -8f to 8f, pos.y = 6.5f)
    const doSpawnEnemy = () => {
      const e = engineRef.current;
      const currentPhase = PHASES[Math.min(e.level - 1, PHASES.length - 1)];

      if (e.ticketsInPhase >= currentPhase.targetTickets && !e.bossActive && !e.bossSpawnedInPhase) {
        e.bossActive = true;
        e.bossSpawnedInPhase = true;
        sounds.playBossAlert();
        showToast(currentPhase.boss.dialogIntro);

        const bossEn: Enemy & { mesh?: THREE.Group; meshX?: number; meshY?: number } = {
          id: Date.now(),
          x: 0,
          y: 0,
          w: 3.5,
          h: 1.4,
          hp: currentPhase.boss.hp,
          maxHp: currentPhase.boss.hp,
          type: 'DUMP_ST22',
          label: currentPhase.boss.name,
          color: currentPhase.boss.color,
          vy: 0.8,
          vx: 2.2,
          points: 2000,
          isBoss: true,
          bossPhase: e.level,
          patternTimer: 0,
          meshX: 0,
          meshY: 6.5,
        };
        bossEn.mesh = createEnemyMesh(bossEn);
        e.enemies.push(bossEn);
        setActiveBoss({
          name: currentPhase.boss.name,
          hp: currentPhase.boss.hp,
          maxHp: currentPhase.boss.hp,
          color: currentPhase.boss.color,
        });
        return;
      }

      if (e.bossActive) return;

      const types = [
        { type: 'CHAMADO' as const, label: 'CHAMADO P1', color: '#ff5d6c', hp: 1, points: 100 },
        { type: 'BUG' as const, label: 'BUG EM PRD', color: '#b88cff', hp: 1, points: 120 },
        { type: 'CUSTOM' as const, label: 'CUSTOMIZAÇÃO', color: '#ffad55', hp: 2, points: 180 },
        { type: 'EVIDENCIA_ROGUE' as const, label: 'EVIDÊNCIA', color: '#35e0d0', hp: 1, points: 80 },
      ];
      const pick = types[Math.floor(Math.random() * types.length)];
      const speedMult = currentPhase.enemySpeedMultiplier;

      // Spawn pos between -7.5f and +7.5f
      const spawnX = (Math.random() - 0.5) * 15;
      const newEn: Enemy & { mesh?: THREE.Group; meshX?: number; meshY?: number } = {
        id: Math.random(),
        x: 0,
        y: 0,
        w: 0.9,
        h: 0.9,
        hp: pick.hp,
        maxHp: pick.hp,
        type: pick.type,
        label: pick.label,
        color: pick.color,
        vy: (Math.random() * 1.5 + 2.8) * speedMult,
        vx: pick.type === 'BUG' ? (Math.random() > 0.5 ? 1.5 : -1.5) : 0,
        points: pick.points,
        patternTimer: 0,
        meshX: spawnX,
        meshY: 6.5,
      };
      newEn.mesh = createEnemyMesh(newEn);
      e.enemies.push(newEn);
    };

    // Hit Player
    const doHitPlayer = () => {
      const e = engineRef.current;
      if (e.playerInvuln > 0) return;

      if (e.buffs.shieldCount > 0) {
        e.buffs.shieldCount--;
        e.playerInvuln = 45;
        sounds.playTone(400, 0.15, 'triangle', 0.04);
        return;
      }

      e.lives--;
      setLives(e.lives);
      e.playerInvuln = 90;
      e.combo = 0;
      sounds.playHit();
      showToast('⚠ ENERGIA DO KEY USER REDUZIDA!');

      if (e.lives <= 0) {
        endGame(false);
      }
    };

    // Main 3D Animation Loop
    let frameId = 0;
    const clock = new THREE.Clock();

    const tick = () => {
      const delta = Math.min(clock.getDelta(), 0.08);
      const e = engineRef.current;

      // Floor scrolling in 2.5D
      gridTexture.offset.y -= delta * (e.buffs.cafeTimeRemaining > 0 ? 0.7 : 0.4);

      if (e.running) {
        e.frame++;
        const timeScale = e.buffs.debugTimeRemaining > 0 ? 0.35 : 1.0;

        // Player movement (PlayerController.cs clamped in [-8f, 8f])
        const moveSpeed = (e.buffs.cafeTimeRemaining > 0 ? 12 : 9.5) * (character.speed / 6.2);
        let moveDir = 0;
        if (e.keys.left) moveDir -= 1;
        if (e.keys.right) moveDir += 1;

        e.playerX += moveDir * moveSpeed * delta;
        e.playerX = THREE.MathUtils.clamp(e.playerX, -7.5, 7.5);

        // Banking tilt rotation
        const targetTilt = -moveDir * 0.35;
        e.playerTilt = THREE.MathUtils.damp(e.playerTilt, targetTilt, 12, delta);

        playerGroup.position.x = e.playerX;
        playerGroup.rotation.y = e.playerTilt;
        playerGroup.rotation.z = -e.playerTilt * 0.5;

        // Invulnerability flicker
        playerGroup.visible = e.playerInvuln === 0 || Math.floor(e.frame / 5) % 2 === 0;

        // Shield visibility
        shieldMesh.visible = e.buffs.shieldCount > 0;
        shieldMesh.rotation.y += delta * 1.5;

        // Shooting
        if (e.keys.fire || autoFire) {
          doShoot();
        }

        if (e.playerCooldown > 0) e.playerCooldown--;
        if (e.playerInvuln > 0) e.playerInvuln--;

        // Buffs decay
        if (e.buffs.cafeTimeRemaining > 0) e.buffs.cafeTimeRemaining--;
        if (e.buffs.debugTimeRemaining > 0) e.buffs.debugTimeRemaining--;
        if (e.buffs.tripleShotTimeRemaining > 0) e.buffs.tripleShotTimeRemaining--;

        // Spawn interval
        const spawnInterval = Math.max(22, 65 - e.level * 6);
        if (e.frame % spawnInterval === 0) {
          doSpawnEnemy();
        }

        // Bullets update
        e.bullets.forEach((b) => {
          b.y += b.vy * delta;
          b.x += b.vx * delta;
          if (b.mesh) {
            b.mesh.position.set(b.x, b.y, 0.5);
          }
        });

        // Filter and cleanup offscreen bullets
        e.bullets = e.bullets.filter((b) => {
          if (b.y > 7.5 || b.y < -6) {
            if (b.mesh) scene.remove(b.mesh);
            return false;
          }
          return true;
        });

        // Enemies update
        e.enemies.forEach((en) => {
          const ey = (en.meshY ?? 6.5) - en.vy * delta * timeScale;
          let ex = (en.meshX ?? 0) + en.vx * delta * timeScale;

          if (ex < -7.5 || ex > 7.5) en.vx *= -1;

          if (en.isBoss) {
            en.patternTimer = (en.patternTimer || 0) + 1;
            ex = Math.sin(en.patternTimer * 0.04) * 4.5;
            en.meshY = Math.max(3.2, (en.meshY ?? 6.5) - 0.5 * delta);
          } else {
            en.meshY = ey;
          }
          en.meshX = ex;

          if (en.mesh) {
            en.mesh.position.set(en.meshX, en.meshY ?? 6.5, 0.5);
            en.mesh.rotation.y += delta * 1.2;
          }

          // Bullet hits enemy (Bullet.cs OnTriggerEnter2D)
          e.bullets.forEach((b) => {
            const hitDist = Math.hypot(b.x - (en.meshX ?? 0), b.y - (en.meshY ?? 0));
            const hitbox = en.isBoss ? 1.8 : 0.65;

            if (hitDist < hitbox) {
              b.y = 99; // mark dead
              en.hp -= b.damage;

              if (en.hp <= 0) {
                sounds.playEnemyExplode(en.isBoss);
                if (en.mesh) scene.remove(en.mesh);

                const pts = en.points * (1 + e.combo * 0.1);
                e.score += Math.round(pts);
                e.tickets++;
                e.ticketsInPhase++;
                e.combo++;
                e.comboTimer = 140;
                e.specialMeter = Math.min(100, e.specialMeter + (en.isBoss ? 50 : 8));

                if (en.type === 'EVIDENCIA_ROGUE') {
                  e.evidenceCountTotal++;
                  sounds.playEvidencePickup();
                  if (e.evidenceCountTotal >= 10) onUnlockAchievement('evidence_master');
                }

                if (en.isBoss) {
                  onUnlockAchievement('dump_slayer');
                  const curPh = PHASES[e.level - 1];
                  showToast(curPh.boss.dialogDefeated);
                  setTimeout(() => advancePhase(), 1200);
                }

                if (e.tickets === 1) onUnlockAchievement('first_blood');
              }
            }
          });

          // Check hit with player (Enemy.cs)
          const distToPlayer = Math.hypot((en.meshX ?? 0) - e.playerX, (en.meshY ?? 0) - (-4.2));
          if (distToPlayer < (en.isBoss ? 2.0 : 0.85)) {
            if (!en.isBoss) {
              if (en.mesh) scene.remove(en.mesh);
              en.hp = 0;
            }
            doHitPlayer();
          }

          // Enemy reached bottom of screen (Enemy.cs: if transform.position.y < -6f -> LoseHealth(1))
          if (!en.isBoss && (en.meshY ?? 6.5) < -5.5) {
            if (en.mesh) scene.remove(en.mesh);
            en.hp = 0;
            doHitPlayer();
          }
        });

        // Filter living enemies
        e.enemies = e.enemies.filter((en) => en.hp > 0);

        // Sync React HUD state
        if (e.frame % 5 === 0) {
          setScore(e.score);
          setTickets(e.tickets);
          setSpecialMeter(e.specialMeter);
          setActiveBuffs({ ...e.buffs });
          if (e.bossActive) {
            const boss = e.enemies.find((en) => en.isBoss);
            if (boss) {
              setActiveBoss({
                name: boss.label,
                hp: boss.hp,
                maxHp: boss.maxHp,
                color: boss.color,
              });
            }
          }
        }
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        // Pacing for software WebGL
        const gl = renderer.getContext() as WebGL2RenderingContext;
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            gl.deleteSync(sync);
            frameId = window.setTimeout(tick, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      hullGeo.dispose();
      hullMat.dispose();
      cockpitGeo.dispose();
      cockpitMat.dispose();
      cannonGeo.dispose();
      cannonMat.dispose();
      thrusterGeo.dispose();
      thrusterMat.dispose();
      floorGeo.dispose();
      floorMat.dispose();
      gridTexture.dispose();
    };
  }, [character, autoFire, advancePhase, endGame, onUnlockAchievement, showToast]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-[#091726] border border-[#25445e] p-3 sm:p-5 shadow-[0_25px_80px_rgba(0,0,0,0.8)]">
      {/* HUD Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-3 mb-3 border-b border-[#1b3a54]">
        <div className="bg-[#0b1f33] p-2.5 rounded-xl border border-[#1a3852]">
          <span className="block text-[10px] font-mono text-[#809bb3] uppercase tracking-wider">
            PONTUAÇÃO 2.5D
          </span>
          <strong className="text-xl sm:text-2xl font-['Chakra_Petch'] font-bold text-[#c7ff62]">
            {score.toString().padStart(6, '0')}
          </strong>
        </div>

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

        <div className="bg-[#0b1f33] p-2.5 rounded-xl border border-[#1a3852]">
          <span className="block text-[10px] font-mono text-[#809bb3] uppercase tracking-wider">
            ENERGIA DO KEY USER
          </span>
          <div className="flex items-center gap-1.5 text-xl text-[#ff5d6c] pt-0.5">
            {'♥ '.repeat(Math.max(0, lives)).trim() || '💀'}
          </div>
        </div>

        <div className="bg-[#0b1f33] p-2.5 rounded-xl border border-[#1a3852]">
          <span className="block text-[10px] font-mono text-[#809bb3] uppercase tracking-wider">
            CHAMADOS SALVOS
          </span>
          <strong className="text-xl sm:text-2xl font-['Chakra_Petch'] font-bold text-white">
            {tickets.toString().padStart(3, '0')}
          </strong>
        </div>
      </div>

      {/* Active Boss Bar */}
      {activeBoss && (
        <div className="mb-3 p-3 rounded-xl bg-red-950/40 border border-red-500/50">
          <div className="flex items-center justify-between text-xs font-['Chakra_Petch'] font-bold mb-1">
            <span className="text-red-400 flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" />
              CHEFÃO 2.5D: {activeBoss.name}
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
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-['Chakra_Petch'] font-bold text-black tracking-widest">
                PRONTO! PRESSIONE [X]
              </span>
            )}
          </div>
        </div>

        {/* Buff indicators */}
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

      {/* 2.5D WebGL Viewport Container */}
      <div className="relative w-full border border-[#2b5472] rounded-xl overflow-hidden bg-[#050e18] shadow-[inset_0_0_50px_rgba(0,0,0,0.9)]">
        {/* Isolated Three.js WebGL canvas container */}
        <div ref={containerRef} className="w-full aspect-video block" />

        {/* 2.5D Badge */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-[#35e0d0]/20 border border-[#35e0d0]/50 text-[#35e0d0] font-mono text-[10px] font-bold tracking-wider">
            VISÃO: 2.5D ISOMÉTRICA
          </span>
          <button
            onClick={onSwitchTo2D}
            className="px-2 py-0.5 rounded bg-[#102438] hover:bg-[#183652] border border-[#204566] text-[#8ca8bf] hover:text-white font-['Chakra_Petch'] text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Layers size={11} /> Mudar para 2D Clássico
          </button>
        </div>

        {/* Optional Scanlines */}
        {scanlines && (
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] opacity-80 mix-blend-overlay">
            <div className="w-full h-full bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]" />
          </div>
        )}

        {/* Toast */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#ff5d6c] text-white px-4 py-2 rounded-lg font-['Chakra_Petch'] font-bold text-xs sm:text-sm tracking-wider shadow-[0_0_25px_rgba(255,93,108,0.6)] z-20 pointer-events-none text-center">
            {toastMessage}
          </div>
        )}

        {/* Overlays */}
        {gameState !== 'playing' && (
          <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-gradient-to-b from-[#061423ea] to-[#040d16fa] backdrop-blur-sm">
            {gameState === 'idle' && (
              <div className="max-w-md w-full text-center bg-[#0a1e33]/90 border border-[#2d587c] rounded-2xl p-6 sm:p-8 shadow-[0_15px_60px_rgba(0,0,0,0.9)]">
                <span className="text-[10px] font-mono text-[#35e0d0] tracking-widest uppercase block mb-1">
                  MOTOR 2.5D • ARQUITETURA UNITY C#
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold font-['Chakra_Petch'] text-white mb-2">
                  SAP SURVIVOR 2.5D
                </h2>
                <p className="text-xs sm:text-sm text-[#9eb6cc] leading-relaxed mb-6">
                  Experimente o fechamento da folha em perspectiva 2.5D com profundidade estéreo, nave tridimensional
                  com inclinação dinâmica e física de colisões fiel ao manual do Unity C#!
                </p>

                <div className="space-y-3">
                  <button
                    onClick={startGame}
                    className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#35e0d0] via-[#c7ff62] to-[#35e0d0] text-[#071521] font-['Chakra_Petch'] font-bold text-base tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-[0_0_30px_rgba(53,224,208,0.4)] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Play size={18} /> INICIAR MISSÃO 2.5D
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={onOpenCharacterSelect}
                      className="flex-1 py-2 px-3 rounded-xl bg-[#122a42] hover:bg-[#1a3a5c] border border-[#254d72] text-[#8ca8bf] hover:text-white font-['Chakra_Petch'] text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <SlidersHorizontal size={13} /> {character.name}
                    </button>
                    <button
                      onClick={onSwitchTo2D}
                      className="py-2 px-3 rounded-xl bg-[#122a42] hover:bg-[#1a3a5c] border border-[#254d72] text-[#8ca8bf] hover:text-white font-['Chakra_Petch'] text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Layers size={13} /> Ver em 2D
                    </button>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#18354e] text-[11px] font-mono text-[#6d8a9f] space-y-1">
                  <p>← → ou A / D para inclinar • ESPAÇO para disparar</p>
                  <p>X para Habilidade Especial</p>
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

                <div className="bg-[#240e18] border border-red-900/60 rounded-xl p-4 my-4 grid grid-cols-2 gap-3 text-left">
                  <div>
                    <span className="text-[10px] font-mono text-red-300">PONTUAÇÃO 2.5D</span>
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
                    <Share2 size={15} /> Compartilhar no LinkedIn
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
                  FOLHA 2.5D FECHADA COM SUCESSO!
                </h2>
                <p className="text-xs sm:text-sm text-[#b2d5ed] leading-relaxed mb-4">
                  Você derrotou o Grande Chefão Final em 2.5D! Saldo zero conferido, arquivos bancários transmitidos e salários pagos!
                </p>

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
                    <RotateCcw size={14} /> Novo Fechamento
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls Bar & Mobile Touch Controls */}
      <div className="mt-4 pt-3 border-t border-[#18354e] flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[#82a0b8]">
        <div className="hidden sm:flex items-center gap-2">
          <span className="px-2 py-1 rounded bg-[#102438] border border-[#234563] text-white font-['Chakra_Petch']">
            ← →
          </span>
          <span>INCLINAR / MOVER</span>
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

        <div className="flex items-center gap-3">
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

        {/* Mobile touch controls */}
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
                  ? 'bg-gradient-to-r from-[#ffad55] to-[#c7ff62] text-black border-transparent'
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
