import * as THREE from 'three';

// Procedural 16x16 Pixel-Art Texture Generator & Atlas Packer
export class TextureAtlas {
  constructor() {
    this.tileSize = 16;
    this.textures = {};
    this.uvMap = {};
    this.canvas = null;
    this.texture = null;
    this.cols = 0;
    this.rows = 0;

    this.init();
  }

  // Seeded random helper for procedural textures
  createRng(seed = 42) {
    let s = seed;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  // Helper to draw a 16x16 canvas texture
  createTileCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = this.tileSize;
    canvas.height = this.tileSize;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingEnabled = false;
    return { canvas, ctx };
  }

  // Color helper
  rgbToHex(r, g, b, a = 1) {
    const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
    return `rgba(${clamp(r)},${clamp(g)},${clamp(b)},${a})`;
  }

  // Generate all individual 16x16 block face textures
  generateTextures() {
    const list = {};

    // 1. Dirt
    list['dirt'] = this.drawDirt(101);

    // 2. Grass Top
    list['grass_top'] = this.drawGrassTop(202);

    // 3. Grass Side (Dirt with green fringe)
    list['grass_side'] = this.drawGrassSide(list['dirt'], 303);

    // 4. Grass Snow Side
    list['grass_snow_side'] = this.drawGrassSnowSide(list['dirt'], 404);

    // 5. Stone
    list['stone'] = this.drawStone(505);

    // 6. Cobblestone
    list['cobblestone'] = this.drawCobblestone(606);

    // 7. Stone Bricks
    list['stone_bricks'] = this.drawStoneBricks(707);

    // 8. Mossy Cobblestone
    list['mossy_cobblestone'] = this.drawMossyCobble(list['cobblestone'], 808);

    // 9. Sand
    list['sand'] = this.drawSand(909);

    // 10. Sandstone Top
    list['sandstone_top'] = this.drawSandstoneTop(1001);

    // 11. Sandstone Bottom
    list['sandstone_bottom'] = this.drawSandstoneBottom(1002);

    // 12. Sandstone Side
    list['sandstone_side'] = this.drawSandstoneSide(1003);

    // 13. Gravel
    list['gravel'] = this.drawGravel(1104);

    // 14. Clay
    list['clay'] = this.drawClay(1205);

    // 15. Oak Log Side
    list['oak_log_side'] = this.drawOakLogSide(1306);

    // 16. Oak Log Top
    list['oak_log_top'] = this.drawOakLogTop(1307);

    // 17. Oak Planks
    list['oak_planks'] = this.drawPlanks(1408, [184, 148, 93], [150, 115, 65]);

    // 18. Oak Leaves
    list['oak_leaves'] = this.drawLeaves(1509, [58, 128, 38], [35, 82, 22]);

    // 19. Birch Log Side
    list['birch_log_side'] = this.drawBirchLogSide(1610);

    // 20. Birch Log Top
    list['birch_log_top'] = this.drawBirchLogTop(1611);

    // 21. Birch Planks
    list['birch_planks'] = this.drawPlanks(1712, [215, 196, 150], [180, 160, 115]);

    // 22. Birch Leaves
    list['birch_leaves'] = this.drawLeaves(1813, [92, 158, 62], [55, 110, 35]);

    // 23. Spruce Log Side
    list['spruce_log_side'] = this.drawSpruceLogSide(1914);

    // 24. Spruce Log Top
    list['spruce_log_top'] = this.drawSpruceLogTop(1915);

    // 25. Spruce Planks
    list['spruce_planks'] = this.drawPlanks(2016, [110, 78, 48], [80, 52, 28]);

    // 26. Spruce Leaves
    list['spruce_leaves'] = this.drawLeaves(2117, [45, 95, 48], [25, 60, 30]);

    // 27. Ores
    list['coal_ore'] = this.drawOre(list['stone'], [30, 30, 30], [10, 10, 10], 2218);
    list['iron_ore'] = this.drawOre(list['stone'], [216, 175, 147], [168, 125, 95], 2319);
    list['gold_ore'] = this.drawOre(list['stone'], [255, 235, 75], [210, 170, 30], 2420);
    list['diamond_ore'] = this.drawOre(list['stone'], [92, 240, 240], [45, 180, 190], 2521);
    list['redstone_ore'] = this.drawOre(list['stone'], [255, 35, 25], [180, 10, 10], 2622);
    list['emerald_ore'] = this.drawOre(list['stone'], [35, 235, 90], [15, 160, 50], 2723);

    // 28. Glass
    list['glass'] = this.drawGlass(2824);

    // 29. Bedrock
    list['bedrock'] = this.drawBedrock(2925);

    // 30. Water
    list['water'] = this.drawWater(3026);

    // 31. Lava
    list['lava'] = this.drawLava(3127);

    // 32. Snow
    list['snow'] = this.drawSnow(3228);

    // 33. Ice
    list['ice'] = this.drawIce(3329);

    // 34. Cactus Side, Top, Bottom
    list['cactus_side'] = this.drawCactusSide(3430);
    list['cactus_top'] = this.drawCactusTop(3431);
    list['cactus_bottom'] = this.drawCactusBottom(3432);

    // 35. Crafting Table (Top, Front, Side)
    list['crafting_table_top'] = this.drawCraftingTableTop(3533);
    list['crafting_table_front'] = this.drawCraftingTableSide(3534, true);
    list['crafting_table_side'] = this.drawCraftingTableSide(3535, false);

    // 36. Furnace (Front, Side, Top)
    list['furnace_front'] = this.drawFurnaceFront(3636);
    list['furnace_side'] = this.drawStone(3637);
    list['furnace_top'] = this.drawStoneBricks(3638);

    // 37. Chest (Top, Front, Side)
    list['chest_top'] = this.drawChestTop(3739);
    list['chest_front'] = this.drawChestFront(3740);
    list['chest_side'] = this.drawChestSide(3741);

    // 38. Torch
    list['torch'] = this.drawTorch(3842);

    // 39. Bricks
    list['bricks'] = this.drawBricks(3943);

    // 40. Bookshelf Side
    list['bookshelf_side'] = this.drawBookshelfSide(list['oak_planks'], 4044);

    // 41. Obsidian
    list['obsidian'] = this.drawObsidian(4145);

    // 42. Netherrack
    list['netherrack'] = this.drawNetherrack(4246);

    // 43. Glowstone
    list['glowstone'] = this.drawGlowstone(4347);

    // 44. Plants (Poppy, Dandelion, Tall Grass, Mushrooms)
    list['poppy'] = this.drawPoppy(4448);
    list['dandelion'] = this.drawDandelion(4549);
    list['tall_grass'] = this.drawTallGrass(4650);
    list['red_mushroom'] = this.drawMushroom(4751, true);
    list['brown_mushroom'] = this.drawMushroom(4852, false);

    // 45. New Ores & Metal Blocks
    list['iron_block'] = this.drawMetalBlock(4953, [210, 210, 215], [170, 170, 175]);
    list['gold_block'] = this.drawMetalBlock(5054, [250, 230, 60], [200, 170, 20]);
    list['diamond_block'] = this.drawMetalBlock(5155, [80, 220, 220], [45, 170, 180]);
    list['emerald_block'] = this.drawMetalBlock(5256, [40, 220, 90], [20, 160, 60]);
    list['redstone_block'] = this.drawMetalBlock(5357, [220, 20, 20], [160, 10, 10]);
    list['lapis_ore'] = this.drawOre(list['stone'], [40, 90, 220], [20, 50, 170], 5458);
    list['lapis_block'] = this.drawMetalBlock(5559, [35, 80, 200], [20, 50, 140]);
    list['coal_block'] = this.drawMetalBlock(5660, [30, 30, 30], [15, 15, 15]);
    list['copper_ore'] = this.drawOre(list['stone'], [210, 120, 70], [170, 85, 45], 5761);
    list['copper_block'] = this.drawMetalBlock(5862, [200, 110, 60], [165, 80, 40]);

    // 46. Wool family (16 colors)
    const woolColors = {
      'white_wool': [235, 235, 235],
      'orange_wool': [230, 130, 30],
      'magenta_wool': [190, 60, 160],
      'light_blue_wool': [110, 170, 230],
      'yellow_wool': [235, 220, 30],
      'lime_wool': [110, 210, 30],
      'pink_wool': [235, 140, 170],
      'gray_wool': [90, 90, 90],
      'light_gray_wool': [170, 170, 170],
      'cyan_wool': [30, 150, 160],
      'purple_wool': [130, 40, 180],
      'blue_wool': [40, 60, 180],
      'brown_wool': [110, 70, 30],
      'green_wool': [60, 120, 40],
      'red_wool': [180, 30, 30],
      'black_wool': [20, 20, 20],
    };
    let wseed = 5900;
    for (const [k, col] of Object.entries(woolColors)) {
      list[k] = this.drawWool(wseed++, col);
    }

    // 47. Terracotta family
    list['terracotta'] = this.drawTerracotta(6200, [170, 90, 60]);
    list['white_terracotta'] = this.drawTerracotta(6201, [210, 210, 205]);
    list['orange_terracotta'] = this.drawTerracotta(6202, [190, 110, 50]);
    list['red_terracotta'] = this.drawTerracotta(6203, [150, 50, 35]);
    list['blue_terracotta'] = this.drawTerracotta(6204, [70, 70, 130]);

    // 48. Granite / Diorite / Andesite
    list['granite'] = this.drawGranite(6300);
    list['diorite'] = this.drawDiorite(6301);
    list['andesite'] = this.drawAndesite(6302);
    list['polished_granite'] = this.drawPolishedStone(6303, [165, 85, 65]);
    list['polished_diorite'] = this.drawPolishedStone(6304, [200, 200, 205]);
    list['polished_andesite'] = this.drawPolishedStone(6305, [155, 155, 160]);
    list['smooth_stone'] = this.drawSmoothStone(6306);

    // 49. Farm & Crops
    list['farmland_top'] = this.drawFarmlandTop(6400);
    list['farmland_side'] = this.drawFarmlandSide(6401);
    list['wheat_stage_7'] = this.drawWheat(6402);
    list['hay_top'] = this.drawHayTop(6403);
    list['hay_side'] = this.drawHaySide(6404);

    // 50. Pumpkin / Melon / TNT / Sponge
    list['pumpkin_top'] = this.drawPumpkinTop(6500);
    list['pumpkin_side'] = this.drawPumpkinSide(6501);
    list['pumpkin_front'] = this.drawPumpkinFront(6502);
    list['melon_top'] = this.drawMelonTop(6503);
    list['melon_side'] = this.drawMelonSide(6504);
    list['tnt_top'] = this.drawTNTTop(6505);
    list['tnt_bottom'] = this.drawTNTBottom(6506);
    list['tnt_side'] = this.drawTNTSide(6507);
    list['sponge'] = this.drawSponge(6508);

    // 51. Jungle / Acacia / Dark Oak
    list['jungle_log_side'] = this.drawJungleLogSide(6600);
    list['jungle_log_top'] = this.drawJungleLogTop(6601);
    list['jungle_leaves'] = this.drawLeaves(6602, [55, 140, 45], [30, 95, 25]);
    list['jungle_planks'] = this.drawPlanks(6603, [175, 135, 85], [140, 105, 60]);
    list['acacia_log_side'] = this.drawAcaciaLogSide(6604);
    list['acacia_log_top'] = this.drawAcaciaLogTop(6605);
    list['acacia_leaves'] = this.drawLeaves(6606, [82, 145, 45], [45, 90, 30]);
    list['acacia_planks'] = this.drawPlanks(6607, [190, 110, 60], [155, 80, 35]);
    list['dark_oak_log_side'] = this.drawDarkOakLogSide(6608);
    list['dark_oak_log_top'] = this.drawDarkOakLogTop(6609);
    list['dark_oak_leaves'] = this.drawLeaves(6610, [38, 95, 28], [20, 60, 18]);
    list['dark_oak_planks'] = this.drawPlanks(6611, [65, 42, 20], [45, 28, 12]);
    list['mushroom_stem'] = this.drawMushroomStem(6612);
    list['red_mushroom_block'] = this.drawMushroomBlock(6613, true);
    list['brown_mushroom_block'] = this.drawMushroomBlock(6614, false);

    // 52. Quartz / Basalt / Blackstone / Deepslate
    list['quartz_top'] = this.drawQuartzTop(6700);
    list['quartz_bottom'] = this.drawQuartzBottom(6701);
    list['quartz_side'] = this.drawQuartzSide(6702);
    list['soul_sand'] = this.drawSoulSand(6703);
    list['soul_soil'] = this.drawSoulSoil(6704);
    list['basalt_top'] = this.drawBasaltTop(6705);
    list['basalt_side'] = this.drawBasaltSide(6706);
    list['blackstone'] = this.drawBlackstone(6707);
    list['deepslate_top'] = this.drawDeepslateTop(6708);
    list['deepslate_side'] = this.drawDeepslateSide(6709);
    list['smooth_sandstone'] = this.drawSmoothSandstone(6710);
    list['chiseled_sandstone_top'] = this.drawChiseledSandstoneTop(6711);
    list['chiseled_sandstone_side'] = this.drawChiseledSandstoneSide(6712);
    list['sea_lantern'] = this.drawSeaLantern(6713);
    list['prismarine'] = this.drawPrismarine(6714);
    list['iron_bars'] = this.drawIronBars(6715);

    // 53. Destroy Stages 0-9 for cracking block overlay
    for (let i = 0; i < 10; i++) {
      list[`destroy_stage_${i}`] = this.drawDestroyStage(i);
    }

    return list;
  }

  // --- INDIVIDUAL PROCEDURAL PIXEL-ART DRAWING FUNCTIONS ---

  drawDirt(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    const rng = this.createRng(seed);
    const baseR = 134, baseG = 96, baseB = 67;

    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const noise = (rng() - 0.5) * 40;
        const pebble = rng() < 0.08 ? -35 : (rng() < 0.05 ? 30 : 0);
        const r = baseR + noise + pebble;
        const g = baseG + noise * 0.8 + pebble * 0.8;
        const b = baseB + noise * 0.6 + pebble * 0.6;
        ctx.fillStyle = this.rgbToHex(r, g, b);
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return canvas;
  }

  drawGrassTop(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    const rng = this.createRng(seed);
    const baseR = 100, baseG = 168, baseB = 46;

    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const noise = (rng() - 0.5) * 36;
        const blade = rng() < 0.15 ? 25 : (rng() < 0.1 ? -30 : 0);
        const r = baseR + noise * 0.7 + blade * 0.6;
        const g = baseG + noise + blade;
        const b = baseB + noise * 0.5 + blade * 0.3;
        ctx.fillStyle = this.rgbToHex(r, g, b);
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return canvas;
  }

  drawGrassSide(dirtCanvas, seed) {
    const { canvas, ctx } = this.createTileCanvas();
    ctx.drawImage(dirtCanvas, 0, 0);
    const rng = this.createRng(seed);

    // Drape grass blades down from top edge (depth 2 to 5 pixels)
    const baseR = 100, baseG = 168, baseB = 46;
    for (let x = 0; x < 16; x++) {
      const dropDepth = 2 + Math.floor(rng() * 3.5);
      for (let y = 0; y < dropDepth; y++) {
        const shade = (rng() - 0.5) * 25 - (y * 6);
        ctx.fillStyle = this.rgbToHex(baseR + shade, baseG + shade, baseB + shade * 0.5);
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return canvas;
  }

  drawGrassSnowSide(dirtCanvas, seed) {
    const { canvas, ctx } = this.createTileCanvas();
    ctx.drawImage(dirtCanvas, 0, 0);
    const rng = this.createRng(seed);

    for (let x = 0; x < 16; x++) {
      const dropDepth = 3 + Math.floor(rng() * 2.5);
      for (let y = 0; y < dropDepth; y++) {
        const shade = 240 + (rng() - 0.5) * 20;
        ctx.fillStyle = this.rgbToHex(shade, shade, shade + 10);
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return canvas;
  }

  drawStone(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    const rng = this.createRng(seed);
    const base = 125;

    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const noise = (rng() - 0.5) * 32;
        const speck = rng() < 0.1 ? 25 : (rng() < 0.1 ? -25 : 0);
        const v = base + noise + speck;
        ctx.fillStyle = this.rgbToHex(v, v, v + 2);
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return canvas;
  }

  drawCobblestone(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    const rng = this.createRng(seed);

    // Stone cobble pavers
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const isCrack = (x % 4 === 0 && (y % 4 !== 0 || rng() < 0.3)) ||
                        (y % 4 === 0 && (x % 4 !== 0 || rng() < 0.3)) ||
                        ((x + y) % 6 === 0 && rng() < 0.35);
        if (isCrack) {
          ctx.fillStyle = this.rgbToHex(55 + rng() * 20, 55 + rng() * 20, 60);
        } else {
          const v = 115 + (rng() - 0.5) * 45;
          ctx.fillStyle = this.rgbToHex(v, v, v);
        }
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return canvas;
  }

  drawStoneBricks(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    const rng = this.createRng(seed);

    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const isHBorder = (y === 0 || y === 4 || y === 8 || y === 12);
        const isVBorder = (y < 4 && (x === 0 || x === 8)) ||
                          (y >= 4 && y < 8 && (x === 4 || x === 12)) ||
                          (y >= 8 && y < 12 && (x === 0 || x === 8)) ||
                          (y >= 12 && (x === 4 || x === 12));

        if (isHBorder || isVBorder) {
          ctx.fillStyle = this.rgbToHex(60 + rng() * 15, 60 + rng() * 15, 65);
        } else {
          const v = 130 + (rng() - 0.5) * 25;
          ctx.fillStyle = this.rgbToHex(v, v, v);
        }
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return canvas;
  }

  drawMossyCobble(cobbleCanvas, seed) {
    const { canvas, ctx } = this.createTileCanvas();
    ctx.drawImage(cobbleCanvas, 0, 0);
    const rng = this.createRng(seed);

    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        if (rng() < 0.3) {
          const g = 140 + rng() * 50;
          const r = 50 + rng() * 30;
          const b = 30 + rng() * 20;
          ctx.fillStyle = this.rgbToHex(r, g, b, 0.85);
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    return canvas;
  }

  drawSand(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    const rng = this.createRng(seed);
    const baseR = 219, baseG = 206, baseB = 156;

    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const noise = (rng() - 0.5) * 28;
        const grain = rng() < 0.08 ? 18 : (rng() < 0.08 ? -18 : 0);
        ctx.fillStyle = this.rgbToHex(baseR + noise + grain, baseG + noise * 0.9 + grain, baseB + noise * 0.7 + grain);
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return canvas;
  }

  drawSandstoneTop(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    const rng = this.createRng(seed);
    const baseR = 215, baseG = 200, baseB = 145;

    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const isBorder = x === 0 || x === 15 || y === 0 || y === 15 || x === 2 || x === 13 || y === 2 || y === 13;
        const shade = isBorder ? -25 : (rng() - 0.5) * 20;
        ctx.fillStyle = this.rgbToHex(baseR + shade, baseG + shade, baseB + shade);
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return canvas;
  }

  drawSandstoneBottom(seed) {
    return this.drawSand(seed);
  }

  drawSandstoneSide(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    const rng = this.createRng(seed);
    const baseR = 215, baseG = 200, baseB = 145;

    for (let y = 0; y < 16; y++) {
      const layerOffset = (y % 4 === 0) ? -35 : (y < 4 ? 15 : (y > 11 ? -15 : 0));
      for (let x = 0; x < 16; x++) {
        const noise = (rng() - 0.5) * 16;
        ctx.fillStyle = this.rgbToHex(baseR + layerOffset + noise, baseG + layerOffset + noise, baseB + layerOffset + noise);
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return canvas;
  }

  drawGravel(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    const rng = this.createRng(seed);

    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const v = 120 + (rng() - 0.5) * 50;
        const rTint = rng() < 0.2 ? 15 : 0;
        ctx.fillStyle = this.rgbToHex(v + rTint, v, v - 5);
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return canvas;
  }

  drawClay(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    const rng = this.createRng(seed);

    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const noise = (rng() - 0.5) * 18;
        ctx.fillStyle = this.rgbToHex(160 + noise, 166 + noise, 178 + noise);
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return canvas;
  }

  drawOakLogSide(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    const rng = this.createRng(seed);
    const baseR = 105, baseG = 78, baseB = 44;

    for (let x = 0; x < 16; x++) {
      const barkColShade = ((x % 3 === 0) ? -25 : ((x % 4 === 0) ? 20 : 0));
      for (let y = 0; y < 16; y++) {
        const striation = (rng() - 0.5) * 20 + (y % 5 === 0 ? -12 : 0);
        ctx.fillStyle = this.rgbToHex(baseR + barkColShade + striation, baseG + barkColShade + striation, baseB + barkColShade + striation);
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return canvas;
  }

  drawOakLogTop(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    const rng = this.createRng(seed);

    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const dx = x - 7.5;
        const dy = y - 7.5;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 6.8) {
          // Bark ring
          ctx.fillStyle = this.rgbToHex(105 + (rng() - 0.5) * 20, 78 + (rng() - 0.5) * 20, 44);
        } else {
          // Tree rings
          const ring = Math.sin(dist * 2.2) * 20;
          const vR = 175 + ring + (rng() - 0.5) * 15;
          const vG = 140 + ring + (rng() - 0.5) * 15;
          const vB = 90 + ring + (rng() - 0.5) * 15;
          ctx.fillStyle = this.rgbToHex(vR, vG, vB);
        }
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return canvas;
  }

  drawBirchLogSide(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    const rng = this.createRng(seed);

    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const isNotch = (y % 4 === 0 && x >= 2 && x <= 6 && rng() < 0.7) ||
                        (y % 6 === 0 && x >= 9 && x <= 13 && rng() < 0.7);
        if (isNotch) {
          ctx.fillStyle = this.rgbToHex(45, 45, 45);
        } else {
          const v = 225 + (rng() - 0.5) * 25;
          ctx.fillStyle = this.rgbToHex(v, v, v - 5);
        }
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return canvas;
  }

  drawBirchLogTop(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    const rng = this.createRng(seed);

    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const dx = x - 7.5;
        const dy = y - 7.5;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 6.8) {
          ctx.fillStyle = this.rgbToHex(220, 220, 215);
        } else {
          const ring = Math.sin(dist * 2.0) * 15;
          ctx.fillStyle = this.rgbToHex(205 + ring, 195 + ring, 160 + ring);
        }
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return canvas;
  }

  drawSpruceLogSide(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    const rng = this.createRng(seed);

    for (let x = 0; x < 16; x++) {
      const barkCol = (x % 3 === 0 ? -20 : 10);
      for (let y = 0; y < 16; y++) {
        const striation = (rng() - 0.5) * 18;
        ctx.fillStyle = this.rgbToHex(55 + barkCol + striation, 40 + barkCol + striation, 25 + barkCol + striation);
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return canvas;
  }

  drawSpruceLogTop(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    const rng = this.createRng(seed);

    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const dx = x - 7.5;
        const dy = y - 7.5;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 6.8) {
          ctx.fillStyle = this.rgbToHex(50, 36, 22);
        } else {
          const ring = Math.sin(dist * 2.2) * 18;
          ctx.fillStyle = this.rgbToHex(105 + ring, 75 + ring, 48 + ring);
        }
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return canvas;
  }

  drawPlanks(seed, baseLight, baseDark) {
    const { canvas, ctx } = this.createTileCanvas();
    const rng = this.createRng(seed);

    for (let y = 0; y < 16; y++) {
      const isPlankDivider = y % 4 === 0;
      for (let x = 0; x < 16; x++) {
        const isNail = (y % 4 === 1 && (x === 1 || x === 14) && rng() < 0.5);
        if (isPlankDivider) {
          ctx.fillStyle = this.rgbToHex(baseDark[0] - 30, baseDark[1] - 30, baseDark[2] - 30);
        } else if (isNail) {
          ctx.fillStyle = this.rgbToHex(baseDark[0] - 50, baseDark[1] - 50, baseDark[2] - 50);
        } else {
          const grain = (rng() - 0.5) * 20;
          ctx.fillStyle = this.rgbToHex(baseLight[0] + grain, baseLight[1] + grain, baseLight[2] + grain);
        }
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return canvas;
  }

  drawLeaves(seed, lightCol, darkCol) {
    const { canvas, ctx } = this.createTileCanvas();
    const rng = this.createRng(seed);

    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = rng();
        if (r < 0.25) {
          // Transparent cutout hole
          ctx.clearRect(x, y, 1, 1);
        } else if (r < 0.65) {
          const shade = (rng() - 0.5) * 20;
          ctx.fillStyle = this.rgbToHex(lightCol[0] + shade, lightCol[1] + shade, lightCol[2] + shade);
          ctx.fillRect(x, y, 1, 1);
        } else {
          const shade = (rng() - 0.5) * 20;
          ctx.fillStyle = this.rgbToHex(darkCol[0] + shade, darkCol[1] + shade, darkCol[2] + shade);
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    return canvas;
  }

  drawOre(stoneCanvas, gemColorLight, gemColorDark, seed) {
    const { canvas, ctx } = this.createTileCanvas();
    ctx.drawImage(stoneCanvas, 0, 0);
    const rng = this.createRng(seed);

    // Ore clusters
    const numClusters = 4 + Math.floor(rng() * 4);
    for (let c = 0; c < numClusters; c++) {
      const cx = Math.floor(1 + rng() * 13);
      const cy = Math.floor(1 + rng() * 13);
      const size = 1 + Math.floor(rng() * 3);

      for (let ox = 0; ox < size; ox++) {
        for (let oy = 0; oy < size; oy++) {
          const px = cx + ox;
          const py = cy + oy;
          if (px < 16 && py < 16) {
            const isHighlight = rng() < 0.35;
            const col = isHighlight ? gemColorLight : gemColorDark;
            ctx.fillStyle = this.rgbToHex(col[0], col[1], col[2]);
            ctx.fillRect(px, py, 1, 1);
          }
        }
      }
    }
    return canvas;
  }

  drawGlass(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    ctx.clearRect(0, 0, 16, 16);

    // Frame border
    ctx.fillStyle = 'rgba(230, 245, 255, 0.9)';
    ctx.fillRect(0, 0, 16, 1);
    ctx.fillRect(0, 15, 16, 1);
    ctx.fillRect(0, 0, 1, 16);
    ctx.fillRect(15, 0, 1, 16);

    // Specular diagonal streak
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    for (let i = 2; i <= 5; i++) {
      ctx.fillRect(i, i, 1, 1);
    }
    for (let i = 8; i <= 10; i++) {
      ctx.fillRect(i, i - 4, 1, 1);
    }

    // Translucent glass pane body
    ctx.fillStyle = 'rgba(200, 230, 255, 0.12)';
    ctx.fillRect(1, 1, 14, 14);

    return canvas;
  }

  drawBedrock(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    const rng = this.createRng(seed);

    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = rng();
        const v = r < 0.3 ? 15 : (r < 0.7 ? 50 : 90);
        ctx.fillStyle = this.rgbToHex(v, v, v);
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return canvas;
  }

  drawWater(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    const rng = this.createRng(seed);

    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const wave = Math.sin((x + y) * 0.8) * 20;
        const r = 35 + wave * 0.2;
        const g = 85 + wave * 0.5;
        const b = 210 + wave;
        ctx.fillStyle = this.rgbToHex(r, g, b, 0.75);
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return canvas;
  }

  drawLava(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    const rng = this.createRng(seed);

    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const heat = Math.sin((x * 0.6) + (y * 0.4)) * 30 + (rng() - 0.5) * 40;
        const r = 240 + heat * 0.3;
        const g = 100 + heat;
        const b = 20;
        ctx.fillStyle = this.rgbToHex(r, g, b);
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return canvas;
  }

  drawSnow(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    const rng = this.createRng(seed);

    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const shade = 242 + (rng() - 0.5) * 18;
        ctx.fillStyle = this.rgbToHex(shade, shade, shade + 8);
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return canvas;
  }

  drawIce(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    const rng = this.createRng(seed);

    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const isCrack = (x === y || x + y === 16) && rng() < 0.5;
        if (isCrack) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        } else {
          const shade = 180 + (rng() - 0.5) * 25;
          ctx.fillStyle = this.rgbToHex(140, shade, 245, 0.85);
        }
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return canvas;
  }

  drawCactusSide(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    const rng = this.createRng(seed);

    for (let x = 0; x < 16; x++) {
      const isRib = x % 4 === 0;
      for (let y = 0; y < 16; y++) {
        const isSpine = (x % 4 === 2 && y % 4 === 2);
        if (isSpine) {
          ctx.fillStyle = '#1c3e12';
        } else if (isRib) {
          ctx.fillStyle = '#2d681c';
        } else {
          const v = (rng() - 0.5) * 15;
          ctx.fillStyle = this.rgbToHex(58 + v, 122 + v, 42 + v);
        }
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return canvas;
  }

  drawCactusTop(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    ctx.fillStyle = '#3c7e28';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#224a16';
    ctx.fillRect(4, 4, 8, 8);
    return canvas;
  }

  drawCactusBottom(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    ctx.fillStyle = '#2d681c';
    ctx.fillRect(0, 0, 16, 16);
    return canvas;
  }

  drawCraftingTableTop(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    ctx.fillStyle = '#ba8b52';
    ctx.fillRect(0, 0, 16, 16);

    // 3x3 grid lines
    ctx.fillStyle = '#5c3d1e';
    ctx.fillRect(1, 1, 14, 1);
    ctx.fillRect(1, 6, 14, 1);
    ctx.fillRect(1, 11, 14, 1);
    ctx.fillRect(1, 14, 14, 1);
    ctx.fillRect(1, 1, 1, 14);
    ctx.fillRect(6, 1, 1, 14);
    ctx.fillRect(11, 1, 1, 14);
    ctx.fillRect(14, 1, 1, 14);

    return canvas;
  }

  drawCraftingTableSide(seed, hasSaw) {
    const { canvas, ctx } = this.createTileCanvas();
    ctx.fillStyle = '#9b713c';
    ctx.fillRect(0, 0, 16, 16);

    // Frame
    ctx.fillStyle = '#6e4c23';
    ctx.fillRect(0, 0, 16, 2);
    ctx.fillRect(0, 14, 16, 2);
    ctx.fillRect(0, 0, 2, 16);
    ctx.fillRect(14, 0, 2, 16);

    // Tools icon painted on side
    if (hasSaw) {
      ctx.fillStyle = '#dcdcdc';
      ctx.fillRect(4, 6, 8, 2);
      ctx.fillStyle = '#4a3319';
      ctx.fillRect(3, 5, 2, 4);
    } else {
      // Hammer/pliers
      ctx.fillStyle = '#888';
      ctx.fillRect(6, 4, 4, 3);
      ctx.fillStyle = '#543b1c';
      ctx.fillRect(7, 7, 2, 6);
    }
    return canvas;
  }

  drawFurnaceFront(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    ctx.fillStyle = '#7a7a7a';
    ctx.fillRect(0, 0, 16, 16);

    // Arched black opening
    ctx.fillStyle = '#222222';
    ctx.fillRect(3, 7, 10, 7);
    ctx.fillRect(4, 5, 8, 2);
    ctx.fillRect(5, 4, 6, 1);

    // Stone rim
    ctx.fillStyle = '#444444';
    ctx.fillRect(2, 6, 1, 8);
    ctx.fillRect(13, 6, 1, 8);
    ctx.fillRect(3, 4, 2, 1);
    ctx.fillRect(11, 4, 2, 1);

    return canvas;
  }

  drawChestTop(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    ctx.fillStyle = '#96652e';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#482f13';
    ctx.fillRect(1, 1, 14, 1);
    ctx.fillRect(1, 14, 14, 1);
    ctx.fillRect(1, 1, 1, 14);
    ctx.fillRect(14, 1, 1, 14);
    return canvas;
  }

  drawChestFront(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    ctx.fillStyle = '#96652e';
    ctx.fillRect(0, 0, 16, 16);

    // Border & hinge line
    ctx.fillStyle = '#36210b';
    ctx.fillRect(0, 0, 16, 1);
    ctx.fillRect(0, 15, 16, 1);
    ctx.fillRect(0, 0, 1, 16);
    ctx.fillRect(15, 0, 1, 16);
    ctx.fillRect(1, 5, 14, 1);

    // Metal lock latch
    ctx.fillStyle = '#d8d8d8';
    ctx.fillRect(7, 4, 2, 4);
    ctx.fillStyle = '#555555';
    ctx.fillRect(7, 5, 2, 1);

    return canvas;
  }

  drawChestSide(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    ctx.fillStyle = '#96652e';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#36210b';
    ctx.fillRect(0, 0, 16, 1);
    ctx.fillRect(0, 15, 16, 1);
    ctx.fillRect(0, 0, 1, 16);
    ctx.fillRect(15, 0, 1, 16);
    ctx.fillRect(1, 5, 14, 1);
    return canvas;
  }

  drawTorch(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    ctx.clearRect(0, 0, 16, 16);

    // Stick
    ctx.fillStyle = '#654321';
    ctx.fillRect(7, 6, 2, 10);

    // Charcoal head
    ctx.fillStyle = '#222222';
    ctx.fillRect(7, 4, 2, 2);

    // Glowing flame
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(6, 1, 4, 4);
    ctx.fillStyle = '#ff6600';
    ctx.fillRect(7, 2, 2, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(7, 1, 2, 1);

    return canvas;
  }

  drawBricks(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    const rng = this.createRng(seed);

    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const isMortarH = y % 4 === 0;
        const isMortarV = (y < 4 && x === 0) ||
                          (y >= 4 && y < 8 && x === 8) ||
                          (y >= 8 && y < 12 && x === 0) ||
                          (y >= 12 && x === 8);

        if (isMortarH || isMortarV) {
          ctx.fillStyle = '#dcd6cd';
        } else {
          const shade = (rng() - 0.5) * 25;
          ctx.fillStyle = this.rgbToHex(168 + shade, 68 + shade * 0.6, 52 + shade * 0.5);
        }
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return canvas;
  }

  drawBookshelfSide(planksCanvas, seed) {
    const { canvas, ctx } = this.createTileCanvas();
    ctx.drawImage(planksCanvas, 0, 0);
    const rng = this.createRng(seed);

    // Top shelf of books (y=2..6)
    // Bottom shelf of books (y=9..13)
    const bookColors = ['#9e2a2b', '#335c67', '#e09f3e', '#540b0e', '#386641', '#6f1d1b'];

    for (const shelfY of [2, 9]) {
      let curX = 2;
      while (curX < 14) {
        const width = 1 + Math.floor(rng() * 2);
        const col = bookColors[Math.floor(rng() * bookColors.length)];
        ctx.fillStyle = col;
        ctx.fillRect(curX, shelfY, Math.min(width, 14 - curX), 5);
        // Book binding detail
        ctx.fillStyle = '#dcdcdc';
        ctx.fillRect(curX, shelfY + 1, Math.min(width, 14 - curX), 1);
        curX += width + 1;
      }
    }
    return canvas;
  }

  drawObsidian(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    const rng = this.createRng(seed);

    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = rng();
        if (r < 0.15) {
          // Purple/magenta glint
          ctx.fillStyle = '#3a1f4f';
        } else if (r < 0.4) {
          ctx.fillStyle = '#1c152b';
        } else {
          ctx.fillStyle = '#100c19';
        }
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return canvas;
  }

  drawNetherrack(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    const rng = this.createRng(seed);

    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const noise = (rng() - 0.5) * 40;
        ctx.fillStyle = this.rgbToHex(115 + noise, 32 + noise * 0.4, 32 + noise * 0.4);
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return canvas;
  }

  drawGlowstone(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    const rng = this.createRng(seed);

    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = rng();
        if (r < 0.25) {
          ctx.fillStyle = '#fff4a3';
        } else if (r < 0.6) {
          ctx.fillStyle = '#e5b84c';
        } else {
          ctx.fillStyle = '#a87326';
        }
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return canvas;
  }

  drawPoppy(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    ctx.clearRect(0, 0, 16, 16);

    // Stem
    ctx.fillStyle = '#3e7527';
    ctx.fillRect(7, 7, 2, 9);
    ctx.fillRect(5, 11, 2, 2);

    // Flower bloom
    ctx.fillStyle = '#e62222';
    ctx.fillRect(5, 2, 6, 6);
    ctx.fillStyle = '#a61414';
    ctx.fillRect(6, 1, 4, 1);
    ctx.fillStyle = '#222222';
    ctx.fillRect(7, 4, 2, 2);

    return canvas;
  }

  drawDandelion(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    ctx.clearRect(0, 0, 16, 16);

    // Stem
    ctx.fillStyle = '#497c2a';
    ctx.fillRect(7, 6, 2, 10);

    // Yellow head
    ctx.fillStyle = '#fed726';
    ctx.fillRect(5, 2, 6, 5);
    ctx.fillStyle = '#e8a917';
    ctx.fillRect(6, 1, 4, 1);
    ctx.fillRect(7, 3, 2, 2);

    return canvas;
  }

  drawTallGrass(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    ctx.clearRect(0, 0, 16, 16);
    const rng = this.createRng(seed);

    for (let x = 2; x <= 13; x += 2) {
      const height = 6 + Math.floor(rng() * 8);
      for (let y = 16 - height; y < 16; y++) {
        const shade = (rng() - 0.5) * 20;
        ctx.fillStyle = this.rgbToHex(75 + shade, 145 + shade, 40 + shade * 0.5);
        ctx.fillRect(x, y, 1 + (rng() < 0.5 ? 1 : 0), 1);
      }
    }
    return canvas;
  }

  drawMushroom(seed, isRed) {
    const { canvas, ctx } = this.createTileCanvas();
    ctx.clearRect(0, 0, 16, 16);

    // Stem
    ctx.fillStyle = '#dcd5c5';
    ctx.fillRect(7, 9, 2, 7);

    // Cap
    if (isRed) {
      ctx.fillStyle = '#d62828';
      ctx.fillRect(4, 4, 8, 5);
      ctx.fillRect(5, 3, 6, 1);
      // White spots
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(5, 5, 2, 2);
      ctx.fillRect(9, 6, 2, 2);
      ctx.fillRect(7, 4, 1, 1);
    } else {
      ctx.fillStyle = '#8b5a2b';
      ctx.fillRect(4, 5, 8, 4);
      ctx.fillRect(5, 4, 6, 1);
    }
    return canvas;
  }

  // --- NEW TEXTURE HELPERS ---
  drawMetalBlock(seed, light, dark) {
    const { canvas, ctx } = this.createTileCanvas();
    const rng = this.createRng(seed);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const isBorder = x === 0 || x === 15 || y === 0 || y === 15 || x === 7 || x === 8 || y === 7 || y === 8;
        if (isBorder) ctx.fillStyle = this.rgbToHex(dark[0], dark[1], dark[2]);
        else {
          const n = (rng() - 0.5) * 18;
          ctx.fillStyle = this.rgbToHex(light[0] + n, light[1] + n, light[2] + n);
        }
        ctx.fillRect(x, y, 1, 1);
      }
    }
    // highlight
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fillRect(2, 2, 5, 1);
    ctx.fillRect(2, 2, 1, 5);
    return canvas;
  }
  drawWool(seed, col) {
    const { canvas, ctx } = this.createTileCanvas();
    const rng = this.createRng(seed);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const n = (rng() - 0.5) * 22;
      ctx.fillStyle = this.rgbToHex(col[0] + n, col[1] + n, col[2] + n);
      ctx.fillRect(x, y, 1, 1);
    }
    return canvas;
  }
  drawTerracotta(seed, col) {
    const { canvas, ctx } = this.createTileCanvas();
    const rng = this.createRng(seed);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const n = (rng() - 0.5) * 14;
      ctx.fillStyle = this.rgbToHex(col[0] + n, col[1] + n, col[2] + n);
      ctx.fillRect(x, y, 1, 1);
    }
    // crack lines faint
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    if (rng() < 0.5) ctx.fillRect(7, 0, 1, 16);
    return canvas;
  }
  drawGranite(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    const rng = this.createRng(seed);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const r = rng();
      if (r < 0.12) ctx.fillStyle = '#3a2a2a';
      else if (r < 0.35) ctx.fillStyle = '#9a6b5a';
      else ctx.fillStyle = '#b87d6b';
      ctx.fillRect(x, y, 1, 1);
    }
    return canvas;
  }
  drawDiorite(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    const rng = this.createRng(seed);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const v = 200 + (rng() - 0.5) * 30;
      const speckle = rng() < 0.08 ? -50 : 0;
      ctx.fillStyle = this.rgbToHex(v + speckle, v + speckle, v + speckle);
      ctx.fillRect(x, y, 1, 1);
    }
    return canvas;
  }
  drawAndesite(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    const rng = this.createRng(seed);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const v = 155 + (rng() - 0.5) * 25;
      ctx.fillStyle = this.rgbToHex(v, v, v);
      ctx.fillRect(x, y, 1, 1);
    }
    return canvas;
  }
  drawPolishedStone(seed, col) {
    const { canvas, ctx } = this.createTileCanvas();
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const border = x === 0 || x === 15 || y === 0 || y === 15 || x === 7 || y === 7;
      if (border) ctx.fillStyle = this.rgbToHex(col[0] - 30, col[1] - 30, col[2] - 30);
      else ctx.fillStyle = this.rgbToHex(col[0], col[1], col[2]);
      ctx.fillRect(x, y, 1, 1);
    }
    return canvas;
  }
  drawSmoothStone(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    ctx.fillStyle = '#a8a8a8';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#9a9a9a';
    ctx.fillRect(1, 1, 14, 1);
    ctx.fillRect(1, 1, 1, 14);
    return canvas;
  }
  drawFarmlandTop(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#6e4a22';
    for (let y = 2; y < 14; y += 3) ctx.fillRect(0, y, 16, 1);
    for (let x = 2; x < 14; x += 4) ctx.fillRect(x, 0, 1, 16);
    return canvas;
  }
  drawFarmlandSide(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    ctx.fillStyle = '#6e4a22';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#3a2210';
    ctx.fillRect(0, 0, 16, 2);
    return canvas;
  }
  drawWheat(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    ctx.clearRect(0, 0, 16, 16);
    ctx.fillStyle = '#5a7a1a';
    ctx.fillRect(7, 10, 2, 6);
    ctx.fillStyle = '#d4b84a';
    ctx.fillRect(5, 4, 6, 7);
    ctx.fillRect(4, 6, 8, 3);
    ctx.fillStyle = '#a67c2a';
    ctx.fillRect(6, 6, 4, 2);
    return canvas;
  }
  drawHayTop(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    ctx.fillStyle = '#d4b84a';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#a88a2a';
    ctx.fillRect(4, 4, 8, 8);
    ctx.fillStyle = '#5a3a0a';
    ctx.fillRect(7, 2, 2, 2);
    ctx.fillRect(7, 12, 2, 2);
    return canvas;
  }
  drawHaySide(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    ctx.fillStyle = '#c4a63a';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#8a6d1a';
    for (let x = 0; x < 16; x += 2) ctx.fillRect(x, 0, 1, 16);
    return canvas;
  }
  drawPumpkinTop(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    ctx.fillStyle = '#c46a0a';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#8a4a00';
    ctx.fillRect(7, 7, 2, 2);
    return canvas;
  }
  drawPumpkinSide(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    ctx.fillStyle = '#d47a14';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#9a5a00';
    for (let y = 0; y < 16; y++) ctx.fillRect(7, y, 2, 16);
    return canvas;
  }
  drawPumpkinFront(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    ctx.fillStyle = '#d47a14';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#111111';
    ctx.fillRect(4, 4, 2, 2);
    ctx.fillRect(10, 4, 2, 2);
    ctx.fillRect(6, 9, 4, 1);
    ctx.fillRect(7, 10, 2, 1);
    return canvas;
  }
  drawMelonTop(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    ctx.fillStyle = '#4a8a2a';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#2d5a1a';
    for (let x = 2; x < 16; x += 4) ctx.fillRect(x, 0, 2, 16);
    return canvas;
  }
  drawMelonSide(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    ctx.fillStyle = '#5aaa2a';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#2d5a1a';
    for (let y = 0; y < 16; y += 3) ctx.fillRect(0, y, 16, 1);
    for (let x = 3; x < 16; x += 5) ctx.fillRect(x, 0, 1, 16);
    return canvas;
  }
  drawTNTTop(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    ctx.fillStyle = '#d44a2a';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(2, 4, 12, 2);
    ctx.fillRect(2, 10, 12, 2);
    return canvas;
  }
  drawTNTBottom(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    ctx.fillStyle = '#7a3a2a';
    ctx.fillRect(0, 0, 16, 16);
    return canvas;
  }
  drawTNTSide(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    ctx.fillStyle = '#d44a2a';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 6, 16, 4);
    ctx.fillStyle = '#111111';
    ctx.font = '7px monospace';
    ctx.fillText('TNT', 4, 10);
    return canvas;
  }
  drawSponge(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    const rng = this.createRng(seed);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      if ((x + y) % 3 === 0 && rng() < 0.6) ctx.fillStyle = '#dacd4a';
      else ctx.fillStyle = '#b8a82a';
      ctx.fillRect(x, y, 1, 1);
    }
    return canvas;
  }
  drawJungleLogSide(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    for (let x = 0; x < 16; x++) {
      const shade = x % 3 === 0 ? -20 : 10;
      for (let y = 0; y < 16; y++) {
        ctx.fillStyle = this.rgbToHex(115 + shade, 90 + shade, 45 + shade);
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return canvas;
  }
  drawJungleLogTop(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const dx = x - 7.5, dy = y - 7.5, d = Math.sqrt(dx * dx + dy * dy);
      if (d > 6.5) ctx.fillStyle = '#7a5a2a';
      else ctx.fillStyle = '#b89a5a';
      ctx.fillRect(x, y, 1, 1);
    }
    return canvas;
  }
  drawAcaciaLogSide(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    for (let x = 0; x < 16; x++) {
      const shade = x % 4 === 0 ? -18 : 12;
      for (let y = 0; y < 16; y++) {
        ctx.fillStyle = this.rgbToHex(160 + shade, 90 + shade * 0.6, 30 + shade * 0.4);
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return canvas;
  }
  drawAcaciaLogTop(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const dx = x - 7.5, dy = y - 7.5, d = Math.sqrt(dx * dx + dy * dy);
      if (d > 6.5) ctx.fillStyle = '#6a3a1a';
      else ctx.fillStyle = '#c47a3a';
      ctx.fillRect(x, y, 1, 1);
    }
    return canvas;
  }
  drawDarkOakLogSide(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    for (let x = 0; x < 16; x++) {
      const shade = x % 3 === 0 ? -15 : 8;
      for (let y = 0; y < 16; y++) {
        ctx.fillStyle = this.rgbToHex(55 + shade, 35 + shade, 18 + shade);
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return canvas;
  }
  drawDarkOakLogTop(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const dx = x - 7.5, dy = y - 7.5, d = Math.sqrt(dx * dx + dy * dy);
      if (d > 6.5) ctx.fillStyle = '#2a1a0a';
      else ctx.fillStyle = '#6a4a1a';
      ctx.fillRect(x, y, 1, 1);
    }
    return canvas;
  }
  drawMushroomStem(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    ctx.fillStyle = '#dcd5c5';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#b8b0a0';
    for (let y = 0; y < 16; y += 4) ctx.fillRect(0, y, 16, 1);
    return canvas;
  }
  drawMushroomBlock(seed, isRed) {
    const { canvas, ctx } = this.createTileCanvas();
    ctx.fillStyle = isRed ? '#c44a4a' : '#8a6a3a';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    if (isRed) { ctx.fillRect(4, 4, 3, 3); ctx.fillRect(10, 8, 2, 2); }
    return canvas;
  }
  drawQuartzTop(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    ctx.fillStyle = '#e8e8e8';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#d0d0d0';
    ctx.fillRect(2, 2, 12, 12);
    return canvas;
  }
  drawQuartzBottom(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    ctx.fillStyle = '#e8e8e8';
    ctx.fillRect(0, 0, 16, 16);
    return canvas;
  }
  drawQuartzSide(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    ctx.fillStyle = '#e8e8e8';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#c8c8c8';
    for (let y = 0; y < 16; y += 4) ctx.fillRect(0, y, 16, 1);
    return canvas;
  }
  drawSoulSand(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    const rng = this.createRng(seed);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const n = (rng() - 0.5) * 20;
      ctx.fillStyle = this.rgbToHex(70 + n, 50 + n, 40 + n);
      ctx.fillRect(x, y, 1, 1);
    }
    // wailing faces
    ctx.fillStyle = 'rgba(200,180,160,0.25)';
    ctx.fillRect(4, 4, 8, 2);
    ctx.fillRect(6, 10, 4, 2);
    return canvas;
  }
  drawSoulSoil(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    const rng = this.createRng(seed);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const n = (rng() - 0.5) * 18;
      ctx.fillStyle = this.rgbToHex(65 + n, 45 + n, 35 + n);
      ctx.fillRect(x, y, 1, 1);
    }
    return canvas;
  }
  drawBasaltTop(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#5a5a5a';
    ctx.fillRect(3, 3, 10, 10);
    return canvas;
  }
  drawBasaltSide(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        const shade = x % 4 === 0 ? -20 : 10;
        ctx.fillStyle = this.rgbToHex(50 + shade, 50 + shade, 50 + shade);
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return canvas;
  }
  drawBlackstone(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    const rng = this.createRng(seed);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const v = 30 + (rng() - 0.5) * 20;
      ctx.fillStyle = this.rgbToHex(v, v, v);
      ctx.fillRect(x, y, 1, 1);
    }
    return canvas;
  }
  drawDeepslateTop(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    ctx.fillStyle = '#3a3a3e';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#2a2a2e';
    ctx.fillRect(5, 5, 6, 6);
    return canvas;
  }
  drawDeepslateSide(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    for (let x = 0; x < 16; x++) for (let y = 0; y < 16; y++) {
      const layer = y % 4 === 0 ? -15 : 5;
      ctx.fillStyle = this.rgbToHex(55 + layer, 55 + layer, 58 + layer);
      ctx.fillRect(x, y, 1, 1);
    }
    return canvas;
  }
  drawSmoothSandstone(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    ctx.fillStyle = '#d0c0a0';
    ctx.fillRect(0, 0, 16, 16);
    return canvas;
  }
  drawChiseledSandstoneTop(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    ctx.fillStyle = '#d0c0a0';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#a09070';
    ctx.fillRect(5, 5, 6, 6);
    return canvas;
  }
  drawChiseledSandstoneSide(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    ctx.fillStyle = '#d0c0a0';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#8a7050';
    // creeper-like chiseled pattern
    ctx.fillRect(4, 4, 8, 2);
    ctx.fillRect(4, 10, 8, 2);
    ctx.fillRect(6, 6, 4, 4);
    return canvas;
  }
  drawSeaLantern(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const v = 200 + Math.sin((x + y) * 0.8) * 20;
      ctx.fillStyle = this.rgbToHex(v, v, 180 + v * 0.1);
      ctx.fillRect(x, y, 1, 1);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillRect(3, 3, 10, 2);
    return canvas;
  }
  drawPrismarine(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    const rng = this.createRng(seed);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const n = (rng() - 0.5) * 18;
      ctx.fillStyle = this.rgbToHex(90 + n, 150 + n, 150 + n);
      ctx.fillRect(x, y, 1, 1);
    }
    return canvas;
  }
  drawIronBars(seed) {
    const { canvas, ctx } = this.createTileCanvas();
    ctx.clearRect(0, 0, 16, 16);
    ctx.fillStyle = '#a0a0a0';
    ctx.fillRect(7, 0, 2, 16);
    ctx.fillRect(0, 7, 16, 2);
    ctx.fillRect(2, 2, 2, 2);
    ctx.fillRect(12, 12, 2, 2);
    ctx.fillStyle = '#707070';
    ctx.fillRect(7, 0, 1, 16);
    return canvas;
  }

  drawDestroyStage(stage) {
    const { canvas, ctx } = this.createTileCanvas();
    ctx.clearRect(0, 0, 16, 16);
    const rng = this.createRng(stage * 99 + 17);

    const numCracks = (stage + 1) * 6;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';

    let cx = 8, cy = 8;
    for (let i = 0; i < numCracks; i++) {
      cx += Math.floor((rng() - 0.5) * 4);
      cy += Math.floor((rng() - 0.5) * 4);
      cx = Math.max(0, Math.min(15, cx));
      cy = Math.max(0, Math.min(15, cy));
      ctx.fillRect(cx, cy, 1, 1);
    }
    return canvas;
  }

  // --- ATLAS PACKING AND UV MAP GENERATION ---

  init() {
    this.textures = this.generateTextures();
    const keys = Object.keys(this.textures);
    const count = keys.length;

    // Pack in square grid
    this.cols = Math.ceil(Math.sqrt(count));
    this.rows = Math.ceil(count / this.cols);

    const atlasWidth = this.cols * this.tileSize;
    const atlasHeight = this.rows * this.tileSize;

    const atlasCanvas = document.createElement('canvas');
    atlasCanvas.width = atlasWidth;
    atlasCanvas.height = atlasHeight;
    const ctx = atlasCanvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    keys.forEach((key, index) => {
      const col = index % this.cols;
      const row = Math.floor(index / this.cols);
      const px = col * this.tileSize;
      const py = row * this.tileSize;

      ctx.drawImage(this.textures[key], px, py);

      // In Three.js UV space, (0,0) is bottom-left, (1,1) is top-right
      const u0 = px / atlasWidth;
      const u1 = (px + this.tileSize) / atlasWidth;
      const v0 = 1 - (py + this.tileSize) / atlasHeight; // Invert for WebGL UV coordinate convention
      const v1 = 1 - py / atlasHeight;

      this.uvMap[key] = {
        col,
        row,
        u0,
        u1,
        v0,
        v1,
        pixelX: px,
        pixelY: py,
      };
    });

    this.canvas = atlasCanvas;

    // Create Three.js Texture with pixelated nearest filtering
    this.texture = new THREE.CanvasTexture(atlasCanvas);
    this.texture.magFilter = THREE.NearestFilter;
    this.texture.minFilter = THREE.NearestFilter;
    this.texture.generateMipmaps = false;
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.needsUpdate = true;
  }

  getUV(textureName) {
    if (!this.uvMap[textureName]) {
      // Fallback to stone or first texture
      return this.uvMap['stone'] || { u0: 0, u1: 1, v0: 0, v1: 1 };
    }
    return this.uvMap[textureName];
  }
}

// Global Singleton instance
export const textureAtlas = new TextureAtlas();
