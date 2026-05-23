// Task 12: Difficulty/score progression. Mirrors Entry editor blocks:
//   updateDifficulty() → "턴 종료" 신호: [적_최대_체력 ← Math.ceil(현재_턴 / 5)]
//   recordKill()       → 적 hp ≤ 0 시 [처치 ← 처치 + 1]
//   getScoreText()     → HUD 텍스트: "턴: N | 처치: M"
//   resetScore()       → resetGame() 호출 시 점수 0으로 복원
//
// HP 곡선: 1~5턴=hp1, 6~10턴=hp2, 11~15턴=hp3 … (5턴마다 +1)
// killCount는 모듈 스코프 let 변수로 보관한다 (gameState에 새 필드 추가 금지).
import { gameState } from './state.js';

let killCount = 0;

/**
 * 현재 턴에 비례해서 적 최대 체력을 갱신한다.
 * 1~5턴 → 1, 6~10턴 → 2, 11~15턴 → 3, …
 *
 * @returns {void}
 */
export function updateDifficulty() {
  const newMaxHp = Math.ceil(gameState.현재_턴 / 5);
  if (newMaxHp !== gameState.적_최대_체력) {
    console.log(
      `[difficulty] 적_최대_체력 ${gameState.적_최대_체력} → ${newMaxHp} (턴=${gameState.현재_턴})`,
    );
  }
  gameState.적_최대_체력 = newMaxHp;
}

/**
 * 적 1마리 처치 카운트를 1 증가시킨다.
 * collision.js에서 적 hp가 0 이하로 떨어진 직후에 호출한다.
 *
 * @returns {void}
 */
export function recordKill() {
  killCount += 1;
}

/**
 * HUD 표시용 점수 문자열.
 * @returns {string} 예: "턴: 12 | 처치: 34"
 */
export function getScoreText() {
  return `턴: ${gameState.현재_턴} | 처치: ${killCount}`;
}

/**
 * 처치 카운트를 0으로 초기화한다 (게임 재시작 시).
 * @returns {void}
 */
export function resetScore() {
  killCount = 0;
}

/**
 * @returns {number} 현재 누적 처치 수 (테스트/디버그용).
 */
export function getKillCount() {
  return killCount;
}

export const __TEST__ = {
  reset() {
    killCount = 0;
  },
};
