import { gameState } from './state.js';
import { soundManager } from './sound-manager.js';

export const SKILL_REGISTRY = [
  { id: 1, name: '파워 업', desc: '공의 타격 데미지 +1 증가', icon: '../assets/icons/skill-power.png', active: true, sound: 'skill-power', action: () => { gameState.공_데미지 += 1; } },
  { id: 2, name: '멀티볼', desc: '최대 공 개수 +1 증가', icon: '../assets/icons/skill-multi.png', active: true, sound: 'skill-multi', action: () => { gameState.공_개수 += 1; } },
  { id: 3, name: '스피드 업', desc: '공의 발사/비행 속도 +3 증가', icon: '../assets/icons/skill-speed.png', active: true, sound: 'skill-speed', action: () => { gameState.공_속도 += 3; } },
  { id: 4, name: '실드 가드', desc: '체력 위험 시 1회 보호 (대기 중)', icon: '../assets/icons/skill-power.png', active: false, locked: true },
  { id: 5, name: '미사일 지원', desc: '매 턴 무작위 블록 타격 (대기 중)', icon: '../assets/icons/skill-multi.png', active: false, locked: true }
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
