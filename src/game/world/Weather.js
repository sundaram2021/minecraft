import * as THREE from 'three';

export class Weather {
  constructor(scene){
    this.scene=scene;
    this.isRaining=false;
    this.isSnowing=false;
    this.intensity=0;
    this.timer= 60 + Math.random()*120;
    this.particles=[];
    this.group=new THREE.Group();
    this.scene.add(this.group);
    // rain geometry placeholder
    const rainGeo=new THREE.BufferGeometry();
    const count=1200;
    const pos=new Float32Array(count*3);
    for(let i=0;i<count;i++){ pos[i*3]= (Math.random()-0.5)*80; pos[i*3+1]= Math.random()*30+10; pos[i*3+2]= (Math.random()-0.5)*80; }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(pos,3));
    this.rainMat=new THREE.PointsMaterial({color:0x8aa0c8, size:0.18, transparent:true, opacity:0});
    this.rainPoints=new THREE.Points(rainGeo, this.rainMat);
    this.group.add(this.rainPoints);
  }
  update(dt, playerPos, biomeType){
    this.timer-=dt;
    if(this.timer<=0){
      // toggle weather
      const r=Math.random();
      if(r<0.75){ this.isRaining=false; this.isSnowing=false; this.timer=80+Math.random()*140; }
      else if(r<0.92){ this.isRaining=true; this.isSnowing=false; this.timer=30+Math.random()*50; this.intensity=0.6+Math.random()*0.4; }
      else { this.isSnowing=true; this.isRaining=false; this.timer=30+Math.random()*50; this.intensity=0.7; }
    }
    const targetOpacity = (this.isRaining||this.isSnowing)? this.intensity*0.9 : 0;
    this.rainMat.opacity += (targetOpacity - this.rainMat.opacity)* dt*2;
    if(this.isRaining||this.isSnowing){
      this.rainMat.color.setHex(this.isSnowing?0xffffff:0x8aa0c8);
      this.rainMat.size = this.isSnowing?0.28:0.18;
      // fall
      const pos=this.rainPoints.geometry.attributes.position;
      for(let i=0;i<pos.count;i++){
        let y=pos.getY(i) - dt * (this.isSnowing?3:14);
        if(y<0){ y=28+Math.random()*6; pos.setX(i, (Math.random()-0.5)*80); pos.setZ(i, (Math.random()-0.5)*80); }
        pos.setY(i,y);
      }
      pos.needsUpdate=true;
      this.group.position.set(playerPos.x, playerPos.y, playerPos.z);
    }
  }
}
