export type CharacterId = 'keyuser' | 'consultor' | 'analista' | 'abaper';

export interface CharacterProfile {
  id: CharacterId;
  name: string;
  role: string;
  badge: string;
  color: string;
  avatarIcon: string;
  description: string;
  speed: number;
  fireRate: number; // lower = faster shoot cooldown
  damageMultiplier: number;
  pickupRadiusBonus: number;
  specialSkill: string;
  quote: string;
}

export type EnemyType = 'CHAMADO' | 'BUG' | 'CUSTOM' | 'EVIDENCIA_ROGUE' | 'DUMP_ST22';

export interface Enemy {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  type: EnemyType;
  label: string;
  sublabel?: string;
  color: string;
  vy: number;
  vx: number;
  points: number;
  isBoss?: boolean;
  bossPhase?: number;
  bossMaxHp?: number;
  patternTimer?: number;
  meshX?: number;
  meshY?: number;
  mesh?: any;
}

export interface Bullet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  color: string;
  isSpecial?: boolean;
  mesh?: any;
}

export type PowerUpType = 'CAFE' | 'SM12' | 'OSS_NOTE' | 'DEBUG_H' | 'TIRO_TRIPLO' | 'EVIDENCIA';

export interface PowerUpItem {
  id: number;
  x: number;
  y: number;
  type: PowerUpType;
  label: string;
  icon: string;
  color: string;
  vy: number;
}

export interface ActiveBuffs {
  cafeTimeRemaining: number;
  shieldCount: number;
  debugTimeRemaining: number;
  tripleShotTimeRemaining: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  vy: number;
  life: number;
  maxLife: number;
}

export interface BossConfig {
  id: string;
  name: string;
  title: string;
  hp: number;
  width: number;
  height: number;
  color: string;
  dialogIntro: string;
  dialogDefeated: string;
}

export interface PhaseConfig {
  level: number;
  title: string;
  subtitle: string;
  tcode: string;
  targetTickets: number; // tickets needed to trigger boss
  boss: BossConfig;
  bgGlowColor: string;
  enemySpeedMultiplier: number;
  enemyHpMultiplier: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

export interface GameScoreRecord {
  score: number;
  tickets: number;
  level: number;
  character: CharacterId;
  characterName: string;
  date: string;
  won: boolean;
}
