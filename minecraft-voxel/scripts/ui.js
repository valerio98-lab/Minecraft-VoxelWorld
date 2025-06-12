import {GUI} from 'three/addons/libs/lil-gui.module.min.js';
import { resources } from './block';


export function setupUI(world, player, physics, scene) {
    const gui = new GUI();

    const sceneFolder = gui.addFolder('Renderer');
    sceneFolder.add(scene.fog, 'near', 0, 100, 1).name('Fog Near'); 
    sceneFolder.add(scene.fog, 'far', 0, 200, 1).name('Fog Far');


    const playerFolder = gui.addFolder('Player');
    playerFolder.add(player, 'maxSpeed', 1, 20, 0.1).name('Max Speed');
    playerFolder.add(player, 'jumpSpeed', 1, 10, 0.1).name('Jump Speed');
    playerFolder.add(player.boundingCylinder, 'visible').name('Show Player Bounds');
    playerFolder.add(player.cameraHelper, 'visible').name('Show Camera Helper');


    const physicsFolder = gui.addFolder('Physics');
    physicsFolder.add(physics.helpers, 'visible').name('Visualize Collisions');
    physicsFolder.add(physics, 'simulationRate', 10, 1000).name('Sim Rate');


    const worldFolder = gui.addFolder('World');
    worldFolder.add(world.WorldChunkSize, 'width', 8, 128, 1).name('Width');
    worldFolder.add(world.WorldChunkSize, 'height', 8, 32, 1).name('Height');
    worldFolder.add(world, 'visibleDistance', 1, 10, 1).name('Visible Distance');
    worldFolder.add(world, 'asyncLoading').name('Async Loading');


    const terrainFolder = gui.addFolder('Terrain Parameters');
    terrainFolder.add(world.params.terrain, 'seed', 0, 10000, 1).name('Seed');
    terrainFolder.add(world.params.terrain, 'scale', 1, 100, 1).name('Scale');
    terrainFolder.add(world.params.terrain, 'magnitude', 0, 1, 0.01).name('Magnitude');
    terrainFolder.add(world.params.terrain, 'offset', 0, 1, 0.01).name('Offset');
    // terrainFolder.add(world.params.terrain, 'octaves', 1, 8, 1).name('Octaves');
    // terrainFolder.add(world.params.terrain, 'persistence', 0, 1, 0.01).name('Persistence');
    // terrainFolder.add(world.params.terrain, 'lacunarity', 1, 4, 0.01).name('Lacunarity');


    const biomesFolder = gui.addFolder('Biome Parameters');
    biomesFolder.add(world.params.biomes, 'scale', 1, 300, 1).name('Temperature Scale');
    biomesFolder.add(world.params.biomes.variation, 'amplitude', 0, 1, 1).name('Amplitude');
    biomesFolder.add(world.params.biomes.variation, 'scale', 0, 1, 1).name('Variation Scale');
    biomesFolder.add(world.params.biomes, 'Tundra2Temperate', 0.0, 1, 0.1).name('Tundra to Temperate');
    biomesFolder.add(world.params.biomes, 'Temperate2Forest', 0.0, 1, 0.1).name('Temperate to Forest');
    biomesFolder.add(world.params.biomes, 'Forest2Desert', 0.0, 1, 0.1).name('Forest to Desert');

    const treesFolder = gui.addFolder('Tree Parameters');
    treesFolder.add(world.params.trees, 'frequency', 0, 1, 0.007).name('Tree Density');
    treesFolder.add(world.params.trees.trunk, 'minHeight', 1, 10, 1).name('Min Height');
    treesFolder.add(world.params.trees.trunk, 'maxHeight', 1, 20, 1).name('Max Height');
    treesFolder.add(world.params.trees.canopy, 'minRadius', 0.1, 5, 0.1).name('Min Canopy Radius');
    treesFolder.add(world.params.trees.canopy, 'maxRadius', 0.1, 5, 0.1).name('Max Canopy Radius');
    treesFolder.add(world.params.trees.canopy, 'density', 0, 1, 0.01).name('Canopy Density');

    const cloudFolder = gui.addFolder('Cloud Parameters');
    cloudFolder.add(world.params.clouds, 'scale', 0, 100, 1).name('Cloud Scale');
    cloudFolder.add(world.params.clouds, 'density', 0, 1, 0.1).name('Cloud Density');

    const resourcesFolder = gui.addFolder('Resource Parameters');
    
    resources.forEach(resource =>{
        const resourceFolder = resourcesFolder.addFolder(resource.name);
        resourceFolder.add(resource, 'scarcity', 0, 1, 0.01).name('Scarcity');

        const scaleFolder = resourceFolder.addFolder('Scale');
        scaleFolder.add(resource.scale, 'x', 1, 100, 1).name('Scale X');
        scaleFolder.add(resource.scale, 'y', 1, 100, 1).name('Scale Y');
        scaleFolder.add(resource.scale, 'z', 1, 100, 1).name('Scale Z');
    })

    gui.onChange(() => {
        world.generate(true);
    });
}

