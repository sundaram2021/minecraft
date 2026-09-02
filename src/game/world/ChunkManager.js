import * as THREE from 'three';
import { Chunk } from './Chunk.js';
import { VoxelMesher } from './VoxelMesher.js';
import { textureAtlas } from './TextureAtlas.js';
import { BLOCKS } from './Blocks.js';
import { WORLD_HEIGHT } from './WorldGen.js';

export class ChunkManager {
  constructor(scene, worldGen) {
    this.scene = scene;
    this.worldGen = worldGen;
    this.chunks = new Map(); // key: "cx,cz" -> Chunk
    this.renderDistance = 5; // Chunk radius
    this.meshQueue = []; // Chunks waiting for mesh building

    // AAA Physically-aware Materials with shadow reception
    this.solidMaterial = new THREE.MeshLambertMaterial({
      map: textureAtlas.texture,
      vertexColors: true,
      transparent: false,
      alphaTest: 0.12,
      side: THREE.FrontSide,
    });
    // alias for legacy: also expose as standard-like with roughness for future Shader upgrade
    this.solidMaterial.needsUpdate = true;

    // Procedural Animated Water Caustics Texture
    this.waterCanvas = document.createElement('canvas');
    this.waterCanvas.width = 16;
    this.waterCanvas.height = 16;
    this.waterCtx = this.waterCanvas.getContext('2d');
    this.waterTexture = new THREE.CanvasTexture(this.waterCanvas);
    this.waterTexture.magFilter = THREE.NearestFilter;
    this.waterTexture.minFilter = THREE.NearestFilter;
    this.waterTexture.wrapS = THREE.RepeatWrapping;
    this.waterTexture.wrapT = THREE.RepeatWrapping;

    this.waterMaterial = new THREE.MeshStandardMaterial({
      map: this.waterTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.78,
      roughness: 0.12,
      metalness: 0.08,
      side: THREE.DoubleSide,
      envMapIntensity: 0.65,
    });
    this.waterMaterial.onBeforeCompile = (shader) => {
      shader.uniforms.time = { value: 0 };
      shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vCaustUV;\nuniform float time;');
      shader.vertexShader = shader.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\n vCaustUV = uv + vec2(time*0.04, time*0.03);');
      this.waterShader = shader;
    };

    this.lastWaterUpdate = 0;
    this.updateWaterCaustics(0);
  }

  // Real-time procedural water wave animation
  updateWaterCaustics(time) {
    const ctx = this.waterCtx;
    const t = time * 0.0025;

    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const wave1 = Math.sin(x * 0.45 + t * 2.2);
        const wave2 = Math.cos(y * 0.45 - t * 1.8);
        const wave3 = Math.sin((x + y) * 0.3 + t);
        const val = (wave1 + wave2 + wave3) / 3.0; // [-1, 1]

        const r = Math.floor(35 + val * 18);
        const g = Math.floor(95 + val * 28);
        const b = Math.floor(220 + val * 35);
        ctx.fillStyle = `rgba(${r},${g},${b},0.82)`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    this.waterTexture.needsUpdate = true;
  }

  getChunkKey(cx, cz) {
    return `${cx},${cz}`;
  }

  getChunk(cx, cz) {
    return this.chunks.get(this.getChunkKey(cx, cz)) || null;
  }

  // Get block at global world coordinates
  getBlock(wx, wy, wz) {
    if (wy < 0 || wy >= WORLD_HEIGHT) return BLOCKS.AIR;

    const cx = Math.floor(wx / 16);
    const cz = Math.floor(wz / 16);
    const chunk = this.getChunk(cx, cz);
    if (!chunk) return BLOCKS.AIR;

    const lx = ((wx % 16) + 16) % 16;
    const lz = ((wz % 16) + 16) % 16;

    return chunk.getBlock(lx, wy, lz);
  }

  // Set block at global world coordinates
  setBlock(wx, wy, wz, blockId) {
    if (wy < 0 || wy >= WORLD_HEIGHT) return false;

    const cx = Math.floor(wx / 16);
    const cz = Math.floor(wz / 16);
    const chunk = this.getChunk(cx, cz);
    if (!chunk) return false;

    const lx = ((wx % 16) + 16) % 16;
    const lz = ((wz % 16) + 16) % 16;

    const changed = chunk.setBlock(lx, wy, lz, blockId);
    if (changed) {
      this.rebuildChunkMesh(chunk);

      // Boundary updates
      if (lx === 0 && chunk.neighbors.west) this.rebuildChunkMesh(chunk.neighbors.west);
      if (lx === 15 && chunk.neighbors.east) this.rebuildChunkMesh(chunk.neighbors.east);
      if (lz === 0 && chunk.neighbors.north) this.rebuildChunkMesh(chunk.neighbors.north);
      if (lz === 15 && chunk.neighbors.south) this.rebuildChunkMesh(chunk.neighbors.south);
    }
    return changed;
  }

  // Efficient batch block placement with unified mesh rebuilds
  setBlocksBatch(blockArray) {
    const affectedChunks = new Set();
    for (const b of blockArray) {
      if (b.y < 0 || b.y >= WORLD_HEIGHT) continue;
      const cx = Math.floor(b.x / 16);
      const cz = Math.floor(b.z / 16);
      let chunk = this.getChunk(cx, cz);
      if (!chunk) {
        chunk = this.loadChunk(cx, cz);
      }
      if (!chunk) continue;

      const lx = ((b.x % 16) + 16) % 16;
      const lz = ((b.z % 16) + 16) % 16;
      const changed = chunk.setBlock(lx, b.y, lz, b.blockId);
      if (changed) {
        affectedChunks.add(chunk);
        if (lx === 0 && chunk.neighbors.west) affectedChunks.add(chunk.neighbors.west);
        if (lx === 15 && chunk.neighbors.east) affectedChunks.add(chunk.neighbors.east);
        if (lz === 0 && chunk.neighbors.north) affectedChunks.add(chunk.neighbors.north);
        if (lz === 15 && chunk.neighbors.south) affectedChunks.add(chunk.neighbors.south);
      }
    }
    for (const chunk of affectedChunks) {
      this.rebuildChunkMesh(chunk);
    }
  }

  // Re-link 4-way neighbors
  linkNeighbors(chunk) {
    const { cx, cz } = chunk;
    chunk.neighbors.north = this.getChunk(cx, cz - 1);
    chunk.neighbors.south = this.getChunk(cx, cz + 1);
    chunk.neighbors.east = this.getChunk(cx + 1, cz);
    chunk.neighbors.west = this.getChunk(cx - 1, cz);

    if (chunk.neighbors.north) chunk.neighbors.north.neighbors.south = chunk;
    if (chunk.neighbors.south) chunk.neighbors.south.neighbors.north = chunk;
    if (chunk.neighbors.east) chunk.neighbors.east.neighbors.west = chunk;
    if (chunk.neighbors.west) chunk.neighbors.west.neighbors.east = chunk;
  }

  // Generate and load chunk
  loadChunk(cx, cz) {
    const key = this.getChunkKey(cx, cz);
    if (this.chunks.has(key)) return this.chunks.get(key);

    const chunk = new Chunk(cx, cz);
    this.chunks.set(key, chunk);

    // Populate voxel data via WorldGen
    this.worldGen.generateChunkData(cx, cz, chunk.blocks);
    chunk.isGenerated = true;

    this.linkNeighbors(chunk);

    // Queue for meshing
    this.meshQueue.push(chunk);

    return chunk;
  }

  // Rebuild mesh for a single chunk
  rebuildChunkMesh(chunk) {
    const { solidGeo, transGeo } = VoxelMesher.buildChunkGeometry(chunk);

    // 1. Solid Mesh
    if (chunk.solidMesh) {
      this.scene.remove(chunk.solidMesh);
      if (chunk.solidMesh.geometry) chunk.solidMesh.geometry.dispose();
      chunk.solidMesh = null;
    }
    if (solidGeo) {
      solidGeo.computeVertexNormals();
      chunk.solidMesh = new THREE.Mesh(solidGeo, this.solidMaterial);
      chunk.solidMesh.castShadow = true;
      chunk.solidMesh.receiveShadow = true;
      this.scene.add(chunk.solidMesh);
    }

    // 2. Transparent / Water Mesh with AAA depth sorting
    if (chunk.transparentMesh) {
      this.scene.remove(chunk.transparentMesh);
      if (chunk.transparentMesh.geometry) chunk.transparentMesh.geometry.dispose();
      chunk.transparentMesh = null;
    }
    if (transGeo) {
      chunk.transparentMesh = new THREE.Mesh(transGeo, this.waterMaterial);
      chunk.transparentMesh.receiveShadow = false;
      this.scene.add(chunk.transparentMesh);
    }

    chunk.needsRebuild = false;
  }

  // Update dynamic chunks around player
  update(playerPos, maxMeshesPerFrame = 2) {
    const playerChunkX = Math.floor(playerPos.x / 16);
    const playerChunkZ = Math.floor(playerPos.z / 16);

    const rad = this.renderDistance;

    // 1. Identify chunks that need loading
    const requiredChunks = [];
    for (let dz = -rad; dz <= rad; dz++) {
      for (let dx = -rad; dx <= rad; dx++) {
        const cx = playerChunkX + dx;
        const cz = playerChunkZ + dz;
        const distSq = dx * dx + dz * dz;
        if (distSq <= rad * rad) {
          requiredChunks.push({ cx, cz, distSq });
        }
      }
    }

    // Sort by distance to player (closest first)
    requiredChunks.sort((a, b) => a.distSq - b.distSq);

    // Load newly needed chunks
    for (const item of requiredChunks) {
      const key = this.getChunkKey(item.cx, item.cz);
      if (!this.chunks.has(key)) {
        this.loadChunk(item.cx, item.cz);
      }
    }

    // 2. Unload far chunks
    const unloadDistSq = (rad + 2) * (rad + 2);
    for (const [key, chunk] of this.chunks.entries()) {
      const dx = chunk.cx - playerChunkX;
      const dz = chunk.cz - playerChunkZ;
      if (dx * dx + dz * dz > unloadDistSq) {
        if (chunk.solidMesh) this.scene.remove(chunk.solidMesh);
        if (chunk.transparentMesh) this.scene.remove(chunk.transparentMesh);
        chunk.dispose();
        this.chunks.delete(key);
      }
    }

    // 3. Process mesh queue progressively to maintain 60 FPS
    let meshesBuilt = 0;
    while (this.meshQueue.length > 0 && meshesBuilt < maxMeshesPerFrame) {
      const chunk = this.meshQueue.shift();
      if (this.chunks.has(this.getChunkKey(chunk.cx, chunk.cz))) {
        this.rebuildChunkMesh(chunk);
        meshesBuilt++;
      }
    }

    // 4. Animate water caustics ~15 FPS (every 65ms) + shader time
    const now = performance.now();
    if (this.waterShader && this.waterShader.uniforms) {
      this.waterShader.uniforms.time.value = now * 0.001;
    }
    if (now - this.lastWaterUpdate > 55) {
      this.updateWaterCaustics(now);
      this.lastWaterUpdate = now;
    }
  }

  // Initial synchronous spawn area generation so player lands on solid ground immediately
  preloadSpawnArea(spawnX, spawnZ, radius = 3) {
    const pcx = Math.floor(spawnX / 16);
    const pcz = Math.floor(spawnZ / 16);

    for (let dz = -radius; dz <= radius; dz++) {
      for (let dx = -radius; dx <= radius; dx++) {
        this.loadChunk(pcx + dx, pcz + dz);
      }
    }

    // Immediately build all initial meshes
    for (const chunk of this.chunks.values()) {
      this.rebuildChunkMesh(chunk);
    }
    this.meshQueue = [];
  }
}
