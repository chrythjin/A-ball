import { soundManager } from './sound-manager.js';

const flashes = [];
const particles = [];
const shocks = [];
const combos = [];
const lasers = [];
const explosions = [];

export function playLaunchSound() {
  soundManager.playSFX('ball-launch');
}

export function playKillSound() {
  soundManager.playSFX('enemy-kill');
}

export function flashEnemy(ctx, enemy) {
  flashes.push({ x: enemy.x, y: enemy.y, frames: 3 });
}

export function spawnHitSparks(x, y, color) {
  for (let i = 0; i < 8; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 5,
      vy: (Math.random() - 0.5) * 5,
      size: 1.5 + Math.random() * 2,
      color,
      alpha: 1,
      decay: 0.04 + Math.random() * 0.03,
      type: 'spark'
    });
  }
}

export function spawnBlockShatter(x, y, width, height, color) {
  for (let i = 0; i < 12; i++) {
    particles.push({
      x: x + Math.random() * width,
      y: y + Math.random() * height,
      vx: (Math.random() - 0.5) * 6,
      vy: -2 - Math.random() * 4,
      size: 3 + Math.random() * 4,
      color,
      alpha: 1,
      decay: 0.015 + Math.random() * 0.012,
      gravity: 0.18,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.25,
      type: 'shard'
    });
  }
}

export function spawnShockwave(x, y, color) {
  shocks.push({
    x,
    y,
    radius: 4,
    maxRadius: 30,
    color,
    alpha: 1,
    speed: 1.4
  });
}

export function spawnComboText(x, y, comboCount) {
  combos.push({
    x,
    y,
    text: `COMBO X${comboCount}!`,
    alpha: 1,
    scale: 1.6,
    vy: -1.4,
    life: 50
  });
}

export function spawnCrossLaser(cx, cy, color) {
  lasers.push({
    cx,
    cy,
    color,
    alpha: 1,
    width: 12
  });
}

export function spawnBlastExplosion(cx, cy, color) {
  explosions.push({
    cx,
    cy,
    color,
    radius: 10,
    maxRadius: 80,
    alpha: 1
  });
}

export function updateEffects(ctx) {
  for (let i = flashes.length - 1; i >= 0; i--) {
    const flash = flashes[i];
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillRect(flash.x, flash.y, 60, 30);
    ctx.restore();
    
    flash.frames--;
    if (flash.frames <= 0) {
      flashes.splice(i, 1);
    }
  }

  for (let i = shocks.length - 1; i >= 0; i--) {
    const s = shocks[i];
    s.radius += s.speed;
    s.alpha -= 0.045;
    if (s.alpha <= 0 || s.radius >= s.maxRadius) {
      shocks.splice(i, 1);
      continue;
    }
    ctx.save();
    ctx.strokeStyle = s.color;
    ctx.globalAlpha = s.alpha;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  for (let i = lasers.length - 1; i >= 0; i--) {
    const l = lasers[i];
    l.alpha -= 0.07;
    l.width -= 0.8;
    if (l.alpha <= 0 || l.width <= 0) {
      lasers.splice(i, 1);
      continue;
    }
    ctx.save();
    ctx.globalAlpha = l.alpha;
    ctx.strokeStyle = l.color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = l.color;
    ctx.lineWidth = l.width;
    
    ctx.beginPath();
    ctx.moveTo(0, l.cy);
    ctx.lineTo(CANVAS_WIDTH, l.cy);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(l.cx, 0);
    ctx.lineTo(l.cx, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.restore();
  }

  for (let i = explosions.length - 1; i >= 0; i--) {
    const e = explosions[i];
    e.radius += 5;
    e.alpha -= 0.06;
    if (e.alpha <= 0 || e.radius >= e.maxRadius) {
      explosions.splice(i, 1);
      continue;
    }
    ctx.save();
    ctx.globalAlpha = e.alpha;
    ctx.fillStyle = e.color;
    ctx.shadowBlur = 20;
    ctx.shadowColor = e.color;
    
    ctx.beginPath();
    ctx.arc(e.cx, e.cy, e.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= p.decay;
    
    if (p.gravity) {
      p.vy += p.gravity;
    }
    if (p.angle !== undefined && p.spin !== undefined) {
      p.angle += p.spin;
    }
    
    if (p.alpha <= 0) {
      particles.splice(i, 1);
      continue;
    }
    
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    
    if (p.type === 'shard') {
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.beginPath();
      ctx.moveTo(-p.size, -p.size);
      ctx.lineTo(p.size, -p.size);
      ctx.lineTo(0, p.size);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  for (let i = combos.length - 1; i >= 0; i--) {
    const c = combos[i];
    c.y += c.vy;
    c.life--;
    c.alpha = Math.max(0, c.life / 50);
    c.scale = 1 + (c.life / 50) * 0.8;
    
    if (c.life <= 0) {
      combos.splice(i, 1);
      continue;
    }
    
    ctx.save();
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ff00ff';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00ffff';
    ctx.globalAlpha = c.alpha;
    
    ctx.translate(c.x, c.y);
    ctx.scale(c.scale, c.scale);
    ctx.fillText(c.text, 0, 0);
    ctx.restore();
  }
}

export function screenShake(canvas, duration = 300) {
  if (!canvas) return;
  
  soundManager.playSFX('screen-shake');
  const startTime = performance.now();
  
  function shake() {
    const elapsed = performance.now() - startTime;
    if (elapsed < duration) {
      const dx = (Math.random() - 0.5) * 8;
      const dy = (Math.random() - 0.5) * 8;
      canvas.style.transform = `translate(${dx}px, ${dy}px)`;
      requestAnimationFrame(shake);
    } else {
      canvas.style.transform = 'translate(0px, 0px)';
    }
  }
  
  requestAnimationFrame(shake);
}
