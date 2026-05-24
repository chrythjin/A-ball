import { gameState } from './state.js';
import { setGameState } from './controller.js';
import { drawBalls, stepBalls } from './ball.js';
import {
  checkGameOver,
  descendEnemies,
  drawEnemies,
  spawnEnemyRow,
  moveIndestructibleBlockRandomly,
} from './enemy.js';
import { checkCollisions, syncHpList } from './collision.js';
import { updateHUD } from './hud.js';
import { updateDifficulty } from './difficulty.js';
import { checkSkillTrigger, showSkillPopup } from './skill.js';
import { updateEffects, screenShake } from './polish.js';
import { soundManager } from './sound-manager.js';

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 800;

let animationFrameId = null;
let hasSeededFirstRow = false;
let prevState = gameState.게임_상태;
let turnEndFired = false;

const warpStars = [];
const parallaxStars = [];
const meteors = [];
let shootFlashFrame = 0;
let recoilOffset = 0;

function initWarpStars() {
  if (warpStars.length > 0) return;
  for (let i = 0; i < 80; i++) {
    warpStars.push({
      x: (Math.random() - 0.5) * 800,
      y: (Math.random() - 0.5) * 800,
      z: Math.random() * 800
    });
  }
}

function initParallaxStars() {
  if (parallaxStars.length > 0) return;
  for (let i = 0; i < 60; i++) {
    parallaxStars.push({
      x: Math.random() * CANVAS_WIDTH,
      y: Math.random() * CANVAS_HEIGHT,
      speed: 0.5 + Math.random() * 2.5,
      size: 1 + Math.random() * 2,
      alpha: 0.3 + Math.random() * 0.7
    });
  }
}

function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius, angle) {
  let rot = Math.PI / 2 * 3;
  let x = cx;
  let y = cy;
  let step = Math.PI / spikes;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, -outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = Math.cos(rot) * outerRadius;
    y = Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = Math.cos(rot) * innerRadius;
    y = Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(0, -outerRadius);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawProceduralBackground(ctx) {
  const stage = gameState.현재_스테이지;
  
  if (stage === 1) {
    initWarpStars();
    ctx.save();
    ctx.fillStyle = '#ffffff';
    const cx = CANVAS_WIDTH / 2;
    const cy = CANVAS_HEIGHT / 2;
    for (const star of warpStars) {
      star.z -= 4;
      if (star.z <= 0) {
        star.z = 800;
        star.x = (Math.random() - 0.5) * 800;
        star.y = (Math.random() - 0.5) * 800;
      }
      const px = (star.x / star.z) * 400 + cx;
      const py = (star.y / star.z) * 400 + cy;
      const size = Math.max(0.5, (1 - star.z / 800) * 3);
      
      const lastPx = (star.x / (star.z + 15)) * 400 + cx;
      const lastPy = (star.y / (star.z + 15)) * 400 + cy;
      
      ctx.strokeStyle = `rgba(0, 255, 255, ${Math.max(0.1, 1 - star.z / 800)})`;
      ctx.lineWidth = size;
      ctx.beginPath();
      ctx.moveTo(lastPx, lastPy);
      ctx.lineTo(px, py);
      ctx.stroke();
    }
    ctx.restore();
    
  } else if (stage === 2) {
    initParallaxStars();
    ctx.save();
    for (const star of parallaxStars) {
      star.x -= star.speed;
      if (star.x < 0) {
        star.x = CANVAS_WIDTH;
        star.y = Math.random() * CANVAS_HEIGHT;
      }
      ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }
    
    const wallWidth = 35;
    const gradL = ctx.createLinearGradient(0, 0, wallWidth, 0);
    gradL.addColorStop(0, '#1c1d24');
    gradL.addColorStop(0.7, '#2f313d');
    gradL.addColorStop(1, '#111217');
    ctx.fillStyle = gradL;
    ctx.fillRect(0, 0, wallWidth, CANVAS_HEIGHT);
    
    const gradR = ctx.createLinearGradient(CANVAS_WIDTH - wallWidth, 0, CANVAS_WIDTH, 0);
    gradR.addColorStop(0, '#111217');
    gradR.addColorStop(0.3, '#2f313d');
    gradR.addColorStop(1, '#1c1d24');
    ctx.fillStyle = gradR;
    ctx.fillRect(CANVAS_WIDTH - wallWidth, 0, wallWidth, CANVAS_HEIGHT);

    ctx.fillStyle = '#111217';
    for (let y = 40; y < CANVAS_HEIGHT; y += 80) {
      ctx.beginPath();
      ctx.arc(15, y, 3, 0, Math.PI * 2);
      ctx.arc(CANVAS_WIDTH - 15, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = 'rgba(0, 255, 255, 0.12)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80, 100); ctx.lineTo(CANVAS_WIDTH - 80, 100);
    ctx.lineTo(CANVAS_WIDTH - 60, 450); ctx.lineTo(60, 450);
    ctx.closePath();
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(240, 260); ctx.lineTo(120, 180);
    ctx.moveTo(240, 260); ctx.lineTo(360, 200);
    ctx.moveTo(240, 260); ctx.lineTo(210, 400);
    ctx.stroke();

    ctx.restore();
    
  } else if (stage === 3) {
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    const startY = 300;
    const horizonX = 240;
    for (let x = -200; x <= 680; x += 40) {
      ctx.beginPath();
      ctx.moveTo(horizonX, startY);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    const time = (Date.now() / 30) % 40;
    for (let y = startY; y < CANVAS_HEIGHT; y += 30) {
      const animatedY = y + time;
      if (animatedY < CANVAS_HEIGHT) {
        ctx.beginPath();
        ctx.moveTo(0, animatedY);
        ctx.lineTo(CANVAS_WIDTH, animatedY);
        ctx.stroke();
      }
    }
    ctx.restore();

    if (Math.random() < 0.08 && meteors.length < 8) {
      meteors.push({
        x: Math.random() * CANVAS_WIDTH * 1.5,
        y: -20,
        speed: 8 + Math.random() * 6,
        length: 30 + Math.random() * 40,
        color: Math.random() < 0.5 ? '#ff3333' : '#ff9900'
      });
    }

    ctx.save();
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.x -= m.speed * 0.8;
      m.y += m.speed * 0.8;
      
      if (m.y > CANVAS_HEIGHT + 50 || m.x < -50) {
        meteors.splice(i, 1);
        continue;
      }

      ctx.strokeStyle = m.color;
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 8;
      ctx.shadowColor = m.color;
      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.lineTo(m.x + m.length * 0.8, m.y - m.length * 0.8);
      ctx.stroke();
    }
    ctx.restore();
  }
}



function drawFrogLauncher(ctx) {
  ctx.save();
  const cx = 240;
  let cy = 745;
  
  if (gameState.게임_상태 === 2) {
    ctx.translate(cx, cy + 15);
    ctx.fillStyle = '#8dc63f';
    ctx.beginPath();
    ctx.ellipse(0, 15, 25, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#8dc63f';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-15, 10); ctx.lineTo(-30, 20);
    ctx.moveTo(15, 10); ctx.lineTo(30, 20);
    ctx.moveTo(-10, 22); ctx.lineTo(-20, 35);
    ctx.moveTo(10, 22); ctx.lineTo(20, 35);
    ctx.stroke();

    ctx.fillStyle = '#8dc63f';
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-8, -4, 6, 0, Math.PI * 2);
    ctx.arc(8, -4, 6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-11, -7); ctx.lineTo(-5, -1);
    ctx.moveTo(-5, -7); ctx.lineTo(-11, -1);
    ctx.moveTo(5, -7); ctx.lineTo(11, -1);
    ctx.moveTo(11, -7); ctx.lineTo(5, -1);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-6, 8);
    ctx.quadraticCurveTo(0, 4, 6, 8);
    ctx.stroke();

    ctx.save();
    ctx.translate(-25, -5);
    ctx.rotate(-1.2);
    ctx.fillStyle = '#222';
    ctx.fillRect(-12, -3, 24, 6);
    ctx.fillStyle = '#444';
    ctx.fillRect(4, 2, 4, 8);
    ctx.restore();

    ctx.save();
    ctx.translate(22, -10);
    ctx.rotate(0.5);
    ctx.fillStyle = '#d7df23';
    ctx.beginPath();
    ctx.arc(0, 0, 14, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#ff003c';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('★', -5, -2);
    ctx.restore();
    
  } else {
    cy += recoilOffset;
    
    ctx.fillStyle = '#4d3d2c';
    ctx.fillRect(cx - 14, cy + 30, 8, 8);
    ctx.fillRect(cx + 6, cy + 30, 8, 8);
    
    ctx.fillStyle = '#3b5c38';
    ctx.fillRect(cx - 13, cy + 18, 10, 14);
    ctx.fillRect(cx + 3, cy + 18, 10, 14);

    ctx.fillStyle = '#8dc63f';
    ctx.fillRect(cx - 15, cy - 2, 30, 22);
    ctx.fillStyle = '#222';
    ctx.fillRect(cx - 15, cy + 14, 30, 4);

    ctx.fillStyle = '#8dc63f';
    ctx.beginPath();
    ctx.arc(cx, cy - 10, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx - 8, cy - 11, 5.5, 0, Math.PI * 2);
    ctx.arc(cx + 8, cy - 11, 5.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#231f20';
    ctx.beginPath();
    ctx.arc(cx - 8, cy - 11, 2, 0, Math.PI * 2);
    ctx.arc(cx + 8, cy - 11, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#d7df23';
    ctx.beginPath();
    ctx.arc(cx, cy - 13, 16, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy - 22, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff003c';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', cx, cy - 22);

    ctx.strokeStyle = '#231f20';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx - 4, cy - 4);
    ctx.quadraticCurveTo(cx, cy - 2, cx + 4, cy - 4);
    ctx.stroke();

    let angle = -Math.PI / 2;
    if (gameState.isMouseActive) {
      angle = Math.atan2(gameState.mouseY - cy, gameState.mouseX - cx);
    }
    
    ctx.save();
    ctx.translate(cx, cy + 6);
    ctx.rotate(angle + Math.PI / 2);

    ctx.fillStyle = '#222';
    ctx.fillRect(-3, -16, 6, 20);
    ctx.fillStyle = '#444';
    ctx.fillRect(-2, -4, 4, 12);
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(-1.5, -12, 3, 4);
    
    if (shootFlashFrame > 0) {
      ctx.save();
      ctx.translate(0, -18);
      ctx.fillStyle = '#ffcc00';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#ffff00';
      drawStar(ctx, 0, 0, 5, 12, 5, shootFlashFrame * 0.15);
      ctx.restore();
    }
    
    ctx.restore();
  }
  ctx.restore();
}

function drawRobotLauncher(ctx) {
  ctx.save();
  const cx = 240;
  let cy = 745;

  if (gameState.게임_상태 === 2) {
    ctx.translate(cx, cy + 15);
    ctx.fillStyle = '#708090';
    ctx.fillRect(-14, 0, 8, 14);
    ctx.fillRect(cx + 6, 0, 8, 14);
    ctx.fillStyle = '#778899';
    ctx.fillRect(-18, -15, 36, 15);
    ctx.beginPath();
    ctx.arc(0, -26, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#111';
    ctx.fillRect(-8, -29, 16, 4);

    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(-15, -45, 5, 5);

    ctx.save();
    ctx.translate(-25, -5);
    ctx.rotate(-1.2);
    ctx.fillStyle = '#111217';
    ctx.fillRect(-4, -20, 8, 25);
    ctx.restore();

  } else {
    cy += recoilOffset;

    ctx.fillStyle = '#2f313d';
    ctx.fillRect(cx - 14, cy + 18, 8, 14);
    ctx.fillRect(cx + 6, cy + 18, 8, 14);

    ctx.fillStyle = '#708090';
    ctx.fillRect(cx - 18, cy - 2, 36, 20);
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.arc(cx, cy + 8, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#708090';
    ctx.beginPath();
    ctx.arc(cx, cy - 12, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#00ffff';
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#00ffff';
    ctx.fillRect(cx - 8, cy - 15, 16, 3);

    let angle = -Math.PI / 2;
    if (gameState.isMouseActive) {
      angle = Math.atan2(gameState.mouseY - cy, gameState.mouseX - cx);
    }

    ctx.save();
    ctx.translate(cx - 16, cy - 12);
    ctx.rotate(angle + Math.PI / 2);

    ctx.fillStyle = '#111217';
    ctx.fillRect(-4, -20, 8, 25);
    ctx.fillStyle = '#ff003c';
    ctx.fillRect(-2, -14, 4, 3);

    if (shootFlashFrame > 0) {
      ctx.save();
      ctx.translate(0, -22);
      ctx.fillStyle = '#00ffff';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00ffff';
      drawStar(ctx, 0, 0, 4, 14, 6, -shootFlashFrame * 0.2);
      ctx.restore();
    }

    ctx.restore();
  }
  ctx.restore();
}

function drawLauncherAndAim(ctx) {
  if (gameState.장착된_캐릭터 === 'robot') {
    drawRobotLauncher(ctx);
  } else {
    drawFrogLauncher(ctx);
  }
  
  if (gameState.게임_상태 === 0 && !gameState.스킬_선택중) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(240, 705, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#f2e9e4';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#ffffff';
    ctx.fill();

    if (gameState.isMouseActive) {
      drawAimLine(ctx, gameState.mouseX, gameState.mouseY);
    }
    ctx.restore();
  }
}

function drawAimLine(ctx, targetX, targetY) {
  const startX = 240;
  const startY = 720;
  const maxLen = 200;

  const dx = targetX - startX;
  const dy = targetY - startY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  let endX = targetX;
  let endY = targetY;

  if (dist > maxLen) {
    const ratio = maxLen / dist;
    endX = startX + dx * ratio;
    endY = startY + dy * ratio;
  }

  ctx.save();
  ctx.beginPath();
  ctx.setLineDash([5, 5]);
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.strokeStyle = '#f2e9e4';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function onTurnEnd() {
  gameState.현재_턴++;
  descendEnemies();
  soundManager.playSFX('enemy-descend');

  gameState.콤보_누적_개수 = 0;
  gameState.가드_월_활성화 = false;

  if (gameState.현재_스테이지 >= 3) {
    moveIndestructibleBlockRandomly();
  }

  if (checkGameOver()) {
    screenShake(document.getElementById('gameCanvas'));
    setGameState(2);
    window.changeScene('scene-gameover');
    return;
  }

  let stageChanged = false;
  if (gameState.현재_턴 === 11) {
    gameState.현재_스테이지 = 2;
    stageChanged = true;
  } else if (gameState.현재_턴 === 21) {
    gameState.현재_스테이지 = 3;
    stageChanged = true;
  }

  if (stageChanged && typeof window.triggerStageTransition === 'function') {
    window.triggerStageTransition(gameState.현재_스테이지);
  }

  updateDifficulty();
  spawnEnemyRow(gameState.현재_턴);
  soundManager.playSFX('enemy-spawn');
  syncHpList();

  if (checkSkillTrigger()) {
    showSkillPopup();
  }
}

function runFrame(ctx) {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawProceduralBackground(ctx);

  if (gameState.가드_월_활성화) {
    ctx.save();
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 4;
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#00ffff';
    ctx.beginPath();
    ctx.moveTo(0, 740);
    ctx.lineTo(CANVAS_WIDTH, 740);
    ctx.stroke();
    ctx.restore();
  }

  drawEnemies(ctx);
  drawBalls(ctx);
  drawLauncherAndAim(ctx);
  updateEffects(ctx);
  checkCollisions();
  stepBalls();
  updateHUD();

  if (shootFlashFrame > 0) shootFlashFrame--;
  if (recoilOffset > 0 && Math.random() < 0.5) recoilOffset--;

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

export function triggerShootFlash() {
  shootFlashFrame = 12;
  recoilOffset = 6;
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
