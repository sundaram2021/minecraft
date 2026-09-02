import { BLOCKS } from './Blocks.js';

export const BIOMES = {
  OCEAN: 'OCEAN',
  BEACH: 'BEACH',
  PLAINS: 'PLAINS',
  FOREST: 'FOREST',
  BIRCH_FOREST: 'BIRCH_FOREST',
  DESERT: 'DESERT',
  MOUNTAINS: 'MOUNTAINS',
  SNOWY_TUNDRA: 'SNOWY_TUNDRA',
  SWAMP: 'SWAMP',
  SAVANNA: 'SAVANNA',
  JUNGLE: 'JUNGLE',
  TAIGA: 'TAIGA',
  DARK_FOREST: 'DARK_FOREST',
  BADLANDS: 'BADLANDS',
};

export const BIOME_DATA = {
  [BIOMES.OCEAN]: {
    name: 'Ocean',
    baseHeight: 32,
    heightVariation: 8,
    surfaceBlock: BLOCKS.GRAVEL,
    subBlock: BLOCKS.DIRT,
    waterBlock: BLOCKS.WATER,
    foliageDensity: 0.0,
    treeDensity: 0.0,
    skyFog: '#5a789a',
    foliageColor: [0.45, 0.70, 0.22],
  },
  [BIOMES.BEACH]: {
    name: 'Beach',
    baseHeight: 62,
    heightVariation: 3,
    surfaceBlock: BLOCKS.SAND,
    subBlock: BLOCKS.SANDSTONE,
    waterBlock: BLOCKS.WATER,
    foliageDensity: 0.01,
    treeDensity: 0.001,
    skyFog: '#81b2d5',
    foliageColor: [0.55, 0.68, 0.24],
  },
  [BIOMES.PLAINS]: {
    name: 'Plains',
    baseHeight: 66,
    heightVariation: 6,
    surfaceBlock: BLOCKS.GRASS,
    subBlock: BLOCKS.DIRT,
    waterBlock: BLOCKS.WATER,
    foliageDensity: 0.28,
    treeDensity: 0.006,
    skyFog: '#78a7ff',
    foliageColor: [0.47, 0.73, 0.20],
  },
  [BIOMES.FOREST]: {
    name: 'Forest',
    baseHeight: 67,
    heightVariation: 9,
    surfaceBlock: BLOCKS.GRASS,
    subBlock: BLOCKS.DIRT,
    waterBlock: BLOCKS.WATER,
    foliageDensity: 0.22,
    treeDensity: 0.038,
    skyFog: '#6da0e8',
    foliageColor: [0.35, 0.61, 0.15],
  },
  [BIOMES.BIRCH_FOREST]: {
    name: 'Birch Forest',
    baseHeight: 68,
    heightVariation: 7,
    surfaceBlock: BLOCKS.GRASS,
    subBlock: BLOCKS.DIRT,
    waterBlock: BLOCKS.WATER,
    foliageDensity: 0.20,
    treeDensity: 0.032,
    skyFog: '#78b0e8',
    foliageColor: [0.49, 0.69, 0.32],
  },
  [BIOMES.DESERT]: {
    name: 'Desert',
    baseHeight: 67,
    heightVariation: 9,
    surfaceBlock: BLOCKS.SAND,
    subBlock: BLOCKS.SANDSTONE,
    waterBlock: BLOCKS.WATER,
    foliageDensity: 0.008,
    cactusDensity: 0.014,
    treeDensity: 0.0,
    skyFog: '#e5ca95',
    foliageColor: [0.61, 0.58, 0.27],
  },
  [BIOMES.MOUNTAINS]: {
    name: 'Extreme Mountains',
    baseHeight: 82,
    heightVariation: 32,
    surfaceBlock: BLOCKS.GRASS,
    subBlock: BLOCKS.STONE,
    waterBlock: BLOCKS.WATER,
    foliageDensity: 0.05,
    treeDensity: 0.008,
    skyFog: '#849fb8',
    foliageColor: [0.43, 0.64, 0.22],
  },
  [BIOMES.SNOWY_TUNDRA]: {
    name: 'Snowy Tundra',
    baseHeight: 67,
    heightVariation: 7,
    surfaceBlock: BLOCKS.SNOW_GRASS,
    subBlock: BLOCKS.DIRT,
    waterBlock: BLOCKS.ICE,
    foliageDensity: 0.02,
    treeDensity: 0.015,
    skyFog: '#a0b8cc',
    foliageColor: [0.50, 0.70, 0.51],
  },
  [BIOMES.SWAMP]: {
    name: 'Swamp',
    baseHeight: 62,
    heightVariation: 4,
    surfaceBlock: BLOCKS.GRASS,
    subBlock: BLOCKS.DIRT,
    waterBlock: BLOCKS.WATER,
    foliageDensity: 0.35,
    treeDensity: 0.018,
    skyFog: '#6a7d8a',
    foliageColor: [0.35, 0.55, 0.18],
  },
  [BIOMES.SAVANNA]: {
    name: 'Savanna',
    baseHeight: 68,
    heightVariation: 10,
    surfaceBlock: BLOCKS.GRASS,
    subBlock: BLOCKS.DIRT,
    waterBlock: BLOCKS.WATER,
    foliageDensity: 0.06,
    treeDensity: 0.012,
    skyFog: '#d4b896',
    foliageColor: [0.65, 0.62, 0.24],
  },
  [BIOMES.JUNGLE]: {
    name: 'Jungle',
    baseHeight: 70,
    heightVariation: 12,
    surfaceBlock: BLOCKS.GRASS,
    subBlock: BLOCKS.DIRT,
    waterBlock: BLOCKS.WATER,
    foliageDensity: 0.32,
    treeDensity: 0.055,
    skyFog: '#5da85d',
    foliageColor: [0.22, 0.65, 0.18],
  },
  [BIOMES.TAIGA]: {
    name: 'Taiga',
    baseHeight: 69,
    heightVariation: 8,
    surfaceBlock: BLOCKS.GRASS,
    subBlock: BLOCKS.DIRT,
    waterBlock: BLOCKS.WATER,
    foliageDensity: 0.14,
    treeDensity: 0.03,
    skyFog: '#8cb5c0',
    foliageColor: [0.30, 0.60, 0.32],
  },
  [BIOMES.DARK_FOREST]: {
    name: 'Dark Forest',
    baseHeight: 68,
    heightVariation: 8,
    surfaceBlock: BLOCKS.GRASS,
    subBlock: BLOCKS.DIRT,
    waterBlock: BLOCKS.WATER,
    foliageDensity: 0.18,
    treeDensity: 0.065,
    skyFog: '#5a6b4a',
    foliageColor: [0.20, 0.45, 0.15],
  },
  [BIOMES.BADLANDS]: {
    name: 'Badlands',
    baseHeight: 72,
    heightVariation: 14,
    surfaceBlock: BLOCKS.TERRACOTTA,
    subBlock: BLOCKS.RED_TERRACOTTA,
    waterBlock: BLOCKS.WATER,
    foliageDensity: 0.01,
    cactusDensity: 0.008,
    treeDensity: 0.001,
    skyFog: '#c98a5a',
    foliageColor: [0.70, 0.50, 0.25],
  },
};

export class BiomeGenerator {
  constructor(noise) {
    this.noise = noise;
  }

  getBiome(x, z) {
    const scale = 0.0025;
    const continentalness = this.noise.noise2D(x * scale, z * scale);
    const temp = this.noise.noise2D((x + 7000) * scale * 0.8, (z + 7000) * scale * 0.8);
    const humidity = this.noise.noise2D((x - 7000) * scale * 0.8, (z - 7000) * scale * 0.8);
    const weirdness = this.noise.noise2D(x * 0.0015 + 3000, z * 0.0015 + 3000);

    if (continentalness < -0.38) return BIOMES.OCEAN;
    if (continentalness < -0.24) return BIOMES.BEACH;
    if (continentalness > 0.50) return BIOMES.MOUNTAINS;
    if (weirdness > 0.55 && continentalness > 0.15) return BIOMES.BADLANDS;

    if (temp < -0.35) {
      if (humidity > 0.1) return BIOMES.TAIGA;
      return BIOMES.SNOWY_TUNDRA;
    }
    if (temp > 0.40 && humidity < -0.15) {
      if (humidity < -0.35) return BIOMES.DESERT;
      return BIOMES.SAVANNA;
    }
    if (humidity > 0.35 && temp > 0.15) {
      if (humidity > 0.55 && temp > 0.25) return BIOMES.JUNGLE;
      if (temp < 0.35) return BIOMES.SWAMP;
      return BIOMES.FOREST;
    }
    if (humidity > 0.22) {
      if (temp > 0.15) return BIOMES.FOREST;
      if (weirdness > 0.3) return BIOMES.DARK_FOREST;
      return BIOMES.BIRCH_FOREST;
    }
    if (humidity < -0.05 && temp > 0.3) return BIOMES.SAVANNA;

    return BIOMES.PLAINS;
  }

  getBiomeData(x, z) {
    const biome = this.getBiome(x, z);
    return { type: biome, ...BIOME_DATA[biome] };
  }
}
