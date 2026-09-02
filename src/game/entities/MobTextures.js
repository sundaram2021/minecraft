import * as THREE from 'three';

// Procedural 16x16 Pixel-Art Texture Generator for Minecraft Mobs
export class MobTextures {
  static createCanvas(w = 16, h = 16) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    return { canvas, ctx };
  }

  static createTexture(canvas) {
    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    return tex;
  }

  // --- CREEPER ---
  static getCreeperFace() {
    const { canvas, ctx } = this.createCanvas(16, 16);
    // Mottled green base
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const shade = Math.sin(x * 1.5) * 20 + Math.cos(y * 1.5) * 20 + (Math.random() - 0.5) * 30;
        ctx.fillStyle = `rgb(${Math.floor(40 + shade * 0.4)}, ${Math.floor(130 + shade)}, ${Math.floor(35 + shade * 0.3)})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    // Famous Black Eyes (2x2 pixels at 3,3 and 9,3)
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(3, 4, 3, 3);
    ctx.fillRect(10, 4, 3, 3);

    // Nose & Frowning Mouth
    ctx.fillRect(6, 6, 4, 4);   // Nose block
    ctx.fillRect(5, 10, 6, 2);  // Upper lip
    ctx.fillRect(4, 11, 2, 4);  // Left fang drop
    ctx.fillRect(10, 11, 2, 4); // Right fang drop
    ctx.fillRect(6, 12, 4, 3);  // Lower cavity

    return this.createTexture(canvas);
  }

  static getCreeperSkin() {
    const { canvas, ctx } = this.createCanvas(16, 16);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const v = Math.random();
        let r = 45, g = 135, b = 38;
        if (v < 0.25) { r = 25; g = 95; b = 22; }
        else if (v < 0.5) { r = 60; g = 160; b = 50; }
        else if (v < 0.75) { r = 35; g = 115; b = 30; }
        else if (v < 0.9) { r = 80; g = 180; b = 65; }
        else { r = 18; g = 65; b = 15; } // Dark camouflage patch
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return this.createTexture(canvas);
  }

  // --- ZOMBIE ---
  static getZombieFace() {
    const { canvas, ctx } = this.createCanvas(16, 16);
    // Mottled rotten green skin
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const noise = (Math.random() - 0.5) * 30;
        ctx.fillStyle = `rgb(${Math.floor(55 + noise * 0.4)}, ${Math.floor(105 + noise)}, ${Math.floor(45 + noise * 0.3)})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    // Dark hollow eyes
    ctx.fillStyle = '#152512';
    ctx.fillRect(3, 5, 3, 2);
    ctx.fillRect(10, 5, 3, 2);
    // Dark nostrils & mouth
    ctx.fillStyle = '#22381b';
    ctx.fillRect(7, 8, 2, 1);
    ctx.fillRect(5, 11, 6, 2);
    return this.createTexture(canvas);
  }

  static getZombieShirt() {
    const { canvas, ctx } = this.createCanvas(16, 16);
    // Steve's classic cyan shirt (#00a8aa) with dirt/rot patches
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const noise = (Math.random() - 0.5) * 25;
        const isDirt = Math.random() < 0.15;
        if (isDirt) {
          ctx.fillStyle = '#3a4e32';
        } else {
          ctx.fillStyle = `rgb(${Math.floor(20 + noise * 0.5)}, ${Math.floor(140 + noise)}, ${Math.floor(155 + noise)})`;
        }
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return this.createTexture(canvas);
  }

  static getZombiePants() {
    const { canvas, ctx } = this.createCanvas(16, 16);
    // Dark indigo trousers with seams
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const noise = (Math.random() - 0.5) * 20;
        ctx.fillStyle = `rgb(${Math.floor(35 + noise * 0.5)}, ${Math.floor(45 + noise * 0.6)}, ${Math.floor(95 + noise)})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    // Shoes on bottom 3 rows
    ctx.fillStyle = '#423326';
    ctx.fillRect(0, 13, 16, 3);
    return this.createTexture(canvas);
  }

  // --- PIG ---
  static getPigSkin() {
    const { canvas, ctx } = this.createCanvas(16, 16);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const noise = (Math.random() - 0.5) * 18;
        ctx.fillStyle = `rgb(${Math.floor(240 + noise * 0.5)}, ${Math.floor(165 + noise * 0.6)}, ${Math.floor(160 + noise * 0.6)})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return this.createTexture(canvas);
  }

  static getPigFace() {
    const { canvas, ctx } = this.createCanvas(16, 16);
    // Pink base
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const noise = (Math.random() - 0.5) * 18;
        ctx.fillStyle = `rgb(${Math.floor(240 + noise * 0.5)}, ${Math.floor(165 + noise * 0.6)}, ${Math.floor(160 + noise * 0.6)})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    // Eyes: white sclera + black pupil
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(2, 6, 3, 2);
    ctx.fillRect(11, 6, 3, 2);
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(3, 6, 2, 2);
    ctx.fillRect(11, 6, 2, 2);

    return this.createTexture(canvas);
  }

  static getPigSnout() {
    const { canvas, ctx } = this.createCanvas(16, 16);
    ctx.fillStyle = '#e88884';
    ctx.fillRect(0, 0, 16, 16);
    // Darker rim
    ctx.fillStyle = '#c76e6a';
    ctx.fillRect(0, 0, 16, 2);
    ctx.fillRect(0, 14, 16, 2);
    ctx.fillRect(0, 0, 2, 16);
    ctx.fillRect(14, 0, 2, 16);
    // Nostrils
    ctx.fillStyle = '#5c2220';
    ctx.fillRect(3, 6, 3, 4);
    ctx.fillRect(10, 6, 3, 4);
    return this.createTexture(canvas);
  }

  // --- COW ---
  static getCowHide() {
    const { canvas, ctx } = this.createCanvas(16, 16);
    // White background
    ctx.fillStyle = '#e8e8e8';
    ctx.fillRect(0, 0, 16, 16);
    // Black / Dark brown cow spots
    ctx.fillStyle = '#3a271c';
    ctx.fillRect(2, 2, 6, 5);
    ctx.fillRect(1, 4, 7, 4);
    ctx.fillRect(9, 8, 5, 6);
    ctx.fillRect(10, 7, 4, 7);
    ctx.fillRect(0, 11, 4, 4);
    return this.createTexture(canvas);
  }

  static getCowMuzzle() {
    const { canvas, ctx } = this.createCanvas(16, 16);
    ctx.fillStyle = '#bfa595';
    ctx.fillRect(0, 0, 16, 16);
    // Nostrils
    ctx.fillStyle = '#4a3328';
    ctx.fillRect(3, 6, 3, 4);
    ctx.fillRect(10, 6, 3, 4);
    return this.createTexture(canvas);
  }

  // --- SKELETON ---
  static getSkeletonSkull() {
    const { canvas, ctx } = this.createCanvas(16, 16);
    // Bone white
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const noise = (Math.random() - 0.5) * 15;
        const v = Math.floor(205 + noise);
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    // Hollow black eye sockets
    ctx.fillStyle = '#111111';
    ctx.fillRect(2, 5, 3, 3);
    ctx.fillRect(11, 5, 3, 3);
    // Nasal cavity
    ctx.fillRect(7, 8, 2, 2);
    // Teeth row
    ctx.fillRect(4, 12, 1, 2);
    ctx.fillRect(6, 12, 1, 2);
    ctx.fillRect(9, 12, 1, 2);
    ctx.fillRect(11, 12, 1, 2);
    return this.createTexture(canvas);
  }

  static getSkeletonRibs() {
    const { canvas, ctx } = this.createCanvas(16, 16);
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, 16, 16);
    // Spine
    ctx.fillStyle = '#dcdcdc';
    ctx.fillRect(7, 0, 2, 16);
    // Ribs
    for (let y = 2; y <= 12; y += 3) {
      ctx.fillRect(2, y, 12, 1);
    }
    return this.createTexture(canvas);
  }
}
