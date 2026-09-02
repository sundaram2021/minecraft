import * as THREE from 'three';
import { Pig } from './Pig.js';
import { Cow } from './Cow.js';
import { Zombie } from './Zombie.js';
import { Creeper } from './Creeper.js';
import { Skeleton } from './Skeleton.js';
import { Sheep } from './Sheep.js';
import { Chicken } from './Chicken.js';
import { Spider } from './Spider.js';
import { Enderman } from './Enderman.js';
import { Wolf } from './Wolf.js';
import { BLOCKS } from '../world/Blocks.js';
import { WORLD_HEIGHT } from '../world/WorldGen.js';

export class MobManager {
  constructor(scene, chunkManager, particleEngine, spawnItemDropCallback) {
    this.scene = scene;
    this.chunkManager = chunkManager;
    this.particleEngine = particleEngine;
    this.spawnItemDrop = spawnItemDropCallback;
    this.mobs = [];
    this.spawnTimer = 0;
    this.maxMobs = 28;
  }

  // Spawn an individual mob
  spawnMob(type, x, y, z) {
    let mob = null;
    if (type === 'pig') mob = new Pig(this.scene, this.chunkManager, x, y, z);
    else if (type === 'cow') mob = new Cow(this.scene, this.chunkManager, x, y, z);
    else if (type === 'sheep') mob = new Sheep(this.scene, this.chunkManager, x, y, z);
    else if (type === 'chicken') mob = new Chicken(this.scene, this.chunkManager, x, y, z);
    else if (type === 'wolf') mob = new Wolf(this.scene, this.chunkManager, x, y, z);
    else if (type === 'zombie') mob = new Zombie(this.scene, this.chunkManager, x, y, z);
    else if (type === 'creeper') mob = new Creeper(this.scene, this.chunkManager, this.particleEngine, x, y, z);
    else if (type === 'skeleton') mob = new Skeleton(this.scene, this.chunkManager, x, y, z);
    else if (type === 'spider') mob = new Spider(this.scene, this.chunkManager, x, y, z);
    else if (type === 'enderman') mob = new Enderman(this.scene, this.chunkManager, x, y, z);

    if (mob) {
      this.mobs.push(mob);
    }
    return mob;
  }

  // Periodic natural mob spawner around player
  checkNaturalSpawning(dt, playerPos, isNight) {
    this.spawnTimer += dt;
    if (this.spawnTimer < 4.0) return;
    this.spawnTimer = 0;

    if (this.mobs.length >= this.maxMobs) return;

    // Pick random coordinate 16-32 blocks away from player
    const angle = Math.random() * Math.PI * 2;
    const dist = 16 + Math.random() * 18;
    const sx = Math.floor(playerPos.x + Math.sin(angle) * dist);
    const sz = Math.floor(playerPos.z + Math.cos(angle) * dist);

    // Find surface height
    let sy = -1;
    for (let y = WORLD_HEIGHT - 6; y >= 2; y--) {
      const b = this.chunkManager.getBlock(sx, y, sz);
      if (b !== BLOCKS.AIR && b !== BLOCKS.WATER) {
        sy = y + 1;
        break;
      }
    }

    if (sy < 2 || sy > WORLD_HEIGHT-4) return;

    // Determine mob type based on day/night & biome awareness
    if (isNight) {
      const r = Math.random();
      if (r < 0.28) this.spawnMob('zombie', sx, sy, sz);
      else if (r < 0.48) this.spawnMob('skeleton', sx, sy, sz);
      else if (r < 0.68) this.spawnMob('creeper', sx, sy, sz);
      else if (r < 0.84) this.spawnMob('spider', sx, sy, sz);
      else this.spawnMob('enderman', sx, sy, sz);
    } else {
      const r = Math.random();
      if (r < 0.2) this.spawnMob('sheep', sx, sy, sz);
      else if (r < 0.35) this.spawnMob('pig', sx, sy, sz);
      else if (r < 0.5) this.spawnMob('cow', sx, sy, sz);
      else if (r < 0.68) this.spawnMob('chicken', sx, sy, sz);
      else if (r < 0.82) this.spawnMob('wolf', sx, sy, sz);
      else this.spawnMob('sheep', sx, sy, sz);
    }
  }

  update(dt, playerPos, playerEntity, isNight) {
    this.checkNaturalSpawning(dt, playerPos, isNight);

    for (let i = this.mobs.length - 1; i >= 0; i--) {
      const mob = this.mobs[i];

      if (mob.isDead) {
        // Spawn death poof particles & loot
        if (this.particleEngine) {
          this.particleEngine.spawnDeathPoof(mob.position);
        }

        if (this.spawnItemDrop) {
          if (mob.type === 'pig') this.spawnItemDrop('raw_porkchop', 1 + Math.floor(Math.random() * 2), mob.position.x, mob.position.y + 0.5, mob.position.z);
          else if (mob.type === 'cow') this.spawnItemDrop('raw_beef', 1 + Math.floor(Math.random() * 2), mob.position.x, mob.position.y + 0.5, mob.position.z);
          else if (mob.type === 'sheep') {
            const woolBlock = 61 + (mob.woolColor||0);
            this.spawnItemDrop(woolBlock, 1, mob.position.x, mob.position.y + 0.5, mob.position.z);
          }
          else if (mob.type === 'chicken') { this.spawnItemDrop('feather', 1, mob.position.x, mob.position.y + 0.5, mob.position.z); if(Math.random()<0.5) this.spawnItemDrop('egg',1,mob.position.x, mob.position.y+0.5, mob.position.z); }
          else if (mob.type === 'wolf') this.spawnItemDrop('bone', 1, mob.position.x, mob.position.y + 0.5, mob.position.z);
          else if (mob.type === 'zombie') this.spawnItemDrop('bone', 1, mob.position.x, mob.position.y + 0.5, mob.position.z);
          else if (mob.type === 'creeper') this.spawnItemDrop('gunpowder', 1, mob.position.x, mob.position.y + 0.5, mob.position.z);
          else if (mob.type === 'skeleton') this.spawnItemDrop('arrow', 1 + Math.floor(Math.random() * 2), mob.position.x, mob.position.y + 0.5, mob.position.z);
          else if (mob.type === 'spider') this.spawnItemDrop('string', 1, mob.position.x, mob.position.y + 0.5, mob.position.z);
          else if (mob.type === 'enderman') this.spawnItemDrop('ender_pearl', 1, mob.position.x, mob.position.y + 0.5, mob.position.z);
        }

        mob.dispose();
        this.mobs.splice(i, 1);
        continue;
      }

      // Despawn far away mobs (> 50 blocks)
      if (mob.position.distanceTo(playerPos) > 55) {
        mob.dispose();
        this.mobs.splice(i, 1);
        continue;
      }

      mob.update(dt, playerPos, playerEntity);
    }
  }

  // Hit test against mobs when player attacks (Left Click)
  hitMob(rayOrigin, rayDir, attackDamage = 6) {
    let closestMob = null;
    let minDist = 3.8;

    for (const mob of this.mobs) {
      if (mob.isDead) continue;
      const mobPos = mob.position.clone().add(new THREE.Vector3(0, 0.8, 0));
      const distToRay = new THREE.Vector3().subVectors(mobPos, rayOrigin);
      const proj = distToRay.dot(rayDir);

      if (proj > 0 && proj < minDist) {
        const perpDist = distToRay.clone().sub(rayDir.clone().multiplyScalar(proj)).length();
        if (perpDist < 0.8) {
          closestMob = mob;
          minDist = proj;
        }
      }
    }

    if (closestMob) {
      closestMob.takeDamage(attackDamage, rayDir);
      return closestMob;
    }
    return null;
  }

  clear() {
    for (const mob of this.mobs) {
      mob.dispose();
    }
    this.mobs = [];
  }
}
