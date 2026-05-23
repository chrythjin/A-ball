import { gameState } from './state.js';
import { handleClick } from './controller.js';
import { launchBalls } from './ball.js';

export function initLauncher(canvas, ctx) {
  canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    gameState.mouseX = event.clientX - rect.left;
    gameState.mouseY = event.clientY - rect.top;
    gameState.isMouseActive = true;
  });

  canvas.addEventListener('mouseleave', () => {
    gameState.isMouseActive = false;
  });

  canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    const fired = handleClick(clickX, clickY);
    if (fired) {
      const angle = getLaunchAngle(clickX, clickY);
      launchBalls(angle);
    }
  });
}

export function getLaunchAngle(x, y) {
  return Math.atan2(y - 720, x - 240);
}
