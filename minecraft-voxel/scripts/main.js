import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { World } from './world';
import { createUI } from './ui';

const stats = new Stats();
document.body.append(stats.dom);

// Renderer setup
const renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x87CEEB); // Sky blue background
renderer.shadowMap.enabled = true; // Enable shadow mapping
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Use soft shadows
document.body.appendChild(renderer.domElement);

// Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(-32, 16, -32);
camera.lookAt(new THREE.Vector3(0, 0, 0));

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(16,0,16);
controls.update();

// Scene setup
const scene = new THREE.Scene();
const world = new World();
world.generate();
scene.add(world);

// Lighting setup
function setupLighting() {
    const sun = new THREE.DirectionalLight();
    sun.position.set(50, 50, 50); // Position the sun
    sun.castShadow = true; // Enable shadow casting
    sun.shadow.camera.near = 0.1; 
    sun.shadow.camera.far = 100; // Adjust shadow camera far plane
    sun.shadow.camera.left = -50; // Adjust shadow camera left plane
    sun.shadow.camera.right = 50; // Adjust shadow camera right plane
    sun.shadow.camera.top = 50; // Adjust shadow camera top plane
    sun.shadow.camera.bottom = -50; // Adjust shadow camera bottom plane
    sun.shadow.bias = -0.0005; // Bias to reduce shadow acne
    scene.add(sun);

    const shadowHelper = new THREE.CameraHelper(sun.shadow.camera);
    shadowHelper.visible = false ; // Hide the shadow camera helper by default
    scene.add(shadowHelper);
    
    const ambientLight = new THREE.AmbientLight(0x404040); // Soft white light
    ambientLight.intensity = 0.5;
    scene.add(ambientLight);
}


// Render loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
    stats.update();
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

setupLighting();
createUI(world);
animate();
