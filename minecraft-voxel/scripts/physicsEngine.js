import * as THREE from 'three';
import { BLOCKS } from './block';
import { Parameters} from './params';
import {AABB} from './AABB';


export class PhysicsEngine {
    gravity = 32;
    simulationRate = 250;
    timestep = 1 / this.simulationRate; // Time step for the physics simulation, in seconds
    accumulator = 0;

    constructor(scene) {
        this.aabb = new AABB(scene); // Initialize the AABB for collision detection
        this.params = new Parameters();
        this.waterPlane = this.params.get_subfield('water', 'waterPlane'); // Check if water plane is enabled
        this.helpers = this.aabb.helpers; // Use the AABB helpers for visualization
    }


    update(dt, player, world){
        this.accumulator += dt;
    
        // Calcolo qui una sola volta il waterLevel
        const waterLevel  = this.params.get_subfield('water', 'waterOffset') + 0.4;
        player.inWater = player.position.y - (player.height / 2) < waterLevel; 

        while (this.accumulator >= this.timestep) {
            this.applyGroundDrag(this.timestep, player); // Update the player's position based on input and velocity
            player.velocity.y -= this.gravity * this.timestep; // Apply gravity to the player's vertical velocity

            // If the player is in water, apply flotation and water drag
            const block = world.getBlock(
                Math.floor(player.position.x), 
                Math.floor(player.position.y - (player.height / 2)), 
                Math.floor(player.position.z));

            const inWater = (block && block.id === BLOCKS.water.id);
            if (!this.waterPlane && inWater) {
                this.applyFlotation(player, waterLevel); 
                this.applyWaterDrag(player, waterLevel); 
            }
            else if (this.waterPlane) {
                this.applyFlotation(player, waterLevel); 
                this.applyWaterDrag(player, waterLevel); 
            }

            player.applyMotion(this.timestep); // Apply the player's motion based on the updated velocity

            this.aabb.detectCollisions(player, world); // Detect collisions with the world
            this.accumulator -= this.timestep; // Reduce the accumulator by the time step
        }
        player.updateBoundingCylinder(); // Update the player's bounding cylinder position
    }

      /**
     * @param {Number} dt 
     */
    applyGroundDrag(dt, player) {
        if (!player.controls.isLocked) return; 
        const FRICTION_GROUND = 2.0;   // forza con i piedi a terra
        const FRICTION_AIR =  1.5;   // piccolo freno in aria
        const accelRate = 15;     
        const fric = player.onGround ? FRICTION_GROUND : FRICTION_AIR;


        const f = Math.max(0, 1 - fric * dt);
        player.velocity.x *= f;
        player.velocity.z *= f;

        const wishDir = new THREE.Vector3(player.input.x, 0, player.input.z);
        wishDir.normalize();
        const wishVel = wishDir.clone().multiplyScalar(player.maxSpeed);


        const currentVel = new THREE.Vector3(player.velocity.x, 0, player.velocity.z);

        
        const delta = wishVel.clone().sub(currentVel);     
        const accelStep = accelRate * dt;

        if (delta.lengthSq() > accelStep * accelStep) {
        delta.normalize().multiplyScalar(accelStep);
        }
        player.velocity.x += delta.x;
        player.velocity.z += delta.z;

        // document.getElementById('info-player-position').innerHTML = this.toString();
    }

    applyFlotation(player, waterLevel) {
        const bottomY = player.position.y - (player.height/2);
        const wave = 0.15 * Math.sin(performance.now() * 0.001);
        const depthError = (waterLevel+wave) - bottomY+0.8; 
        if (depthError <= 0) return; 

        const k = 30;  
        const c = 0.5; // Damping coefficient

        const acc = k * depthError - c * player.velocity.y; //Hooke - Damping force

        player.velocity.y += acc * this.timestep; // Apply buoyancy force to the player's vertical velocity

    }

    applyWaterDrag(player, waterLevel) {
        const bottomY    = player.position.y - player.height / 2;

        if (bottomY >= waterLevel) return;

        const dragCoeff = 8.0;
        const f = 1 - dragCoeff * this.timestep; 
        
        player.velocity.multiplyScalar(f); // smorza X, Y, Z
    }



}