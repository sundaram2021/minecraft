import * as THREE from 'three';
import { getBlockDef } from '../world/Blocks.js';

export class Mob {
  constructor(scene, chunkManager, x, y, z, type = 'zombie') {
    this.scene = scene;
    this.chunkManager = chunkManager;
    this.type = type;

    this.position = new THREE.Vector3(x, y, z);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.yaw = Math.random() * Math.PI * 2;
    this.targetYaw = this.yaw;

    this.health = 20;
    this.maxHealth = 20;
    this.isDead = false;
    this.hurtTimer = 0;
    this.walkAnimTime = 0;
    this.onGround = false;

    // AI timer & states
    this.state = 'idle'; // 'idle', 'wander', 'chase', 'flee', 'attack'
    this.stateTimer = 1 + Math.random() * 3;

    this.group = new THREE.Group();
    this.group.position.copy(this.position);
    this.scene.add(this.group);

    // Rigs to animate
    this.head = null;
    this.body = null;
    this.legL = null;
    this.legR = null;
    this.legBL = null;
    this.legBR = null;
    this.armL = null;
    this.armR = null;
    this.materials = [];
  }

  // Create solid colored material
  createColorMaterial(color) {
    const mat = new THREE.MeshLambertMaterial({ color });
    this.materials.push(mat);
    return mat;
  }

  takeDamage(amount, knockbackDir = null) {
    if (this.isDead) return;
    this.health -= amount;
    this.hurtTimer = 0.25; // Flash red

    if (knockbackDir) {
      this.velocity.x += knockbackDir.x * 6.0;
      this.velocity.y += 4.5;
      this.velocity.z += knockbackDir.z * 6.0;
    }

    if (this.health <= 0) {
      this.isDead = true;
    }
  }

  updatePhysics(dt) {
    // Gravity
    if (!this.onGround) {
      this.velocity.y -= 25.0 * dt;
    }

    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    this.position.z += this.velocity.z * dt;

    // Ground check
    const blockBelow = this.chunkManager.getBlock(
      Math.floor(this.position.x),
      Math.floor(this.position.y),
      Math.floor(this.position.z)
    );
    const def = getBlockDef(blockBelow);
    if (def.solid) {
      this.position.y = Math.floor(this.position.y) + 1.0;
      this.velocity.y = 0;
      this.velocity.x *= 0.6;
      this.velocity.z *= 0.6;
      this.onGround = true;
    } else {
      this.onGround = false;
    }

    // Auto step-up for mobs
    const blockFront = this.chunkManager.getBlock(
      Math.floor(this.position.x - Math.sin(this.yaw) * 0.4),
      Math.floor(this.position.y),
      Math.floor(this.position.z - Math.cos(this.yaw) * 0.4)
    );
    const blockFrontAbove = this.chunkManager.getBlock(
      Math.floor(this.position.x - Math.sin(this.yaw) * 0.4),
      Math.floor(this.position.y + 1),
      Math.floor(this.position.z - Math.cos(this.yaw) * 0.4)
    );
    if (getBlockDef(blockFront).solid && !getBlockDef(blockFrontAbove).solid && this.onGround) {
      this.velocity.y = 5.0; // Jump over obstacle
    }

    this.group.position.copy(this.position);
    this.group.rotation.y = this.yaw;
  }

  updateAnimation(dt, speed) {
    if (speed > 0.1) {
      this.walkAnimTime += dt * 8.0;
    } else {
      this.walkAnimTime = 0;
    }

    const swing = Math.sin(this.walkAnimTime) * 0.6;

    if (this.legL) this.legL.rotation.x = swing;
    if (this.legR) this.legR.rotation.x = -swing;
    if (this.legBL) this.legBL.rotation.x = -swing;
    if (this.legBR) this.legBR.rotation.x = swing;

    if (this.armL) this.armL.rotation.x = -swing;
    if (this.armR) this.armR.rotation.x = swing;

    // Hurt flash tint
    if (this.hurtTimer > 0) {
      this.hurtTimer -= dt;
      for (const mat of this.materials) {
        mat.color.setHex(0xff3333);
      }
    } else {
      this.restoreOriginalColors();
    }
  }

  restoreOriginalColors() {}

  dispose() {
    this.scene.remove(this.group);
    for (const mat of this.materials) {
      mat.dispose();
    }
  }
}
