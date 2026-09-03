import * as THREE from 'three';
import { SimplexNoise } from '../world/SimplexNoise.js';
import { BiomeGenerator } from '../world/BiomeGenerator.js';
import { WorldGen } from '../world/WorldGen.js';
import { ChunkManager } from '../world/ChunkManager.js';
import { Skybox } from '../world/../lighting/Skybox.js';
import { LightEngine } from '../lighting/LightEngine.js';
import { ParticleEngine } from '../particles/ParticleEngine.js';
import { Raycaster } from '../physics/Raycaster.js';
import { Player } from '../entities/Player.js';
import { ItemDrop } from '../entities/ItemDrop.js';
import { MobManager } from '../entities/MobManager.js';
import { CameraController } from './CameraController.js';
import { InputManager } from './InputManager.js';
import { HandViewModel } from './HandViewModel.js';
import { sound } from '../audio/SoundSynthesizer.js';
import { worldStorage } from '../storage/WorldStorage.js';
import { BLOCKS, getBlockDef } from '../world/Blocks.js';
import { furnaceManager } from '../world/FurnaceManager.js';
import { chestManager } from '../world/ChestManager.js';
import { Weather } from '../world/Weather.js';
import { StructureBuilder } from '../world/StructureBuilder.js';
import { setupWebMCP } from '../webmcp/WebMCPPolyfill.js';
import { registerMinecraftWebMCPTools } from '../webmcp/MinecraftWebMCPTools.js';

export class Game {
  constructor(canvasContainer, uiCallback) {
    this.container = canvasContainer;
    this.onUIUpdate = uiCallback; // Sends state changes to React HUD
    window.game = this; // Expose globally for interactive control

    // Scene & Renderer Setup
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.scene.add(this.camera);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', logarithmicDepthBuffer: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.shadowMap.autoUpdate = true;
    this.container.appendChild(this.renderer.domElement);

    // Core Systems
    this.noise = new SimplexNoise(1337);
    this.biomeGen = new BiomeGenerator(this.noise);
    this.worldGen = new WorldGen(this.noise, this.biomeGen);
    this.chunkManager = new ChunkManager(this.scene, this.worldGen);

    this.skybox = new Skybox(this.scene);
    this.lightEngine = new LightEngine(this.scene);
    this.particleEngine = new ParticleEngine(this.scene);

    this.player = new Player(this.chunkManager);
    this.raycaster = new Raycaster(this.scene, this.chunkManager);

    this.cameraController = new CameraController(this.camera);
    this.inputManager = new InputManager(this.renderer.domElement);
    this.handViewModel = new HandViewModel(this.camera);

    this.itemDrops = [];
    this.mobManager = new MobManager(
      this.scene,
      this.chunkManager,
      this.particleEngine,
      (id, count, x, y, z) => this.spawnItemDrop(id, count, x, y, z)
    );

    // Mining / Breaking state
    this.miningTarget = null;
    this.miningProgress = 0;
    this.miningTimer = 0;
    this.attackCooldown = 0;
    this.structureBuildTimer = null;

    // Performance Stats
    this.fps = 60;
    this.frameCount = 0;
    this.fpsTimer = performance.now();

    // Modals & UI states
    this.isPaused = false;
    this.isInventoryOpen = false;
    this.isCraftingTableOpen = false;
    this.isFurnaceOpen = false;
    this.isChestOpen = false;
    this.isBuildMenuOpen = false;
    this.modelContext = null;
    this.furnacePos = null;
    this.chestPos = null;
    this.showDebug = false;
    this.weather = new Weather(this.scene);
    this.lavaHurtTimer = 0;

    // Game loop timing
    this.lastTime = performance.now();
    this.isRunning = false;

    this.init();
  }

  init() {
    // 1. Initial Spawn Location (Find high ground)
    const spawnX = 0;
    const spawnZ = 0;
    const spawnH = this.worldGen.getHeight(spawnX, spawnZ);
    this.player.physics.position.set(spawnX + 0.5, spawnH + 2.0, spawnZ + 0.5);

    // 2. Preload surrounding spawn chunks synchronously
    this.chunkManager.preloadSpawnArea(spawnX, spawnZ, 3);

    // 3. Bind Input Callbacks
    this.setupInputHandlers();

    // 4. Window Resize Handler
    window.addEventListener('resize', () => this.handleResize());

    // 5. Auto-save every 30 seconds
    setInterval(() => this.autoSave(), 30000);

    // 6. Initialize WebMCP (Chrome AI & W3C standard ModelContext)
    this.initWebMCP();

    // Initial hand item view
    this.handViewModel.updateHeldItem(this.player.getSelectedSlot());

    this.isRunning = true;
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  async initWebMCP() {
    try {
      const modelContext = setupWebMCP();
      await registerMinecraftWebMCPTools(modelContext, this);
      this.modelContext = modelContext;
    } catch (err) {
      console.error('[WebMCP] Error initializing WebMCP tools:', err);
    }
  }

  setupInputHandlers() {
    // 'E' Key: Toggle Inventory
    this.inputManager.onInventoryToggle = () => {
      if (this.isBuildMenuOpen || this.isCraftingTableOpen || this.isFurnaceOpen || this.isChestOpen) {
        this.closeModals();
        return;
      }
      this.isInventoryOpen = !this.isInventoryOpen;
      if (this.isInventoryOpen) {
        this.inputManager.exitPointerLock();
      } else {
        this.inputManager.requestPointerLock();
      }
      this.broadcastUI();
    };

    // 'B' Key: Toggle Quick Build Menu
    this.inputManager.onBuildMenuToggle = () => this.toggleBuildMenu();

  // Public UI action: keep HUD button and keyboard shortcut on one path.
  this.toggleBuildMenu = () => {
    if (this.isInventoryOpen || this.isCraftingTableOpen || this.isFurnaceOpen || this.isChestOpen || this.isPaused) return;
    this.isBuildMenuOpen = !this.isBuildMenuOpen;
    if (this.isBuildMenuOpen) this.inputManager.exitPointerLock();
    this.broadcastUI();
  };

  // 'F3' Key: Toggle Debug
  this.inputManager.onDebugToggle = () => {
      this.showDebug = !this.showDebug;
      this.broadcastUI();
    };

    // 'Esc' Key: Pause Menu
    this.inputManager.onPauseToggle = () => {
      if (this.isInventoryOpen || this.isBuildMenuOpen || this.isCraftingTableOpen || this.isFurnaceOpen || this.isChestOpen) {
        this.closeModals();
        return;
      }
      this.isPaused = !this.isPaused;
      if (this.isPaused) {
        this.inputManager.exitPointerLock();
      } else {
        this.inputManager.requestPointerLock();
      }
      this.broadcastUI();
    };

    // Hotbar selection
    this.inputManager.onToolCycle = (delta) => {
    let next = (this.player.selectedHotbarIndex + delta) % 9;
    if (next < 0) next += 9;
    this.player.selectedHotbarIndex = next;
    this.handViewModel.updateHeldItem(this.player.getSelectedSlot());
    sound.playClick();
    this.broadcastUI();
  };

  this.inputManager.onHotbarSelect = (indexOrDelta, isRelative = false) => {
      if (isRelative) {
        let newIdx = (this.player.selectedHotbarIndex + indexOrDelta) % 9;
        if (newIdx < 0) newIdx += 9;
        this.player.selectedHotbarIndex = newIdx;
      } else {
        this.player.selectedHotbarIndex = Math.max(0, Math.min(8, indexOrDelta));
      }
      this.handViewModel.updateHeldItem(this.player.getSelectedSlot());
      this.broadcastUI();
    };

    // Creative flight toggle
    this.inputManager.onFlyToggle = () => {
      if (this.player.gameMode === 'creative') {
        this.player.physics.isFlying = !this.player.physics.isFlying;
        this.player.physics.velocity.set(0, 0, 0);
        this.player.physics.onGround = false;
        this.broadcastUI();
      }
    };

    // Left Click in air: tool whoosh & arm swing
    this.inputManager.onLeftClick = () => {
      if (this.isInventoryOpen || this.isCraftingTableOpen || this.isFurnaceOpen || this.isChestOpen || this.isPaused) return;
      this.handViewModel.triggerSwing();
      sound.playToolSwing();
    };

    // Right Click: Block Place or Interact
    this.inputManager.onRightClick = () => {
      this.handleRightClick();
    };
  }

  closeModals() {
    this.isInventoryOpen = false;
    this.isCraftingTableOpen = false;
    this.isFurnaceOpen = false;
    this.isChestOpen = false;
    this.isBuildMenuOpen = false;
    this.furnacePos = null;
    this.chestPos = null;
    this.isPaused = false;
    this.inputManager.requestPointerLock();
    this.broadcastUI();
  }

  handleRightClick() {
    const selected = this.player.getSelectedSlot();

    // Check if eating food
    if (selected && ['apple', 'bread', 'wheat', 'raw_porkchop', 'cooked_porkchop', 'raw_beef', 'cooked_beef', 'melon_slice'].includes(selected.id)) {
      if (this.player.eatFood(selected.id)) {
        sound.playEatingCrunch();
        this.handViewModel.triggerSwing();
        this.player.useSelectedItem(1);
        this.broadcastUI();
        return;
      }
    }

    // Check shearing sheep
    if (selected && selected.id==='shears'){
      const eyePos2 = this.player.physics.getEyePosition();
      const forward2 = this.cameraController.getForwardVector();
      const hitMob = this.mobManager.hitMob(eyePos2, forward2, 4);
      if(hitMob && hitMob.type==='sheep' && !hitMob.sheared){
        const wool=hitMob.shear();
        if(wool) this.spawnItemDrop(wool.id, wool.count, hitMob.position.x, hitMob.position.y+0.8, hitMob.position.z);
        selected.durability-=1;
        if(selected.durability<=0) this.player.inventory[this.player.selectedHotbarIndex]=null;
        sound.playBlockBreak('grass');
        this.handViewModel.triggerSwing();
        this.broadcastUI();
        return;
      }
    }

    // Cast ray to targeted block
    const eyePos = this.player.physics.getEyePosition();
    const forward = this.cameraController.getForwardVector();
    const hit = this.raycaster.castRay(eyePos, forward);

    if (hit.hit) {
      // 1. Right click interactive blocks
      if (hit.blockId === BLOCKS.CRAFTING_TABLE) {
        this.isCraftingTableOpen = true;
        this.inputManager.exitPointerLock();
        this.broadcastUI();
        return;
      }
      if (hit.blockId === BLOCKS.FURNACE) {
        this.isFurnaceOpen = true;
        this.furnacePos = { x: hit.blockPos.x, y: hit.blockPos.y, z: hit.blockPos.z };
        this.inputManager.exitPointerLock();
        this.broadcastUI();
        return;
      }
      if (hit.blockId === BLOCKS.CHEST) {
        this.isChestOpen = true;
        this.chestPos = { x: hit.blockPos.x, y: hit.blockPos.y, z: hit.blockPos.z };
        this.inputManager.exitPointerLock();
        this.broadcastUI();
        return;
      }
      // Hoe tilling dirt -> farmland
      if (selected && typeof selected.id==='string' && selected.id.includes('hoe') && (hit.blockId===BLOCKS.GRASS || hit.blockId===BLOCKS.DIRT)){
        if(hit.blockId===BLOCKS.GRASS || hit.blockId===BLOCKS.DIRT){
          const above=this.chunkManager.getBlock(hit.blockPos.x, hit.blockPos.y+1, hit.blockPos.z);
          if(above===BLOCKS.AIR){
            this.chunkManager.setBlock(hit.blockPos.x, hit.blockPos.y, hit.blockPos.z, BLOCKS.FARMLAND);
            sound.playBlockPlace('grass');
            if(selected.durability!==undefined){ selected.durability-=1; if(selected.durability<=0) this.player.inventory[this.player.selectedHotbarIndex]=null; }
            this.handViewModel.triggerSwing();
            this.broadcastUI();
            return;
          }
        }
      }
      // Plant wheat seeds on farmland
      if (selected && (selected.id==='wheat_seeds' || selected.id==='wheat') && hit.blockId===BLOCKS.FARMLAND){
        const above=this.chunkManager.getBlock(hit.blockPos.x, hit.blockPos.y+1, hit.blockPos.z);
        if(above===BLOCKS.AIR){
          this.chunkManager.setBlock(hit.blockPos.x, hit.blockPos.y+1, hit.blockPos.z, BLOCKS.WHEAT);
          this.player.useSelectedItem(1); this.broadcastUI(); return;
        }
      }

      // 2. Place Block from hotbar
      if (selected && typeof selected.id === 'number') {
        const placePos = hit.placePos;
        const placeBlockId = selected.id;

        // Check player bounding box collision so block doesn't trap player
        const playerBox = this.player.physics.getAABB();
        const blockBox = {
          minX: placePos.x,
          maxX: placePos.x + 1,
          minY: placePos.y,
          maxY: placePos.y + 1,
          minZ: placePos.z,
          maxZ: placePos.z + 1,
        };

        const def = getBlockDef(placeBlockId);
        const overlapsPlayer = def.solid && playerBox.intersects(blockBox);

        if (!overlapsPlayer) {
          const placed = this.chunkManager.setBlock(placePos.x, placePos.y, placePos.z, placeBlockId);
          if (placed) {
            sound.playBlockPlace(def.sound || 'stone');
            this.handViewModel.triggerSwing();

            // Placed torch point light
            if (placeBlockId === BLOCKS.TORCH) {
              this.lightEngine.addTorch(placePos.x, placePos.y, placePos.z);
            }

            this.player.useSelectedItem(1);
            this.handViewModel.updateHeldItem(this.player.getSelectedSlot());
            this.broadcastUI();
          }
        }
      }
    }
  }

  // Mining / Block Breaking System
  handleMining(dt) {
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    if (!this.inputManager.mouseButtons.left || this.isInventoryOpen || this.isCraftingTableOpen || this.isFurnaceOpen || this.isChestOpen || this.isPaused) {
      this.miningProgress = 0;
      this.miningTarget = null;
      this.raycaster.updateTarget(null, 0);
      return;
    }

    const eyePos = this.player.physics.getEyePosition();
    const forward = this.cameraController.getForwardVector();

    // 1. Check mob hit (Melee attack)
    const hitMob = this.attackCooldown <= 0 ? this.mobManager.hitMob(eyePos, forward, 7) : null;
    if (hitMob) {
      this.attackCooldown = 0.42;
      sound.playToolSwing();
      this.handViewModel.triggerSwing();
      return;
    }

    // 2. Block raycast
    const hit = this.raycaster.castRay(eyePos, forward);

    if (hit.hit) {
      const { blockPos, blockId } = hit;
      const def = getBlockDef(blockId);

      if (def.hardness < 0) {
        // Bedrock is unbreakable
        this.raycaster.updateTarget(hit, 0);
        return;
      }

      // Creative instant break
      if (this.player.gameMode === 'creative') {
        this.breakBlock(blockPos.x, blockPos.y, blockPos.z, blockId);
        this.handViewModel.triggerSwing();
        return;
      }

      // Calculate break speed based on tool & hardness
      const held = this.player.getSelectedSlot();
      let toolSpeed = 1.0;
      if (held && typeof held.id === 'string') {
        if (def.tool === 'pickaxe' && held.id.includes('pickaxe')) toolSpeed = held.id.includes('diamond') ? 8.0 : (held.id.includes('iron') ? 6.0 : (held.id.includes('stone') ? 4.0 : 2.0));
        else if (def.tool === 'axe' && held.id.includes('axe')) toolSpeed = held.id.includes('diamond') ? 8.0 : (held.id.includes('iron') ? 6.0 : 3.0);
        else if (def.tool === 'shovel' && held.id.includes('shovel')) toolSpeed = held.id.includes('diamond') ? 8.0 : 4.0;
      }

      const targetKey = `${blockPos.x},${blockPos.y},${blockPos.z}`;
      if (this.miningTarget !== targetKey) {
        this.miningTarget = targetKey;
        this.miningProgress = 0;
        this.miningTimer = 0;
      }

      // Trigger arm swing & digging tick sound
      this.miningTimer += dt;
      if (this.miningTimer > 0.2) {
        this.handViewModel.triggerSwing();
        sound.playDigTick(def.sound || 'stone');
        this.miningTimer = 0;
      }

      const breakTime = Math.max(0.05, (def.hardness * 1.5) / toolSpeed);
      // Click-to-act remains responsive while held mining is twice as fast.
      this.miningProgress += (dt * 2) / breakTime;

      this.raycaster.updateTarget(hit, this.miningProgress);

      if (this.miningProgress >= 1.0) {
        this.breakBlock(blockPos.x, blockPos.y, blockPos.z, blockId);
        this.player.useSelectedItem(1); // Tool wear
        this.miningProgress = 0;
        this.miningTarget = null;
        this.raycaster.updateTarget(null, 0);
      }
    } else {
      this.miningProgress = 0;
      this.miningTarget = null;
      this.raycaster.updateTarget(null, 0);
    }
  }

  breakBlock(x, y, z, blockId) {
    const def = getBlockDef(blockId);
    this.chunkManager.setBlock(x, y, z, BLOCKS.AIR);

    sound.playBlockBreak(def.sound || 'stone');
    this.particleEngine.spawnBlockBreakParticles(x, y, z, blockId);

    if (blockId === BLOCKS.TORCH) {
      this.lightEngine.removeTorch(x, y, z);
    }
    if (blockId === BLOCKS.FURNACE) {
      const f = furnaceManager.getOrCreate(x,y,z);
      // drop furnace contents
      [f.input,f.fuel,f.output].forEach(slot=>{ if(slot) this.spawnItemDrop(slot.id, slot.count, x+0.5,y+0.5,z+0.5); });
      furnaceManager.remove(x,y,z);
    }
    if (blockId === BLOCKS.CHEST) {
      const chestInv = chestManager.getOrCreate(x,y,z);
      chestInv.forEach(slot=>{ if(slot) this.spawnItemDrop(slot.id, slot.count, x+0.5,y+0.7,z+0.5); });
      chestManager.remove(x,y,z);
    }
    if(blockId===BLOCKS.WHEAT){
      // wheat drops wheat + seeds
      this.spawnItemDrop('wheat', 1, x+0.5,y+0.5,z+0.5);
      if(Math.random()<0.5) this.spawnItemDrop('wheat_seeds', 1, x+0.5,y+0.5,z+0.5);
    } else if (this.player.gameMode === 'survival') {
      if (def.drops) {
        const dropId = def.drops.id;
        const count = def.drops.count || 1;
        // chance handling for leaves
        if(def.drops.chance!==undefined && Math.random()>def.drops.chance){
          if(def.drops.alternative && Math.random()< (def.drops.alternative.chance||0)) this.spawnItemDrop(def.drops.alternative.id, def.drops.alternative.count, x+0.5,y+0.5,z+0.5);
        } else {
          this.spawnItemDrop(dropId, count, x + 0.5, y + 0.5, z + 0.5);
        }
      }
    }

    this.broadcastUI();
  }

  spawnItemDrop(itemId, count, x, y, z) {
    const vx = (Math.random() - 0.5) * 2.0;
    const vy = 3.5;
    const vz = (Math.random() - 0.5) * 2.0;
    const drop = new ItemDrop(this.scene, this.chunkManager, itemId, count, x, y, z, vx, vy, vz);
    this.itemDrops.push(drop);
  }

  // Broadcast game state to React HUD
  broadcastUI() {
    if (!this.onUIUpdate) return;

    const biomeData = this.biomeGen.getBiomeData(
      Math.floor(this.player.physics.position.x),
      Math.floor(this.player.physics.position.z)
    );

    this.onUIUpdate({
      health: this.player.health,
      maxHealth: this.player.maxHealth,
      hunger: this.player.hunger,
      maxHunger: this.player.maxHunger,
      oxygen: this.player.oxygen,
      maxOxygen: this.player.maxOxygen,
      inventory: [...this.player.inventory],
      selectedSlotIndex: this.player.selectedHotbarIndex,
      gameMode: this.player.gameMode,
      fps: this.fps,
      posX: this.player.physics.position.x.toFixed(2),
      posY: this.player.physics.position.y.toFixed(2),
      posZ: this.player.physics.position.z.toFixed(2),
      biome: biomeData.name,
      timeOfDay: this.skybox.timeOfDay,
      isPaused: this.isPaused,
      isInventoryOpen: this.isInventoryOpen,
      isCraftingTableOpen: this.isCraftingTableOpen,
      isFurnaceOpen: this.isFurnaceOpen,
      isChestOpen: this.isChestOpen,
      isBuildMenuOpen: this.isBuildMenuOpen,
      furnacePos: this.furnacePos,
      chestPos: this.chestPos,
      showDebug: this.showDebug,
      weather: this.weather.isRaining ? 'Rain' : this.weather.isSnowing ? 'Snow' : 'Clear',
    });
  }

  // Procedural Structure Construction with optional progressive timelapse animation
  buildStructure(type = 'cottage', options = {}) {
    let targetX, targetY, targetZ;
    const pos = options.origin || options.pos;
    if (pos && typeof pos.x === 'number' && typeof pos.z === 'number') {
      targetX = Math.round(pos.x);
      targetZ = Math.round(pos.z);
      if (typeof pos.y === 'number') {
        targetY = Math.round(pos.y);
      } else {
        const gh = this.worldGen.getHeight(targetX, targetZ);
        targetY = Math.max(gh, Math.round(this.player.physics.position.y) - 1);
      }
    } else {
      const forward = this.cameraController.getForwardVector();
      const dist = type === 'pyramid' || type === 'castle' ? 12 : 8;
      targetX = Math.round(this.player.physics.position.x + forward.x * dist);
      targetZ = Math.round(this.player.physics.position.z + forward.z * dist);
      const gh = this.worldGen.getHeight(targetX, targetZ);
      targetY = Math.max(gh, Math.round(this.player.physics.position.y) - 1);
    }

    const blocks = StructureBuilder.getStructureBlocks(type, targetX, targetY, targetZ);

    // Ensure chunks around target are loaded
    const minCx = Math.floor((targetX - 24) / 16);
    const maxCx = Math.floor((targetX + 24) / 16);
    const minCz = Math.floor((targetZ - 24) / 16);
    const maxCz = Math.floor((targetZ + 24) / 16);
    for (let cz = minCz; cz <= maxCz; cz++) {
      for (let cx = minCx; cx <= maxCx; cx++) {
        this.chunkManager.loadChunk(cx, cz);
      }
    }

    // Save undo batch
    const undoBatch = [];
    for (const b of blocks) {
      const oldId = this.chunkManager.getBlock(b.x, b.y, b.z);
      undoBatch.push({ x: b.x, y: b.y, z: b.z, oldBlockId: oldId, newBlockId: b.blockId });
    }
    if (this.webMcpUndoStack) {
      this.webMcpUndoStack.push(undoBatch);
      if (this.webMcpUndoStack.length > 20) this.webMcpUndoStack.shift();
    }

    // Scenic camera positioning only if explicitly requested (e.g. from Quick Build UI)
    if (options.adjustCamera === true) {
      const offsetDist = type === 'pyramid' || type === 'castle' ? 16 : 11;
      const viewX = targetX;
      const viewZ = targetZ + offsetDist;
      const viewGroundY = this.worldGen.getHeight(viewX, viewZ);
      const viewY = Math.max(targetY + 3.0, viewGroundY + 2.5);

      this.player.physics.position.set(viewX, viewY, viewZ);
      this.player.physics.velocity.set(0, 0, 0);
      this.player.physics.isFlying = true;

      // Aim camera directly at the building facade
      const eyeY = viewY + 1.62;
      const dx = targetX - viewX;
      const dy = (targetY + 3.2) - eyeY;
      const dz = targetZ - viewZ;
      const horizDist = Math.sqrt(dx * dx + dz * dz);
      this.cameraController.yaw = Math.atan2(-dx, -dz);
      this.cameraController.pitch = Math.atan2(dy, horizDist);
      this.cameraController.euler.x = this.cameraController.pitch;
      this.cameraController.euler.y = this.cameraController.yaw;
      this.cameraController.euler.z = 0;
      this.camera.quaternion.setFromEuler(this.cameraController.euler);
    }

    if (options.instant) {
      this.chunkManager.setBlocksBatch(blocks);
      sound.playBlockPlace('wood');
      this.broadcastUI();
    return { targetX, targetY, targetZ, count: blocks.length };
    }

    // Cancel any previous build before starting another one.
    if (this.structureBuildTimer) clearInterval(this.structureBuildTimer);

    // Smooth progressive construction with SFX and particle bursts
    let index = 0;
    const batchSize = 12;
    this.structureBuildTimer = setInterval(() => {
      if (index >= blocks.length) {
        clearInterval(this.structureBuildTimer);
        this.structureBuildTimer = null;
        sound.playLevelUp?.();
        this.broadcastUI();
        return;
      }
      const batch = blocks.slice(index, index + batchSize);
      this.chunkManager.setBlocksBatch(batch);
      for (const b of batch) {
        if (b.blockId !== BLOCKS.AIR) {
          this.particleEngine.spawnBlockBreakParticles(b.x, b.y, b.z, b.blockId);
        }
      }
      sound.playBlockPlace(batch[0]?.sound || 'wood');
      this.handViewModel.triggerSwing();
      index += batchSize;
    }, 25);

    return { targetX, targetY, targetZ, count: blocks.length, type };
  }

  // Main Game Loop
  loop(time) {
    if (!this.isRunning) return;

    const dt = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;

    // FPS calculation
    this.frameCount++;
    if (time - this.fpsTimer >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsTimer = time;
      this.broadcastUI();
    }

    if (!this.isPaused && !this.isInventoryOpen && !this.isCraftingTableOpen && !this.isFurnaceOpen && !this.isChestOpen) {
      // 1. Mouse look
      const { dx, dy } = this.inputManager.consumeMouseDelta();
      this.cameraController.updateLook(dx, dy);

      // 2. Player Movement & Physics
      this.player.update(dt, this.inputManager.keys, this.cameraController.yaw);

      // Footstep cadence
      const speed = Math.sqrt(this.player.physics.velocity.x ** 2 + this.player.physics.velocity.z ** 2);
      if (this.player.physics.onGround && speed > 1.0) {
        this.stepTimer = (this.stepTimer || 0) + dt * (this.player.physics.isSprinting ? 15.0 : 10.0);
        if (this.stepTimer >= Math.PI) {
          this.stepTimer = 0;
          const groundBlock = this.chunkManager.getBlock(
            Math.floor(this.player.physics.position.x),
            Math.floor(this.player.physics.position.y - 0.2),
            Math.floor(this.player.physics.position.z)
          );
          const gDef = getBlockDef(groundBlock);
          sound.playFootstep(gDef.sound || 'grass');
        }
      } else {
        this.stepTimer = 0;
      }

      // 3. Camera Positioning & Head Bob
      this.cameraController.update(
        dt,
        this.player.physics,
        this.player.physics.isSprinting,
        this.player.physics.inWater
      );

      // 4. Mining & Block interaction
      this.handleMining(dt);

      // 5. Item Drops update
      for (let i = this.itemDrops.length - 1; i >= 0; i--) {
        const drop = this.itemDrops[i];
        const removed = drop.update(dt, this.player.physics.position, this.player);
        if (removed) {
          this.itemDrops.splice(i, 1);
        }
      }

      // 6. Mobs update
      const isNight = (this.skybox.timeOfDay > 0.75 || this.skybox.timeOfDay < 0.2);
      this.mobManager.update(dt, this.player.physics.position, this.player, isNight);

      // 7. Dynamic Lighting & Handheld Torch
      const selected = this.player.getSelectedSlot();
      const isHoldingTorch = selected && selected.id === BLOCKS.TORCH;
      this.lightEngine.update(this.player.physics.position, isHoldingTorch);

      // 8. Skybox & Day/Night Cycle
      this.skybox.update(dt, this.player.physics.position, this.player.physics.headInWater);

      // 9. Particle Engine AAA: torch smoke, lava embers, rain splash
      // torch smoke tick every 0.35s near player torches
      this.torchSmokeTimer = (this.torchSmokeTimer||0)+dt;
      if(this.torchSmokeTimer>0.38){
        this.torchSmokeTimer=0;
        // find nearest torch within 8 blocks
        const px=Math.floor(this.player.physics.position.x), py=Math.floor(this.player.physics.position.y), pz=Math.floor(this.player.physics.position.z);
        for(let dx=-6;dx<=6;dx++) for(let dy=-2;dy<=3;dy++) for(let dz=-6;dz<=6;dz++){
          if(this.chunkManager.getBlock(px+dx, py+dy, pz+dz)===BLOCKS.TORCH && Math.random()<0.22){
            this.particleEngine.spawnTorchSmoke(px+dx, py+dy, pz+dz);
          }
          if(this.chunkManager.getBlock(px+dx, py+dy, pz+dz)===BLOCKS.LAVA && Math.random()<0.12){
            this.particleEngine.spawnLavaEmber(px+dx, py+dy, pz+dz);
          }
        }
        if(this.weather.isRaining && this.player.physics.onGround && !this.player.physics.headInWater){
          const rx=px + (Math.random()-0.5)*10, rz=pz + (Math.random()-0.5)*10;
          const gy=this.worldGen.getHeight(rx, rz);
          if(Math.random()<0.65) this.particleEngine.spawnRainSplash(rx, gy+1, rz, 2);
        }
      }
      this.particleEngine.update(dt);

      // 10. Hand ViewModel with walking bobbing
      this.handViewModel.update(dt, this.player.physics.onGround && speed > 1.0, speed);

      // 11. Dynamic Chunk Loading / Unloading
      this.chunkManager.update(this.player.physics.position, 2);

      // 12. Furnace Tick
      furnaceManager.update(dt);

      // 13. Weather
      this.weather.update(dt, this.player.physics.position, this.biomeGen.getBiomeData(Math.floor(this.player.physics.position.x), Math.floor(this.player.physics.position.z)).type);

      // 14. Lava damage
      const feetBlock = this.chunkManager.getBlock(Math.floor(this.player.physics.position.x), Math.floor(this.player.physics.position.y+0.3), Math.floor(this.player.physics.position.z));
      if(feetBlock===BLOCKS.LAVA && this.player.gameMode!=='creative'){
        this.lavaHurtTimer = (this.lavaHurtTimer||0)+dt;
        if(this.lavaHurtTimer>0.6){ this.player.takeDamage(2, 'Lava'); this.lavaHurtTimer=0; }
      } else { this.lavaHurtTimer=0; }

      // 15. Farmland hydration check (moist if water nearby)
      // (visual only, no tick needed for now)

      // 16. Wheat growth tick
      if(Math.random()<0.02){
        // attempt to grow one wheat near player
        const rx=Math.floor(this.player.physics.position.x + (Math.random()-0.5)*12);
        const rz=Math.floor(this.player.physics.position.z + (Math.random()-0.5)*12);
        for(let y=62; y<100; y++){
          if(this.chunkManager.getBlock(rx,y,rz)===BLOCKS.WHEAT){
            // chance to stay same; wheat already mature has no stages; skip
            break;
          }
        }
      }
    }

    // Render Three.js Scene
    this.renderer.render(this.scene, this.camera);

    requestAnimationFrame((t) => this.loop(t));
  }

  // Save current game state
  async autoSave() {
    const saveData = {
      playerPos: { x: this.player.physics.position.x, y: this.player.physics.position.y, z: this.player.physics.position.z },
      health: this.player.health,
      hunger: this.player.hunger,
      inventory: this.player.inventory,
      timeOfDay: this.skybox.timeOfDay,
      gameMode: this.player.gameMode,
    };
    await worldStorage.saveWorld('autosave', saveData);
  }

  // Load saved state
  async loadSaveData(data) {
    if (!data) return;
    if (data.playerPos) {
      this.player.physics.position.set(data.playerPos.x, data.playerPos.y, data.playerPos.z);
    }
    if (data.health) this.player.health = data.health;
    if (data.hunger) this.player.hunger = data.hunger;
    if (data.inventory) this.player.inventory = data.inventory;
    if (data.timeOfDay) this.skybox.setTimeOfDay(data.timeOfDay);
    if (data.gameMode) this.player.gameMode = data.gameMode;

    this.handViewModel.updateHeldItem(this.player.getSelectedSlot());
    this.broadcastUI();
  }

  handleResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  dispose() {
    this.isRunning = false;
    this.renderer.dispose();
    this.container.innerHTML = '';
  }
}
