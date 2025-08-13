import * as THREE from "three";

// Data and visualization
import { CompositionShader } from "./shaders/CompositionShader.js";
import { BlackWhiteShader } from "./shaders/BlackWhiteShader.js";
import { InvertShader } from "./shaders/InvertShader.js";
import { RainbowCycleShader } from "./shaders/RainbowCycleShader.js";
import { HeatmapShader } from "./shaders/HeatmapShader.js";
import { BASE_LAYER, BLOOM_LAYER, BLOOM_PARAMS, OVERLAY_LAYER } from "./config/renderConfig.js";
import { generateSpiralArray } from "./generateArray.js";
import { Galaxy } from "./galaxy.js";
import {LightingGalaxy} from "./LightingGalaxy.js"
import { config } from "./config/galaxyConfig.js";

// Rendering
import { MapControls } from "three/addons/controls/MapControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";

let canvas, renderer, camera, scene, orbit, baseComposer, bloomComposer, overlayComposer, shaderPasses, galaxy;
let lastCanvasArrayData = null; // Store last canvas input

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
  camera.position.set(0, 100, 100); // Adjusted from (0, 50, 50) to view larger galaxy
  camera.up.set(0, 0, 1);
  camera.lookAt(0, 0, 0);

  orbit = new MapControls(camera, canvas);
  orbit.enableDamping = true;
  orbit.dampingFactor = 0.05;
  orbit.screenSpacePanning = false;
  orbit.minDistance = 1;
  orbit.maxDistance = 16384;
  orbit.maxPolarAngle = Math.PI / 2 - Math.PI / 360;

  //Point Light
  // const pointLight = new THREE.PointLight(0xffffff, 1000, 0);
  // const pointLight1 = new THREE.PointLight(0xffffff, 1000, 0);
  // const pointLight2 = new THREE.PointLight(0xffffff, 1000, 0);



  // Position the light in your scene
  // pointLight.position.set(330, 330, 0);
  // pointLight1.position.set(20, 20, 20);
  // pointLight2.position.set(50, 50, 0);

  // Optionally add a helper to visualize the light position
  // const pointLightHelper = new THREE.PointLightHelper(pointLight, 1);
  // scene.add(pointLightHelper);
  
  // const pointLightHelper1 = new THREE.PointLightHelper(pointLight1, 1);
  // scene.add(pointLightHelper1);

  // const pointLightHelper2 = new THREE.PointLightHelper(pointLight2, 1);
  // scene.add(pointLightHelper2);

  // // Add the light to your scene
  // scene.add(pointLight);
  // scene.add(pointLight1);
  // scene.add(pointLight2);

  //Ambient Light
  // const ambientLight = new THREE.AmbientLight(0x404040, 0.7);
  // scene.add(ambientLight);

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

    //COMMENT OUT FOR NOW
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.5;

  // renderer.shadowMap.enabled = true;
  // renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  //ADDED
  // renderer.toneMapping = THREE.NoToneMapping;
  // renderer.toneMappingExposure = 1.0;
  

  

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

  galaxy.updateScale(camera);

  // Update time for rainbowcycle if active
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
  lastCanvasArrayData = arrayData; // Store canvas input
  galaxy.regenerate(arrayData);
  baseComposer.passes[1] = shaderPasses[config.SHADER_TYPE];
}

function updateGalaxyParameters() {
  // Use last canvas input if available, otherwise generate new random array
  const regenData = lastCanvasArrayData || generateSpiralArray(100, 100);
  galaxy.regenerate(regenData);
  baseComposer.passes[1] = shaderPasses[config.SHADER_TYPE];
}

initThree();
let axes = new THREE.AxesHelper(5.0);
scene.add(axes);

// Initialize galaxy with random 2D array
let arrayData = generateSpiralArray(100, 100); // 100x100 grid

galaxy = new Galaxy(scene, arrayData); //CHANGE BACK LATER
//galaxy = new LightingGalaxy(scene, arrayData);

window.config = config;
window.regenerateGalaxy = () => {
  arrayData = lastCanvasArrayData || generateSpiralArray(100, 100); // Always use new random array for default generation
  galaxy.regenerate(arrayData);
  baseComposer.passes[1] = shaderPasses[config.SHADER_TYPE];
};

window.generateStatic = () => {
  clearScene(scene);
  galaxy = new Galaxy(scene, arrayData); //CHANGE BACK LATER
  lastCanvasArrayData = generateSpiralArray(100, 100); // Always use new random array for default generation
  galaxy.regenerate(lastCanvasArrayData);
  baseComposer.passes[1] = shaderPasses[config.SHADER_TYPE];
}

window.generateLight = () => {
  clearScene(scene);
  lastCanvasArrayData = generateSpiralArray(100, 100); // Always use new random array for default generation
  galaxy = new LightingGalaxy(scene, lastCanvasArrayData);
  galaxy.regenerate(lastCanvasArrayData);

      // Add real lights BY ME

  for(let i = 0; i < config.NUM_POINT_LIGHTS; i++){
      const sign_x =  Math.random() < 0.5 ? 1 : -1;
      const sign_y =  Math.random() < 0.5 ? 1 : -1;

      const pointLight = new THREE.PointLight(0xffffff, config.POINT_LIGHT_INTESITY, 0);
      pointLight.position.set((Math.random() * config.OUTER_CORE_X_DIST) * sign_x, 
                              (Math.random() * config.OUTER_CORE_Y_DIST) * sign_y, 
                              0);

      

      const pointLightHelper = new THREE.PointLightHelper(pointLight, 1); //Add point light visualizer
      scene.add(pointLightHelper);
      scene.add(pointLight); //Add point light


      // const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      // directionalLight.position.set((Math.random() * config.OUTER_CORE_X_DIST) * sign_x, 
      //                         (Math.random() * config.OUTER_CORE_Y_DIST) * sign_y, 
      //                         0);
      // directionalLight.position.set(0,0,0);
      // const dirLightHelper = new THREE.DirectionalLightHelper(directionalLight, 10); //Add point light visualizer
      // scene.add(dirLightHelper);
      // //const randomObj = galaxy.stars[Math.floor(Math.random() * galaxy.stars.length)];

      // const randomIndex = Math.floor(Math.random() * galaxy.stars.length);
      // const randomObj = galaxy.stars[randomIndex];

      // if (!randomObj) {
      //   console.warn(`No star found at index ${randomIndex}`);
      //   continue;
      // }
      // if (!randomObj.mesh) {
      //   console.warn('randomObj.mesh is undefined', randomObj);
      //   continue;
      // }

      // directionalLight.target.position.copy(randomObj.mesh.position);
      //scene.add(directionalLight);
      // scene.add(directionalLight.target);

      // // Force update of the target's world matrix
      // directionalLight.target.updateMatrixWorld(true);

      // // Also update the light’s matrices just in case
      // directionalLight.updateMatrixWorld(true);
  }
    //Directional Light
  // const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
  // directionalLight.position.set(10, 10, 10);
  // scene.add(directionalLight);
  // UnrealBloomPass.enabled = false;

  //Hemisphere light
  //const hemi = new THREE.HemisphereLight(0x88aaff, 0x7fc201, config.HEMISPHERE_LIGHT_INTENSITY);
  const hemi = new THREE.HemisphereLight(0x88aaff, 0x000011, config.HEMISPHERE_LIGHT_INTENSITY);
  scene.add(hemi);


  //baseComposer.passes[1] = shaderPasses[config.SHADER_TYPE];
  let axes = new THREE.AxesHelper(5.0);
  scene.add(axes);

  // const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1);
  // //directionalLight1.position.set(0,0,0);
  //       directionalLight1.position1.set((Math.random() * config.OUTER_CORE_X_DIST) * sign_x, 
  //                             (Math.random() * config.OUTER_CORE_Y_DIST) * sign_y, 
  //                             0);
  // const dirLightHelper = new THREE.DirectionalLightHelper(directionalLight1, 1); //Add point light visualizer    
  // scene.add(dirLightHelper);

  // const randomObj = galaxy.stars[5];

  // directionalLight1.target = randomObj.mesh;
  // directionalLight1.castShadow = true;
  // scene.add(directionalLight1.target);

  // const geometry = new THREE.SphereGeometry(.5, 32, 32); // size can be adjusted dynamically
  
  //     // Create a lighting-aware material with color based on starType
  //     const material = new THREE.MeshStandardMaterial({
  //     color: starTypes.color[this.starType],
  //     //color: 0xff00ff,
  //     roughness: 0.2,
  //     metalness: 0.0,
  //     emissiveIntensity: 1.0,
  //     });
  
  
  //     // Create mesh and set position
  //     const starMesh = new THREE.Mesh(geometry, material);
  //     starMesh.position.set(0,0,0);
  //     scene.add(starMesh);
  
      // Scale based on star size and size factor
      // const scale = starTypes.size[this.starType] * this.sizeFactor;
      // starMesh.scale.set(scale, scale, scale);
  
      // Optionally assign to bloom layer if you want bloom glow
      //starMesh.layers.set(BLOOM_LAYER);
  
      // this.obj = starMesh;
      // directionalLight1.target = starMesh; // sphere is your mesh at (0,0,0)
      // scene.add(directionalLight1);
      // scene.add(directionalLight1.target);
  
     

}

window.processCanvasInput = processCanvasInput;
window.updateGalaxyParameters = updateGalaxyParameters;

requestAnimationFrame(render);