import {
  BASE_LAYER,
  HAZE_MAX,
  HAZE_MIN,
  HAZE_OPACITY,
} from "./config/renderConfig.js";
import { clamp } from "./utils.js";
import * as THREE from "three";
import { config } from "./config/galaxyConfig.js";

export class LightingNebula {
  constructor(position, region = 'arms') {
    this.position = position;
    this.region = region;
    this.obj = null;
  }

  updateScale(camera) {
    let dist = this.position.distanceTo(camera.position) / 250;
    if (this.obj && this.obj.material) {
      this.obj.material.opacity = clamp(
        0.5 * Math.pow(dist / 5, 2),
        0,
        0.5
      );
    }
  }

  toThreeObject(scene) {
    // Sphere geometry instead of sprite
    const geometry = new THREE.SphereGeometry(0.5, 5, 5);

    // Non-emissive material — reacts to real lights
    const material = new THREE.MeshStandardMaterial({
      color: this.region === 'arms' ? 0x0000ff : 0xff00ff,
      transparent: true,
      opacity: 0.5,
      roughness: 0.2,
      metalness: 0.0,
      emissiveIntensity: 1.0,
    });

    const nebula = new THREE.Mesh(geometry, material);
    nebula.layers.set(BASE_LAYER);
    nebula.position.copy(this.position);

    // Match your config scaling
    const scaleVal = clamp(
      Math.random() * (config.NEBULA_SCALE_MAX - config.NEBULA_SCALE_MIN) + config.NEBULA_SCALE_MIN,
      config.NEBULA_SCALE_MIN,
      config.NEBULA_SCALE_MAX
    );
    nebula.scale.setScalar(scaleVal);

    this.obj = nebula;
    scene.add(nebula);
  }
}
