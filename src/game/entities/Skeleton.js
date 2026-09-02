import * as THREE from 'three';
import { Mob } from './Mob.js';
import { sound } from '../audio/SoundSynthesizer.js';
import { MobTextures } from './MobTextures.js';

export class Skeleton extends Mob {
  constructor(scene, chunkManager, x, y, z) {
    super(scene, chunkManager, x, y, z, 'skeleton');
    this.health = 20;
    this.maxHealth = 20;
    this.moveSpeed = 2.0;
    this.shootTimer = 2.0;

    this.buildMesh();
  }

  buildMesh() {
    this.skullTex = MobTextures.getSkeletonSkull();
    this.ribsTex = MobTextures.getSkeletonRibs();

    this.skullMat = new THREE.MeshLambertMaterial({ map: this.skullTex });
    this.ribsMat = new THREE.MeshLambertMaterial({ map: this.ribsTex });
    this.boneMat = new THREE.MeshLambertMaterial({ color: 0xd8d8d8 });
    this.bowMat = new THREE.MeshLambertMaterial({ color: 0x6e4c23 });
    this.materials.push(this.skullMat, this.ribsMat, this.boneMat, this.bowMat);

    // Head (Skull front face)
    const headMats = [
      this.boneMat, this.boneMat, this.boneMat, this.boneMat, this.boneMat, this.skullMat
    ];
    this.head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), headMats);
    this.head.position.set(0, 1.6, 0);
    this.group.add(this.head);

    // Ribcage / Spine Body
    this.body = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.7, 0.22), this.ribsMat);
    this.body.position.set(0, 1.0, 0);
    this.group.add(this.body);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.14, 0.14, 0.65);
    this.armL = new THREE.Mesh(armGeo, this.boneMat);
    this.armL.position.set(-0.35, 1.25, -0.3);
    this.group.add(this.armL);

    this.armR = new THREE.Mesh(armGeo, this.boneMat);
    this.armR.position.set(0.35, 1.25, -0.3);
    this.group.add(this.armR);

    // Bow
    const bowMesh = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 0.1), this.bowMat);
    bowMesh.position.set(0, 0, -0.35);
    this.armL.add(bowMesh);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.15, 0.7, 0.15);
    this.legL = new THREE.Mesh(legGeo, this.boneMat);
    this.legL.position.set(-0.14, 0.35, 0);
    this.group.add(this.legL);

    this.legR = new THREE.Mesh(legGeo, this.boneMat);
    this.legR.position.set(0.14, 0.35, 0);
    this.group.add(this.legR);
  }

  restoreOriginalColors() {
    this.skullMat.color.setHex(0xffffff);
    this.ribsMat.color.setHex(0xffffff);
    this.boneMat.color.setHex(0xd8d8d8);
    this.bowMat.color.setHex(0x6e4c23);
  }

  update(dt, playerPos, playerEntity) {
    const distToPlayer = this.position.distanceTo(playerPos);
    let speed = 0;

    if (distToPlayer < 18.0) {
      const dx = playerPos.x - this.position.x;
      const dz = playerPos.z - this.position.z;
      this.yaw = Math.atan2(-dx, -dz);

      if (distToPlayer > 10.0) {
        speed = this.moveSpeed;
        this.velocity.x = -Math.sin(this.yaw) * speed;
        this.velocity.z = -Math.cos(this.yaw) * speed;
      } else if (distToPlayer < 5.0) {
        speed = this.moveSpeed * 0.8;
        this.velocity.x = Math.sin(this.yaw) * speed;
        this.velocity.z = Math.cos(this.yaw) * speed;
      } else {
        this.velocity.x = -Math.cos(this.yaw) * (Math.sin(Date.now() * 0.002) * 1.5);
        this.velocity.z = Math.sin(this.yaw) * (Math.sin(Date.now() * 0.002) * 1.5);
      }

      // Shoot arrows & rattle sound
      this.shootTimer -= dt;
      if (this.shootTimer <= 0) {
        this.shootTimer = 2.2 + Math.random() * 0.8;
        sound.playSkeletonRattle();
        if (playerEntity) {
          playerEntity.takeDamage(2, 'Skeleton Arrow');
        }
      }
    } else {
      this.velocity.x = 0;
      this.velocity.z = 0;
    }

    this.updatePhysics(dt);
    this.updateAnimation(dt, speed);
  }
}
