import { gameState } from './state.js';
import { soundManager } from './sound-manager.js';
import { enemies } from './enemy.js';

export const SKILL_REGISTRY = [
  { id: 1, name: '파워 업', desc: '공의 타격 데미지 +1 증가', icon: '../assets/icons/skill-power.png', active: true, sound: 'skill-power', action: () => { gameState.공_데미지 += 1; } },
  { id: 2, name: '멀티볼', desc: '최대 공 개수 +1 증가', icon: '../assets/icons/skill-multi.png', active: true, sound: 'skill-multi', action: () => { gameState.공_개수 += 1; } },
  { id: 3, name: '스피드 업', desc: '공의 발사/비행 속도 +3 증가', icon: '../assets/icons/skill-speed.png', active: true, sound: 'skill-speed', action: () => { gameState.공_속도 += 3; } },
  { id: 4, name: '가드 월', desc: '하단에 1회용 공 반사 가드장막 소환', icon: '../assets/icons/skill-power.png', active: true, sound: 'skill-power', action: () => { gameState.가드_월_보유 = true; } },
  { id: 5, name: '십자 레이저', desc: '격파 시 가로/세로 라인 블록에 -1 피해', icon: '../assets/icons/skill-multi.png', active: true, sound: 'skill-multi', action: () => { gameState.십자_레이저_보유 = true; } },
  { id: 6, name: '블래스트 밤', desc: '격파 시 주변 100px 블록에 광역 -1 피해', icon: '../assets/icons/skill-speed.png', active: true, sound: 'skill-speed', action: () => { gameState.블래스트_밤_보유 = true; } },
  { id: 7, name: '푸시백', desc: '즉시 모든 적을 한 줄 위로 밀어올림', icon: '../assets/icons/skill-power.png', active: true, sound: 'skill-speed', action: () => { for (const e of enemies) { e.y -= 60; } } },
  { id: 8, name: '약화 광선', desc: '즉시 모든 적의 체력 -1 (1체력은 즉사)', icon: '../assets/icons/skill-multi.png', active: true, sound: 'skill-multi', action: () => { for (const e of enemies) { if (!e.isIndestructible) e.hp -= 1; } } },
  { id: 9, name: '골드 보너스', desc: '즉시 골드 +20 획득', icon: '../assets/icons/skill-speed.png', active: true, sound: 'skill-power', action: () => { gameState.골드_개수 += 20; localStorage.setItem('game_gold', String(gameState.골드_개수)); if (typeof window.updateGoldDisplay === 'function') window.updateGoldDisplay(); } }
];

export function checkSkillTrigger() {
  return (gameState.현재_턴 - 5) % 10 === 0 && gameState.현재_턴 >= 5;
}

export function showSkillPopup() {
  gameState.스킬_선택중 = true;
  soundManager.playSFX('skill-popup');
  
  const popup = document.getElementById('skill-popup');
  if (!popup) return;

  const activeSkills = SKILL_REGISTRY.filter(s => s.active);
  const shuffled = [...activeSkills].sort(() => 0.5 - Math.random()).slice(0, 3);

  let html = `<h2>스킬 선택</h2>`;
  shuffled.forEach(skill => {
    html += `
      <div class="skill-option" data-id="${skill.id}">
        <img src="${skill.icon}" alt="${skill.name}">
        <div class="skill-info">
          <div class="skill-title">${skill.name}</div>
          <div class="skill-desc">${skill.desc}</div>
        </div>
      </div>
    `;
  });
  
  popup.innerHTML = html;
  popup.style.display = 'flex';

  popup.querySelectorAll('.skill-option').forEach(el => {
    const id = parseInt(el.getAttribute('data-id'));
    el.addEventListener('click', () => {
      applySkill(id);
    });
    el.addEventListener('mouseenter', () => {
      soundManager.playSFX('ui-hover');
    });
  });
}

export function applySkill(skillId) {
  const skill = SKILL_REGISTRY.find(s => s.id === skillId);
  if (skill && skill.action) {
    skill.action();
    if (skill.sound) {
      soundManager.playSFX(skill.sound);
    }
  }
  
  gameState.스킬_선택중 = false;
  document.getElementById('skill-popup').style.display = 'none';
}
