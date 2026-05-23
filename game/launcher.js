import { gameState } from './state.js';
import { handleClick } from './controller.js';
import { launchBalls } from './ball.js';

export function initLauncher(canvas, ctx) {
  canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawScene(ctx);

    if (gameState.게임_상태 === 0 && gameState.스킬_선택중 === false) {
      drawAimLine(ctx, mouseX, mouseY);
    }
  });

  canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const fired = handleClick(mouseX, mouseY);
    if (fired) {
      const angle = getLaunchAngle(mouseX, mouseY);
      launchBalls(angle);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawScene(ctx);
    }
  });
}

export function getLaunchAngle(x, y) {
  return Math.atan2(y - 560, x - 240);
}

function drawScene(ctx) {
  ctx.fillStyle = '#9a8c98';
  ctx.fillRect(80, 80, 60, 30);
  
  ctx.fillStyle = '#4a4e69';
  ctx.fillRect(220, 560, 40, 40);
  
  ctx.beginPath();
  ctx.arc(240, 545, 8, 0, Math.PI * 2);
  ctx.fillStyle = '#f2e9e4';
  ctx.fill();
  
  ctx.fillStyle = '#ff4d4d';
  ctx.fillRect(0, 600, 480, 5);
}

function drawAimLine(ctx, targetX, targetY) {
  const startX = 240;
  const startY = 560;
  const maxLen = 200;

  const dx = targetX - startX;
  const dy = targetY - startY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  let endX = targetX;
  let endY = targetY;

  if (dist > maxLen) {
    const ratio = maxLen / dist;
    endX = startX + dx * ratio;
    endY = startY + dy * ratio;
  }

  ctx.save();
  ctx.beginPath();
  ctx.setLineDash([5, 5]);
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.strokeStyle = '#f2e9e4';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}
