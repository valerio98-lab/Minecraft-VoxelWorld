import * as THREE from 'three';
import { WorldChunk } from './worldChunk';
import {debug, save, load} from './utils';
import { BiomeManager } from './biomeManager';  
import { BLOCKS } from './block';
import { DataStore } from './dataStore';
import { RNG } from './rng';
const ric = window.requestIdleCallback || 
            function (cb, opts) { return setTimeout(() => cb({ timeRemaining: () => 0 }), opts?.timeout || 1); };


export class World extends THREE.Group{


    asyncLoading = true; // If true, chunks will be loaded asynchronously

    visibleDistance = 2;
    WorldChunkSize={width: 32, height: 64}



    params = {
        terrain: {
            seed: 0,
            scale: 30,           // scala base per l’ottava 0
            magnitude: 0.1,      // ampiezza complessiva (verrà applicata dopo)
            offset: 0.1,         // spostamento (così non avremo mai height = 0)
            waterOffset: 3,
            //octaves: 4,          // numero di ottave
            //persistence: 0.9,    // di quanto diminuisce ampiezza da un’ottava alla successiva
            //lacunarity: 2.0      // di quanto aumenta frequenza da un’ottava alla successiva
        },
        biomes:{
            scale:12,
            variation:{
                amplitude:0.2,
                scale:30
            },
            Tundra2Temperate: 0.25,
            Temperate2Forest: 0.5,
            Forest2Desert: 0.75,
        },
        trees:{
            trunk: {
                minHeight: 4, // altezza minima del tronco
                maxHeight: 10, // altezza massima del tronco
            },
            canopy: {
                minRadius: 1, // raggio minimo della chioma
                maxRadius: 10, // raggio massimo della chioma
                density: 0.6, // densità della chioma (percentuale di blocchi foglia)
                transparentRatio: 0.4, // rapporto di trasparenza della chioma (percentuale di blocchi foglia trasparenti)
            }, 
            frequency: 0.003, // frequenza di generazione degli alberi
        }, 
        clouds: {
            scale: 30,
            density: 0.3,
            layers: 2
            
        }, 
        caves : {
            scale: 20,
            threshold: 0.6,
            yMin: 4.0, // altezza minima di scavo per le caverne
            yMax: 20.0, // altezza massima di scavo per le caverne
        }
    };
    dataStore = new DataStore();
    constructor(seed=0){
        super();
        this.dataStore.clear();
        this.seed = seed;
        this.rng = new RNG(this.params.terrain.seed); // Initialize RNG with the seed from params
        this.seedInt = Math.floor(this.rng.random() * 0x100000000);
        this.BiomeManager = new BiomeManager(this.seedInt)


        document.addEventListener('keydown', (event) => {
            switch(event.code){
                case 'KeyS':
                    if (event.altKey) {
                        save(this);
                    }
                    break;
                case 'KeyL':
                    if (event.altKey) {
                        const {params, userData} = load(this);
                        this.params = params || this.params;
                        this.dataStore.data = userData || {};
                        document.getElementById('load-status').innerHTML = 'Loading game...';
                        setTimeout(() => document.getElementById('load-status').innerHTML = '', 2000);
                        this.generate(false); // Regenerate the world with the loaded parameters
                    }
                    break;
            }
        })
    }

    generate(clearCache = false) {
        if (clearCache) {
            this.dataStore.clear(); // Clear the data store if needed
        }
        this.disposeChunks(); // Clear existing chunks before generating new ones
        for (let x = -this.visibleDistance; x <= this.visibleDistance; x ++) {
            for (let z = -this.visibleDistance; z <= this.visibleDistance; z ++) {
                const { temperature, humidity, treeDensity } = this.BiomeManager.sampleClimate(32, 32);
                const chunk = new WorldChunk(
                    this.WorldChunkSize, 
                    this.params, 
                    this.dataStore, 
                    this.BiomeManager,
                    temperature,
                    humidity,
                    treeDensity,
                );
                chunk.position.set(x*this.WorldChunkSize.width, 0, z*this.WorldChunkSize.width);
                chunk.userData = {x,z};
                chunk.generate();
                this.add(chunk);
            }
        }
    }


    update(player){
        const visibleChunks = this.getVisibleChunks(player);
        const chunksToDraw = this.getChunksToDraw(visibleChunks);
        this.removeChunks(visibleChunks);

        const WorldCoords = {x: player.position.x, z: player.position.z};

        for (const chunk of chunksToDraw) {
            this.generateChunk(chunk.x, chunk.z, WorldCoords);
        }

    }


    /**
     * Returns an array of currently visible chunks based on the player's position.
     * @param {Player} player - The player object to determine visibility.
     * @returns {{x: number, z: number}[]} - An array of visible chunks.
     */
    getVisibleChunks(player) {
        const visibleChunks = [];
        const {chunkCoords, _} = this.worldToLocalChunk(
            player.position.x, 
            player.position.y, 
            player.position.z
        );
        const {chunkX, chunkZ} = {chunkX: chunkCoords.x, chunkZ: chunkCoords.z};
        for (let x=chunkX-this.visibleDistance; x <= chunkX+this.visibleDistance; x++) {
            for (let z=chunkZ-this.visibleDistance; z <= chunkZ+this.visibleDistance; z++) {
                visibleChunks.push({x, z});
            }
        }
        return visibleChunks;
    }
    

    /** * Returns an array of chunks that need to be drawn based on the currently visible chunks.
     * For each visible chunck, it checks if it is a children of the World object tree.
     * @param {Array} visibleChunks - An array of currently visible chunks.
     * * @returns {Array} - An array of chunks that need to be drawn.
    **/
    getChunksToDraw(visibleChunks){
        return visibleChunks.filter((chunk) =>{
            const alreadyDrawn = this.children.some(obj => 
                obj.userData.x === chunk.x && obj.userData.z === chunk.z
            );
            return !alreadyDrawn;
        })
    }


    /**
     * Remove unused chunks that are no longer visible.
     * @param {Array} visibleChunks - An array of currently visible chunks.
     * @void
     */
    removeChunks(visibleChunks) {
        const toRemove = this.children.filter(child => {
            const { x, z } = child.userData;
            return !visibleChunks.some(vc =>
            vc.x === x && vc.z === z
            );
        });
        
        toRemove.map(chunk =>
            ({ x: chunk.userData.x, z: chunk.userData.z })
        );
    
        toRemove.forEach(chunk => {
            chunk.disposeInstances(); // Dispose of chunk instances if necessary
            this.remove(chunk); // Remove the chunk from the world
        });
    }

    generateChunk(x, z, WorldCoords) {
        const { temperature, humidity, treeDensity } = this.BiomeManager.sampleClimate(WorldCoords.x, WorldCoords.z);
        const chunk = new WorldChunk(
            this.WorldChunkSize, 
            this.params, 
            this.dataStore, 
            this.BiomeManager,
            temperature,
            humidity,
            treeDensity,
        );

        chunk.position.set(x*this.WorldChunkSize.width, 0, z*this.WorldChunkSize.width);
        chunk.userData = {x,z};

        if (this.asyncLoading) {
            ric(chunk.generate.bind(chunk), { timeout: 1000 });
        }
        else{
            chunk.generate();
        }
        this.add(chunk);
    }


    /**
     * Remove a block at the specified world coordinates.
     * @param {number} worldX - The x coordinate in world space.
    * @param {number} worldY - The y coordinate in world space.
    * @param {number} worldZ - The z coordinate in world space.
    * @param {Block} block - The block to remove.
    */
   removeBlock(worldX, worldY, worldZ) { 
    const dirs = [
        [ 0,  1,  0], [ 0, -1,  0],
        [ 1,  0,  0], [-1,  0,  0],
        [ 0,  0,  1], [ 0,  0, -1],
    ];

        const { chunkCoords, blockInChunk } = this.worldToLocalChunk(worldX, worldY, worldZ);
        const chunk = this.getChunk(chunkCoords.x, chunkCoords.z);
    
        if (!chunk) return;
    
        chunk.removeBlockInChunk(blockInChunk.x, blockInChunk.y, blockInChunk.z);
        chunk.setId(blockInChunk.x, blockInChunk.y, blockInChunk.z, BLOCKS.empty.id);

        for (const [dx, dy, dz] of dirs) {
            const neighborX = worldX + dx;
            const neighborY = worldY + dy;
            const neighborZ = worldZ + dz;

            const { chunkCoords: c, blockInChunk: b } = this.worldToLocalChunk(neighborX, neighborY, neighborZ);
            const neighborChunk = this.getChunk(c.x, c.z);
            if (!neighborChunk) continue;

            const nBlock = neighborChunk.getBlock(b.x, b.y, b.z);
            if (nBlock) neighborChunk.revealBlockInChunk(b.x, b.y, b.z);
        }
    }

    addBlock(worldX, worldY, worldZ, blockId) {
        const directions = [
                [0, 1, 0],   // up
                [0, -1, 0],  // down
                [1, 0, 0],   // left
                [-1, 0, 0],  // right
                [0, 0, 1],   // forward
                [0, 0, -1]   // back
        ];

        const {chunkCoords, blockInChunk} = this.worldToLocalChunk(worldX, worldY, worldZ);
        const chunk = this.getChunk(chunkCoords.x, chunkCoords.z);
        if (chunk) {
            chunk.addBlockInChunk(blockInChunk.x, blockInChunk.y, blockInChunk.z, blockId);
        }
        for (const [dx, dy, dz] of directions) {
            const neighborX = worldX + dx;
            const neighborY = worldY + dy;
            const neighborZ = worldZ + dz;
            this.hideBlock(neighborX, neighborY, neighborZ);
        }
    }

    hideBlock(worldX, worldY, worldZ) {
        const {chunkCoords, blockInChunk} = this.worldToLocalChunk(worldX, worldY, worldZ);
        const chunk = this.getChunk(chunkCoords.x, chunkCoords.z);
        if (chunk && chunk.isBlockHidden(blockInChunk.x, blockInChunk.y, blockInChunk.z)) {
            chunk.removeBlockInChunk(blockInChunk.x, blockInChunk.y, blockInChunk.z);
        }
    }

        /**
     * Retrieves a block at the specified world coordinates.
     * @param {number} worldX - The x coordinate in world space.
     * @param {number} worldY - The y coordinate in world space.
     * @param {number} worldZ - The z coordinate in world space.
     * @returns {Block|null} - The block if found, otherwise null.
     */
    getBlock(worldX, worldY, worldZ) {
        const {chunkCoords, blockInChunk} = this.worldToLocalChunk(worldX, worldY, worldZ);
        const chunk = this.getChunk(chunkCoords.x, chunkCoords.z);
        if (chunk && chunk.loaded){
            return chunk.getBlock(blockInChunk.x, blockInChunk.y, blockInChunk.z);
        }
        else {
            return null; // Chunk not found
        }
    }

    /**
     * Converts world coordinates to local chunk coordinates.
     * @param {number} x - The x coordinate in world space.
     * @param {number} y - The y coordinate in world space.
     * @param {number} z - The z coordinate in world space.
     * @returns {
     *  chunk: {x:number, z:number},
     *  blockInChunk: {x:number, y:number, z:number}
     * } - The local chunk coordinates or null if out of bounds.
     */

    worldToLocalChunk(x,y,z){
        const chunkCoords = {
            x: Math.floor(x/this.WorldChunkSize.width),
            z: Math.floor(z/this.WorldChunkSize.width)
        };
        const mod = (n,m) => ((n % m) + m) % m;
        const blockCoordsInChunk = {
            x: mod(x, this.WorldChunkSize.width),
            y, // y is not modified as it is local to the chunk
            z: mod(z, this.WorldChunkSize.width)
        };

        return {
            chunkCoords: chunkCoords,
            blockInChunk: blockCoordsInChunk
        };



    }

    /**
     * Retrieves a Chunk object given its world coordinates.
     * @param {number} ChunkX - The x coordinate of the chunk among the loaded chunks.
     * @param {number} ChunkZ - The z coordinate of the chunk among the loaded chunks.
     * @returns {WorldChunk|null} - A WorldChunk object if found, otherwise null.
     */
    getChunk(ChunkX, ChunkZ) {
        return this.children.find(c => 
            c.userData.x === ChunkX && c.userData.z === ChunkZ
        ) || null;
    }


    disposeChunks() {
        this.traverse((child) => {
            if(child.disposeInstances)
                child.disposeInstances();
        });
        this.clear();
    }
}