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

    generateTrees(seedInt) {
        let rng = new RNG(seedInt); // Create a new RNG instance with the seed

        const BlockType = [[BLOCKS.tree, BLOCKS.leaves, SPHERE_GENERATION], [BLOCKS.jungleTree, BLOCKS.jungleLeaves, SPHERE_GENERATION], [BLOCKS.tree, BLOCKS.cherryLeaves, SLICE_GENERATION]]; // Define block types for trees


        const minH = this.worldChunk.params.trees.trunk.minHeight;
        const maxH = this.worldChunk.params.trees.trunk.maxHeight;
        const minR = this.worldChunk.params.trees.canopy.minRadius;
        const maxR = this.worldChunk.params.trees.canopy.maxRadius;

        for (let x = 0; x < this.worldChunk.size.width; x++) {
            const blockTreeType = BlockType[Math.floor(rng.random() * (BlockType.length))]; //se lo volessimo biased verso la posizione 0 potre
            const blockID = blockTreeType[0].id; // Get the ID of the selected tree trunk block
            const leavesID = blockTreeType[1].id; // Get the ID of the selected tree leaves block
            const generationType = blockTreeType[2]; // Get the generation type (slice or sphere)
            for (let y=0; y < this.worldChunk.size.height; y++) {
                for (let z = 0; z < this.worldChunk.size.width; z++) {
                    const block = this.worldChunk.getBlock(x, y, z);


                    if (block && block.id === BLOCKS.grass.id) { // Only generate trees on grass blocks
                        if (rng.random() < this.worldChunk.params.trees.frequency) {
                            const height = Math.max(Math.round(rng.random() * (maxH - minH)) + minH, minH); // Random height between min and max
                            for (let h = y + 1; h < y + height; h++) {
                                if (h < this.worldChunk.size.height) {
                                    this.worldChunk.setId(x, h, z, blockID);
                                }
                            }

                            // Generate leaves at the top of the trunk

                            //let rawCanopy = noise3D((this.position.x + x) / 20, (this.position.y + y) / 20, (this.position.z + z) / 20);
                            const radius = Math.round(rng.random() * (maxR - minR)) + minR // Random radius between min and max

                            console.log(`Generating tree at (${x}, ${y}, ${z}) with height ${height} and radius ${radius}`);
                            
                            if (generationType === SLICE_GENERATION) {
                                this.SliceLeavesGeneration(x, y, z, radius, height, leavesID, rng); // Generate leaves using slice generation
                            } else if (generationType === SPHERE_GENERATION) {
                                this.SphereLeavesGeneration(x, y, z, radius, height, leavesID, rng); // Generate leaves using sphere generation
                            }
                            
                        }
                    }
                }
            }
        }
    }

    SliceLeavesGeneration(x, y, z, radius, height, leavesID, rng) {
        const density = this.worldChunk.params.trees.canopy.density;
        for (let Cy = 0; Cy <= radius; Cy++) {
            // radius shrinks as Cy increases:
                let layerRadius = radius - Cy;

                // sweep out a square of side (2*layerRadius + 1)
                for (let Cx = -layerRadius; Cx <= layerRadius; Cx++) {
                    for (let Cz = -layerRadius; Cz <= layerRadius; Cz++) {
                        const leafX = x + Cx;
                        const leafY = y + height + Cy;  // up from the trunk
                        const leafZ = z + Cz;
                        const leafBlock = this.worldChunk.getBlock(leafX, leafY, leafZ);
                        if (leafBlock && rng.random() < density  && leafBlock.id === BLOCKS.empty.id) {
                            this.worldChunk.setId(leafX, leafY, leafZ, leavesID);
                        }
                    }
                }
            }
    }

    SphereLeavesGeneration(x, y, z, radius, height, leavesID, rng){
        const density = this.worldChunk.params.trees.canopy.density;
        radius = radius - 1;
        for (let Cx=-radius; Cx <= radius; Cx++) {
            for (let Cy=-radius; Cy <= radius; Cy++) {
                for (let Cz=-radius; Cz <= radius; Cz++) {
                    const distance = ((Cx * Cx) + (Cy * Cy) + (Cz * Cz));
                    if (distance <= (radius * radius)) { // Check if within the spherical radius
                        const leafX = x + Cx;
                        const leafY = y + height + Cy; // Leaves are generated above the trunk
                        const leafZ = z + Cz;
                        const leafBlock = this.worldChunk.getBlock(leafX, leafY, leafZ);

                        if (leafBlock && rng.random() < density && leafBlock.id === BLOCKS.empty.id) { // Only generate leaves on empty blocks
                            this.worldChunk.setId(leafX, leafY, leafZ, leavesID); // Set the block ID to leaves

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
        console.log('Generating water plane for terrain customization');
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



}