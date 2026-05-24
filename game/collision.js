import { gameState, 적_체력_리스트 } from './state.js';
import { enemies } from './enemy.js';
import { recordKill } from './difficulty.js';
import { flashEnemy, playKillSound, spawnHitSparks, spawnBlockShatter, spawnShockwave, spawnComboText, spawnCrossLaser, spawnBlastExplosion } from './polish.js';
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

      if (enemy.hp <= 0 || damagedEnemies.has(enemy.id) || !isCollidingWithTunnelingGuard(ball, enemy)) {
        continue;
      }

      damagedEnemies.add(enemy.id);

      const isStone = enemy.isIndestructible;
      let blockColor = '#00ffcc';
      if (enemy.hp === 1) blockColor = '#00ffcc';
      else if (enemy.hp === 2) blockColor = '#ffff00';
      else if (enemy.hp === 3) blockColor = '#ff6600';
      else if (enemy.hp >= 4) blockColor = '#ff0055';

      if (!isStone) {
        enemy.hp -= gameState.공_데미지;
      }

      ball.vy *= -1;

      spawnHitSparks(ball.x, ball.y, blockColor);
      spawnShockwave(ball.x, ball.y, blockColor);
      soundManager.playSFX('ball-hit');
      flashEnemy(null, enemy);

      if (!isStone && enemy.hp <= 0) {
        const killedX = enemy.x;
        const killedY = enemy.y;
        const killedCx = killedX + ENEMY_WIDTH / 2;
        const killedCy = killedY + ENEMY_HEIGHT / 2;

        recordKill();

        gameState.콤보_누적_개수 += 1;
        const comboMultiplier = gameState.콤보_누적_개수;
        const baseScorePerBlock = 100 * gameState.현재_스테이지;
        const pointsEarned = baseScorePerBlock * comboMultiplier;
        gameState.점수 += pointsEarned;

        if (comboMultiplier >= 2) {
          spawnComboText(killedX + 30, killedY + 15, comboMultiplier);
        }

        spawnBlockShatter(killedX, killedY, 60, 30, blockColor);

        gameState.골드_개수 += 1;
        localStorage.setItem('game_gold', String(gameState.골드_개수));
        if (typeof window.updateGoldDisplay === 'function') {
          window.updateGoldDisplay();
        }
        playKillSound();

        if (gameState.십자_레이저_보유) {
          spawnCrossLaser(killedCx, killedCy, '#00ffff');
          soundManager.playSFX('skill-multi');
          for (let j = enemies.length - 1; j >= 0; j--) {
            const target = enemies[j];
            if (target.isIndestructible || target.hp <= 0) continue;
            const targetCx = target.x + ENEMY_WIDTH / 2;
            const targetCy = target.y + ENEMY_HEIGHT / 2;
            const onSameRow = Math.abs(targetCy - killedCy) < ENEMY_HEIGHT;
            const onSameCol = Math.abs(targetCx - killedCx) < ENEMY_WIDTH;
            if (onSameRow || onSameCol) {
              target.hp -= 1;
              spawnHitSparks(targetCx, targetCy, '#00ffff');
              if (target.hp <= 0) {
                spawnBlockShatter(target.x, target.y, 60, 30, '#00ffff');
                clearEnemyCooldown(target.id);
                gameState.콤보_누적_개수 += 1;
                gameState.점수 += baseScorePerBlock * gameState.콤보_누적_개수;
                gameState.골드_개수 += 1;
                if (typeof window.updateGoldDisplay === 'function') window.updateGoldDisplay();
              }
            }
          }
          localStorage.setItem('game_gold', String(gameState.골드_개수));
        }

        if (gameState.블래스트_밤_보유) {
          spawnBlastExplosion(killedCx, killedCy, '#ff6600');
          soundManager.playSFX('enemy-kill');
          const BLAST_RADIUS = 100;
          for (let j = enemies.length - 1; j >= 0; j--) {
            const target = enemies[j];
            if (target.isIndestructible || target.hp <= 0) continue;
            const targetCx = target.x + ENEMY_WIDTH / 2;
            const targetCy = target.y + ENEMY_HEIGHT / 2;
            const dx = targetCx - killedCx;
            const dy = targetCy - killedCy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= BLAST_RADIUS) {
              target.hp -= 1;
              spawnHitSparks(targetCx, targetCy, '#ff6600');
              if (target.hp <= 0) {
                spawnBlockShatter(target.x, target.y, 60, 30, '#ff6600');
                clearEnemyCooldown(target.id);
                gameState.콤보_누적_개수 += 1;
                gameState.점수 += baseScorePerBlock * gameState.콤보_누적_개수;
                gameState.골드_개수 += 1;
                if (typeof window.updateGoldDisplay === 'function') window.updateGoldDisplay();
              }
            }
          }
          localStorage.setItem('game_gold', String(gameState.골드_개수));
        }
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
