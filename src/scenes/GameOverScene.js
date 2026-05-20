export default class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  create(data) {
    const { width, height } = this.scale;
    const score = data?.score ?? 0;
    const wave = data?.wave ?? 1;

    // Dark overlay
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);

    this.add.text(width / 2, 180, 'GAME OVER', {
      fontSize: '56px', fontFamily: 'monospace', color: '#ff3333',
      stroke: '#000', strokeThickness: 8
    }).setOrigin(0.5);

    this.add.text(width / 2, 270, `SCORE: ${score}`, {
      fontSize: '28px', fontFamily: 'monospace', color: '#ffee00'
    }).setOrigin(0.5);

    this.add.text(width / 2, 316, `WAVE REACHED: ${wave}`, {
      fontSize: '20px', fontFamily: 'monospace', color: '#aaaacc'
    }).setOrigin(0.5);

    const prompt = this.add.text(width / 2, 420, 'PRESS SPACE TO PLAY AGAIN', {
      fontSize: '20px', fontFamily: 'monospace', color: '#ffffff'
    }).setOrigin(0.5);

    this.tweens.add({ targets: prompt, alpha: 0, duration: 550, yoyo: true, repeat: -1 });

    this.add.text(width / 2, 470, 'PRESS M FOR MENU', {
      fontSize: '14px', fontFamily: 'monospace', color: '#666699'
    }).setOrigin(0.5);

    this.input.keyboard.addCapture([
      Phaser.Input.Keyboard.KeyCodes.SPACE,
      Phaser.Input.Keyboard.KeyCodes.R,
      Phaser.Input.Keyboard.KeyCodes.M,
    ]);
    this.input.keyboard.once('keydown-SPACE', () => this.scene.start('GameScene'));
    this.input.keyboard.once('keydown-R',     () => this.scene.start('GameScene'));
    this.input.keyboard.once('keydown-M',     () => this.scene.start('MenuScene'));
  }
}
