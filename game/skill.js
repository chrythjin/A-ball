import { gameState } from './state.js';

export function checkSkillTrigger() {
  return (gameState.현재_턴 - 5) % 10 === 0 && gameState.현재_턴 >= 5;
}

export function showSkillPopup() {
  gameState.스킬_선택중 = true;
  document.getElementById('skill-popup').style.display = 'flex';
}

export function applySkill(skillId) {
  switch (skillId) {
    case 1:
      gameState.공_데미지 += 1;
      break;
    case 2:
      gameState.공_개수 += 2;
      break;
    case 3:
      gameState.공_속도 += 3;
      break;
  }
  
  gameState.스킬_선택중 = false;
  document.getElementById('skill-popup').style.display = 'none';
}
