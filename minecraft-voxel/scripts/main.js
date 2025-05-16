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
    const light1 = new THREE.DirectionalLight();
    light1.position.set(5, 5, 5);
    scene.add(light1);

    const light2 = new THREE.DirectionalLight(0xffffff, 0.5);
    light2.position.set(-5, -5, -5);
    scene.add(light2);

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
