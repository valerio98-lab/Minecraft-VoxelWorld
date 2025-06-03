import * as THREE from 'three';
import { WorldChunk } from './worldChunk';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

export class Player {
    radius = 0.5; // Player radius for collision detection
    height = 1.8; // Player height for collision detection
    jumpSpeed = 10;
    onGround = false;

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
    cameraHelper = new THREE.CameraHelper(this.camera);
    controls = new PointerLockControls(this.camera, document.body);
    
    maxSpeed = 10;
    velocity = new THREE.Vector3();
    input = new THREE.Vector3();
    #worldVelocity = new THREE.Vector3();

  constructor(scene) {
    this.position.set(32, 50, 32);
    this.cameraHelper.visible = false; 
    
    scene.add(this.camera);
    scene.add(this.cameraHelper);
    document.body.addEventListener('click', () => {
        if (!this.controls.isLocked) {
            this.controls.lock();
        }
    });

    // Add event listeners for keyboard/mouse events
    document.addEventListener('keyup', this.onKeyUp.bind(this));
    document.addEventListener('keydown', this.onKeyDown.bind(this));

    // Create the bounding cylinder for the player
    this.boundingCylinder = new THREE.Mesh(
        new THREE.CylinderGeometry(this.radius, this.radius, this.height, 32),
        new THREE.MeshBasicMaterial({wireframe: true, color: 0xff0000})
    ); 

    scene.add(this.boundingCylinder);
  }
  /**
   * Return the player velocity in world coordinates.
   * 
   */
  get worldVelocity() {
    this.#worldVelocity.copy(this.velocity);
    this.#worldVelocity.applyEuler(new THREE.Euler(0, this.camera.rotation.y, 0)); // Apply camera rotation to velocity
    return this.#worldVelocity;
  }

  /**
   * 
   * @param {*} v
   * Returns the player velocity in body coordinates easily using the transpose of the world rotation matrix w.r.t yaw. 
   */
  ApplyBodyVelocity(v){
    v.applyEuler(new THREE.Euler(0, -this.camera.rotation.y, 0)); // Apply camera rotation to velocity
    this.velocity.add(v); // Add the velocity to the player's velocity
  }



  /**
   * @param {Number} dt 
   */
  update(dt) {
    if (this.controls.isLocked === true) {
      this.velocity.x = this.input.x;
      this.velocity.z = this.input.z;
      this.controls.moveRight(this.velocity.x * dt);
      this.controls.moveForward(this.velocity.z * dt);
      this.position.y += this.velocity.y * dt; // Apply vertical velocity

      // only update the on-screen position if the element actually exists
      // const posEl = document.getElementById('info-player-position');
      // if (posEl) {
      //   posEl.innerHTML = this.toString();
      // }
      document.getElementById('info-player-position').innerHTML = this.toString();
    }
  }

  updateBoundingCylinder() {
    this.boundingCylinder.position.copy(this.position);
    this.boundingCylinder.position.y -= this.height / 2; // Adjust for height
  }

  /**
   * Returns the current world position of the player
   * @returns {THREE.Vector3}
   */
  get position() {
    return this.camera.position;
  }

  /**
   * Event handler for 'keyup' event
   * @param {KeyboardEvent} event 
   */
  onKeyUp(event) {
    //console.log(`Key up: ${event.code}`);
    switch (event.code) {
      case 'Escape':
        if (event.repeat) break;
        if (this.controls.isLocked) {
          console.log('unlocking controls');
          this.controls.unlock();
        } else {
          console.log('locking controls');
          this.controls.lock();
        }
        break;
      case 'KeyW':
        this.input.z = 0;
        break;
      case 'KeyA':
        this.input.x = 0;
        break;
      case 'KeyS':
        this.input.z = 0;
        break;
      case 'KeyD':
        this.input.x = 0;
        break;
    }
  }

  /**
   * Event handler for 'keyup' event
   * @param {KeyboardEvent} event 
   */
  onKeyDown(event) {
    //console.log(`Key down: ${event.code}`);
    switch (event.code) {
      case 'KeyW':
        this.input.z = this.maxSpeed;
        break;
      case 'KeyA':
        this.input.x = -this.maxSpeed;
        break;
      case 'KeyS':
        this.input.z = -this.maxSpeed;
        break;
      case 'KeyD':
        this.input.x = this.maxSpeed;
        break;
      case 'KeyR':
        if (event.repeat) break;
        this.position.set(32, 50, 32);
        this.velocity.set(0, 0, 0);
        break;
      case 'Space':
        if (this.onGround) {
          this.velocity.y += this.jumpSpeed; // Apply jump speed
        }
    }
  }

  /**
   * Returns player position in string form
   * @returns {string}
   */
  toString() {
    let str = '';
    str += `X: ${this.position.x.toFixed(3)} `;
    str += `Y: ${this.position.y.toFixed(3)} `;
    str += `Z: ${this.position.z.toFixed(3)}`;
    return str;
  }
}