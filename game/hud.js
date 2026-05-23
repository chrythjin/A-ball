import { gameState, 적_체력_리스트 } from './state.js';
import { getScoreText } from './difficulty.js';

export function updateHUD() {
  const hudElement = document.getElementById('ui-hud');
  if (!hudElement) return;

  hudElement.innerHTML = `${getScoreText()} | 공: ${gameState.공_개수} | 데미지: ${gameState.공_데미지} | 속도: ${gameState.공_속도} | 상태: ${gameState.게임_상태} | 날아간공: ${gameState.현재_날아간_공}`;
}

export function showDebugList(list) {
  const debugElement = document.getElementById('debug-list');
  if (!debugElement) return;

  debugElement.innerHTML = `적HP리스트: [${list.length}개] ${list[0] ?? '-'}`;
}
