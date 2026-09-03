import * as THREE from 'three';
import { BLOCKS, getBlockDef } from '../world/Blocks.js';
import { sound } from '../audio/SoundSynthesizer.js';

const NATURAL_BLOCK_ALIASES = {
  // Woods
  wood: BLOCKS.OAK_PLANKS,
  plank: BLOCKS.OAK_PLANKS,
  planks: BLOCKS.OAK_PLANKS,
  oak: BLOCKS.OAK_PLANKS,
  oak_plank: BLOCKS.OAK_PLANKS,
  oak_planks: BLOCKS.OAK_PLANKS,
  log: BLOCKS.OAK_LOG,
  logs: BLOCKS.OAK_LOG,
  oak_log: BLOCKS.OAK_LOG,
  leaves: BLOCKS.OAK_LEAVES,
  leaf: BLOCKS.OAK_LEAVES,
  spruce: BLOCKS.SPRUCE_PLANKS,
  spruce_plank: BLOCKS.SPRUCE_PLANKS,
  spruce_planks: BLOCKS.SPRUCE_PLANKS,
  spruce_log: BLOCKS.SPRUCE_LOG,
  birch: BLOCKS.BIRCH_PLANKS,
  birch_plank: BLOCKS.BIRCH_PLANKS,
  birch_planks: BLOCKS.BIRCH_PLANKS,
  birch_log: BLOCKS.BIRCH_LOG,

  // Stones & Bricks
  stone: BLOCKS.STONE,
  cobble: BLOCKS.COBBLESTONE,
  cobblestone: BLOCKS.COBBLESTONE,
  mossy_cobble: BLOCKS.MOSSY_COBBLESTONE,
  mossy_cobblestone: BLOCKS.MOSSY_COBBLESTONE,
  brick: BLOCKS.BRICKS,
  bricks: BLOCKS.BRICKS,
  stone_brick: BLOCKS.STONE_BRICKS,
  stone_bricks: BLOCKS.STONE_BRICKS,
  smooth_stone: BLOCKS.SMOOTH_STONE,
  sandstone: BLOCKS.SANDSTONE,
  smooth_sandstone: BLOCKS.SMOOTH_SANDSTONE,
  obsidian: BLOCKS.OBSIDIAN,
  bedrock: BLOCKS.BEDROCK,
  gravel: BLOCKS.GRAVEL,
  sand: BLOCKS.SAND,
  clay: BLOCKS.CLAY,
  dirt: BLOCKS.DIRT,
  grass: BLOCKS.GRASS,
  grass_block: BLOCKS.GRASS,

  // Glass & Lights
  glass: BLOCKS.GLASS,
  glass_block: BLOCKS.GLASS,
  torch: BLOCKS.TORCH,
  torches: BLOCKS.TORCH,
  glowstone: BLOCKS.GLOWSTONE,
  glow_stone: BLOCKS.GLOWSTONE,
  lamp: BLOCKS.SEA_LANTERN,
  lantern: BLOCKS.SEA_LANTERN,
  sea_lantern: BLOCKS.SEA_LANTERN,

  // Ores & Metals
  iron: BLOCKS.IRON_BLOCK,
  iron_block: BLOCKS.IRON_BLOCK,
  gold: BLOCKS.GOLD_BLOCK,
  gold_block: BLOCKS.GOLD_BLOCK,
  diamond: BLOCKS.DIAMOND_BLOCK,
  diamond_block: BLOCKS.DIAMOND_BLOCK,
  emerald: BLOCKS.EMERALD_BLOCK,
  emerald_block: BLOCKS.EMERALD_BLOCK,
  lapis: BLOCKS.LAPIS_BLOCK,
  lapis_block: BLOCKS.LAPIS_BLOCK,
  redstone: BLOCKS.REDSTONE_BLOCK,
  redstone_block: BLOCKS.REDSTONE_BLOCK,
  coal: BLOCKS.COAL_BLOCK,
  coal_block: BLOCKS.COAL_BLOCK,
  copper: BLOCKS.COPPER_BLOCK,
  copper_block: BLOCKS.COPPER_BLOCK,
  quartz: BLOCKS.QUARTZ_BLOCK,
  quartz_block: BLOCKS.QUARTZ_BLOCK,
  prismarine: BLOCKS.PRISMARINE,

  // Wools & Colors
  wool: BLOCKS.WHITE_WOOL,
  white_wool: BLOCKS.WHITE_WOOL,
  white: BLOCKS.WHITE_WOOL,
  red_wool: BLOCKS.RED_WOOL,
  red: BLOCKS.RED_WOOL,
  blue_wool: BLOCKS.BLUE_WOOL,
  blue: BLOCKS.BLUE_WOOL,
  green_wool: BLOCKS.GREEN_WOOL,
  green: BLOCKS.GREEN_WOOL,
  yellow_wool: BLOCKS.YELLOW_WOOL,
  yellow: BLOCKS.YELLOW_WOOL,
  black_wool: BLOCKS.BLACK_WOOL,
  black: BLOCKS.BLACK_WOOL,
  orange_wool: BLOCKS.ORANGE_WOOL,
  orange: BLOCKS.ORANGE_WOOL,
  purple_wool: BLOCKS.PURPLE_WOOL,
  purple: BLOCKS.PURPLE_WOOL,
  pink_wool: BLOCKS.PINK_WOOL,
  pink: BLOCKS.PINK_WOOL,
  cyan_wool: BLOCKS.CYAN_WOOL,
  cyan: BLOCKS.CYAN_WOOL,
  gray_wool: BLOCKS.GRAY_WOOL,
  gray: BLOCKS.GRAY_WOOL,
  grey: BLOCKS.GRAY_WOOL,
  lime_wool: BLOCKS.LIME_WOOL,
  lime: BLOCKS.LIME_WOOL,
  brown_wool: BLOCKS.BROWN_WOOL,
  brown: BLOCKS.BROWN_WOOL,

  // Utility & Misc
  water: BLOCKS.WATER,
  lava: BLOCKS.LAVA,
  ice: BLOCKS.ICE,
  snow: BLOCKS.SNOW_BLOCK,
  snow_block: BLOCKS.SNOW_BLOCK,
  tnt: BLOCKS.TNT,
  bookshelf: BLOCKS.BOOKSHELF,
  bookshelves: BLOCKS.BOOKSHELF,
  chest: BLOCKS.CHEST,
  crafting_table: BLOCKS.CRAFTING_TABLE,
  furnace: BLOCKS.FURNACE,
  iron_bars: BLOCKS.IRON_BARS,
  fence: BLOCKS.OAK_FENCE,
  air: BLOCKS.AIR,
};

/**
 * Helper to resolve block ID from name (string) or number.
 */
export function resolveBlockId(blockInput) {
  if (typeof blockInput === 'number') return blockInput;
  if (!blockInput || typeof blockInput !== 'string') return BLOCKS.STONE;

  const normalized = blockInput.toLowerCase().trim().replace(/[\s-]/g, '_');
  if (NATURAL_BLOCK_ALIASES[normalized] !== undefined) {
    return NATURAL_BLOCK_ALIASES[normalized];
  }

  const upper = normalized.toUpperCase();
  if (BLOCKS[upper] !== undefined) return BLOCKS[upper];

  // Try matching with suffix
  if (BLOCKS[upper + '_BLOCK'] !== undefined) return BLOCKS[upper + '_BLOCK'];
  if (BLOCKS[upper + '_WOOL'] !== undefined) return BLOCKS[upper + '_WOOL'];

  // Match case-insensitively across BLOCKS keys
  for (const [k, v] of Object.entries(BLOCKS)) {
    if (k.toLowerCase() === normalized) return v;
  }

  return BLOCKS.STONE;
}

/**
 * Helper to get block name from ID
 */
export function getBlockName(blockId) {
  for (const [k, v] of Object.entries(BLOCKS)) {
    if (v === blockId) return k.toLowerCase();
  }
  return `block_${blockId}`;
}

/**
 * Registers the complete suite of Minecraft WebMCP tools on the ModelContext.
 * @param {Object} modelContext - document.modelContext or WebMCP polyfill
 * @param {import('../core/Game.js').Game} game - Active Game instance
 */
export async function registerMinecraftWebMCPTools(modelContext, game) {
  if (!modelContext || !game) return;

  // History buffer for undo support
  game.webMcpUndoStack = game.webMcpUndoStack || [];

  const pushUndoBatch = (modifiedBlocks) => {
    if (modifiedBlocks && modifiedBlocks.length > 0) {
      game.webMcpUndoStack.push(modifiedBlocks);
      if (game.webMcpUndoStack.length > 20) game.webMcpUndoStack.shift();
    }
  };

  // Helper to load chunks around a point or area
  const ensureChunksLoaded = (minX, maxX, minZ, maxZ) => {
    const minCx = Math.floor(minX / 16);
    const maxCx = Math.floor(maxX / 16);
    const minCz = Math.floor(minZ / 16);
    const maxCz = Math.floor(maxZ / 16);
    for (let cz = minCz; cz <= maxCz; cz++) {
      for (let cx = minCx; cx <= maxCx; cx++) {
        game.chunkManager.loadChunk(cx, cz);
      }
    }
  };

  // -------------------------------------------------------------
  // 1. NAVIGATION & EXPLORATION TOOLS
  // -------------------------------------------------------------

  await modelContext.registerTool({
    name: 'get_player_state',
    title: 'Get Player State',
    description: 'Returns the current position, orientation, mode, health, inventory hotbar, and surroundings of the player.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    annotations: { readOnlyHint: true },
    execute: async () => {
      const pos = game.player.physics.position;
      const biome = game.biomeGen.getBiomeData(Math.floor(pos.x), Math.floor(pos.z));
      const selected = game.player.getSelectedSlot();

      // Determine cardinal facing direction from yaw
      const yawDeg = ((THREE.MathUtils.radToDeg(game.cameraController.yaw) % 360) + 360) % 360;
      let facing = 'North';
      if (yawDeg >= 45 && yawDeg < 135) facing = 'West';
      else if (yawDeg >= 135 && yawDeg < 225) facing = 'South';
      else if (yawDeg >= 225 && yawDeg < 315) facing = 'East';

      return {
        success: true,
        position: {
          x: Number(pos.x.toFixed(2)),
          y: Number(pos.y.toFixed(2)),
          z: Number(pos.z.toFixed(2)),
        },
        facing,
        yawDegrees: Number(yawDeg.toFixed(1)),
        pitchDegrees: Number(THREE.MathUtils.radToDeg(game.cameraController.pitch).toFixed(1)),
        gameMode: game.player.gameMode,
        isFlying: game.player.physics.isFlying,
        onGround: game.player.physics.onGround,
        inWater: game.player.physics.inWater,
        health: game.player.health,
        maxHealth: game.player.maxHealth,
        hunger: game.player.hunger,
        biome: biome.name,
        timeOfDay: game.skybox.timeOfDay,
        heldItem: selected ? { id: selected.id, name: typeof selected.id === 'number' ? getBlockName(selected.id) : selected.id, count: selected.count } : null,
      };
    },
  });

  await modelContext.registerTool({
    name: 'move_player',
    title: 'Move Player',
    description: 'Moves the player in a specified direction relative to facing angle (forward, backward, left, right, jump) by a given distance or steps.',
    inputSchema: {
      type: 'object',
      properties: {
        direction: {
          type: 'string',
          enum: ['forward', 'backward', 'left', 'right', 'jump'],
          description: 'Direction to move.',
        },
        distance: {
          type: 'number',
          description: 'Distance in blocks to travel (default 2 blocks).',
          default: 2,
        },
      },
      required: ['direction'],
    },
    execute: async ({ direction, distance = 2 }) => {
      const dist = Math.max(0.5, Math.min(distance || 2, 20));
      const yaw = game.cameraController.yaw;
      const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw)).normalize();
      const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw)).normalize();

      let moveVector = new THREE.Vector3();
      if (direction === 'forward') moveVector.copy(forward).multiplyScalar(dist);
      else if (direction === 'backward') moveVector.copy(forward).multiplyScalar(-dist);
      else if (direction === 'left') moveVector.copy(right).multiplyScalar(-dist);
      else if (direction === 'right') moveVector.copy(right).multiplyScalar(dist);
      else if (direction === 'jump') {
        game.player.physics.velocity.y = game.player.physics.jumpForce;
        game.player.physics.onGround = false;
        sound.playFootstep('grass');
        game.broadcastUI();
        return { success: true, message: 'Player jumped.' };
      }

      // If flying or creative, direct move
      if (game.player.physics.isFlying) {
        game.player.physics.position.add(moveVector);
      } else {
        // Step with ground clamping
        const newX = game.player.physics.position.x + moveVector.x;
        const newZ = game.player.physics.position.z + moveVector.z;
        const groundY = game.worldGen.getHeight(newX, newZ);
        const targetY = Math.max(groundY + 1.0, game.player.physics.position.y);

        game.player.physics.position.set(newX, targetY, newZ);
        game.player.physics.velocity.set(0, 0, 0);
      }

      sound.playFootstep('grass');
      game.broadcastUI();

      return {
        success: true,
        message: `Moved ${direction} by ${dist} blocks.`,
        newPosition: {
          x: Number(game.player.physics.position.x.toFixed(2)),
          y: Number(game.player.physics.position.y.toFixed(2)),
          z: Number(game.player.physics.position.z.toFixed(2)),
        },
      };
    },
  });

  await modelContext.registerTool({
    name: 'look_at',
    title: 'Look At / Rotate View',
    description: 'Rotates player camera to specific pitch/yaw degrees, or looks towards a world coordinate (x, y, z), or uses a preset like "turn_around", "north", "south", "east", "west", "up", "down".',
    inputSchema: {
      type: 'object',
      properties: {
        preset: {
          type: 'string',
          enum: ['turn_around', 'north', 'south', 'east', 'west', 'up', 'down', 'level'],
          description: 'Quick rotation preset.',
        },
        pitch: {
          type: 'number',
          description: 'Camera pitch in degrees (-89 looking down to 89 looking up).',
        },
        yaw: {
          type: 'number',
          description: 'Camera yaw in degrees (0 to 360).',
        },
        targetPos: {
          type: 'object',
          properties: {
            x: { type: 'number' },
            y: { type: 'number' },
            z: { type: 'number' },
          },
          description: 'World coordinate to aim the camera at.',
        },
      },
    },
    execute: async ({ preset, pitch, yaw, targetPos }) => {
      if (preset === 'turn_around') {
        game.cameraController.yaw += Math.PI;
      } else if (preset === 'north') {
        game.cameraController.yaw = 0;
      } else if (preset === 'south') {
        game.cameraController.yaw = Math.PI;
      } else if (preset === 'east') {
        game.cameraController.yaw = -Math.PI / 2;
      } else if (preset === 'west') {
        game.cameraController.yaw = Math.PI / 2;
      } else if (preset === 'up') {
        game.cameraController.pitch = Math.PI / 3;
      } else if (preset === 'down') {
        game.cameraController.pitch = -Math.PI / 3;
      } else if (preset === 'level') {
        game.cameraController.pitch = 0;
      }

      if (typeof yaw === 'number') {
        game.cameraController.yaw = THREE.MathUtils.degToRad(yaw);
      }
      if (typeof pitch === 'number') {
        const rad = THREE.MathUtils.degToRad(pitch);
        const maxPitch = Math.PI / 2 - 0.02;
        game.cameraController.pitch = Math.max(-maxPitch, Math.min(maxPitch, rad));
      }

      if (targetPos) {
        const eye = game.player.physics.getEyePosition();
        const dx = targetPos.x - eye.x;
        const dy = targetPos.y - eye.y;
        const dz = targetPos.z - eye.z;
        const horiz = Math.sqrt(dx * dx + dz * dz);
        game.cameraController.yaw = Math.atan2(-dx, -dz);
        game.cameraController.pitch = Math.atan2(dy, horiz);
      }

      game.cameraController.euler.x = game.cameraController.pitch;
      game.cameraController.euler.y = game.cameraController.yaw;
      game.camera.quaternion.setFromEuler(game.cameraController.euler);
      game.broadcastUI();

      return {
        success: true,
        pitchDegrees: Number(THREE.MathUtils.radToDeg(game.cameraController.pitch).toFixed(1)),
        yawDegrees: Number((((THREE.MathUtils.radToDeg(game.cameraController.yaw) % 360) + 360) % 360).toFixed(1)),
      };
    },
  });

  await modelContext.registerTool({
    name: 'set_flying',
    title: 'Toggle Flying / Ascend / Descend',
    description: 'Controls creative flying state. In creative mode, allows hovering, ascending, or descending.',
    inputSchema: {
      type: 'object',
      properties: {
        flying: {
          type: 'boolean',
          description: 'Enable or disable flight mode.',
        },
        direction: {
          type: 'string',
          enum: ['up', 'down'],
          description: 'Ascend or descend in flight.',
        },
        blocks: {
          type: 'number',
          description: 'Number of blocks to ascend/descend (default 3).',
          default: 3,
        },
      },
    },
    execute: async ({ flying, direction, blocks = 3 }) => {
      if (game.player.gameMode !== 'creative') {
        game.player.gameMode = 'creative'; // Auto-unlock creative mode for AI flight
      }

      if (flying !== undefined) {
        game.player.physics.isFlying = Boolean(flying);
        game.player.physics.velocity.set(0, 0, 0);
      } else if (!game.player.physics.isFlying) {
        game.player.physics.isFlying = true;
      }

      if (direction === 'up') {
        game.player.physics.position.y += Math.abs(blocks || 3);
      } else if (direction === 'down') {
        game.player.physics.position.y = Math.max(2, game.player.physics.position.y - Math.abs(blocks || 3));
      }

      game.player.physics.velocity.set(0, 0, 0);
      game.broadcastUI();

      return {
        success: true,
        isFlying: game.player.physics.isFlying,
        altitude: Number(game.player.physics.position.y.toFixed(2)),
      };
    },
  });

  await modelContext.registerTool({
    name: 'teleport',
    title: 'Teleport Player',
    description: 'Instantly teleports the player to coordinates (x, y, z) or by a relative offset (dx, dy, dz).',
    inputSchema: {
      type: 'object',
      properties: {
        x: { type: 'number', description: 'Target X coordinate.' },
        y: { type: 'number', description: 'Target Y coordinate.' },
        z: { type: 'number', description: 'Target Z coordinate.' },
        dx: { type: 'number', description: 'Relative delta X.' },
        dy: { type: 'number', description: 'Relative delta Y.' },
        dz: { type: 'number', description: 'Relative delta Z.' },
      },
    },
    execute: async ({ x, y, z, dx, dy, dz }) => {
      let targetX = game.player.physics.position.x;
      let targetY = game.player.physics.position.y;
      let targetZ = game.player.physics.position.z;

      if (typeof x === 'number') targetX = x;
      if (typeof y === 'number') targetY = y;
      if (typeof z === 'number') targetZ = z;

      if (typeof dx === 'number') targetX += dx;
      if (typeof dy === 'number') targetY += dy;
      if (typeof dz === 'number') targetZ += dz;

      ensureChunksLoaded(targetX - 16, targetX + 16, targetZ - 16, targetZ + 16);
      game.player.physics.position.set(targetX, targetY, targetZ);
      game.player.physics.velocity.set(0, 0, 0);
      game.broadcastUI();

      return {
        success: true,
        position: {
          x: Number(targetX.toFixed(2)),
          y: Number(targetY.toFixed(2)),
          z: Number(targetZ.toFixed(2)),
        },
      };
    },
  });

  // -------------------------------------------------------------
  // 2. GAME MODE & ENVIRONMENT CONTROLS
  // -------------------------------------------------------------

  await modelContext.registerTool({
    name: 'set_game_mode',
    title: 'Set Game Mode',
    description: 'Switches between "creative" and "survival" modes. In creative mode, flying and instant mining are unlocked. Building works in both modes.',
    inputSchema: {
      type: 'object',
      properties: {
        mode: {
          type: 'string',
          enum: ['creative', 'survival'],
          description: 'Game mode to set.',
        },
      },
      required: ['mode'],
    },
    execute: async ({ mode }) => {
      if (mode !== 'creative' && mode !== 'survival') {
        throw new Error('Invalid mode. Must be "creative" or "survival".');
      }

      game.player.gameMode = mode;
      if (mode === 'survival') {
        game.player.physics.isFlying = false;
      } else {
        game.player.health = 20;
        game.player.hunger = 20;
        game.player.oxygen = 20;
      }

      sound.playLevelUp?.();
      game.broadcastUI();

      return {
        success: true,
        mode,
        message: mode === 'creative'
          ? 'Switched to Creative Mode: Flying and instant block mining unlocked.'
          : 'Switched to Survival Mode: Survival damage and standard mining speed enabled.',
      };
    },
  });

  await modelContext.registerTool({
    name: 'set_time_of_day',
    title: 'Set Time of Day',
    description: 'Sets the sun/moon time cycle. Accepts presets like "day", "noon", "sunset", "night", "midnight", or a float between 0.0 and 1.0.',
    inputSchema: {
      type: 'object',
      properties: {
        time: {
          type: 'string',
          description: 'Time string ("day", "noon", "sunset", "night", "midnight") or a decimal (0.0 to 1.0).',
        },
      },
      required: ['time'],
    },
    execute: async ({ time }) => {
      let t = 0.25;
      const lower = String(time).toLowerCase();
      if (lower === 'day' || lower === 'morning') t = 0.25;
      else if (lower === 'noon' || lower === 'midday') t = 0.35;
      else if (lower === 'sunset' || lower === 'dusk') t = 0.50;
      else if (lower === 'night') t = 0.78;
      else if (lower === 'midnight') t = 0.90;
      else if (!isNaN(Number(time))) t = Math.max(0, Math.min(1, Number(time)));

      game.skybox.setTimeOfDay(t);
      game.broadcastUI();

      return { success: true, timeOfDay: t };
    },
  });

  await modelContext.registerTool({
    name: 'set_weather',
    title: 'Set Weather',
    description: 'Changes atmospheric weather to "clear", "rain", or "snow".',
    inputSchema: {
      type: 'object',
      properties: {
        weather: {
          type: 'string',
          enum: ['clear', 'rain', 'snow'],
          description: 'Weather condition.',
        },
      },
      required: ['weather'],
    },
    execute: async ({ weather }) => {
      if (weather === 'rain') {
        game.weather.isRaining = true;
        game.weather.isSnowing = false;
      } else if (weather === 'snow') {
        game.weather.isRaining = false;
        game.weather.isSnowing = true;
      } else {
        game.weather.isRaining = false;
        game.weather.isSnowing = false;
      }
      game.broadcastUI();
      return { success: true, weather };
    },
  });

  // -------------------------------------------------------------
  // 3. INVENTORY, TOOLS & BLOCK INSPECTION
  // -------------------------------------------------------------

  await modelContext.registerTool({
    name: 'list_available_blocks',
    title: 'List Available Blocks',
    description: 'Lists all available blocks in the game with IDs, names, and categories (Wools, Building, Ores, Nature, Lights).',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['all', 'wool', 'wood', 'stone', 'ore', 'nature', 'light'],
          description: 'Filter category.',
          default: 'all',
        },
      },
    },
    annotations: { readOnlyHint: true },
    execute: async ({ category = 'all' }) => {
      const results = [];
      for (const [name, id] of Object.entries(BLOCKS)) {
        if (id === 0) continue;
        const lower = name.toLowerCase();

        let match = true;
        if (category === 'wool' && !lower.includes('wool')) match = false;
        else if (category === 'wood' && !lower.includes('log') && !lower.includes('plank')) match = false;
        else if (category === 'stone' && !lower.includes('stone') && !lower.includes('cobble') && !lower.includes('brick')) match = false;
        else if (category === 'ore' && !lower.includes('ore') && !lower.includes('diamond') && !lower.includes('gold') && !lower.includes('iron') && !lower.includes('emerald')) match = false;
        else if (category === 'light' && !lower.includes('torch') && !lower.includes('glowstone') && !lower.includes('lantern')) match = false;

        if (match) {
          const def = getBlockDef(id);
          results.push({
            id,
            name: lower,
            solid: def.solid,
            sound: def.sound || 'stone',
          });
        }
      }
      return { total: results.length, blocks: results };
    },
  });

  await modelContext.registerTool({
    name: 'list_inventory',
    title: 'List Inventory',
    description: 'Lists all 36 player inventory slots, current hotbar slot selection, and item quantities.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    annotations: { readOnlyHint: true },
    execute: async () => {
      const items = game.player.inventory.map((slot, index) => {
        if (!slot) return null;
        return {
          slotIndex: index,
          isHotbar: index < 9,
          id: slot.id,
          name: typeof slot.id === 'number' ? getBlockName(slot.id) : slot.id,
          count: slot.count,
          durability: slot.durability,
        };
      }).filter(Boolean);

      return {
        selectedHotbarIndex: game.player.selectedHotbarIndex,
        totalItems: items.length,
        items,
      };
    },
  });

  await modelContext.registerTool({
    name: 'select_hotbar_slot',
    title: 'Select Hotbar Slot',
    description: 'Selects an active hotbar slot (0 to 8) or selects the slot containing a specific block/item name.',
    inputSchema: {
      type: 'object',
      properties: {
        slotIndex: {
          type: 'integer',
          minimum: 0,
          maximum: 8,
          description: 'Hotbar slot index (0 to 8).',
        },
        itemName: {
          type: 'string',
          description: 'Name of the item/block to find and select in the hotbar (e.g. "pickaxe", "black_wool").',
        },
      },
    },
    execute: async ({ slotIndex, itemName }) => {
      if (typeof slotIndex === 'number' && slotIndex >= 0 && slotIndex <= 8) {
        game.inputManager.onHotbarSelect(slotIndex);
        return { success: true, selectedIndex: slotIndex, slot: game.player.getSelectedSlot() };
      }

      if (itemName) {
        const lower = itemName.toLowerCase();
        for (let i = 0; i < 9; i++) {
          const s = game.player.inventory[i];
          if (s) {
            const sName = (typeof s.id === 'number' ? getBlockName(s.id) : String(s.id)).toLowerCase();
            if (sName.includes(lower)) {
              game.inputManager.onHotbarSelect(i);
              return { success: true, selectedIndex: i, item: sName };
            }
          }
        }
      }

      return { success: false, message: 'Item not found in hotbar slots 0-8.' };
    },
  });

  await modelContext.registerTool({
    name: 'give_item',
    title: 'Give Item / Block to Player',
    description: 'Adds an item or block into the player inventory (e.g. "diamond_pickaxe", "black_wool", "white_wool", "torch").',
    inputSchema: {
      type: 'object',
      properties: {
        item: {
          type: 'string',
          description: 'Name of block or tool (e.g. "white_wool", "black_wool", "diamond_pickaxe").',
        },
        count: {
          type: 'integer',
          default: 64,
          description: 'Quantity to give (1-64).',
        },
      },
      required: ['item'],
    },
    execute: async ({ item, count = 64 }) => {
      let itemId = item;
      const blockId = resolveBlockId(item);
      if (blockId !== BLOCKS.STONE || item.toLowerCase().includes('stone')) {
        itemId = blockId;
      }

      const qty = Math.max(1, Math.min(count || 64, 64));
      game.player.addItem(itemId, qty);
      game.handViewModel.updateHeldItem(game.player.getSelectedSlot());
      game.broadcastUI();

      return { success: true, message: `Given ${qty}x ${item} to player.` };
    },
  });

  await modelContext.registerTool({
    name: 'inspect_blocks',
    title: 'Inspect Blocks',
    description: 'Inspects a single block coordinate (x, y, z) or scans a 3D box region around player/coordinates.',
    inputSchema: {
      type: 'object',
      properties: {
        x: { type: 'number', description: 'Center X coordinate.' },
        y: { type: 'number', description: 'Center Y coordinate.' },
        z: { type: 'number', description: 'Center Z coordinate.' },
        radius: {
          type: 'number',
          description: 'Scan radius in blocks (0 for single block, max 6).',
          default: 0,
        },
      },
    },
    annotations: { readOnlyHint: true },
    execute: async ({ x, y, z, radius = 0 }) => {
      const cx = Math.round(x !== undefined ? x : game.player.physics.position.x);
      const cy = Math.round(y !== undefined ? y : game.player.physics.position.y);
      const cz = Math.round(z !== undefined ? z : game.player.physics.position.z);
      const rad = Math.max(0, Math.min(radius || 0, 5));

      ensureChunksLoaded(cx - rad - 1, cx + rad + 1, cz - rad - 1, cz + rad + 1);

      if (!radius || radius <= 0) {
        const bId = game.chunkManager.getBlock(cx, cy, cz);
        return {
          x: cx,
          y: cy,
          z: cz,
          blockId: bId,
          name: getBlockName(bId),
        };
      }

      const r = Math.min(radius, 5);
      const blocksFound = [];
      for (let dy = -r; dy <= r; dy++) {
        for (let dz = -r; dz <= r; dz++) {
          for (let dx = -r; dx <= r; dx++) {
            const bx = cx + dx;
            const by = cy + dy;
            const bz = cz + dz;
            const bId = game.chunkManager.getBlock(bx, by, bz);
            if (bId !== BLOCKS.AIR) {
              blocksFound.push({ x: bx, y: by, z: bz, blockId: bId, name: getBlockName(bId) });
            }
          }
        }
      }

      return {
        center: { x: cx, y: cy, z: cz },
        radius: r,
        totalSolidBlocks: blocksFound.length,
        blocks: blocksFound.slice(0, 80), // limit response size
      };
    },
  });

  await modelContext.registerTool({
    name: 'get_target_block',
    title: 'Get Target Block in Crosshair',
    description: 'Casts a ray from player eyes and returns the block currently targeted, distance, and the adjacent place coordinate.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    annotations: { readOnlyHint: true },
    execute: async () => {
      const eye = game.player.physics.getEyePosition();
      const forward = game.cameraController.getForwardVector();
      const hit = game.raycaster.castRay(eye, forward);

      if (!hit.hit) {
        return { hit: false, message: 'No block in range.' };
      }

      return {
        hit: true,
        block: {
          x: hit.blockPos.x,
          y: hit.blockPos.y,
          z: hit.blockPos.z,
          id: hit.blockId,
          name: getBlockName(hit.blockId),
        },
        adjacentPlacePos: hit.placePos,
        distance: Number(hit.distance.toFixed(2)),
      };
    },
  });

  // -------------------------------------------------------------
  // 4. MINING & COMBAT TOOLS
  // -------------------------------------------------------------

  await modelContext.registerTool({
    name: 'mine_block',
    title: 'Mine / Break Block',
    description: 'Mines the block at (x, y, z) or the block currently targeted in crosshair. In creative mode, instantly breaks; in survival, breaks and drops loot.',
    inputSchema: {
      type: 'object',
      properties: {
        x: { type: 'number', description: 'X coordinate.' },
        y: { type: 'number', description: 'Y coordinate.' },
        z: { type: 'number', description: 'Z coordinate.' },
      },
    },
    execute: async ({ x, y, z }) => {
      let bx, by, bz;
      if (x !== undefined && y !== undefined && z !== undefined) {
        bx = Math.round(x);
        by = Math.round(y);
        bz = Math.round(z);
      } else {
        const eye = game.player.physics.getEyePosition();
        const fwd = game.cameraController.getForwardVector();
        const hit = game.raycaster.castRay(eye, fwd);
        if (!hit.hit) throw new Error('No target block in crosshair to mine.');
        bx = hit.blockPos.x;
        by = hit.blockPos.y;
        bz = hit.blockPos.z;
      }

      ensureChunksLoaded(bx - 1, bx + 1, bz - 1, bz + 1);
      const currentId = game.chunkManager.getBlock(bx, by, bz);
      if (currentId === BLOCKS.AIR) {
        return { success: false, message: 'Target is already AIR.' };
      }
      if (currentId === BLOCKS.BEDROCK) {
        return { success: false, message: 'Bedrock is unbreakable.' };
      }

      pushUndoBatch([{ x: bx, y: by, z: bz, oldBlockId: currentId, newBlockId: BLOCKS.AIR }]);
      game.breakBlock(bx, by, bz, currentId);
      game.handViewModel.triggerSwing();

      return {
        success: true,
        minedBlock: getBlockName(currentId),
        at: { x: bx, y: by, z: bz },
      };
    },
  });

  await modelContext.registerTool({
    name: 'attack_mob',
    title: 'Attack / Kill Mob',
    description: 'Attacks or kills the closest mob within reach, or a specific mob type.',
    inputSchema: {
      type: 'object',
      properties: {
        mobType: {
          type: 'string',
          description: 'Optional mob type to filter (e.g. "zombie", "creeper", "pig").',
        },
        damage: {
          type: 'number',
          default: 20,
          description: 'Amount of damage to inflict (default 20 = instant kill).',
        },
      },
    },
    execute: async ({ mobType, damage = 20 }) => {
      const pPos = game.player.physics.position;
      let targetMob = null;
      let minDist = 8.0;

      for (const mob of game.mobManager.mobs) {
        if (mob.isDead) continue;
        if (mobType && mob.type !== mobType.toLowerCase()) continue;
        const d = mob.position.distanceTo(pPos);
        if (d < minDist) {
          minDist = d;
          targetMob = mob;
        }
      }

      if (!targetMob) {
        return { success: false, message: 'No mob found within range.' };
      }

      game.handViewModel.triggerSwing();
      sound.playToolSwing();
      targetMob.takeDamage(damage, new THREE.Vector3(0, 1, 0));

      return {
        success: true,
        attackedMob: targetMob.type,
        distance: Number(minDist.toFixed(2)),
        isDead: targetMob.isDead,
      };
    },
  });

  await modelContext.registerTool({
    name: 'spawn_mob',
    title: 'Spawn Mob',
    description: 'Spawns a creature/mob ("pig", "cow", "sheep", "chicken", "wolf", "zombie", "creeper", "skeleton", "spider", "enderman") at target coordinates or near player.',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['pig', 'cow', 'sheep', 'chicken', 'wolf', 'zombie', 'creeper', 'skeleton', 'spider', 'enderman'],
          description: 'Type of mob to spawn.',
        },
        x: { type: 'number' },
        y: { type: 'number' },
        z: { type: 'number' },
      },
      required: ['type'],
    },
    execute: async ({ type, x, y, z }) => {
      const sx = x !== undefined ? x : game.player.physics.position.x + 3;
      const sy = y !== undefined ? y : game.player.physics.position.y;
      const sz = z !== undefined ? z : game.player.physics.position.z + 3;

      const mob = game.mobManager.spawnMob(type.toLowerCase(), sx, sy, sz);
      if (!mob) throw new Error(`Could not spawn mob of type ${type}`);

      sound.playLevelUp?.();
      return { success: true, spawned: type, position: { x: sx, y: sy, z: sz } };
    },
  });

  // -------------------------------------------------------------
  // 5. BUILDING, SHAPES & VOXEL ART (OPENAI LOGO)
  // -------------------------------------------------------------

  await modelContext.registerTool({
    name: 'place_block',
    title: 'Place Block',
    description: 'Places a block at (x, y, z) by block name or ID (e.g. "black_wool", "white_wool", "glowstone", "gold_block").',
    inputSchema: {
      type: 'object',
      properties: {
        x: { type: 'number', description: 'X coordinate.' },
        y: { type: 'number', description: 'Y coordinate.' },
        z: { type: 'number', description: 'Z coordinate.' },
        block: {
          type: 'string',
          description: 'Block name or ID to place (e.g. "black_wool", "white_wool", "glowstone").',
        },
      },
      required: ['x', 'y', 'z', 'block'],
    },
    execute: async ({ x, y, z, block }) => {
      const bx = Math.round(Number(x));
      const by = Math.round(Number(y));
      const bz = Math.round(Number(z));
      const blockId = resolveBlockId(block);

      ensureChunksLoaded(bx - 1, bx + 1, bz - 1, bz + 1);
      const cx = Math.floor(bx / 16);
      const cz = Math.floor(bz / 16);
      let chunk = game.chunkManager.getChunk(cx, cz);
      if (!chunk) chunk = game.chunkManager.loadChunk(cx, cz);

      const oldId = game.chunkManager.getBlock(bx, by, bz);
      const placed = game.chunkManager.setBlock(bx, by, bz, blockId);

      if (placed) {
        pushUndoBatch([{ x: bx, y: by, z: bz, oldBlockId: oldId, newBlockId: blockId }]);
        const def = getBlockDef(blockId);
        sound.playBlockPlace(def.sound || 'stone');
        if (blockId === BLOCKS.TORCH) game.lightEngine.addTorch(bx, by, bz);
        game.broadcastUI();
        return { success: true, placed: getBlockName(blockId), at: { x: bx, y: by, z: bz } };
      }

      return { success: false, message: 'Could not place block.' };
    },
  });

  await modelContext.registerTool({
    name: 'set_blocks_batch',
    title: 'Batch / Progressive Block Builder',
    description: 'Places multiple blocks. Supports animated: true and delayMs (e.g. 20-50ms) so players can watch the AI construct structures in real time block-by-block with sounds, or animated: false for instant placement.',
    inputSchema: {
      type: 'object',
      properties: {
        blocks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              x: { type: 'number' },
              y: { type: 'number' },
              z: { type: 'number' },
              block: { type: 'string' },
            },
            required: ['x', 'y', 'z', 'block'],
          },
          description: 'Array of block coordinate and type descriptors: [{ x, y, z, block }].',
        },
        animated: {
          type: 'boolean',
          default: false,
          description: 'If true, places blocks progressively over time with real-time sounds so players see the AI building.',
        },
        delayMs: {
          type: 'number',
          default: 25,
          description: 'Delay between block placements in milliseconds if animated is true (default 25ms).',
        },
      },
      required: ['blocks'],
    },
    execute: async ({ blocks, animated = false, delayMs = 25 }) => {
      if (!Array.isArray(blocks) || blocks.length === 0) {
        return { success: false, message: 'Blocks array is empty.' };
      }

      const undoBatch = [];
      const batchToSet = [];

      let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
      for (const b of blocks) {
        const bx = Math.round(b.x);
        const by = Math.round(b.y);
        const bz = Math.round(b.z);
        minX = Math.min(minX, bx);
        maxX = Math.max(maxX, bx);
        minZ = Math.min(minZ, bz);
        maxZ = Math.max(maxZ, bz);

        const blkId = resolveBlockId(b.block);
        const oldId = game.chunkManager.getBlock(bx, by, bz);
        undoBatch.push({ x: bx, y: by, z: bz, oldBlockId: oldId, newBlockId: blkId });
        batchToSet.push({ x: bx, y: by, z: bz, blockId: blkId });
      }

      ensureChunksLoaded(minX, maxX, minZ, maxZ);

      if (animated && batchToSet.length > 0) {
        const stepDelay = Math.max(5, Math.min(delayMs || 25, 500));
        let count = 0;

        for (const item of batchToSet) {
          game.chunkManager.setBlock(item.x, item.y, item.z, item.blockId);
          if (count % 2 === 0) {
            const def = getBlockDef(item.blockId);
            sound.playBlockPlace(def.sound || 'stone');
          }
          count++;
          if (stepDelay > 0) {
            await new Promise((resolve) => setTimeout(resolve, stepDelay));
          }
        }
        pushUndoBatch(undoBatch);
        game.broadcastUI();
        return { success: true, count: batchToSet.length, mode: 'animated', delayMs: stepDelay };
      }

      game.chunkManager.setBlocksBatch(batchToSet);
      pushUndoBatch(undoBatch);
      sound.playBlockPlace('stone');
      game.broadcastUI();

      return { success: true, count: batchToSet.length, mode: 'instant' };
    },
  });

  await modelContext.registerTool({
    name: 'clear_area',
    title: 'Clear Bounding Box Area',
    description: 'Clears a 3D rectangular box volume from (x1, y1, z1) to (x2, y2, z2) by replacing it with AIR. Ideal for preparing building sites.',
    inputSchema: {
      type: 'object',
      properties: {
        x1: { type: 'number' },
        y1: { type: 'number' },
        z1: { type: 'number' },
        x2: { type: 'number' },
        y2: { type: 'number' },
        z2: { type: 'number' },
      },
      required: ['x1', 'y1', 'z1', 'x2', 'y2', 'z2'],
    },
    execute: async ({ x1, y1, z1, x2, y2, z2 }) => {
      const minX = Math.min(Math.round(x1), Math.round(x2));
      const maxX = Math.max(Math.round(x1), Math.round(x2));
      const minY = Math.max(1, Math.min(Math.round(y1), Math.round(y2)));
      const maxY = Math.min(127, Math.max(Math.round(y1), Math.round(y2)));
      const minZ = Math.min(Math.round(z1), Math.round(z2));
      const maxZ = Math.max(Math.round(z1), Math.round(z2));

      ensureChunksLoaded(minX, maxX, minZ, maxZ);

      const undoBatch = [];
      const batch = [];
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          for (let x = minX; x <= maxX; x++) {
            const oldId = game.chunkManager.getBlock(x, y, z);
            if (oldId !== BLOCKS.AIR && oldId !== BLOCKS.BEDROCK) {
              undoBatch.push({ x, y, z, oldBlockId: oldId, newBlockId: BLOCKS.AIR });
              batch.push({ x, y, z, blockId: BLOCKS.AIR });
            }
          }
        }
      }

      game.chunkManager.setBlocksBatch(batch);
      pushUndoBatch(undoBatch);
      sound.playBlockBreak('stone');
      game.broadcastUI();

      return {
        success: true,
        clearedCount: batch.length,
        bounds: { minX, maxX, minY, maxY, minZ, maxZ },
      };
    },
  });

  await modelContext.registerTool({
    name: 'build_shape',
    title: 'Build Geometric 3D Shape',
    description: 'Procedurally generates geometric 3D shapes: box, cube, sphere, dome, cylinder, column, wall, pyramid, circle, ring, disc, platform, oval, or ellipsoid (solid or hollow).',
    inputSchema: {
      type: 'object',
      properties: {
        shape: {
          type: 'string',
          enum: ['box', 'cube', 'sphere', 'dome', 'cylinder', 'column', 'pillar', 'wall', 'pyramid', 'circle', 'ring', 'disc', 'platform', 'oval', 'ellipsoid'],
          description: 'Type of 3D geometry.',
        },
        block: {
          type: 'string',
          description: 'Block material (e.g. "stone_bricks", "gold_block", "glass", "white_wool", "wood").',
        },
        origin: {
          type: 'object',
          properties: {
            x: { type: 'number' },
            y: { type: 'number' },
            z: { type: 'number' },
          },
          description: 'Center origin coordinate. Defaults to resting on the terrain in front of the player.',
        },
        width: { type: 'number', description: 'Width / length X (default 5).' },
        height: { type: 'number', description: 'Height Y (default 4).' },
        depth: { type: 'number', description: 'Depth / thickness Z (default 5).' },
        radius: { type: 'number', description: 'Radius for spheres, domes, cylinders, circles (default 3).' },
        hollow: {
          type: 'boolean',
          default: false,
          description: 'If true, leaves the interior empty.',
        },
        animated: {
          type: 'boolean',
          default: false,
          description: 'If true, places blocks progressively over time with audio.',
        },
        delayMs: {
          type: 'number',
          default: 15,
          description: 'Delay between block batches in milliseconds if animated is true.',
        },
      },
      required: ['shape', 'block'],
    },
    execute: async ({ shape, block, origin, width = 5, height = 4, depth = 5, radius = 3, hollow = false, animated = false, delayMs = 15 }) => {
      const blockId = resolveBlockId(block);
      const normShape = String(shape || 'box').toLowerCase().trim().replace(/[\s-]/g, '_');

      const w = Math.max(1, Math.round(Number(width) || 5));
      const h = Math.max(1, Math.round(Number(height) || 4));
      const d = Math.max(1, Math.round(Number(depth) || 5));
      const r = Math.max(1, Math.round(Number(radius) || Math.floor(w / 2) || 3));
      const isHollow = hollow === true || hollow === 'true';

      let ox = origin?.x !== undefined ? Math.round(Number(origin.x)) : undefined;
      let oy = origin?.y !== undefined ? Math.round(Number(origin.y)) : undefined;
      let oz = origin?.z !== undefined ? Math.round(Number(origin.z)) : undefined;

      if (ox === undefined || oz === undefined) {
        const fwd = game.cameraController.getForwardVector();
        const dist = (normShape === 'sphere' || normShape === 'dome') ? r + 5 : Math.max(w, d) + 4;
        ox = Math.round(game.player.physics.position.x + fwd.x * dist);
        oz = Math.round(game.player.physics.position.z + fwd.z * dist);
      }

      const groundH = Math.max(1, game.worldGen.getHeight(ox, oz));

      if (oy === undefined) {
        if (normShape === 'sphere') {
          // Center sphere so that bottom rests at ground height
          oy = groundH + r;
        } else {
          // Base rests on terrain surface
          oy = groundH;
        }
      }

      const batch = [];
      const undoBatch = [];

      // 1. Box / Cube / Platform
      if (normShape === 'box' || normShape === 'cube' || normShape === 'platform') {
        const boxH = normShape === 'platform' ? 1 : (normShape === 'cube' ? w : h);
        const boxD = normShape === 'cube' ? w : d;
        const hw = Math.floor(w / 2);
        const hd = Math.floor(boxD / 2);

        for (let y = 0; y < boxH; y++) {
          for (let dz = -hd; dz <= hd; dz++) {
            for (let dx = -hw; dx <= hw; dx++) {
              const isPerimeter = Math.abs(dx) === hw || Math.abs(dz) === hd || y === 0 || y === boxH - 1;
              if (!isHollow || isPerimeter) {
                batch.push({ x: ox + dx, y: oy + y, z: oz + dz, blockId });
              }
            }
          }
        }
      }
      // 2. Wall
      else if (normShape === 'wall') {
        const wallLen = Math.max(1, Math.round(Number(width || 8)));
        const wallH = Math.max(1, Math.round(Number(height || 4)));
        const wallThick = Math.max(1, Math.round(Number(depth || 1)));
        const halfL = Math.floor(wallLen / 2);
        const halfT = Math.floor(wallThick / 2);

        const yawDeg = ((THREE.MathUtils.radToDeg(game.cameraController.yaw) % 360) + 360) % 360;
        const isEastWest = (yawDeg >= 45 && yawDeg < 135) || (yawDeg >= 225 && yawDeg < 315);

        for (let y = 0; y < wallH; y++) {
          for (let dl = -halfL; dl <= halfL; dl++) {
            for (let dt = -halfT; dt <= halfT; dt++) {
              const wx = isEastWest ? ox + dt : ox + dl;
              const wz = isEastWest ? oz + dl : oz + dt;
              const isPerimeter = Math.abs(dl) === halfL || y === 0 || y === wallH - 1 || Math.abs(dt) === halfT;
              if (!isHollow || isPerimeter) {
                batch.push({ x: wx, y: oy + y, z: wz, blockId });
              }
            }
          }
        }
      }
      // 3. Sphere
      else if (normShape === 'sphere') {
        for (let dy = -r; dy <= r; dy++) {
          for (let dz = -r; dz <= r; dz++) {
            for (let dx = -r; dx <= r; dx++) {
              const dSq = dx * dx + dy * dy + dz * dz;
              const inSphere = dSq <= (r + 0.5) * (r + 0.5);
              const onSurface = inSphere && dSq >= (r - 0.75) * (r - 0.75);
              if (!isHollow ? inSphere : onSurface) {
                batch.push({ x: ox + dx, y: oy + dy, z: oz + dz, blockId });
              }
            }
          }
        }
      }
      // 4. Dome (Upper Hemisphere)
      else if (normShape === 'dome') {
        for (let dy = 0; dy <= r; dy++) {
          for (let dz = -r; dz <= r; dz++) {
            for (let dx = -r; dx <= r; dx++) {
              const dSq = dx * dx + dy * dy + dz * dz;
              const inDome = dSq <= (r + 0.5) * (r + 0.5);
              const onSurface = inDome && dSq >= (r - 0.75) * (r - 0.75);
              if (!isHollow ? inDome : onSurface) {
                batch.push({ x: ox + dx, y: oy + dy, z: oz + dz, blockId });
              }
            }
          }
        }
      }
      // 5. Cylinder / Column / Pillar
      else if (normShape === 'cylinder' || normShape === 'column' || normShape === 'pillar') {
        for (let y = 0; y < h; y++) {
          for (let dz = -r; dz <= r; dz++) {
            for (let dx = -r; dx <= r; dx++) {
              const dSq = dx * dx + dz * dz;
              const inCylinder = dSq <= (r + 0.4) * (r + 0.4);
              const onSurface = inCylinder && (dSq >= (r - 0.8) * (r - 0.8) || y === 0 || y === h - 1);
              if (!isHollow ? inCylinder : onSurface) {
                batch.push({ x: ox + dx, y: oy + y, z: oz + dz, blockId });
              }
            }
          }
        }
      }
      // 6. Pyramid
      else if (normShape === 'pyramid') {
        const base = Math.max(2, Math.floor(w / 2));
        for (let step = 0; step <= base; step++) {
          const curR = base - step;
          for (let dz = -curR; dz <= curR; dz++) {
            for (let dx = -curR; dx <= curR; dx++) {
              const isBorder = Math.abs(dx) === curR || Math.abs(dz) === curR || step === base;
              if (!isHollow || isBorder) {
                batch.push({ x: ox + dx, y: oy + step, z: oz + dz, blockId });
              }
            }
          }
        }
      }
      // 7. Circle / Ring / Disc
      else if (normShape === 'circle' || normShape === 'ring' || normShape === 'disc') {
        for (let dz = -r; dz <= r; dz++) {
          for (let dx = -r; dx <= r; dx++) {
            const dSq = dx * dx + dz * dz;
            const inCircle = dSq <= (r + 0.5) * (r + 0.5);
            const onRing = inCircle && dSq >= (r - 0.85) * (r - 0.85);
            const shouldPlace = (normShape === 'ring' || isHollow) ? onRing : inCircle;
            if (shouldPlace) {
              batch.push({ x: ox + dx, y: oy, z: oz + dz, blockId });
            }
          }
        }
      }
      // 8. Oval / Ellipsoid
      else if (normShape === 'oval' || normShape === 'ellipsoid') {
        const rx = Math.max(2, Math.round(w / 2));
        const ry = Math.max(2, Math.round(h / 2));
        const rz = Math.max(2, Math.round(d / 2));
        for (let dy = -ry; dy <= ry; dy++) {
          for (let dz = -rz; dz <= rz; dz++) {
            for (let dx = -rx; dx <= rx; dx++) {
              const dSq = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) + (dz * dz) / (rz * rz);
              const inOval = dSq <= 1.0;
              const onSurface = inOval && dSq >= 0.72;
              if (!isHollow ? inOval : onSurface) {
                batch.push({ x: ox + dx, y: oy + dy, z: oz + dz, blockId });
              }
            }
          }
        }
      }

      // Preload chunks and capture undo data
      let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
      for (const b of batch) {
        minX = Math.min(minX, b.x);
        maxX = Math.max(maxX, b.x);
        minZ = Math.min(minZ, b.z);
        maxZ = Math.max(maxZ, b.z);
      }

      if (batch.length > 0) {
        ensureChunksLoaded(minX, maxX, minZ, maxZ);
        for (const b of batch) {
          const oldId = game.chunkManager.getBlock(b.x, b.y, b.z);
          undoBatch.push({ x: b.x, y: b.y, z: b.z, oldBlockId: oldId, newBlockId: b.blockId });
        }
      }

      // Smooth animated placement with sound effects without freezing renderer
      if (animated && batch.length > 0) {
        const stepDelay = Math.max(5, Math.min(Number(delayMs) || 15, 500));
        let count = 0;
        const affectedChunks = new Set();

        for (const item of batch) {
          const cx = Math.floor(item.x / 16);
          const cz = Math.floor(item.z / 16);
          let chunk = game.chunkManager.getChunk(cx, cz);
          if (!chunk) chunk = game.chunkManager.loadChunk(cx, cz);
          if (chunk) {
            const lx = ((item.x % 16) + 16) % 16;
            const lz = ((item.z % 16) + 16) % 16;
            chunk.setBlock(lx, item.y, lz, item.blockId);
            affectedChunks.add(chunk);
          }

          if (count % 4 === 0) {
            const def = getBlockDef(item.blockId);
            sound.playBlockPlace(def.sound || 'stone');
          }

          count++;
          if (stepDelay > 0 && count % 2 === 0) {
            // Periodic mesh refresh for visible progress without locking main thread
            if (count % 16 === 0) {
              for (const c of affectedChunks) game.chunkManager.rebuildChunkMesh(c);
            }
            await new Promise((resolve) => setTimeout(resolve, stepDelay));
          }
        }

        // Final full mesh update for all affected chunks
        for (const c of affectedChunks) {
          game.chunkManager.rebuildChunkMesh(c);
        }

        pushUndoBatch(undoBatch);
        game.broadcastUI();
        return {
          success: true,
          shape: normShape,
          block: getBlockName(blockId),
          placedCount: batch.length,
          origin: { x: ox, y: oy, z: oz },
          mode: 'animated',
        };
      }

      // Instant batch placement
      game.chunkManager.setBlocksBatch(batch);
      pushUndoBatch(undoBatch);
      sound.playBlockPlace('stone');
      game.broadcastUI();

      return {
        success: true,
        shape: normShape,
        block: getBlockName(blockId),
        placedCount: batch.length,
        origin: { x: ox, y: oy, z: oz },
        mode: 'instant',
      };
    },
  });

  await modelContext.registerTool({
    name: 'build_structure',
    title: 'Build Pre-designed Structure',
    description: 'Constructs an architectural building: "cottage" (furnished cozy wooden cottage), "castle" (medieval stone fortress with towers), "watchtower" (stone battlements tower), "pyramid" (ancient desert tomb), "fountain" (water fountain), or "portal" (nether portal).',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['cottage', 'house', 'watchtower', 'tower', 'pyramid', 'castle', 'fortress', 'fountain', 'portal', 'nether_portal'],
          description: 'Structure type to construct.',
        },
        origin: {
          type: 'object',
          properties: {
            x: { type: 'number' },
            y: { type: 'number' },
            z: { type: 'number' },
          },
          description: 'Optional world coordinate where to build the structure.',
        },
        instant: {
          type: 'boolean',
          default: true,
          description: 'If true, builds instantly. If false, builds progressively with construction sounds.',
        },
      },
      required: ['type'],
    },
    execute: async ({ type, origin, pos, instant = true }) => {
      const targetPos = origin || pos;
      const result = game.buildStructure(type.toLowerCase(), {
        pos: targetPos,
        instant: instant !== false,
        adjustCamera: false,
      });
      return {
        success: true,
        structure: type,
        blocksPlaced: result.count,
        location: { x: result.targetX, y: result.targetY, z: result.targetZ },
      };
    },
  });

  await modelContext.registerTool({
    name: 'undo_last_build',
    title: 'Undo Last Build Action',
    description: 'Reverts the most recent building or placement batch, restoring previous blocks.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    execute: async () => {
      if (!game.webMcpUndoStack || game.webMcpUndoStack.length === 0) {
        return { success: false, message: 'Nothing to undo.' };
      }

      const lastBatch = game.webMcpUndoStack.pop();
      const restoreBatch = lastBatch.map((entry) => ({
        x: entry.x,
        y: entry.y,
        z: entry.z,
        blockId: entry.oldBlockId,
      }));

      game.chunkManager.setBlocksBatch(restoreBatch);
      sound.playBlockBreak('cloth');
      game.broadcastUI();

      return {
        success: true,
        restoredBlocks: restoreBatch.length,
        message: `Undid last action, restored ${restoreBatch.length} blocks.`,
      };
    },
  });

  console.log('[WebMCP] Successfully registered all 23 core Minecraft WebMCP tools!');
}
