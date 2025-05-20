import {GUI} from 'three/addons/libs/lil-gui.module.min.js';


export function createUI(world) {
    const gui = new GUI();

    gui.add(world.size, 'width', 8, 128, 1).name('World Width')
    gui.add(world.size, 'height', 8, 64, 1).name('World Height')

    const terrainFolder = gui.addFolder('Terrain Parameters');
    terrainFolder.add(world.params.terrain, 'seed', 0, 10000, 1).name('Seed');
    terrainFolder.add(world.params.terrain, 'scale', 1, 100, 1).name('Scale');
    terrainFolder.add(world.params.terrain, 'magnitude', 0, 1, 0.01).name('Magnitude');
    terrainFolder.add(world.params.terrain, 'offset', 0, 1, 0.01).name('Offset');
    terrainFolder.add(world.params.terrain, 'octaves', 1, 8, 1).name('Octaves');
    terrainFolder.add(world.params.terrain, 'persistence', 0, 1, 0.01).name('Persistence');
    terrainFolder.add(world.params.terrain, 'lacunarity', 1, 4, 0.01).name('Lacunarity');
    
    gui.onChange(() => {
        world.generate();
    });
}