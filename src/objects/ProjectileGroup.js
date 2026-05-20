const CONFIGS = {
  laser:   { key: 'laser-bolt',   damage: 1, speed: 600 },
  fireball:{ key: 'fireball',     damage: 2, speed: 450 },
  freeze:  { key: 'freeze-ray',   damage: 1, speed: 520 },
  lightning:{ key: 'lightning-bolt', damage: 1, speed: 580 },
};

export default class ProjectileGroup extends Phaser.Physics.Arcade.Group {
  constructor(scene) {
    super(scene.physics.world, scene);
    this.scene = scene;
  }

  fireFrom(x, y, weapon) {
    const cfg = CONFIGS[weapon] || CONFIGS.laser;

    const bullet = this.get(x, y, cfg.key);
    if (!bullet) return;

    bullet.setActive(true).setVisible(true).setDepth(8);
    bullet.damage = cfg.damage;
    bullet.weaponType = weapon;
    bullet.body.reset(x, y);
    bullet.setVelocityY(-cfg.speed);
    bullet.body.setAllowGravity(false);
  }

  update() {
    this.getChildren().forEach(b => {
      if (b.active && b.y < -50) {
        b.setActive(false).setVisible(false);
      }
    });
  }
}
