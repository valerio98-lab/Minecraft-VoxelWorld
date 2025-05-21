export const BLOCKS = {
    empty: {
        id: 0,
        name: 'Empty'
    },
    grass: {
        id: 1,
        name: 'Grass',
        color: 0x00ff00,
    },
    dirt: {
        id: 2,
        name: 'Dirt',
        color: 0x8B4513,
    },
    stone: {
        id: 3,
        name: 'Stone',
        color: 0x808080,
        scale: {
            x: 20,
            y: 20,
            z: 20,
        },
        scarcity: 0.5, // Scarcity of stone blocks
    },
    coalOre: {
        id: 4,
        name: 'Coal Ore',
        color: 0x333333,
        scale: {
            x: 20,
            y: 20,
            z: 20,
        },
        scarcity: 0.1, // Scarcity of coal ore blocks
    },
    ironOre: {
        id: 5,
        name: 'Iron Ore',
        color: 0xC0C0C0,
        scale: {
            x: 60,
            y: 60,
            z: 60,
        },
        scarcity: 0.05, // Scarcity of iron ore blocks
    },
}

export const resources = [
    BLOCKS.coalOre,
    BLOCKS.ironOre,
    BLOCKS.stone,
]