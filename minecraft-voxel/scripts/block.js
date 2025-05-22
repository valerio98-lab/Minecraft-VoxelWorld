import * as THREE from 'three';

const textureLoader = new THREE.TextureLoader();

function loadTexture(url) {
    const texture = textureLoader.load(url); 
    texture.colorSpace = THREE.SRGBColorSpace; // Ensure the texture uses sRGB color space
    texture.minFilter = THREE.NearestFilter; // Use nearest filter for pixelated look
    return texture;
}

const textures = {
    grass: loadTexture('textures/grass.png'),
    grassSide: loadTexture('textures/grass_side.png'),
    dirt: loadTexture('textures/dirt.png'),
    stone: loadTexture('textures/stone.png'),
    coalOre: loadTexture('textures/coal_ore.png'),
    ironOre: loadTexture('textures/iron_ore.png'),
};


export const BLOCKS = {
    empty: {
        id: 0,
        name: 'Empty'
    },
    grass: {
        id: 1,
        name: 'Grass',
        color: 0x00ff00,
        material: [
        new THREE.MeshLambertMaterial({ map: textures.grassSide }), // right
        new THREE.MeshLambertMaterial({ map: textures.grassSide }), // left
        new THREE.MeshLambertMaterial({ map: textures.grass }), // top
        new THREE.MeshLambertMaterial({ map: textures.dirt }), // bottom
        new THREE.MeshLambertMaterial({ map: textures.grassSide }), // front
        new THREE.MeshLambertMaterial({ map: textures.grassSide })  // back
        ]
    },
    dirt: {
        id: 2,
        name: 'Dirt',
        color: 0x8B4513,
        material : [
            new THREE.MeshLambertMaterial({ map: textures.dirt })] // All faces use the same dirt texture
    },
    stone: {
        id: 3,
        name: 'Stone',
        color: 0x808080,
        scale: {
            x: 20,
            y: 20,
            z: 20,
        },
        scarcity: 0.5, // Scarcity of stone blocks
        material: [
            new THREE.MeshLambertMaterial({ map: textures.stone }) // All faces use the same stone texture
        ]
    },
    coalOre: {
        id: 4,
        name: 'Coal Ore',
        color: 0x333333,
        scale: {
            x: 20,
            y: 20,
            z: 20,
        },
        scarcity: 0.1, // Scarcity of coal ore blocks
        material: [
            new THREE.MeshLambertMaterial({ map: textures.coalOre }) // All faces use the same coal ore texture
        ]
    },
    ironOre: {
        id: 5,
        name: 'Iron Ore',
        color: 0xC0C0C0,
        scale: {
            x: 60,
            y: 60,
            z: 60,
        },
        scarcity: 0.05, // Scarcity of iron ore blocks
        material: [
            new THREE.MeshLambertMaterial({ map: textures.ironOre }) // All faces use the same iron ore texture
        ]
    },
}

export const resources = [
    BLOCKS.coalOre,
    BLOCKS.ironOre,
    BLOCKS.stone,
]