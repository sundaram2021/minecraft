import * as THREE from 'three';
import { Mob } from './Mob.js';

export class Enderman extends Mob {
  constructor(scene, chunkManager, x, y, z){
    super(scene, chunkManager, x, y, z,'enderman');
    this.health=40; this.maxHealth=40; this.moveSpeed=2.2;
    this.teleportTimer=3+Math.random()*5;
    this.aggro=false;
    this.buildMesh();
  }
  buildMesh(){
    this.bodyMat=this.createColorMaterial(0x0a0a0a);
    this.eyeMat=this.createColorMaterial(0xcc00ff);
    this.body=new THREE.Mesh(new THREE.BoxGeometry(0.55,1.1,0.35), this.bodyMat); this.body.position.set(0,1.35,0); this.group.add(this.body);
    this.head=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.5,0.5), this.bodyMat); this.head.position.set(0,2.15,0); this.group.add(this.head);
    const eyeL=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.08,0.05), this.eyeMat); eyeL.position.set(-0.13,0.05,-0.26); this.head.add(eyeL);
    const eyeR=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.08,0.05), this.eyeMat); eyeR.position.set(0.13,0.05,-0.26); this.head.add(eyeR);
    const armGeo=new THREE.BoxGeometry(0.18,1.25,0.18);
    this.armL=new THREE.Mesh(armGeo, this.bodyMat); this.armL.position.set(-0.38,1.35,0); this.group.add(this.armL);
    this.armR=new THREE.Mesh(armGeo, this.bodyMat); this.armR.position.set(0.38,1.35,0); this.group.add(this.armR);
    const legGeo=new THREE.BoxGeometry(0.18,1.1,0.18);
    this.legL=new THREE.Mesh(legGeo, this.bodyMat); this.legL.position.set(-0.14,0.55,0); this.group.add(this.legL);
    this.legR=new THREE.Mesh(legGeo, this.bodyMat); this.legR.position.set(0.14,0.55,0); this.group.add(this.legR);
    // scale up for real enderman height 2.9
    this.group.scale.set(1.15,1.15,1.15);
  }
  restoreOriginalColors(){ this.bodyMat.color.setHex(0x0a0a0a); this.eyeMat.color.setHex(0xcc00ff); }
  takeDamage(amount, dir){
    super.takeDamage(amount, dir);
    // teleport on hit
    this.teleportRandom();
  }
  teleportRandom(){
    const ang=Math.random()*Math.PI*2;
    const dist= 6 + Math.random()*10;
    const nx=this.position.x + Math.sin(ang)*dist;
    const nz=this.position.z + Math.cos(ang)*dist;
    // find ground
    let ny=this.position.y;
    for(let y=120; y>2; y--){ const b=this.chunkManager.getBlock(Math.floor(nx), y, Math.floor(nz)); if(b!==0){ ny=y+1; break; } }
    this.position.set(nx, ny, nz);
    this.group.position.copy(this.position);
  }
  update(dt, playerPos, playerEntity){
    this.teleportTimer-=dt;
    if(this.teleportTimer<=0){ this.teleportTimer=6+Math.random()*8; if(Math.random()<0.25) this.teleportRandom(); }
    const dist=this.position.distanceTo(playerPos);
    if(dist<14){ this.aggro=true; this.yaw=Math.atan2(playerPos.x - this.position.x, playerPos.z - this.position.z); }
    else if(dist>28) this.aggro=false;
    let speed=0;
    if(this.aggro){ speed=3.4; this.velocity.x=-Math.sin(this.yaw)*speed; this.velocity.z=-Math.cos(this.yaw)*speed; if(dist<1.4 && this.attackTimer<=0){ if(playerEntity) playerEntity.takeDamage(7,'Enderman'); this.attackTimer=1.0; } }
    else {
      this.stateTimer-=dt; if(this.stateTimer<=0){ this.stateTimer=3+Math.random()*4; this.state=Math.random()<0.5?'wander':'idle'; if(this.state==='wander') this.yaw=Math.random()*Math.PI*2; }
      if(this.state==='wander'){ speed=this.moveSpeed; this.velocity.x=-Math.sin(this.yaw)*speed; this.velocity.z=-Math.cos(this.yaw)*speed; } else { this.velocity.x=0; this.velocity.z=0; }
    }
    if(this.attackTimer>0) this.attackTimer-=dt; else this.attackTimer=0;
    this.updatePhysics(dt); this.updateAnimation(dt,speed);
  }
}
