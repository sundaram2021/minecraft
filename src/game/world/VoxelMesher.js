import * as THREE from 'three';
import { BLOCKS, getBlockDef } from './Blocks.js';
import { textureAtlas } from './TextureAtlas.js';
import { WORLD_HEIGHT } from './WorldGen.js';

// Direction vector offsets
const FACES = [
  { dir: [0, 1, 0], name: 'top', normal: [0, 1, 0], light: 1.0, corners: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]] },
  { dir: [0, -1, 0], name: 'bottom', normal: [0, -1, 0], light: 0.5, corners: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]] },
  { dir: [1, 0, 0], name: 'east', normal: [1, 0, 0], light: 0.7, corners: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]] },
  { dir: [-1, 0, 0], name: 'west', normal: [-1, 0, 0], light: 0.7, corners: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]] },
  { dir: [0, 0, 1], name: 'south', normal: [0, 0, 1], light: 0.8, corners: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]] },
  { dir: [0, 0, -1], name: 'north', normal: [0, 0, -1], light: 0.8, corners: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]] },
];

const AO_CURVE = [0.45, 0.65, 0.82, 1.0];

export class VoxelMesher {
  // Build Three.js BufferGeometry for solid and transparent passes of a chunk
  static buildChunkGeometry(chunk) {
    const solidPos = [];
    const solidNorm = [];
    const solidUv = [];
    const solidCol = [];
    const solidIdx = [];

    const transPos = [];
    const transNorm = [];
    const transUv = [];
    const transCol = [];
    const transIdx = [];

    let solidVertCount = 0;
    let transVertCount = 0;

    const startWx = chunk.cx * 16;
    const startWz = chunk.cz * 16;

    for (let y = 0; y < WORLD_HEIGHT; y++) {
      for (let lz = 0; lz < 16; lz++) {
        for (let lx = 0; lx < 16; lx++) {
          const blockId = chunk.getBlock(lx, y, lz);
          if (blockId === BLOCKS.AIR) continue;

          const def = getBlockDef(blockId);
          const isLiquid = def.liquid;
          const isPlant = def.isPlantOrMesh;

          const posArr = isLiquid ? transPos : solidPos;
          const normArr = isLiquid ? transNorm : solidNorm;
          const uvArr = isLiquid ? transUv : solidUv;
          const colArr = isLiquid ? transCol : solidCol;
          const idxArr = isLiquid ? transIdx : solidIdx;

          // 1. Plant / Cross Mesh (Poppy, Dandelion, Tall Grass, Torch, Mushroom)
          if (isPlant) {
            const uv = textureAtlas.getUV(def.textures.all || 'poppy');
            const light = 0.95;
            const wx = startWx + lx;
            const wz = startWz + lz;

            // Diagonal quad 1 (from (0,0,0) to (1,1,1))
            let v = solidVertCount;
            solidPos.push(
              wx + 0.1, y, wz + 0.1,
              wx + 0.9, y, wz + 0.9,
              wx + 0.9, y + 1.0, wz + 0.9,
              wx + 0.1, y + 1.0, wz + 0.1,
            );
            solidNorm.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0);
            solidUv.push(
              uv.u0, uv.v0,
              uv.u1, uv.v0,
              uv.u1, uv.v1,
              uv.u0, uv.v1,
            );
            for (let c = 0; c < 4; c++) solidCol.push(light, light, light);
            solidIdx.push(v, v + 1, v + 2, v, v + 2, v + 3);
            solidIdx.push(v, v + 2, v + 1, v, v + 3, v + 2); // Double sided
            solidVertCount += 4;

            // Diagonal quad 2 (from (0,0,1) to (1,1,0))
            v = solidVertCount;
            solidPos.push(
              wx + 0.1, y, wz + 0.9,
              wx + 0.9, y, wz + 0.1,
              wx + 0.9, y + 1.0, wz + 0.1,
              wx + 0.1, y + 1.0, wz + 0.9,
            );
            solidNorm.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0);
            solidUv.push(
              uv.u0, uv.v0,
              uv.u1, uv.v0,
              uv.u1, uv.v1,
              uv.u0, uv.v1,
            );
            for (let c = 0; c < 4; c++) solidCol.push(light, light, light);
            solidIdx.push(v, v + 1, v + 2, v, v + 2, v + 3);
            solidIdx.push(v, v + 2, v + 1, v, v + 3, v + 2);
            solidVertCount += 4;
            continue;
          }

          // 2. Standard 6-Face Voxel Meshing
          for (let f = 0; f < 6; f++) {
            const face = FACES[f];
            const nx = lx + face.dir[0];
            const ny = y + face.dir[1];
            const nz = lz + face.dir[2];

            const neighborId = chunk.getBlock(nx, ny, nz);
            const neighborDef = getBlockDef(neighborId);

            let shouldRender = false;
            if (isLiquid) {
              // Water face renders if neighbor is not water and is transparent
              shouldRender = (neighborId !== blockId && neighborDef.transparent);
            } else if (def.transparent) {
              // Leaves / glass: render face if neighbor is air or different block
              shouldRender = (neighborId === BLOCKS.AIR || (neighborDef.transparent && neighborId !== blockId));
            } else {
              // Solid block: render face if neighbor is transparent or liquid or air
              shouldRender = neighborDef.transparent || neighborDef.liquid;
            }

            if (!shouldRender) continue;

            // Get texture key for this face
            let texKey = 'stone';
            if (def.textures) {
              if (face.name === 'top') texKey = def.textures.top || def.textures.all || 'dirt';
              else if (face.name === 'bottom') texKey = def.textures.bottom || def.textures.all || 'dirt';
              else if (face.name === 'north' || face.name === 'south' || face.name === 'east' || face.name === 'west') {
                texKey = def.textures[face.name] || def.textures.side || def.textures.all || 'dirt';
              }
            }
            const uv = textureAtlas.getUV(texKey);

            // Compute 4-corner Ambient Occlusion (AO)
            const [ao0, ao1, ao2, ao3] = VoxelMesher.computeFaceAO(chunk, lx, y, lz, f);

            const wx = startWx + lx;
            const wz = startWz + lz;
            const corners = face.corners;
            const norm = face.normal;
            const faceLight = face.light;

            // Water surface level slight drop
            const yDrop = (isLiquid && face.name === 'top') ? -0.12 : 0;

            const vertBase = isLiquid ? transVertCount : solidVertCount;

            // Push 4 vertices
            posArr.push(
              wx + corners[0][0], y + corners[0][1] + yDrop, wz + corners[0][2],
              wx + corners[1][0], y + corners[1][1] + yDrop, wz + corners[1][2],
              wx + corners[2][0], y + corners[2][1] + yDrop, wz + corners[2][2],
              wx + corners[3][0], y + corners[3][1] + yDrop, wz + corners[3][2],
            );

            normArr.push(
              norm[0], norm[1], norm[2],
              norm[0], norm[1], norm[2],
              norm[0], norm[1], norm[2],
              norm[0], norm[1], norm[2],
            );

            if (isLiquid) {
              // Full face UVs for procedural animated water caustics
              uvArr.push(
                0, 0,
                1, 0,
                1, 1,
                0, 1
              );
            } else {
              uvArr.push(
                uv.u0, uv.v0,
                uv.u1, uv.v0,
                uv.u1, uv.v1,
                uv.u0, uv.v1,
              );
            }

            // Vertex colors combining Face Light + AO multiplier
            const l0 = faceLight * AO_CURVE[ao0];
            const l1 = faceLight * AO_CURVE[ao1];
            const l2 = faceLight * AO_CURVE[ao2];
            const l3 = faceLight * AO_CURVE[ao3];

            if (blockId === BLOCKS.WATER) {
              // Water blue vertex lighting
              colArr.push(
                0.85 * l0, 0.95 * l0, 1.0 * l0,
                0.85 * l1, 0.95 * l1, 1.0 * l1,
                0.85 * l2, 0.95 * l2, 1.0 * l2,
                0.85 * l3, 0.95 * l3, 1.0 * l3,
              );
            } else if ((blockId === BLOCKS.GRASS && face.name === 'top') || blockId === BLOCKS.OAK_LEAVES || blockId === BLOCKS.BIRCH_LEAVES || blockId===BLOCKS.JUNGLE_LEAVES || blockId===BLOCKS.ACACIA_LEAVES || blockId===BLOCKS.DARK_OAK_LEAVES || blockId===BLOCKS.SPRUCE_LEAVES) {
              // Lush foliage tinting per leaf type
              let tr=0.48, tg=0.76, tb=0.22;
              if(blockId===BLOCKS.BIRCH_LEAVES){ tr=0.62; tg=0.82; tb=0.35; }
              else if(blockId===BLOCKS.JUNGLE_LEAVES){ tr=0.32; tg=0.70; tb=0.26; }
              else if(blockId===BLOCKS.ACACIA_LEAVES){ tr=0.60; tg=0.66; tb=0.24; }
              else if(blockId===BLOCKS.DARK_OAK_LEAVES){ tr=0.30; tg=0.52; tb=0.18; }
              else if(blockId===BLOCKS.SPRUCE_LEAVES){ tr=0.38; tg=0.58; tb=0.32; }
              colArr.push(
                tr * l0, tg * l0, tb * l0,
                tr * l1, tg * l1, tb * l1,
                tr * l2, tg * l2, tb * l2,
                tr * l3, tg * l3, tb * l3,
              );
            } else {
              colArr.push(
                l0, l0, l0,
                l1, l1, l1,
                l2, l2, l2,
                l3, l3, l3,
              );
            }

            // Anisotropy Quad Flip for smooth lighting gradient
            if (ao0 + ao2 > ao1 + ao3) {
              idxArr.push(vertBase, vertBase + 1, vertBase + 2);
              idxArr.push(vertBase, vertBase + 2, vertBase + 3);
            } else {
              idxArr.push(vertBase + 1, vertBase + 2, vertBase + 3);
              idxArr.push(vertBase + 1, vertBase + 3, vertBase);
            }

            if (isLiquid) {
              transVertCount += 4;
            } else {
              solidVertCount += 4;
            }
          }
        }
      }
    }

    let solidGeo = null;
    if (solidPos.length > 0) {
      solidGeo = new THREE.BufferGeometry();
      solidGeo.setAttribute('position', new THREE.Float32BufferAttribute(solidPos, 3));
      solidGeo.setAttribute('normal', new THREE.Float32BufferAttribute(solidNorm, 3));
      solidGeo.setAttribute('uv', new THREE.Float32BufferAttribute(solidUv, 2));
      solidGeo.setAttribute('color', new THREE.Float32BufferAttribute(solidCol, 3));
      solidGeo.setIndex(solidIdx);
    }

    let transGeo = null;
    if (transPos.length > 0) {
      transGeo = new THREE.BufferGeometry();
      transGeo.setAttribute('position', new THREE.Float32BufferAttribute(transPos, 3));
      transGeo.setAttribute('normal', new THREE.Float32BufferAttribute(transNorm, 3));
      transGeo.setAttribute('uv', new THREE.Float32BufferAttribute(transUv, 2));
      transGeo.setAttribute('color', new THREE.Float32BufferAttribute(transCol, 3));
      transGeo.setIndex(transIdx);
    }

    return { solidGeo, transGeo };
  }

  // Calculate 4 vertex AO values (0 = fully occluded/dark, 3 = unoccluded/bright)
  static computeFaceAO(chunk, lx, y, lz, faceIndex) {
    const isS = (dx, dy, dz) => chunk.isSolid(lx + dx, y + dy, lz + dz);

    const calcAO = (side1, side2, corner) => {
      if (side1 && side2) return 0;
      return 3 - ((side1 ? 1 : 0) + (side2 ? 1 : 0) + (corner ? 1 : 0));
    };

    switch (faceIndex) {
      case 0: // TOP (+Y)
        return [
          calcAO(isS(-1, 1, 0), isS(0, 1, 1), isS(-1, 1, 1)), // corner 0 (-X, +Z)
          calcAO(isS(1, 1, 0), isS(0, 1, 1), isS(1, 1, 1)),   // corner 1 (+X, +Z)
          calcAO(isS(1, 1, 0), isS(0, 1, -1), isS(1, 1, -1)), // corner 2 (+X, -Z)
          calcAO(isS(-1, 1, 0), isS(0, 1, -1), isS(-1, 1, -1)), // corner 3 (-X, -Z)
        ];
      case 1: // BOTTOM (-Y)
        return [
          calcAO(isS(-1, -1, 0), isS(0, -1, -1), isS(-1, -1, -1)),
          calcAO(isS(1, -1, 0), isS(0, -1, -1), isS(1, -1, -1)),
          calcAO(isS(1, -1, 0), isS(0, -1, 1), isS(1, -1, 1)),
          calcAO(isS(-1, -1, 0), isS(0, -1, 1), isS(-1, -1, 1)),
        ];
      case 2: // EAST (+X)
        return [
          calcAO(isS(1, -1, 0), isS(1, 0, 1), isS(1, -1, 1)),
          calcAO(isS(1, -1, 0), isS(1, 0, -1), isS(1, -1, -1)),
          calcAO(isS(1, 1, 0), isS(1, 0, -1), isS(1, 1, -1)),
          calcAO(isS(1, 1, 0), isS(1, 0, 1), isS(1, 1, 1)),
        ];
      case 3: // WEST (-X)
        return [
          calcAO(isS(-1, -1, 0), isS(-1, 0, -1), isS(-1, -1, -1)),
          calcAO(isS(-1, -1, 0), isS(-1, 0, 1), isS(-1, -1, 1)),
          calcAO(isS(-1, 1, 0), isS(-1, 0, 1), isS(-1, 1, 1)),
          calcAO(isS(-1, 1, 0), isS(-1, 0, -1), isS(-1, 1, -1)),
        ];
      case 4: // SOUTH (+Z)
        return [
          calcAO(isS(-1, 0, 1), isS(0, -1, 1), isS(-1, -1, 1)),
          calcAO(isS(1, 0, 1), isS(0, -1, 1), isS(1, -1, 1)),
          calcAO(isS(1, 0, 1), isS(0, 1, 1), isS(1, 1, 1)),
          calcAO(isS(-1, 0, 1), isS(0, 1, 1), isS(-1, 1, 1)),
        ];
      case 5: // NORTH (-Z)
        return [
          calcAO(isS(1, 0, -1), isS(0, -1, -1), isS(1, -1, -1)),
          calcAO(isS(-1, 0, -1), isS(0, -1, -1), isS(-1, -1, -1)),
          calcAO(isS(-1, 0, -1), isS(0, 1, -1), isS(-1, 1, -1)),
          calcAO(isS(1, 0, -1), isS(0, 1, -1), isS(1, 1, -1)),
        ];
      default:
        return [3, 3, 3, 3];
    }
  }
}
