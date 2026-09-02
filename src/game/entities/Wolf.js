import * as THREE from 'three';
import { Mob } from './Mob.js';

export class Wolf extends Mob {
  constructor(scene, chunkManager, x, y, z){
    super(scene, chunkManager, x, y, z,'wolf');
    this.health=8; this.maxHealth=8; this.moveSpeed=2.6;
    this.tamed=false;
    this.buildMesh();
  }
  buildMesh(){
    this.bodyMat=this.createColorMaterial(0xc8c8c8);
    this.snoutMat=this.createColorMaterial(0xe8d8c0);
    this.body=new THREE.Mesh(new THREE.BoxGeometry(0.7,0.5,1.0), this.bodyMat); this.body.position.set(0,0.6,0); this.group.add(this.body);
    this.head=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.45,0.5), this.bodyMat); this.head.position.set(0,0.82,-0.62); this.group.add(this.head);
    const snout=new THREE.Mesh(new THREE.BoxGeometry(0.3,0.22,0.22), this.snoutMat); snout.position.set(0,-0.1,-0.3); this.head.add(snout);
    const nose=new THREE.Mesh(new THREE.BoxGeometry(0.1,0.06,0.05), this.createColorMaterial(0x111111)); nose.position.set(0,0.02,-0.15); snout.add(nose);
    const earL=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.18,0.08), this.bodyMat); earL.position.set(-0.18,0.28,0); this.head.add(earL);
    const earR=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.18,0.08), this.bodyMat); earR.position.set(0.18,0.28,0); this.head.add(earR);
    const tail=new THREE.Mesh(new THREE.BoxGeometry(0.15,0.15,0.45), this.bodyMat); tail.position.set(0,0.35,0.68); this.body.add(tail); this.tail=tail;
    const legGeo=new THREE.BoxGeometry(0.18,0.4,0.18);
    this.legL=new THREE.Mesh(legGeo,this.bodyMat); this.legL.position.set(-0.22,0.2,-0.35); this.group.add(this.legL);
    this.legR=new THREE.Mesh(legGeo,this.bodyMat); this.legR.position.set(0.22,0.2,-0.35); this.group.add(this.legR);
    this.legBL=new THREE.Mesh(legGeo,this.bodyMat); this.legBL.position.set(-0.22,0.2,0.35); this.group.add(this.legBL);
    this.legBR=new THREE.Mesh(legGeo,this.bodyMat); this.legBR.position.set(0.22,0.2,0.35); this.group.add(this.legBR);
  }
  restoreOriginalColors(){ this.bodyMat.color.setHex(this.tamed?0x8a6a4a:0xc8c8c8); this.snoutMat.color.setHex(0xe8d8c0); }
  update(dt, playerPos, playerEntity){
    const dist=this.position.distanceTo(playerPos);
    if(this.tamed){
      if(dist>3) { this.state='chase'; this.yaw=Math.atan2(playerPos.x - this.position.x, playerPos.z - this.position.z); }
      else { this.state='idle'; }
    } else {
      this.stateTimer-=dt;
      if(this.stateTimer<=0){ this.stateTimer=3+Math.random()*4; this.state=Math.random()<0.6?'wander':'idle'; if(this.state==='wander') this.yaw=Math.random()*Math.PI*2; }
      if(dist<6){ this.yaw=Math.atan2(this.position.x - playerPos.x, this.position.z - playerPos.z)+Math.PI; this.state='wander'; }
    }
    let speed=0;
    if(this.state==='chase'){ speed=3.8; this.velocity.x=-Math.sin(this.yaw)*speed; this.velocity.z=-Math.cos(this.yaw)*speed; }
    else if(this.state==='wander'){ speed=this.moveSpeed; this.velocity.x=-Math.sin(this.yaw)*speed; this.velocity.z=-Math.cos(this.yaw)*speed; } else { this.velocity.x=0; this.velocity.z=0; }
    this.updatePhysics(dt); this.updateAnimation(dt,speed);
    if(this.tail) this.tail.rotation.x=Math.sin(this.walkAnimTime*1.2)*0.6;
  }
}
