import { BLOCKS } from '../world/Blocks.js';

/**
 * VoxelArtPresets.js
 * Contains pixel art matrices and procedural builders for iconic logos and shapes,
 * specifically featuring the OpenAI logo, Creeper face, Minecraft sword, Heart, and Star.
 */

// 1. OpenAI 22x22 Pixel Matrix (B = Black Wool background, W = White Wool spiral logo, . = Air)
export const OPENAI_LOGO_MATRIX = [
  '........BBBBBBBB........',
  '......BBBBBBBBBBBB......',
  '....BBBBBBBBBBBBBBBB....',
  '...BBBBBBWWWWWWBBBBBB...',
  '..BBBBBWWWWWWWWWWBBBBB..',
  '..BBBBWWWW...WWWWWBBBB..',
  '.BBBBWWWW.....WWWWWBBBB.',
  '.BBBWWWW..WWW..WWWWWBBB.',
  'BBBBWWW..WWWWW..WWWWBBBB',
  'BBBW.....WWWWWW..WWWWBBB',
  'BBBW.WWW..WWWWWW.WWWWBBB',
  'BBBW.WWWW..WWWW..WWWWBBB',
  'BBBW.WWWWW..WW..WWWWWBBB',
  'BBBW.WWWWWW....WWWWWWBBB',
  'BBBB.WWWWWWWWWWWWWWWWBBB',
  '.BBB..WWWWWWWWWWWWWWBBB.',
  '.BBBB..WWWWWWWWWWWWBBBB.',
  '..BBBB...WWWWWWWWBBBBB..',
  '..BBBBB....WWWWBBBBBBB..',
  '...BBBBBB....BBBBBBBB...',
  '....BBBBBBBBBBBBBBBB....',
  '......BBBBBBBBBBBB......',
  '........BBBBBBBB........',
];

// 2. Creeper Face 10x10 Matrix (G = Lime Wool, D = Dark Green Wool, B = Black Wool)
export const CREEPER_FACE_MATRIX = [
  'GGGGGGGGGG',
  'GGGGGGGGGG',
  'GGDDDDDDGG',
  'GDBBGGDBBG',
  'GDBBGGDBBG',
  'GGGGDDGGGG',
  'GGGDDDGDGG',
  'GGDBBBBDGG',
  'GGDBBBBDGG',
  'GGDBGGDBGG',
  'GGGGGGGGGG',
];

// 3. Pixel Heart 11x10 Matrix (R = Red Wool, P = Pink/White Wool highlight, . = Air)
export const HEART_MATRIX = [
  '..RR...RR..',
  '.RPPR.RRRR.',
  'RPPPPRRRRRR',
  'RRRRRRRRRRR',
  'RRRRRRRRRRR',
  '.RRRRRRRRR.',
  '..RRRRRRR..',
  '...RRRRR...',
  '....RRR....',
  '.....R.....',
];

// 4. Pixel Sword 16x16 Matrix (D = Diamond, O = Obsidian, W = Oak Planks, . = Air)
export const SWORD_MATRIX = [
  '..............OD',
  '.............ODD',
  '............ODD.',
  '...........ODD..',
  '..........ODD...',
  '.........ODD....',
  '..O.....ODD.....',
  '..OO...ODD......',
  '..OWO.ODD.......',
  '...OWODD........',
  '...OWO..........',
  '....W...........',
  '....O...........',
];

// 5. Pixel Star 11x11 Matrix (Y = Gold/Yellow, . = Air)
export const STAR_MATRIX = [
  '.....Y.....',
  '....YYY....',
  '....YYY....',
  'YYYYYYYYYYY',
  '.YYYYYYYYY.',
  '..YYYYYYY..',
  '..YYYYYYY..',
  '.YYY...YYY.',
  'YY.......YY',
  'Y.........Y',
];

/**
 * Procedural generator for a mathematically precise OpenAI spiral vortex logo.
 * Creates concentric interlocking curved vanes with customizable size.
 * @param {number} size - Grid diameter in blocks (default 24)
 * @returns {string[]} Matrix lines with 'B', 'W', and '.'
 */
export function generateOpenAILogoMatrix(size = 24) {
  const matrix = [];
  const radius = size / 2 - 0.5;
  const center = size / 2 - 0.5;

  for (let y = 0; y < size; y++) {
    let line = '';
    for (let x = 0; x < size; x++) {
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > radius) {
        line += '.';
        continue;
      }

      // Check OpenAI 6-fold rotational symmetry spiral
      const angle = Math.atan2(dy, dx) + Math.PI; // 0 to 2PI
      const arms = 6;
      const sector = (angle * arms / (Math.PI * 2)) % 1;
      const spiralR = dist / radius;

      // Mathematical spiral equation matching OpenAI knot geometry
      const wave = Math.sin((angle * arms) - spiralR * 5.2);
      const isArm = (wave > 0.15 && spiralR > 0.22 && spiralR < 0.88);
      const isInnerCore = (spiralR < 0.20 && spiralR > 0.08);

      if (isArm || isInnerCore) {
        line += 'W';
      } else {
        line += 'B';
      }
    }
    matrix.push(line);
  }
  return matrix;
}

/**
 * Converts a 2D string matrix into an array of voxel block objects.
 * Supports horizontal (floor) or vertical (billboard) orientation.
 *
 * @param {string[]} matrix - Array of strings representing pixel rows
 * @param {Object} palette - Char to blockId mapping (e.g. { 'W': BLOCKS.WHITE_WOOL })
 * @param {Object} origin - { x, y, z } reference point
 * @param {string} plane - 'vertical_xy' | 'vertical_zy' | 'horizontal_xz'
 * @param {number} scale - Size per pixel block (e.g. 1 or 2)
 * @returns {Array<{ x: number, y: number, z: number, blockId: number, sound: string }>}
 */
export function matrixToVoxelBlocks(matrix, palette, origin, plane = 'vertical_xy', scale = 1) {
  const blocks = [];
  const height = matrix.length;
  const width = Math.max(...matrix.map((r) => r.length));

  const halfW = Math.floor((width * scale) / 2);

  for (let row = 0; row < height; row++) {
    const line = matrix[row];
    const invertedY = height - 1 - row; // Render right-side up

    for (let col = 0; col < line.length; col++) {
      const char = line[col];
      if (char === '.' || char === ' ') continue; // Skip transparent voxels

      const blockId = palette[char] !== undefined ? palette[char] : BLOCKS.WHITE_WOOL;

      for (let sx = 0; sx < scale; sx++) {
        for (let sy = 0; sy < scale; sy++) {
          let bx, by, bz;

          if (plane === 'horizontal_xz') {
            bx = origin.x - halfW + (col * scale + sx);
            by = origin.y;
            bz = origin.z - halfW + (row * scale + sy);
          } else if (plane === 'vertical_zy') {
            bx = origin.x;
            by = origin.y + (invertedY * scale + sy);
            bz = origin.z - halfW + (col * scale + sx);
          } else {
            // Default: vertical_xy
            bx = origin.x - halfW + (col * scale + sx);
            by = origin.y + (invertedY * scale + sy);
            bz = origin.z;
          }

          blocks.push({
            x: Math.round(bx),
            y: Math.round(by),
            z: Math.round(bz),
            blockId,
            sound: 'cloth',
          });
        }
      }
    }
  }

  return blocks;
}

/**
 * Standard palette mappings for preset names.
 */
export const DEFAULT_PALETTES = {
  openai_logo: {
    'W': BLOCKS.WHITE_WOOL,
    'B': BLOCKS.BLACK_WOOL,
    'G': BLOCKS.GLOWSTONE,
  },
  creeper_face: {
    'G': BLOCKS.LIME_WOOL,
    'D': BLOCKS.GREEN_WOOL,
    'B': BLOCKS.BLACK_WOOL,
  },
  heart: {
    'R': BLOCKS.RED_WOOL,
    'P': BLOCKS.PINK_WOOL,
  },
  sword: {
    'D': BLOCKS.DIAMOND_BLOCK,
    'O': BLOCKS.OBSIDIAN,
    'W': BLOCKS.OAK_PLANKS,
  },
  star: {
    'Y': BLOCKS.GOLD_BLOCK,
  },
};
