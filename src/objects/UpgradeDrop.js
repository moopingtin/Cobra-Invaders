const POOL = [
  { type: 'fireball', key: 'drop-fireball',    weight: 30 },
  { type: 'speed',    key: 'drop-speed',        weight: 30 },
  { type: 'freeze',   key: 'drop-baby-penguin', weight: 15 },
  { type: 'shield',   key: 'drop-shield',       weight: 20 },
];

export function pickUpgradeType() {
  const total = POOL.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * total;
  for (const entry of POOL) {
    r -= entry.weight;
    if (r <= 0) return entry;
  }
  return POOL[0];
}

export default class UpgradeDrop {
  static spawn(scene, x, y, shotCount) {
    const entry = pickUpgradeType(shotCount);
    const drop = scene.physics.add.sprite(x, y, entry.key);
    drop.upgradeType = entry.type;
    drop.setDepth(7);
    drop.body.setAllowGravity(false);
    drop.setVelocityY(80);

    scene.tweens.add({
      targets: drop,
      y: drop.y + 8,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    return drop;
  }
}
