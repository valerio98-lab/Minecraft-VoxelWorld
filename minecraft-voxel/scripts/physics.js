import * as THREE from 'three';
import { BLOCKS } from './block';
import { Parameters} from './params';


const collisionBoxMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    transparent: true,
    opacity: 0.2
});

const collisionBoxGeometry = new THREE.BoxGeometry(1.001, 1.001, 1.001); // Slightly larger than the player to visualize collisions
const contactGeometry = new THREE.SphereGeometry(0.1, 8, 8); // Small sphere to visualize contact points
const contactMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    wireframe: true,
});


export class Physics {
    gravity = 32;
    simulationRate = 250;
    timestep = 1 / this.simulationRate; // Time step for the physics simulation, in seconds
    accumulator = 0;

    constructor(scene, player) {
        this.helpers = new THREE.Group();  
        this.helpers.visible = false;  
        this.params = new Parameters();
        scene.add(this.helpers); 
    }


    update(dt, player, world){
        this.accumulator += dt;
        
        const planeEnabled = !!this.params.get_subfield('water', 'waterPlane'); // 
        // Calcolo qui una sola volta il waterLevel
        const waterLevel  = this.params.get_subfield('water', 'waterOffset') + 0.4;
        player.inWater = player.position.y - (player.height / 2) < waterLevel; 

        while (this.accumulator >= this.timestep) {
            const bottomY  = player.position.y - player.height / 2;
            const inWater  = bottomY < waterLevel;
            player.updatePlayerInputs(this.timestep, player.onGround, inWater); // Update the player's position based on input and velocity
            player.velocity.y -= this.gravity * this.timestep; // Apply gravity to the player's vertical velocity


            this.applyFlotation(player, waterLevel); 
            this.applyWaterDrag(player, waterLevel);

            player.applyMotion(this.timestep); // Apply the player's motion based on the updated velocity

            this.detectCollisions(player, world); // Detect collisions with the world
            this.accumulator -= this.timestep; // Reduce the accumulator by the time step
        }
        player.updateBoundingCylinder(); // Update the player's bounding cylinder position
    }

    detectCollisions(player, world){
        player.onGround = false; // Reset onGround status for the new frame
        this.helpers.clear();

        const possibleCollisions = this.BroadPhase(player, world); 
        const collisions = this.NarrowPhase(player, possibleCollisions);

        if (collisions.length > 0) {
                this.resolveCollisions(collisions, player);
        }
    }

    BroadPhase(player, world) {
        // Implement broad phase collision detection logic
        // This could be a simple bounding box check or spatial partitioning
        //this.removeCollisionBoxes(); // Clear previous collision boxes

        const possibleCollisions = [];

        const volume = {
            x: {
                min: Math.floor(player.position.x - player.radius), // the min means the left side of the player
                max: Math.ceil(player.position.x + player.radius) // the max means the right side of the player
            },
            y: {
                min: Math.floor(player.position.y - player.height),
                max: Math.ceil(player.position.y + player.height)
            },
            z: {
                min: Math.floor(player.position.z - player.radius),
                max: Math.ceil(player.position.z + player.radius)
            }
        }
        
        for (let x = volume.x.min; x <= volume.x.max; x++) {
            for (let y = volume.y.min; y <= volume.y.max; y++) {
                for (let z = volume.z.min; z <= volume.z.max; z++) {

                    const blockId = world.getBlock(x, y, z)?.id;

                    if (blockId && blockId !== BLOCKS.empty.id && blockId !== BLOCKS.water.id) { // Exclude empty and water blocks
                        
                        possibleCollisions.push(new THREE.Vector3(x, y, z));
                        // Add a collision box to visualize the collision
                        this.addCollisionBox(new THREE.Vector3(x, y, z));
                        
                    }
                }
            }
        }

        return possibleCollisions;
    }

    NarrowPhase(player, possibleCollisions) {
        //this.removeContactPoints(); // Clear previous contact points

        const collisions = [];
        for (const block of possibleCollisions) {

            // Closest point on the block w.r.t the player
            const p = player.position;
            const closestPoint = {
                x: this.clamp(p.x, block.x - player.radius, block.x + player.radius),
                y: this.clamp(p.y - player.height/2, block.y - player.radius, block.y + player.radius),
                z: this.clamp(p.z, block.z - player.radius, block.z + player.radius)
            };

            //console.log("Closest point for block at:", block, "is:", closestPoint);

            // Check if the player is colliding with the block
            const collision = this.InCollisionWithBlock(player, closestPoint);
            
            if (collision.inCollision) {
                const overlapY = (player.height / 2) - Math.abs(collision.dy);
                const overlapXZ = player.radius - Math.sqrt(collision.dx * collision.dx + collision.dz * collision.dz);
                
                let normal, overlap;
                if (overlapY < overlapXZ) {
                    normal = new THREE.Vector3(0, -Math.sign(collision.dy), 0);
                    overlap = overlapY;
                    player.onGround = true;
                } else {
                    normal = new THREE.Vector3(-collision.dx, 0, -collision.dz).normalize();
                    overlap = overlapXZ;
                }
                collisions.push({
                    block,
                    closestPoint,
                    normal,
                    overlap
                });
                //console.log("Last collision details:", block, "Closest Point:", collision.closestPoint, "Normal:", collision.normal, "Overlap:", collision.overlap);    

                // Add a contact point to visualize the collision
                this.addContactPoint(closestPoint);
            }

        }

        //console.log("Narrow Collisions detected:", collisions.length);
        return collisions;

    }

    resolveCollisions(collisions, player) {

        collisions.sort((a, b) =>{
             return a.overlap < b.overlap
            } ); // Sort by overlap to resolve the most significant collisions first
        
        for (const collision of collisions) {
            //console.log("Resolving collision with player at:", player.position, "And Collision closest:", collision.closestPoint);
            const col = this.InCollisionWithBlock(player, collision.closestPoint);
            if (!col.inCollision) continue; 

            //console.log("Resolving collision with block at:", collision.block, "Collision details:", collision);
            let normalPosition = collision.normal.clone().multiplyScalar(collision.overlap);
            player.position.add(normalPosition); // Adjust player's position based on the collision normal and overlap
        
            let magnitude = player.worldVelocity.dot(collision.normal);
            let normalVelocity = collision.normal.clone().multiplyScalar(magnitude);
           
           player.ApplyBodyVelocity(normalVelocity.negate()); // Adjust player's velocity based on the collision normal
        }
    }

    applyFlotation(player, waterLevel) {
        const bottomY = player.position.y - (player.height/2);
        const wave = 0.2 * Math.sin(performance.now() * 0.001); // ±0.1 blocchi
        const depthError = (waterLevel+wave) - bottomY+0.5; 
        if (depthError <= 0) return; 

        const k = 30;  // Spring constant for the buoyancy force
        const c = 0.5; // Damping coefficient

        const acc = k * depthError - c * player.velocity.y; // Buoyancy force

        player.velocity.y += acc * this.timestep; // Apply buoyancy force to the player's vertical velocity

    }

    applyWaterDrag(player, waterLevel) {
        const bottomY    = player.position.y - player.height / 2;

        if (bottomY >= waterLevel) return;

        const dragCoeff = 8.0;
        const f = 1 - dragCoeff * this.timestep; 
        
        player.velocity.multiplyScalar(f); // smorza X, Y, Z
    }



    clamp(player_point, boxMin, boxMax) {
        return Math.max(boxMin, Math.min(player_point, boxMax));
    }


    /** * Checks if the closest points in the bounding cylinder of the player are within the block's bounds
     * @param {Object} player - The player object with position, radius, and height properties
     * @param {Object} closestPoints - The closest points on the block to the player
     * @returns {boolean} - Returns true if a collision is detected, false otherwise
     */

    InCollisionWithBlock(player, closestPoint) {
        const dx = closestPoint.x - player.position.x;
        const dy = closestPoint.y - (player.position.y - (player.height / 2));
        const dz = closestPoint.z - player.position.z;
        const squaredDistance = (dx*dx)+(dz*dz);

        return {
            inCollision: squaredDistance < (player.radius * player.radius) && Math.abs(dy) < (player.height / 2), 
            dx: dx,
            dy: dy,
            dz: dz,
        };
    }

    /**
     * Adds a collision box to the scene to visualize the collision
     * This is useful for debugging purposes to see where the collisions are happening
     * @param {THREE.Vector3} position - The position where the collision box should be added
     */
    addCollisionBox(position) {
        const box = new THREE.Mesh(collisionBoxGeometry, collisionBoxMaterial);
        box.position.copy(position);
        this.helpers.add(box); 
    }

    addContactPoint(position) {
        const contactPoint = new THREE.Mesh(contactGeometry, contactMaterial);
        contactPoint.position.copy(position);
        this.helpers.add(contactPoint);
    }



}