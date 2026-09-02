import * as THREE from 'three';
import { Mob } from './Mob.js';
import { sound } from '../audio/SoundSynthesizer.js';
import { MobTextures } from './MobTextures.js';

export class Zombie extends Mob {
  constructor(scene, chunkManager, x, y, z) {
    super(scene, chunkManager, x, y, z, 'zombie');
    this.health = 20;
    this.maxHealth = 20;
    this.moveSpeed = 2.4;
    this.attackCooldown = 0;

    this.buildMesh();
  }

  buildMesh() {
    this.skinTex = MobTextures.getZombieFace();
    this.shirtTex = MobTextures.getZombieShirt();
    this.pantsTex = MobTextures.getZombiePants();

    this.skinMat = new THREE.MeshLambertMaterial({ map: this.skinTex });
    this.shirtMat = new THREE.MeshLambertMaterial({ map: this.shirtTex });
    this.pantsMat = new THREE.MeshLambertMaterial({ map: this.pantsTex });
    this.materials.push(this.skinMat, this.shirtMat, this.pantsMat);

    // Head
    const headMats = [
      this.skinMat, this.skinMat, this.skinMat, this.skinMat, this.skinMat, this.skinMat
    ];
    this.head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), headMats);
    this.head.position.set(0, 1.6, 0);
    this.group.add(this.head);

    // Body (Shirt)
    this.body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.7, 0.3), this.shirtMat);
    this.body.position.set(0, 1.0, 0);
    this.group.add(this.body);

    // Arms (Held straight out forward in classic Minecraft zombie pose)
    const armGeo = new THREE.BoxGeometry(0.2, 0.2, 0.65);
    this.armL = new THREE.Mesh(armGeo, this.skinMat);
    this.armL.position.set(-0.38, 1.25, -0.3);
    this.group.add(this.armL);

    this.armR = new THREE.Mesh(armGeo, this.skinMat);
    this.armR.position.set(0.38, 1.25, -0.3);
    this.group.add(this.armR);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.24, 0.7, 0.24);
    this.legL = new THREE.Mesh(legGeo, this.pantsMat);
    this.legL.position.set(-0.15, 0.35, 0);
    this.group.add(this.legL);

    this.legR = new THREE.Mesh(legGeo, this.pantsMat);
    this.legR.position.set(0.15, 0.35, 0);
    this.group.add(this.legR);
  }

  restoreOriginalColors() {
    this.skinMat.color.setHex(0xffffff);
    this.shirtMat.color.setHex(0xffffff);
    this.pantsMat.color.setHex(0xffffff);
  }

  update(dt, playerPos, playerEntity) {
    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
    }

    const distToPlayer = this.position.distanceTo(playerPos);
    let speed = 0;

    if (distToPlayer < 16.0) {
      const dx = playerPos.x - this.position.x;
      const dz = playerPos.z - this.position.z;
      this.yaw = Math.atan2(-dx, -dz);

      speed = this.moveSpeed;
      this.velocity.x = -Math.sin(this.yaw) * speed;
      this.velocity.z = -Math.cos(this.yaw) * speed;

      // Occasional zombie groan sound
      if (Math.random() < 0.006) {
        sound.playZombieGroan();
      }

      // Attack player on contact
      if (distToPlayer < 1.3 && this.attackCooldown <= 0 && playerEntity) {
        playerEntity.takeDamage(3, 'Zombie');
        this.attackCooldown = 1.0;
      }
    } else {
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) {
        this.stateTimer = 2 + Math.random() * 3;
        this.state = Math.random() < 0.4 ? 'wander' : 'idle';
        if (this.state === 'wander') {
          this.yaw = Math.random() * Math.PI * 2;
        }
      }

      if (this.state === 'wander') {
        speed = this.moveSpeed * 0.5;
        this.velocity.x = -Math.sin(this.yaw) * speed;
        this.velocity.z = -Math.cos(this.yaw) * speed;
      } else {
        this.velocity.x = 0;
        this.velocity.z = 0;
      }
    }

    this.updatePhysics(dt);
    this.updateAnimation(dt, speed);
  }
}
