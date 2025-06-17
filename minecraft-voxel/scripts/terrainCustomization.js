import * as THREE from 'three';
import { BLOCKS } from './block';
import { makeNoise2D } from 'open-simplex-noise';
import {waterUniforms, waterVertex, waterFragment} from './waterShader';
import { RNG } from './rng';

const SLICE_GENERATION = 0;
const SPHERE_GENERATION = 1;

const cloudNoiseCache = new Map();

export class TerrainCustomization extends THREE.Group {
    constructor(worldChunk) {
        super();
        this.worldChunk = worldChunk; // Reference to the world chunk
        this.params = worldChunk.params; // Parameters for terrain customization
    }

    generateTrees(x, y, z, biome, seedInt) {
        let rng = new RNG(seedInt); // Create a new RNG instance with the seed
        const minH = this.worldChunk.params.trees.trunk.minHeight;
        const maxH = this.worldChunk.params.trees.trunk.maxHeight;
        const height = Math.max(Math.round(rng.random() * (maxH - minH)) + minH, minH); // Random height between min and max

        const block = this.worldChunk.getBlock(x, y, z);
        let block_id = BLOCKS.empty.id; // Default to empty block
        if (biome === 'tundra2forest' && block.id !== BLOCKS.ice.id) {
            block_id = BLOCKS.tree.id;
        } else if (biome === 'forest') {
            block_id = BLOCKS.tree.id;
        } else if (biome === 'forest2desert') {
            if(block.id === BLOCKS.sand.id) {
                block_id = BLOCKS.cactus.id;
            }
            else {
                block_id = BLOCKS.tree.id;
            }
        } else if (biome === 'desert') {
            block_id = BLOCKS.cactus.id;
        }


        for (let h = y; h < y + height; h++) {
            const trunkBlock = this.worldChunk.getBlock(x, h, z);
            if (!trunkBlock || trunkBlock.id !== BLOCKS.empty.id) continue; // Only generate trunk on empty blocks
            this.worldChunk.setId(x, h, z, block_id); // Set the block ID to tree or cactus
        }

        if (((biome == 'tundra2forest' && block.id === BLOCKS.grass.id)) || (biome === 'forest2desert' && block.id === BLOCKS.grass.id) ||
            (biome === 'forest')) {
                //console.log(`Generating tree crown at (${x}, ${y + height}, ${z}) in biome ${biome}`);
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
        const block = this.worldChunk.getBlock(x, y, z);
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
                        let leaves = rng.random() < ratio ? leavesID[0] : leavesID[1]; // Randomly select a leaves ID from the array
                        if (!leafBlock || leafBlock.id !== BLOCKS.empty.id) continue; // Only generate leaves on empty blocks
                        if (rng.random() < density) { // Only generate leaves on empty blocks
                            if (biome === 'forest' ) {
                                this.worldChunk.setId(leafX, leafY, leafZ, leaves); // Set the block ID to leaves
                            }
                            else if ((biome === 'tundra2forest' || biome === 'forest2desert')) {
                                this.worldChunk.setId(leafX, leafY, leafZ, leaves); // Set the block ID to jungle leaves
                            }
                        }
                    }
                }
            }
        }
    }




    generateClouds(seedInt) {
        let noise2D = cloudNoiseCache.get(seedInt);
        if (!noise2D) {
            noise2D = makeNoise2D(seedInt);
            cloudNoiseCache.set(seedInt, noise2D);
        }

        for (let x = 0; x < this.worldChunk.size.width; x++) {
            for (let z = 0; z < this.worldChunk.size.width; z++) {
                const noiseValue = noise2D(
                    (this.worldChunk.position.x + x) / this.worldChunk.params.clouds.scale, 
                    (this.worldChunk.position.z + z) / this.worldChunk.params.clouds.scale);
                let normalizedNoiseValue = (noiseValue + 1) / 2; // Normalize to [0, 1]
                if (normalizedNoiseValue < this.worldChunk.params.clouds.density) {
                   // Create a cloud block at the position
                 const cloudBlock = BLOCKS.cloud;
                 const layers = this.worldChunk.params.clouds.layers ?? 2;   // nuovo parametro
                 for (let i = 0; i < layers; i++) {
                     this.worldChunk.setId(
                         x,
                         this.worldChunk.size.height - 1 - i,
                         z,
                         cloudBlock.id
                     );
                 }
                }
            }
        }
    }

    generateWater() {
        // const material = new THREE.MeshLambertMaterial({ color: 0x1E90FF, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
        const uniforms = THREE.UniformsUtils.clone(waterUniforms); // Clone the water uniforms
        uniforms.tint.value.set(0x3d9bd9); // Set the water tint color        
        
        const material = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: waterVertex,
            fragmentShader: waterFragment,
            transparent: true, 
            side: THREE.DoubleSide, // Render both sides of the water plane
        });
        
        const SEG = 1; // Number of segments for the water plane
        const geometry = new THREE.PlaneGeometry(1, 1, SEG, SEG);

        const waterMesh = new THREE.Mesh(geometry, material);
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
        waterMesh.userData.isWater = true; // Mark the mesh as water

        this.worldChunk.add(waterMesh); // Add the water mesh to the terrain customization group
}

    /**
     * Get the biome at a specific position in the world chunk.
     * @param {number} x - The x coordinate relative to the world chunk.
     * @param {number} z - The z coordinate relative to the world chunk.
     * @param {number} seed - The seed for noise generation.
     * @returns {string} - The biome type.
     */
    pickBlock(x, z, blockList, noise) {
        if (blockList.length === 1) return blockList[0];
        
        let raw = noise(
            (this.worldChunk.position.x + x) / this.worldChunk.params.biomes.scale, 
            (this.worldChunk.position.z + z) / this.worldChunk.params.biomes.scale
        );
        raw = (raw + 1) * 0.5; // Normalize to [0, 1]

        raw += this.worldChunk.params.biomes.variation.amplitude * noise(
            (this.worldChunk.position.x + x) / (this.worldChunk.params.biomes.variation.scale), 
            (this.worldChunk.position.z + z) / (this.worldChunk.params.biomes.variation.scale)
        );

        if(blockList.length === 2) {
            return raw < 0.5 ? blockList[0] : blockList[1]; // Return one of the two blocks based on noise
        }
        if(raw<= 0.33) {
            return blockList[0]; // Return the first block if raw is less than or equal to 0.33
        }
        else if(raw <= 0.66) {
            return blockList[1]; // Return the second block if raw is less than or equal to 0.66
        }
        else {
            return blockList[2]; // Return the third block if raw is greater than 0.66
        }
    }


    
    
    



}