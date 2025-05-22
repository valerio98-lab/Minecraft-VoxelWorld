import * as THREE from 'three';

const textureLoader = new THREE.TextureLoader();

function loadTexture(url) {
    const texture = textureLoader.load(url); 
    texture.colorSpace = THREE.SRGBColorSpace; // Ensure the texture uses sRGB color space
    texture.minFilter = THREE.NearestFilter; // Use nearest filter for pixelated look
    texture.magFilter = THREE.NearestFilter; // Use nearest filter for pixelated look
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
        material : [
            new THREE.MeshLambertMaterial({ map: textures.dirt }),
            new THREE.MeshLambertMaterial({ map: textures.dirt }),
            new THREE.MeshLambertMaterial({ map: textures.dirt }),
            new THREE.MeshLambertMaterial({ map: textures.dirt }),
            new THREE.MeshLambertMaterial({ map: textures.dirt }),
            new THREE.MeshLambertMaterial({ map: textures.dirt })
        ], 
    },
    stone: {
        id: 3,
        name: 'Stone',
        scale: {
            x: 50,
            y: 50,
            z: 50,
        },
        scarcity: 0.5, // Scarcity of stone blocks
        material: [new THREE.MeshLambertMaterial({ map: textures.stone }), 
            new THREE.MeshLambertMaterial({ map: textures.stone }),
            new THREE.MeshLambertMaterial({ map: textures.stone }),
            new THREE.MeshLambertMaterial({ map: textures.stone }),
            new THREE.MeshLambertMaterial({ map: textures.stone }),
            new THREE.MeshLambertMaterial({ map: textures.stone })  
        ]
    },
    coalOre: {
        id: 4,
        name: 'Coal Ore',
        scale: {
            x: 20,
            y: 20,
            z: 20,
        },
        scarcity: 0.1, // Scarcity of coal ore blocks
        material: [new THREE.MeshLambertMaterial({ map: textures.coalOre }), 
            new THREE.MeshLambertMaterial({ map: textures.coalOre }),
            new THREE.MeshLambertMaterial({ map: textures.coalOre }),
            new THREE.MeshLambertMaterial({ map: textures.coalOre }),
            new THREE.MeshLambertMaterial({ map: textures.coalOre }),
            new THREE.MeshLambertMaterial({ map: textures.coalOre })    
        ]
    },
    ironOre: {
        id: 5,
        name: 'Iron Ore',
        scale: {
            x: 60,
            y: 60,
            z: 60,
        },
        scarcity: 0.05, // Scarcity of iron ore blocks
        material: [
            new THREE.MeshLambertMaterial({ map: textures.ironOre }),
            new THREE.MeshLambertMaterial({ map: textures.ironOre }),
            new THREE.MeshLambertMaterial({ map: textures.ironOre }),
            new THREE.MeshLambertMaterial({ map: textures.ironOre }),
            new THREE.MeshLambertMaterial({ map: textures.ironOre }),
            new THREE.MeshLambertMaterial({ map: textures.ironOre })

        ]
    },
}

export const resources = [
    BLOCKS.coalOre,
    BLOCKS.ironOre,
    BLOCKS.stone,
]