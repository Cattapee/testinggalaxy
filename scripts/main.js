import * as THREE from "three";

// Data and visualization
import { CompositionShader } from "../shaders/CompositionShader.js";
import { BlackWhiteShader } from "../shaders/BlackWhiteShader.js";
import { InvertShader } from "../shaders/InvertShader.js";
import { RainbowCycleShader } from "../shaders/RainbowCycleShader.js";
import { HeatmapShader } from "../shaders/HeatmapShader.js";
import { BASE_LAYER, BLOOM_LAYER, BLOOM_PARAMS, OVERLAY_LAYER } from "../config/renderConfig.js";
import { generateSpiralArray } from "./generateArray.js";
import { Galaxy } from "./galaxy.js";
import { config } from "../config/galaxyConfig.js";

// Rendering
import { MapControls } from "three/addons/controls/MapControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { LightingGalaxy } from "./LightingGalaxy.js";
import { starTypes } from "../config/starDis.js";
import { materials } from "./star.js";


let canvas, renderer, camera, scene, orbit, baseComposer, bloomComposer, overlayComposer, shaderPasses, galaxy;
let lastCanvasArrayData = null;

function clearScene(scene) {
  scene.traverse((object) => {
    if (object.geometry) object.geometry.dispose();

    if (object.material) {
      if (Array.isArray(object.material)) {
        object.material.forEach((m) => m.dispose());
      } else {
        object.material.dispose();
      }
    }
  });

  while (scene.children.length > 0) {
    scene.remove(scene.children[0]);
  }

  THREE.Cache.clear();
}

function initThree() {
  canvas = document.querySelector("#canvas");
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xebe2db, 0.00003);

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    5000000
  );
  camera.position.set(0, 100, 100);
  camera.up.set(0, 0, 1);
  camera.lookAt(0, 0, 0);

  orbit = new MapControls(camera, canvas);
  orbit.enableDamping = true;
  orbit.dampingFactor = 0.05;
  orbit.screenSpacePanning = false;
  orbit.minDistance = 1;
  orbit.maxDistance = 16384;
  orbit.maxPolarAngle = Math.PI / 2 - Math.PI / 360;

  initRenderPipeline();
}

function initRenderPipeline() {
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas,
    logarithmicDepthBuffer: true,
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.5;

  const renderScene = new RenderPass(scene, camera);

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5,
    0.4,
    0.85
  );
  bloomPass.threshold = BLOOM_PARAMS.bloomThreshold;
  bloomPass.strength = BLOOM_PARAMS.bloomStrength;
  bloomPass.radius = BLOOM_PARAMS.bloomRadius;

  bloomComposer = new EffectComposer(renderer);
  bloomComposer.renderToScreen = false;
  bloomComposer.addPass(renderScene);
  bloomComposer.addPass(bloomPass);

  overlayComposer = new EffectComposer(renderer);
  overlayComposer.renderToScreen = false;
  overlayComposer.addPass(renderScene);

  shaderPasses = {
    composition: new ShaderPass(
      new THREE.ShaderMaterial({
        uniforms: {
          baseTexture: { value: null },
          bloomTexture: { value: bloomComposer.renderTarget2.texture },
          overlayTexture: { value: overlayComposer.renderTarget2.texture },
        },
        vertexShader: CompositionShader.vertex,
        fragmentShader: CompositionShader.fragment,
        defines: {},
      }),
      "baseTexture"
    ),
    blackwhite: new ShaderPass(
      new THREE.ShaderMaterial({
        uniforms: {
          baseTexture: { value: null },
          bloomTexture: { value: bloomComposer.renderTarget2.texture },
          overlayTexture: { value: overlayComposer.renderTarget2.texture },
        },
        vertexShader: BlackWhiteShader.vertex,
        fragmentShader: BlackWhiteShader.fragment,
        defines: {},
      }),
      "baseTexture"
    ),
    invert: new ShaderPass(
      new THREE.ShaderMaterial({
        uniforms: {
          baseTexture: { value: null },
          bloomTexture: { value: bloomComposer.renderTarget2.texture },
          overlayTexture: { value: overlayComposer.renderTarget2.texture },
        },
        vertexShader: InvertShader.vertex,
        fragmentShader: InvertShader.fragment,
        defines: {},
      }),
      "baseTexture"
    ),
    rainbowcycle: new ShaderPass(
      new THREE.ShaderMaterial({
        uniforms: {
          baseTexture: { value: null },
          bloomTexture: { value: bloomComposer.renderTarget2.texture },
          overlayTexture: { value: overlayComposer.renderTarget2.texture },
          time: { value: 0.0 },
        },
        vertexShader: RainbowCycleShader.vertex,
        fragmentShader: RainbowCycleShader.fragment,
        defines: {},
      }),
      "baseTexture"
    ),
    heatmap: new ShaderPass(
      new THREE.ShaderMaterial({
        uniforms: {
          baseTexture: { value: null },
          bloomTexture: { value: bloomComposer.renderTarget2.texture },
          overlayTexture: { value: overlayComposer.renderTarget2.texture },
        },
        vertexShader: HeatmapShader.vertex,
        fragmentShader: HeatmapShader.fragment,
        defines: {},
      }),
      "baseTexture"
    ),
  };

  baseComposer = new EffectComposer(renderer);
  baseComposer.addPass(renderScene);
  baseComposer.addPass(shaderPasses[config.SHADER_TYPE]);
}

function resizeRendererToDisplaySize(renderer) {
  const canvas = renderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
}

async function render() {
  orbit.update();

  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }

  const canvas = renderer.domElement;
  camera.aspect = canvas.clientWidth / canvas.clientHeight;
  camera.updateProjectionMatrix();

  galaxy.rotate(config.ROTATION_DELTA_TIME);

  galaxy.updateScale(camera);

  if (config.SHADER_TYPE === 'rainbowcycle') {
    shaderPasses['rainbowcycle'].material.uniforms.time.value = performance.now() * 0.001;
  }

  renderPipeline();

  requestAnimationFrame(render);
}

function renderPipeline() {
  camera.layers.set(BLOOM_LAYER);
  bloomComposer.render();

  camera.layers.set(OVERLAY_LAYER);
  overlayComposer.render();

  camera.layers.set(BASE_LAYER);
  baseComposer.render();
}

function processCanvasInput(arrayData) {
  lastCanvasArrayData = arrayData;
  galaxy.regenerate(arrayData);
  baseComposer.passes[1] = shaderPasses[config.SHADER_TYPE];
}

function updateGalaxyParameters() {
  const regenData = lastCanvasArrayData || generateSpiralArray(100, 100);
  galaxy.regenerate(regenData);
  baseComposer.passes[1] = shaderPasses[config.SHADER_TYPE];
}

initThree();
let axes = new THREE.AxesHelper(5.0);
scene.add(axes);

let arrayData = generateSpiralArray(100, 100);
galaxy = new Galaxy(scene, arrayData);

window.config = config;
window.regenerateGalaxy = () => {
  arrayData = lastCanvasArrayData || generateSpiralArray(100, 100);
  galaxy.regenerate(arrayData);
  baseComposer.passes[1] = shaderPasses[config.SHADER_TYPE];
};

window.generateStatic = () => {
  clearScene(scene);
  galaxy = new Galaxy(scene, arrayData);
  lastCanvasArrayData = generateSpiralArray(100, 100);
  galaxy.regenerate(lastCanvasArrayData);
  baseComposer.passes[1] = shaderPasses[config.SHADER_TYPE];
}

window.generateLight = () => {
  clearScene(scene);
  lastCanvasArrayData = generateSpiralArray(100, 100);
  galaxy = new LightingGalaxy(scene, lastCanvasArrayData);
  galaxy.regenerate(lastCanvasArrayData);

  for(let i = 0; i < config.NUM_POINT_LIGHTS; i++){
    const sign_x =  Math.random() < 0.5 ? 1 : -1;
    const sign_y =  Math.random() < 0.5 ? 1 : -1;

    const pointLight = new THREE.PointLight(0xffffff, config.POINT_LIGHT_INTENSITY, 0);
    pointLight.position.set((Math.random() * config.OUTER_CORE_X_DIST) * sign_x, 
                            (Math.random() * config.OUTER_CORE_Y_DIST) * sign_y, 
                            0);

    const pointLightHelper = new THREE.PointLightHelper(pointLight, 1);
    scene.add(pointLightHelper);
    
    
    scene.add(pointLight);
  }

  const hemi = new THREE.HemisphereLight(0x88aaff, 0x000011, config.HEMISPHERE_LIGHT_INTENSITY);
  scene.add(hemi);

  baseComposer.passes[1] = shaderPasses[config.SHADER_TYPE];

}

window.processCanvasInput = processCanvasInput;
window.updateGalaxyParameters = updateGalaxyParameters;

requestAnimationFrame(render);

// Vector helpers
function vecAdd(a, b) { return {x: a.x + b.x, y: a.y + b.y, z: a.z + b.z}; }
function vecSubtract(a, b) { return {x: a.x - b.x, y: a.y - b.y, z: a.z - b.z}; }
function vecScale(v, s) { return {x: v.x * s, y: v.y * s, z: v.z * s}; }
function vecDot(a, b) { return a.x * b.x + a.y * b.y + a.z * b.z; }
function vecNormalize(v) {
  const len = Math.sqrt(vecDot(v, v));
  return len > 0 ? {x: v.x / len, y: v.y / len, z: v.z / len} : v;
}
function vecCross(a, b) {
  return { 
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x 
  };
}

// Ray-sphere intersection
function intersectRaySphere(rayOrigin, rayDir, sphere) {
  let oc = vecSubtract(rayOrigin, sphere.center);
  let a = vecDot(rayDir, rayDir);
  let b = 2 * vecDot(oc, rayDir);
  let c = vecDot(oc, oc) - sphere.radius * sphere.radius;
  let disc = b * b - 4 * a * c;
  if (disc < 0) return Infinity;
  let sqrtDisc = Math.sqrt(disc);
  let t1 = (-b + sqrtDisc) / (2 * a);
  let t2 = (-b - sqrtDisc) / (2 * a);
  let t = Math.min(t1, t2);
  return t > 0 ? t : Infinity;
}

//Compute Lighting
function computeLighting(hitPoint, normal, baseColor, lights) {
  let finalColor = { r: 0, g: 0, b: 0 };
  const ambient = 0.6; // Increased for nebulae visibility
  const specularStrength = 0.9; // Consistent for glow
  const shininess = 32; // Sharp specular highlights
  const nebulaBoost = baseColor.r === 255 && baseColor.g === 0 && baseColor.b === 255 ? 1.5 : 1.0; // Boost magenta nebulae in core

  // Add ambient contribution
  finalColor.r += baseColor.r * ambient * nebulaBoost;
  finalColor.g += baseColor.g * ambient * nebulaBoost;
  finalColor.b += baseColor.b * ambient * nebulaBoost;

  // Process each light
  for (let light of lights) {
    let lightDir = vecNormalize(vecSubtract(light.pos, hitPoint));
    let diffuse = Math.max(vecDot(normal, lightDir), 0.0) * light.intensity;

    // Diffuse contribution
    finalColor.r += baseColor.r * diffuse * 0.9 * nebulaBoost;
    finalColor.g += baseColor.g * diffuse * 0.9 * nebulaBoost;
    finalColor.b += baseColor.b * diffuse * 0.9 * nebulaBoost;

    // Specular contribution for glow effect
    let viewDir = vecNormalize(vecSubtract(camera.position, hitPoint));
    let reflectDir = vecNormalize(vecSubtract(vecScale(normal, 2 * vecDot(normal, lightDir)), lightDir));
    let specular = Math.pow(Math.max(vecDot(viewDir, reflectDir), 0.0), shininess) * specularStrength * light.intensity;
    
    finalColor.r += specular * 255 * nebulaBoost;
    finalColor.g += specular * 255 * nebulaBoost;
    finalColor.b += specular * 255 * nebulaBoost;
  }

  // Clamp colors to [0, 255] and enhance brightness
  finalColor.r = Math.min(finalColor.r * 1.5, 255);
  finalColor.g = Math.min(finalColor.g * 1.5, 255);
  finalColor.b = Math.min(finalColor.b * 1.5, 255);

  return finalColor;
}

// AABB helpers
function sphereAABB(sphere) {
  const r = sphere.radius;
  return {
    min: {x: sphere.center.x - r, y: sphere.center.y - r, z: sphere.center.z - r},
    max: {x: sphere.center.x + r, y: sphere.center.y + r, z: sphere.center.z + r}
  };
}

function unionAABB(a, b) {
  return {
    min: {
      x: Math.min(a.min.x, b.min.x),
      y: Math.min(a.min.y, b.min.y),
      z: Math.min(a.min.z, b.min.z)
    },
    max: {
      x: Math.max(a.max.x, b.max.x),
      y: Math.max(a.max.y, b.max.y),
      z: Math.max(a.max.z, b.max.z)
    }
  };
}

function intersectRayAABB(rayOrigin, rayDir, aabb) {
  let tnear = -Infinity;
  let tfar = Infinity;
  const axes = ['x', 'y', 'z'];
  for (let i = 0; i < 3; i++) {
    const axis = axes[i];
    if (Math.abs(rayDir[axis]) < 1e-6) {
      if (rayOrigin[axis] < aabb.min[axis] || rayOrigin[axis] > aabb.max[axis]) {
        return Infinity;
      }
    } else {
      let t1 = (aabb.min[axis] - rayOrigin[axis]) / rayDir[axis];
      let t2 = (aabb.max[axis] - rayOrigin[axis]) / rayDir[axis];
      if (t1 > t2) {
        let temp = t1;
        t1 = t2;
        t2 = temp;
      }
      tnear = Math.max(tnear, t1);
      tfar = Math.min(tfar, t2);
      if (tnear > tfar) return Infinity;
    }
  }
  if (tfar < 0) return Infinity;
  return Math.max(tnear, 0);
}

// BVH Node
class BVHNode {
  constructor() {
    this.left = null;
    this.right = null;
    this.sphere = null;
    this.aabb = {
      min: {x: Infinity, y: Infinity, z: Infinity},
      max: {x: -Infinity, y: -Infinity, z: -Infinity}
    };
  }
}

function buildBVH(spheres, depth = 0) {
  let node = new BVHNode();

  if (spheres.length === 1) {
    node.sphere = spheres[0];
    node.aabb = sphereAABB(node.sphere);
    return node;
  }

  // Compute centroid bounds
  let centroidBounds = {
    min: {x: Infinity, y: Infinity, z: Infinity},
    max: {x: -Infinity, y: -Infinity, z: -Infinity}
  };
  for (let sphere of spheres) {
    centroidBounds.min.x = Math.min(centroidBounds.min.x, sphere.center.x);
    centroidBounds.min.y = Math.min(centroidBounds.min.y, sphere.center.y);
    centroidBounds.min.z = Math.min(centroidBounds.min.z, sphere.center.z);
    centroidBounds.max.x = Math.max(centroidBounds.max.x, sphere.center.x);
    centroidBounds.max.y = Math.max(centroidBounds.max.y, sphere.center.y);
    centroidBounds.max.z = Math.max(centroidBounds.max.z, sphere.center.z);
  }

  // Choose longest axis
  let extent = {
    x: centroidBounds.max.x - centroidBounds.min.x,
    y: centroidBounds.max.y - centroidBounds.min.y,
    z: centroidBounds.max.z - centroidBounds.min.z
  };
  let axis = 'x';
  if (extent.y > extent.x) axis = 'y';
  if (extent.z > extent[axis]) axis = 'z';

  // Sort spheres by center on axis
  spheres.sort((a, b) => a.center[axis] - b.center[axis]);

  let mid = Math.floor(spheres.length / 2);
  node.left = buildBVH(spheres.slice(0, mid), depth + 1);
  node.right = buildBVH(spheres.slice(mid), depth + 1);

  node.aabb = unionAABB(node.left.aabb, node.right.aabb);

  return node;
}

// BVH intersection
function intersectBVH(rayOrigin, rayDir, node) {
  let t_aabb = intersectRayAABB(rayOrigin, rayDir, node.aabb);
  if (t_aabb === Infinity) return {sphere: null, t: Infinity};

  if (node.sphere) {
    let t = intersectRaySphere(rayOrigin, rayDir, node.sphere);
    return {sphere: node.sphere, t: t};
  }

  let child1 = node.left;
  let child2 = node.right;
  let t1 = intersectRayAABB(rayOrigin, rayDir, child1.aabb);
  let t2 = intersectRayAABB(rayOrigin, rayDir, child2.aabb);

  if (t2 < t1) {
    [child1, child2] = [child2, child1];
    [t1, t2] = [t2, t1];
  }

  let hit1 = intersectBVH(rayOrigin, rayDir, child1);
  if (hit1.t < t2) return hit1;

  let hit2 = intersectBVH(rayOrigin, rayDir, child2);
  if (hit1.t < hit2.t) return hit1;
  return hit2;
}

// Trace ray
function trace(rayOrigin, rayDir, bvhRoot, lights, depth = 0) {
  if (depth > 2) return { r: 0, g: 0, b: 0 };
  let hit = intersectBVH(rayOrigin, rayDir, bvhRoot);
  if (hit.t === Infinity) return { r: 25, g: 25, b: 35 }; // Slightly brighter background
  let closestSphere = hit.sphere;
  let closestT = hit.t;
  let hitPoint = vecAdd(rayOrigin, vecScale(rayDir, closestT));
  let normal = vecNormalize(vecSubtract(hitPoint, closestSphere.center));
  return computeLighting(hitPoint, normal, closestSphere.color, lights);
}

window.renderRaytracePNG = () => {
  document.getElementById('renderProgress').textContent = '0% complete';
  let spheres = [];
  galaxy.stars.forEach(star => {
    let col = materials[star.starType].color.getStyle().match(/\d+/g).map(Number);
    spheres.push({
      center: {x: star.position.x, y: star.position.y, z: star.position.z},
      radius: starTypes.size[star.starType] * star.sizeFactor / 2,
      color: {r: col[0], g: col[1], b: col[2]}
    });
  });
  galaxy.nebulae.forEach(nebula => {
  let col = nebula.obj.material.color.getStyle().match(/\d+/g).map(Number);
  spheres.push({
    center: { x: nebula.position.x, y: nebula.position.y, z: nebula.position.z },
    radius: nebula.obj.scale.x / 2,
    color: { r: col[0], g: col[1], b: col[2] }
  });
  });
  galaxy.haze.forEach(haze => {
    let col = haze.obj.material.color.getStyle().match(/\d+/g).map(Number);
    spheres.push({
      center: { x: haze.position.x, y: haze.position.y, z: haze.position.z },
      radius: 0.1,
      color: { r: col[0], g: col[1], b: col[2] }
    });
  });
  let bvhRoot = buildBVH(spheres);
  let lights = [];
  scene.traverse(obj => {
    if (obj instanceof THREE.PointLight) {
      lights.push({pos: {x: obj.position.x, y: obj.position.y, z: obj.position.z}, intensity: obj.intensity});
    } else if (obj instanceof THREE.HemisphereLight) {
      lights.push({pos: {x: 0, y: 0, z: 10000}, intensity: obj.intensity / 2});
      lights.push({pos: {x: 0, y: 0, z: -10000}, intensity: obj.intensity / 2});
    }
  });
  let camPos = {x: camera.position.x, y: camera.position.y, z: camera.position.z};
  let forward = vecNormalize(vecSubtract({x:0,y:0,z:0}, camPos));
  let up = {x: camera.up.x, y: camera.up.y, z: camera.up.z};
  let right = vecNormalize(vecCross(forward, up));
  let local_up = vecNormalize(vecCross(right, forward));
  let fovScale = Math.tan(camera.fov * Math.PI / 360);
  //const width = window.innerWidth, height = window.innerHeight;
  const width = 400, height = 400;
  let aspect = width / height;
  const cvs = document.createElement('canvas');
  cvs.width = width;
  cvs.height = height;
  const ctx = cvs.getContext('2d');
  const imageData = ctx.createImageData(width, height);
  let y = 0;
  function renderRow() {
    for (let x = 0; x < width; x++) {
      let u = (x / width - 0.5) * aspect;
      let v = 0.5 - (y / height);
      let rayDir = vecNormalize(vecAdd(vecAdd(vecScale(forward, 1), vecScale(right, u * fovScale)), vecScale(local_up, v * fovScale)));
      let color = trace(camPos, rayDir, bvhRoot, lights);
      let idx = (y * width + x) * 4;
      imageData.data[idx] = color.r;
      imageData.data[idx + 1] = color.g;
      imageData.data[idx + 2] = color.b;
      imageData.data[idx + 3] = 255;
    }
    document.getElementById('renderProgress').textContent = `${Math.floor((y + 1) / height * 100)}% complete`;
    y++;
    if (y < height) {
      setTimeout(renderRow, 0);
    } else {
      ctx.putImageData(imageData, 0, 0);
      const url = cvs.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'raytrace-galaxy.png';
      link.href = url;
      link.click();
      document.getElementById('renderProgress').textContent = 'Render complete';
    }
  }
  renderRow();
};