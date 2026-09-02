import * as THREE from 'three';
import { Mob } from './Mob.js';

export class Chicken extends Mob {
  constructor(scene, chunkManager, x, y, z){
    super(scene, chunkManager, x, y, z,'chicken');
    this.health=4; this.maxHealth=4; this.moveSpeed=2.0;
    this.eggTimer= 10 + Math.random()*20;
    this.buildMesh();
  }
  buildMesh(){
    this.bodyMat=this.createColorMaterial(0xffffff);
    this.beakMat=this.createColorMaterial(0xffcc00);
    this.wattleMat=this.createColorMaterial(0xcc2222);
    this.body=new THREE.Mesh(new THREE.BoxGeometry(0.6,0.5,0.7), this.bodyMat); this.body.position.set(0,0.65,0); this.group.add(this.body);
    this.head=new THREE.Mesh(new THREE.BoxGeometry(0.35,0.35,0.35), this.bodyMat); this.head.position.set(0,0.95,-0.45); this.group.add(this.head);
    const beak=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.08,0.18), this.beakMat); beak.position.set(0,-0.05,-0.22); this.head.add(beak);
    const comb=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.12,0.18), this.wattleMat); comb.position.set(0,0.22,0); this.head.add(comb);
    const wingL=new THREE.Mesh(new THREE.BoxGeometry(0.15,0.25,0.4), this.bodyMat); wingL.position.set(-0.38,0.15,0); this.body.add(wingL); this.armL=wingL;
    const wingR=new THREE.Mesh(new THREE.BoxGeometry(0.15,0.25,0.4), this.bodyMat); wingR.position.set(0.38,0.15,0); this.body.add(wingR); this.armR=wingR;
    const legGeo=new THREE.BoxGeometry(0.12,0.3,0.12);
    this.legL=new THREE.Mesh(legGeo,this.beakMat); this.legL.position.set(-0.15,0.2,-0.1); this.group.add(this.legL);
    this.legR=new THREE.Mesh(legGeo,this.beakMat); this.legR.position.set(0.15,0.2,-0.1); this.group.add(this.legR);
  }
  restoreOriginalColors(){ this.bodyMat.color.setHex(0xffffff); this.beakMat.color.setHex(0xffcc00); this.wattleMat.color.setHex(0xcc2222); }
  update(dt, playerPos, playerEntity){
    this.eggTimer-=dt;
    if(this.eggTimer<=0){ this.eggTimer=12+Math.random()*18; }
    // panic if player close
    const dist= this.position.distanceTo(playerPos);
    if(dist<4) { this.state='flee'; this.stateTimer=1.2; this.yaw=Math.atan2(playerPos.x - this.position.x, playerPos.z - this.position.z)+Math.PI; }
    else {
      this.stateTimer-=dt;
      if(this.stateTimer<=0){ this.stateTimer=2+Math.random()*3; this.state=Math.random()<0.7?'wander':'idle'; if(this.state==='wander') this.yaw=Math.random()*Math.PI*2; }
    }
    let speed=0;
    if(this.state==='wander'||this.state==='flee'){ speed=this.state==='flee'?3.2:this.moveSpeed; this.velocity.x=-Math.sin(this.yaw)*speed; this.velocity.z=-Math.cos(this.yaw)*speed; } else { this.velocity.x=0; this.velocity.z=0; }
    // slow fall like chicken
    if(this.velocity.y < -2) this.velocity.y = -2;
    this.updatePhysics(dt); this.updateAnimation(dt,speed);
    // flap wings fast
    if(this.armL) this.armL.rotation.x=Math.sin(this.walkAnimTime*1.8)*1.1;
    if(this.armR) this.armR.rotation.x=-Math.sin(this.walkAnimTime*1.8)*1.1;
  }
}
