
import * as THREE from 'three';

const FRAMES = 32;
const TILE   = 8;             

const waterTex = new THREE.TextureLoader().load('textures/water_still.png');
const normalMap = new THREE.TextureLoader().load('textures/Water_normal.jpg');
normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;  
waterTex.wrapS = waterTex.wrapT = THREE.RepeatWrapping;
waterTex.repeat.set(1, 1/FRAMES);
normalMap.repeat.set(1, 1/FRAMES);



export const waterUniforms = {
    map:      { value: waterTex },
    offset1:  { value: new THREE.Vector2(0, 0) },
    offset2:  { value: new THREE.Vector2(0, 0) },
    tint:     { value: new THREE.Color(0x92c6e9) },
    alpha:    { value: 0.6 },
    normalTex:   { value: normalMap },
    normalOffset:{ value: new THREE.Vector2(0,0) },
    normalMix: { value: 0.90 }, // quanto peso dare alla normalMap
    reflectScale: { value: 0.1 }, // quanto intensificare il Fres
    reflectIntensity: { value: 0.3 }, // + o - brillantezza del colore riflesso

};


export const waterVertex = /* glsl */`
    varying vec2 vUv;
    varying vec3 vViewDir;

    void main() {
    vUv = uv;

    //calcolo la world position del vertice
    vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;

    vViewDir = normalize(cameraPosition - worldPos);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

export const waterFragment = /* glsl */`
    uniform sampler2D map;
    uniform sampler2D normalTex;
    uniform vec2 normalOffset;
    uniform vec2  offset1, offset2;
    uniform vec3  tint;
    uniform float alpha;
    varying vec2  vUv;
    varying vec3  vViewDir;

    uniform float   normalMix;       // peso della normal map 
    uniform float   reflectScale;    // scala Fresnel 
    uniform float   reflectIntensity; // intensità colore riflesso

    vec3 F0 = vec3(0.02); // Fresnel reflectance (acqua)

    void main() {

    vec2 uv1 = vUv * vec2(8.0, 1.0);   // TILE orizzontale *8
    vec4 t1 = texture2D(map, uv1+offset1);
    vec4 t2 = texture2D(map, uv1+offset2);
    vec3 baseCol = mix(t1.rgb, t2.rgb, 0.5);

    // normal map perturbation
    vec2 uvN = vUv * 8.0 + normalOffset;
    vec3 nTex = texture2D(normalTex, uvN).xyz * 2.0 - 1.0; // normal map [-1,1]
    nTex.g = -nTex.g;
    vec3 N = normalize(mix(vec3(0,0,1), nTex, normalMix)); 

    vec3 V = normalize(vViewDir); //view direction perpendicolare

    //Fresnel di Schlick
    // F = F0 + (1 - F0) * (1 - cos(theta))^5

    float cosTheta = clamp(dot(N, V), 0.0, 1.0);
    vec3 F = F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
    
    // Calcolo del colore riflesso
    vec3 reflected = baseCol * tint * reflectIntensity;
    vec3 col = mix(
        baseCol * tint,
        reflected,
        F * reflectScale
    );

    // Calcolo dell'alpha
    float a = mix(t1.a, t2.a, 0.5) * alpha;

    gl_FragColor = vec4(col, a);
    }
`;
