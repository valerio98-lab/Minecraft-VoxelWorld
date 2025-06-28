// DayNightCycle.js
import * as THREE from 'three';

export class DayNightCycle {
  constructor(scene,
    radius = 65,       
    dayLength = 240,       
    tiltDeg = 23.4) {
    
    const loader = new THREE.TextureLoader();
    const moonTexture = loader.load('./textures/moon.png');
    moonTexture.premultiplyAlpha = true; 
    const sunTexture = loader.load('./textures/sun.png');
    
    this.sunMaterial = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: sunTexture, depthWrite: false })
    );
    this.moonMaterial = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: moonTexture, depthWrite: false, transparent: true })
    );
    
    this.scene = scene;
    this.dayLength = dayLength;
    this.clock = new THREE.Clock();

    this.sunLight = new THREE.DirectionalLight(0xffffff, 1);
    this.sunLight.position.set(70, 5, radius);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(2048, 2048);
    this.sunMaterial.scale.set(30, 30, 1);
    this.sunMaterial.position.copy(this.sunLight.position);
    scene.add(this.sunLight.target);
    
    this.moonLight = new THREE.DirectionalLight(0x9db4ff, 0.3);
    this.moonLight.position.set(70, 10, -radius);
    this.moonMaterial.scale.set(15, 15, 1); 
    this.moonMaterial.position.copy(this.moonLight.position);
    scene.add(this.moonLight.target);

    this.pivot = new THREE.Object3D();
    this.pivot.rotation.z = THREE.MathUtils.degToRad(tiltDeg);   
    // const axes = new THREE.AxesHelper(100); 
    // this.pivot.add(axes);
    this.pivot.add(this.sunLight);
    this.pivot.add(this.moonLight);
    this.pivot.add(this.sunMaterial);
    this.pivot.add(this.moonMaterial);
    scene.add(this.pivot);

    this.ambient = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(this.ambient);
  }

  update(dt, playerPos = null) {

    const elapsed = this.clock.getElapsedTime();
    
    if (playerPos) {

      this.pivot.position.copy(playerPos);
      this.sunLight.target.position.copy(playerPos);
      this.moonLight.target.position.copy(playerPos);
    }

  
    const angle = (elapsed / this.dayLength) * 2 * Math.PI;
    this.pivot.rotation.x = -angle;

    const t = (angle % (Math.PI * 2)) / (Math.PI * 2); 
    const isDay = t < 0.5;
    this.sunLight.intensity = isDay ? 1.0 : 0.0;
    this.moonLight.intensity = isDay ? 0.0 : 0.3;
    this.sunMaterial.visible = isDay;
    this.moonMaterial.visible = !isDay;

    const dayIndex = Math.floor(elapsed / this.dayLength);
    if (dayIndex !== this.lastDayIndex){
        this.lastDayIndex = dayIndex;
        // this.moonPhase = ((this.moonPhase) % 8)/ 8; 
        // this.moonMaterial.material.map.offset.x = this.moonPhase;
        this.moonMaterial.material.map.needsUpdate = true; // Ensure the texture updates
  }

    const lum = isDay ? 0.25 + 0.35 * Math.sin(Math.PI * t * 2) : 0.05;
    this.scene.background = new THREE.Color().setHSL(0.6, 1, lum);
  }
}
