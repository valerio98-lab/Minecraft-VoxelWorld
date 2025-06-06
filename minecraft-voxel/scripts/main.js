import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { World } from './world';
import { Player } from './player';
import { Physics } from './physics';
import { BLOCKS } from './block';
import { setupUI } from './ui';

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
scene.fog = new THREE.Fog(0x80a0e0, 50, 150);
const player = new Player(scene);
const physics = new Physics(scene);
const world = new World();
const sun = new THREE.DirectionalLight();

world.generate();
scene.add(world);


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
  sun.shadow.bias = -0.001;
  sun.shadow.mapSize = new THREE.Vector2(1024, 1024); // Higher resolution for better shadows
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
  //console.log('Ciuccia la minchia');
  physics.update(dt, player, world);
  world.update(player);

  sun.position.copy(player.position);
  sun.position.sub(new THREE.Vector3(-50,-50,-50)); // Position sun above player
  sun.target.position.copy(player.position);

  renderer.render(scene, player.controls.isLocked ? player.camera : orbitCamera);
  stats.update();

  previousTime = currentTime;
}

setupUI(world, player, physics, scene);
setupLighting();
animate();