import * as THREE from 'three';
import { makeNoise2D } from 'open-simplex-noise';
import { BLOCKS } from './block';

export class BiomeManager {
  /**
   * @param {number} seed   
   * @param {number} scale  
   */
  constructor(seed, scale = 1024) {
    // due rumori diversi ottenuti con seed “rotato”
    this.noiseTemp = makeNoise2D(seed);
    this.noiseHum  = makeNoise2D(seed ^ 0xA5A5A5);
    this.scale     = scale;
  }
    sampleClimate(worldX, worldZ, maxT=50, minT=-20, maxH=90, minH=5) {
        const nx = worldX / this.scale;
        const nz = worldZ / this.scale;

        let temperature = (this.noiseTemp(nx, nz)+1)*0.5;   // Random temperature between min and max
        let humidity = (this.noiseHum(nx, nz)+1)*0.5;     // Random humidity between min and max

        temperature = Math.round(minT + (maxT - minT) * temperature); // Scale to [minT, maxT]
        humidity = Math.round(minH + (maxH - minH) * humidity); // Scale to [minH, maxH]

        let treeDensity = Math.max(0, Math.min(1, ((humidity - 20) / 90)**2)) 
        treeDensity = 0.00007 + treeDensity * (0.08 - 0.00007); // Scale to [0.001, 0.04]

        document.getElementById('temp').innerText = `Temperature: ${temperature}°C, Humidity: ${humidity}%`;
        return { temperature, humidity, treeDensity};

    }


    getBiome(temperature, humidity){
        if (temperature < 0) {
            return 'tundra';
        }
        else if (temperature >= 0 && temperature < 10){
            if (humidity < 40) {
                return 'tundra2forest'; 
            }
            else if (humidity >= 40) {
                return 'forest';
            }
        }
        else if (temperature >= 10 && temperature < 22){
            return 'forest';
        }
        else if (temperature >= 22 && temperature < 30){
            if (humidity >= 50) {
                return 'forest';
            }
            else if (humidity < 50) {
                return 'forest2desert';
            }
        }
        else if (temperature >= 30){
            if(humidity <= 45) {
                return 'desert';
            }
            return 'forest2desert';
        }
    }

    getBlockIDPerBiome(biome) {
        switch (biome) {
            case 'tundra':
                return [BLOCKS.snow.id, BLOCKS.ice.id]; // Snow
            case 'tundra2forest':
                return [BLOCKS.snow.id, BLOCKS.grass.id];
            case 'forest':
                return [BLOCKS.grass.id];
            case 'forest2desert':
                return [BLOCKS.grass.id, BLOCKS.sand.id]; 
            case 'desert':
                return [BLOCKS.sand.id]; // Sand
            default:
                return [BLOCKS.grass.id]; 
        }
    }
}