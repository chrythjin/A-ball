import { gameState, 적_체력_리스트 } from './state.js';
import { getScoreText } from './difficulty.js';

export function updateHUD() {
  const turnEl = document.getElementById('hud-turn');
  const scoreEl = document.getElementById('hud-score');
  const ballsEl = document.getElementById('hud-balls');
  const powerEl = document.getElementById('hud-power');
  const speedEl = document.getElementById('hud-speed');
  const goldEl = document.getElementById('hud-gold');

  if (turnEl) turnEl.textContent = String(gameState.현재_턴).padStart(2, '0');
  if (scoreEl) scoreEl.textContent = String(gameState.점수);
  if (ballsEl) ballsEl.textContent = String(gameState.공_개수);
  if (powerEl) powerEl.textContent = String(gameState.공_데미지);
  if (speedEl) speedEl.textContent = String(gameState.공_속도);
  if (goldEl) goldEl.textContent = String(gameState.골드_개수);
}

export function showDebugList(list) {
  const debugElement = document.getElementById('debug-list');
  if (!debugElement) return;

  debugElement.innerHTML = `적HP리스트: [${list.length}개] ${list[0] ?? '-'}`;
}
