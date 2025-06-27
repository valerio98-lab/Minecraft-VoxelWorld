import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { World } from './world';
import { DayNightCycle } from './dayNightCycle';


import { Player } from './player';
import { PhysicsEngine } from './physicsEngine';
import { BLOCKS } from './block';
import { setupUI } from './ui';
import { ModelLoader } from './modelLoader';
import {buildSteve, updateWalkCycle} from './animations/steve';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { SSRPass } from 'three/examples/jsm/postprocessing/SSRPass.js';
import { ReflectorForSSRPass } from 'three/examples/jsm/objects/ReflectorForSSRPass.js';
import {OutputPass} from 'three/examples/jsm/postprocessing/OutputPass.js';
import { Parameters } from './params';
import { createStartScreen } from './startScreen';


const params = new Parameters();
const waterPlane = params.get_subfield('water', 'waterPlane');
const renderer = new THREE.WebGLRenderer();
const scene = new THREE.Scene();
const world = new World();
const player = new Player(scene);
const physics = new PhysicsEngine(scene);
let dayNight = null; // created in initGame()
let composer = null;   // set in setupPostFX()
const stats = new Stats();
document.body.appendChild(stats.dom);

const WATER_LEVEL = world.params.terrain.waterOffset + 0.4;
const REF_HALF = world.WorldChunkSize.width * (world.visibleDistance + 1);

// Cameras
const orbitCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const playerCam = player.camera; // convenience alias


const playerCameraHelper = new THREE.CameraHelper(playerCam);


function setupRenderer() {
  console.warn = () => {};               
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0x80a0e0); // sky color
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);
}

function setupScene() {
  scene.fog = new THREE.Fog(0x80a0e0, 50, 100);
  scene.add(world);
}


function setupCameras() {
  orbitCamera.position.set(player.position.x, player.position.y + 2, player.position.z+2);
  orbitCamera.layers.enable(1);

  const controls = new OrbitControls(orbitCamera, renderer.domElement);
  controls.target.set(2, 0, 2);
  controls.update();

  scene.add(playerCameraHelper);
  playerCameraHelper.visible = false;
}


function onWindowResize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h);
  composer.setSize(w, h);
  setupSSR.ssrPass.setSize(w, h);

  orbitCamera.aspect = w / h; orbitCamera.updateProjectionMatrix();
  playerCam.aspect = w / h; playerCam.updateProjectionMatrix();
}

function onMouseDown(e) {
  if (!player.controls.isLocked || !player.selectedBlock) return;

  if (player.activeBlockId === BLOCKS.empty.id) {
    world.removeBlock(player.selectedBlock.x, player.selectedBlock.y, player.selectedBlock.z);
    player.tool.startAnimation();
  } else {
    world.addBlock(player.selectedBlock.x, player.selectedBlock.y, player.selectedBlock.z, player.activeBlockId);
  }
}

function setupEvents() {
  window.addEventListener('resize', onWindowResize);
  document.addEventListener('mousedown', onMouseDown);
}


function setupSSR() {
  //reflection plane
  const reflGeo = new THREE.PlaneGeometry(REF_HALF * 2, REF_HALF * 2);
  const waterReflector = new ReflectorForSSRPass(reflGeo, { clipBias: 0.0003, textureWidth: 512, textureHeight: 512, color: 0x889999 });
  waterReflector.rotateX(-Math.PI / 2);
  waterReflector.position.set(0, WATER_LEVEL, 0);
  waterReflector.visible = false;
  scene.add(waterReflector);

  // composer
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, playerCam));

  const ssrPass = new SSRPass({ renderer, scene, camera: playerCam, width: window.innerWidth, height: window.innerHeight });
  ssrPass.reflector = waterReflector;
  ssrPass.opacity = 0.75;
  ssrPass.thickness = 0.12;
  ssrPass.enableBlur = true;
  ssrPass.blurRadius = 0.5;
  ssrPass.blurSigma = 4.0;
  ssrPass.maxDistance = 60;
  composer.addPass(ssrPass);

  composer.addPass(new OutputPass());

  // store for access in animate()
  setupSSR.waterReflector = waterReflector;
  setupSSR.ssrPass = ssrPass;
}

function setupSteve() {
  const steve = buildSteve();
  scene.add(steve);

  const modelLoader = new ModelLoader();
  modelLoader.loadModels((models) => {
    player.tool.setMesh(models.pickaxe);
    steve.userData.armR.add(player.tool);
  });

  setupSteve.steve = steve; // expose for animate()
}

function updateWater(dt) {
  const frameH = 1 / 32;
    if (waterPlane){

      scene.traverse(obj => {
        if(obj.userData.isWater && obj.material?.uniforms){
          const uni = obj.material?.uniforms; // Get the uniforms of the water material or undeined if not found (other materials for example)
          uni.offset1.value.y = (uni.offset1.value.y + dt * 0.3 * frameH) % 1; // Update offset1 (slower) for animation
          uni.offset2.value.y = (uni.offset2.value.y - dt * 0.4 * frameH) % 1; // Update offset2 (faster) for animation

          uni.normalOffset.value.x = (uni.normalOffset.value.x + dt * 0.03) % 1; 
          uni.normalOffset.value.y = (uni.normalOffset.value.y + dt * 0.025) % 1;
        }
        });
    }else {
      scene.traverse(obj => {
        if (obj.userData.isWater) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material]; //non è detto l'oggetto abbia un solo materiale ma se così è lo metto in un array
          if (mats.length === 0) return; // salta se non ha materiali
          mats.forEach(mat => {
            if (!mat.uniforms) return;          // salta i Lambert
            const uni = mat.uniforms;
            uni.offset1.value.y = (uni.offset1.value.y + dt * 0.03 * frameH) % 1.0;
            uni.offset2.value.y = (uni.offset2.value.y - dt * 0.04 * frameH) % 1.0;
            uni.normalOffset.value.y = (uni.normalOffset.value.y + dt * 0.03) % 1.0;
            uni.normalOffset.value.y = (uni.normalOffset.value.y + dt * 0.025) % 1.0;
          });
        }
      });
    }
  }
  
function updateSteve(dt) {
  const steve = setupSteve.steve;
  if (!steve) return;

  const camDir = new THREE.Vector3();
  playerCam.getWorldDirection(camDir);
  const yaw = Math.atan2(camDir.x, camDir.z);
  const forwardXZ = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)).normalize();

  steve.position.copy(player.position);
  steve.position.y -= player.height;
  steve.position.addScaledVector(forwardXZ, -0.3);
  steve.userData.torso.rotation.y = yaw + Math.PI;

  const horizontalLen = Math.sqrt(camDir.x ** 2 + camDir.z ** 2);
  let pitch = Math.atan2(camDir.y, horizontalLen);
  pitch = THREE.MathUtils.clamp(pitch, -Math.PI / 4, Math.PI / 4);
  steve.userData.headAnchor.rotation.set(pitch, 0, 0);

  const hSpeed = player.worldVelocity.clone().setY(0).length();
  updateWalkCycle(steve, dt, hSpeed, pitch);
}


let previousTime = performance.now();
function animate() {
  const now = performance.now();
  const dt = (now - previousTime) / 1000;
  requestAnimationFrame(animate);

  player.updateRay(world);
  physics.update(dt, player, world);
  dayNight.update(dt, player.position);
  world.update(player);
  playerCameraHelper.update();

  updateSteve(dt);
  updateWater(dt);


  const STEP = REF_HALF;
  setupSSR.waterReflector.position.set(
    Math.floor(player.position.x / STEP) * STEP + STEP * 0.5,
    WATER_LEVEL,
    Math.floor(player.position.z / STEP) * STEP + STEP * 0.5
  );

  const activeCam = player.controls.isLocked ? playerCam : orbitCamera;
  if (activeCam === orbitCamera) renderer.render(scene, orbitCamera);
  else composer.render();

  stats.update();
  previousTime = now;
}


function initGame() {
  world.generate();
  setupSSR.ssrPass.selects = [];
  scene.traverse((o) => { if (o.userData.isWater) setupSSR.ssrPass.selects.push(o); });
  dayNight = new DayNightCycle(scene);
  animate();
}

function boot() {
  setupRenderer();
  setupCameras();
  setupScene();
  setupSSR();
  setupSteve();
  setupEvents();

  setupUI(world, player, physics, scene, { ssrPass: setupSSR.ssrPass });
  createStartScreen({ onPlay: initGame });
}

boot();
