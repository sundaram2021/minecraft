import * as THREE from 'three';
import { textureAtlas } from '../world/TextureAtlas.js';
import { getBlockDef, BLOCKS } from '../world/Blocks.js';
import { sound } from '../audio/SoundSynthesizer.js';

export class ItemDrop {
  constructor(scene, chunkManager, itemId, count, x, y, z, vx = 0, vy = 3.0, vz = 0) {
    this.scene = scene;
    this.chunkManager = chunkManager;
    this.itemId = itemId;
    this.count = count;

    this.position = new THREE.Vector3(x, y, z);
    this.velocity = new THREE.Vector3(vx, vy, vz);
    this.onGround = false;
    this.age = 0;
    this.maxAge = 300; // 5 minutes lifetime
    this.isCollected = false;

    // Create 3D miniature item mesh
    const geo = new THREE.BoxGeometry(0.28, 0.28, 0.28);
    const mat = new THREE.MeshLambertMaterial({
      map: textureAtlas.texture,
      transparent: false,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.copy(this.position);
    this.scene.add(this.mesh);

    // Apply texture UVs if block
    const def = typeof itemId === 'number' ? getBlockDef(itemId) : null;
    let texKey = 'stone';
    if (def && def.textures) {
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
  }

  update(dt, playerPos, playerInventory) {
    if (this.isCollected) return true;

    this.age += dt;
    if (this.age > this.maxAge) {
      this.dispose();
      return true;
    }

    // Gentle spinning & hovering animation
    this.mesh.rotation.y += 2.0 * dt;

    // Magnetic collection check
    const distToPlayer = this.position.distanceTo(playerPos);
    if (distToPlayer < 2.0 && this.age > 0.4) {
      // Pull towards player
      const dir = new THREE.Vector3().subVectors(playerPos, this.position).normalize();
      this.velocity.x += dir.x * 16.0 * dt;
      this.velocity.y += (dir.y + 0.8) * 16.0 * dt;
      this.velocity.z += dir.z * 16.0 * dt;

      if (distToPlayer < 0.6) {
        // Collect into inventory
        const added = playerInventory.addItem(this.itemId, this.count);
        if (added) {
          sound.playItemPickup();
          this.isCollected = true;
          this.dispose();
          return true;
        }
      }
    } else {
      // Gravity & Ground physics
      if (!this.onGround) {
        this.velocity.y -= 18.0 * dt;
      }
    }

    // Velocity integration
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    this.position.z += this.velocity.z * dt;

    // Ground check
    const blockBelow = this.chunkManager.getBlock(
      Math.floor(this.position.x),
      Math.floor(this.position.y - 0.1),
      Math.floor(this.position.z)
    );
    const def = getBlockDef(blockBelow);
    if (def.solid) {
      this.position.y = Math.floor(this.position.y) + 0.2;
      this.velocity.y = 0;
      this.velocity.x *= 0.7;
      this.velocity.z *= 0.7;
      this.onGround = true;
    } else {
      this.onGround = false;
    }

    // Floating bob
    const bob = Math.sin(this.age * 4.0) * 0.04;
    this.mesh.position.set(this.position.x, this.position.y + bob, this.position.z);

    return false;
  }

  dispose() {
    this.scene.remove(this.mesh);
    if (this.mesh.geometry) this.mesh.geometry.dispose();
    if (this.mesh.material) this.mesh.material.dispose();
  }
}
