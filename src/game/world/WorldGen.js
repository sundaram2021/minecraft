import { BLOCKS } from './Blocks.js';
import { BIOMES } from './BiomeGenerator.js';

export const SEA_LEVEL = 62;
export const WORLD_HEIGHT = 128;

export class WorldGen {
  constructor(noise, biomeGen) {
    this.noise = noise;
    this.biomeGen = biomeGen;
  }

  getHeight(x, z) {
    const biomeData = this.biomeGen.getBiomeData(x, z);
    const baseH = biomeData.baseHeight;
    const variation = biomeData.heightVariation;

    const n1 = this.noise.fbm2D(x * 0.012, z * 0.012, 4, 2.0, 0.5);
    const n2 = this.noise.fbm2D(x * 0.04, z * 0.04, 2, 2.0, 0.45) * 0.4;
    const n3 = this.noise.fbm2D(x * 0.008, z * 0.008, 2, 2.2, 0.5) * 0.2;

    let height = Math.floor(baseH + (n1 + n2 + n3) * variation);

    if (biomeData.type === BIOMES.MOUNTAINS) {
      const ridge = Math.abs(this.noise.noise2D(x * 0.018, z * 0.018));
      height += Math.floor(ridge * 28);
      const peak = this.noise.fbm2D(x * 0.006, z * 0.006, 3, 2, 0.5);
      if (peak > 0.4) height += Math.floor((peak - 0.4) * 20);
    }
    if (biomeData.type === BIOMES.JUNGLE) {
      height += Math.floor(this.noise.noise2D(x * 0.03, z * 0.03) * 3);
    }
    if (biomeData.type === BIOMES.BADLANDS) {
      const strata = Math.sin(x * 0.08) * Math.cos(z * 0.08);
      height += Math.floor(strata * 4);
    }

    return Math.max(4, Math.min(WORLD_HEIGHT - 10, height));
  }

  generateChunkData(chunkX, chunkZ, blocks) {
    const startX = chunkX * 16;
    const startZ = chunkZ * 16;

    const heightMap = new Int32Array(256);
    const biomeMap = new Array(256);

    for (let lz = 0; lz < 16; lz++) {
      for (let lx = 0; lx < 16; lx++) {
        const wx = startX + lx;
        const wz = startZ + lz;
        const idx2D = lz * 16 + lx;
        const h = this.getHeight(wx, wz);
        heightMap[idx2D] = h;
        biomeMap[idx2D] = this.biomeGen.getBiomeData(wx, wz);
        const biome = biomeMap[idx2D];

        for (let y = 0; y < WORLD_HEIGHT; y++) {
          const idx3D = y * 256 + lz * 16 + lx;

          if (y === 0 || y === 1) {
            blocks[idx3D] = BLOCKS.BEDROCK;
            continue;
          }
          if (y === 2 && this.noise.noise2D(wx * 0.5, wz * 0.5) > 0.2) {
            blocks[idx3D] = BLOCKS.BEDROCK;
            continue;
          }

          if (y > h) {
            if (y <= SEA_LEVEL) {
              if (biome.type === BIOMES.SNOWY_TUNDRA && y === SEA_LEVEL) blocks[idx3D] = BLOCKS.ICE;
              else if (biome.type === BIOMES.SWAMP && y > SEA_LEVEL - 2) blocks[idx3D] = BLOCKS.WATER;
              else blocks[idx3D] = BLOCKS.WATER;
            } else {
              blocks[idx3D] = BLOCKS.AIR;
            }
            continue;
          }

          // 3D Cave carving + ravines
          if (y > 4 && y < h - 1) {
            const cave1 = this.noise.noise3D(wx * 0.035, y * 0.055, wz * 0.035);
            const cave2 = this.noise.noise3D((wx + 2000) * 0.035, (y + 2000) * 0.055, (wz + 2000) * 0.035);
            const caveThresh = y < 35 ? 0.022 : y < 55 ? 0.018 : 0.016;
            if (cave1 * cave1 + cave2 * cave2 < caveThresh) {
              if (y <= SEA_LEVEL && h <= SEA_LEVEL) blocks[idx3D] = BLOCKS.WATER;
              else blocks[idx3D] = BLOCKS.AIR;
              continue;
            }
            // Ravine cheese
            const ravineNoise = this.noise.noise2D(wx * 0.015, wz * 0.015);
            const ravineY = this.noise.noise2D(wx * 0.02 + 500, wz * 0.02 + 500);
            if (Math.abs(ravineNoise) < 0.03 && ravineY > 0.3 && y > 10 && y < h - 2) {
              if (Math.abs(y - (h * 0.6)) < 8) {
                blocks[idx3D] = BLOCKS.AIR;
                continue;
              }
            }
          }

          // AAA Lake carving: small inland lakes (6% of plains/swamp/forest)
          const lakeCenterX = this.noise.noise2D(wx*0.018, wz*0.018);
          const lakeCenterZ = this.noise.noise2D((wx+2000)*0.018, (wz+2000)*0.018);
          const isLakeBasin = (Math.abs(lakeCenterX) < 0.08 && Math.abs(lakeCenterZ) < 0.08 && (biome.type===BIOMES.PLAINS || biome.type===BIOMES.FOREST || biome.type===BIOMES.SWAMP || biome.type===BIOMES.TAIGA) && h > SEA_LEVEL+2 && h < 78);
          if(isLakeBasin){
            const lakeRadius = 4 + Math.abs(this.noise.noise2D(wx*0.09,wz*0.09))*3;
            const distLake = Math.sqrt((wx%16-8)**2 + (wz%16-8)**2);
            // approximate bowl by checking distance to lake center hashed via chunk
            const lakeHash = Math.abs((chunkX*31 + chunkZ*17)%7)===1;
            if(lakeHash && distLake < lakeRadius && y <= h && y >= h-3){
              if(y===h) blocks[idx3D]=BLOCKS.SAND;
              else if(y<=h-1 && y>=h-2) blocks[idx3D]=BLOCKS.CLAY;
              else blocks[idx3D]=BLOCKS.SAND;
              if(y===h-1 || y===h) {
                // water surface one block above
                const aboveIdx=(h+1)*256+lz*16+lx;
                if(h+1<WORLD_HEIGHT) blocks[aboveIdx]=BLOCKS.WATER;
              }
            }
          }

          if (y === h) {
            // Surface AAA: handle lake basin edge already
            if (biome.type === BIOMES.MOUNTAINS && y > 92) blocks[idx3D] = BLOCKS.SNOW_BLOCK;
            else if (biome.type === BIOMES.MOUNTAINS && y > 88) blocks[idx3D] = BLOCKS.STONE;
            else if (h < SEA_LEVEL - 1) blocks[idx3D] = BLOCKS.GRAVEL;
            else if (h <= SEA_LEVEL + 1 && (biome.type === BIOMES.BEACH || biome.type === BIOMES.OCEAN)) blocks[idx3D] = BLOCKS.SAND;
            else if (biome.type === BIOMES.BADLANDS) {
              const layer = y % 6;
              if (layer === 0) blocks[idx3D] = BLOCKS.RED_TERRACOTTA;
              else if (layer === 2) blocks[idx3D] = BLOCKS.ORANGE_TERRACOTTA;
              else if (layer === 4) blocks[idx3D] = BLOCKS.TERRACOTTA;
              else blocks[idx3D] = BLOCKS.SAND;
            } else if (biome.type === BIOMES.SWAMP && y <= SEA_LEVEL + 1) blocks[idx3D] = BLOCKS.GRASS;
            else blocks[idx3D] = biome.surfaceBlock;
          } else if (y >= h - 4) {
            if (biome.type === BIOMES.DESERT) blocks[idx3D] = BLOCKS.SANDSTONE;
            else if (biome.type === BIOMES.BADLANDS) {
              const ly = y % 8;
              if (ly < 2) blocks[idx3D] = BLOCKS.TERRACOTTA;
              else if (ly < 4) blocks[idx3D] = BLOCKS.WHITE_TERRACOTTA;
              else blocks[idx3D] = BLOCKS.RED_TERRACOTTA;
            } else if (biome.type === BIOMES.MOUNTAINS && y > 85) blocks[idx3D] = BLOCKS.STONE;
            else if (biome.type === BIOMES.SWAMP) blocks[idx3D] = BLOCKS.DIRT;
            else blocks[idx3D] = biome.subBlock;
          } else if (y >= h - 8 && y < h - 4) {
            // Transition layer with stone mix
            if (biome.type === BIOMES.BADLANDS) blocks[idx3D] = BLOCKS.TERRACOTTA;
            else blocks[idx3D] = BLOCKS.STONE;
          } else {
            blocks[idx3D] = this.getOreOrStone(wx, y, wz, biome.type);
          }
        }
      }
    }

    this.decorateChunk(chunkX, chunkZ, blocks, heightMap, biomeMap);
    this.generateStructures(chunkX, chunkZ, blocks, heightMap, biomeMap);
  }

  getOreOrStone(wx, y, wz, biomeType) {
    // Deepslate layer below y=12
    if (y < 12) {
      if (y < 6 && this.noise.noise3D(wx * 0.08, y * 0.08, wz * 0.08) > 0.1) return BLOCKS.DEEPSLATE;
      if (y < 10) {
        const blend = this.noise.noise2D(wx * 0.1, wz * 0.1);
        if (blend > 0.3) return BLOCKS.DEEPSLATE;
      }
    }
    // Granite/Diorite/Andesite blobs
    const graniteN = this.noise.noise3D(wx * 0.06, y * 0.06, wz * 0.06);
    if (graniteN > 0.72 && y > 15 && y < 80) return BLOCKS.GRANITE;
    const dioriteN = this.noise.noise3D((wx+100)*0.06, (y+100)*0.06, (wz+100)*0.06);
    if (dioriteN > 0.74 && y > 15 && y < 75) return BLOCKS.DIORITE;
    const andesiteN = this.noise.noise3D((wx+300)*0.06, (y+300)*0.06, (wz+300)*0.06);
    if (andesiteN > 0.73 && y > 15 && y < 80) return BLOCKS.ANDESITE;

    if (y >= 8 && y <= 95) {
      const coalN = this.noise.noise3D(wx * 0.16, y * 0.16, wz * 0.16);
      if (coalN > 0.62 && y <= 110) return BLOCKS.COAL_ORE;
    }
    if (y >= 5 && y <= 75) {
      const ironN = this.noise.noise3D(wx * 0.20, y * 0.20, wz * 0.20);
      if (ironN > 0.66) return BLOCKS.IRON_ORE;
      const copperN = this.noise.noise3D((wx+500)*0.20, y*0.20, (wz+500)*0.20);
      if (copperN > 0.68 && y >= 10 && y <= 70) return BLOCKS.COPPER_ORE;
    }
    if (y >= 4 && y <= 35) {
      const lapisN = this.noise.noise3D((wx+700)*0.22, y*0.22, (wz+700)*0.22);
      if (lapisN > 0.77) return BLOCKS.LAPIS_ORE;
    }
    if (y >= 4 && y <= 30) {
      const goldN = this.noise.noise3D(wx * 0.24, y * 0.24, wz * 0.24);
      if (goldN > 0.74) return BLOCKS.GOLD_ORE;
      const redN = this.noise.noise3D(wx * 0.26, y * 0.26, wz * 0.26);
      if (redN > 0.76 && y <= 20) return BLOCKS.REDSTONE_ORE;
      const diaN = this.noise.noise3D(wx * 0.28, y * 0.28, wz * 0.28);
      if (diaN > 0.80 && y <= 16) return BLOCKS.DIAMOND_ORE;
    }
    if (biomeType === BIOMES.MOUNTAINS && y >= 50 && y <= 90) {
      const emN = this.noise.noise3D(wx * 0.30, y * 0.30, wz * 0.30);
      if (emN > 0.84) return BLOCKS.EMERALD_ORE;
    }
    // Gravel patches
    if (this.noise.noise3D(wx*0.12, y*0.12, wz*0.12) > 0.78 && y > 20 && y < 60) return BLOCKS.GRAVEL;
    return BLOCKS.STONE;
  }

  decorateChunk(chunkX, chunkZ, blocks, heightMap, biomeMap) {
    const startX = chunkX * 16;
    const startZ = chunkZ * 16;

    for (let lz = 1; lz < 15; lz++) {
      for (let lx = 1; lx < 15; lx++) {
        const wx = startX + lx;
        const wz = startZ + lz;
        const idx2D = lz * 16 + lx;
        const h = heightMap[idx2D];
        const biome = biomeMap[idx2D];
        if (h <= SEA_LEVEL) continue;
        const groundBlock = blocks[h * 256 + lz * 16 + lx];
        const isGrass = groundBlock === BLOCKS.GRASS || groundBlock === BLOCKS.SNOW_GRASS;
        const isSand = groundBlock === BLOCKS.SAND;

        // Tree placement with biome-specific species
        const treeRng = (this.noise.noise2D(wx * 0.73, wz * 0.73) + 1) * 0.5;
        if (isGrass && treeRng < biome.treeDensity) {
          if (biome.type === BIOMES.BIRCH_FOREST) this.growBirchTree(blocks, lx, h + 1, lz);
          else if (biome.type === BIOMES.TAIGA || biome.type === BIOMES.SNOWY_TUNDRA) this.growSpruceTree(blocks, lx, h + 1, lz);
          else if (biome.type === BIOMES.SAVANNA) this.growAcaciaTree(blocks, lx, h + 1, lz);
          else if (biome.type === BIOMES.JUNGLE) this.growJungleTree(blocks, lx, h + 1, lz);
          else if (biome.type === BIOMES.DARK_FOREST) { if (Math.random()<0.6) this.growDarkOakTree(blocks,lx,h+1,lz); else this.growOakTree(blocks,lx,h+1,lz); }
          else if (biome.type === BIOMES.SWAMP) this.growSwampTree(blocks, lx, h+1, lz);
          else this.growOakTree(blocks, lx, h + 1, lz);
          continue;
        }

        if (isSand && (biome.type === BIOMES.DESERT || biome.type === BIOMES.BADLANDS)) {
          const cactusRng = (this.noise.noise2D(wx * 0.91, wz * 0.91) + 1) * 0.5;
          if (cactusRng < (biome.cactusDensity || 0.015)) {
            const cactusH = 1 + Math.floor(((wx * 7 + wz * 13) % 3));
            for (let cy = 0; cy < cactusH; cy++) if (h + 1 + cy < WORLD_HEIGHT) blocks[(h + 1 + cy) * 256 + lz * 16 + lx] = BLOCKS.CACTUS;
            continue;
          }
        }

        if (isGrass) {
          const plantRng = (this.noise.noise2D(wx * 0.85, wz * 0.85) + 1) * 0.5;
          if (plantRng < biome.foliageDensity) {
            const plantTypeRng = Math.abs((wx * 37 + wz * 19) % 100);
            let plant = BLOCKS.TALL_GRASS;
            if (plantTypeRng < 12) plant = BLOCKS.POPPY;
            else if (plantTypeRng < 24) plant = BLOCKS.DANDELION;
            else if (plantTypeRng < 26) plant = BLOCKS.RED_MUSHROOM;
            else if (plantTypeRng < 28) plant = BLOCKS.BROWN_MUSHROOM;
            if (biome.type === BIOMES.SWAMP && plantTypeRng < 20) plant = BLOCKS.BROWN_MUSHROOM;
            if (h + 1 < WORLD_HEIGHT) blocks[(h + 1) * 256 + lz * 16 + lx] = plant;
          }
          // Pumpkin patch rare
          if (this.noise.noise2D(wx*0.33, wz*0.33) > 0.88 && h+1 < WORLD_HEIGHT) {
            if (Math.random()<0.015) blocks[(h+1)*256+lz*16+lx]=BLOCKS.PUMPKIN;
          }
        }
        // Sugarcane near water? placed as cactus alternative near ocean
        if (biome.type === BIOMES.SWAMP || biome.type === BIOMES.JUNGLE) {
          if (groundBlock===BLOCKS.GRASS && this.noise.noise2D(wx*0.9, wz*0.9)>0.82) {
            if (h+1<WORLD_HEIGHT && blocks[(h+1)*256+lz*16+lx]===BLOCKS.AIR) {
              // place small jungle bush leaf
            }
          }
        }
      }
    }
  }

  generateStructures(chunkX, chunkZ, blocks, heightMap, biomeMap) {
    // Simple village house placement: every ~ 8 chunks, attempt house
    const wx0 = chunkX * 16 + 8;
    const wz0 = chunkZ * 16 + 8;
    const hash = Math.abs((chunkX*73856093) ^ (chunkZ*19349663)) % 100;
    if (hash < 4) { // 4% of chunks have structure
      const idx = 8*16+8;
      const h = heightMap[idx];
      const biome = biomeMap[idx];
      if (h > SEA_LEVEL+1 && h < WORLD_HEIGHT-12 && biome.type !== BIOMES.OCEAN && biome.type!==BIOMES.BEACH) {
        // Check flatness
        let flat = true;
        for(let dz=-2; dz<=3; dz++) for(let dx=-2; dx<=3; dx++) {
          const ch = heightMap[(8+dz)*16+(8+dx)]||h;
          if(Math.abs(ch - h) > 2) flat=false;
        }
        if(flat) this.placeVillageHouse(blocks, 8, h+1, 8, biome);
      }
    }
    // Desert well / small pyramid chance
    if (hash === 7) {
      const idx = 8*16+8;
      const h = heightMap[idx];
      const biome = biomeMap[idx];
      if(biome.type===BIOMES.DESERT && h>SEA_LEVEL) this.placeDesertWell(blocks,8,h+1,8);
    }
  }

  placeVillageHouse(blocks, lx, baseY, lz, biome) {
    if (baseY + 6 >= WORLD_HEIGHT) return;
    const wood = biome.type===BIOMES.SAVANNA? BLOCKS.ACACIA_PLANKS : biome.type===BIOMES.TAIGA? BLOCKS.SPRUCE_PLANKS : BLOCKS.OAK_PLANKS;
    const log = biome.type===BIOMES.SAVANNA? BLOCKS.ACACIA_LOG : biome.type===BIOMES.TAIGA? BLOCKS.SPRUCE_LOG : BLOCKS.OAK_LOG;
    // Floor 5x5
    for(let dx=-2; dx<=2; dx++) for(let dz=-2; dz<=2; dz++) {
      const tx=lx+dx, tz=lz+dz;
      if(tx>=0&&tx<16&&tz>=0&&tz<16) blocks[baseY*256+tz*16+tx]=BLOCKS.COBBLESTONE;
    }
    // Walls 5 high, cobblestone corners + planks
    for(let y=1; y<=4; y++) {
      for(let dx=-2; dx<=2; dx++) for(let dz=-2; dz<=2; dz++) {
        if(dx===-2||dx===2||dz===-2||dz===2){
          const tx=lx+dx, tz=lz+dz;
          if(tx>=0&&tx<16&&tz>=0&&tz<16){
            if(y===1 && dx===0 && dz===2) continue; // door
            if(y===2 && (dx===2||dx===-2) && dz===0) {
              blocks[(baseY+y)*256+tz*16+tx]=BLOCKS.GLASS;
            } else {
              // corners logs
              if((dx===-2&&dz===-2)||(dx===2&&dz===-2)||(dx===-2&&dz===2)||(dx===2&&dz===2)) blocks[(baseY+y)*256+tz*16+tx]=log;
              else blocks[(baseY+y)*256+tz*16+tx]= (y===4)? log : wood;
            }
          }
        }
      }
    }
    // Roof - stairs pyramid with planks (use stairs texture)
    for(let y=0; y<2; y++){
      for(let dx=-2+y; dx<=2-y; dx++) for(let dz=-2+y; dz<=2-y; dz++){
        const tx=lx+dx, tz=lz+dz;
        if(tx>=0&&tx<16&&tz>=0&&tz<16) blocks[(baseY+5+y)*256+tz*16+tx]= wood;
      }
    }
    // Chest inside
    const cx=lx+1, cz=lz+1;
    if(cx>=0&&cx<16&&cz>=0&&cz<16) blocks[(baseY+1)*256+cz*16+cx]=BLOCKS.CHEST;
    // Torch
    if(lx>=0&&lx<16&&lz>=0&&lz<16) blocks[(baseY+3)*256+lz*16+lx]=BLOCKS.TORCH;
  }

  placeDesertWell(blocks, lx, baseY, lz){
    for(let dx=-2; dx<=2; dx++) for(let dz=-2; dz<=2; dz++){
      const tx=lx+dx, tz=lz+dz;
      if(tx>=0&&tx<16&&tz>=0&&tz<16){
        if(Math.abs(dx)===2||Math.abs(dz)===2) blocks[baseY*256+tz*16+tx]=BLOCKS.SANDSTONE;
        else if(dx===0&&dz===0) blocks[baseY*256+tz*16+tx]=BLOCKS.WATER;
        else blocks[baseY*256+tz*16+tx]=BLOCKS.SAND;
      }
    }
    for(let y=1; y<=2; y++) for(let dx=-2; dx<=2; dx++) for(let dz=-2; dz<=2; dz++){
      if(Math.abs(dx)===2||Math.abs(dz)===2){
        const tx=lx+dx, tz=lz+dz;
        if(tx>=0&&tx<16&&tz>=0&&tz<16) blocks[(baseY+y)*256+tz*16+tx]=BLOCKS.SANDSTONE;
      }
    }
  }

  growOakTree(blocks, lx, baseTreeY, lz) {
    const trunkHeight = 4 + ((lx*3 + lz*5) % 3);
    if (baseTreeY + trunkHeight + 3 >= WORLD_HEIGHT) return;
    for (let ty = 0; ty < trunkHeight; ty++) blocks[(baseTreeY + ty) * 256 + lz * 16 + lx] = BLOCKS.OAK_LOG;
    const leafStart = baseTreeY + trunkHeight - 2;
    for (let dy = 0; dy <= 3; dy++) {
      const radius = dy >= 2 ? 1 : 2;
      for (let ox = -radius; ox <= radius; ox++) for (let oz = -radius; oz <= radius; oz++) {
        if (Math.abs(ox) === radius && Math.abs(oz) === radius && (dy === 3 || Math.random() < 0.3)) continue;
        const tx = lx + ox, tz = lz + oz, ty = leafStart + dy;
        if (tx >= 0 && tx < 16 && tz >= 0 && tz < 16 && ty < WORLD_HEIGHT) {
          const idx = ty * 256 + tz * 16 + tx;
          if (blocks[idx] === BLOCKS.AIR) blocks[idx] = BLOCKS.OAK_LEAVES;
        }
      }
    }
  }

  growBirchTree(blocks, lx, baseTreeY, lz) {
    const trunkHeight = 5 + ((lx + lz) % 2);
    if (baseTreeY + trunkHeight + 3 >= WORLD_HEIGHT) return;
    for (let ty = 0; ty < trunkHeight; ty++) blocks[(baseTreeY + ty) * 256 + lz * 16 + lx] = BLOCKS.BIRCH_LOG;
    const leafStart = baseTreeY + trunkHeight - 3;
    for (let dy = 0; dy <= 4; dy++) {
      const radius = dy >= 3 ? 1 : 2;
      for (let ox = -radius; ox <= radius; ox++) for (let oz = -radius; oz <= radius; oz++) {
        if (Math.abs(ox) === radius && Math.abs(oz) === radius && dy >= 2) continue;
        const tx = lx + ox, tz = lz + oz, ty = leafStart + dy;
        if (tx >= 0 && tx < 16 && tz >= 0 && tz < 16 && ty < WORLD_HEIGHT) {
          const idx = ty * 256 + tz * 16 + tx;
          if (blocks[idx] === BLOCKS.AIR) blocks[idx] = BLOCKS.BIRCH_LEAVES;
        }
      }
    }
  }

  growSpruceTree(blocks, lx, baseTreeY, lz) {
    const trunkHeight = 6 + ((lx + lz) % 3);
    if (baseTreeY + trunkHeight + 3 >= WORLD_HEIGHT) return;
    for (let ty = 0; ty < trunkHeight; ty++) blocks[(baseTreeY + ty) * 256 + lz * 16 + lx] = BLOCKS.SPRUCE_LOG;
    const leafTop = baseTreeY + trunkHeight;
    for (let ty = leafTop; ty >= baseTreeY + 2; ty--) {
      const distFromTop = leafTop - ty;
      const radius = distFromTop % 2 === 0 ? Math.min(2, Math.floor(distFromTop / 2) + 1) : 1;
      for (let ox = -radius; ox <= radius; ox++) for (let oz = -radius; oz <= radius; oz++) {
        const tx = lx + ox, tz = lz + oz;
        if (tx >= 0 && tx < 16 && tz >= 0 && tz < 16 && ty < WORLD_HEIGHT) {
          const idx = ty * 256 + tz * 16 + tx;
          if (blocks[idx] === BLOCKS.AIR) blocks[idx] = BLOCKS.SPRUCE_LEAVES;
        }
      }
    }
  }

  growJungleTree(blocks, lx, baseTreeY, lz){
    const trunkHeight = 8 + ((lx*lz)%4);
    if (baseTreeY + trunkHeight + 4 >= WORLD_HEIGHT) return;
    for(let ty=0; ty<trunkHeight; ty++) blocks[(baseTreeY+ty)*256+lz*16+lx]=BLOCKS.JUNGLE_LOG;
    const leafStart = baseTreeY + trunkHeight -3;
    for(let dy=0; dy<=4; dy++){
      const r = dy<2?2: dy===2?2:1;
      for(let ox=-r; ox<=r; ox++) for(let oz=-r; oz<=r; oz++){
        if(Math.abs(ox)===r && Math.abs(oz)===r && Math.random()<0.4) continue;
        const tx=lx+ox, tz=lz+oz, ty=leafStart+dy;
        if(tx>=0&&tx<16&&tz>=0&&tz<16&&ty<WORLD_HEIGHT){
          const idx=ty*256+tz*16+tx;
          if(blocks[idx]===BLOCKS.AIR) blocks[idx]=BLOCKS.JUNGLE_LEAVES;
        }
      }
    }
    // vines hanging
    if(Math.random()<0.5 && baseTreeY+trunkHeight+1<WORLD_HEIGHT) {
      blocks[(baseTreeY+trunkHeight)*256+lz*16+lx]=BLOCKS.JUNGLE_LEAVES;
    }
  }

  growAcaciaTree(blocks, lx, baseTreeY, lz){
    const trunkHeight = 4 + ((lx+lz)%2);
    if (baseTreeY + trunkHeight + 5 >= WORLD_HEIGHT) return;
    // twisted trunk diagonal
    for(let ty=0; ty<trunkHeight; ty++){
      const offset = ty>2 ? 1 : 0;
      const tx = Math.min(15, lx+offset);
      const tz = Math.min(15, lz+offset);
      blocks[(baseTreeY+ty)*256+tz*16+tx]=BLOCKS.ACACIA_LOG;
      if(ty===trunkHeight-1){
        // canopy at top diagonal
        for(let dx=-2; dx<=2; dx++) for(let dz=-2; dz<=2; dz++){
          const cx=tx+dx, cz=tz+dz;
          if(cx>=0&&cx<16&&cz>=0&&cz<16){
            const idx=(baseTreeY+ty+1)*256+cz*16+cx;
            if(blocks[idx]===BLOCKS.AIR && !(Math.abs(dx)===2 && Math.abs(dz)===2)) blocks[idx]=BLOCKS.ACACIA_LEAVES;
          }
        }
      }
    }
  }

  growDarkOakTree(blocks, lx, baseTreeY, lz){
    // 2x2 trunk
    if(lx>13||lz>13) return this.growOakTree(blocks,lx,baseTreeY,lz);
    const h=5 + ((lx*lz)%2);
    if(baseTreeY+h+4>=WORLD_HEIGHT) return;
    for(let dx=0; dx<2; dx++) for(let dz=0; dz<2; dz++) for(let ty=0; ty<h; ty++){
      blocks[(baseTreeY+ty)*256+(lz+dz)*16+(lx+dx)]=BLOCKS.DARK_OAK_LOG;
    }
    const top=baseTreeY+h;
    for(let dy=-1; dy<=2; dy++) for(let dx=-2; dx<=3; dx++) for(let dz=-2; dz<=3; dz++){
      const tx=lx+dx, tz=lz+dz, ty=top+dy;
      if(tx>=0&&tx<16&&tz>=0&&tz<16&&ty<WORLD_HEIGHT){
        if(Math.abs(dx)>=2 && Math.abs(dz)>=2 && dy>0) continue;
        const idx=ty*256+tz*16+tx;
        if(blocks[idx]===BLOCKS.AIR) blocks[idx]=BLOCKS.DARK_OAK_LEAVES;
      }
    }
  }

  growSwampTree(blocks, lx, baseTreeY, lz){
    const trunkHeight = 4 + ((lx*lz)%2);
    if (baseTreeY + trunkHeight + 3 >= WORLD_HEIGHT) return;
    for(let ty=0; ty<trunkHeight; ty++) blocks[(baseTreeY+ty)*256+lz*16+lx]=BLOCKS.OAK_LOG;
    const leafStart = baseTreeY+trunkHeight-1;
    for(let dy=0; dy<=2; dy++){
      const r = dy===0?2:1;
      for(let ox=-r; ox<=r; ox++) for(let oz=-r; oz<=r; oz++){
        const tx=lx+ox, tz=lz+oz, ty=leafStart+dy;
        if(tx>=0&&tx<16&&tz>=0&&tz<16&&ty<WORLD_HEIGHT){
          const idx=ty*256+tz*16+tx;
          if(blocks[idx]===BLOCKS.AIR) blocks[idx]=BLOCKS.OAK_LEAVES;
        }
      }
    }
    // vines
    for(let i=0;i<2;i++){
      const vx=lx+ (Math.random()<0.5?1:-1);
      const vz=lz;
      if(vx>=0&&vx<16&&vz>=0&&vz<16&&leafStart<WORLD_HEIGHT){
        if(blocks[leafStart*256+vz*16+vx]===BLOCKS.AIR) blocks[leafStart*256+vz*16+vx]=BLOCKS.OAK_LEAVES;
      }
    }
  }
}
