import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { World } from './world';
import { Player } from './player';
import { Physics } from './physics';
import { BLOCKS } from './block';
import { setupUI } from './ui';
import { ModelLoader } from './modelLoader';
import {buildSteve, updateWalkCycle} from './steve';

// Renderer setup
const renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x80a0e0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Camera setup
const orbitCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
orbitCamera.position.set(-32, 32, 32);
orbitCamera.layers.enable(1); // Enable layer 1 for the orbit camera

const controls = new OrbitControls(orbitCamera, renderer.domElement);
controls.target.set(16, 0, 16);
controls.update();

// Scene setup
const scene = new THREE.Scene();
window.scene = scene; // Expose the scene globally for debugging
scene.fog = new THREE.Fog(0x80a0e0, 50, 100);
const player = new Player(scene);
const physics = new Physics(scene);
const world = new World();
const sun = new THREE.DirectionalLight();

const playerCameraHelper = new THREE.CameraHelper(player.camera);
scene.add(playerCameraHelper);
// Add the orbit camera to the scene
playerCameraHelper.visible = false; // Hide the camera helper by default

world.generate();
scene.add(world);


// Add Steve to the scene
const steve = buildSteve();
scene.add(steve);

const modelLoader = new ModelLoader();
modelLoader.loadModels((models) => {
  player.tool.setMesh(models.pickaxe);
  steve.userData.armR.add(player.tool);

  
});

function setupLighting() {
  sun.intensity = 1.5;
  sun.position.set(50, 50, 50);
  sun.castShadow = true;

  // Set the size of the sun's shadow box
  sun.shadow.camera.left = -100;
  sun.shadow.camera.right = 100;
  sun.shadow.camera.top = 100;
  sun.shadow.camera.bottom = -100;
  sun.shadow.camera.near = 0.1;
  sun.shadow.camera.far = 200;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.06;
  sun.shadow.mapSize = new THREE.Vector2(2048, 2048); // Higher resolution for better shadows
  scene.add(sun);
  scene.add(sun.target);

  const ambient = new THREE.AmbientLight();
  ambient.intensity = 0.2;
  scene.add(ambient);
}


function onMouseDown(event){
  if (player.controls.isLocked && player.selectedBlock) {
    // If the player is looking at a block, remove it
    if(player.activeBlockId === BLOCKS.empty.id) {
      console.log('Removing block:', player.selectedBlock);
      world.removeBlock(player.selectedBlock.x, player.selectedBlock.y, player.selectedBlock.z);
      player.tool.startAnimation(); // Start the tool animation when removing a block
    }
    else {
      console.log('Adding block:', player.selectedBlock);
      world.addBlock(player.selectedBlock.x, player.selectedBlock.y, player.selectedBlock.z, player.activeBlockId);
    }

  }
}
document.addEventListener('mousedown', onMouseDown);

// Events
window.addEventListener('resize', () => {
  // Resize camera aspect ratio and renderer size to the new window size
  orbitCamera.aspect = window.innerWidth / window.innerHeight;
  orbitCamera.updateProjectionMatrix();
  player.camera.aspect = window.innerWidth / window.innerHeight;
  player.camera.updateProjectionMatrix();
  
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// UI Setup
const stats = new Stats();
document.body.appendChild(stats.dom);

// Render loop
let previousTime = performance.now();

function animate() {
  const currentTime = performance.now();
  const dt = (currentTime - previousTime) / 1000;

  requestAnimationFrame(animate);
  player.updateRay(world);

  physics.update(dt, player, world);
  world.update(player);
  playerCameraHelper.update();



// Update Steve's position and animation
  const camDir = new THREE.Vector3();
  player.camera.getWorldDirection(camDir);
  const yaw = Math.atan2(camDir.x, camDir.z); // Calculate yaw from camera direction
    
  const forwardXZ = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)).normalize(); // Calculate forward direction in XZ plane
  steve.position.copy(player.position);
  steve.position.y -= player.height;           // piedi
  steve.position.addScaledVector(forwardXZ, -0.3); // arretra busto
  steve.userData.head.rotation.y = Math.PI; // Set head rotation to match camera yaw

  // rotazioni
  steve.userData.torso.rotation.y = yaw + Math.PI;

  // calcola pitch limitato
  const horizontalLen = Math.sqrt(camDir.x*camDir.x + camDir.z*camDir.z);
  let pitch = Math.atan2(camDir.y, horizontalLen);
  pitch = THREE.MathUtils.clamp(pitch, -Math.PI/4, Math.PI/4);

  // animazione arti + testa
  const hSpeed = player.worldVelocity.clone().setY(0).length();
  updateWalkCycle(steve, dt, hSpeed, pitch);

  //orienta nella direzione di movimento

  //animazione di Steve degli arti

  sun.position.copy(player.position);
  sun.position.sub(new THREE.Vector3(-50,-50,-50)); // Position sun above player
  sun.target.position.copy(player.position);

  const frameH = 1 / 32; 

  scene.traverse(obj => {
    if(obj.userData.isWater && obj.material?.uniforms){
      const uni = obj.material?.uniforms;
      uni.offset1.value.y = (uni.offset1.value.y + dt * 0.3 * frameH) % 1; // Update offset1 (slower) for animation
      uni.offset2.value.y = (uni.offset2.value.y - dt * 0.4 * frameH) % 1; // Update offset2 (faster) for animation

      uni.normalOffset.value.x = (uni.normalOffset.value.x + dt * 0.03) % 1; 
      uni.normalOffset.value.y = (uni.normalOffset.value.y + dt * 0.025) % 1;
    }
    });

  renderer.render(scene, player.controls.isLocked ? player.camera : orbitCamera);
  stats.update();

  previousTime = currentTime;
}

setupUI(world, player, physics, scene);
setupLighting();
animate();