import * as THREE from 'three';

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshLambertMaterial({ color: 0x00d000 });

export class World extends THREE.Group{
    constructor(size={width: 64, height: 16}) {
        super();
        this.size = size;
    }
    /**
     * Generates a 3D grid of blocks in the world.
     * Each block is a cube with a size of 1x1x1.
     * The blocks are positioned based on their x, y, and z coordinates.
     */
    generate(){
        const max_count = this.size.width * this.size.width * this.size.height;
        const mesh = new THREE.InstancedMesh(geometry, material, max_count);
        mesh.count = 0;

        const matrix = new THREE.Matrix4();
        for (let x = 0; x < this.size.width; x++) {
            for (let y = 0; y < this.size.height; y++) {
                for (let z = 0; z < this.size.width; z++) {
                    matrix.setPosition(x+0.5, y+0.5, z+0.5);
                    mesh.setMatrixAt(mesh.count, matrix); //?? come stiamo aggiungendo gli eleementi alla matrice?
                    mesh.setColorAt(mesh.count, new THREE.Color(Math.random(), Math.random(), Math.random()));
                    mesh.count++;
                }
            }
        }
        this.add(mesh);
    }
}