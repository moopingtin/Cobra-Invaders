export default class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  preload() {
    this.load.svg('penguin-ship', './public/assets/sprites/penguin-ship.svg', { width: 64, height: 80 });
    this.load.svg('cobra', './public/assets/sprites/cobra.svg', { width: 64, height: 155 });
    this.load.svg('cobra-fast', './public/assets/sprites/cobra-fast.svg', { width: 56, height: 145 });
    this.load.svg('cobra-tank', './public/assets/sprites/cobra-tank.svg', { width: 92, height: 160 });
    this.load.svg('cobra-bolt', './public/assets/sprites/cobra-bolt.svg', { width: 8, height: 22 });
    this.load.svg('laser-bolt', './public/assets/sprites/laser-bolt.svg', { width: 8, height: 28 });
    this.load.svg('fireball', './public/assets/sprites/fireball.svg', { width: 28, height: 28 });
    this.load.svg('freeze-ray', './public/assets/sprites/freeze-ray.svg', { width: 10, height: 30 });
    this.load.svg('lightning-bolt', './public/assets/sprites/lightning-bolt.svg', { width: 10, height: 28 });
    this.load.svg('drop-fireball', './public/assets/sprites/drop-fireball.svg', { width: 40, height: 40 });
    this.load.svg('drop-double-shot', './public/assets/sprites/drop-double-shot.svg', { width: 40, height: 40 });
    this.load.svg('drop-triple-shot', './public/assets/sprites/drop-triple-shot.svg', { width: 40, height: 40 });
    this.load.svg('drop-speed', './public/assets/sprites/drop-speed.svg', { width: 40, height: 40 });
    this.load.svg('drop-baby-penguin', './public/assets/sprites/drop-baby-penguin.svg', { width: 40, height: 40 });
    this.load.svg('cobra-boss', './public/assets/sprites/cobra-boss.svg', { width: 140, height: 200 });
    this.load.svg('drop-shield', './public/assets/sprites/drop-shield.svg', { width: 40, height: 40 });
    this.load.svg('evil-cobra',  './public/assets/sprites/evil-cobra.svg',  { width: 64, height: 155 });
  }

  create() {
    const { width, height } = this.scale;

    // Starfield
    for (let i = 0; i < 120; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const r = Math.random() < 0.2 ? 2 : 1;
      this.add.circle(x, y, r, 0xffffff, Phaser.Math.FloatBetween(0.3, 1));
    }

    this.add.text(width / 2, 140, 'COBRA INVADERS', {
      fontSize: '52px',
      fontFamily: 'monospace',
      color: '#00ccff',
      stroke: '#003366',
      strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(width / 2, 205, 'defend the sky from the blue serpents', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#aaaacc'
    }).setOrigin(0.5);

    // Decorative cobras
    this.add.image(200, 320, 'cobra').setScale(0.9);
    this.add.image(width / 2, 300, 'cobra-tank').setScale(0.8);
    this.add.image(600, 320, 'cobra-fast').setScale(0.9);

    // Penguin ship
    this.add.image(width / 2, 460, 'penguin-ship').setScale(1.1);

    const prompt = this.add.text(width / 2, 550, 'PRESS SPACE TO START', {
      fontSize: '22px',
      fontFamily: 'monospace',
      color: '#ffee00'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: prompt,
      alpha: 0,
      duration: 600,
      yoyo: true,
      repeat: -1
    });

    this.input.keyboard.addCapture([Phaser.Input.Keyboard.KeyCodes.SPACE]);
    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start('GameScene');
    });
  }
}
