// 공 클론 매니저 (Ball Clone Manager)
// 좌표/스케일: 캔버스 480×640, 발사 시작점 (240, 545)
// 좌우 벽 x∈{0,480} 반사 (vx 부호 반전), 천장 y=0 반사, 회수선 y>=580.
//
// Entry 매핑:
//   launchBalls ↔ "공_개수" 만큼 [복제본 만들기] + 각도/속도 초기화
//   stepBalls   ↔ 매 프레임 [x좌표/y좌표 바꾸기] + 벽 반사
//   drawBalls   ↔ 활성 클론 전체 [모양 보이기]

import { gameState } from './state.js';
import { setGameState } from './controller.js';
import { clearBallCooldown } from './collision.js';
import { playLaunchSound } from './polish.js';
import { soundManager } from './sound-manager.js';
import { triggerShootFlash } from './loop.js';

const LAUNCH_X = 240;
const LAUNCH_Y = 705;
const CANVAS_LEFT = 0;
const CANVAS_RIGHT = 480;
const CANVAS_TOP = 0;
const COLLECT_Y = 740;
const BALL_RADIUS = 8;
const BALL_COLOR = '#f2e9e4';
// 트랩 가드: 한 공이 이 프레임 수를 넘게 살아있으면 강제 회수 (Metis 안전망)
const TRAP_GUARD_FRAMES = 500;

// 공 레지스트리. 다른 모듈이 import 시점에 참조를 캐싱하므로
// 절대 재할당하지 말 것 (push/splice/속성 변경만 허용).
export let balls = [];

let nextId = 1;

/**
 * 발사대에서 angle 방향으로 gameState.공_개수 만큼의 공 클론을 생성한다.
 * 게임_상태를 1로 전이시키고 현재_날아간_공을 증가시킨다.
 *
 * @param {number} angle - 라디안 단위 발사 각도 (atan2 결과)
 * @returns {void}
 */
export function launchBalls(angle) {
  const count = gameState.공_개수;
  const speed = gameState.공_속도;
  const vx = Math.cos(angle) * speed;
  const vy = Math.sin(angle) * speed;

  for (let i = 0; i < count; i++) {
    balls.push({
      id: nextId++,
      x: LAUNCH_X,
      y: LAUNCH_Y,
      vx,
      vy,
      active: true,
      frames: 0,
    });
  }

  if (gameState.가드_월_보유) {
    gameState.가드_월_활성화 = true;
    gameState.가드_월_보유 = false;
  }

  gameState.현재_날아간_공 += count;
  setGameState(1);
  playLaunchSound();
  triggerShootFlash();

  console.log(`[ball] launched ${count} ball(s) angle=${angle.toFixed(3)} speed=${speed}`);
}

/**
 * 모든 활성 공을 한 프레임 전진시키고 벽/천장 반사 + 바닥 회수를 처리한다.
 * 모든 공이 회수되면 setGameState(0)으로 입력을 재허용한다.
 *
 * @returns {void}
 */
export function stepBalls() {
  for (const ball of balls) {
    if (!ball.active) continue;

    ball.frames++;
    
    if (gameState.장착된_볼 === 'laser') {
      if (!ball.trail) ball.trail = [];
      ball.trail.push({ x: ball.x, y: ball.y });
      if (ball.trail.length > 8) ball.trail.shift();
    } else if (gameState.장착된_볼 === 'star') {
      ball.spinAngle = (ball.spinAngle || 0) + 0.15;
      if (Math.random() < 0.35) {
        spawnSparkle(ball.x, ball.y);
      }
    } else if (gameState.장착된_볼 === 'missile') {
      if (Math.random() < 0.25) {
        spawnSmoke(ball.x, ball.y, ball.vx, ball.vy);
      }
    }

    ball.x += ball.vx;
    ball.y += ball.vy;

    if (ball.x <= CANVAS_LEFT) {
      ball.x = CANVAS_LEFT;
      ball.vx = -ball.vx;
      soundManager.playSFX('ball-wall');
    } else if (ball.x >= CANVAS_RIGHT) {
      ball.x = CANVAS_RIGHT;
      ball.vx = -ball.vx;
      soundManager.playSFX('ball-wall');
    }

    if (ball.y <= CANVAS_TOP) {
      ball.y = CANVAS_TOP;
      ball.vy = -ball.vy;
      soundManager.playSFX('ball-wall');
    }

    let reachedBottom = ball.y >= COLLECT_Y;

    if (reachedBottom && gameState.가드_월_활성화) {
      ball.y = COLLECT_Y - 4;
      ball.vy = -Math.abs(ball.vy);
      reachedBottom = false;
      soundManager.playSFX('ball-wall');
    }

    const stuck = ball.frames >= TRAP_GUARD_FRAMES;

    if (reachedBottom || stuck) {
      clearBallCooldown(ball.id);
      ball.active = false;
      gameState.현재_날아간_공 = Math.max(0, gameState.현재_날아간_공 - 1);
      if (stuck && !reachedBottom) {
        console.log(`[ball] trap guard collected ball#${ball.id} after ${ball.frames} frames`);
      }
    }
  }

  // 턴 종료: splice로 in-place clear (재할당 금지). 입력 재허용을 위해 setGameState(0).
  if (gameState.현재_날아간_공 === 0 && balls.length > 0) {
    balls.splice(0, balls.length);
    gameState.가드_월_활성화 = false;
    setGameState(0);
    soundManager.playSFX('ball-all-collected');
    console.log('[ball] all balls collected — 게임_상태=0');
  }
}

const particles = [];

function spawnSparkle(x, y) {
  particles.push({
    x,
    y,
    vx: (Math.random() - 0.5) * 1.5,
    vy: (Math.random() - 0.5) * 1.5,
    life: 1.0,
    decay: 0.04 + Math.random() * 0.03,
    size: 2 + Math.random() * 3,
    color: '#ffea00'
  });
}

function spawnSmoke(x, y, vx, vy) {
  const speed = Math.sqrt(vx * vx + vy * vy) || 1;
  const dx = -vx / speed;
  const dy = -vy / speed;
  particles.push({
    x: x + dx * 8,
    y: y + dy * 8,
    vx: dx * 0.5 + (Math.random() - 0.5) * 0.4,
    vy: dy * 0.5 + (Math.random() - 0.5) * 0.4,
    life: 0.8,
    decay: 0.05,
    size: 3 + Math.random() * 3,
    color: 'rgba(255, 120, 0, 0.6)'
  });
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= p.decay;
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
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

function drawMissile(ctx, x, y, vx, vy) {
  const angle = Math.atan2(vy, vx);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle + Math.PI / 2);

  ctx.fillStyle = '#ff3333';
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.quadraticCurveTo(5, -4, 5, 4);
  ctx.lineTo(-5, 4);
  ctx.quadraticCurveTo(-5, -4, 0, -10);
  ctx.fill();

  ctx.fillStyle = '#ffff00';
  ctx.beginPath();
  ctx.arc(0, -2, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#4a4e69';
  ctx.beginPath();
  ctx.moveTo(-5, 2);
  ctx.lineTo(-9, 6);
  ctx.lineTo(-5, 6);
  ctx.moveTo(5, 2);
  ctx.lineTo(9, 6);
  ctx.lineTo(5, 6);
  ctx.fill();

  ctx.fillStyle = '#ffe600';
  ctx.fillRect(-2, 4, 4, 3);

  ctx.restore();
}

/**
 * 활성 공 전체를 흰 원(r=8)으로 그린다.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @returns {void}
 */
export function drawBalls(ctx) {
  updateParticles();
  
  if (particles.length > 0) {
    ctx.save();
    for (const p of particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  if (!ctx || balls.length === 0) return;

  ctx.save();
  for (const ball of balls) {
    if (!ball.active) continue;

    const skin = gameState.장착된_볼;

    if (skin === 'laser') {
      if (ball.trail && ball.trail.length > 1) {
        ctx.save();
        ctx.strokeStyle = '#00ffff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ffff';
        for (let i = 1; i < ball.trail.length; i++) {
          const ratio = i / ball.trail.length;
          ctx.beginPath();
          ctx.moveTo(ball.trail[i-1].x, ball.trail[i-1].y);
          ctx.lineTo(ball.trail[i].x, ball.trail[i].y);
          ctx.lineWidth = BALL_RADIUS * 2 * ratio;
          ctx.globalAlpha = ratio * 0.45;
          ctx.stroke();
        }
        ctx.restore();
      }

      ctx.save();
      const grad = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, BALL_RADIUS);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(1, '#00ffff');
      ctx.fillStyle = grad;
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#00ffff';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

    } else if (skin === 'missile') {
      drawMissile(ctx, ball.x, ball.y, ball.vx, ball.vy);

    } else if (skin === 'star') {
      ctx.save();
      ctx.fillStyle = '#ffcc00';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ffea00';
      drawStar(ctx, ball.x, ball.y, 5, BALL_RADIUS + 3, BALL_RADIUS - 3, ball.spinAngle || 0);
      ctx.restore();

    } else {
      ctx.save();
      const grad = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, BALL_RADIUS);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(1, '#a6a6a6');
      ctx.fillStyle = grad;
      ctx.shadowBlur = 6;
      ctx.shadowColor = '#ffffff';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();
}
