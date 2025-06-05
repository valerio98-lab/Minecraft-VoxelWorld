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
    leaves: loadTexture('textures/leaves.png'),
    treeSide: loadTexture('textures/tree_side.png'),
    treeTop: loadTexture('textures/tree_top.png'),
    //water: loadTexture('textures/water.png'),
    sand: loadTexture('textures/sand.png'),
    cherryLeaves: loadTexture('textures/cherry_leaves.png'),
    jungleTreeSide: loadTexture('textures/jungle_tree_side.png'),
    jungleTreeTop: loadTexture('textures/jungle_tree_top.png'),
    jungleLeaves: loadTexture('textures/jungle_leaves.png'),
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
            y: 20,
            z: 30,
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
            x: 30,
            y: 20,
            z: 60,
        },
        scarcity: 0.4, // Scarcity of coal ore blocks
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
        scarcity: 0.5, // Scarcity of iron ore blocks
        material: [
            new THREE.MeshLambertMaterial({ map: textures.ironOre }),
            new THREE.MeshLambertMaterial({ map: textures.ironOre }),
            new THREE.MeshLambertMaterial({ map: textures.ironOre }),
            new THREE.MeshLambertMaterial({ map: textures.ironOre }),
            new THREE.MeshLambertMaterial({ map: textures.ironOre }),
            new THREE.MeshLambertMaterial({ map: textures.ironOre })

        ]
    },
    leaves: {
        id: 6,
        name: 'Leaves',
        material: [
            new THREE.MeshLambertMaterial({ map: textures.leaves }),
            new THREE.MeshLambertMaterial({ map: textures.leaves }),
            new THREE.MeshLambertMaterial({ map: textures.leaves }),
            new THREE.MeshLambertMaterial({ map: textures.leaves }),
            new THREE.MeshLambertMaterial({ map: textures.leaves }),
            new THREE.MeshLambertMaterial({ map: textures.leaves })
        ]
    },
    tree:{
        id: 7,
        name: 'Tree',
        material: [
            new THREE.MeshLambertMaterial({ map: textures.treeSide }),
            new THREE.MeshLambertMaterial({ map: textures.treeSide }),
            new THREE.MeshLambertMaterial({ map: textures.treeTop }),
            new THREE.MeshLambertMaterial({ map: textures.treeTop }),
            new THREE.MeshLambertMaterial({ map: textures.treeSide }),
            new THREE.MeshLambertMaterial({ map: textures.treeSide })
        ]
    },
    sand: {
    id: 8,
    name: 'Sand',
    material: [
        new THREE.MeshLambertMaterial({ map: textures.sand }),
        new THREE.MeshLambertMaterial({ map: textures.sand }),
        new THREE.MeshLambertMaterial({ map: textures.sand }),
        new THREE.MeshLambertMaterial({ map: textures.sand }),
        new THREE.MeshLambertMaterial({ map: textures.sand }),
        new THREE.MeshLambertMaterial({ map: textures.sand })
    ]
    },
    cloud: {
    id: 9,
    name: 'cloud',
    material: [
        new THREE.MeshBasicMaterial({ color:0xf0f0f0, transparent: true, opacity: 0.5 }),
        new THREE.MeshBasicMaterial({ color:0xf0f0f0, transparent: true, opacity: 0.5 }),           
        new THREE.MeshBasicMaterial({ color:0xf0f0f0, transparent: true, opacity: 0.5 }),    
        new THREE.MeshBasicMaterial({ color:0xf0f0f0, transparent: true, opacity: 0.5 }),    
        new THREE.MeshBasicMaterial({ color:0xf0f0f0, transparent: true, opacity: 0.5 }),    
        new THREE.MeshBasicMaterial({ color:0xf0f0f0, transparent: true, opacity: 0.5 }),    
        new THREE.MeshBasicMaterial({ color:0xf0f0f0, transparent: true, opacity: 0.5 }),    
    ]
    },
    jungleTree: {
        id: 10,
        name: 'Jungle Tree',
        material: [
            new THREE.MeshLambertMaterial({ map: textures.jungleTreeSide }),
            new THREE.MeshLambertMaterial({ map: textures.jungleTreeSide }),
            new THREE.MeshLambertMaterial({ map: textures.jungleTreeTop }),
            new THREE.MeshLambertMaterial({ map: textures.jungleTreeTop }),
            new THREE.MeshLambertMaterial({ map: textures.jungleTreeSide }),
            new THREE.MeshLambertMaterial({ map: textures.jungleTreeSide })
        ]
    }, 
    cherryLeaves: {
        id: 11,
        name: 'Jungle Leaves',
        material: [
            new THREE.MeshLambertMaterial({ map: textures.cherryLeaves }),
            new THREE.MeshLambertMaterial({ map: textures.cherryLeaves }),
            new THREE.MeshLambertMaterial({ map: textures.cherryLeaves }),
            new THREE.MeshLambertMaterial({ map: textures.cherryLeaves }),
            new THREE.MeshLambertMaterial({ map: textures.cherryLeaves }),
            new THREE.MeshLambertMaterial({ map: textures.cherryLeaves })
        ]
    }, 
    jungleLeaves: {
        id: 12,
        name: 'Jungle Leaves',
        material: [
            new THREE.MeshLambertMaterial({ map: textures.jungleLeaves }),
            new THREE.MeshLambertMaterial({ map: textures.jungleLeaves }),
            new THREE.MeshLambertMaterial({ map: textures.jungleLeaves }),
            new THREE.MeshLambertMaterial({ map: textures.jungleLeaves }),
            new THREE.MeshLambertMaterial({ map: textures.jungleLeaves }),
            new THREE.MeshLambertMaterial({ map: textures.jungleLeaves })
        ]
    },  
}


export const resources = [
    BLOCKS.coalOre,
    BLOCKS.ironOre,
    BLOCKS.stone,
]