import { BLOCKS, getBlockDef } from './Blocks.js';
import { WORLD_HEIGHT } from './WorldGen.js';

export const CHUNK_SIZE_X = 16;
export const CHUNK_SIZE_Y = WORLD_HEIGHT; // 64
export const CHUNK_SIZE_Z = 16;
export const CHUNK_VOL = CHUNK_SIZE_X * CHUNK_SIZE_Y * CHUNK_SIZE_Z;

export class Chunk {
  constructor(cx, cz) {
    this.cx = cx;
    this.cz = cz;
    this.blocks = new Uint16Array(CHUNK_VOL);
    this.solidMesh = null;
    this.transparentMesh = null;
    this.needsRebuild = true;
    this.isGenerated = false;

    // Neighbor references for cross-border meshing & ambient occlusion
    this.neighbors = {
      north: null, // z - 1
      south: null, // z + 1
      east: null,  // x + 1
      west: null,  // x - 1
    };
  }

  static getIndex(lx, y, lz) {
    return y * 256 + lz * 16 + lx;
  }

  getBlock(lx, y, lz) {
    if (y < 0 || y >= CHUNK_SIZE_Y) return BLOCKS.AIR;

    // Inside current chunk bounds
    if (lx >= 0 && lx < 16 && lz >= 0 && lz < 16) {
      return this.blocks[y * 256 + lz * 16 + lx];
    }

    // Border querying via neighbors
    if (lx < 0 && this.neighbors.west) {
      return this.neighbors.west.getBlock(16 + lx, y, lz);
    }
    if (lx >= 16 && this.neighbors.east) {
      return this.neighbors.east.getBlock(lx - 16, y, lz);
    }
    if (lz < 0 && this.neighbors.north) {
      return this.neighbors.north.getBlock(lx, y, 16 + lz);
    }
    if (lz >= 16 && this.neighbors.south) {
      return this.neighbors.south.getBlock(lx, y, lz - 16);
    }

    return BLOCKS.AIR;
  }

  setBlock(lx, y, lz, blockId) {
    if (lx < 0 || lx >= 16 || y < 0 || y >= CHUNK_SIZE_Y || lz < 0 || lz >= 16) {
      return false;
    }

    const idx = y * 256 + lz * 16 + lx;
    const old = this.blocks[idx];
    if (old === blockId) return false;

    this.blocks[idx] = blockId;
    this.needsRebuild = true;

    // Check if modification is on border and notify neighbor chunk to rebuild mesh
    if (lx === 0 && this.neighbors.west) this.neighbors.west.needsRebuild = true;
    if (lx === 15 && this.neighbors.east) this.neighbors.east.needsRebuild = true;
    if (lz === 0 && this.neighbors.north) this.neighbors.north.needsRebuild = true;
    if (lz === 15 && this.neighbors.south) this.neighbors.south.needsRebuild = true;

    return true;
  }

  isSolid(lx, y, lz) {
    const id = this.getBlock(lx, y, lz);
    if (id === BLOCKS.AIR) return false;
    const def = getBlockDef(id);
    return def.solid && !def.cutout;
  }

  isTransparent(lx, y, lz) {
    const id = this.getBlock(lx, y, lz);
    if (id === BLOCKS.AIR) return true;
    const def = getBlockDef(id);
    return def.transparent;
  }

  dispose() {
    if (this.solidMesh) {
      if (this.solidMesh.geometry) this.solidMesh.geometry.dispose();
      this.solidMesh = null;
    }
    if (this.transparentMesh) {
      if (this.transparentMesh.geometry) this.transparentMesh.geometry.dispose();
      this.transparentMesh = null;
    }
  }
}
