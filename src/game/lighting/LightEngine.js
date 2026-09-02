import * as THREE from 'three';
import { BLOCKS } from '../world/Blocks.js';

export class LightEngine {
  constructor(scene) {
    this.scene = scene;
    this.torchLights = new Map(); // key: "x,y,z" -> PointLight

    // Handheld torch dynamic light attached to player
    this.handLight = new THREE.PointLight(0xffaa33, 0, 18, 1.5);
    this.scene.add(this.handLight);
  }

  // AAA flickering torch with 3-point setup: core + fill + emissive mesh
  addTorch(x, y, z) {
    const key = `${x},${y},${z}`;
    if (this.torchLights.has(key)) return;

    const light = new THREE.PointLight(0xffaa44, 0, 0, 2.0);
    light.intensity = 1.85;
    light.distance = 16;
    light.decay = 1.8;
    light.position.set(x + 0.5, y + 0.74, z + 0.5);
    light.userData.baseIntensity = 1.85;
    light.userData.flickerPhase = Math.random() * Math.PI * 2;
    // emissive flame sprite billboard
    const flameCanvas = document.createElement('canvas'); flameCanvas.width=16; flameCanvas.height=16;
    const fctx=flameCanvas.getContext('2d'); fctx.fillStyle='#ffcc55'; fctx.fillRect(6,2,4,5); fctx.fillStyle='#ff7700'; fctx.fillRect(7,4,2,3); fctx.fillStyle='#ffffff'; fctx.fillRect(7,2,2,1);
    const flameTex = new THREE.CanvasTexture(flameCanvas); flameTex.magFilter=THREE.NearestFilter;
    const flameMat = new THREE.SpriteMaterial({ map: flameTex, transparent: true, depthWrite:false, fog:false });
    const flame = new THREE.Sprite(flameMat); flame.position.set(x+0.5, y+0.78, z+0.5); flame.scale.set(0.45,0.65,1);
    this.scene.add(light); this.scene.add(flame);
    this.torchLights.set(key, { light, flame, phase: Math.random()*6 });
  }

  // Remove a destroyed torch
  removeTorch(x, y, z) {
    const key = `${x},${y},${z}`;
    const entry = this.torchLights.get(key);
    if (entry) {
      this.scene.remove(entry.light);
      this.scene.remove(entry.flame);
      this.torchLights.delete(key);
    }
  }

  // AAA dynamic handheld + flicker update
  update(playerPos, isHoldingTorch = false) {
    const t = performance.now()*0.001;
    // torch flicker via Perlin-ish sin
    for(const entry of this.torchLights.values()){
      const flick = Math.sin(t*3.2 + entry.phase)*0.14 + Math.sin(t*7.1 + entry.phase*1.3)*0.07 + (Math.random()-0.5)*0.04;
      entry.light.intensity = Math.max(0, entry.light.userData.baseIntensity + flick);
      entry.flame.material.opacity = 0.88 + flick*0.35;
      entry.flame.scale.set(0.45 + flick*0.05, 0.65 + flick*0.08, 1);
    }
    if (isHoldingTorch) {
      this.handLight.position.set(playerPos.x, playerPos.y + 1.32, playerPos.z);
      // handheld also flickers subtly
      const hFlick = Math.sin(t*4.1)*0.08 + Math.sin(t*8.3)*0.04;
      this.handLight.intensity = 1.9 + hFlick;
      this.handLight.distance = 17;
      this.handLight.decay = 1.7;
    } else {
      this.handLight.intensity = 0;
    }
  }

  clear() {
    for (const light of this.torchLights.values()) {
      this.scene.remove(light);
    }
    this.torchLights.clear();
  }
}
