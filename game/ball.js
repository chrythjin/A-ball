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

const LAUNCH_X = 240;
const LAUNCH_Y = 545;
const CANVAS_LEFT = 0;
const CANVAS_RIGHT = 480;
const CANVAS_TOP = 0;
const COLLECT_Y = 580;
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

  gameState.현재_날아간_공 += count;
  setGameState(1);
  playLaunchSound();

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
    ball.x += ball.vx;
    ball.y += ball.vy;

    if (ball.x <= CANVAS_LEFT) {
      ball.x = CANVAS_LEFT;
      ball.vx = -ball.vx;
    } else if (ball.x >= CANVAS_RIGHT) {
      ball.x = CANVAS_RIGHT;
      ball.vx = -ball.vx;
    }

    if (ball.y <= CANVAS_TOP) {
      ball.y = CANVAS_TOP;
      ball.vy = -ball.vy;
    }

    const reachedBottom = ball.y >= COLLECT_Y;
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
    setGameState(0);
    console.log('[ball] all balls collected — 게임_상태=0');
  }
}

/**
 * 활성 공 전체를 흰 원(r=8)으로 그린다.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @returns {void}
 */
export function drawBalls(ctx) {
  if (!ctx || balls.length === 0) return;

  ctx.save();
  ctx.fillStyle = BALL_COLOR;
  for (const ball of balls) {
    if (!ball.active) continue;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
