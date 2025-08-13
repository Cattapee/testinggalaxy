import * as THREE from "three";
import { Star } from "./star.js";
import { config } from "../config/galaxyConfig.js";
import { gaussianRandom, spiral } from "./utils.js";
import { Haze } from "./haze.js";
import { Nebula } from "./nebula.js";

//galaxy class
export class Galaxy {
  constructor(scene, arrayData = null) {
    this.scene = scene;
    this.arrayData = arrayData; // Store 2D array data if provided
    this.stars = this.arrayData ? this.generateStarsFromArray() : this.generateStars();
    this.haze = this.arrayData ? this.generateHazeFromArray() : this.generateHaze();
    this.nebulae = this.arrayData ? this.generateNebulaeFromArray() : this.generateNebulae();
    this.stars.forEach((star) => star.toThreeObject(scene));
    this.haze.forEach((haze) => haze.toThreeObject(scene));
    this.nebulae.forEach((nebula) => nebula.toThreeObject(scene));
  }
  updateScale(camera) {
    this.stars.forEach((star) => {
      star.updateScale(camera);
    });

    this.haze.forEach((haze) => {
      haze.updateScale(camera);
    });

    this.nebulae.forEach((nebula) => {
      nebula.updateScale(camera);
    });
  }
  regenerate(arrayData = null) {
    this.stars.forEach((star) => this.scene.remove(star.obj));
    this.haze.forEach((haze) => this.scene.remove(haze.obj));
    this.nebulae.forEach((nebula) => this.scene.remove(nebula.obj));
    this.arrayData = arrayData || this.arrayData; // Update array data if provided
    this.stars = this.arrayData ? this.generateStarsFromArray() : this.generateStars();
    this.haze = this.arrayData ? this.generateHazeFromArray() : this.generateHaze();
    this.nebulae = this.arrayData ? this.generateNebulaeFromArray() : this.generateNebulae();
    this.stars.forEach((star) => star.toThreeObject(this.scene));
    this.haze.forEach((haze) => haze.toThreeObject(this.scene));
    this.nebulae.forEach((nebula) => nebula.toThreeObject(this.scene));
  }

  rotate(deltaTime) {
  // Use deltaTime for frame-rate independent rotation
  const v0 = config.ROTATION_VELOCITY; // Flat rotation velocity (~200 km/s scaled)
  const r0 = config.BULGE_RADIUS; // Core radius (~3 kpc)
  const rMax = config.HALO_RADIUS; // Max radius for Keplerian decline

  // Helper function to calculate angular velocity based on radius
  const getAngularVelocity = (r) => {
    if (r < r0) {
      // Linear increase in core (solid-body rotation)
      return (v0 / r0) * (r / r0); // Scale velocity linearly in core
    } else if (r < rMax) {
      // Flat rotation curve in disk
      return v0 / r;
    } else {
      // Keplerian decline in halo (v ~ 1/sqrt(r))
      return (v0 / rMax) * Math.sqrt(rMax / r);
    }
  };

   this.stars.forEach(star => {
    const r = Math.sqrt(star.position.x ** 2 + star.position.y ** 2);
    const omega = getAngularVelocity(r) * deltaTime;
    const cos = Math.cos(omega);
    const sin = Math.sin(omega);
    const x = star.position.x;
    const y = star.position.y;
    star.position.x = x * cos - y * sin;
    star.position.y = x * sin + y * cos;
    star.obj.position.copy(star.position);
  }); 

   this.haze.forEach(haze => {
    const r = Math.sqrt(haze.position.x ** 2 + haze.position.y ** 2);
    const omega = getAngularVelocity(r) * deltaTime;
    const cos = Math.cos(omega);
    const sin = Math.sin(omega);
    const x = haze.position.x;
    const y = haze.position.y;
    haze.position.x = x * cos - y * sin;
    haze.position.y = x * sin + y * cos;
    haze.obj.position.copy(haze.position);
  }); 

   this.nebulae.forEach(nebula => {
    const r = Math.sqrt(nebula.position.x ** 2 + nebula.position.y ** 2);
    const omega = getAngularVelocity(r) * deltaTime;
    const cos = Math.cos(omega);
    const sin = Math.sin(omega);
    const x = nebula.position.x;
    const y = nebula.position.y;
    nebula.position.x = x * cos - y * sin;
    nebula.position.y = x * sin + y * cos;
    nebula.sprites.forEach(sprite => {
      // Rotate each sprite's position individually
      const spriteX = sprite.position.x;
      const spriteY = sprite.position.y;
      sprite.position.x = spriteX * cos - spriteY * sin;
      sprite.position.y = spriteX * sin + spriteY * cos;
    }); 
  });
}

  generateStars() {
    let stars = [];
    const diskStars = config.NUM_STARS * (1 - config.HALO_DENSITY);

    for (let i = 0; i < diskStars / 4; i++) {
      let pos = new THREE.Vector3(
        gaussianRandom(0, config.CORE_X_DIST),
        gaussianRandom(0, config.CORE_Y_DIST),
        gaussianRandom(0, config.GALAXY_THICKNESS)
      );
      let star = new Star(pos, 'core');
      stars.push(star);
    }

    for (let i = 0; i < diskStars / 4; i++) {
      let pos = new THREE.Vector3(
        gaussianRandom(0, config.OUTER_CORE_X_DIST),
        gaussianRandom(0, config.OUTER_CORE_Y_DIST),
        gaussianRandom(0, config.GALAXY_THICKNESS)
      );
      let star = new Star(pos, 'core');
      stars.push(star);
    }

    // Central bar
    for (let i = 0; i < diskStars / 4; i++) {
      let pos = new THREE.Vector3(
        gaussianRandom(0, config.BAR_LENGTH),
        gaussianRandom(0, config.BAR_WIDTH),
        gaussianRandom(0, config.GALAXY_THICKNESS)
      );
      let star = new Star(pos, 'bar');
      stars.push(star);
    }

    for (let j = 0; j < config.ARMS; j++) {
      for (let i = 0; i < diskStars / 4 / config.ARMS; i++) {
        let pos = spiral(
          gaussianRandom(config.ARM_X_MEAN, config.ARM_X_DIST),
          gaussianRandom(config.ARM_Y_MEAN, config.ARM_Y_DIST),
          gaussianRandom(0, config.GALAXY_THICKNESS),
          (j * 2 * Math.PI) / config.ARMS,
          config.ARM_PITCH
        );
        let star = new Star(pos, 'arms');
        stars.push(star);
      }
    }

    // Stellar halo
    for (let i = 0; i < config.NUM_STARS * config.HALO_DENSITY; i++) {
      let u = Math.random();
      let r = Math.pow(u, 1/3) * config.HALO_RADIUS;
      let theta = Math.random() * 2 * Math.PI;
      let phi = Math.acos(2 * Math.random() - 1);
      let pos = new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
      let star = new Star(pos, 'halo');
      stars.push(star);
    }

    return stars;
  }




  generateHaze() {
    let haze = [];
    const diskStars = config.NUM_STARS * (1 - config.HALO_DENSITY);

    for (let i = 0; i < diskStars / 4; i++) {
      let pos = new THREE.Vector3(
        gaussianRandom(0, config.CORE_X_DIST),
        gaussianRandom(0, config.CORE_Y_DIST),
        gaussianRandom(0, config.GALAXY_THICKNESS)
      );
      let h = new Haze(pos, 'core');
      haze.push(h);
    }

    for (let i = 0; i < diskStars / 4; i++) {
      let pos = new THREE.Vector3(
        gaussianRandom(0, config.OUTER_CORE_X_DIST),
        gaussianRandom(0, config.OUTER_CORE_Y_DIST),
        gaussianRandom(0, config.GALAXY_THICKNESS)
      );
      let h = new Haze(pos, 'core');
      haze.push(h);
    }

    // Central bar
    for (let i = 0; i < diskStars / 4; i++) {
      let pos = new THREE.Vector3(
        gaussianRandom(0, config.BAR_LENGTH),
        gaussianRandom(0, config.BAR_WIDTH),
        gaussianRandom(0, config.GALAXY_THICKNESS)
      );
      let h = new Haze(pos, 'bar');
      haze.push(h);
    }

    for (let j = 0; j < config.ARMS; j++) {
      for (let i = 0; i < diskStars / 4 / config.ARMS; i++) {
        let pos = spiral(
          gaussianRandom(config.ARM_X_MEAN, config.ARM_X_DIST),
          gaussianRandom(config.ARM_Y_MEAN, config.ARM_Y_DIST),
          gaussianRandom(0, config.GALAXY_THICKNESS),
          (j * 2 * Math.PI) / config.ARMS,
          config.ARM_PITCH
        );
        let h = new Haze(pos, 'arms');
        haze.push(h);
      }
    }

    // Stellar halo
    for (let i = 0; i < config.NUM_STARS * config.HALO_DENSITY; i++) {
      let u = Math.random();
      let r = Math.pow(u, 1/3) * config.HALO_RADIUS;
      let theta = Math.random() * 2 * Math.PI;
      let phi = Math.acos(2 * Math.random() - 1);
      let pos = new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
      let h = new Haze(pos, 'halo');
      haze.push(h);
    }

    return haze;
  }
  generateNebulae() {
    let nebulae = [];
    const numNebulae = Math.floor(config.NUM_STARS * config.NEBULA_DENSITY);

    // Core nebulae
    for (let i = 0; i < numNebulae / 4; i++) {
      let pos = new THREE.Vector3(
        gaussianRandom(0, config.CORE_X_DIST * 1.5),
        gaussianRandom(0, config.CORE_Y_DIST * 1.5),
        gaussianRandom(0, config.GALAXY_THICKNESS * 2)
      );
      let nebula = new Nebula(pos, 'core');
      nebulae.push(nebula);
    }

    // Outer core
    for (let i = 0; i < numNebulae / 4; i++) {
      let pos = new THREE.Vector3(
        gaussianRandom(0, config.OUTER_CORE_X_DIST * 1.5),
        gaussianRandom(0, config.OUTER_CORE_Y_DIST * 1.5),
        gaussianRandom(0, config.GALAXY_THICKNESS * 2)
      );
      let nebula = new Nebula(pos, 'core');
      nebulae.push(nebula);
    }

    // Arms
    for (let j = 0; j < config.ARMS; j++) {
      for (let i = 0; i < (numNebulae / 2) / config.ARMS; i++) {
        let pos = spiral(
          gaussianRandom(config.ARM_X_MEAN, config.ARM_X_DIST * 1.2),
          gaussianRandom(config.ARM_Y_MEAN, config.ARM_Y_DIST * 1.2),
          gaussianRandom(0, config.GALAXY_THICKNESS * 2),
          (j * 2 * Math.PI) / config.ARMS,
          config.ARM_PITCH
        );
        let nebula = new Nebula(pos, 'arms');
        nebulae.push(nebula);
      }
    }

    return nebulae;
  }
  generateStarsFromArray() {
    let stars = [];
    const { data, width, height } = this.arrayData;
    const diskStars = config.NUM_STARS * (1 - config.HALO_DENSITY);
    const scaleX = (config.OUTER_CORE_X_DIST * 2) / width;
    const scaleY = (config.OUTER_CORE_Y_DIST * 2) / height;

    // Core and bar regions
    for (let i = 0; i < diskStars; i++) {
      let x, y, intensity;
      do {
        x = Math.floor(Math.random() * width);
        y = Math.floor(Math.random() * height);
        intensity = data[y][x]; // 0 to 1
      } while (Math.random() > intensity); // Reject if random > intensity

      let pos = new THREE.Vector3(
        (x - width / 2) * scaleX,
        (y - height / 2) * scaleY,
        gaussianRandom(0, config.GALAXY_THICKNESS)
      );
      let region = this.determineRegion(pos);
      let star = new Star(pos, region);
      stars.push(star);
    }

    // Stellar halo (unchanged, as array-based generation focuses on disk)
    for (let i = 0; i < config.NUM_STARS * config.HALO_DENSITY; i++) {
      let u = Math.random();
      let r = Math.pow(u, 1/3) * config.HALO_RADIUS;
      let theta = Math.random() * 2 * Math.PI;
      let phi = Math.acos(2 * Math.random() - 1);
      let pos = new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
      let star = new Star(pos, 'halo');
      stars.push(star);
    }

    return stars;
  }
  generateHazeFromArray() {
    let haze = [];
    const { data, width, height } = this.arrayData;
    const diskStars = config.NUM_STARS * (1 - config.HALO_DENSITY);
    const scaleX = (config.OUTER_CORE_X_DIST * 2) / width;
    const scaleY = (config.OUTER_CORE_Y_DIST * 2) / height;

    for (let i = 0; i < diskStars; i++) {
      let x, y, intensity;
      do {
        x = Math.floor(Math.random() * width);
        y = Math.floor(Math.random() * height);
        intensity = data[y][x];
      } while (Math.random() > intensity);

      let pos = new THREE.Vector3(
        (x - width / 2) * scaleX,
        (y - height / 2) * scaleY,
        gaussianRandom(0, config.GALAXY_THICKNESS)
      );
      let region = this.determineRegion(pos);
      let h = new Haze(pos, region);
      haze.push(h);
    }

    // Stellar halo
    for (let i = 0; i < config.NUM_STARS * config.HALO_DENSITY; i++) {
      let u = Math.random();
      let r = Math.pow(u, 1/3) * config.HALO_RADIUS;
      let theta = Math.random() * 2 * Math.PI;
      let phi = Math.acos(2 * Math.random() - 1);
      let pos = new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
      let h = new Haze(pos, 'halo');
      haze.push(h);
    }

    return haze;
  }
  generateNebulaeFromArray() {
    let nebulae = [];
    const { data, width, height } = this.arrayData;
    const numNebulae = Math.floor(config.NUM_STARS * config.NEBULA_DENSITY);
    const scaleX = (config.OUTER_CORE_X_DIST * 1.5 * 2) / width;
    const scaleY = (config.OUTER_CORE_Y_DIST * 1.5 * 2) / height;

    for (let i = 0; i < numNebulae; i++) {
      let x, y, intensity;
      do {
        x = Math.floor(Math.random() * width);
        y = Math.floor(Math.random() * height);
        intensity = data[y][x];
      } while (Math.random() > intensity);

      let pos = new THREE.Vector3(
        (x - width / 2) * scaleX,
        (y - height / 2) * scaleY,
        gaussianRandom(0, config.GALAXY_THICKNESS * 2)
      );
      let region = this.determineRegion(pos);
      let nebula = new Nebula(pos, region);
      nebulae.push(nebula);
    }

    return nebulae;
  }
  determineRegion(pos) {
    const dist = Math.sqrt(pos.x * pos.x + pos.y * pos.y);
    if (dist < config.CORE_X_DIST || dist < config.CORE_Y_DIST) return 'core';
    if (dist < config.OUTER_CORE_X_DIST || dist < config.OUTER_CORE_Y_DIST) return 'core';
    if (Math.abs(pos.x) < config.BAR_LENGTH && Math.abs(pos.y) < config.BAR_WIDTH) return 'bar';
    return 'arms'; // Default to arms for spiral structure
  }
}
