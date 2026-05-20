import Player from '../objects/Player.js';
import Cobra from '../objects/Cobra.js';
import ProjectileGroup from '../objects/ProjectileGroup.js';
import UpgradeDrop from '../objects/UpgradeDrop.js';

const COBRA_DROP_CHANCE = 0.25;
const AMBIENT_INTERVAL_MIN = 20000;
const AMBIENT_INTERVAL_MAX = 30000;
const AMBIENT_SPAWN_CHANCE = 0.15;
const ENEMY_BOLT_SPEED = 220;

export default class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    const { width, height } = this.scale;

    this.score = 0;
    this.lives = 3;
    this.wave = 0;
    this.cobrasRemaining = 0;
    this.wavePending = false;

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

    this.playerInvincible = false;

    // Groups — must be physics groups so arcade overlap iterates children correctly
    this.projectiles  = new ProjectileGroup(this);
    this.cobras       = this.physics.add.group();
    this.upgradeDrops = this.physics.add.group();
    this.enemyBullets = this.physics.add.group();

    // Player
    this.player = new Player(this, width / 2, height - 60);

    // Overlaps
    this.physics.add.overlap(this.projectiles,   this.cobras,       this._hitCobra,         null, this);
    this.physics.add.overlap(this.player.sprite, this.cobras,       this._playerHitCobra,   null, this);
    this.physics.add.overlap(this.player.sprite, this.upgradeDrops, this._collectUpgrade,   null, this);
    this.physics.add.overlap(this.player.sprite, this.enemyBullets, this._playerHitByBolt,  null, this);

    // Shield graphic (follows player)
    this.shieldCircle = this.add.circle(0, 0, 44, 0x0066ff, 0.2).setDepth(9).setVisible(false);
    this.shieldRing   = this.add.circle(0, 0, 44, 0x00ccff, 0).setStrokeStyle(3, 0x00ccff, 1).setDepth(9).setVisible(false);

    // HUD
    this._buildHud();

    this.events.on('upgrade-gained', this._onUpgradeGained, this);
    this.events.on('upgrade-expired', this._onUpgradeExpired, this);

    this.time.delayedCall(800, () => this._startNextWave());
    this._scheduleAmbientSpawn();

    // R = instant restart from scratch
    this.input.keyboard.once('keydown-R', () => this.scene.restart());

    // Prevent browser defaults (page scroll etc.) only for keys the game uses
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
      Phaser.Input.Keyboard.KeyCodes.R,
    ]);
  }

  _buildHud() {
    const { width } = this.scale;

    this.scoreTxt = this.add.text(14, 10, 'SCORE: 0', {
      fontSize: '16px', fontFamily: 'monospace', color: '#00ccff'
    }).setDepth(20);

    this.waveTxt = this.add.text(width / 2, 10, 'WAVE 1', {
      fontSize: '16px', fontFamily: 'monospace', color: '#ffffff'
    }).setOrigin(0.5, 0).setDepth(20);

    this.livesTxt = this.add.text(width - 14, 10, '', {
      fontSize: '18px', fontFamily: 'monospace', color: '#ff4466'
    }).setOrigin(1, 0).setDepth(20);
    this._updateLivesDisplay();

    this.weaponTxt = this.add.text(width / 2, 30, '[LASER]', {
      fontSize: '13px', fontFamily: 'monospace', color: '#aaffaa'
    }).setOrigin(0.5, 0).setDepth(20);

    this.timerBarBg = this.add.rectangle(width / 2, 52, 200, 8, 0x333333).setDepth(20).setVisible(false);
    this.timerBar   = this.add.rectangle(width / 2 - 100, 52, 200, 8, 0x00ff88).setDepth(21).setVisible(false).setOrigin(0, 0.5);
    this.speedBarBg = this.add.rectangle(width / 2, 65, 160, 6, 0x333333).setDepth(20).setVisible(false);
    this.speedBar   = this.add.rectangle(width / 2 - 80, 65, 160, 6, 0xffcc00).setDepth(21).setVisible(false).setOrigin(0, 0.5);

    this._weaponTimerEnd = 0;
    this._weaponTimerDuration = 0;
    this._speedTimerEnd = 0;
    this._speedTimerDuration = 0;

    this.waveBanner = this.add.text(width / 2, 300, '', {
      fontSize: '48px', fontFamily: 'monospace', color: '#ffee00',
      stroke: '#000', strokeThickness: 6
    }).setOrigin(0.5).setDepth(30).setAlpha(0);
  }

  _updateLivesDisplay() {
    this.livesTxt.setText('♥'.repeat(this.lives));
  }

  _onUpgradeGained(type, duration) {
    if (type === 'shield') {
      this._updateWeaponLabel();
      return;
    }
    if (type === 'speed') {
      this._speedTimerEnd = this.time.now + duration;
      this._speedTimerDuration = duration;
      this.speedBarBg.setVisible(true);
      this.speedBar.setVisible(true);
    } else {
      this._weaponTimerEnd = this.time.now + duration;
      this._weaponTimerDuration = duration;
      this.timerBarBg.setVisible(true);
      this.timerBar.setVisible(true);
    }
    this._updateWeaponLabel();
  }

  _onUpgradeExpired(type) {
    if (type === 'speed') {
      this.speedBarBg.setVisible(false);
      this.speedBar.setVisible(false);
    } else if (type !== 'shield') {
      this.timerBarBg.setVisible(false);
      this.timerBar.setVisible(false);
    }
    this._updateWeaponLabel();
  }

  _updateWeaponLabel() {
    const { weapon, shotCount, shield } = this.player.upgradeState;
    const names = { laser: 'LASER', fireball: 'FIREBALL', freeze: 'FREEZE RAY' };
    const shots = shotCount === 3 ? ' x3 ⚡' : shotCount === 2 ? ' x2' : '';
    const shieldTag = shield ? ' 🛡' : '';
    this.weaponTxt.setText(`[${names[weapon] || weapon}${shots}]${shieldTag}`);
  }

  _startNextWave() {
    this.wave++;
    this.wavePending = false;

    if (this.wave % 5 === 0) {
      this._startBossWave();
      return;
    }

    const count = 5 + this.wave * 2;
    const waveSpeed = 1 + (this.wave - 1) * 0.05;

    this.waveTxt.setText(`WAVE ${this.wave}`);
    this.waveBanner
      .setStyle({ fontSize: '48px', fontFamily: 'monospace', color: '#ffee00', stroke: '#000', strokeThickness: 6 })
      .setText(`WAVE ${this.wave}`)
      .setAlpha(1);
    this.tweens.add({ targets: this.waveBanner, alpha: 0, duration: 1000, delay: 800 });

    const canSpawnFast = this.wave >= 3;
    const canSpawnTank = this.wave >= 5;
    let spawned = 0;
    this.cobrasRemaining = count;

    const spawnNext = () => {
      if (spawned >= count) return;
      const r = Math.random();
      let type = 'regular';
      if (canSpawnTank && r < 0.15) type = 'tank';
      else if (canSpawnFast && r < 0.4) type = 'fast';

      const x = Phaser.Math.Between(60, this.scale.width - 60);
      const cobra = Cobra.create(this, type, x, waveSpeed);
      this.cobras.add(cobra);
      spawned++;
      if (spawned < count) this.time.delayedCall(Phaser.Math.Between(300, 700), spawnNext);
    };

    this.time.delayedCall(400, spawnNext);
  }

  _startBossWave() {
    this.cobrasRemaining = 1;
    this.waveTxt.setText(`WAVE ${this.wave}`);

    this.waveBanner
      .setStyle({ fontSize: '44px', fontFamily: 'monospace', color: '#ff2200', stroke: '#ff6600', strokeThickness: 8 })
      .setText('-- BOSS WAVE --')
      .setAlpha(1);
    this.tweens.add({ targets: this.waveBanner, alpha: 0, duration: 1200, delay: 1500 });

    this.time.delayedCall(700, () => {
      const boss = Cobra.create(this, 'boss', this.scale.width / 2, 1);
      this.cobras.add(boss);
    });
  }

  fireFreezeBeam(x, fromY) {
    let hitCobra = null;
    this.cobras.getChildren().forEach(cobra => {
      if (!cobra.active || cobra.frozen) return;
      if (cobra.y < fromY && Math.abs(cobra.x - x) < 36) {
        if (!hitCobra || cobra.y > hitCobra.y) hitCobra = cobra;
      }
    });

    const beamTopY = hitCobra ? hitCobra.y : 0;
    const beamH    = fromY - beamTopY;
    const midY     = beamTopY + beamH / 2;

    const glow = this.add.rectangle(x, midY, 14, beamH, 0x0099ee, 0.35).setDepth(8);
    const core = this.add.rectangle(x, midY,  4, beamH, 0xaaeeff, 0.9).setDepth(9);
    this.tweens.add({
      targets: [glow, core], alpha: 0, duration: 180,
      onComplete: () => { glow.destroy(); core.destroy(); }
    });

    if (hitCobra) {
      const dead = hitCobra.takeDamage(1);
      if (dead) {
        this._killCobra(hitCobra);
      } else {
        hitCobra.freeze(4000);
      }
    }
  }

  _cobraShoot(cobra) {
    // Bolts fire straight down; boss spreads three around the downward axis
    const down = Math.PI / 2;
    const angles = cobra.isBoss
      ? [down - 0.35, down, down + 0.35]
      : [down];

    const originY = cobra.y + (cobra.isBoss ? 50 : 30);

    for (const angle of angles) {
      const bolt = this.enemyBullets.create(cobra.x, originY, 'cobra-bolt');
      bolt.setDepth(8);
      bolt.setRotation(angle + Math.PI / 2);
      bolt.body.setAllowGravity(false);
      bolt.setVelocity(Math.cos(angle) * ENEMY_BOLT_SPEED, Math.sin(angle) * ENEMY_BOLT_SPEED);
    }
  }

  _hitCobra(bullet, cobra) {
    if (!bullet.active || !cobra.active) return;

    bullet.setActive(false).setVisible(false);

    if (bullet.weaponType === 'freeze') {
      const dead = cobra.takeDamage(bullet.damage);
      if (dead) {
        this._killCobra(cobra);
      } else {
        cobra.freeze(4000);
      }
      return;
    }

    if (bullet.weaponType === 'fireball') {
      if (cobra.burning) return;
      cobra.burning = true;
      const dead = cobra.takeDamage(bullet.damage); // damage = 2
      if (dead) {
        cobra.frozen = true;
        cobra.setTint(0xff4400);
        cobra.setVelocity(0, 0);
        this.tweens.add({
          targets: cobra, alpha: 0.4, duration: 120, yoyo: true, repeat: 11,
          onComplete: () => { if (cobra.active) cobra.setAlpha(1); }
        });
        this.time.delayedCall(3000, () => {
          if (cobra.active) this._killCobra(cobra);
        });
      } else {
        cobra.setTint(0xff4400);
        this.time.delayedCall(3000, () => {
          if (!cobra.active) return;
          cobra.burning = false;
          cobra.clearTint();
          cobra.nextShootTime = this.time.now + cobra.shootDelay;
        });
      }
      return;
    }

    const dead = cobra.takeDamage(bullet.damage);
    if (dead) this._killCobra(cobra);
  }

  _killCobra(cobra) {
    this.score += cobra.points;
    this.scoreTxt.setText(`SCORE: ${this.score}`);

    cobra.destroy();
    this.cobrasRemaining--;

    if (Math.random() < COBRA_DROP_CHANCE) {
      const drop = UpgradeDrop.spawn(this, cobra.x, cobra.y, this.player.upgradeState.shotCount);
      this.upgradeDrops.add(drop);
    }

    this._checkWaveComplete();
  }

  _playerHitCobra(playerSprite, cobra) {
    if (!cobra.active || this.playerInvincible) return;
    cobra.destroy();
    this.cobrasRemaining--;
    this._loseLife();
    this._checkWaveComplete();
  }

  _playerHitByBolt(playerSprite, bolt) {
    if (!bolt.active || this.playerInvincible) return;
    bolt.destroy();
    this._loseLife();
  }

  _checkWaveComplete() {
    if (this.cobrasRemaining <= 0 && !this.wavePending && this.lives > 0) {
      this.wavePending = true;
      this.time.delayedCall(1500, () => this._startNextWave());
    }
  }

  _loseLife() {
    if (this.player.upgradeState.shield) {
      this.player.upgradeState.shield = false;
      this.events.emit('upgrade-expired', 'shield');
      // Flash the shield ring as it breaks
      this.tweens.add({
        targets: this.shieldRing,
        scaleX: 2.2, scaleY: 2.2, alpha: 0,
        duration: 300,
        onComplete: () => { this.shieldRing.setScale(1).setAlpha(1); }
      });
      this.playerInvincible = true;
      this.time.delayedCall(400, () => { this.playerInvincible = false; });
      return;
    }

    this.lives--;
    this._updateLivesDisplay();

    // Grant invincibility for the duration of the flash so one hit
    // can't drain all lives while the player is inside a cobra's hitbox.
    this.playerInvincible = true;
    this.tweens.add({
      targets: this.player.sprite,
      alpha: 0,
      duration: 100,
      yoyo: true,
      repeat: 4,
      onComplete: () => { this.playerInvincible = false; }
    });

    if (this.lives <= 0) {
      this.time.delayedCall(600, () => {
        this.scene.start('GameOverScene', { score: this.score, wave: this.wave });
      });
    }
  }

  _collectUpgrade(playerSprite, drop) {
    if (!drop.active) return;
    this.score += 5;
    this.scoreTxt.setText(`SCORE: ${this.score}`);
    this.player.applyUpgrade(drop.upgradeType);
    this._updateWeaponLabel();
    this.tweens.add({
      targets: drop,
      alpha: 0, scaleX: 1.8, scaleY: 1.8,
      duration: 200,
      onComplete: () => drop.destroy()
    });
  }

  _scheduleAmbientSpawn() {
    const delay = Phaser.Math.Between(AMBIENT_INTERVAL_MIN, AMBIENT_INTERVAL_MAX);
    this.time.delayedCall(delay, () => {
      if (this.lives > 0 && Math.random() < AMBIENT_SPAWN_CHANCE) {
        const x = Phaser.Math.Between(40, this.scale.width - 40);
        const drop = UpgradeDrop.spawn(this, x, -20, this.player.upgradeState.shotCount);
        this.upgradeDrops.add(drop);
      }
      this._scheduleAmbientSpawn();
    });
  }

  update(time) {
    if (this.lives <= 0) return;

    this.player.update();
    this.projectiles.update();

    // Shield graphic follows player
    const hasShield = this.player.upgradeState.shield;
    this.shieldCircle.setVisible(hasShield).setPosition(this.player.x, this.player.y);
    this.shieldRing.setVisible(hasShield).setPosition(this.player.x, this.player.y);

    // Scrolling stars
    this.stars.forEach(s => {
      s.y += s.scrollSpeed;
      if (s.y > this.scale.height + 4) s.y = -4;
    });

    // Cobra per-frame logic
    this.cobras.getChildren().forEach(cobra => {
      if (!cobra.active || !cobra.body) return;

      if (!cobra.frozen) {
        // Home horizontally towards player
        const dx = this.player.x - cobra.x;
        const clampedVx = Phaser.Math.Clamp(dx, -cobra.trackSpeed, cobra.trackSpeed);
        cobra.setVelocityX(clampedVx);
        cobra.setVelocityY(cobra.baseSpeed);
      }

      // Cobra shooting — suppressed while burning or frozen
      if (!cobra.burning && !cobra.frozen && time >= cobra.nextShootTime) {
        cobra.nextShootTime = time + cobra.shootDelay;
        this._cobraShoot(cobra);
      }

      // Cobra escaped off screen
      if (cobra.y > this.scale.height + 60) {
        cobra.destroy();
        this.cobrasRemaining--;
        this._loseLife();
        this._checkWaveComplete();
      }
    });

    // Clean up off-screen drops
    this.upgradeDrops.getChildren().forEach(drop => {
      if (drop.active && drop.y > this.scale.height + 50) drop.destroy();
    });

    // Clean up off-screen enemy bolts (backup to delayedCall)
    this.enemyBullets.getChildren().forEach(bolt => {
      if (bolt.active && (bolt.y > this.scale.height + 40 || bolt.y < -40 ||
          bolt.x < -40 || bolt.x > this.scale.width + 40)) {
        bolt.destroy();
      }
    });

    // Timer bars
    if (this.timerBar.visible && this._weaponTimerDuration > 0) {
      const frac = Math.max(0, (this._weaponTimerEnd - time) / this._weaponTimerDuration);
      this.timerBar.width = 200 * frac;
    }
    if (this.speedBar.visible && this._speedTimerDuration > 0) {
      const frac = Math.max(0, (this._speedTimerEnd - time) / this._speedTimerDuration);
      this.speedBar.width = 160 * frac;
    }
  }
}
