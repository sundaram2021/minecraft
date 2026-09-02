import * as THREE from 'three';
import { Mob } from './Mob.js';
import { sound } from '../audio/SoundSynthesizer.js';
import { MobTextures } from './MobTextures.js';

export class Cow extends Mob {
  constructor(scene, chunkManager, x, y, z) {
    super(scene, chunkManager, x, y, z, 'cow');
    this.health = 10;
    this.maxHealth = 10;
    this.moveSpeed = 1.6;

    this.buildMesh();
  }

  buildMesh() {
    this.hideTex = MobTextures.getCowHide();
    this.muzzleTex = MobTextures.getCowMuzzle();

    this.bodyMat = new THREE.MeshLambertMaterial({ map: this.hideTex });
    this.muzzleMat = new THREE.MeshLambertMaterial({ map: this.muzzleTex });
    this.hornMat = new THREE.MeshLambertMaterial({ color: 0xa8a8a8 });
    this.materials.push(this.bodyMat, this.muzzleMat, this.hornMat);

    // Body
    this.body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 1.4), this.bodyMat);
    this.body.position.set(0, 0.8, 0);
    this.group.add(this.body);

    // Head
    this.head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.6), this.bodyMat);
    this.head.position.set(0, 1.1, -0.85);
    this.group.add(this.head);

    // Horns
    const hornL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.1), this.hornMat);
    hornL.position.set(-0.25, 0.35, -0.1);
    this.head.add(hornL);

    const hornR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.1), this.hornMat);
    hornR.position.set(0.25, 0.35, -0.1);
    this.head.add(hornR);

    // Muzzle / Snout
    const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 0.15), this.muzzleMat);
    muzzle.position.set(0, -0.12, -0.35);
    this.head.add(muzzle);

    // 4 Legs
    const legGeo = new THREE.BoxGeometry(0.25, 0.5, 0.25);
    this.legL = new THREE.Mesh(legGeo, this.bodyMat);
    this.legL.position.set(-0.3, 0.25, -0.5);
    this.group.add(this.legL);

    this.legR = new THREE.Mesh(legGeo, this.bodyMat);
    this.legR.position.set(0.3, 0.25, -0.5);
    this.group.add(this.legR);

    this.legBL = new THREE.Mesh(legGeo, this.bodyMat);
    this.legBL.position.set(-0.3, 0.25, 0.5);
    this.group.add(this.legBL);

    this.legBR = new THREE.Mesh(legGeo, this.bodyMat);
    this.legBR.position.set(0.3, 0.25, 0.5);
    this.group.add(this.legBR);
  }

  restoreOriginalColors() {
    this.bodyMat.color.setHex(0xffffff);
    this.muzzleMat.color.setHex(0xffffff);
    this.hornMat.color.setHex(0xa8a8a8);
  }

  update(dt, playerPos) {
    this.stateTimer -= dt;
    if (this.stateTimer <= 0) {
      this.stateTimer = 3 + Math.random() * 4;
      this.state = Math.random() < 0.5 ? 'wander' : 'idle';
      if (this.state === 'wander') {
        this.yaw = Math.random() * Math.PI * 2;
        if (Math.random() < 0.25) {
          sound.playCowMoo();
        }
      }
    }

    let speed = 0;
    if (this.state === 'wander') {
      speed = this.moveSpeed;
      this.velocity.x = -Math.sin(this.yaw) * speed;
      this.velocity.z = -Math.cos(this.yaw) * speed;
    } else {
      this.velocity.x = 0;
      this.velocity.z = 0;
    }

    this.updatePhysics(dt);
    this.updateAnimation(dt, speed);
  }
}
