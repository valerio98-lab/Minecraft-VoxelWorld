import * as THREE from 'three';
import { BLOCKS } from './block';
import { makeNoise2D } from 'open-simplex-noise';
import { RNG } from './rng';

const SLICE_GENERATION = 0;
const SPHERE_GENERATION = 1;

export class TerrainCustomization extends THREE.Group {
    constructor(worldChunk) {
        super();
        this.worldChunk = worldChunk; // Reference to the world chunk
    }

    generateTrees(x, y, z, biome, seedInt) {
        let rng = new RNG(seedInt); // Create a new RNG instance with the seed

        const minH = this.worldChunk.params.trees.trunk.minHeight;
        const maxH = this.worldChunk.params.trees.trunk.maxHeight;
        const height = Math.max(Math.round(rng.random() * (maxH - minH)) + minH, minH); // Random height between min and max


        for (let h = y; h < y + height; h++) {
            if (biome === 'temperate' || biome === 'tundra') {
                this.worldChunk.setId(x, h, z, BLOCKS.tree.id);
            } else if (biome === 'forest') {
                this.worldChunk.setId(x, h, z, BLOCKS.jungleTree.id);
            } else if (biome === 'desert') {
                this.worldChunk.setId(x, h, z, BLOCKS.cactus.id);
            }
        }

        if (biome == 'temperate' || biome === 'forest') {
            this.TreeCrownGeneration(rng, biome, x, y + height, z); // Generate tree crown
        }
    }


    TreeCrownGeneration(rng, biome, x, y, z) {

        const BlockType = [
            [BLOCKS.tree, BLOCKS.leaves, BLOCKS.leaves_r1, SPHERE_GENERATION], //tree
            [BLOCKS.tree, BLOCKS.cherryLeaves, BLOCKS.cherryLeaves_r1, SPHERE_GENERATION], //cherry tree
            [BLOCKS.tree, BLOCKS.azalea_leaves, BLOCKS.azalea_flowers, SPHERE_GENERATION],
            
        ]; // Define block types for trees
        
        const blockTreeType = BlockType[Math.floor(Math.random() * (BlockType.length))]; 
        const leavesID = [blockTreeType[1].id, blockTreeType[2].id];
        const generationType = blockTreeType[3]; 

        const minR = this.worldChunk.params.trees.canopy.minRadius;
        const maxR = this.worldChunk.params.trees.canopy.maxRadius;
        const radius = Math.round(rng.random() * (maxR - minR)) + minR // Random radius between min and max

        if (generationType === SPHERE_GENERATION) {
            this.SphereLeavesGeneration(x, y, z, radius, leavesID, biome, rng); // Generate leaves using slice generation
        } else if (generationType === SPHERE_GENERATION) {
            this.SphereLeavesGeneration(x, y, z, radius, leavesID, biome, rng); // Generate leaves using sphere generation
        }
        
    }

    SphereLeavesGeneration(x, y, z, radius, leavesID, biome, rng){
        const density = this.worldChunk.params.trees.canopy.density;
        for (let Cx=-radius; Cx <= radius; Cx++) {
            for (let Cy=-radius; Cy <= radius; Cy++) {
                for (let Cz=-radius; Cz <= radius; Cz++) {
                    const distance = ((Cx * Cx) + (Cy * Cy) + (Cz * Cz));
                    if (distance <= (radius * radius)) { // Check if within the spherical radius
                        const leafX = x + Cx;
                        const leafY = y + Cy; // Leaves are generated above the trunk
                        const leafZ = z + Cz;
                        const leafBlock = this.worldChunk.getBlock(leafX, leafY, leafZ);
                        const ratio = this.worldChunk.params.trees.canopy.transparentRatio; // Ratio for transparent leaves
                        console.log('ratio', ratio);
                        let leaves = Math.random() < ratio ? leavesID[0] : leavesID[1]; // Randomly select a leaves ID from the array
                        
                        if (leafBlock && rng.random() < density && leafBlock.id === BLOCKS.empty.id) { // Only generate leaves on empty blocks
                            if (biome === 'temperate' ) {
                                this.worldChunk.setId(leafX, leafY, leafZ, leaves); // Set the block ID to leaves
                            }
                            else if (biome === 'forest'){
                                this.worldChunk.setId(leafX, leafY, leafZ, BLOCKS.jungleLeaves); // Set the block ID to jungle leaves
                            }
                        }
                    }
                }
            }
        }
    }



    SliceLeavesGeneration(x, y, z, radius, leavesID, biome, rng) {
        const density = this.worldChunk.params.trees.canopy.density;
        for (let Cy = 0; Cy <= radius; Cy++) {
            // radius shrinks as Cy increases:
                let layerRadius = radius - Cy;

                // sweep out a square of side (2*layerRadius + 1)
                for (let Cx = -layerRadius; Cx <= layerRadius; Cx++) {
                    for (let Cz = -layerRadius; Cz <= layerRadius; Cz++) {
                        let leaves = leavesID[Math.floor(rng.random() * leavesID.length)]; // Randomly select a leaves ID from the array
                        const leafX = x + Cx;
                        const leafY = y + Cy;  // up from the trunk
                        const leafZ = z + Cz;
                        const leafBlock = this.worldChunk.getBlock(leafX, leafY, leafZ);
                        if (leafBlock && rng.random() < density  && leafBlock.id === BLOCKS.empty.id) {
                            if(biome=== 'temperate' ) {
                                this.worldChunk.setId(leafX, leafY, leafZ, leaves); // Set the block ID to leaves
                            }
                            else if (biome === 'forest') {
                                this.worldChunk.setId(leafX, leafY, leafZ, BLOCKS.jungleLeaves); // Set the block ID to jungle leaves
                            }
                        }
                    }
                }

            }
    }




    generateClouds(seedInt) {
        const noise2D = new makeNoise2D(seedInt);

        for (let x = 0; x < this.worldChunk.size.width; x++) {
            for (let z = 0; z < this.worldChunk.size.width; z++) {
                const noiseValue = noise2D(
                    (this.worldChunk.position.x + x) / this.worldChunk.params.clouds.scale, 
                    (this.worldChunk.position.z + z) / this.worldChunk.params.clouds.scale);
                let normalizedNoiseValue = (noiseValue + 1) / 2; // Normalize to [0, 1]
                if (normalizedNoiseValue < this.worldChunk.params.clouds.density) {
                    // Create a cloud block at the position
                    const cloudBlock = BLOCKS.cloud;
                    this.worldChunk.setId(x, this.worldChunk.size.height - 1, z, cloudBlock.id);
                }
            }
        }
    }

    generateWater() {
        //console.log('Generating water plane for terrain customization');
        const material = new THREE.MeshLambertMaterial({ color: 0x1E90FF, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
        const waterGeometry = new THREE.PlaneGeometry();
        const waterMesh = new THREE.Mesh(waterGeometry, material);
        waterMesh.rotateX(-Math.PI / 2); // Rotate the plane to be horizontal
        waterMesh.position.set(
            this.worldChunk.size.width / 2,
            this.worldChunk.params.terrain.waterOffset+0.4, 
            this.worldChunk.size.width / 2
        ); // Center the water plane
        waterMesh.scale.set(
            this.worldChunk.size.width, 
            this.worldChunk.size.width,
            1
        ); // Scale the water plane to cover the chunk
        waterMesh.layers.set(1); // Set the layer for water
        this.worldChunk.add(waterMesh); // Add the water mesh to the terrain customization group
    }

    /**
     * Get the biome at a specific position in the world chunk.
     * @param {number} x - The x coordinate relative to the world chunk.
     * @param {number} z - The z coordinate relative to the world chunk.
     * @param {number} seed - The seed for noise generation.
     * @returns {string} - The biome type.
     */
    getBiome(x, z, noise) {
        let raw = noise(
            (this.worldChunk.position.x + x) / this.worldChunk.params.biomes.scale, 
            (this.worldChunk.position.z + z) / this.worldChunk.params.biomes.scale
        );
        raw = (raw + 1) / 2; // Normalize to [0, 1]
        raw += this.worldChunk.params.biomes.variation.amplitude * noise(
            (this.worldChunk.position.x + x) / (this.worldChunk.params.biomes.variation.scale), 
            (this.worldChunk.position.z + z) / (this.worldChunk.params.biomes.variation.scale)
        );

        if (raw < this.worldChunk.params.biomes.Tundra2Temperate){
            return 'tundra';
        }
        else if (raw < this.worldChunk.params.biomes.Temperate2Forest) {
            return 'temperate';
        } else if (raw < this.worldChunk.params.biomes.Jungle2Desert) {
            return 'forest';
        } else {
            return 'desert';
        }
    }



}