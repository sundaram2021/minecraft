import * as THREE from 'three';
import { Mob } from './Mob.js';

export class Spider extends Mob {
  constructor(scene, chunkManager, x, y, z){
    super(scene, chunkManager, x, y, z,'spider');
    this.health=16; this.maxHealth=16; this.moveSpeed=2.4;
    this.attackDamage=3; this.attackTimer=0;
    this.buildMesh();
  }
  buildMesh(){
    this.bodyMat=this.createColorMaterial(0x2b1a0e);
    this.eyeMat=this.createColorMaterial(0xff2222);
    this.body=new THREE.Mesh(new THREE.BoxGeometry(0.9,0.5,1.0), this.bodyMat); this.body.position.set(0,0.45,0); this.group.add(this.body);
    this.head=new THREE.Mesh(new THREE.BoxGeometry(0.55,0.4,0.55), this.bodyMat); this.head.position.set(0,0.5,-0.65); this.group.add(this.head);
    for(let i=0;i<4;i++){
      const eye=new THREE.Mesh(new THREE.BoxGeometry(0.09,0.09,0.05), this.eyeMat);
      eye.position.set(-0.15+i*0.1,0.1,-0.28); this.head.add(eye);
    }
    // 8 legs
    const legGeo=new THREE.BoxGeometry(0.08,0.08,0.45);
    const offsets=[[-0.45,0.15,-0.4],[-0.5,0.15,0.0],[-0.45,0.15,0.4],[0.45,0.15,-0.4],[0.5,0.15,0.0],[0.45,0.15,0.4]];
    // we map first 4 to our rig for animation
    this.legs=[];
    for(let i=0;i<8;i++){
      const leg=new THREE.Mesh(legGeo, this.bodyMat);
      const ox = (i<4?-0.5:0.5) + (Math.random()-0.5)*0.05;
      const oz = -0.5 + (i%4)*0.33;
      leg.position.set(ox,0.25,oz);
      leg.rotation.y = (i<4? -0.6:0.6);
      this.group.add(leg); this.legs.push(leg);
    }
    this.legL=this.legs[0]; this.legR=this.legs[4]; this.legBL=this.legs[1]; this.legBR=this.legs[5];
  }
  restoreOriginalColors(){ this.bodyMat.color.setHex(0x2b1a0e); this.eyeMat.color.setHex(0xff2222); }
  update(dt, playerPos, playerEntity){
    const dist= this.position.distanceTo(playerPos);
    const isNight=true;
    if(dist<12) { this.state='chase'; this.yaw=Math.atan2(playerPos.x - this.position.x, playerPos.z - this.position.z); }
    else { this.stateTimer-=dt; if(this.stateTimer<=0){ this.stateTimer=2+Math.random()*3; this.state=Math.random()<0.6?'wander':'idle'; if(this.state==='wander') this.yaw=Math.random()*Math.PI*2; } }
    let speed=0;
    if(this.state==='chase'){ speed=3.0; this.velocity.x=-Math.sin(this.yaw)*speed; this.velocity.z=-Math.cos(this.yaw)*speed; if(dist<1.2 && this.attackTimer<=0){ if(playerEntity) playerEntity.takeDamage(this.attackDamage,'Spider'); this.attackTimer=0.9; this.velocity.y=2; } }
    else if(this.state==='wander'){ speed=this.moveSpeed; this.velocity.x=-Math.sin(this.yaw)*speed; this.velocity.z=-Math.cos(this.yaw)*speed; } else { this.velocity.x=0; this.velocity.z=0; }
    if(this.attackTimer>0) this.attackTimer-=dt;
    this.updatePhysics(dt); this.updateAnimation(dt,speed);
    // climb ability: if wall in front, jump higher
    if(this.onGround && this.state==='chase' && dist<8){ this.velocity.y=5.5; }
    // animate legs crawl
    const t=this.walkAnimTime;
    this.legs.forEach((leg,i)=>{ leg.rotation.x=Math.sin(t + i*0.8)*0.9; });
  }
}
