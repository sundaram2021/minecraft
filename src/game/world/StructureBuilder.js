import { BLOCKS } from './Blocks.js';

/**
 * StructureBuilder - Generates detailed, aesthetically stunning Minecraft structures
 * Returns an array of block descriptors: { x, y, z, blockId, sound }
 * sorted by Y ascending (so building animations rise gracefully from foundation to roof).
 */
export class StructureBuilder {
  /**
   * Generates a cozy furnished Minecraft wooden cottage with glass windows,
   * brick A-frame roof, chimney, interior amenities, and front flower garden.
   */
  static getCottageBlocks(ox, oy, oz) {
    const blocks = [];
    const width = 7;
    const depth = 7;
    const halfW = Math.floor(width / 2); // 3
    const halfD = Math.floor(depth / 2); // 3

    // 0. Clear bounding volume above foundation
    for (let y = 1; y <= 11; y++) {
      for (let dx = -halfW - 2; dx <= halfW + 2; dx++) {
        for (let dz = -halfD - 2; dz <= halfD + 2; dz++) {
          blocks.push({ x: ox + dx, y: oy + y, z: oz + dz, blockId: BLOCKS.AIR, sound: 'wood' });
        }
      }
    }

    // 0b. Solid under-foundation so building never hangs off cliffs
    for (let dy = -1; dy >= -3; dy--) {
      for (let dx = -halfW - 1; dx <= halfW + 1; dx++) {
        for (let dz = -halfD - 1; dz <= halfD + 1; dz++) {
          blocks.push({ x: ox + dx, y: oy + dy, z: oz + dz, blockId: BLOCKS.COBBLESTONE, sound: 'stone' });
        }
      }
    }

    // 1. Foundation & Floor (y = 0)
    for (let dx = -halfW - 1; dx <= halfW + 1; dx++) {
      for (let dz = -halfD - 1; dz <= halfD + 1; dz++) {
        const isBorder = Math.abs(dx) === halfW + 1 || Math.abs(dz) === halfD + 1;
        if (isBorder) {
          // Foundation border
          blocks.push({ x: ox + dx, y: oy, z: oz + dz, blockId: BLOCKS.COBBLESTONE, sound: 'stone' });
        } else {
          // Wooden floor
          blocks.push({ x: ox + dx, y: oy, z: oz + dz, blockId: BLOCKS.OAK_PLANKS, sound: 'wood' });
        }
      }
    }

    // 2. Walls, Corner Logs & Windows (y = 1 to 4)
    for (let y = 1; y <= 4; y++) {
      for (let dx = -halfW; dx <= halfW; dx++) {
        for (let dz = -halfD; dz <= halfD; dz++) {
          const isWallX = Math.abs(dx) === halfW;
          const isWallZ = Math.abs(dz) === halfD;

          if (isWallX || isWallZ) {
            // Corner posts: solid vertical Oak Logs
            if (isWallX && isWallZ) {
              blocks.push({ x: ox + dx, y: oy + y, z: oz + dz, blockId: BLOCKS.OAK_LOG, sound: 'wood' });
              continue;
            }

            // Front door opening (z = halfD, dx = 0, y = 1 or 2)
            if (dz === halfD && dx === 0 && (y === 1 || y === 2)) {
              blocks.push({ x: ox + dx, y: oy + y, z: oz + dz, blockId: BLOCKS.AIR, sound: 'wood' });
              continue;
            }

            // Windows (Glass) on walls at eye level (y = 2, 3)
            const isWindowPos =
              (y === 2 || y === 3) &&
              ((isWallZ && (Math.abs(dx) === 1)) || (isWallX && Math.abs(dz) === 1));

            if (isWindowPos && !(dz === halfD)) {
              blocks.push({ x: ox + dx, y: oy + y, z: oz + dz, blockId: BLOCKS.GLASS, sound: 'stone' });
            } else if (y === 4) {
              // Top trim beam
              blocks.push({ x: ox + dx, y: oy + y, z: oz + dz, blockId: BLOCKS.OAK_LOG, sound: 'wood' });
            } else {
              // Standard wall
              blocks.push({ x: ox + dx, y: oy + y, z: oz + dz, blockId: BLOCKS.OAK_PLANKS, sound: 'wood' });
            }
          } else {
            // Clear interior air
            blocks.push({ x: ox + dx, y: oy + y, z: oz + dz, blockId: BLOCKS.AIR, sound: 'wood' });
          }
        }
      }
    }

    // 3. Interior Furnishings
    // Crafting table and furnace in back left
    blocks.push({ x: ox - halfW + 1, y: oy + 1, z: oz - halfD + 1, blockId: BLOCKS.CRAFTING_TABLE, sound: 'wood' });
    blocks.push({ x: ox - halfW + 2, y: oy + 1, z: oz - halfD + 1, blockId: BLOCKS.FURNACE, sound: 'stone' });
    // Chest in back right
    blocks.push({ x: ox + halfW - 1, y: oy + 1, z: oz - halfD + 1, blockId: BLOCKS.CHEST, sound: 'wood' });
    // Bookshelves on side wall
    blocks.push({ x: ox + halfW - 1, y: oy + 1, z: oz, blockId: BLOCKS.BOOKSHELF, sound: 'wood' });
    blocks.push({ x: ox + halfW - 1, y: oy + 2, z: oz, blockId: BLOCKS.BOOKSHELF, sound: 'wood' });
    // Cozy Bed (White pillow + Red blanket)
    blocks.push({ x: ox - halfW + 1, y: oy + 1, z: oz + 1, blockId: BLOCKS.RED_WOOL, sound: 'cloth' });
    blocks.push({ x: ox - halfW + 1, y: oy + 1, z: oz, blockId: BLOCKS.WHITE_WOOL, sound: 'cloth' });

    // Interior & Porch Torches
    blocks.push({ x: ox, y: oy + 3, z: oz - halfD + 1, blockId: BLOCKS.TORCH, sound: 'wood' });
    blocks.push({ x: ox - 1, y: oy + 3, z: oz + halfD, blockId: BLOCKS.TORCH, sound: 'wood' });
    blocks.push({ x: ox + 1, y: oy + 3, z: oz + halfD, blockId: BLOCKS.TORCH, sound: 'wood' });

    // 4. Sloped Pitch Roof (y = 5 to 7)
    // Layer 1: Overhang around the perimeter
    for (let dx = -halfW - 1; dx <= halfW + 1; dx++) {
      for (let dz = -halfD - 1; dz <= halfD + 1; dz++) {
        blocks.push({ x: ox + dx, y: oy + 5, z: oz + dz, blockId: BLOCKS.BRICKS, sound: 'stone' });
      }
    }
    // Layer 2: Inset ring
    for (let dx = -halfW; dx <= halfW; dx++) {
      for (let dz = -halfD; dz <= halfD; dz++) {
        blocks.push({ x: ox + dx, y: oy + 6, z: oz + dz, blockId: BLOCKS.SPRUCE_PLANKS, sound: 'wood' });
      }
    }
    // Layer 3: Central Ridge
    for (let dx = -halfW + 1; dx <= halfW - 1; dx++) {
      for (let dz = -halfD + 1; dz <= halfD - 1; dz++) {
        blocks.push({ x: ox + dx, y: oy + 7, z: oz + dz, blockId: BLOCKS.BRICKS, sound: 'stone' });
      }
    }

    // 5. Chimney (Cobblestone rising up through roof)
    for (let y = 1; y <= 9; y++) {
      blocks.push({ x: ox - halfW + 2, y: oy + y, z: oz - halfD + 1, blockId: BLOCKS.COBBLESTONE, sound: 'stone' });
    }
    // Chimney cap
    blocks.push({ x: ox - halfW + 2, y: oy + 10, z: oz - halfD + 1, blockId: BLOCKS.COBBLESTONE_SLAB || BLOCKS.COBBLESTONE, sound: 'stone' });

    // 6. Front Porch & Garden
    // Cobblestone pathway
    blocks.push({ x: ox, y: oy, z: oz + halfD + 1, blockId: BLOCKS.COBBLESTONE, sound: 'stone' });
    blocks.push({ x: ox, y: oy, z: oz + halfD + 2, blockId: BLOCKS.COBBLESTONE, sound: 'stone' });
    // Fence posts with lanterns/torches
    blocks.push({ x: ox - 2, y: oy + 1, z: oz + halfD + 1, blockId: BLOCKS.OAK_FENCE, sound: 'wood' });
    blocks.push({ x: ox - 2, y: oy + 2, z: oz + halfD + 1, blockId: BLOCKS.TORCH, sound: 'wood' });
    blocks.push({ x: ox + 2, y: oy + 1, z: oz + halfD + 1, blockId: BLOCKS.OAK_FENCE, sound: 'wood' });
    blocks.push({ x: ox + 2, y: oy + 2, z: oz + halfD + 1, blockId: BLOCKS.TORCH, sound: 'wood' });
    // Flowers beside path
    blocks.push({ x: ox - 1, y: oy + 1, z: oz + halfD + 2, blockId: BLOCKS.POPPY, sound: 'grass' });
    blocks.push({ x: ox + 1, y: oy + 1, z: oz + halfD + 2, blockId: BLOCKS.DANDELION, sound: 'grass' });

    return blocks.sort((a, b) => a.y - b.y);
  }

  /**
   * Generates a medieval Stone Brick Watchtower with battlements,
   * observation deck, arrow slits, corner torches, and a glowing beacon.
   */
  static getWatchtowerBlocks(ox, oy, oz) {
    const blocks = [];
    const radius = 3; // 7x7 footprint
    const height = 13;

    // Foundation & Floor
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        blocks.push({ x: ox + dx, y: oy, z: oz + dz, blockId: BLOCKS.STONE_BRICKS, sound: 'stone' });
      }
    }

    // Shaft (y = 1 to height - 2)
    for (let y = 1; y <= height - 2; y++) {
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dz = -radius; dz <= radius; dz++) {
          const isOuter = Math.abs(dx) === radius || Math.abs(dz) === radius;
          if (isOuter) {
            // Front Entrance
            if (dz === radius && dx === 0 && (y === 1 || y === 2)) {
              blocks.push({ x: ox + dx, y: oy + y, z: oz + dz, blockId: BLOCKS.AIR, sound: 'stone' });
              continue;
            }

            // Arrow slits (iron bars or glass) at heights 4 and 8
            const isSlit = (y === 4 || y === 8) && (dx === 0 || dz === 0);
            if (isSlit) {
              blocks.push({ x: ox + dx, y: oy + y, z: oz + dz, blockId: BLOCKS.IRON_BARS || BLOCKS.GLASS, sound: 'stone' });
            } else {
              // Mix Stone Bricks and Mossy Cobblestone for realistic ancient castle texturing
              const isMossy = ((dx * 7 + dz * 13 + y * 5) % 6 === 0);
              const blk = isMossy ? BLOCKS.MOSSY_COBBLESTONE : BLOCKS.STONE_BRICKS;
              blocks.push({ x: ox + dx, y: oy + y, z: oz + dz, blockId: blk, sound: 'stone' });
            }
          } else {
            // Hollow inside, with wooden platform halfway up
            if (y === 6) {
              blocks.push({ x: ox + dx, y: oy + y, z: oz + dz, blockId: BLOCKS.OAK_PLANKS, sound: 'wood' });
            } else {
              blocks.push({ x: ox + dx, y: oy + y, z: oz + dz, blockId: BLOCKS.AIR, sound: 'stone' });
            }
          }
        }
      }
    }

    // Overhanging Battlements Floor (y = height - 1) - Extended 9x9
    const deckR = radius + 1;
    for (let dx = -deckR; dx <= deckR; dx++) {
      for (let dz = -deckR; dz <= deckR; dz++) {
        blocks.push({ x: ox + dx, y: oy + height - 1, z: oz + dz, blockId: BLOCKS.STONE_BRICKS, sound: 'stone' });
      }
    }

    // Parapet / Crenellations (y = height)
    for (let dx = -deckR; dx <= deckR; dx++) {
      for (let dz = -deckR; dz <= deckR; dz++) {
        const isBorder = Math.abs(dx) === deckR || Math.abs(dz) === deckR;
        if (isBorder) {
          // Alternating battlements (teeth)
          const isTooth = (dx + dz) % 2 === 0 || Math.abs(dx) === deckR && Math.abs(dz) === deckR;
          if (isTooth) {
            blocks.push({ x: ox + dx, y: oy + height, z: oz + dz, blockId: BLOCKS.STONE_BRICKS, sound: 'stone' });
          }
        }
      }
    }

    // Corner Torches on parapets (y = height + 1)
    blocks.push({ x: ox - deckR, y: oy + height + 1, z: oz - deckR, blockId: BLOCKS.TORCH, sound: 'wood' });
    blocks.push({ x: ox + deckR, y: oy + height + 1, z: oz - deckR, blockId: BLOCKS.TORCH, sound: 'wood' });
    blocks.push({ x: ox - deckR, y: oy + height + 1, z: oz + deckR, blockId: BLOCKS.TORCH, sound: 'wood' });
    blocks.push({ x: ox + deckR, y: oy + height + 1, z: oz + deckR, blockId: BLOCKS.TORCH, sound: 'wood' });

    // Center Golden Beacon & Chest on observation deck
    blocks.push({ x: ox, y: oy + height, z: oz, blockId: BLOCKS.GLOWSTONE, sound: 'stone' });
    blocks.push({ x: ox, y: oy + height + 1, z: oz, blockId: BLOCKS.GLASS, sound: 'stone' });
    blocks.push({ x: ox + 1, y: oy + height, z: oz, blockId: BLOCKS.CHEST, sound: 'wood' });

    return blocks.sort((a, b) => a.y - b.y);
  }

  /**
   * Generates an Ancient Desert Pyramid with Gold & Lapis shrine.
   */
  static getPyramidBlocks(ox, oy, oz) {
    const blocks = [];
    const maxR = 5; // 11x11 base

    for (let step = 0; step <= maxR; step++) {
      const r = maxR - step;
      const y = oy + step;
      for (let dx = -r; dx <= r; dx++) {
        for (let dz = -r; dz <= r; dz++) {
          const isBorder = Math.abs(dx) === r || Math.abs(dz) === r;
          if (step === maxR) {
            // Capstone: Gold block!
            blocks.push({ x: ox, y, z: oz, blockId: BLOCKS.GOLD_BLOCK, sound: 'stone' });
          } else if (isBorder) {
            const blk = (step === 1 || step === 3) ? BLOCKS.SMOOTH_SANDSTONE : BLOCKS.SANDSTONE;
            blocks.push({ x: ox + dx, y, z: oz + dz, blockId: blk, sound: 'stone' });
          } else if (step === 0) {
            // Floor with decorative Lapis & Gold center
            const isCenter = Math.abs(dx) <= 1 && Math.abs(dz) <= 1;
            const blk = isCenter ? BLOCKS.LAPIS_BLOCK : BLOCKS.SANDSTONE;
            blocks.push({ x: ox + dx, y, z: oz + dz, blockId: blk, sound: 'stone' });
          } else {
            // Hollow inside for inner tomb
            if (step === 1 && dx === 0 && dz === 0) {
              blocks.push({ x: ox, y, z: oz, blockId: BLOCKS.DIAMOND_BLOCK, sound: 'stone' });
            } else if (step === 2 && dx === 0 && dz === 0) {
              blocks.push({ x: ox, y, z: oz, blockId: BLOCKS.CHEST, sound: 'wood' });
            } else {
              blocks.push({ x: ox + dx, y, z: oz + dz, blockId: BLOCKS.AIR, sound: 'stone' });
            }
          }
        }
      }
    }

    // Entrance opening on south side
    blocks.push({ x: ox, y: oy + 1, z: oz + maxR, blockId: BLOCKS.AIR, sound: 'stone' });
    blocks.push({ x: ox, y: oy + 2, z: oz + maxR, blockId: BLOCKS.AIR, sound: 'stone' });
    blocks.push({ x: ox, y: oy + 1, z: oz + maxR - 1, blockId: BLOCKS.AIR, sound: 'stone' });
    blocks.push({ x: ox, y: oy + 2, z: oz + maxR - 1, blockId: BLOCKS.AIR, sound: 'stone' });

    return blocks.sort((a, b) => a.y - b.y);
  }
}
