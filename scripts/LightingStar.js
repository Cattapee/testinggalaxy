import * as THREE from "three";
import { BLOOM_LAYER, STAR_MAX, STAR_MIN } from "../config/renderConfig.js";
import { starTypes } from "../config/starDis.js";
import { clamp, gaussianRandom } from "./utils.js";
import { config } from "../config/galaxyConfig.js";

export class LightingStar {
  constructor(position, region = 'arms') {
    this.position = position;
    this.region = region;
    this.starType = this.generateStarType();
    this.sizeFactor = gaussianRandom(1, config.STAR_SIZE_VARIANCE);
    this.obj = null;
  }

  generateStarType() {
    let pct = [...starTypes.percentage];
    if (this.region === 'core' || this.region === 'bar') {
      pct = pct.map((p, i) => p * (i < pct.length / 2 ? 1.5 : 0.5));
      let sum = pct.reduce((a, b) => a + b, 0);
      pct = pct.map(p => p / sum * 100);
    } else if (this.region === 'halo') {
      pct = pct.map((p, i) => p * (i > pct.length / 2 ? 1.5 : 0.5));
      let sum = pct.reduce((a, b) => a + b, 0);
      pct = pct.map(p => p / sum * 100);
    }
    let num = Math.random() * 100;
    for (let i = 0; i < pct.length; i++) {
      num -= pct[i];
      if (num < 0) {
        return i;
      }
    }
    return 0;
  }

  updateScale(camera) {
    const camPos = camera.position;
    const dist = this.position.distanceTo(camPos) / 250;
    let starSize = dist * starTypes.size[this.starType] * this.sizeFactor;
    starSize = clamp(starSize, STAR_MIN, STAR_MAX);
    this.obj.scale.setScalar(starSize);
  }

  toThreeObject(scene) {
    // Create sphere geometry for the star
    const geometry = new THREE.SphereGeometry(.5, 7, 7); // size can be adjusted dynamically

    // Create a lighting-aware material with color based on starType
    const material = new THREE.MeshStandardMaterial({
    color: starTypes.color[this.starType],
    //color: 0xff00ff,
    emissive: 0x000000,   // no emissive light by default; adjust if you want glow
    roughness: 0.2,
    metalness: 0.0,
    emissiveIntensity: 1.0,
    });

    // Create mesh and set position
    const starMesh = new THREE.Mesh(geometry, material);
    starMesh.position.copy(this.position);

    // Scale based on star size and size factor
    const scale = starTypes.size[this.starType] * this.sizeFactor;
    starMesh.scale.set(scale, scale, scale);

    // Optionally assign to bloom layer if you want bloom glow
    //starMesh.layers.set(BLOOM_LAYER);

    this.obj = starMesh;

    scene.add(starMesh);

    // RectAreaLightUniformsLib.init();
    // light = new THREE.RectAreaLight(0xffffff, 1.0, 2, 2);
    // light.lookat(0,0,0);
    // scene.add(light);
  }
}