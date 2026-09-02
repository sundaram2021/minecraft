import * as THREE from 'three';
import { Mob } from './Mob.js';
import { sound } from '../audio/SoundSynthesizer.js';
import { BLOCKS } from '../world/Blocks.js';
import { MobTextures } from './MobTextures.js';

export class Creeper extends Mob {
  constructor(scene, chunkManager, particleEngine, x, y, z) {
    super(scene, chunkManager, x, y, z, 'creeper');
    this.particleEngine = particleEngine;
    this.health = 20;
    this.maxHealth = 20;
    this.moveSpeed = 2.2;

    this.fuseTime = 0;
    this.fuseDuration = 1.4;
    this.isHissing = false;
    this.exploded = false;

    this.buildMesh();
  }

  buildMesh() {
    this.skinTex = MobTextures.getCreeperSkin();
    this.faceTex = MobTextures.getCreeperFace();

    this.bodyMat = new THREE.MeshLambertMaterial({ map: this.skinTex });
    this.faceMat = new THREE.MeshLambertMaterial({ map: this.faceTex });
    this.materials.push(this.bodyMat, this.faceMat);

    // Head with authentic face texture on front
    const headMats = [
      this.bodyMat, // right
      this.bodyMat, // left
      this.bodyMat, // top
      this.bodyMat, // bottom
      this.bodyMat, // back
      this.faceMat, // front
    ];
    this.head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), headMats);
    this.head.position.set(0, 1.45, 0);
    this.group.add(this.head);

    // Body
    this.body = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.75, 0.3), this.bodyMat);
    this.body.position.set(0, 0.85, 0);
    this.group.add(this.body);

    // 4 Stubby Walking Legs
    const legGeo = new THREE.BoxGeometry(0.2, 0.45, 0.2);
    this.legL = new THREE.Mesh(legGeo, this.bodyMat);
    this.legL.position.set(-0.15, 0.22, -0.15);
    this.group.add(this.legL);

    this.legR = new THREE.Mesh(legGeo, this.bodyMat);
    this.legR.position.set(0.15, 0.22, -0.15);
    this.group.add(this.legR);

    this.legBL = new THREE.Mesh(legGeo, this.bodyMat);
    this.legBL.position.set(-0.15, 0.22, 0.15);
    this.group.add(this.legBL);

    this.legBR = new THREE.Mesh(legGeo, this.bodyMat);
    this.legBR.position.set(0.15, 0.22, 0.15);
    this.group.add(this.legBR);
  }

  restoreOriginalColors() {
    this.bodyMat.color.setHex(0xffffff);
    this.faceMat.color.setHex(0xffffff);
  }

  explode(playerEntity) {
    if (this.exploded) return;
    this.exploded = true;
    this.isDead = true;

    const ex = Math.floor(this.position.x);
    const ey = Math.floor(this.position.y);
    const ez = Math.floor(this.position.z);

    // Audio & particles
    sound.playExplosion();
    if (this.particleEngine) {
      this.particleEngine.spawnExplosion(this.position);
    }

    // Crater block destruction (radius 2.5)
    const radius = 2.5;
    for (let dy = -2; dy <= 2; dy++) {
      for (let dz = -3; dz <= 3; dz++) {
        for (let dx = -3; dx <= 3; dx++) {
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist <= radius) {
            const bx = ex + dx;
            const by = ey + dy;
            const bz = ez + dz;
            const bId = this.chunkManager.getBlock(bx, by, bz);
            if (bId !== BLOCKS.AIR && bId !== BLOCKS.BEDROCK) {
              this.chunkManager.setBlock(bx, by, bz, BLOCKS.AIR);
            }
          }
        }
      }
    }

    // Damage player if in range
    if (playerEntity) {
      const dist = this.position.distanceTo(playerEntity.physics.position);
      if (dist < 5.0) {
        const dmg = Math.round((1 - dist / 5.0) * 16);
        const knockDir = new THREE.Vector3().subVectors(playerEntity.physics.position, this.position).normalize();
        playerEntity.takeDamage(Math.max(4, dmg), 'Creeper', knockDir);
      }
    }
  }

  update(dt, playerPos, playerEntity) {
    if (this.exploded || this.isDead) return;

    const distToPlayer = this.position.distanceTo(playerPos);
    let speed = 0;

    if (distToPlayer < 14.0) {
      const dx = playerPos.x - this.position.x;
      const dz = playerPos.z - this.position.z;
      this.yaw = Math.atan2(-dx, -dz);

      if (distToPlayer < 3.2) {
        // In fuse range!
        if (!this.isHissing) {
          sound.playCreeperHiss();
          this.isHissing = true;
        }

        this.fuseTime += dt;
        // Inflate scale & flash white
        const scale = 1.0 + (this.fuseTime / this.fuseDuration) * 0.35;
        this.group.scale.set(scale, scale, scale);

        const flash = Math.sin(this.fuseTime * 28) > 0;
        this.bodyMat.color.setHex(flash ? 0xffffff : 0x888888);
        this.faceMat.color.setHex(flash ? 0xffffff : 0x888888);

        if (this.fuseTime >= this.fuseDuration) {
          this.explode(playerEntity);
          return;
        }
      } else {
        // Out of fuse range: defuse
        if (this.isHissing && distToPlayer > 4.5) {
          this.isHissing = false;
          this.fuseTime = 0;
          this.group.scale.set(1, 1, 1);
          this.restoreOriginalColors();
        }

        speed = this.moveSpeed;
        this.velocity.x = -Math.sin(this.yaw) * speed;
        this.velocity.z = -Math.cos(this.yaw) * speed;
      }
    } else {
      this.isHissing = false;
      this.fuseTime = 0;
      this.group.scale.set(1, 1, 1);
      this.restoreOriginalColors();
    }

    this.updatePhysics(dt);
    this.updateAnimation(dt, speed);
  }
}
