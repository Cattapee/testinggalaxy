import * as THREE from "three";
import { BLOOM_LAYER, STAR_MAX, STAR_MIN } from "../config/renderConfig.js";
import { starTypes } from "../config/starDis.js";
import { clamp, gaussianRandom } from "./utils.js";
import { config } from "../config/galaxyConfig.js";

const texture = new THREE.TextureLoader().load('./resources/sprite120.png');
const material = new THREE.SpriteMaterial({ map: texture, color: "#fff" });
const materials = starTypes.color.map(
  (color) => new THREE.SpriteMaterial({ map: texture, color: color })
);

// In star.js, after defining materials:
export { materials };

export class Star {
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
    let dist = this.position.distanceTo(camera.position) / 250;
    let starSize = dist * starTypes.size[this.starType] * this.sizeFactor;
    starSize = clamp(starSize, STAR_MIN, STAR_MAX);
    this.obj.scale.copy(new THREE.Vector3(starSize, starSize, starSize));
  }

  toThreeObject(scene) {
    let star = new THREE.Sprite(materials[this.starType]);
    star.layers.set(BLOOM_LAYER);
    star.scale.multiplyScalar(starTypes.size[this.starType] * this.sizeFactor);
    star.position.copy(this.position);

    this.obj = star;

    scene.add(star);
  }
}