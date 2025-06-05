export class DataStore {
    constructor() {
        this.data = {};
    }

    clear() {
        this.data = {};
    }
    /**
     * Checks if the specified coordinates are within the data store.
     * @param {number} chunkX - The chunk X coordinate.
     * @param {number} chunkZ - The chunk Z coordinate.
     * @param {number} blockX - The block X coordinate within the chunk.
     * @param {number} blockY - The block Y coordinate within the chunk.
     * @param {number} blockZ - The block Z coordinate within the chunk.
     * @returns {boolean} True if the coordinates are contained in the data store, false otherwise.
     */
    contains(chunkX, chunkZ, blockX, blockY, blockZ) {
        const key = this.getKey(chunkX, chunkZ, blockX, blockY, blockZ);
        return this.data[key] !== undefined; 
    }

    /**
     * Gets the block ID at the specified coordinates.
     * @param {number} chunkX - The chunk X coordinate.
     * @param {number} chunkZ - The chunk Z coordinate.
     * @param {number} blockX - The block X coordinate within the chunk.
     * @param {number} blockY - The block Y coordinate within the chunk.
     * @param {number} blockZ - The block Z coordinate within the chunk.
     * @return {number} The block ID at the specified coordinates, or undefined if not set.
     */
    get(chunkX, chunkZ, blockX, blockY, blockZ) {
        const key = this.getKey(chunkX, chunkZ, blockX, blockY, blockZ);
        const blockId = this.data[key];
        return blockId || undefined; 
    }
    /**
     * Sets the block ID at the specified coordinates.
     * @param {number} chunkX - The chunk X coordinate.
     * @param {number} chunkZ - The chunk Z coordinate.
     * @param {number} blockX - The block X coordinate within the chunk.
     * @param {number} blockY - The block Y coordinate within the chunk.
     * @param {number} blockZ - The block Z coordinate within the chunk.
     * @param {number} blockId - The ID of the block to set.
     */

    set(chunkX, chunkZ, blockX, blockY, blockZ, blockId) {
        const key = this.getKey(chunkX, chunkZ, blockX, blockY, blockZ);
        this.data[key] = blockId;
        console.log(`Set block at (${chunkX}, ${chunkZ}, ${blockX}, ${blockY}, ${blockZ}) to ID: ${blockId}`);
    }

    getKey(chunkX, chunkZ, blockX, blockY, blockZ) {
        return `${chunkX}_${chunkZ}_${blockX}_${blockY}_${blockZ}`;
    }

}