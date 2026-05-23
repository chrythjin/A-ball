// 게임 상태 컨트롤러 (Game State Controller)
// 클릭 게이팅, 상태 전이, 리셋 로직을 담당하는 모듈
//
// 게임_상태 값 의미 (semantics):
//   0 = 조준 대기 (aim waiting) — 플레이어 입력 허용
//   1 = 공 발사 중 (balls in flight) — 입력 차단
//   2 = 게임 오버 (game over) — 입력 차단

import { gameState, 적_체력_리스트, resetState } from './state.js';
import { resetScore } from './difficulty.js';
import { enemies } from './enemy.js';
import { balls } from './ball.js';

/**
 * 캔버스 클릭 리스너를 등록하고 게임 상태를 초기화한다.
 * 이 함수는 페이지 로드 시 1회만 호출되어야 한다.
 *
 * @param {HTMLCanvasElement} canvas - 클릭 입력을 받을 캔버스 엘리먼트
 * @returns {void}
 */
export function initGame(canvas) {
  if (!canvas) {
    throw new Error('initGame requires a canvas element');
  }

  resetState();

  canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    handleClick(x, y);
  });

  console.log('[controller] initGame complete — 게임_상태=0, 스킬_선택중=false');
}

/**
 * 캔버스 클릭을 처리한다.
 * 두 조건이 모두 참일 때만 발사 동작이 일어난다:
 *   - gameState.게임_상태 === 0 (조준 대기 상태)
 *   - gameState.스킬_선택중 === false (스킬 팝업 비활성)
 * 어느 한쪽이라도 거짓이면 클릭은 무시된다 (no-op).
 *
 * @param {number} x - 캔버스 좌표계 x (px)
 * @param {number} y - 캔버스 좌표계 y (px)
 * @returns {boolean} 클릭이 발사로 이어졌으면 true, 게이팅으로 무시되었으면 false
 */
export function handleClick(x, y) {
  if (gameState.게임_상태 !== 0) {
    console.log(`[controller] click ignored — 게임_상태=${gameState.게임_상태}`);
    return false;
  }

  if (gameState.스킬_선택중 === true) {
    console.log('[controller] click ignored — 스킬_선택중=true');
    return false;
  }

  // 발사 트리거: 게임_상태를 1(공 발사 중)로 전이.
  // 실제 공 물리/적 로직은 다른 모듈에서 처리한다 (이 컨트롤러는 게이팅만 담당).
  setGameState(1);
  console.log(`[controller] fire trigger at (${x.toFixed(1)}, ${y.toFixed(1)})`);
  return true;
}

/**
 * 게임 상태 값을 갱신하고 전이를 로깅한다.
 * 허용되는 값은 0 / 1 / 2 뿐이다.
 *
 * @param {0|1|2} n - 새로운 게임_상태 값
 * @returns {void}
 */
export function setGameState(n) {
  if (n !== 0 && n !== 1 && n !== 2) {
    console.warn(`[controller] invalid 게임_상태 value: ${n} (allowed: 0, 1, 2)`);
    return;
  }

  const 이전 = gameState.게임_상태;
  if (이전 === n) {
    return;
  }

  gameState.게임_상태 = n;
  console.log(`[controller] 게임_상태 전이: ${이전} → ${n}`);
}

/**
 * 게임을 처음 상태로 되돌린다 (Task 14: 다시 시작 버튼 클린업).
 *  1. resetState()로 gameState 필드를 기본값으로 복원
 *  2. 적_체력_리스트, enemies, balls 를 splice로 비워 동일 참조를 유지 (재할당 X)
 *  3. resetScore()로 처치 카운트를 0으로 복원
 *  4. 게임_상태=0, 스킬_선택중=false, 현재_턴=1로 강제 (방어적 재확인)
 *  5. 스킬 팝업 DOM이 있으면 숨기고, HUD/debug 텍스트를 초기 상태로 되돌린다
 *
 * 주의: 모듈 스코프 const/let 배열(enemies, balls, 적_체력_리스트)은 다른 모듈이
 *       import 시점에 참조를 캐싱하므로 절대 재할당 금지 — splice로 in-place clear.
 *
 * @returns {void}
 */
export function resetGame() {
  // 1. 모듈 스코프 배열 in-place clear (다른 모듈이 캐싱한 원본 참조를 보존하기 위해
  //    resetState() 보다 먼저 실행한다 — state.js는 적_체력_리스트를 재할당하므로
  //    splice가 그 뒤에 오면 새 빈 배열에 대한 no-op이 되어 캐시된 참조가 stale 상태로 남는다).
  적_체력_리스트.splice(0, 적_체력_리스트.length);
  enemies.splice(0, enemies.length);
  balls.splice(0, balls.length);

  resetState();
  resetScore();

  gameState.게임_상태 = 0;
  gameState.스킬_선택중 = false;
  gameState.현재_턴 = 1;

  // 스킬 선택 팝업이 떠 있다면 숨긴다.
  if (typeof document !== 'undefined') {
    const 스킬_팝업 = document.getElementById('skill-popup');
    if (스킬_팝업) {
      스킬_팝업.style.display = 'none';
    }

    const debug = document.getElementById('debug-list');
    if (debug) {
      debug.textContent = '';
    }
  }

  console.log(
    `[controller] resetGame complete — 게임_상태=0, 현재_턴=1, enemies=${enemies.length}, balls=${balls.length}, 적_체력_리스트=${적_체력_리스트.length}`,
  );
}
