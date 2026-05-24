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
// 적 바닥 모서리(y + ENEMY_HEIGHT) >= 740 이면 게임오버. 시각적 데드라인 라인은 y=760.
const DEADLINE_Y = 740;
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

  if (gameState.현재_스테이지 >= 3) {
    const hasIndestructible = enemies.some(e => e.isIndestructible);
    if (!hasIndestructible) {
      const x = X_MIN + Math.random() * (X_MAX - X_MIN);
      const indestructibleBlock = { id: _nextId++, x, y: SPAWN_Y, hp: Infinity, maxHp: Infinity, isIndestructible: true };
      enemies.push(indestructibleBlock);
      spawned.push(indestructibleBlock);
    }
  }

  console.log(`[enemy] spawnEnemyRow(turn=${turn}): +${count}마리 (hp=${maxHp})`);
  return spawned;
}

export function moveIndestructibleBlockRandomly() {
  const block = enemies.find(e => e.isIndestructible);
  if (!block) return;

  const activeRows = Array.from(new Set(enemies.map(e => e.y)));
  if (activeRows.length === 0) activeRows.push(SPAWN_Y);

  const targetY = activeRows[Math.floor(Math.random() * activeRows.length)];

  let targetX = X_MIN + Math.random() * (X_MAX - X_MIN);
  for (let attempt = 0; attempt < 10; attempt++) {
    const tempX = X_MIN + Math.random() * (X_MAX - X_MIN);
    const overlaps = enemies.some(e => {
      if (e.id === block.id) return false;
      return Math.abs(e.x - tempX) < ENEMY_WIDTH && Math.abs(e.y - targetY) < ENEMY_HEIGHT;
    });
    if (!overlaps) {
      targetX = tempX;
      break;
    }
  }

  block.x = targetX;
  block.y = targetY;
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
function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export function drawEnemies(ctx) {
  if (!ctx || enemies.length === 0) return;

  ctx.save();
  ctx.font = HP_TEXT_FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (const enemy of enemies) {
    if (enemy.isIndestructible) {
      const neonColor = '#00ffff';
      const topColor = '#778899';
      const bottomColor = '#2f313d';

      const grad = ctx.createLinearGradient(enemy.x, enemy.y, enemy.x, enemy.y + ENEMY_HEIGHT);
      grad.addColorStop(0, topColor);
      grad.addColorStop(1, bottomColor);

      ctx.save();
      ctx.shadowBlur = 10;
      ctx.shadowColor = neonColor;
      ctx.fillStyle = grad;
      drawRoundedRect(ctx, enemy.x, enemy.y, ENEMY_WIDTH, ENEMY_HEIGHT, 6);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = neonColor;
      ctx.lineWidth = 2;
      drawRoundedRect(ctx, enemy.x, enemy.y, ENEMY_WIDTH, ENEMY_HEIGHT, 6);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffea00';
      ctx.beginPath();
      ctx.moveTo(enemy.x + 8, enemy.y + 5); ctx.lineTo(enemy.x + 18, enemy.y + 25);
      ctx.moveTo(enemy.x + 22, enemy.y + 5); ctx.lineTo(enemy.x + 32, enemy.y + 25);
      ctx.moveTo(enemy.x + 38, enemy.y + 5); ctx.lineTo(enemy.x + 48, enemy.y + 25);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(enemy.x + 30, enemy.y + 8);
      ctx.lineTo(enemy.x + 42, enemy.y + 11);
      ctx.lineTo(enemy.x + 38, enemy.y + 21);
      ctx.quadraticCurveTo(enemy.x + 30, enemy.y + 26, enemy.x + 30, enemy.y + 26);
      ctx.quadraticCurveTo(enemy.x + 22, enemy.y + 21, enemy.x + 22, enemy.y + 21);
      ctx.lineTo(enemy.x + 18, enemy.y + 11);
      ctx.closePath();
      ctx.fillStyle = 'rgba(0, 255, 255, 0.45)';
      ctx.shadowBlur = 6;
      ctx.shadowColor = '#00ffff';
      ctx.fill();
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      continue;
    }

    let neonColor = '#ff0055';
    let topColor = '#ff003c';
    let bottomColor = '#4a0011';

    if (enemy.hp === 1) {
      neonColor = '#00ffcc';
      topColor = '#00ffd2';
      bottomColor = '#004035';
    } else if (enemy.hp === 2) {
      neonColor = '#ffff00';
      topColor = '#ffea00';
      bottomColor = '#403b00';
    } else if (enemy.hp === 3) {
      neonColor = '#ff6600';
      topColor = '#ff7700';
      bottomColor = '#4a2200';
    }

    const grad = ctx.createLinearGradient(enemy.x, enemy.y, enemy.x, enemy.y + ENEMY_HEIGHT);
    grad.addColorStop(0, topColor);
    grad.addColorStop(1, bottomColor);

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    drawRoundedRect(ctx, enemy.x, enemy.y + 3, ENEMY_WIDTH, ENEMY_HEIGHT, 6);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.shadowBlur = 8;
    ctx.shadowColor = neonColor;
    ctx.fillStyle = grad;
    drawRoundedRect(ctx, enemy.x, enemy.y, ENEMY_WIDTH, ENEMY_HEIGHT, 6);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = neonColor;
    ctx.lineWidth = 1.5;
    drawRoundedRect(ctx, enemy.x, enemy.y, ENEMY_WIDTH, ENEMY_HEIGHT, 6);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(enemy.x + 6, enemy.y + 3);
    ctx.lineTo(enemy.x + ENEMY_WIDTH - 6, enemy.y + 3);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();

    if (enemy.hp === 1) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(enemy.x + 10, enemy.y + 8);
      ctx.lineTo(enemy.x + 18, enemy.y + 16);
      ctx.lineTo(enemy.x + 14, enemy.y + 22);
      ctx.moveTo(enemy.x + 50, enemy.y + 22);
      ctx.lineTo(enemy.x + 42, enemy.y + 14);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    } else if (enemy.hp === 2) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(enemy.x + 5, enemy.y + 10);
      ctx.lineTo(enemy.x + 5, enemy.y + 5);
      ctx.lineTo(enemy.x + 10, enemy.y + 5);
      ctx.moveTo(enemy.x + ENEMY_WIDTH - 5, enemy.y + 10);
      ctx.lineTo(enemy.x + ENEMY_WIDTH - 5, enemy.y + 5);
      ctx.lineTo(enemy.x + ENEMY_WIDTH - 10, enemy.y + 5);
      ctx.stroke();
      ctx.restore();
    } else if (enemy.hp === 3) {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(enemy.x + 4, enemy.y + 13, ENEMY_WIDTH - 8, 4);
      ctx.restore();
    } else if (enemy.hp >= 4) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, enemy.x + 3, enemy.y + 3, ENEMY_WIDTH - 6, ENEMY_HEIGHT - 6, 4);
      ctx.stroke();
      ctx.restore();
    }

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
