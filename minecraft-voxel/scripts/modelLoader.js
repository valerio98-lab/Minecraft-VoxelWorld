import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class ModelLoader {
  loader = new GLTFLoader();
  models = {
    pickaxe: null,
  };

  loadModels(onLoad) {
    // compone l’URL in modo agnostico (dev e produzione)
    const pickaxeUrl = `${import.meta.env.BASE_URL}models/minecraft_diamond-pickaxe.glb`;

    this.loader.load(
      pickaxeUrl,
      (gltf) => {
        console.log('Model loaded:', gltf);
        this.models.pickaxe = gltf.scene;
        onLoad(this.models);
      },
      undefined,
      (err) => console.error('Errore nel caricamento:', err)
    );
  }
}
