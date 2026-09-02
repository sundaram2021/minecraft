import { PlayerPhysics } from '../physics/PlayerPhysics.js';
import { sound } from '../audio/SoundSynthesizer.js';
import { BLOCKS } from '../world/Blocks.js';

export class Player {
  constructor(chunkManager) {
    this.physics = new PlayerPhysics(chunkManager);

    this.gameMode = 'survival'; // 'survival' or 'creative'

    // Survival Stats
    this.health = 20;
    this.maxHealth = 20;
    this.hunger = 20;
    this.maxHunger = 20;
    this.oxygen = 20;
    this.maxOxygen = 20;

    // Damage & Fall tracking
    this.hurtTimer = 0;
    this.lastHurtCause = '';
    this.peakAirY = 45;
    this.wasInAir = false;

    // Timers
    this.hungerTimer = 0;
    this.regenTimer = 0;
    this.drownTimer = 0;

    // Hotbar & Inventory (36 total slots: 0-8 Hotbar, 9-35 Main Inventory)
    this.inventory = new Array(36).fill(null);
    this.selectedHotbarIndex = 0;

    // Starting items in hotbar - extended starter kit
    this.inventory[0] = { id: BLOCKS.OAK_LOG, count: 16 };
    this.inventory[1] = { id: BLOCKS.COBBLESTONE, count: 32 };
    this.inventory[2] = { id: BLOCKS.TORCH, count: 16 };
    this.inventory[3] = { id: 'wooden_pickaxe', count: 1, durability: 59, maxDurability: 59 };
    this.inventory[4] = { id: 'wooden_sword', count: 1, durability: 59, maxDurability: 59 };
    this.inventory[5] = { id: 'apple', count: 8 };
    this.inventory[6] = { id: 'shears', count: 1, durability: 238, maxDurability: 238 };
    this.inventory[7] = { id: 'wooden_hoe', count: 1, durability: 59, maxDurability: 59 };
    this.inventory[8] = { id: 'wheat', count: 5 };
  }

  getSelectedSlot() {
    return this.inventory[this.selectedHotbarIndex];
  }

  takeDamage(amount, cause = 'Unknown', knockbackDir = null) {
    if (this.gameMode === 'creative' || this.health <= 0) return;

    this.health = Math.max(0, this.health - amount);
    this.hurtTimer = 0.4;
    this.lastHurtCause = cause;
    sound.playPlayerHurt();

    if (knockbackDir) {
      this.physics.velocity.x += knockbackDir.x * 7.0;
      this.physics.velocity.y += 5.0;
      this.physics.velocity.z += knockbackDir.z * 7.0;
    }
  }

  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  eatFood(foodId) {
    let foodRestore = 4;
    if (foodId === 'apple') foodRestore = 4;
    else if (foodId === 'bread') foodRestore = 5;
    else if (foodId === 'wheat') foodRestore = 1;
    else if (foodId === 'melon_slice') foodRestore = 2;
    else if (foodId === 'raw_porkchop' || foodId === 'raw_beef') foodRestore = 3;
    else if (foodId === 'cooked_porkchop' || foodId === 'cooked_beef') foodRestore = 8;

    if (this.hunger < this.maxHunger) {
      this.hunger = Math.min(this.maxHunger, this.hunger + foodRestore);
      return true;
    }
    return false;
  }

  // Add item to inventory (stacks up to 64)
  addItem(itemId, count = 1) {
    // 1. Try stacking in existing matching slots
    for (let i = 0; i < this.inventory.length; i++) {
      const slot = this.inventory[i];
      if (slot && slot.id === itemId && slot.count < 64 && !slot.durability) {
        const canTake = 64 - slot.count;
        const take = Math.min(canTake, count);
        slot.count += take;
        count -= take;
        if (count <= 0) return true;
      }
    }

    // 2. Put in first empty slot
    for (let i = 0; i < this.inventory.length; i++) {
      if (!this.inventory[i]) {
        this.inventory[i] = { id: itemId, count };
        return true;
      }
    }

    return false; // Inventory full
  }

  // Remove count of selected item or decrement tool durability
  useSelectedItem(count = 1) {
    if (this.gameMode === 'creative') return; // Infinite items in creative

    const slot = this.inventory[this.selectedHotbarIndex];
    if (!slot) return;

    if (slot.durability !== undefined) {
      // Degrade durability
      slot.durability -= count;
      if (slot.durability <= 0) {
        sound.playBlockBreak('stone');
        this.inventory[this.selectedHotbarIndex] = null;
      }
    } else {
      slot.count -= count;
      if (slot.count <= 0) {
        this.inventory[this.selectedHotbarIndex] = null;
      }
    }
  }

  update(dt, inputState, cameraYaw) {
    this.physics.update(dt, inputState, cameraYaw);

    if (this.hurtTimer > 0) {
      this.hurtTimer -= dt;
    }

    if (this.gameMode === 'creative') {
      this.health = 20;
      this.hunger = 20;
      this.oxygen = 20;
      return;
    }

    // 1. Fall Damage Tracking
    if (!this.physics.onGround && !this.physics.inWater && !this.physics.isFlying) {
      if (!this.wasInAir) {
        this.peakAirY = this.physics.position.y;
        this.wasInAir = true;
      } else {
        this.peakAirY = Math.max(this.peakAirY, this.physics.position.y);
      }
    } else if (this.physics.onGround && this.wasInAir) {
      const fallDistance = this.peakAirY - this.physics.position.y;
      if (fallDistance > 3.5) {
        const dmg = Math.round(fallDistance - 3.0);
        this.takeDamage(dmg, 'Fall Damage');
      }
      this.wasInAir = false;
      this.peakAirY = this.physics.position.y;
    }

    // 2. Underwater Oxygen & Drowning
    if (this.physics.headInWater) {
      this.oxygen = Math.max(0, this.oxygen - dt * 2.5);
      if (this.oxygen <= 0) {
        this.drownTimer += dt;
        if (this.drownTimer >= 1.2) {
          this.takeDamage(2, 'Drowning');
          this.drownTimer = 0;
        }
      }
    } else {
      this.oxygen = Math.min(this.maxOxygen, this.oxygen + dt * 10.0);
      this.drownTimer = 0;
    }

    // 3. Hunger & Natural Regeneration
    this.hungerTimer += dt;
    if (this.hungerTimer >= 30.0) {
      // Natural hunger drain
      this.hungerTimer = 0;
      if (this.physics.isSprinting) {
        this.hunger = Math.max(0, this.hunger - 1);
      }
    }

    // Health regen when hunger is >= 18
    if (this.hunger >= 18 && this.health < this.maxHealth) {
      this.regenTimer += dt;
      if (this.regenTimer >= 4.0) {
        this.heal(1);
        this.regenTimer = 0;
      }
    }
  }

  respawn(spawnPos) {
    this.health = 20;
    this.hunger = 20;
    this.oxygen = 20;
    this.physics.position.copy(spawnPos);
    this.physics.velocity.set(0, 0, 0);
  }
}
