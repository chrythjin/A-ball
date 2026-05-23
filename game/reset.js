import { resetGame } from './controller.js';
import { enemies, spawnEnemyRow } from './enemy.js';
import { balls } from './ball.js';
import { resetCooldowns, syncHpList } from './collision.js';
import { startLoop, __TEST__ as loopTest } from './loop.js';

export function fullReset(canvas, ctx) {
  if (!canvas || !ctx) {
    throw new Error('fullReset requires a canvas and 2D context');
  }

  loopTest.reset();
  resetGame();
  enemies.splice(0, enemies.length);
  balls.splice(0, balls.length);
  resetCooldowns();

  spawnEnemyRow(1);
  syncHpList();
  loopTest.markSeeded();

  startLoop(canvas, ctx);

  console.log('[reset] fullReset complete — fresh turn 1, no clones, loop restarted');
}
