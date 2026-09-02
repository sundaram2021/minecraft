import * as THREE from 'three';

export class CameraController {
  constructor(camera) {
    this.camera = camera;
    this.pitch = 0;
    this.yaw = 0;
    this.sensitivity = 0.0022;

    this.baseFov = 75;
    this.currentFov = 75;

    // Head bobbing
    this.bobTimer = 0;
    this.bobIntensity = 0.05;
    this.enableBobbing = true;

    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
  }

  // Update pitch/yaw from mouse input
  updateLook(dx, dy) {
    this.yaw -= dx * this.sensitivity;
    this.pitch -= dy * this.sensitivity;

    // Clamp pitch between -89.9 deg and +89.9 deg
    const maxPitch = Math.PI / 2 - 0.01;
    this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));

    this.euler.x = this.pitch;
    this.euler.y = this.yaw;
    this.camera.quaternion.setFromEuler(this.euler);
  }

  // AAA Update: head bob with landing spring, sprint FOV warp, crouch lerp, hurt roll, underwater
  update(dt, playerPhysics, isSprinting, inWater) {
    const eyePos = playerPhysics.getEyePosition();

    // AAA Head bobbing: sprint vs walk vs swim uses different frequencies + vertical spring on landing
    let bobY = 0;
    let bobX = 0;
    let bobRoll = 0;
    const speed = Math.sqrt(playerPhysics.velocity.x * playerPhysics.velocity.x + playerPhysics.velocity.z * playerPhysics.velocity.z);
    const isMoving = speed > 0.6;

    if (this.enableBobbing && isMoving) {
      if (playerPhysics.onGround) {
        this.bobTimer += dt * (isSprinting ? 18.5 : playerPhysics.isSneaking ? 7.5 : playerPhysics.inWater ? 9.0 : 11.2);
        const amp = playerPhysics.inWater ? 0.04 : isSprinting ? 0.085 : playerPhysics.isSneaking ? 0.025 : 0.055;
        bobY = Math.sin(this.bobTimer) * amp;
        bobX = Math.cos(this.bobTimer * 0.5) * (amp * 0.62);
        bobRoll = Math.sin(this.bobTimer * 0.5) * (isSprinting ? 0.012 : 0.007);
      } else if (playerPhysics.inWater) {
        this.bobTimer += dt * 6.0;
        bobY = Math.sin(this.bobTimer) * 0.03;
        bobX = Math.cos(this.bobTimer * 0.34) * 0.02;
      }
    } else {
      this.bobTimer *= 0.92; // damp
    }

    // Landing spring: vertical recoil when hitting ground
    this.landingSpring = this.landingSpring || 0;
    if (playerPhysics.onGround && playerPhysics._justLanded) {
      this.landingSpring = Math.min(0.26, Math.abs(playerPhysics._landVelocity || 0) * 0.028);
      playerPhysics._justLanded = false;
    }
    this.landingSpring *= Math.pow(0.14, dt*14);
    bobY -= this.landingSpring;

    // Crouch camera lerp - smooth 90ms
    this.crouchLerp = this.crouchLerp || 0;
    const targetCrouch = playerPhysics.isSneaking ? 1 : 0;
    this.crouchLerp += (targetCrouch - this.crouchLerp) * Math.min(1, dt*14);
    const crouchDrop = this.crouchLerp * 0.28;

    this.camera.position.set(
      eyePos.x + bobX,
      eyePos.y + bobY - crouchDrop,
      eyePos.z
    );
    // synchronize camera orientation with yaw, pitch, and bobRoll
    this.euler.x = this.pitch;
    this.euler.y = this.yaw;
    this.euler.z = bobRoll;
    this.camera.quaternion.setFromEuler(this.euler);

    // AAA Dynamic FOV: sprint warp 82°, sneaking 70°, water 62°, flying 85°
    let targetFov = this.baseFov;
    if (isSprinting) targetFov = 82;
    else if (playerPhysics.isSneaking) targetFov = 71;
    else if (playerPhysics.isFlying) targetFov = 85;
    if (inWater || playerPhysics.headInWater) targetFov -= 9;
    if (playerPhysics.onSoulSand) targetFov -= 3;

    this.currentFov += (targetFov - this.currentFov) * Math.min(1, dt * (isSprinting? 8 : 10));
    this.camera.fov = this.currentFov;
    this.camera.updateProjectionMatrix();
  }

  getForwardVector() {
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    return dir;
  }
}
