import * as THREE from 'three';


const collisionBoxMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    transparent: true,
    opacity: 0.2
});

const collisionBoxGeometry = new THREE.BoxGeometry(1.001, 1.001, 1.001); // Slightly larger than the player to visualize collisions

export class Physics {
    constructor(scene, player) {
        this.helpers = new THREE.Group();  
        scene.add(this.helpers); 
    }


    update(dt, player, world){
        this.detectCollisions(player, world);
    }

    detectCollisions(player, world){
        const possibleCollisions = this.BroadPhase(player, world); 
        console.log("Possible Collisions:", possibleCollisions.length);
        const collisions = this.NarrowPhase(player, possibleCollisions);

        if (collisions.length > 0) {
                this.resolveCollisions(collisions);
        }
    }

    BroadPhase(player, world) {
        // Implement broad phase collision detection logic
        // This could be a simple bounding box check or spatial partitioning
        this.removeCollisionBoxes(); // Clear previous collision boxes

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
                    const block = world.getBlock(x, y, z);
                    if (block!==undefined && block.id !== 0) { 
                        console.log("Possible Collision at:", x, y, z);
                        possibleCollisions.push(x, y, z);
                        // if the collision box is already added, skip adding it again
                        const existingBox = this.helpers.children.find(box => 
                            box.position.x === x && 
                            box.position.y === y && 
                            box.position.z === z
                        );
                        if (!existingBox) {
                            // Add a collision box to visualize the collision
                            this.addCollisionBox(new THREE.Vector3(x, y, z));
                        }

                        // check if the block in addCollisionBox are still in collision
                        
                    }
                }
            }
        }

        return possibleCollisions;
    }

    NarrowPhase(player, possibleCollisions) {
        //TODO
        return [];
    }

    resolveCollisions(collisions) {
        //TODO
        // This method should handle the actual collision resolution logic
        // For example, adjusting the player's position or velocity based on the collision normals
    }

    addCollisionBox(position) {
        const box = new THREE.Mesh(collisionBoxGeometry, collisionBoxMaterial);
        box.position.copy(position);
        this.helpers.add(box); 
    }
    /**
     * Removes all collision boxes from the scene from the previous frame
     * This is necessary to avoid cluttering the scene with old collision boxes
     */
    removeCollisionBoxes() {
        this.helpers.children.forEach(box => {
            this.helpers.remove(box);
            box.geometry.dispose();
            box.material.dispose();
        });
        this.helpers.clear(); // Clear the group to remove all children
    }


}