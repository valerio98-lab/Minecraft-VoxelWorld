import * as THREE from 'three';


export class Tool extends THREE.Group {
    animate = false;
    amplitude = 0.5;
    duration = 300;
    //start time of the animation
    animationStart = 0;
    //Speed of the animation
    animationSpeed = 0.025; 
    //Current animation active
    animation = undefined;
    //Mesh of the tool
    toolMesh = undefined;

    get animationTime() {
        return performance.now() - this.animationStart;
    }

    startAnimation() {
        if (this.animate) return;
        console.log('Starting tool animation');
        this.animate = true;
        this.animationStart = performance.now();
        clearTimeout(this.animation);
        this.animation = setTimeout(() => {
            this.animate = false;
            this.toolMesh.rotation.y = 0; // Reset rotation after animation
        }, this.duration);
        }

    update() {
        if (this.animate && this.toolMesh) {
            console.log('Updating tool animation');
            this.toolMesh.rotation.y = this.amplitude * Math.sin(this.animationTime * this.animationSpeed);
        }
    }

    setMesh(mesh){
        this.clear();

        this.toolMesh = mesh;
        this.add(this.toolMesh);
        mesh.receiveShadow = true;
        mesh.castShadow = true;


        this.position.set(0.0, -0.4, -0.5);
        this.scale.set(0.03, 0.03, 0.03);
        this.rotation.z = Math.PI/2; // Rotate the tool to face the player
        this.rotation.x = (-Math.PI / 2); // Adjust rotation to align with the player's view
        this.rotation.y = Math.PI + 0.2; // Adjust rotation to align with the player's view
    }

}