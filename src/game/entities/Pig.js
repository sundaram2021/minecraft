import * as THREE from 'three';
import { Mob } from './Mob.js';
import { sound } from '../audio/SoundSynthesizer.js';
import { MobTextures } from './MobTextures.js';

export class Pig extends Mob {
  constructor(scene, chunkManager, x, y, z) {
    super(scene, chunkManager, x, y, z, 'pig');
    this.health = 10;
    this.maxHealth = 10;
    this.moveSpeed = 1.8;

    this.buildMesh();
  }

  buildMesh() {
    this.skinTex = MobTextures.getPigSkin();
    this.faceTex = MobTextures.getPigFace();
    this.snoutTex = MobTextures.getPigSnout();

    this.skinMat = new THREE.MeshLambertMaterial({ map: this.skinTex });
    this.faceMat = new THREE.MeshLambertMaterial({ map: this.faceTex });
    this.snoutMat = new THREE.MeshLambertMaterial({ map: this.snoutTex });
    this.materials.push(this.skinMat, this.faceMat, this.snoutMat);

    // Body
    this.body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 1.2), this.skinMat);
    this.body.position.set(0, 0.6, 0);
    this.group.add(this.body);

    // Head (Face on front)
    const headMats = [
      this.skinMat, this.skinMat, this.skinMat, this.skinMat, this.faceMat, this.skinMat
    ];
    this.head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), headMats);
    this.head.position.set(0, 0.8, -0.7);
    this.group.add(this.head);

    // Snout
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.15), this.snoutMat);
    snout.position.set(0, -0.1, -0.35);
    this.head.add(snout);

    // 4 Legs
    const legGeo = new THREE.BoxGeometry(0.25, 0.4, 0.25);
    this.legL = new THREE.Mesh(legGeo, this.skinMat);
    this.legL.position.set(-0.25, 0.2, -0.4);
    this.group.add(this.legL);

    this.legR = new THREE.Mesh(legGeo, this.skinMat);
    this.legR.position.set(0.25, 0.2, -0.4);
    this.group.add(this.legR);

    this.legBL = new THREE.Mesh(legGeo, this.skinMat);
    this.legBL.position.set(-0.25, 0.2, 0.4);
    this.group.add(this.legBL);

    this.legBR = new THREE.Mesh(legGeo, this.skinMat);
    this.legBR.position.set(0.25, 0.2, 0.4);
    this.group.add(this.legBR);
  }

  restoreOriginalColors() {
    this.skinMat.color.setHex(0xffffff);
    this.faceMat.color.setHex(0xffffff);
    this.snoutMat.color.setHex(0xffffff);
  }

  update(dt, playerPos) {
    this.stateTimer -= dt;
    if (this.stateTimer <= 0) {
      this.stateTimer = 2 + Math.random() * 4;
      this.state = Math.random() < 0.6 ? 'wander' : 'idle';
      if (this.state === 'wander') {
        this.yaw = Math.random() * Math.PI * 2;
        if (Math.random() < 0.3) {
          sound.playPigOink();
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
