

import * as THREE from "three";


const SKIN_PATH = "./textures/steve-texture-update.png";
const steveTexture = new THREE.TextureLoader().load(SKIN_PATH);
steveTexture.magFilter = THREE.NearestFilter;
steveTexture.minFilter = THREE.NearestFilter;

const U = 1 / 64;  
const V = 1 / 64;

function textureChunk(px, py, w, h) {
  const tex = steveTexture.clone();
  tex.needsUpdate = true;
  tex.offset.set(px * U, 1 - (py + h) * V);
  tex.repeat.set(w * U, h * V);
  return new THREE.MeshBasicMaterial({ map: tex, transparent: true });
}

function impacchetta(matArray) {
  return [matArray.right, matArray.left, matArray.top, matArray.bottom, matArray.front, matArray.back];
}


function buildHead() {
  const geo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  const m = impacchetta({
    right:  textureChunk( 0,  8, 8, 8), // +X
    left:   textureChunk(16,  8, 8, 8),
    top:    textureChunk( 8,  0, 8, 8),
    bottom: textureChunk(24,  0, 8, 8),
    front:  textureChunk( 8,  8, 8, 8),
    back:   textureChunk(24,  8, 8, 8)
  });
  return new THREE.Mesh(geo, m);
}

function buildTorso() {
  const geo = new THREE.BoxGeometry(0.5, 0.75, 0.25);
  const m = impacchetta({
    right:  textureChunk(16, 20, 4, 12), // arms occupy 4 px, torso 8 px; right half is 4 px
    left:   textureChunk(28, 20, 4, 12),
    top:    textureChunk(20, 16, 8, 4),
    bottom: textureChunk(28, 16, 8, 4),
    front:  textureChunk(20, 20, 8, 12),
    back:   textureChunk(32, 20, 8, 12)
  });
  return new THREE.Mesh(geo, m);
}

function buildArm(left = true) {
  // 4×12×4 px → 0.25×0.75×0.25
  const geo = new THREE.BoxGeometry(0.25, 0.75, 0.25);
  const x = left ? 40 : 44; // left arm texture starts at 40, right at 44
  const m = impacchetta({
    right:  textureChunk(x + 4, 20, 4, 12),
    left:   textureChunk(x,20, 4, 12),
    top:    textureChunk(x + 4, 16, 4, 4),
    bottom: textureChunk(x + 8, 16, 4, 4),
    front:  textureChunk(x + 4, 20, 4, 12), 
    back:   textureChunk(x + 8, 20, 4, 12)
  });
  return new THREE.Mesh(geo, m);
}

function buildLeg(left = true) {
  // 4×12×4 px → 0.25×0.75×0.25
  const geo = new THREE.BoxGeometry(0.25, 0.75, 0.25);
  const x = left ? 0 : 4; // left leg texture 0, right 4
  const m = impacchetta({
    right:  textureChunk(x + 4, 20, 4, 12),
    left:   textureChunk(x, 20, 4, 12),
    top:    textureChunk(x + 4, 16, 4, 4),
    bottom: textureChunk(x + 8, 16, 4, 4),
    front:  textureChunk(x + 4, 20, 4, 12),
    back:   textureChunk(x + 8, 20, 4, 12)
  });
  return new THREE.Mesh(geo, m);
}


export function buildSteve() {
  const steve = new THREE.Group();

  /* torso pivot sotto */
  const torsoGroup = new THREE.Group();
  torsoGroup.position.y = Math.PI/4; // altezza bacino
  const torsoMesh = buildTorso();
  torsoMesh.position.y = (Math.PI/4) / 2; // centrato nel gruppo
  torsoGroup.add(torsoMesh);
  steve.add(torsoGroup);

  /* testa */
  const head = buildHead();
  const headAnchor = new THREE.Group();
  head.position.set(0, 0.5, 0);
  head.rotation.set(0, Math.PI, 0); 
  headAnchor.position.copy(head.position); 
  headAnchor.add(head);
  torsoGroup.add(headAnchor);

  /* braccia */
  const armL = new THREE.Group();
  armL.position.set(-0.5 / 2 - 0.125, 0.75, 0);
  const armLMesh = buildArm(true);
  armLMesh.position.y = -0.75 / 2; 
  armL.add(armLMesh);
  torsoGroup.add(armL);

  const armR = new THREE.Group();
  armR.position.set(0.5 / 2 + 0.125, 0.75, 0);
  const armRMesh = buildArm(false);
  armRMesh.position.y = -0.75 / 2;
  armR.add(armRMesh);
  torsoGroup.add(armR);

  /* gambe */
  const legL = new THREE.Group();
  legL.position.set(-0.125, 0, 0);
  const legLMesh = buildLeg(true);
  legLMesh.position.y = -0.75 / 2;
  legL.add(legLMesh);
  torsoGroup.add(legL);

  const legR = new THREE.Group();
  legR.position.set(0.125, 0, 0);
  const legRMesh = buildLeg(false);
  legRMesh.position.y = -0.75 / 2;
  legR.add(legRMesh);
  torsoGroup.add(legR);

  /* store refs */
  steve.userData = { torso: torsoGroup, headAnchor, head, armL, armR, legL, legR, phase: 0 };
  return steve;
}

export function updateWalkCycle(steve, dt, speed, headPitch = 0) {
  const ud = steve.userData;
  const freq = 0.5; // steps per second at 1 unit/s
  ud.phase += speed * freq * dt * Math.PI; 

  const amp = 0.5;
  const swing = amp * Math.sin(ud.phase);
  ud.armL.rotation.x =  swing;
  ud.armR.rotation.x = -swing;
  ud.legL.rotation.x = -swing;
  ud.legR.rotation.x =  swing;


}
