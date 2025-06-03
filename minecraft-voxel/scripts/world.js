import * as THREE from 'three';
import { WorldChunk } from './worldChunk';
import {debug} from './utils';

export class World extends THREE.Group{


    asyncLoading = true; // If true, chunks will be loaded asynchronously

    visibleDistance = 3;
    WorldChunkSize={width: 32, height: 32}
    printed = [];


    params = {
        terrain: {
            seed: 0,
            scale: 20,           // scala base per l’ottava 0
            magnitude: 0.4,      // ampiezza complessiva (verrà applicata dopo)
            offset: 0.2,         // spostamento (così non avremo mai height = 0)
            octaves: 4,          // numero di ottave
            persistence: 0.9,    // di quanto diminuisce ampiezza da un’ottava alla successiva
            lacunarity: 2.0      // di quanto aumenta frequenza da un’ottava alla successiva
        }
    };

    constructor(seed=0){
        super();
        this.seed = seed;
    }

    generate() {
        this.disposeChunks(); // Clear existing chunks before generating new ones
        for (let x = -this.visibleDistance; x < this.visibleDistance; x ++) {
            for (let z = -this.visibleDistance; z < this.visibleDistance; z ++) {
                const chunk = new WorldChunk(this.WorldChunkSize, this.params);
                chunk.position.set(x*this.WorldChunkSize.width, 0, z*this.WorldChunkSize.width);
                chunk.userData = {x,z};
                chunk.generate();
                this.add(chunk);
            }
        }
    }


    update(player){
        const visibleChunks = this.getVisibleChunks(player);
        // debug(
        //     visibleChunks.map(c => `${c.x},${c.z}`),
        //     "Visible Chunks"
        // );
        const chunksToDraw = this.getChunksToDraw(visibleChunks);
        // debug(chunksToDraw, "Chunks to Draw");
        this.removeChunks(visibleChunks);

        for (const chunk of chunksToDraw) {
            this.generateChunk(chunk.x, chunk.z);
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
            //console.log(`Removed chunk at (${chunk.userData.x}, ${chunk.userData.z})`);
        });
    }

    generateChunk(x, z) {
        const chunk = new WorldChunk(this.WorldChunkSize, this.params);
        chunk.position.set(x*this.WorldChunkSize.width, 0, z*this.WorldChunkSize.width);
        chunk.userData = {x,z};

        if (this.asyncLoading) {
            requestIdleCallback(chunk.generate.bind(chunk), {
                timeout: 1000 // Set a timeout for the async generation
            });
        }
        else{
            chunk.generate();
        }
        this.add(chunk);
        //console.log(`Generated chunk at (${chunk.userData.x}, ${chunk.userData.z})`);
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

    /**
     * Remove a block at the specified world coordinates.
     * @param {number} worldX - The x coordinate in world space.
     * @param {number} worldY - The y coordinate in world space.
     * @param {number} worldZ - The z coordinate in world space.
     * @param {Block} block - The block to remove.
     */

    removeBlock(worldX, worldY, worldZ) {
        const {chunkCoords, blockInChunk} = this.worldToLocalChunk(worldX, worldY, worldZ);
        const chunk = this.getChunk(chunkCoords.x, chunkCoords.z);
        if (chunk && chunk.loaded) {
            chunk.removeBlockInChunk(blockInChunk.x, blockInChunk.y, blockInChunk.z);
        }
    }

}