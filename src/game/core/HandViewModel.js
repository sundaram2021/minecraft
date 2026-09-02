import * as THREE from 'three';
import { textureAtlas } from '../world/TextureAtlas.js';
import { getBlockDef } from '../world/Blocks.js';

export class HandViewModel {
  constructor(camera) {
    this.camera = camera;
    this.group = new THREE.Group();
    this.camera.add(this.group);

    this.currentMesh = null;
    this.swingProgress = 0;
    this.isSwinging = false;
    this.currentSlot = null;
    this.walkBobTimer = 0;

    // Base transform in camera space (lower right)
    this.basePos = new THREE.Vector3(0.44, -0.36, -0.62);
    this.baseRot = new THREE.Euler(0.2, -0.32, 0.12);

    this.group.position.copy(this.basePos);
    this.group.rotation.copy(this.baseRot);

    this.updateHeldItem(null);
  }

  triggerSwing() {
    this.isSwinging = true;
    this.swingProgress = 0;
  }

  // Create textured Steve arm canvas
  createSteveArmTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // Upper sleeve (Steve's classic cyan shirt #00a8a8)
    ctx.fillStyle = '#00a8a8';
    ctx.fillRect(0, 0, 32, 28);
    ctx.fillStyle = '#008585';
    ctx.fillRect(0, 26, 32, 2); // Hem
    ctx.fillStyle = '#17b6b6';
    ctx.fillRect(0, 2, 32, 3); // Highlight

    // Skin (Steve's tanned skin #b88252)
    ctx.fillStyle = '#b88252';
    ctx.fillRect(0, 28, 32, 36);
    // Knuckle & muscle shading
    ctx.fillStyle = '#9e6d42';
    ctx.fillRect(4, 34, 24, 2);
    ctx.fillRect(4, 52, 24, 4); // Knuckles
    ctx.fillStyle = '#cca072';
    ctx.fillRect(2, 36, 4, 16); // Highlight

    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    return tex;
  }

  updateHeldItem(slot) {
    this.currentSlot = slot;

    // Clear previous mesh
    if (this.currentMesh) {
      this.group.remove(this.currentMesh);
      if (this.currentMesh.geometry) this.currentMesh.geometry.dispose();
      this.currentMesh = null;
    }

    if (!slot) {
      // 1. Steve's Textured Arm & Hand (Classic Minecraft First Person)
      const armGeo = new THREE.BoxGeometry(0.18, 0.58, 0.18);
      const armMat = new THREE.MeshLambertMaterial({
        map: this.createSteveArmTexture(),
      });
      this.currentMesh = new THREE.Mesh(armGeo, armMat);
      this.currentMesh.position.set(0, -0.05, 0);
      this.currentMesh.rotation.set(-0.35, 0.25, -0.22);
      this.group.add(this.currentMesh);
      return;
    }

    if (typeof slot.id === 'number') {
      // 2. Held 3D Voxel Block (Tilted isometric preview)
      const geo = new THREE.BoxGeometry(0.28, 0.28, 0.28);
      const mat = new THREE.MeshLambertMaterial({
        map: textureAtlas.texture,
        transparent: false,
      });
      this.currentMesh = new THREE.Mesh(geo, mat);

      const def = getBlockDef(slot.id);
      let texKey = 'dirt';
      if (def.textures) {
        texKey = def.textures.top || def.textures.all || def.textures.side || 'dirt';
      }
      const uv = textureAtlas.getUV(texKey);
      const uvs = geo.attributes.uv;
      for (let i = 0; i < uvs.count; i += 4) {
        uvs.setXY(i, uv.u0, uv.v0);
        uvs.setXY(i + 1, uv.u1, uv.v0);
        uvs.setXY(i + 2, uv.u0, uv.v1);
        uvs.setXY(i + 3, uv.u1, uv.v1);
      }
      uvs.needsUpdate = true;

      this.currentMesh.position.set(0, 0, 0);
      this.currentMesh.rotation.set(0.35, 0.65, 0);
      this.group.add(this.currentMesh);
    } else {
      // 3. Held 3D Extruded Tool (Sword, Pickaxe, Axe, Shovel, Torch)
      const isSword = slot.id.includes('sword');
      const isPickaxe = slot.id.includes('pickaxe');
      const isAxe = slot.id.includes('axe');
      const isTorch = slot.id === 'torch';

      let bladeCol = 0x8b5a2b;
      let hiCol = 0xb57c3d;
      if (slot.id.includes('diamond')) {
        bladeCol = 0x4ae3e3;
        hiCol = 0xb8ffff;
      } else if (slot.id.includes('iron')) {
        bladeCol = 0xdcdcdc;
        hiCol = 0xffffff;
      } else if (slot.id.includes('stone')) {
        bladeCol = 0x7c7c7c;
        hiCol = 0xa0a0a0;
      } else if (slot.id.includes('golden')) {
        bladeCol = 0xffd700;
        hiCol = 0xfffa80;
      }

      const toolGroup = new THREE.Group();

      if (isTorch) {
        // 3D Torch stick & glowing flame head
        const stickGeo = new THREE.BoxGeometry(0.045, 0.42, 0.045);
        const stickMat = new THREE.MeshLambertMaterial({ color: 0x6e4c23 });
        const stick = new THREE.Mesh(stickGeo, stickMat);
        toolGroup.add(stick);

        const flameGeo = new THREE.BoxGeometry(0.065, 0.08, 0.065);
        const flameMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
        const flame = new THREE.Mesh(flameGeo, flameMat);
        flame.position.set(0, 0.22, 0);
        toolGroup.add(flame);
      } else if (isSword) {
        // Detailed Sword (Handle + Pommel + Crossguard + Double-Edged Blade)
        const stickMat = new THREE.MeshLambertMaterial({ color: 0x6e4c23 });
        const bladeMat = new THREE.MeshLambertMaterial({ color: bladeCol });
        const hiMat = new THREE.MeshLambertMaterial({ color: hiCol });

        // Handle
        const handle = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.16, 0.035), stickMat);
        handle.position.set(0, -0.08, 0);
        toolGroup.add(handle);

        // Crossguard
        const guard = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.035, 0.05), stickMat);
        guard.position.set(0, 0.01, 0);
        toolGroup.add(guard);

        // Blade
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.52, 0.025), bladeMat);
        blade.position.set(0, 0.28, 0);
        toolGroup.add(blade);

        // Blade center fuller highlight
        const fuller = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.45, 0.03), hiMat);
        fuller.position.set(0, 0.26, 0);
        toolGroup.add(fuller);
      } else if (isPickaxe) {
        // Pickaxe (Shaft + Curved T-Head)
        const stickMat = new THREE.MeshLambertMaterial({ color: 0x6e4c23 });
        const headMat = new THREE.MeshLambertMaterial({ color: bladeCol });

        const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.48, 0.04), stickMat);
        toolGroup.add(shaft);

        const head = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.07, 0.055), headMat);
        head.position.set(0, 0.24, 0);
        toolGroup.add(head);

        // Curved pick tips
        const tipL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.05), headMat);
        tipL.position.set(-0.14, 0.18, 0);
        toolGroup.add(tipL);

        const tipR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.05), headMat);
        tipR.position.set(0.14, 0.18, 0);
        toolGroup.add(tipR);
      } else {
        // Axe / Generic tool
        const stickMat = new THREE.MeshLambertMaterial({ color: 0x6e4c23 });
        const headMat = new THREE.MeshLambertMaterial({ color: bladeCol });

        const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.46, 0.04), stickMat);
        toolGroup.add(shaft);

        const head = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.055), headMat);
        head.position.set(0.06, 0.22, 0);
        toolGroup.add(head);
      }

      this.currentMesh = toolGroup;
      this.currentMesh.position.set(0, 0, 0);
      this.currentMesh.rotation.set(-0.25, 0.35, -0.38);
      this.group.add(this.currentMesh);
    }
  }

  update(dt, isMoving = false, speed = 0) {
    // 1. Natural Walk Bobbing
    if (isMoving && speed > 0.5) {
      this.walkBobTimer += dt * 8.5;
      const bobX = Math.sin(this.walkBobTimer * 0.5) * 0.018;
      const bobY = Math.abs(Math.sin(this.walkBobTimer)) * 0.022;
      this.basePos.x = 0.44 + bobX;
      this.basePos.y = -0.36 + bobY;
    } else {
      this.walkBobTimer = 0;
      this.basePos.set(0.44, -0.36, -0.62);
    }

    // 2. Mining / Attack Swing Physics
    if (this.isSwinging) {
      this.swingProgress += dt * 5.5; // Quick snappy swing ~0.18s
      if (this.swingProgress >= 1.0) {
        this.swingProgress = 0;
        this.isSwinging = false;
      }

      // Parabolic forward chop with roll
      const swingAngle = Math.sin(this.swingProgress * Math.PI);
      this.group.position.set(
        this.basePos.x - swingAngle * 0.18,
        this.basePos.y - swingAngle * 0.14,
        this.basePos.z + swingAngle * 0.12
      );
      this.group.rotation.set(
        this.baseRot.x + swingAngle * 0.95,
        this.baseRot.y - swingAngle * 0.75,
        this.baseRot.z - swingAngle * 0.5
      );
    } else {
      this.group.position.copy(this.basePos);
      this.group.rotation.copy(this.baseRot);
    }
  }
}
