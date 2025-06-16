

import * as THREE from "three";


const SKIN_PATH = "./textures/steve-texture-update.png";
const skinTex = new THREE.TextureLoader().load(SKIN_PATH);
skinTex.magFilter = THREE.NearestFilter;
skinTex.minFilter = THREE.NearestFilter;

const U = 1 / 64;  
const V = 1 / 64;

function faceMaterial(px, py, w, h) {
  const matTex = skinTex.clone();
  matTex.needsUpdate = true;
  matTex.offset.set(px * U, 1 - (py + h) * V);
  matTex.repeat.set(w * U, h * V);
  return new THREE.MeshBasicMaterial({ map: matTex, transparent: true });
}

function six(matArray) {
  // Quick helper to produce array[6] from object
  return [matArray.right, matArray.left, matArray.top, matArray.bottom, matArray.front, matArray.back];
}


function buildHead() {
  // 8×8×8 px → 0.5×0.5×0.5 units
  const geo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  const m = six({
    right:  faceMaterial( 0,  8, 8, 8), // +X
    left:   faceMaterial(16,  8, 8, 8),
    top:    faceMaterial( 8,  0, 8, 8),
    bottom: faceMaterial(24,  0, 8, 8),
    front:  faceMaterial( 8,  8, 8, 8),
    back:   faceMaterial(24,  8, 8, 8)
  });
  return new THREE.Mesh(geo, m);
}

function buildTorso() {
  // 8×12×4 px → 0.5×0.75×0.25 units
  const geo = new THREE.BoxGeometry(0.5, 0.75, 0.25);
  const m = six({
    right:  faceMaterial(16, 20, 4, 12), // note: arms occupy 4 px, torso 8 px; right half is 4 px
    left:   faceMaterial(28, 20, 4, 12),
    top:    faceMaterial(20, 16, 8, 4),
    bottom: faceMaterial(28, 16, 8, 4),
    front:  faceMaterial(20, 20, 8, 12),
    back:   faceMaterial(32, 20, 8, 12)
  });
  return new THREE.Mesh(geo, m);
}

function buildArm(left = true) {
  // 4×12×4 px → 0.25×0.75×0.25
  const geo = new THREE.BoxGeometry(0.25, 0.75, 0.25);
  const x = left ? 40 : 44; // left arm texture starts at 40, right at 44
  const m = six({
    right:  faceMaterial(x + 4, 20, 4, 12),
    left:   faceMaterial(x,     20, 4, 12),
    top:    faceMaterial(x + 4, 16, 4, 4),
    bottom: faceMaterial(x + 8, 16, 4, 4),
    front:  faceMaterial(x + 4, 20, 4, 12), // using same region simplifies (mirrored fine)
    back:   faceMaterial(x + 8, 20, 4, 12)
  });
  return new THREE.Mesh(geo, m);
}

function buildLeg(left = true) {
  // 4×12×4 px → 0.25×0.75×0.25
  const geo = new THREE.BoxGeometry(0.25, 0.75, 0.25);
  const x = left ? 0 : 4; // left leg texture 0, right 4
  const m = six({
    right:  faceMaterial(x + 4, 20, 4, 12),
    left:   faceMaterial(x,     20, 4, 12),
    top:    faceMaterial(x + 4, 16, 4, 4),
    bottom: faceMaterial(x + 8, 16, 4, 4),
    front:  faceMaterial(x + 4, 20, 4, 12),
    back:   faceMaterial(x + 8, 20, 4, 12)
  });
  return new THREE.Mesh(geo, m);
}


export function buildSteve() {
  const steve = new THREE.Group();

  /* torso pivot sotto */
  const torsoGroup = new THREE.Group();
  torsoGroup.position.y = 0.75; // altezza bacino
  const torsoMesh = buildTorso();
  torsoMesh.position.y = 0.75 / 2; // centrarlo nel gruppo
  torsoGroup.add(torsoMesh);
  steve.add(torsoGroup);

  /* testa */
  const head = buildHead();
  const headAnchor = new THREE.Group();
  head.position.set(0, 0.9, 0);
  headAnchor.position.copy(head.position); // posiziona testa sopra il torso
  headAnchor.add(head);
  steve.add(headAnchor);

  /* braccia */
  const armL = new THREE.Group();
  armL.position.set(-0.5 / 2 - 0.125, 0.75, 0);
  const armLMesh = buildArm(true);
  armLMesh.position.y = -0.75 / 2; // abbassa metà lunghezza
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

export function updateWalkCycle(steve, dt, horizSpeed) {
  const ud = steve.userData;
  const freq = 8; // steps per second at 1 unit/s
  ud.phase += horizSpeed * freq * dt * Math.PI;

  const amp = 0.5;
  const swing = amp * Math.sin(ud.phase);
  ud.armL.rotation.x =  swing;
  ud.armR.rotation.x = -swing;
  ud.legL.rotation.x = -swing;
  ud.legR.rotation.x =  swing;

  // slight head bob
  ud.head.rotation.x = 0.05 * Math.cos(ud.phase * 0.5);
}
