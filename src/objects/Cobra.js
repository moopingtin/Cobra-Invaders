const TYPES = {
  regular: { key: 'cobra',      hp: 1,  speed: 90,  points: 10,  scale: 1.0, shootDelay: 1500, trackSpeed: 80  },
  fast:    { key: 'cobra-fast', hp: 1,  speed: 135, points: 20,  scale: 0.9, shootDelay: 1500, trackSpeed: 110 },
  tank:    { key: 'cobra-tank', hp: 3,  speed: 55,  points: 50,  scale: 1.1, shootDelay: 2000, trackSpeed: 40  },
  boss:    { key: 'cobra-boss', hp: 10, speed: 40,  points: 500, scale: 1.4, shootDelay: 1000, trackSpeed: 25  },
};

export default class Cobra {
  static create(scene, type, x, waveSpeed = 1) {
    const def = TYPES[type];
    const cobra = scene.physics.add.sprite(x, -60, def.key);
    cobra.cobraType = type;
    cobra.isBoss = type === 'boss';
    cobra.hp = def.hp;
    cobra.maxHp = def.hp;
    cobra.points = def.points;
    cobra.baseSpeed = def.speed * waveSpeed;
    cobra.trackSpeed = def.trackSpeed;
    cobra.frozen = false;
    cobra.shootDelay = def.shootDelay;
    cobra.nextShootTime = scene.time.now + def.shootDelay;
    cobra.setScale(def.scale);
    cobra.setDepth(5);
    cobra.body.setAllowGravity(false);
    cobra.setVelocityY(cobra.baseSpeed);

    cobra.takeDamage = function (amount) {
      this.hp -= amount;
      scene.tweens.add({
        targets: this,
        alpha: 0.3,
        duration: 60,
        yoyo: true,
        onComplete: () => { if (this.active) this.setAlpha(1); }
      });
      return this.hp <= 0;
    };

    // Freeze stops velocity; the homing update loop won't touch frozen cobras
    cobra.freeze = function (duration = 2000) {
      if (this.frozen) return;
      this.frozen = true;
      this.setVelocity(0, 0);
      this.setTint(0x88eeff);
      scene.time.delayedCall(duration, () => {
        if (!this.active) return;
        this.frozen = false;
        this.clearTint();
        this.setVelocityY(this.baseSpeed);
        this.nextShootTime = scene.time.now + this.shootDelay;
      });
    };

    return cobra;
  }
}
