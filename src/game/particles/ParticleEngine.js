import * as THREE from 'three';
import { textureAtlas } from '../world/TextureAtlas.js';
import { getBlockDef } from '../world/Blocks.js';

export class ParticleEngine {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];

    // Shared particle geometry & material for debris
    this.debrisGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    this.debrisMat = new THREE.MeshBasicMaterial({
      map: textureAtlas.texture,
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
    });
  }

  // Spawn bursting debris when breaking a block
  spawnBlockBreakParticles(x, y, z, blockId) {
    const def = getBlockDef(blockId);
    let texKey = 'dirt';
    if (def.textures) {
      texKey = def.textures.top || def.textures.all || def.textures.side || 'dirt';
    }
    const uv = textureAtlas.getUV(texKey);

    const count = 18;
    for (let i = 0; i < count; i++) {
      const p = new THREE.Mesh(this.debrisGeo, this.debrisMat.clone());
      const px = x + 0.2 + Math.random() * 0.6;
      const py = y + 0.2 + Math.random() * 0.6;
      const pz = z + 0.2 + Math.random() * 0.6;

      p.position.set(px, py, pz);

      const vx = (Math.random() - 0.5) * 4.0;
      const vy = 2.0 + Math.random() * 3.5;
      const vz = (Math.random() - 0.5) * 4.0;

      this.scene.add(p);

      this.particles.push({
        mesh: p,
        velocity: new THREE.Vector3(vx, vy, vz),
        life: 0.6 + Math.random() * 0.4,
        maxLife: 1.0,
        gravity: -16.0,
      });
    }
  }

  // AAA Rain impact splash on ground
  spawnRainSplash(x, y, z, count = 3){
    for(let i=0;i<count;i++){
      const geo=new THREE.BoxGeometry(0.04,0.04,0.04);
      const mat=new THREE.MeshBasicMaterial({ color:0x8ab4ff, transparent:true, opacity:0.7});
      const p=new THREE.Mesh(geo,mat);
      p.position.set(x+(Math.random()-0.5)*0.3,y+0.12,z+(Math.random()-0.5)*0.3);
      const vx=(Math.random()-0.5)*1.8; const vy=0.6+Math.random()*1.0; const vz=(Math.random()-0.5)*1.8;
      this.scene.add(p);
      this.particles.push({ mesh:p, velocity:new THREE.Vector3(vx,vy,vz), life:0.22+Math.random()*0.18, maxLife:0.4, gravity:-8});
    }
  }
  // AAA Torch smoke + flame flicker
  spawnTorchSmoke(x,y,z){
    const geo=new THREE.BoxGeometry(0.06,0.06,0.06);
    const mat=new THREE.MeshBasicMaterial({ color:0x555555, transparent:true, opacity:0.45});
    const p=new THREE.Mesh(geo,mat);
    p.position.set(x+0.5+ (Math.random()-0.5)*0.12, y+0.95, z+0.5+ (Math.random()-0.5)*0.12);
    this.scene.add(p);
    this.particles.push({ mesh:p, velocity:new THREE.Vector3((Math.random()-0.5)*0.3, 0.9+Math.random()*0.6, (Math.random()-0.5)*0.3), life:0.9+Math.random()*0.5, maxLife:1.4, gravity:0.25, smoke:true});
  }
  // AAA Lava ember pop
  spawnLavaEmber(x,y,z){
    const col = Math.random()<0.5? 0xff4400 : 0xffaa00;
    const geo=new THREE.BoxGeometry(0.05,0.05,0.05);
    const mat=new THREE.MeshBasicMaterial({ color:col, transparent:true, opacity:0.95});
    const p=new THREE.Mesh(geo,mat);
    p.position.set(x+0.5,y+0.9,z+0.5);
    this.scene.add(p);
    this.particles.push({ mesh:p, velocity:new THREE.Vector3((Math.random()-0.5)*1.2, 2.2+Math.random()*1.5, (Math.random()-0.5)*1.2), life:0.5+Math.random()*0.4, maxLife:0.9, gravity:-6 });
  }

  // Spawn water splash particles
  spawnWaterSplash(pos, count = 12) {
    for (let i = 0; i < count; i++) {
      const geo = new THREE.BoxGeometry(0.06, 0.06, 0.06);
      const mat = new THREE.MeshBasicMaterial({ color: 0x4499ee, transparent: true, opacity: 0.8 });
      const p = new THREE.Mesh(geo, mat);
      p.position.set(pos.x + (Math.random() - 0.5) * 0.5, pos.y, pos.z + (Math.random() - 0.5) * 0.5);

      const vx = (Math.random() - 0.5) * 2.5;
      const vy = 1.5 + Math.random() * 2.0;
      const vz = (Math.random() - 0.5) * 2.5;

      this.scene.add(p);
      this.particles.push({
        mesh: p,
        velocity: new THREE.Vector3(vx, vy, vz),
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.7,
        gravity: -12.0,
      });
    }
  }

  // Spawn mob death cloud poof particles
  spawnDeathPoof(pos, count = 20) {
    for (let i = 0; i < count; i++) {
      const size = 0.12 + Math.random() * 0.12;
      const geo = new THREE.BoxGeometry(size, size, size);
      const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });
      const p = new THREE.Mesh(geo, mat);
      p.position.set(pos.x + (Math.random() - 0.5) * 0.4, pos.y + Math.random() * 0.8, pos.z + (Math.random() - 0.5) * 0.4);

      const vx = (Math.random() - 0.5) * 3.0;
      const vy = 0.5 + Math.random() * 2.0;
      const vz = (Math.random() - 0.5) * 3.0;

      this.scene.add(p);
      this.particles.push({
        mesh: p,
        velocity: new THREE.Vector3(vx, vy, vz),
        life: 0.5 + Math.random() * 0.4,
        maxLife: 0.9,
        gravity: -2.0, // Slow float
      });
    }
  }

  // Spawn explosion blast debris and fire
  spawnExplosion(pos) {
    // Blast fire and smoke
    const count = 40;
    for (let i = 0; i < count; i++) {
      const isFire = Math.random() < 0.4;
      const col = isFire ? (Math.random() < 0.5 ? 0xff4400 : 0xffcc00) : 0x444444;
      const size = 0.15 + Math.random() * 0.2;
      const geo = new THREE.BoxGeometry(size, size, size);
      const mat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.95 });
      const p = new THREE.Mesh(geo, mat);
      p.position.copy(pos);

      const speed = 4.0 + Math.random() * 8.0;
      const dir = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 1.5,
        (Math.random() - 0.5) * 2
      ).normalize().multiplyScalar(speed);

      this.scene.add(p);
      this.particles.push({
        mesh: p,
        velocity: dir,
        life: 0.6 + Math.random() * 0.5,
        maxLife: 1.1,
        gravity: -10.0,
      });
    }
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        if (p.mesh.geometry) p.mesh.geometry.dispose();
        if (p.mesh.material) p.mesh.material.dispose();
        this.particles.splice(i, 1);
        continue;
      }

      // Physics integration
      p.velocity.y += p.gravity * dt;
      p.mesh.position.x += p.velocity.x * dt;
      p.mesh.position.y += p.velocity.y * dt;
      p.mesh.position.z += p.velocity.z * dt;

      // Fade opacity + smoke expands and fades to translucent grey
      let alpha = p.life / p.maxLife;
      if (p.smoke) alpha *= 0.65;
      if (p.mesh.material) {
        p.mesh.material.opacity = alpha;
        if(p.smoke){
          p.mesh.scale.set(1+ (1-alpha)*1.2, 1+ (1-alpha)*1.2, 1+ (1-alpha)*1.2);
        }
      }
    }
  }

  clear() {
    for (const p of this.particles) {
      this.scene.remove(p.mesh);
    }
    this.particles = [];
  }
}
