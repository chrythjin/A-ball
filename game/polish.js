let audioCtx = null;
const flashes = [];

function initAudio() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported or blocked', e);
    }
  }
}

export function playLaunchSound() {
  initAudio();
  if (!audioCtx) return;
  
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(440, audioCtx.currentTime);
    
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
  } catch (e) {
    console.warn('Audio play failed', e);
  }
}

export function playKillSound() {
  initAudio();
  if (!audioCtx) return;
  
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  } catch (e) {
    console.warn('Audio play failed', e);
  }
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
