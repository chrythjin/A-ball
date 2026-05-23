// Task 8: enemy spawn + descent baseline. Mirrors Entry editor 적 object:
//   spawnEnemyRow(턴) → "턴 시작" 신호: [적 자신의 복제본 만들기] 3~5회
//   descendEnemies()  → "턴 종료" 신호: [y좌표를 -60만큼 바꾸기] (Canvas: +60)
//   checkGameOver()   → [만일 적의 y좌표 ≤ 데드라인 y좌표 이라면 게임_상태=2]
//   drawEnemies(ctx)  → [모양 보이기] + 체력 텍스트
// Out of scope: ball collision (Task 9/13), HP list sync (Task 9), game-over wiring (Task 10).
import { gameState } from './state.js';

export const enemies = [];

let _nextId = 1;

const ENEMY_WIDTH = 60;
const ENEMY_HEIGHT = 30;
const SPAWN_Y = 120;
const ROW_STEP = 60;
// 적 바닥 모서리(y + ENEMY_HEIGHT) >= 580 이면 게임오버. 시각적 데드라인 라인은 y=600.
const DEADLINE_Y = 580;
const X_MIN = 40;
const X_MAX = 440;
const HP_TEXT_COLOR = '#ffffff';
const HP_TEXT_FONT = 'bold 14px sans-serif';

/**
 * Spawn 3~5 enemies evenly across x=[40,440] at y=40 with hp=gameState.적_최대_체력.
 * @param {number} turn  current turn (reserved for future difficulty curves)
 * @returns {Array<{id:number,x:number,y:number,hp:number,maxHp:number}>}
 */
export function spawnEnemyRow(turn) {
  const count = 3 + Math.floor(Math.random() * 3);
  const maxHp = gameState.적_최대_체력;
  const spawned = [];

  for (let i = 0; i < count; i++) {
    const x = X_MIN + Math.random() * (X_MAX - X_MIN);
    const enemy = { id: _nextId++, x, y: SPAWN_Y, hp: maxHp, maxHp };
    enemies.push(enemy);
    spawned.push(enemy);
  }

  console.log(`[enemy] spawnEnemyRow(turn=${turn}): +${count}마리 (hp=${maxHp})`);
  return spawned;
}

/** Move every enemy one row (60px) downward. */
export function descendEnemies() {
  for (const enemy of enemies) {
    enemy.y += ROW_STEP;
  }
  console.log(`[enemy] descendEnemies: ${enemies.length}마리 → +${ROW_STEP}px`);
}

/** @returns {boolean} true if any enemy's bottom edge crosses the deadline. */
export function checkGameOver() {
  return enemies.some((e) => e.y + ENEMY_HEIGHT >= DEADLINE_Y);
}

/**
 * Render every enemy as a filled rect colored by hp ratio (green→red),
 * with HP text centered inside.
 * @param {CanvasRenderingContext2D} ctx
 */
export function drawEnemies(ctx) {
  if (!ctx || enemies.length === 0) return;

  ctx.save();
  ctx.font = HP_TEXT_FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (const enemy of enemies) {
    const ratio = enemy.maxHp > 0 ? enemy.hp / enemy.maxHp : 0;
    const clamped = Math.max(0, Math.min(1, ratio));
    const r = Math.round(255 * (1 - clamped));
    const g = Math.round(255 * clamped);

    ctx.fillStyle = `rgb(${r}, ${g}, 0)`;
    ctx.fillRect(enemy.x, enemy.y, ENEMY_WIDTH, ENEMY_HEIGHT);

    ctx.fillStyle = HP_TEXT_COLOR;
    ctx.fillText(
      String(enemy.hp),
      enemy.x + ENEMY_WIDTH / 2,
      enemy.y + ENEMY_HEIGHT / 2,
    );
  }

  ctx.restore();
}

export const __TEST__ = {
  reset() {
    enemies.splice(0, enemies.length);
    _nextId = 1;
  },
  constants: { ENEMY_WIDTH, ENEMY_HEIGHT, SPAWN_Y, ROW_STEP, DEADLINE_Y, X_MIN, X_MAX },
};
