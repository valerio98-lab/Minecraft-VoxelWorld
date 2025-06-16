import * as THREE from 'three';
//import {SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';
import { makeNoise2D } from 'open-simplex-noise';
import { makeNoise3D } from 'open-simplex-noise';   
import {RNG } from './rng.js';
import { BLOCKS, resources } from './block.js';
import { TerrainCustomization } from './terrainCustomization.js';

const geometry = new THREE.BoxGeometry(1, 1, 1);
const noise3DCache = new Map(); // Cache for 3D noise to avoid re-creating it
const noise2DCache = new Map(); // Cache for 2D noise to avoid re-creating it


export class WorldChunk extends THREE.Group{
    /**
     * @type {{
     * id: number,
     * instanceId: number,
     * }[][][]}
     */
    data = []; // 3D array to hold block datas


    constructor(size, params, dataStore, biomeManager, temperature, humidity, treeDensity) {
        super();
        this.loaded = false; // Flag to indicate if the chunk is loaded
        this.size = size;
        this.params = params; // Parameters for terrain generation
        this.dataStore = dataStore; // Data store for managing chunk data
        this.biomeManager = biomeManager // Create an instance of TerrainCustomization
        this.TerrainCustomization = new TerrainCustomization(this); // Create an instance of TerrainCustomization
        this.temperature = temperature; // Set the temperature for the chunk
        this.humidity = humidity; // Set the humidity for the chunk
        this.treeDensity = treeDensity; // Set the tree density for the chunk
        this.biome = this.biomeManager.getBiome(this.temperature, this.humidity); // Get the biome based on temperature and humidity
        this.blockType = this.biomeManager.getBlockIDPerBiome(this.biome); 
    }

    generate() {
        this.rng = new RNG(this.params.terrain.seed); // Initialize RNG with the seed from params
        const randomFloat = this.rng.random();
        const seedInt = Math.floor(randomFloat * 0x100000000); // Convert to integer seed for noise generation
        this.initializeTerrain();
        this.generateTerrain(seedInt);
        this.TerrainCustomization.generateClouds(seedInt); // Generate clouds using TerrainCustomization
        this.loadPlayerChanges();
        this.generateMeshes();

        this.loaded = true; // Set loaded flag to true after generation
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
                        instanceId: null // Instance ID for instancing
                    });
                }
                slice.push(row);
            }
            this.data.push(slice);

        }
    }

    generateTerrain(seedInt) {
        let noise2D = noise2DCache.get(seedInt);
        if (!noise2D) {
            noise2D = makeNoise2D(seedInt); // Create a new 2D noise generator if not in cache
            noise2DCache.set(seedInt, noise2D); // Store the 2D noise generator in the cache
        }
        // Generate terrain using Perlin noise looping through each block in the world
        // and applying the noise function to determine the height of each block
        for (let x = 0; x < this.size.width; x++) {
            for (let z = 0; z < this.size.width; z++) {
                const sampleX = ((this.position.x + x) / this.params.terrain.scale) //* frequency;
                const sampleZ = ((this.position.z + z) / this.params.terrain.scale) //* frequency;
                const raw = noise2D(sampleX, sampleZ); // Get the noise value for the current coordinates in the range [-1, 1]

                /**
                 * The magnitude represents the baseline of the terrain,
                 * while the offset represent the maximum height and the minimum height w.r.t the baseline,
                 * in a Nutshell how tall a crest can be and how deep a trough can be, indeed keep in mind that the offset 
                 * is pre-multiplied by the raw noise value to scale it in a range [-1,1] and then added to the magnitude.
                 * The parameters height is therefore the height of the terrain at a given point and therefore 
                 * the number of blocks that will be set to fill up to that height.
                 */
                const scaledNoise = this.params.terrain.magnitude + (this.params.terrain.offset * raw);

                let height = Math.floor(this.size.height * scaledNoise);
                height = Math.max(0, Math.min(height, this.size.height-1)); // Clamp height to valid range
                
                
                for (let y = 0; y < this.size.height; y++) {
                    // if (y <= this.params.terrain.waterOffset) {
                    //     this.setId(x, y, z, BLOCKS.sand.id);
                    // }
                    if (y=== height) {
                        const blockId = this.TerrainCustomization.pickBlock(x, z, this.blockType, noise2D); // Set the block ID to the generated block type
                        
                        this.setId(x, y, z, blockId); // Set the block ID at the current position


                        if (this.rng.random() > 1000) { // Check if a tree should be generated based on the tree density
                            // Randomly generate trees based on the frequency parameter
                            this.TerrainCustomization.generateTrees(x, height, z, this.biome, seedInt); // Generate a tree at the current position
                        }
                    
                    }
                    else if(y<height && this.getBlock(x, y, z).id === BLOCKS.empty.id) {
                        this.generateResources(seedInt, x,y,z); // Set block ID to 1 (grass) up to the calculated height
                    }
                }
            }
        }
    }

    generateResources(seedInt, x,y,z) {
        this.setId(x, y, z, BLOCKS.dirt.id); 
        let noise3D = noise3DCache.get(seedInt); 
        if (!noise3D) {
            noise3D = makeNoise3D(seedInt); // If not in cache, create a new 3D noise generator
            noise3DCache.set(seedInt, noise3D); // Create a new 3D noise generator and store it in the cache
        }
        resources.forEach(resource => {
            const value = noise3D(
                (this.position.x + x) / resource.scale.x,
                (this.position.y + y) / resource.scale.y,
                (this.position.z + z) / resource.scale.z
            ); // Generate noise value for the current block
            if (value > resource.scarcity) { // If the noise value is above a threshold, set a resource block
                this.setId(x, y, z, resource.id); // Set block ID to the resource ID
            }
        });
    }

    loadPlayerChanges() {
        // Load player changes from the data store
        for (let x = 0; x < this.size.width; x++) {
            for (let y = 0; y < this.size.height; y++) {
                for (let z = 0; z < this.size.width; z++) {
                    const blockId = this.dataStore.get(this.position.x, this.position.z, x, y, z);
                    if (blockId !== undefined && blockId !== BLOCKS.empty.id) {
                        this.setId(x, y, z, blockId); // Set the block ID from the data store
                    }
                }
            }
        }
    }

    generateMeshes(){
        this.clear(); // Clear previous blocks if any

        // lookup table for block types

        this.TerrainCustomization.generateWater(); // Generate water using TerrainCustomization

        const meshes = {}; 
        Object.values(BLOCKS)
            .filter(blockType => blockType.id !== BLOCKS.empty.id) // Filter out empty blocks
            .forEach(blockType => {
                const max_count = Math.ceil(this.size.width * this.size.width * this.size.height*0.25);
                const mesh = new THREE.InstancedMesh(geometry, blockType.material, max_count);
                mesh.count = 0;
                mesh.castShadow = true; // Enable shadow casting for the mesh
                mesh.receiveShadow = true; // Enable shadow receiving for the mesh
                mesh.name = blockType.id; // Set the name of the mesh to the block name

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
                        mesh.setMatrixAt(instanceId, matrix); // Applichiamo la matrice alla mesh
                        mesh.instanceMatrix.needsUpdate = true; // Mark the instance matrix as needing update
                        this.setInstanceId(x, y, z, instanceId); // Set the instance ID in the data structure
                        mesh.count++;
                    }
                    else {
                        this.setInstanceId(x, y, z, null); // If the block is hidden, set instance ID to null
                        // mesh.castShadow = false; // Disable shadow casting for hidden blocks
                        // mesh.receiveShadow = false; // Disable shadow receiving for hidden blocks
                    }
                }
            }
        }
        this.add(...Object.values(meshes)); // Add all meshes to the world group
    }

    /**
     * Removes a block at the specified coordinates (x, y, z)
     * @param {number} x - The x coordinate of the block to remove
     * @param {number} y - The y coordinate of the block to remove
     * @param {number} z - The z coordinate of the block to remove
     */

    removeBlockInChunk(x, y, z) {
        const block = this.getBlock(x, y, z);
        if (!block || block.id === BLOCKS.empty.id) return;

        const mesh = this.children.find(m => m.name === block.id);
        if (block.instanceId !== null && mesh) {
            const lastIndex = mesh.count - 1;
            const lastMatrix = new THREE.Matrix4();
            mesh.getMatrixAt(lastIndex, lastMatrix);
            mesh.setMatrixAt(block.instanceId, lastMatrix);
            const pos = new THREE.Vector3();
            lastMatrix.decompose(pos, new THREE.Quaternion(), new THREE.Vector3());
            this.setInstanceId(pos.x, pos.y, pos.z, block.instanceId);
            mesh.count--;
            mesh.instanceMatrix.needsUpdate = true;
        }
        this.setInstanceId(x, y, z, null);
        this.dataStore.set(this.position.x, this.position.z, x, y, z, BLOCKS.empty.id); // Remove the block from the data store
        }

    revealBlockInChunk(x, y, z) {
        const block = this.getBlock(x, y, z);
        if (!block || block.id === BLOCKS.empty.id || block.instanceId !== null) return;
        const mesh = this.children.find(m => m.name === block.id);

        if (mesh) { 
            const instanceId = mesh.count++;      
            this.setInstanceId(x, y, z, instanceId);  

            const matrix = new THREE.Matrix4();
            matrix.setPosition(x, y, z);
            mesh.setMatrixAt(instanceId, matrix);
            mesh.instanceMatrix.needsUpdate = true;
            mesh.computeBoundingSphere();
        }

    }

    addBlockInChunk(x, y, z, blockId) {
        const block = this.getBlock(x, y, z);
        if (block && block.id === BLOCKS.empty.id) {
            this.setId(x, y, z, blockId); 
            this.dataStore.set(this.position.x, this.position.z, x, y, z, blockId); // Store the block in the data store
            const mesh = this.children.find(m => m.name === blockId);
            if (mesh) {
                const instanceId = mesh.count++; 
                this.setInstanceId(x, y, z, instanceId); 

                const matrix = new THREE.Matrix4();
                matrix.setPosition(x, y, z);
                mesh.setMatrixAt(instanceId, matrix);
                mesh.instanceMatrix.needsUpdate = true;
                mesh.computeBoundingSphere(); 
            }


        }
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
     * Set the instance id for the block at coordinates (x, y, z), 
     * in other words the number of the instance in the instanced mesh
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

        for (const [dx, dy, dz] of directions) {
            const neighbor = this.getBlock(x + dx, y + dy, z + dz);
            if (!neighbor || neighbor.id === BLOCKS.empty.id) {
                return false; // If any neighbor is empty, the block is not hidden
            }
        }
        return true; // All neighbors are solid, the block is hidden
    }
    disposeInstances() {
        this.traverse((child) => {
            if(child.dispose)
                child.dispose();
        });
        this.clear();
    }
}