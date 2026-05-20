import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import CobraPlayScene from './scenes/CobraPlayScene.js';
import { initCheat } from './cheat.js';

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#00000f',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false }
  },
  scene: [MenuScene, GameScene, GameOverScene, CobraPlayScene]
};

const game = new Phaser.Game(config);
initCheat(game);

// Phaser's InputPlugin sets enabled=false when 'blur' fires.
// Counter it immediately in the same tick so input is never actually lost.
game.events.on('blur', () => game.events.emit('focus'));

// Also wake the loop if the browser slept it (minimised window / hidden tab).
const wakeUp = () => {
  if (game.loop.sleeping) game.loop.wake();
  game.events.emit('focus');
};
document.addEventListener('click',   wakeUp);
document.addEventListener('keydown', wakeUp);
