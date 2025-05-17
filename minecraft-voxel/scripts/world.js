import * as THREE from 'three';
import {SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshLambertMaterial({ color: 0x00d000 });

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
            scale:50,
            magnitude: 0.5,
            offset: 0.2
        }
    };

    constructor(size={width: 64, height: 16}) {
        super();
        this.size = size;
    }

    generate() {
        this.initializeTerrain();
        this.generateTerrain();
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
                        id: 0, //if you put 0 here, it will not be rendered
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

    generateTerrain() {
        const simplex = new SimplexNoise();
        for (let x = 0; x < this.size.width; x++) {
            for (let z = 0; z < this.size.width; z++) {
                const noiseValue = simplex.noise(x / this.params.terrain.scale, z / this.params.terrain.scale);
                const scaledNoise = this.params.terrain.magnitude * noiseValue + this.params.terrain.offset;
                let height = Math.floor(this.size.height * scaledNoise);
                height = Math.max(0, Math.min(height, this.size.height)); // Clamp height to valid range

                for (let y = 0; y < height; y++) {
                    this.setId(x, y, z, 1); // Set block ID to 1 (solid) up to the calculated height
                }
            }
        }
    }

    generateMeshes(){
        this.clear(); // Clear previous blocks if any

        const max_count = this.size.width * this.size.width * this.size.height;
        const mesh = new THREE.InstancedMesh(geometry, material, max_count);
        mesh.count = 0;

        const matrix = new THREE.Matrix4();
        for (let x = 0; x < this.size.width; x++) {
            for (let y = 0; y < this.size.height; y++) {
                for (let z = 0; z < this.size.width; z++) {
                    const blockId = this.getBlock(x, y, z).id;
                    const instanceId = mesh.count;

                    if (blockId !== 0){
                        matrix.setPosition(x+0.5, y+0.5, z+0.5);
                        mesh.setMatrixAt(instanceId, matrix); // Aggiungiamo la matrice alla mesh
                        this.setInstanceId(x, y, z, instanceId); // Set the instance ID in the data structure
                        mesh.count++;
                    }
                }
            }
        }
        this.add(mesh);
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
}