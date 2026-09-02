import * as THREE from 'three';
import { Mob } from './Mob.js';
import { BLOCKS } from '../world/Blocks.js';

export class Sheep extends Mob {
  constructor(scene, chunkManager, x, y, z) {
    super(scene, chunkManager, x, y, z, 'sheep');
    this.health = 8;
    this.maxHealth = 8;
    this.moveSpeed = 1.8;
    this.woolColor = Math.floor(Math.random()*16);
    this.sheared = false;
    this.woolRegrowTimer = 0;
    this.buildMesh();
  }
  buildMesh() {
    const woolColors = [0xffffff, 0xe67e22, 0xc74ebd, 0x8ec9e6, 0xf1c40f, 0x2ecc71, 0xe98b8a, 0x7f8c8d, 0xbdc3c7, 0x1abc9c, 0x9b59b6, 0x2c3e80, 0x8e5a2b, 0x27ae60, 0xc0392b, 0x2c2c2c];
    const woolCol = woolColors[this.woolColor] || 0xffffff;
    this.woolMat = this.createColorMaterial(woolCol);
    this.skinMat = this.createColorMaterial(0xf5d0a9);
    // body wool
    this.body = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.85, 1.3), this.woolMat);
    this.body.position.set(0, 0.85, 0);
    this.group.add(this.body);
    // head - skin
    this.head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.5), this.skinMat);
    this.head.position.set(0, 1.05, -0.8);
    this.group.add(this.head);
    // wool on head
    this.headWool = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.55, 0.55), this.woolMat);
    this.headWool.position.set(0, 0.15, 0.05);
    this.head.add(this.headWool);
    const legGeo = new THREE.BoxGeometry(0.22, 0.5, 0.22);
    this.legL = new THREE.Mesh(legGeo, this.skinMat); this.legL.position.set(-0.32, 0.28, -0.45); this.group.add(this.legL);
    this.legR = new THREE.Mesh(legGeo, this.skinMat); this.legR.position.set(0.32, 0.28, -0.45); this.group.add(this.legR);
    this.legBL = new THREE.Mesh(legGeo, this.skinMat); this.legBL.position.set(-0.32, 0.28, 0.45); this.group.add(this.legBL);
    this.legBR = new THREE.Mesh(legGeo, this.skinMat); this.legBR.position.set(0.32, 0.28, 0.45); this.group.add(this.legBR);
  }
  shear() {
    if (this.sheared) return null;
    this.sheared = true;
    this.woolRegrowTimer = 20 + Math.random()*10;
    this.woolMat.color.setHex(0x5a5a5a);
    if(this.headWool) this.headWool.visible=false;
    const woolBlock = 61 + this.woolColor;
    return { id: woolBlock, count: 1 + Math.floor(Math.random()*2)};
  }
  restoreOriginalColors() {
    if(!this.sheared){
      const woolColors = [0xffffff, 0xe67e22, 0xc74ebd, 0x8ec9e6, 0xf1c40f, 0x2ecc71, 0xe98b8a, 0x7f8c8d, 0xbdc3c7, 0x1abc9c, 0x9b59b6, 0x2c3e80, 0x8e5a2b, 0x27ae60, 0xc0392b, 0x2c2c2c];
      this.woolMat.color.setHex(woolColors[this.woolColor]||0xffffff);
    }
    this.skinMat.color.setHex(0xf5d0a9);
  }
  update(dt, playerPos){
    if(this.sheared){
      this.woolRegrowTimer -= dt;
      if(this.woolRegrowTimer<=0){ this.sheared=false; this.restoreOriginalColors(); if(this.headWool) this.headWool.visible=true; }
    }
    this.stateTimer -= dt;
    if(this.stateTimer<=0){ this.stateTimer=3+Math.random()*4; this.state=Math.random()<0.6?'wander':'idle'; if(this.state==='wander') this.yaw=Math.random()*Math.PI*2; }
    let speed=0;
    if(this.state==='wander'){ speed=this.moveSpeed; this.velocity.x=-Math.sin(this.yaw)*speed; this.velocity.z=-Math.cos(this.yaw)*speed; } else { this.velocity.x=0; this.velocity.z=0; }
    this.updatePhysics(dt); this.updateAnimation(dt,speed);
  }
}
