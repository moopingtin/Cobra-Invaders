export default class CobraPlayScene extends Phaser.Scene {
  constructor() { super('CobraPlayScene'); }

  create() {
    const { width, height } = this.scale;
    this.gameOver = false;

    // Starfield
    this.stars = [];
    for (let i = 0; i < 100; i++) {
      const s = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        Math.random() < 0.15 ? 2 : 1,
        0xffffff,
        Phaser.Math.FloatBetween(0.2, 0.9)
      );
      s.scrollSpeed = Phaser.Math.FloatBetween(0.3, 1.2);
      this.stars.push(s);
    }

    // ── Player cobra ──────────────────────────────────────────────────────────
    this.lives        = 3;
    this.invincible   = false;
    this.playerSpeed  = 280;
    this.cobra = this.physics.add.sprite(width / 2, height - 80, 'cobra');
    this.cobra.setCollideWorldBounds(true);
    this.cobra.body.setAllowGravity(false);
    this.cobra.setDepth(10);
    this.lastFired    = 0;
    this.fireCooldown = 320;

    // ── Penguin enemy (flipped to face downward) ──────────────────────────────
    this.penguinHp          = 5;
    this.penguinMaxHp       = 5;
    this.penguin = this.physics.add.sprite(width / 2, 80, 'penguin-ship');
    this.penguin.setFlipY(true);
    this.penguin.setCollideWorldBounds(true);
    this.penguin.body.setAllowGravity(false);
    this.penguin.setDepth(10);
    this.penguinSpeed       = 130;
    this.penguinDir         = 1;
    this.penguinNextShoot   = 1500;
    this.penguinShootDelay  = 1600;
    this.penguinNextSummon  = 4000;
    this.penguinSummonDelay = 4000;

    // ── Bullet groups — use physics group + group.create() for proper pooling ─
    // group.create() recycles inactive sprites so there's no per-shot GC pressure.
    this.myBolts    = this.physics.add.group();
    this.enemyBolts = this.physics.add.group();

    // ── Cobra groups — use plain add.group() so adding physics sprites doesn't
    //   trigger the physics-group createCallback that would zero-out velocity.
    this.helpers    = this.add.group();
    this.evilCobras = this.add.group();

    // ── Warm up all cobra textures so the first summon has no lag spike ────────
    ['cobra', 'cobra-fast', 'cobra-tank', 'evil-cobra'].forEach(key => {
      const s = this.add.image(-500, -500, key);
      this.time.delayedCall(250, () => { if (s.active) s.destroy(); });
    });

    // ── Overlaps ──────────────────────────────────────────────────────────────
    this.physics.add.overlap(this.myBolts,    this.penguin,    this._boltHitPenguin,    null, this);
    this.physics.add.overlap(this.myBolts,    this.evilCobras, this._boltHitEvilCobra,  null, this);
    this.physics.add.overlap(this.helpers,    this.penguin,    this._helperHitPenguin,  null, this);
    this.physics.add.overlap(this.cobra, this.enemyBolts,      this._playerHitByBolt,   null, this);
    this.physics.add.overlap(this.cobra, this.evilCobras,      this._playerHitByCobra,  null, this);

    // ── Keys ──────────────────────────────────────────────────────────────────
    this.keys = this.input.keyboard.addKeys({
      left:  Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      up:    Phaser.Input.Keyboard.KeyCodes.UP,
      down:  Phaser.Input.Keyboard.KeyCodes.DOWN,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      fire:  Phaser.Input.Keyboard.KeyCodes.SPACE,
      fireZ: Phaser.Input.Keyboard.KeyCodes.Z,
      k1: Phaser.Input.Keyboard.KeyCodes.ONE,
      k2: Phaser.Input.Keyboard.KeyCodes.TWO,
      k3: Phaser.Input.Keyboard.KeyCodes.THREE,
    });
    this.input.keyboard.addCapture([
      Phaser.Input.Keyboard.KeyCodes.SPACE,
      Phaser.Input.Keyboard.KeyCodes.Z,
      Phaser.Input.Keyboard.KeyCodes.LEFT,
      Phaser.Input.Keyboard.KeyCodes.RIGHT,
      Phaser.Input.Keyboard.KeyCodes.UP,
      Phaser.Input.Keyboard.KeyCodes.DOWN,
      Phaser.Input.Keyboard.KeyCodes.A,
      Phaser.Input.Keyboard.KeyCodes.D,
      Phaser.Input.Keyboard.KeyCodes.W,
      Phaser.Input.Keyboard.KeyCodes.S,
      Phaser.Input.Keyboard.KeyCodes.ONE,
      Phaser.Input.Keyboard.KeyCodes.TWO,
      Phaser.Input.Keyboard.KeyCodes.THREE,
    ]);

    // Summon cooldowns (indices 1/2/3)
    this.summonReady = [0, 0, 0, 0];
    this.summonDelay = 2500;

    this._buildHud();
    this.input.keyboard.once('keydown-ESC', () => this.scene.start('MenuScene'));
  }

  // ── HUD ────────────────────────────────────────────────────────────────────
  _buildHud() {
    const { width, height } = this.scale;

    this.hpBg  = this.add.rectangle(width / 2, 18, 220, 12, 0x222222).setDepth(20);
    this.hpBar = this.add.rectangle(width / 2 - 110, 18, 220, 12, 0x00ccff)
      .setDepth(21).setOrigin(0, 0.5);
    this.add.text(width / 2, 28, 'PENGUIN HP', {
      fontSize: '11px', fontFamily: 'monospace', color: '#00ccff88'
    }).setOrigin(0.5, 0).setDepth(20);

    this.livesTxt = this.add.text(12, height - 32, '♥♥♥', {
      fontSize: '18px', fontFamily: 'monospace', color: '#ff4466'
    }).setDepth(20);

    this.summonTxt = this.add.text(width / 2, height - 32, '', {
      fontSize: '12px', fontFamily: 'monospace', color: '#aaffaa'
    }).setOrigin(0.5, 0).setDepth(20);

    this.add.text(width - 12, height - 32, 'ESC = MENU', {
      fontSize: '11px', fontFamily: 'monospace', color: '#445566'
    }).setOrigin(1, 0).setDepth(20);
  }

  // ── Firing ─────────────────────────────────────────────────────────────────
  _fire(time) {
    if (time - this.lastFired < this.fireCooldown) return;
    this.lastFired = time;
    const bolt = this.myBolts.create(this.cobra.x, this.cobra.y - 40, 'cobra-bolt');
    if (!bolt) return;
    bolt.body.reset(this.cobra.x, this.cobra.y - 40);
    bolt.body.setAllowGravity(false);
    bolt.setDepth(8);
    bolt.setVelocityY(-480);
  }

  _penguinFire() {
    const bolt = this.enemyBolts.create(this.penguin.x, this.penguin.y + 40, 'laser-bolt');
    if (!bolt) return;
    bolt.body.reset(this.penguin.x, this.penguin.y + 40);
    bolt.body.setAllowGravity(false);
    bolt.setDepth(8);
    bolt.setVelocityY(300);
  }

  // ── Penguin summons an evil cobra that descends and tracks the player ───────
  _spawnEvilCobra() {
    const x = Phaser.Math.Between(60, this.scale.width - 60);
    const c = this.physics.add.sprite(x, 140, 'evil-cobra');
    c.body.setAllowGravity(false);
    c.setDepth(5);
    c.setVelocityY(95);
    this.evilCobras.add(c);
  }

  // ── Player summons a helper cobra flying horizontally ─────────────────────
  _summon(type, time) {
    const idx = { regular: 1, fast: 2, tank: 3 }[type];
    if (time - this.summonReady[idx] < this.summonDelay) return;
    this.summonReady[idx] = time;

    const { width, height } = this.scale;
    const fromLeft  = Math.random() < 0.5;
    const x = fromLeft ? -70 : width + 70;
    const y = Phaser.Math.Between(60, (height / 2) - 20);

    const spriteKey = { regular: 'cobra', fast: 'cobra-fast', tank: 'cobra-tank' }[type];
    const damage    = { regular: 1,       fast: 1,            tank: 2            }[type];
    const speed     = { regular: 190,     fast: 280,          tank: 140          }[type];

    const c = this.physics.add.sprite(x, y, spriteKey);
    c.body.setAllowGravity(false);
    c.setDepth(5);
    c.setVelocity(fromLeft ? speed : -speed, 0);
    c.setRotation(fromLeft ? Math.PI / 2 : -Math.PI / 2);
    c.hitDamage = damage;
    this.helpers.add(c); // plain group — no createCallback to reset velocity
  }

  // ── Collision callbacks ────────────────────────────────────────────────────
  _boltHitPenguin(bolt) {
    if (!bolt.active) return;
    bolt.setActive(false).setVisible(false); // pool for reuse
    this._damagePenguin(1);
  }

  _boltHitEvilCobra(bolt, evil) {
    if (!bolt.active || !evil.active) return;
    bolt.setActive(false).setVisible(false);
    evil.destroy();
  }

  _helperHitPenguin(helper) {
    if (!helper.active) return;
    const dmg = helper.hitDamage || 1;
    helper.destroy();
    this._damagePenguin(dmg);
  }

  _playerHitByBolt(_, bolt) {
    if (!bolt.active || this.invincible) return;
    bolt.setActive(false).setVisible(false);
    this._loseLife();
  }

  _playerHitByCobra(_, evil) {
    if (!evil.active || this.invincible) return;
    evil.destroy();
    this._loseLife();
  }

  _loseLife() {
    this.lives--;
    this.livesTxt.setText('♥'.repeat(Math.max(0, this.lives)));
    if (this.lives <= 0) { this._lose(); return; }
    this.invincible = true;
    this.tweens.add({
      targets: this.cobra, alpha: 0, duration: 100, yoyo: true, repeat: 4,
      onComplete: () => { this.invincible = false; this.cobra.setAlpha(1); }
    });
  }

  _damagePenguin(amount) {
    this.penguinHp = Math.max(0, this.penguinHp - amount);
    this.hpBar.width = 220 * (this.penguinHp / this.penguinMaxHp);
    this.tweens.add({
      targets: this.penguin, alpha: 0.3, duration: 80, yoyo: true,
      onComplete: () => { if (this.penguin.active) this.penguin.setAlpha(1); }
    });
    if (this.penguinHp <= 0) this._win();
  }

  // ── End-game ───────────────────────────────────────────────────────────────
  _endGame(title, color) {
    if (this.gameOver) return;
    this.gameOver = true;
    this.physics.pause();
    const { width, height } = this.scale;
    this.add.text(width / 2, height / 2 - 24, title, {
      fontSize: '52px', fontFamily: 'monospace', color,
      stroke: '#000', strokeThickness: 6
    }).setOrigin(0.5).setDepth(30);
    this.add.text(width / 2, height / 2 + 44, 'PRESS SPACE TO RETURN', {
      fontSize: '16px', fontFamily: 'monospace', color: '#aaaacc'
    }).setOrigin(0.5).setDepth(30);
    this.input.keyboard.once('keydown-SPACE', () => this.scene.start('MenuScene'));
  }

  _win()  { this._endGame('YOU WIN!',  '#ffee00'); }
  _lose() { this._endGame('GAME OVER', '#ff2200'); }

  // ── Update ─────────────────────────────────────────────────────────────────
  update(time) {
    if (this.gameOver) return;
    const { width, height } = this.scale;

    // Stars
    this.stars.forEach(s => { s.y += s.scrollSpeed; if (s.y > height + 4) s.y = -4; });

    // Player movement (lower half only)
    const { left, right, up, down, a, d, w, s, fire, fireZ, k1, k2, k3 } = this.keys;
    this.cobra.setVelocityX(
      (left.isDown  || a.isDown) ? -this.playerSpeed :
      (right.isDown || d.isDown) ?  this.playerSpeed : 0
    );
    this.cobra.setVelocityY(
      (up.isDown   || w.isDown) ? -this.playerSpeed :
      (down.isDown || s.isDown) ?  this.playerSpeed : 0
    );
    if (this.cobra.y < height * 0.5) this.cobra.setY(height * 0.5);

    // Fire
    if (fire.isDown || fireZ.isDown) this._fire(time);

    // Summon helpers
    if (Phaser.Input.Keyboard.JustDown(k1)) this._summon('regular', time);
    if (Phaser.Input.Keyboard.JustDown(k2)) this._summon('fast',    time);
    if (Phaser.Input.Keyboard.JustDown(k3)) this._summon('tank',    time);

    // Penguin bounces
    this.penguin.setVelocityX(this.penguinSpeed * this.penguinDir);
    if (this.penguin.x >= width - 60) this.penguinDir = -1;
    if (this.penguin.x <= 60)         this.penguinDir =  1;

    // Penguin shoots
    if (time >= this.penguinNextShoot) {
      this.penguinNextShoot = time + this.penguinShootDelay;
      this._penguinFire();
    }

    // Penguin summons evil cobras
    if (time >= this.penguinNextSummon) {
      this.penguinNextSummon = time + this.penguinSummonDelay;
      this._spawnEvilCobra();
    }

    // Evil cobras track player horizontally
    this.evilCobras.getChildren().forEach(c => {
      if (!c.active || !c.body) return;
      c.setVelocityX(Phaser.Math.Clamp(this.cobra.x - c.x, -80, 80));
    });

    // Summon HUD
    const rdy = i => (time - this.summonReady[i]) >= this.summonDelay;
    this.summonTxt.setText(
      `[1] ${rdy(1) ? 'COBRA' : '· · ·'}   [2] ${rdy(2) ? 'FAST' : '· · ·'}   [3] ${rdy(3) ? 'TANK' : '· · ·'}`
    );

    // Pool bullets off-screen (setActive/setVisible so group.create() reuses them)
    this.myBolts.getChildren().forEach(b => {
      if (b.active && (b.y < -60 || b.y > height + 60)) b.setActive(false).setVisible(false);
    });
    this.enemyBolts.getChildren().forEach(b => {
      if (b.active && (b.y < -60 || b.y > height + 60)) b.setActive(false).setVisible(false);
    });

    // Destroy off-screen cobra sprites
    this.helpers.getChildren().forEach(c => {
      if (c.active && (c.x < -120 || c.x > width + 120)) c.destroy();
    });
    this.evilCobras.getChildren().forEach(c => {
      if (c.active && c.y > height + 60) c.destroy();
    });
  }
}
