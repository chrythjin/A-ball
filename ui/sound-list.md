# 사운드/효과음 에셋 리스트

이 문서는 "더 볼 (The Ball)" 게임의 사운드 및 효과음 에셋을 정리한 목록입니다.
각 상황별로 필요한 사운드, 용도, 권장 사양을 포함합니다.

---

## 공 (Ball) 관련 사운드

| # | 사운드명 | 트리거 시점 | 현재 구현 | 권장 형식 | 권장 길이 | 비고 |
|---|----------|-------------|-----------|-----------|-----------|------|
| 1 | 공 발사 | launchBalls() 호출 시 | square 440Hz, 0.05s | OGG or MP3 | 0.05~0.1초 | 짧고 경쾌한 "퐁" 소리, 발사감 |
| 2 | 공 벽 반사 | 좌우벽/천장 반사 시 | 없음 | OGG or MP3 | 0.03~0.05초 | 가볍게 "틱" 하는 소리 |
| 3 | 공 적 충돌 | 적 블록에 맞았을 때 | 없음 | OGG or MP3 | 0.05~0.1초 | 타격감 있는 "탁" 소리 |
| 4 | 공 회수 | 바닥(COLLECT_Y)에 도달 시 | 없음 | OGG or MP3 | 0.05초 | 부드러운 "슉" 소리 |
| 5 | 전체 공 회수 완료 | 모든 공이 돌아왔을 때 (턴 종료) | 없음 | OGG or MP3 | 0.2~0.3초 | "딩" 하는 완료음 |

---

## 적 (Enemy) 관련 사운드

| # | 사운드명 | 트리거 시점 | 현재 구현 | 권장 형식 | 권장 길이 | 비고 |
|---|----------|-------------|-----------|-----------|-----------|------|
| 6 | 적 처치 | enemy.hp <= 0 | sine 880Hz, 0.1s | OGG or MP3 | 0.1~0.2초 | 파괴되는 "펑" 소리, 경쾌한 톤 |
| 7 | 적 스폰 | spawnEnemyRow() 호출 시 | 없음 | OGG or MP3 | 0.2~0.3초 | 긴장감 있는 "우웅" 소리 |
| 8 | 적 하강 | descendEnemies() 호출 시 | 없음 | OGG or MP3 | 0.3~0.5초 | 묵직한 "쿵" 또는 진동음 |
| 9 | 적 데드라인 도달 | checkGameOver() true 시 | 없음 | OGG or MP3 | 0.5~1초 | 위험/경고 알람음 |

---

## UI/시스템 사운드

| # | 사운드명 | 트리거 시점 | 현재 구현 | 권장 형식 | 권장 길이 | 비고 |
|---|----------|-------------|-----------|-----------|-----------|------|
| 10 | 게임 시작 | 로비 → 인게임 전환 시 | 없음 | OGG or MP3 | 0.3~0.5초 | 시작 팡파르 또는 "슈잉" |
| 11 | 버튼 클릭 | 모든 UI 버튼 클릭 시 | 없음 | OGG or MP3 | 0.05~0.1초 | 가벼운 "틱" 클릭음 |
| 12 | 버튼 호버 | 버튼에 마우스 올렸을 때 | 없음 | OGG or MP3 | 0.03초 | 미세한 "틱" 또는 없어도 됨 |
| 13 | 게임오버 | setGameState(2) 호출 시 | 없음 | OGG or MP3 | 1~2초 | 무거운 실패음, 저음 "두둥" |
| 14 | 화면 흔들림 | screenShake() 호출 시 | 없음 | OGG or MP3 | 0.3~0.5초 | 진동/충격음, 게임오버와 함께 재생 |

---

## 스킬 관련 사운드

| # | 사운드명 | 트리거 시점 | 현재 구현 | 권장 형식 | 권장 길이 | 비고 |
|---|----------|-------------|-----------|-----------|-----------|------|
| 15 | 스킬 팝업 등장 | showSkillPopup() 호출 시 | 없음 | OGG or MP3 | 0.3~0.5초 | 주목을 끄는 "짠!" 효과음 |
| 16 | 스킬 선택 (파워업) | applySkill(1) 호출 시 | 없음 | OGG or MP3 | 0.3~0.5초 | 강화 느낌의 "파워업" 사운드 |
| 17 | 스킬 선택 (멀티볼) | applySkill(2) 호출 시 | 없음 | OGG or MP3 | 0.3~0.5초 | 분열/복제 느낌의 사운드 |
| 18 | 스킬 선택 (스피드업) | applySkill(3) 호출 시 | 없음 | OGG or MP3 | 0.3~0.5초 | 가속 느낌의 "슈웅" 사운드 |

---

## BGM (배경음악)

| # | 사운드명 | 재생 구간 | 현재 구현 | 권장 형식 | 권장 길이 | 비고 |
|---|----------|-----------|-----------|-----------|-----------|------|
| 19 | 로비 BGM | 로비 화면 | 없음 | OGG or MP3 | 30~60초 루프 | 차분하고 미스터리한 분위기, 루프 가능 |
| 20 | 인게임 BGM | 게임 플레이 중 | 없음 | OGG or MP3 | 60~120초 루프 | 긴장감 있는 일렉트로닉, 템포 중간 |
| 21 | 게임오버 BGM | 게임오버 화면 | 없음 | OGG or MP3 | 10~20초 | 슬프거나 무거운 분위기, 루프 또는 페이드아웃 |

### BGM 상세 요구사항

| 항목 | 로비 BGM | 인게임 BGM | 게임오버 BGM |
|------|----------|------------|--------------|
| 분위기 | 차분, 미스터리, 공간감 | 긴장, 에너지, 집중 | 무거움, 아쉬움, 여운 |
| 템포 (BPM) | 80~100 | 120~140 | 60~80 |
| 장르 | 앰비언트 / 칠아웃 | 일렉트로닉 / 신스웨이브 | 앰비언트 / 피아노 |
| 루프 | 심리스 루프 필수 | 심리스 루프 필수 | 루프 또는 페이드아웃 |
| 전환 | 페이드아웃 0.5초 | 페이드인 0.3초 | 크로스페이드 0.5초 |
| 볼륨 | 0.3 (효과음보다 낮게) | 0.25 (게임 집중 방해 X) | 0.35 |

### BGM 재생 로직 (권장 구현)

```javascript
// bgm-manager.js (권장 구현 예시)
const BGM = {
  lobby: new Audio('assets/sounds/bgm/lobby.ogg'),
  ingame: new Audio('assets/sounds/bgm/ingame.ogg'),
  gameover: new Audio('assets/sounds/bgm/gameover.ogg'),
};

let currentBGM = null;

function playBGM(track, loop = true) {
  if (currentBGM) {
    fadeOut(currentBGM, 0.5);
  }
  currentBGM = BGM[track];
  currentBGM.loop = loop;
  currentBGM.volume = 0;
  currentBGM.play();
  fadeIn(currentBGM, 0.3, track === 'ingame' ? 0.25 : 0.3);
}

function fadeIn(audio, duration, targetVolume) {
  // 점진적 볼륨 증가 구현
}

function fadeOut(audio, duration) {
  // 점진적 볼륨 감소 후 pause() 호출
}
```

---

## 에셋 디렉토리 구조 (권장)

```
A-ball/
├── assets/
│   └── sounds/
│       ├── sfx/
│       │   ├── ball-launch.ogg
│       │   ├── ball-wall.ogg
│       │   ├── ball-hit.ogg
│       │   ├── ball-collect.ogg
│       │   ├── ball-all-collected.ogg
│       │   ├── enemy-kill.ogg
│       │   ├── enemy-spawn.ogg
│       │   ├── enemy-descend.ogg
│       │   ├── enemy-deadline.ogg
│       │   ├── ui-start.ogg
│       │   ├── ui-click.ogg
│       │   ├── ui-hover.ogg
│       │   ├── gameover.ogg
│       │   ├── screen-shake.ogg
│       │   ├── skill-popup.ogg
│       │   ├── skill-power.ogg
│       │   ├── skill-multi.ogg
│       │   └── skill-speed.ogg
│       └── bgm/
│           ├── lobby.ogg
│           ├── ingame.ogg
│           └── gameover.ogg
```

---

## 기술 사양 참고

| 항목 | 권장값 | 비고 |
|------|--------|------|
| 형식 | OGG (기본) + MP3 (폴백) | 브라우저 호환성 확보 |
| 샘플레이트 | 44100 Hz | 웹 표준 |
| 비트레이트 | 128kbps (효과음), 192kbps (BGM) | 파일 크기와 품질 균형 |
| 채널 | 모노 (효과음), 스테레오 (BGM) | 효과음은 모노로 충분 |
| 볼륨 정규화 | -3dB 기준 | 효과음 간 볼륨 일관성 유지 |
| 무음 구간 | 시작/끝 0ms | 트리밍 필수, 반응 속도 확보 |

---

## 현재 구현 방식 (Web Audio API 오실레이터)

현재 `polish.js`에서 사용 중인 임시 사운드:

| 함수 | 파형 | 주파수 | 길이 | 볼륨 |
|------|------|--------|------|------|
| `playLaunchSound()` | square | 440Hz | 0.05초 | 0.1 → 0.01 (감쇄) |
| `playKillSound()` | sine | 880Hz | 0.1초 | 0.1 → 0.01 (감쇄) |

이 오실레이터 기반 사운드를 실제 사운드 파일로 교체하면 게임 퀄리티가 크게 향상됩니다.

---

## 대안: 사운드 파일 없이 개선하는 방법

- **Web Audio API 확장** - 현재 오실레이터에 필터(BiquadFilter), 딜레이, 컨볼버 추가로 풍성한 합성음 생성
- **jsfxr / sfxr** - 레트로 게임 효과음 생성기 (https://sfxr.me)
- **무료 사운드 사이트** - freesound.org, opengameart.org, mixkit.co
- **Tone.js 라이브러리** - 더 정교한 웹 오디오 합성 (외부 의존성 추가 필요)
