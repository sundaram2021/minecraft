import * as THREE from 'three';
import { BLOCKS, getBlockDef } from '../world/Blocks.js';
import { textureAtlas } from '../world/TextureAtlas.js';

export class Raycaster {
  constructor(scene, chunkManager) {
    this.scene = scene;
    this.chunkManager = chunkManager;
    this.maxDistance = 5.5;

    // Selection Wireframe Outline
    const wireGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.002, 1.002, 1.002));
    const wireMat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2, depthTest: true });
    this.selectionBox = new THREE.LineSegments(wireGeo, wireMat);
    this.selectionBox.visible = false;
    this.scene.add(this.selectionBox);

    // Break Stage Cracking Overlay Mesh
    const breakGeo = new THREE.BoxGeometry(1.004, 1.004, 1.004);
    this.breakMaterial = new THREE.MeshBasicMaterial({
      map: textureAtlas.texture,
      transparent: true,
      opacity: 0.8,
      depthTest: true,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    this.breakOverlay = new THREE.Mesh(breakGeo, this.breakMaterial);
    this.breakOverlay.visible = false;
    this.scene.add(this.breakOverlay);
  }

  // Fast Voxel DDA (Digital Differential Analyzer) Raycast
  castRay(origin, direction) {
    let x = Math.floor(origin.x);
    let y = Math.floor(origin.y);
    let z = Math.floor(origin.z);

    const stepX = direction.x > 0 ? 1 : (direction.x < 0 ? -1 : 0);
    const stepY = direction.y > 0 ? 1 : (direction.y < 0 ? -1 : 0);
    const stepZ = direction.z > 0 ? 1 : (direction.z < 0 ? -1 : 0);

    const deltaX = stepX !== 0 ? Math.abs(1 / direction.x) : Infinity;
    const deltaY = stepY !== 0 ? Math.abs(1 / direction.y) : Infinity;
    const deltaZ = stepZ !== 0 ? Math.abs(1 / direction.z) : Infinity;

    let maxX = stepX > 0 ? (x + 1 - origin.x) * deltaX : (origin.x - x) * deltaX;
    let maxY = stepY > 0 ? (y + 1 - origin.y) * deltaY : (origin.y - y) * deltaY;
    let maxZ = stepZ > 0 ? (z + 1 - origin.z) * deltaZ : (origin.z - z) * deltaZ;

    let faceNormal = new THREE.Vector3(0, 0, 0);
    let distTraveled = 0;

    while (distTraveled < this.maxDistance) {
      const blockId = this.chunkManager.getBlock(x, y, z);
      if (blockId !== BLOCKS.AIR) {
        const def = getBlockDef(blockId);
        if (!def.liquid) {
          // Hit solid / interactable block
          return {
            hit: true,
            blockId,
            blockPos: new THREE.Vector3(x, y, z),
            faceNormal: faceNormal.clone(),
            placePos: new THREE.Vector3(x + faceNormal.x, y + faceNormal.y, z + faceNormal.z),
            distance: distTraveled,
          };
        }
      }

      if (maxX < maxY) {
        if (maxX < maxZ) {
          distTraveled = maxX;
          maxX += deltaX;
          x += stepX;
          faceNormal.set(-stepX, 0, 0);
        } else {
          distTraveled = maxZ;
          maxZ += deltaZ;
          z += stepZ;
          faceNormal.set(0, 0, -stepZ);
        }
      } else {
        if (maxY < maxZ) {
          distTraveled = maxY;
          maxY += deltaY;
          y += stepY;
          faceNormal.set(0, -stepY, 0);
        } else {
          distTraveled = maxZ;
          maxZ += deltaZ;
          z += stepZ;
          faceNormal.set(0, 0, -stepZ);
        }
      }
    }

    return { hit: false };
  }

  // Update target wireframe and break overlay
  updateTarget(targetHit, breakProgress = 0) {
    if (targetHit && targetHit.hit) {
      const { blockPos } = targetHit;
      this.selectionBox.position.set(blockPos.x + 0.5, blockPos.y + 0.5, blockPos.z + 0.5);
      this.selectionBox.visible = true;

      if (breakProgress > 0) {
        const stage = Math.min(9, Math.floor(breakProgress * 10));
        const uv = textureAtlas.getUV(`destroy_stage_${stage}`);

        // Update overlay UVs
        const geo = this.breakOverlay.geometry;
        const uvs = geo.attributes.uv;
        for (let i = 0; i < uvs.count; i += 4) {
          uvs.setXY(i, uv.u0, uv.v0);
          uvs.setXY(i + 1, uv.u1, uv.v0);
          uvs.setXY(i + 2, uv.u0, uv.v1);
          uvs.setXY(i + 3, uv.u1, uv.v1);
        }
        uvs.needsUpdate = true;

        this.breakOverlay.position.set(blockPos.x + 0.5, blockPos.y + 0.5, blockPos.z + 0.5);
        this.breakOverlay.visible = true;
      } else {
        this.breakOverlay.visible = false;
      }
    } else {
      this.selectionBox.visible = false;
      this.breakOverlay.visible = false;
    }
  }
}
