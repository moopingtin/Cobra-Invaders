export default class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    this.sprite = scene.physics.add.sprite(x, y, 'penguin-ship');
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setDepth(10);
    this.sprite.body.setAllowGravity(false);

    this.upgradeState = {
      weapon: 'laser',   // 'laser' | 'fireball' | 'freeze'
      shotCount: 1,      // 1, 2, or 3
      speedBoost: false,
      shield: false,
      weaponTimer: null,
      speedTimer: null,
    };

    this.baseSpeed = 280;
    this.lastFired = 0;
    this.fireCooldown = 300;

    this.keys = scene.input.keyboard.addKeys({
      left:  Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      up:   Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      a:    Phaser.Input.Keyboard.KeyCodes.A,
      d:    Phaser.Input.Keyboard.KeyCodes.D,
      w:    Phaser.Input.Keyboard.KeyCodes.W,
      s:    Phaser.Input.Keyboard.KeyCodes.S,
      fire:  Phaser.Input.Keyboard.KeyCodes.SPACE,
      fireZ: Phaser.Input.Keyboard.KeyCodes.Z,
    });
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }

  get speed() {
    return this.upgradeState.speedBoost ? this.baseSpeed * 1.6 : this.baseSpeed;
  }

  fire(projectileGroup) {
    const now = this.scene.time.now;
    if (now - this.lastFired < this.fireCooldown) return;
    this.lastFired = now;

    const { weapon, shotCount } = this.upgradeState;
    const offsets = this._shotOffsets(shotCount);
    const projectileType = shotCount >= 3 ? 'lightning' : weapon;

    for (const ox of offsets) {
      if (weapon === 'freeze') {
        this.scene.fireFreezeBeam(this.x + ox, this.y - 30);
      } else {
        projectileGroup.fireFrom(this.x + ox, this.y - 30, projectileType);
      }
    }
  }

  _shotOffsets(count) {
    if (count === 1) return [0];
    if (count === 2) return [-12, 12];
    return [-20, 0, 20];
  }

  applyUpgrade(type) {
    const s = this.upgradeState;
    const scene = this.scene;

    if (type === 'double-shot') {
      if (s.shotCount < 2) s.shotCount = 2;
      return;
    }
    if (type === 'triple-shot') {
      s.shotCount = 3;
      return;
    }
    if (type === 'speed') {
      s.speedBoost = true;
      if (s.speedTimer) s.speedTimer.remove();
      s.speedTimer = scene.time.delayedCall(10000, () => {
        s.speedBoost = false;
        s.speedTimer = null;
        scene.events.emit('upgrade-expired', 'speed');
      });
      scene.events.emit('upgrade-gained', 'speed', 10000);
      return;
    }
    if (type === 'fireball') {
      s.weapon = 'fireball';
      if (s.weaponTimer) s.weaponTimer.remove();
      s.weaponTimer = scene.time.delayedCall(15000, () => {
        s.weapon = 'laser';
        s.weaponTimer = null;
        scene.events.emit('upgrade-expired', 'fireball');
      });
      scene.events.emit('upgrade-gained', 'fireball', 15000);
      return;
    }
    if (type === 'freeze') {
      s.weapon = 'freeze';
      if (s.weaponTimer) s.weaponTimer.remove();
      s.weaponTimer = scene.time.delayedCall(15000, () => {
        s.weapon = 'laser';
        s.weaponTimer = null;
        scene.events.emit('upgrade-expired', 'freeze');
      });
      scene.events.emit('upgrade-gained', 'freeze', 15000);
      return;
    }
    if (type === 'shield') {
      s.shield = true;
      scene.events.emit('upgrade-gained', 'shield', 0);
    }
  }

  update() {
    const { left, right, up, down, a, d, w, s, fire, fireZ } = this.keys;
    const movingLeft  = left.isDown  || a.isDown;
    const movingRight = right.isDown || d.isDown;
    const movingUp    = up.isDown    || w.isDown;
    const movingDown  = down.isDown  || s.isDown;

    if (movingLeft)       this.sprite.setVelocityX(-this.speed);
    else if (movingRight) this.sprite.setVelocityX(this.speed);
    else                  this.sprite.setVelocityX(0);

    if (movingUp)        this.sprite.setVelocityY(-this.speed);
    else if (movingDown) this.sprite.setVelocityY(this.speed);
    else                 this.sprite.setVelocityY(0);

    if (fire.isDown || fireZ.isDown) {
      this.fire(this.scene.projectiles);
    }
  }
}
