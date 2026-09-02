// Item Atlas: Procedural 2D pixel-art generator for all inventory items, tools, armor, food, and crafting items

export class ItemAtlas {
  constructor() {
    this.cache = {};
    this.init();
  }

  createCanvas(w = 32, h = 32) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    return { canvas, ctx };
  }

  rgbToHex(r, g, b, a = 1) {
    const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
    return `rgba(${clamp(r)},${clamp(g)},${clamp(b)},${a})`;
  }

  init() {
    // Generate icons for all items
    const materials = [
      { name: 'wooden', bladeLight: [184, 148, 93], bladeDark: [130, 95, 50], stick: [105, 78, 44] },
      { name: 'stone', bladeLight: [160, 160, 160], bladeDark: [90, 90, 90], stick: [105, 78, 44] },
      { name: 'iron', bladeLight: [235, 235, 235], bladeDark: [150, 150, 155], stick: [105, 78, 44] },
      { name: 'golden', bladeLight: [255, 235, 70], bladeDark: [195, 140, 20], stick: [105, 78, 44] },
      { name: 'diamond', bladeLight: [92, 240, 240], bladeDark: [35, 150, 160], stick: [105, 78, 44] },
    ];

    materials.forEach((mat) => {
      this.cache[`${mat.name}_pickaxe`] = this.drawPickaxe(mat);
      this.cache[`${mat.name}_axe`] = this.drawAxe(mat);
      this.cache[`${mat.name}_shovel`] = this.drawShovel(mat);
      this.cache[`${mat.name}_sword`] = this.drawSword(mat);
      this.cache[`${mat.name}_hoe`] = this.drawHoe(mat);
    });

    // Materials / Items
    this.cache['stick'] = this.drawStick();
    this.cache['coal'] = this.drawCoal();
    this.cache['iron_ingot'] = this.drawIngot([220, 220, 225], [160, 160, 165]);
    this.cache['gold_ingot'] = this.drawIngot([255, 225, 50], [195, 140, 20]);
    this.cache['diamond'] = this.drawDiamond();
    this.cache['emerald'] = this.drawEmerald();
    this.cache['redstone'] = this.drawRedstone();
    this.cache['glowstone_dust'] = this.drawGlowstoneDust();
    this.cache['clay_ball'] = this.drawClayBall();
    this.cache['brick'] = this.drawBrick();
    this.cache['book'] = this.drawBook();
    this.cache['apple'] = this.drawApple();
    this.cache['bread'] = this.drawBread();
    this.cache['raw_porkchop'] = this.drawMeat(false);
    this.cache['cooked_porkchop'] = this.drawMeat(true);
    this.cache['raw_beef'] = this.drawBeef(false);
    this.cache['cooked_beef'] = this.drawBeef(true);
    this.cache['torch'] = this.drawTorchItem();
    this.cache['shears'] = this.drawShears();
    this.cache['arrow'] = this.drawArrow();
    this.cache['bow'] = this.drawBow();
    this.cache['lapis_lazuli'] = this.drawLapis();
    this.cache['copper_ingot'] = this.drawIngot([200, 110, 60], [160, 80, 40]);
    this.cache['raw_copper'] = this.drawRawCopper();
    this.cache['copper_ingot'] = this.drawIngot([200, 110, 60], [160, 80, 40]);
    this.cache['wheat'] = this.drawWheatItem();
    this.cache['wheat_seeds'] = this.drawSeeds();
    this.cache['melon_slice'] = this.drawMelonSlice();
    this.cache['prismarine_crystals'] = this.drawPrismarineCrystals();
    this.cache['prismarine_shard'] = this.drawPrismarineShard();
    this.cache['string'] = this.drawString();
    this.cache['wool'] = this.drawWoolItem();
    this.cache['feather'] = this.drawFeather();
    this.cache['egg'] = this.drawEgg();
    this.cache['leather'] = this.drawLeather();
    this.cache['gunpowder'] = this.drawGunpowder();
    this.cache['ender_pearl'] = this.drawEnderPearl();
    this.cache['bone'] = this.drawBone();
    this.cache['spider_eye'] = this.drawSpiderEye();
  }

  drawPickaxe(mat) {
    const { canvas, ctx } = this.createCanvas(16, 16);
    // Stick diagonal (from 3,12 to 10,5)
    ctx.fillStyle = this.rgbToHex(...mat.stick);
    for (let i = 0; i < 9; i++) {
      ctx.fillRect(3 + i, 12 - i, 2, 2);
    }

    // Pickaxe head (curved top)
    ctx.fillStyle = this.rgbToHex(...mat.bladeLight);
    ctx.fillRect(8, 2, 6, 2);
    ctx.fillRect(13, 3, 2, 4);
    ctx.fillRect(6, 4, 3, 2);
    ctx.fillRect(4, 7, 2, 3);
    ctx.fillRect(2, 9, 2, 2);

    ctx.fillStyle = this.rgbToHex(...mat.bladeDark);
    ctx.fillRect(9, 3, 5, 1);
    ctx.fillRect(12, 4, 1, 3);
    ctx.fillRect(5, 5, 2, 2);
    ctx.fillRect(3, 8, 1, 2);

    return canvas.toDataURL();
  }

  drawSword(mat) {
    const { canvas, ctx } = this.createCanvas(16, 16);
    // Handle
    ctx.fillStyle = this.rgbToHex(...mat.stick);
    ctx.fillRect(2, 13, 2, 2);
    ctx.fillRect(3, 12, 2, 2);

    // Guard
    ctx.fillStyle = this.rgbToHex(...mat.bladeDark);
    ctx.fillRect(4, 10, 3, 2);
    ctx.fillRect(2, 11, 2, 2);
    ctx.fillRect(5, 9, 2, 2);

    // Blade
    ctx.fillStyle = this.rgbToHex(...mat.bladeLight);
    for (let i = 0; i < 9; i++) {
      ctx.fillRect(5 + i, 9 - i, 2, 2);
    }
    ctx.fillRect(13, 2, 1, 1);

    ctx.fillStyle = this.rgbToHex(...mat.bladeDark);
    for (let i = 0; i < 8; i++) {
      ctx.fillRect(6 + i, 10 - i, 1, 1);
    }

    return canvas.toDataURL();
  }

  drawAxe(mat) {
    const { canvas, ctx } = this.createCanvas(16, 16);
    // Stick
    ctx.fillStyle = this.rgbToHex(...mat.stick);
    for (let i = 0; i < 10; i++) {
      ctx.fillRect(3 + i, 13 - i, 2, 2);
    }

    // Axe head blade
    ctx.fillStyle = this.rgbToHex(...mat.bladeLight);
    ctx.fillRect(8, 2, 5, 4);
    ctx.fillRect(11, 3, 3, 4);
    ctx.fillRect(7, 5, 3, 4);

    ctx.fillStyle = this.rgbToHex(...mat.bladeDark);
    ctx.fillRect(9, 3, 3, 2);
    ctx.fillRect(12, 4, 2, 3);
    ctx.fillRect(8, 6, 2, 2);

    return canvas.toDataURL();
  }

  drawShovel(mat) {
    const { canvas, ctx } = this.createCanvas(16, 16);
    // Stick
    ctx.fillStyle = this.rgbToHex(...mat.stick);
    for (let i = 0; i < 10; i++) {
      ctx.fillRect(3 + i, 13 - i, 2, 2);
    }

    // Shovel head
    ctx.fillStyle = this.rgbToHex(...mat.bladeLight);
    ctx.fillRect(10, 2, 4, 4);
    ctx.fillRect(12, 1, 3, 3);

    ctx.fillStyle = this.rgbToHex(...mat.bladeDark);
    ctx.fillRect(11, 3, 3, 3);

    return canvas.toDataURL();
  }

  drawHoe(mat) {
    const { canvas, ctx } = this.createCanvas(16, 16);
    ctx.fillStyle = this.rgbToHex(...mat.stick);
    for (let i = 0; i < 10; i++) {
      ctx.fillRect(3 + i, 13 - i, 2, 2);
    }
    ctx.fillStyle = this.rgbToHex(...mat.bladeLight);
    ctx.fillRect(9, 2, 5, 3);
    ctx.fillRect(7, 4, 3, 2);

    ctx.fillStyle = this.rgbToHex(...mat.bladeDark);
    ctx.fillRect(10, 3, 4, 1);
    return canvas.toDataURL();
  }

  drawStick() {
    const { canvas, ctx } = this.createCanvas(16, 16);
    ctx.fillStyle = '#6e4c23';
    for (let i = 0; i < 11; i++) {
      ctx.fillRect(3 + i, 13 - i, 2, 2);
    }
    ctx.fillStyle = '#9b713c';
    for (let i = 0; i < 11; i++) {
      ctx.fillRect(3 + i, 13 - i, 1, 1);
    }
    return canvas.toDataURL();
  }

  drawCoal() {
    const { canvas, ctx } = this.createCanvas(16, 16);
    ctx.fillStyle = '#222222';
    ctx.fillRect(4, 5, 8, 7);
    ctx.fillRect(5, 3, 6, 10);
    ctx.fillRect(3, 6, 10, 5);

    ctx.fillStyle = '#444444';
    ctx.fillRect(5, 4, 2, 2);
    ctx.fillRect(8, 7, 3, 2);

    ctx.fillStyle = '#111111';
    ctx.fillRect(4, 9, 3, 3);
    ctx.fillRect(9, 10, 3, 2);
    return canvas.toDataURL();
  }

  drawIngot(light, dark) {
    const { canvas, ctx } = this.createCanvas(16, 16);
    ctx.fillStyle = this.rgbToHex(...light);
    ctx.fillRect(3, 6, 10, 5);
    ctx.fillRect(4, 5, 8, 7);

    ctx.fillStyle = this.rgbToHex(...dark);
    ctx.fillRect(4, 8, 8, 3);
    ctx.fillRect(11, 6, 2, 5);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(4, 6, 6, 1);
    return canvas.toDataURL();
  }

  drawDiamond() {
    const { canvas, ctx } = this.createCanvas(16, 16);
    ctx.fillStyle = '#4ae3e3';
    ctx.fillRect(5, 4, 6, 8);
    ctx.fillRect(4, 6, 8, 4);

    ctx.fillStyle = '#b6ffff';
    ctx.fillRect(6, 4, 4, 2);
    ctx.fillRect(5, 6, 2, 2);

    ctx.fillStyle = '#1b9b9b';
    ctx.fillRect(5, 10, 6, 2);
    ctx.fillRect(9, 7, 2, 3);
    return canvas.toDataURL();
  }

  drawEmerald() {
    const { canvas, ctx } = this.createCanvas(16, 16);
    ctx.fillStyle = '#17dd62';
    ctx.fillRect(5, 3, 6, 10);
    ctx.fillRect(4, 5, 8, 6);

    ctx.fillStyle = '#9efbc2';
    ctx.fillRect(6, 4, 4, 2);
    ctx.fillRect(5, 6, 2, 2);

    ctx.fillStyle = '#0a7c33';
    ctx.fillRect(5, 11, 6, 2);
    ctx.fillRect(10, 6, 2, 4);
    return canvas.toDataURL();
  }

  drawRedstone() {
    const { canvas, ctx } = this.createCanvas(16, 16);
    ctx.fillStyle = '#d91414';
    ctx.fillRect(4, 8, 8, 4);
    ctx.fillRect(6, 5, 4, 8);
    ctx.fillRect(3, 9, 10, 2);

    ctx.fillStyle = '#ff6b6b';
    ctx.fillRect(6, 6, 2, 2);
    ctx.fillRect(8, 9, 2, 1);

    ctx.fillStyle = '#7a0505';
    ctx.fillRect(4, 11, 7, 2);
    return canvas.toDataURL();
  }

  drawGlowstoneDust() {
    const { canvas, ctx } = this.createCanvas(16, 16);
    ctx.fillStyle = '#fed636';
    ctx.fillRect(5, 6, 6, 6);
    ctx.fillRect(4, 7, 8, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(6, 7, 2, 2);
    ctx.fillStyle = '#b3820a';
    ctx.fillRect(6, 10, 4, 2);
    return canvas.toDataURL();
  }

  drawClayBall() {
    const { canvas, ctx } = this.createCanvas(16, 16);
    ctx.fillStyle = '#a1a6b4';
    ctx.fillRect(4, 5, 8, 6);
    ctx.fillRect(5, 4, 6, 8);
    ctx.fillStyle = '#c5c9d6';
    ctx.fillRect(6, 5, 3, 2);
    ctx.fillStyle = '#757a87';
    ctx.fillRect(5, 9, 6, 2);
    return canvas.toDataURL();
  }

  drawBrick() {
    const { canvas, ctx } = this.createCanvas(16, 16);
    ctx.fillStyle = '#a63a24';
    ctx.fillRect(3, 6, 10, 5);
    ctx.fillStyle = '#d95a41';
    ctx.fillRect(4, 6, 8, 1);
    ctx.fillStyle = '#6b2010';
    ctx.fillRect(3, 10, 10, 1);
    return canvas.toDataURL();
  }

  drawBook() {
    const { canvas, ctx } = this.createCanvas(16, 16);
    ctx.fillStyle = '#8b261d';
    ctx.fillRect(4, 3, 8, 10);
    ctx.fillStyle = '#f0e6d2';
    ctx.fillRect(5, 4, 6, 8);
    ctx.fillStyle = '#b08b59';
    ctx.fillRect(7, 4, 2, 8);
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(3, 7, 10, 2);
    return canvas.toDataURL();
  }

  drawApple() {
    const { canvas, ctx } = this.createCanvas(16, 16);
    // Stem
    ctx.fillStyle = '#593b16';
    ctx.fillRect(8, 2, 2, 3);
    // Apple
    ctx.fillStyle = '#e61e1e';
    ctx.fillRect(4, 5, 8, 7);
    ctx.fillRect(5, 4, 6, 9);
    ctx.fillStyle = '#ff8888';
    ctx.fillRect(5, 5, 2, 2);
    ctx.fillStyle = '#9e0d0d';
    ctx.fillRect(5, 11, 6, 2);
    return canvas.toDataURL();
  }

  drawBread() {
    const { canvas, ctx } = this.createCanvas(16, 16);
    ctx.fillStyle = '#b5742e';
    ctx.fillRect(3, 6, 10, 5);
    ctx.fillRect(4, 5, 8, 7);
    ctx.fillStyle = '#e8a958';
    ctx.fillRect(4, 6, 8, 2);
    ctx.fillStyle = '#6e3c0d';
    ctx.fillRect(4, 10, 8, 2);
    ctx.fillRect(5, 6, 1, 3);
    ctx.fillRect(8, 6, 1, 3);
    ctx.fillRect(11, 6, 1, 3);
    return canvas.toDataURL();
  }

  drawMeat(cooked) {
    const { canvas, ctx } = this.createCanvas(16, 16);
    const main = cooked ? '#874620' : '#e65c5c';
    const fat = cooked ? '#e0a96d' : '#ffffff';
    const dark = cooked ? '#54260d' : '#992222';

    ctx.fillStyle = main;
    ctx.fillRect(4, 5, 8, 7);
    ctx.fillRect(5, 4, 7, 8);
    ctx.fillStyle = fat;
    ctx.fillRect(4, 7, 2, 3);
    ctx.fillRect(10, 6, 2, 2);
    ctx.fillStyle = dark;
    ctx.fillRect(5, 10, 6, 2);
    return canvas.toDataURL();
  }

  drawBeef(cooked) {
    const { canvas, ctx } = this.createCanvas(16, 16);
    const main = cooked ? '#6e3415' : '#a82020';
    const fat = cooked ? '#c29469' : '#f0d0d0';

    ctx.fillStyle = main;
    ctx.fillRect(3, 5, 10, 7);
    ctx.fillRect(5, 4, 7, 8);
    ctx.fillStyle = fat;
    ctx.fillRect(4, 6, 2, 2);
    ctx.fillRect(11, 7, 2, 2);
    return canvas.toDataURL();
  }

  drawTorchItem() {
    const { canvas, ctx } = this.createCanvas(16, 16);
    ctx.fillStyle = '#654321';
    ctx.fillRect(7, 6, 2, 9);
    ctx.fillStyle = '#222222';
    ctx.fillRect(7, 4, 2, 2);
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(6, 1, 4, 4);
    ctx.fillStyle = '#ff6600';
    ctx.fillRect(7, 2, 2, 2);
    return canvas.toDataURL();
  }

  drawShears() {
    const { canvas, ctx } = this.createCanvas(16, 16);
    ctx.fillStyle = '#dcdcdc';
    ctx.fillRect(4, 4, 3, 8);
    ctx.fillRect(9, 4, 3, 8);
    ctx.fillStyle = '#888888';
    ctx.fillRect(6, 7, 4, 2);
    return canvas.toDataURL();
  }

  drawArrow() {
    const { canvas, ctx } = this.createCanvas(16, 16);
    // Shaft
    ctx.fillStyle = '#8b5a2b';
    for (let i = 0; i < 9; i++) {
      ctx.fillRect(3 + i, 12 - i, 2, 2);
    }
    // Head
    ctx.fillStyle = '#9e9e9e';
    ctx.fillRect(11, 2, 4, 3);
    ctx.fillRect(13, 1, 2, 2);
    // Feathers
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(2, 13, 2, 2);
    ctx.fillRect(3, 14, 2, 1);
    ctx.fillRect(1, 12, 1, 2);
    return canvas.toDataURL();
  }

  drawBow() {
    const { canvas, ctx } = this.createCanvas(16, 16);
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(3, 4, 2, 8);
    ctx.fillRect(5, 2, 3, 2);
    ctx.fillRect(5, 12, 3, 2);
    ctx.fillRect(8, 1, 4, 2);
    ctx.fillRect(8, 13, 4, 2);

    // String
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(12, 3, 1, 10);
    return canvas.toDataURL();
  }

  drawLapis() {
    const { canvas, ctx } = this.createCanvas(16, 16);
    ctx.fillStyle = '#2a5ad4';
    ctx.fillRect(5, 5, 6, 6);
    ctx.fillRect(4, 6, 8, 4);
    ctx.fillStyle = '#5a8aea';
    ctx.fillRect(6, 6, 2, 2);
    ctx.fillStyle = '#1a2a7a';
    ctx.fillRect(5, 9, 6, 2);
    return canvas.toDataURL();
  }
  drawRawCopper() {
    const { canvas, ctx } = this.createCanvas(16, 16);
    ctx.fillStyle = '#c47a3a';
    ctx.fillRect(4, 6, 8, 4);
    ctx.fillRect(5, 5, 6, 6);
    ctx.fillStyle = '#9a5a22';
    ctx.fillRect(5, 8, 6, 2);
    return canvas.toDataURL();
  }
  drawWheatItem() {
    const { canvas, ctx } = this.createCanvas(16, 16);
    ctx.fillStyle = '#d4b84a';
    ctx.fillRect(6, 5, 4, 8);
    ctx.fillRect(5, 6, 6, 6);
    ctx.fillStyle = '#8a6d1a';
    ctx.fillRect(6, 10, 4, 2);
    return canvas.toDataURL();
  }
  drawSeeds() {
    const { canvas, ctx } = this.createCanvas(16, 16);
    ctx.fillStyle = '#7a5a2a';
    ctx.fillRect(7, 7, 2, 2);
    ctx.fillRect(6, 8, 2, 2);
    ctx.fillRect(8, 8, 2, 2);
    ctx.fillStyle = '#a67c3a';
    ctx.fillRect(7, 7, 1, 1);
    return canvas.toDataURL();
  }
  drawMelonSlice() {
    const { canvas, ctx } = this.createCanvas(16, 16);
    ctx.fillStyle = '#5aaa2a';
    ctx.fillRect(4, 5, 8, 6);
    ctx.fillStyle = '#d44a4a';
    ctx.fillRect(5, 6, 6, 4);
    ctx.fillStyle = '#111111';
    ctx.fillRect(6, 7, 1, 1); ctx.fillRect(9, 7, 1, 1); ctx.fillRect(7, 9, 1, 1);
    return canvas.toDataURL();
  }
  drawPrismarineCrystals() {
    const { canvas, ctx } = this.createCanvas(16, 16);
    ctx.fillStyle = '#6aeaea';
    ctx.fillRect(6, 4, 4, 8);
    ctx.fillRect(5, 6, 6, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(7, 5, 2, 1);
    return canvas.toDataURL();
  }
  drawPrismarineShard() {
    const { canvas, ctx } = this.createCanvas(16, 16);
    ctx.fillStyle = '#4acaca';
    ctx.fillRect(5, 5, 6, 7);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(6, 6, 2, 2);
    return canvas.toDataURL();
  }
  drawString() {
    const { canvas, ctx } = this.createCanvas(16, 16);
    ctx.fillStyle = '#e8e8e8';
    ctx.fillRect(4, 7, 8, 2);
    ctx.fillRect(6, 5, 4, 6);
    return canvas.toDataURL();
  }
  drawWoolItem() {
    const { canvas, ctx } = this.createCanvas(16, 16);
    ctx.fillStyle = '#eeeeee';
    ctx.fillRect(4, 5, 8, 6);
    ctx.fillRect(5, 4, 6, 8);
    return canvas.toDataURL();
  }
  drawFeather() {
    const { canvas, ctx } = this.createCanvas(16, 16);
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 10; i++) ctx.fillRect(5 + i, 11 - i, 2, 2);
    ctx.fillStyle = '#d0d0d0';
    for (let i = 0; i < 8; i++) ctx.fillRect(6 + i, 12 - i, 1, 1);
    return canvas.toDataURL();
  }
  drawEgg() {
    const { canvas, ctx } = this.createCanvas(16, 16);
    ctx.fillStyle = '#f0e6d2';
    ctx.fillRect(5, 4, 6, 8);
    ctx.fillRect(4, 6, 8, 4);
    ctx.fillStyle = '#d4b896';
    ctx.fillRect(6, 5, 2, 1);
    return canvas.toDataURL();
  }
  drawLeather() {
    const { canvas, ctx } = this.createCanvas(16, 16);
    ctx.fillStyle = '#9a6a3a';
    ctx.fillRect(4, 5, 8, 7);
    ctx.fillRect(5, 4, 6, 8);
    return canvas.toDataURL();
  }
  drawGunpowder() {
    const { canvas, ctx } = this.createCanvas(16, 16);
    ctx.fillStyle = '#5a5a5a';
    ctx.fillRect(5, 6, 6, 4);
    ctx.fillRect(6, 5, 4, 6);
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(6, 7, 4, 2);
    return canvas.toDataURL();
  }
  drawEnderPearl() {
    const { canvas, ctx } = this.createCanvas(16, 16);
    ctx.fillStyle = '#2ad4a0';
    ctx.fillRect(5, 5, 6, 6);
    ctx.fillRect(4, 6, 8, 4);
    ctx.fillStyle = '#0a9a6a';
    ctx.fillRect(5, 8, 6, 2);
    return canvas.toDataURL();
  }
  drawBone() {
    const { canvas, ctx } = this.createCanvas(16, 16);
    ctx.fillStyle = '#f0f0e0';
    for (let i = 0; i < 9; i++) ctx.fillRect(4 + i, 11 - i, 2, 2);
    ctx.fillRect(5, 7, 3, 3); ctx.fillRect(10, 2, 3, 3);
    return canvas.toDataURL();
  }
  drawSpiderEye() {
    const { canvas, ctx } = this.createCanvas(16, 16);
    ctx.fillStyle = '#7a2a2a';
    ctx.fillRect(4, 6, 8, 4);
    ctx.fillRect(5, 5, 6, 6);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(6, 7, 2, 2);
    ctx.fillStyle = '#111111';
    ctx.fillRect(6, 7, 1, 1);
    return canvas.toDataURL();
  }

  getItemIcon(itemId) {
    if (this.cache[itemId]) {
      return this.cache[itemId];
    }
    return null;
  }
}

export const itemAtlas = new ItemAtlas();
