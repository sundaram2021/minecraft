import * as THREE from 'three';
import { AABB } from './AABB.js';
import { BLOCKS, getBlockDef } from '../world/Blocks.js';

export class PlayerPhysics {
  constructor(chunkManager) {
    this.chunkManager = chunkManager;

    // Player bounding box & properties
    this.width = 0.6;
    this.height = 1.8;
    this.crouchHeight = 1.5;
    this.eyeHeight = 1.62;
    this.crouchEyeHeight = 1.35;
    this.swimEyeHeight = 1.0;

    this.position = new THREE.Vector3(0, 45, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.aabb = new AABB(0, 0, 0, 0, 0, 0);

    // States
    this.onGround = false;
    this.inWater = false;
    this.headInWater = false;
    this.onSoulSand = false;
    this.onSoulSoil = false;
    this.onLadder = false;
    this.isSprinting = false;
    this.isSneaking = false;
    this.isFlying = false;
    this._justLanded = false;
    this._landVelocity = 0;

    // Movement speeds (units/sec)
    this.walkSpeed = 4.3;
    this.sprintSpeed = 6.8;
    this.sneakSpeed = 1.3;
    this.swimSpeed = 2.5;
    this.flySpeed = 12.0;

    // Constants
    this.gravity = -30.0;
    this.jumpForce = 8.6;
    this.stepHeight = 0.6; // Auto-step climbing
  }

  // Get current bounding box
  getAABB() {
    const curHeight = this.isSneaking ? this.crouchHeight : this.height;
    return this.aabb.setPosition(this.position.x, this.position.y, this.position.z, this.width, curHeight);
  }

  // Get current camera eye position
  getEyePosition() {
    let curEye = this.eyeHeight;
    if (this.inWater) curEye = this.swimEyeHeight;
    else if (this.isSneaking) curEye = this.crouchEyeHeight;

    return new THREE.Vector3(
      this.position.x,
      this.position.y + curEye,
      this.position.z
    );
  }

  // Collect potential colliding voxel bounding boxes around player
  getSurroundingBlockBoxes(box) {
    const minX = Math.floor(box.minX - 0.5);
    const maxX = Math.ceil(box.maxX + 0.5);
    const minY = Math.floor(box.minY - 0.5);
    const maxY = Math.ceil(box.maxY + 0.5);
    const minZ = Math.floor(box.minZ - 0.5);
    const maxZ = Math.ceil(box.maxZ + 0.5);

    const boxes = [];

    for (let y = minY; y <= maxY; y++) {
      for (let z = minZ; z <= maxZ; z++) {
        for (let x = minX; x <= maxX; x++) {
          const blockId = this.chunkManager.getBlock(x, y, z);
          if (blockId !== BLOCKS.AIR) {
            const def = getBlockDef(blockId);
            if (def.solid && !def.isPlantOrMesh) {
              boxes.push(new AABB(x, y, z, x + 1, y + 1, z + 1));
            }
          }
        }
      }
    }

    return boxes;
  }

  // Check water / special blocks
  checkWater() {
    const blockFeet = this.chunkManager.getBlock(
      Math.floor(this.position.x),
      Math.floor(this.position.y + 0.2),
      Math.floor(this.position.z)
    );
    const blockHead = this.chunkManager.getBlock(
      Math.floor(this.position.x),
      Math.floor(this.position.y + this.eyeHeight),
      Math.floor(this.position.z)
    );
    const blockGround = this.chunkManager.getBlock(
      Math.floor(this.position.x),
      Math.floor(this.position.y - 0.2),
      Math.floor(this.position.z)
    );
    this.inWater = (blockFeet === BLOCKS.WATER);
    this.headInWater = (blockHead === BLOCKS.WATER);
    this.onSoulSand = (blockGround === BLOCKS.SOUL_SAND);
    this.onSoulSoil = (blockGround === BLOCKS.SOUL_SOIL);
    // Ladder / vines climbing: check block at feet or eyes is ladder/fence? For now IRON_BARS as ladder proxy + future LADDER
    const ladderBlock = this.chunkManager.getBlock(Math.floor(this.position.x), Math.floor(this.position.y+0.5), Math.floor(this.position.z));
    this.onLadder = (ladderBlock === BLOCKS.IRON_BARS || ladderBlock === BLOCKS.OAK_FENCE);
  }

  // Check if player would step off a ledge when sneaking
  isLedgeDrop(dx, dz) {
    if (!this.onGround || !this.isSneaking) return false;

    // Test positions below feet
    const testX = this.position.x + dx;
    const testZ = this.position.z + dz;
    const groundY = Math.floor(this.position.y - 0.2);

    const blockBelow = this.chunkManager.getBlock(Math.floor(testX), groundY, Math.floor(testZ));
    const def = getBlockDef(blockBelow);
    return !def.solid;
  }

  // Update physics step
  update(dt, inputState, cameraYaw) {
    this.checkWater();

    this.isSprinting = inputState.sprint && inputState.forward && !this.inWater && !this.isSneaking;
    this.isSneaking = inputState.sneak && this.onGround && !this.inWater && !this.isFlying;

    // Movement direction from camera yaw
    const forward = new THREE.Vector3(-Math.sin(cameraYaw), 0, -Math.cos(cameraYaw)).normalize();
    const right = new THREE.Vector3(Math.cos(cameraYaw), 0, -Math.sin(cameraYaw)).normalize();

    let moveDir = new THREE.Vector3(0, 0, 0);
    if (inputState.forward) moveDir.add(forward);
    if (inputState.backward) moveDir.sub(forward);
    if (inputState.right) moveDir.add(right);
    if (inputState.left) moveDir.sub(right);

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
    }

    // Determine target speed AAA: soul sand slows 40%, souls soil slight boost on sprint, ice slippery handled via friction
    let targetSpeed = this.walkSpeed;
    if (this.isFlying) targetSpeed = this.flySpeed;
    else if (this.onLadder) targetSpeed = 2.2;
    else if (this.inWater) targetSpeed = this.swimSpeed;
    else if (this.onSoulSand) targetSpeed = this.walkSpeed * 0.42;
    else if (this.onSoulSoil && this.isSprinting) targetSpeed = this.sprintSpeed * 1.12;
    else if (this.isSprinting) targetSpeed = this.sprintSpeed;
    else if (this.isSneaking) targetSpeed = this.sneakSpeed;

    // Apply horizontal acceleration & ground/air friction
    const accel = this.onGround ? 60.0 : (this.inWater ? 30.0 : 25.0);
    const friction = this.onGround ? 12.0 : (this.inWater ? 8.0 : 3.0);

    this.velocity.x += (moveDir.x * targetSpeed - this.velocity.x) * Math.min(1, friction * dt);
    this.velocity.z += (moveDir.z * targetSpeed - this.velocity.z) * Math.min(1, friction * dt);

    // AAA Vertical Physics with ladder climb, sweet swim, soul soil boost
    if (this.isFlying) {
      let flyY = 0;
      if (inputState.jump) flyY += this.flySpeed;
      if (inputState.sneak) flyY -= this.flySpeed;
      this.velocity.y += (flyY - this.velocity.y) * Math.min(1, 10.0 * dt);
    } else if (this.onLadder) {
      this.velocity.y *= 0.52; // sticky ladder
      if (inputState.jump) this.velocity.y = 3.2;
      else if (inputState.sneak) this.velocity.y = -2.2;
      else if (inputState.forward || inputState.backward) this.velocity.y = 2.0;
      else this.velocity.y = Math.max(-1.5, this.velocity.y - 1.5*dt);
      if (this.onGround && inputState.jump) { this.velocity.y = this.jumpForce * 0.92; this.onGround=false; }
    } else if (this.inWater) {
      // AAA Swimming: buoyancy + sprint swim faster, sink gently
      const swimAccel = this.isSprinting ? 22 : 16;
      this.velocity.y += -6.5 * dt;
      if (inputState.jump) this.velocity.y = this.isSprinting ? 4.2 : 3.6;
      else if (inputState.sneak) this.velocity.y = -3.8;
      // water friction higher for AAA viscous feel
      this.velocity.y = Math.max(-4.2, Math.min(4.6, this.velocity.y));
      if (this.headInWater && inputState.jump) {
        // surface bob boost
        this.velocity.y += 0.6;
      }
    } else {
      this.velocity.y += this.gravity * dt;
      this.velocity.y = Math.max(-42.0, this.velocity.y);
      if (inputState.jump && this.onGround) {
        let jump = this.jumpForce;
        if (this.onSoulSand) jump *= 0.62;
        else if (this.isSprinting) jump *= 1.08;
        this.velocity.y = jump;
        this.onGround = false;
      }
      // soul soil step height boost
      if (this.onSoulSoil && this.onGround && inputState.forward) {
        // will be handled via stepHeight increase below
      }
    }

    // Attempt Movement with Swept Collision Resolution
    let dx = this.velocity.x * dt;
    let dy = this.velocity.y * dt;
    let dz = this.velocity.z * dt;

    if (this.isFlying) {
      // Noclip / smooth fly in creative
      this.position.x += dx;
      this.position.y += dy;
      this.position.z += dz;
      return;
    }

    // Sneak edge protection check
    if (this.isSneaking && this.onGround) {
      if (this.isLedgeDrop(dx, 0)) dx = 0;
      if (this.isLedgeDrop(0, dz)) dz = 0;
    }

    // AAA friction: ice = 0.98 slippery, soul sand sticky = 0.55
    const groundBlock = this.chunkManager.getBlock(Math.floor(this.position.x), Math.floor(this.position.y - 0.2), Math.floor(this.position.z));
    const groundIsIce = groundBlock === BLOCKS.ICE;
    if (groundIsIce && this.onGround) {
      this.velocity.x *= 0.992;
      this.velocity.z *= 0.992;
    }

    const playerBox = this.getAABB();
    const solidBoxes = this.getSurroundingBlockBoxes(playerBox);

    // 1. Move Y axis first with landing detection
    const prevOnGround = this.onGround;
    const prevVelY = this.velocity.y;
    const originalDy = dy;
    for (const box of solidBoxes) {
      dy = playerBox.calculateYOffset(box, dy);
    }
    playerBox.offset(0, dy, 0);
    this.onGround = (originalDy < 0 && dy !== originalDy);
    if (!prevOnGround && this.onGround) {
      this._justLanded = true;
      this._landVelocity = prevVelY;
    }

    if (this.onGround && originalDy < 0) {
      this.velocity.y = 0;
    }
    if (originalDy > 0 && dy !== originalDy) {
      this.velocity.y = 0; // Hit ceiling
    }

    // 2. Step-up climbing check for smooth obstacle traversal
    let stepDx = dx;
    let stepDz = dz;

    // Normal X move
    for (const box of solidBoxes) {
      dx = playerBox.calculateXOffset(box, dx);
    }
    playerBox.offset(dx, 0, 0);

    // Normal Z move
    for (const box of solidBoxes) {
      dz = playerBox.calculateZOffset(box, dz);
    }
    playerBox.offset(0, 0, dz);

    // If collided horizontally on ground, try stepping up
    if (this.onGround && (dx !== stepDx || dz !== stepDz)) {
      const stepBox = this.aabb.clone();
      stepBox.offset(0, this.stepHeight, 0);
      const stepSolid = this.getSurroundingBlockBoxes(stepBox);

      let sx = stepDx;
      let sz = stepDz;
      for (const box of stepSolid) {
        sx = stepBox.calculateXOffset(box, sx);
      }
      stepBox.offset(sx, 0, 0);
      for (const box of stepSolid) {
        sz = stepBox.calculateZOffset(box, sz);
      }
      stepBox.offset(0, 0, sz);

      // If stepped move travelled further, adopt stepped position
      if (sx * sx + sz * sz > dx * dx + dz * dz) {
        // Step down to ground
        let stepDown = -this.stepHeight;
        for (const box of stepSolid) {
          stepDown = stepBox.calculateYOffset(box, stepDown);
        }
        stepBox.offset(0, stepDown, 0);

        this.position.x = (stepBox.minX + stepBox.maxX) / 2;
        this.position.y = stepBox.minY;
        this.position.z = (stepBox.minZ + stepBox.maxZ) / 2;
        return;
      }
    }

    // Apply resolved position
    this.position.x = (playerBox.minX + playerBox.maxX) / 2;
    this.position.y = playerBox.minY;
    this.position.z = (playerBox.minZ + playerBox.maxZ) / 2;
  }
}
