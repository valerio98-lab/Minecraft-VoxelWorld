// DayNightCycle.js
import * as THREE from 'three';

export class DayNightCycle {
  constructor(scene, {
    radius      = 65,       
    dayLength   = 240,       
    tiltDeg     = 23.4,      
    sunTex      = 'textures/sun.png',
  } = {}) {

    this.scene = scene;
    this.dayLength = dayLength;
    this.clock = new THREE.Clock();

    // Pivot rotante + tilt 
    this.pivot = new THREE.Object3D();
    this.pivot.rotation.z = THREE.MathUtils.degToRad(tiltDeg);
    scene.add(this.pivot);

    const loader = new THREE.TextureLoader();


    this.sunLight = new THREE.DirectionalLight(0xffffff, 1);
    this.sunLight.position.set(40, 15, radius);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(2048, 2048);
    scene.add(this.sunLight.target);          // obbligatorio
    this.pivot.add(this.sunLight);

    this.sunSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: loader.load(sunTex), depthWrite: false })
    );
    this.sunSprite.scale.set(10, 10, 1); // dimensione sprite
    this.sunSprite.position.copy(this.sunLight.position);
    this.pivot.add(this.sunSprite);

    // Luna opposta di 180°)
    this.moonLight = new THREE.DirectionalLight(0x9db4ff, 0.3);
    this.moonLight.position.set(40, 20, -radius);
    scene.add(this.moonLight.target);
    this.pivot.add(this.moonLight);

    const moonTex = loader.load('textures/moon_phases.png', t => {
        t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; 
        t.repeat.set(1/8, 1);                          
    });

    this.moonSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: moonTex, depthWrite: false })
    );
    this.moonSprite.scale.set(5, 5, 1); // dimensione sprite
    this.moonSprite.position.copy(this.moonLight.position);
    this.pivot.add(this.moonSprite);

    /* --- luce ambiente per riempire ombre troppo nere --- */
    this.ambient = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(this.ambient);
  }

  // chiami ogni frame
  update(dt, playerPos = null) {

    const elapsed = this.clock.getElapsedTime();
    
    if (playerPos) {

      this.pivot.position.copy(playerPos);
      this.sunLight.target.position.copy(playerPos);
      this.moonLight.target.position.copy(playerPos);
    }

    //rotazione continua
    const angle = (this.clock.getElapsedTime() / this.dayLength) * Math.PI * 2;
    this.pivot.rotation.x = -angle;

    // visibilità / intensità 
    const t = (angle % (Math.PI * 2)) / (Math.PI * 2); 
    const isDay = t < 0.5;
    this.sunLight.intensity  = isDay ? 1.0 : 0.0;
    this.moonLight.intensity = isDay ? 0.0 : 0.3;
    this.sunSprite.visible   = isDay;
    this.moonSprite.visible  = !isDay;

    const dayIndex = Math.floor(elapsed / this.dayLength);
    if (dayIndex !== this._lastDayIndex && this.moonSprite.material.map){
        this._lastDayIndex = dayIndex;
        this._moonPhase    = (this._moonPhase + 1) & 7;  // bit-and = %8
        this.moonSprite.material.map.offset.x = this._moonPhase / 8;
  }

    /* colore del cielo */
    const lum = isDay
      ? 0.25 + 0.35 * Math.sin(Math.PI * t * 2)   // alba/mezzogiorno/tramonto
      : 0.05;
    this.scene.background = new THREE.Color().setHSL(0.6, 1, lum);
  }
}
