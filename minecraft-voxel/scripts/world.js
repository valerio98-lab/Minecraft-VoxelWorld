import * as THREE from 'three';
//import {SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';
import { makeNoise2D } from 'open-simplex-noise';
import { makeNoise3D } from 'open-simplex-noise';   
import {RNG } from './rng.js';
import { BLOCKS, resources } from './block.js';

const geometry = new THREE.BoxGeometry(1, 1, 1);



export class World extends THREE.Group{
    /**
     * @type {{
     * id: number,
     * instanceId: number,
     * }[][][]}
     */
    data = []; // 3D array to hold block data

    params = {
    terrain: {
        seed: 0,
        scale: 50,           // scala base per l’ottava 0
        magnitude: 0.5,      // ampiezza complessiva (verrà applicata dopo)
        offset: 0.2,         // spostamento (così non avremo mai height = 0)
        octaves: 4,          // numero di ottave
        persistence: 0.6,    // di quanto diminuisce ampiezza da un’ottava alla successiva
        lacunarity: 2.0      // di quanto aumenta frequenza da un’ottava alla successiva
    }
    };


    constructor(size={width: 64, height: 16}) {
        super();
        this.size = size;
    }

    generate() {
        this.rng = new RNG(this.params.terrain.seed); // Initialize RNG with the seed from params
        const randomFloat = this.rng.random();
        const seedInt = Math.floor(randomFloat * 0x100000000); // Convert to integer seed for noise generation
        this.initializeTerrain();
        this.generateResources(seedInt);
        this.generateTerrain(seedInt);
        this.generateMeshes();
    }
    
    initializeTerrain() {
        this.data = [];
        for (let x = 0; x < this.size.width; x++) {
            const slice = [];
            for (let y = 0; y < this.size.height; y++) {
                const row = [];
                for (let z = 0; z < this.size.width; z++) {
                    row.push({
                        id: BLOCKS.empty.id, //if you put 0 here, it will not be rendered
                                                                    // 0 is usually used for air or empty space
                                                                    // 1 is usually used for grass or dirt
                                                                    // 2 is usually used for stone or other solid blocks
                                                                    // You can change these values to create different types of blocks
                        instanceId: null // Instance ID for instancing
                    });
                }
                slice.push(row);
            }
            this.data.push(slice);

        }
    }

    generateTerrain(seedInt) {
        const noise2D = makeNoise2D(seedInt); // Create a 2D noise generator

        // Pre-compute the sum of the magnitudes of all octaves in order to normalize the final noise value
        let totalMagnitude = 0.0;
        let ampTemp = 1.0;
        for (let octave = 0; octave < this.params.terrain.octaves; octave++) {
            totalMagnitude += ampTemp;
            ampTemp *= this.params.terrain.persistence; // Decrease amplitude for the next octave
        }

        // Generate terrain using Perlin noise looping through each block in the world
        // and applying the noise function to determine the height of each block
        for (let x = 0; x < this.size.width; x++) {
            for (let z = 0; z < this.size.width; z++) {
                let frequency = 1.0;
                let amplitude = 1.0;
                let noiseValue = 0.0;

                // Generate noise using multiple octaves 
                for (let octave = 0; octave < this.params.terrain.octaves; octave++) {
                    const sampleX = (x / this.params.terrain.scale) * frequency;
                    const sampleZ = (z / this.params.terrain.scale) * frequency;
                    const raw = noise2D(sampleX, sampleZ); // Get the noise value for the current coordinates
                    
                    noiseValue += raw * amplitude;
                    // Update frequency and amplitude for the next octave
                    frequency *= this.params.terrain.lacunarity; // Increase frequency
                    amplitude *= this.params.terrain.persistence; // Decrease amplitude
                }

                // Normalize the final noise value to [0, 1]
                const normalized = ((noiseValue / totalMagnitude) + 1) / 2; // firstly normalize to [-1, 1] then to [0, 1]

                // magnitude and offset applied to the noise value
                const scaledNoise = this.params.terrain.magnitude * normalized + this.params.terrain.offset;

                let height = Math.floor(this.size.height * scaledNoise);
                height = Math.max(0, Math.min(height, this.size.height)); // Clamp height to valid range

                for (let y = 0; y < this.size.height; y++) {
                    if(y<height && this.getBlock(x, y, z).id === BLOCKS.empty.id) {
                        this.setId(x, y, z, BLOCKS.dirt.id); // Set block ID to 1 (grass) up to the calculated height
                    } else if (y=== height) {
                        this.setId(x, y, z, BLOCKS.grass.id); // Set block ID to 1 (solid) up to the calculated height
                    } else if (y > height) {
                        this.setId(x, y, z, BLOCKS.empty.id); // Set block ID to 0 (empty) above the calculated height
                    }
                }
            }
        }
    }

    generateResources(seedInt) {
        const noise3D = makeNoise3D(seedInt); // Create a Simplex noise generator with the seed
        resources.forEach(resource => {
            for (let x = 0; x < this.size.width; x++) {
                for (let y = 0; y < this.size.height; y++) {
                    for (let z = 0; z < this.size.width; z++) {
                        const value = noise3D(x / resource.scale.x, y / resource.scale.y, z / resource.scale.z); // Generate noise value for the current block
                        if (value > resource.scarcity) { // If the noise value is above a threshold, set a resource block
                            this.setId(x, y, z, resource.id); // Set block ID to the resource ID
                        }
                    }
                }
            }
        });
    }

    generateMeshes(){
        this.clear(); // Clear previous blocks if any

        // lookup table for block types


        const meshes = {}; 
        Object.values(BLOCKS)
            .filter(blockType => blockType.id !== BLOCKS.empty.id) // Filter out empty blocks
            .forEach(blockType => {
                const max_count = this.size.width * this.size.width * this.size.height;
                const mesh = new THREE.InstancedMesh(geometry, blockType.material, max_count);
                mesh.count = 0;
                mesh.castShadow = true; // Enable shadow casting for the mesh
                mesh.receiveShadow = true; // Enable shadow receiving for the mesh
                mesh.name = blockType.name; // Set the name of the mesh to the block name

                meshes[blockType.id] = mesh; // Store the mesh in the lookup table
            });


        const matrix = new THREE.Matrix4();
        for (let x = 0; x < this.size.width; x++) {
            for (let y = 0; y < this.size.height; y++) {
                for (let z = 0; z < this.size.width; z++) {
                    const blockId = this.getBlock(x, y, z).id;

                    if (blockId === BLOCKS.empty.id) continue; // Skip empty blocks
                    
                    const mesh = meshes[blockId]; 
                    const instanceId = mesh.count;

                    if (!this.isBlockHidden(x, y, z)) { // Only add non-empty blocks
                        matrix.setPosition(x, y, z);
                        mesh.setMatrixAt(instanceId, matrix); // Aggiungiamo la matrice alla mesh
                        this.setInstanceId(x, y, z, instanceId); // Set the instance ID in the data structure
                        mesh.count++;
                    }
                }
            }
        }
        this.add(...Object.values(meshes)); // Add all meshes to the world group
    }
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @returns {{id: number, instanceId: number}}
     */
    getBlock(x, y, z) {
        if (this.inBounds(x, y, z)) {
            return this.data[x][y][z];
        }else {
            return null;
        }
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @returns {boolean}
     */
    inBounds(x, y, z) {
        return x >= 0 && x < this.size.width &&
               y >= 0 && y < this.size.height &&
               z >= 0 && z < this.size.width;
    }


    /**
     * Set the block id for the block at coordinates (x, y, z)
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @param {number} id
     */
    setId(x, y, z, id) {
        if (this.inBounds(x, y, z)) {
            this.data[x][y][z].id = id;
        }
    }

    /**
     * Set the instance id for the block at coordinates (x, y, z)
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @param {number} instanceId
     */
    setInstanceId(x, y, z, instanceId) {
        if (this.inBounds(x, y, z)) {
            this.data[x][y][z].instanceId = instanceId;
        }
    }


  /**
   * Returns true if this block is completely hidden by other blocks
   * @param {number} x 
   * @param {number} y 
   * @param {number} z 
   * @returns {boolean}
   */
    isBlockHidden(x, y, z) {
        const directions = [
            [0, 1, 0],   // up
            [0, -1, 0],  // down
            [1, 0, 0],   // left
            [-1, 0, 0],  // right
            [0, 0, 1],   // forward
            [0, 0, -1]   // back
        ];

        return directions.every(([dx, dy, dz]) => {
            const neighbor = this.getBlock(x + dx, y + dy, z + dz);
            return neighbor && neighbor.id !== BLOCKS.empty.id;
        });
    }
}