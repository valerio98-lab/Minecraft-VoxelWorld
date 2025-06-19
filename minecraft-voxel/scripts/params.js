
export class Parameters {
    constructor() {
        this.params = {
            terrain: {
                seed: 0,
                scale: 50,           // scala base per l’ottava 0
                magnitude: 0.2,      // ampiezza complessiva (verrà applicata dopo)
                offset: 0.2,         // spostamento (così non avremo mai height = 0)
                //octaves: 4,          // numero di ottave
                //persistence: 0.9,    // di quanto diminuisce ampiezza da un’ottava alla successiva
                //lacunarity: 2.0      // di quanto aumenta frequenza da un’ottava alla successiva
                },
                biomes:{
                scale:12,
                variation:{
                    amplitude:0.2,
                    scale:30
                },
                Tundra2Temperate: 0.25,
                Temperate2Forest: 0.5,
                Forest2Desert: 0.75,
                },
                trees:{
                    trunk: {
                        minHeight: 4, // altezza minima del tronco
                        maxHeight: 10, // altezza massima del tronco
                    },
                    canopy: {
                        minRadius: 1, // raggio minimo della chioma
                        maxRadius: 10, // raggio massimo della chioma
                        density: 0.6, // densità della chioma (percentuale di blocchi foglia)
                        transparentRatio: 0.4, // rapporto di trasparenza della chioma (percentuale di blocchi foglia trasparenti)
                    }, 
                    frequency: 0.003, // frequenza di generazione degli alberi
                }, 
                clouds: {
                    scale: 30,
                    density: 0.3,
                    layers: 2
                    
                }, 
                water: {
                    waterOffset: 4,
                    waterPlane: true,
                }

        }
    }

    /**
     * return the parameters of a specific group by name. 
     * @param {*} name 
     * @returns {Dict Object} - The parameters of the specified group.
     */
    get_params(name) {
        return this.params[name];
    }

    /**
     * set the value of a specific parameter group.
     * @param {*} name - The name of the parameter group.
     * @param {*} value - The value to set for the parameter group.
     * @returns {void}
     */

    set_params(name, value) {
        this.params[name] = value;
    }

    /**
     * get the value of a specific subfield in a group of parameters.
     * @param {*} name - The name of the parameter group.
     * @param {*} subfield - The specific subfield within the parameter group.  
     * @return {*} - The value of the specified subfield, or null if not found.
     */

    get_subfield(name, subfield) {
        //se subfield arriva come lista applico in sequenza
        if (Array.isArray(subfield)) {
            try{
                let param = this.params[name][subfield[0]][subfield[1]];
                return param;
            } catch{
                try {
                    let param = this.params[name][subfield[1]][subfield[0]];
                    return param;
                } catch {
                    console.warn(`Subfield ${subfield} not found in parameters for ${name}`);
                    return null; // or throw an error if preferred
                }
            }
        }
        else if (this.params[name] && this.params[name][subfield] !== undefined) {
            return this.params[name][subfield];
        } else {
            console.warn(`Subfield ${subfield} not found in parameters for ${name}`);
            return null; // or throw an error if preferred
        }
    }

    /**
     * set the value of a specific subfield in a group of parameters.
     * @param {*} name - The name of the parameter group.
     * @param {*} subfield - The specific subfield within the parameter group.
     * @returns {*} - The value of the specified subfield.
     */
    set_subfield(name, subfield, value) {
        this.params[name][subfield] = value;
    }

}