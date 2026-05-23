import { gameState } from './state.js';
import { setGameState } from './controller.js';
import { drawBalls, stepBalls } from './ball.js';
import {
  checkGameOver,
  descendEnemies,
  drawEnemies,
  spawnEnemyRow,
} from './enemy.js';
import { checkCollisions, syncHpList } from './collision.js';
import { updateHUD } from './hud.js';
import { updateDifficulty } from './difficulty.js';
import { checkSkillTrigger, showSkillPopup } from './skill.js';
import { updateEffects, screenShake } from './polish.js';

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 640;
const DEADLINE_Y = 600;
const DEADLINE_HEIGHT = 5;
const DEADLINE_COLOR = '#ff4d4d';

let animationFrameId = null;
let hasSeededFirstRow = false;
let prevState = gameState.게임_상태;
let turnEndFired = false;

function drawDeadline(ctx) {
  ctx.fillStyle = DEADLINE_COLOR;
  ctx.fillRect(0, DEADLINE_Y, CANVAS_WIDTH, DEADLINE_HEIGHT);
}

function onTurnEnd() {
  gameState.현재_턴++;
  descendEnemies();

  if (checkGameOver()) {
    screenShake(document.getElementById('gameCanvas'));
    setGameState(2);
    window.changeScene('scene-gameover');
    return;
  }

  updateDifficulty();
  spawnEnemyRow(gameState.현재_턴);
  syncHpList();

  if (checkSkillTrigger()) {
    showSkillPopup();
  }
}

function runFrame(ctx) {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawDeadline(ctx);
  drawEnemies(ctx);
  drawBalls(ctx);
  updateEffects(ctx);
  checkCollisions();
  stepBalls();
  updateHUD();

  const currentState = gameState.게임_상태;
  if (prevState === 1 && currentState === 0 && !turnEndFired) {
    turnEndFired = true;
    onTurnEnd();
  }

  if (currentState === 1) {
    turnEndFired = false;
  }

  prevState = gameState.게임_상태;
}

export function startLoop(canvas, ctx) {
  if (!canvas || !ctx) {
    throw new Error('startLoop requires a canvas and 2D context');
  }

  if (!hasSeededFirstRow) {
    spawnEnemyRow(1);
    syncHpList();
    hasSeededFirstRow = true;
  }

  if (animationFrameId !== null) {
    return;
  }

  const tick = () => {
    runFrame(ctx);
    animationFrameId = window.requestAnimationFrame(tick);
  };

  animationFrameId = window.requestAnimationFrame(tick);
}

/**
 * Reset every loop-internal flag so the next startLoop() call re-seeds the
 * first enemy row and starts a fresh rAF cycle. Called by resetGame() flow
 * (Task 14: 다시 시작) before changeScene('scene-lobby').
 *
 * Cancels any in-flight animation frame, clears the seed flag, and resets
 * the turn-end edge detector so prevState/turnEndFired do not carry over
 * from the previous run.
 *
 * @returns {void}
 */
export function resetLoop() {
  if (animationFrameId !== null) {
    window.cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  hasSeededFirstRow = false;
  prevState = 0;
  turnEndFired = false;
  console.log('[loop] resetLoop — hasSeededFirstRow=false, prevState=0, turnEndFired=false');
}

export const __TEST__ = {
  onTurnEnd,
  reset() {
    if (animationFrameId !== null) {
      window.cancelAnimationFrame(animationFrameId);
    }
    animationFrameId = null;
    hasSeededFirstRow = false;
    prevState = gameState.게임_상태;
    turnEndFired = false;
  },
  markSeeded() {
    hasSeededFirstRow = true;
  },
};
