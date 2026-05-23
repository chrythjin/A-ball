import { soundManager } from './sound-manager.js';
const flashes = [];

export function playLaunchSound() {
  soundManager.playSFX('ball-launch');
}

export function playKillSound() {
  soundManager.playSFX('enemy-kill');
}

export function flashEnemy(ctx, enemy) {
  flashes.push({ x: enemy.x, y: enemy.y, frames: 3 });
}

export function updateEffects(ctx) {
  for (let i = flashes.length - 1; i >= 0; i--) {
    const flash = flashes[i];
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillRect(flash.x, flash.y, 60, 30); // ENEMY_WIDTH=60, ENEMY_HEIGHT=30
    ctx.restore();
    
    flash.frames--;
    if (flash.frames <= 0) {
      flashes.splice(i, 1);
    }
  }
}

export function screenShake(canvas, duration = 300) {
  if (!canvas) return;
  
  soundManager.playSFX('screen-shake');
  const startTime = performance.now();
  
  function shake() {
    const elapsed = performance.now() - startTime;
    if (elapsed < duration) {
      const dx = (Math.random() - 0.5) * 8; // ±4px
      const dy = (Math.random() - 0.5) * 8; // ±4px
      canvas.style.transform = `translate(${dx}px, ${dy}px)`;
      requestAnimationFrame(shake);
    } else {
      canvas.style.transform = 'translate(0px, 0px)';
    }
  }
  
  requestAnimationFrame(shake);
}
