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
  적_체력_리스트.splice(0, 적_체력_리스트.length);
}
