
import * as THREE from 'three';
import { reflect } from 'three/src/nodes/TSL.js';

const FRAMES = 32;
const TILE   = 8;             

const waterTex = new THREE.TextureLoader().load('textures/water_still.png');
const normalMap = new THREE.TextureLoader().load('textures/Water_normal.jpg');
const heigthMap = new THREE.TextureLoader().load('textures/water_displacement.jpeg');
normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;  
waterTex.wrapS = waterTex.wrapT = THREE.RepeatWrapping;
heigthMap.wrapS = heigthMap.wrapT = THREE.RepeatWrapping;


waterTex.repeat.set(1, 1);   

export const waterUniforms = {
    map:      { value: waterTex },
    offset1:  { value: new THREE.Vector2(0, 0) },
    offset2:  { value: new THREE.Vector2(0, 0) },
    tint:     { value: new THREE.Color(0x92c6e9) },
    alpha:    { value: 0.5 },
    normalTex:   { value: normalMap },
    normalOffset:{ value: new THREE.Vector2(0,0) },
    normalMix: { value: 0.8 }, // quanto peso dare alla normalMap
    reflectScale: { value: 0.3 }, // quanto intensificare il Fresnel + o - riflettanza
    reflectIntensity: { value: 0.6 }, // + o - brillantezza del colore riflesso
};


export const waterVertex = /* glsl */`
    // waterVertex.glsl
    //attribute mat4 instanceMatrix;        // <<< arriva da InstancedMesh

    varying vec2 vUv;

    void main() {

        vUv = uv;

        // world position del vertice = modelMatrix * instanceMatrix * localPosition
        vec4 worldPos = modelMatrix * instanceMatrix * vec4(position, 1.0);

        // MVP
        gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
`;

export const waterFragment = /* glsl */`
    uniform sampler2D map;
    uniform sampler2D normalTex;
    uniform float normalMix;      // quanto peso dare alla normalMap
    uniform float reflectScale;   // quanto intensificare il Fresnel
    uniform float reflectIntensity; // moltiplicatore sul colore riflesso
    uniform vec2 normalOffset;
    uniform vec2  offset1, offset2;
    uniform vec3  tint;
    uniform float alpha;
    varying vec2  vUv;


    void main() {

    vec2 uv1 = vUv * vec2(1.0, 1.0);   // TILE orizzontale *8, verticale *8 (8 / 32 = 0.25)
    vec4 t1 = texture2D(map, uv1+offset1);
    vec4 t2 = texture2D(map, uv1+offset2);
    vec3 baseCol = mix(t1.rgb, t2.rgb, 0.5);

    //normal map perturbation
    vec3 nTex = texture2D(normalTex, vUv + normalOffset).xyz * 2.0 - 1.0;
    nTex.g = -nTex.g;
    vec3 N = normalize(mix(vec3(0,0,1), nTex, normalMix)); 

    //Fresnel 
    vec3 V = vec3(0.0, 0.0, 1.0); //view direction perpendicolare

    float fres = pow(1.0-dot(N,V), 3.0);

    vec3 col = mix(baseCol, baseCol*reflectIntensity, fres*reflectScale)*tint;
    float a  = mix(t1.a,  t2.a,  0.5) * alpha;
    gl_FragColor = vec4(col, a);
    }
`;
