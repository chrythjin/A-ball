// 현재_턴
// 게임_상태
// 공_데미지
// 공_개수
// 공_속도
// 현재_날아간_공
// 적_최대_체력
// 스킬_선택중
export const gameState = {
  현재_턴: 1,
  게임_상태: 0, // 0: 조준 대기, 1: 공 발사 중, 2: 게임 오버
  공_데미지: 1,
  공_개수: 1,
  공_속도: 15,
  현재_날아간_공: 0,
  적_최대_체력: 1,
  스킬_선택중: false,
  mouseX: 240,
  mouseY: 720,
  isMouseActive: false,
  현재_스테이지: 1,
  bgm_트랙_선택: 'auto',
  골드_개수: Number.isFinite(parseInt(localStorage.getItem('game_gold') || '0', 10)) ? parseInt(localStorage.getItem('game_gold') || '0', 10) : 0,
  장착된_볼: localStorage.getItem('game_equipped_ball') || 'basic',
  보유한_볼_리스트: JSON.parse(localStorage.getItem('game_owned_balls') || '["basic"]'),
  장착된_캐릭터: localStorage.getItem('game_equipped_character') || 'frog',
  보유한_캐릭터_리스트: JSON.parse(localStorage.getItem('game_owned_characters') || '["frog"]'),
  점수: 0,
  콤보_누적_개수: 0,
  가드_월_보유: false,
  가드_월_활성화: false,
  십자_레이저_보유: false,
  블래스트_밤_보유: false,
};

export const 적_체력_리스트 = [];

export function resetState() {
  gameState.현재_턴 = 1;
  gameState.게임_상태 = 0;
  gameState.공_데미지 = 1;
  gameState.공_개수 = 1;
  gameState.공_속도 = 15;
  gameState.현재_날아간_공 = 0;
  gameState.적_최대_체력 = 1;
  gameState.스킬_선택중 = false;
  gameState.mouseX = 240;
  gameState.mouseY = 720;
  gameState.isMouseActive = false;
  gameState.현재_스테이지 = 1;
  gameState.bgm_트랙_선택 = 'auto';
  gameState.점수 = 0;
  gameState.콤보_누적_개수 = 0;
  gameState.가드_월_보유 = false;
  gameState.가드_월_활성화 = false;
  gameState.십자_레이저_보유 = false;
  gameState.블래스트_밤_보유 = false;
  적_체력_리스트.splice(0, 적_체력_리스트.length);
}
