import * as THREE from 'three';

export class Skybox {
  constructor(scene) {
    this.scene = scene;
    this.timeOfDay = 0.25; // 0.25 = Noon, 0.75 = Sunset, 0.9 = Midnight, 0.2 = Sunrise
    this.daySpeed = 0.00045; // Smooth full day cycle

    // AAA Directional celestial sun/moon light with PCF Soft Shadows
    this.sunLight = new THREE.DirectionalLight(0xffffff, 1.35);
    this.sunLight.position.set(100, 160, 100);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(2048, 2048);
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 520;
    this.sunLight.shadow.camera.left = -160;
    this.sunLight.shadow.camera.right = 160;
    this.sunLight.shadow.camera.top = 160;
    this.sunLight.shadow.camera.bottom = -160;
    this.sunLight.shadow.bias = -0.00035;
    this.sunLight.shadow.radius = 3;
    this.sunLight.shadow.blurSamples = 12;
    this.scene.add(this.sunLight);

    // Hemisphere light for natural sky bounce (AAA)
    this.hemiLight = new THREE.HemisphereLight(0x77aaff, 0x2b1a0e, 0.38);
    this.scene.add(this.hemiLight);

    // Ambient environmental light
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.42);
    this.scene.add(this.ambientLight);

    // AAA Exponential Fog with biome lerp already in update()
    this.scene.fog = new THREE.FogExp2(0x78a7ff, 0.0095);

    // Celestial Group
    this.celestialGroup = new THREE.Group();
    this.scene.add(this.celestialGroup);

    // 1. Pixel-Art Sun Mesh with Corona Glow
    const sunCanvas = document.createElement('canvas');
    sunCanvas.width = 64;
    sunCanvas.height = 64;
    const sunCtx = sunCanvas.getContext('2d');
    sunCtx.fillStyle = 'rgba(255, 245, 180, 0.35)';
    sunCtx.fillRect(2, 2, 60, 60);
    sunCtx.fillStyle = '#fffae0';
    sunCtx.fillRect(10, 10, 44, 44);
    sunCtx.fillStyle = '#fff4a3';
    sunCtx.fillRect(14, 14, 36, 36);
    sunCtx.fillStyle = '#ffffff';
    sunCtx.fillRect(20, 20, 24, 24);

    const sunTex = new THREE.CanvasTexture(sunCanvas);
    sunTex.magFilter = THREE.NearestFilter;
    const sunMat = new THREE.MeshBasicMaterial({ map: sunTex, transparent: true, side: THREE.DoubleSide });
    this.sunMesh = new THREE.Mesh(new THREE.PlaneGeometry(36, 36), sunMat);
    this.sunMesh.position.set(0, 0, 320);
    this.sunMesh.lookAt(0, 0, 0);
    this.celestialGroup.add(this.sunMesh);

    // 2. Pixel-Art Moon Mesh with authentic craters
    const moonCanvas = document.createElement('canvas');
    moonCanvas.width = 64;
    moonCanvas.height = 64;
    const moonCtx = moonCanvas.getContext('2d');
    moonCtx.fillStyle = 'rgba(230, 240, 255, 0.25)';
    moonCtx.fillRect(4, 4, 56, 56);
    moonCtx.fillStyle = '#f0f4f8';
    moonCtx.fillRect(12, 12, 40, 40);
    moonCtx.fillStyle = '#b8c6d4';
    moonCtx.fillRect(16, 16, 12, 12);
    moonCtx.fillRect(32, 24, 14, 14);
    moonCtx.fillRect(20, 36, 10, 10);

    const moonTex = new THREE.CanvasTexture(moonCanvas);
    moonTex.magFilter = THREE.NearestFilter;
    const moonMat = new THREE.MeshBasicMaterial({ map: moonTex, transparent: true, side: THREE.DoubleSide });
    this.moonMesh = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), moonMat);
    this.moonMesh.position.set(0, 0, -320);
    this.moonMesh.lookAt(0, 0, 0);
    this.celestialGroup.add(this.moonMesh);

    // 3. Star Field (1,400 twinkling stars)
    const starCount = 1400;
    const starGeo = new THREE.BufferGeometry();
    const starPos = [];
    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 310;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      starPos.push(x, y, z);
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
    this.starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, transparent: true, opacity: 0 });
    this.starPoints = new THREE.Points(starGeo, this.starMaterial);
    this.scene.add(this.starPoints);

    // 4. Iconic Minecraft 3D Drifting Clouds Layer at Y=75
    this.initClouds();
  }

  // Create Minecraft's signature 2-layer horizontal voxel cloud layer
  initClouds() {
    const cloudCanvas = document.createElement('canvas');
    cloudCanvas.width = 128;
    cloudCanvas.height = 128;
    const ctx = cloudCanvas.getContext('2d');
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 128, 128);

    // Procedural pixel cloud shapes
    ctx.fillStyle = '#ffffff';
    for (let y = 0; y < 128; y += 8) {
      for (let x = 0; x < 128; x += 8) {
        if (Math.sin(x * 0.08) * Math.cos(y * 0.08) + Math.sin((x + y) * 0.05) > 0.15) {
          ctx.fillRect(x, y, 8, 8);
        }
      }
    }

    this.cloudTexture = new THREE.CanvasTexture(cloudCanvas);
    this.cloudTexture.magFilter = THREE.NearestFilter;
    this.cloudTexture.minFilter = THREE.NearestFilter;
    this.cloudTexture.wrapS = THREE.RepeatWrapping;
    this.cloudTexture.wrapT = THREE.RepeatWrapping;
    this.cloudTexture.repeat.set(4, 4);

    // Cloud Plane Material (translucent white cloud blocks)
    this.cloudMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      alphaMap: this.cloudTexture,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const cloudGeo = new THREE.PlaneGeometry(800, 800);
    this.cloudMesh = new THREE.Mesh(cloudGeo, this.cloudMaterial);
    this.cloudMesh.rotation.x = -Math.PI / 2;
    this.cloudMesh.position.set(0, 75, 0);
    this.scene.add(this.cloudMesh);

    // Second lower cloud rim for 3D thickness
    const cloudGeoLower = new THREE.PlaneGeometry(800, 800);
    this.cloudMeshLower = new THREE.Mesh(cloudGeoLower, this.cloudMaterial.clone());
    this.cloudMeshLower.material.opacity = 0.65;
    this.cloudMeshLower.material.color.setHex(0xd0d8e2);
    this.cloudMeshLower.rotation.x = -Math.PI / 2;
    this.cloudMeshLower.position.set(0, 73, 0);
    this.scene.add(this.cloudMeshLower);

    this.cloudOffset = 0;
  }

  setTimeOfDay(time) {
    this.timeOfDay = (time % 1.0 + 1.0) % 1.0;
  }

  update(dt, playerPos, isUnderwater = false) {
    this.timeOfDay = (this.timeOfDay + this.daySpeed * dt) % 1.0;

    // Follow player position horizontally
    this.celestialGroup.position.copy(playerPos);
    this.starPoints.position.copy(playerPos);

    if (this.cloudMesh) {
      this.cloudMesh.position.x = playerPos.x;
      this.cloudMesh.position.z = playerPos.z;
      this.cloudMeshLower.position.x = playerPos.x;
      this.cloudMeshLower.position.z = playerPos.z;

      // Drift clouds slowly towards East
      this.cloudOffset += dt * 0.008;
      this.cloudTexture.offset.set(this.cloudOffset, this.cloudOffset * 0.3);
    }

    // Celestial angle
    const angle = this.timeOfDay * Math.PI * 2;
    this.celestialGroup.rotation.x = angle;
    this.celestialGroup.rotation.z = Math.PI / 9;

    const sunHeight = Math.sin(angle);

    let skyColor = new THREE.Color(0x78a7ff);
    let lightColor = new THREE.Color(0xffffff);
    let lightIntensity = 1.25;
    let ambientIntensity = 0.48;
    let starOpacity = 0.0;

    if (isUnderwater) {
      skyColor.setHex(0x10365c);
      this.scene.fog.color.set(skyColor);
      this.scene.fog.density = 0.055;
      this.scene.background = skyColor;
      this.ambientLight.intensity = 0.3;
      this.sunLight.intensity = 0.4;
      return;
    }

    if (sunHeight > 0.22) {
      // Crisp Bright Day (Azure cyan Minecraft sky)
      skyColor.setHex(0x78a7ff);
      lightColor.setHex(0xfffaea);
      lightIntensity = 1.25;
      ambientIntensity = 0.52;
      starOpacity = 0.0;
      if (this.cloudMaterial) {
        this.cloudMaterial.color.setHex(0xffffff);
      }
    } else if (sunHeight > -0.12) {
      // Golden Sunrise / Crimson Sunset
      const t = (sunHeight + 0.12) / 0.34;
      const sunsetSky = new THREE.Color(0xd64d34);
      const daySky = new THREE.Color(0x78a7ff);
      skyColor.copy(sunsetSky).lerp(daySky, t);

      lightColor.setHex(0xffaa40);
      lightIntensity = THREE.MathUtils.lerp(0.35, 1.25, t);
      ambientIntensity = THREE.MathUtils.lerp(0.22, 0.52, t);
      starOpacity = THREE.MathUtils.lerp(0.85, 0.0, t);

      if (this.cloudMaterial) {
        const cloudSunset = new THREE.Color(0xffa270);
        const cloudDay = new THREE.Color(0xffffff);
        this.cloudMaterial.color.copy(cloudSunset).lerp(cloudDay, t);
      }
    } else {
      // Deep Starry Night
      skyColor.setHex(0x090c1a);
      lightColor.setHex(0x5a7ca8);
      lightIntensity = 0.26;
      ambientIntensity = 0.16;
      starOpacity = 0.95;

      if (this.cloudMaterial) {
        this.cloudMaterial.color.setHex(0x283042);
      }
    }

    this.scene.background = skyColor;
    this.scene.fog.color.copy(skyColor);
    this.scene.fog.density = 0.011;

    this.sunLight.color.copy(lightColor);
    this.sunLight.intensity = lightIntensity;
    this.ambientLight.intensity = ambientIntensity;

    const sunWorldPos = new THREE.Vector3();
    this.sunMesh.getWorldPosition(sunWorldPos);
    this.sunLight.position.copy(sunWorldPos);

    this.starMaterial.opacity = starOpacity;
  }
}
