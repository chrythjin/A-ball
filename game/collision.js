import { gameState, 적_체력_리스트 } from './state.js';
import { enemies } from './enemy.js';
import { recordKill } from './difficulty.js';
import { flashEnemy, playKillSound } from './polish.js';
import { soundManager } from './sound-manager.js';

let balls = [];

import('./ball.js')
  .then((ballModule) => {
    if (Array.isArray(ballModule.balls)) {
      balls = ballModule.balls;
    }
  })
  .catch(() => {
    balls = [];
  });

const BALL_RADIUS = 8;
const ENEMY_WIDTH = 60;
const ENEMY_HEIGHT = 30;
const TUNNELING_SPEED_THRESHOLD = ENEMY_HEIGHT / 2;
const TUNNELING_SUB_STEPS = 2;

const ballCooldowns = new Map();

function isColliding(ball, enemy) {
  return (
    ball.x + BALL_RADIUS > enemy.x &&
    ball.x - BALL_RADIUS < enemy.x + ENEMY_WIDTH &&
    ball.y + BALL_RADIUS > enemy.y &&
    ball.y - BALL_RADIUS < enemy.y + ENEMY_HEIGHT
  );
}

function getBallCooldown(ballId) {
  if (!ballCooldowns.has(ballId)) {
    ballCooldowns.set(ballId, new Set());
  }

  return ballCooldowns.get(ballId);
}

function clearEnemyCooldown(enemyId) {
  for (const damagedEnemyIds of ballCooldowns.values()) {
    damagedEnemyIds.delete(enemyId);
  }
}

function hasCollisionAtSubStep(ball, enemy, subSteps, step) {
  const previousX = ball.x - ball.vx;
  const previousY = ball.y - ball.vy;
  const sampledBall = {
    ...ball,
    x: previousX + (ball.vx * step) / subSteps,
    y: previousY + (ball.vy * step) / subSteps,
  };

  return isColliding(sampledBall, enemy);
}

function isCollidingWithTunnelingGuard(ball, enemy) {
  if (gameState.공_속도 <= TUNNELING_SPEED_THRESHOLD) {
    return isColliding(ball, enemy);
  }

  for (let step = 1; step <= TUNNELING_SUB_STEPS; step++) {
    if (hasCollisionAtSubStep(ball, enemy, TUNNELING_SUB_STEPS, step)) {
      return true;
    }
  }

  return false;
}

function removeDeadEnemies() {
  let removed = false;

  for (let enemyIndex = enemies.length - 1; enemyIndex >= 0; enemyIndex--) {
    if (enemies[enemyIndex].hp <= 0) {
      clearEnemyCooldown(enemies[enemyIndex].id);
      enemies.splice(enemyIndex, 1);
      removed = true;
    }
  }

  return removed;
}

export function clearBallCooldown(ballId) {
  ballCooldowns.delete(ballId);
}

export function resetCooldowns() {
  ballCooldowns.clear();
}

export function syncHpList() {
  적_체력_리스트.splice(0, 적_체력_리스트.length, ...enemies.map((enemy) => enemy.hp));
}

export function checkCollisions() {
  removeDeadEnemies();

  if (balls.length === 0 || enemies.length === 0) {
    syncHpList();
    return;
  }

  for (const ball of balls) {
    if (!ball.active) {
      continue;
    }

    const damagedEnemies = getBallCooldown(ball.id);

    for (let enemyIndex = enemies.length - 1; enemyIndex >= 0; enemyIndex--) {
      const enemy = enemies[enemyIndex];

      if (damagedEnemies.has(enemy.id) || !isCollidingWithTunnelingGuard(ball, enemy)) {
        continue;
      }

      damagedEnemies.add(enemy.id);
      enemy.hp -= gameState.공_데미지;
      ball.vy *= -1;
      soundManager.playSFX('ball-hit');
      flashEnemy(null, enemy);

      if (enemy.hp <= 0) {
        clearEnemyCooldown(enemy.id);
        enemies.splice(enemyIndex, 1);
        recordKill();
        gameState.골드_개수 += 1;
        localStorage.setItem('game_gold', String(gameState.골드_개수));
        if (typeof window.updateGoldDisplay === 'function') {
          window.updateGoldDisplay();
        }
        playKillSound();
      }
    }
  }

  removeDeadEnemies();

  syncHpList();
}

export const __TEST__ = {
  setBalls(nextBalls) {
    balls = nextBalls;
  },
  getCooldowns() {
    return ballCooldowns;
  },
  resetCooldowns() {
    ballCooldowns.clear();
  },
};
