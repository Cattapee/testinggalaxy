function processCanvas() {
  const width = 200;
  const height = 200;

  const imgDataURL = sessionStorage.getItem("imgdata");
  if (!imgDataURL) {
    console.error("No canvas data found in sessionStorage");
    return;
  }

  sessionStorage.removeItem("imgdata");

  const canwid = parseInt(localStorage.getItem("width"), 10);
  const canhei = parseInt(localStorage.getItem("height"), 10);
  localStorage.removeItem("width");
  localStorage.removeItem("height");

  const offCanvas = document.createElement("canvas");
  const offCtx = offCanvas.getContext("2d");
  offCanvas.width = canwid;
  offCanvas.height = canhei;

  const img = new Image();
  img.onload = () => {
    offCtx.drawImage(img, 0, 0, canwid, canhei);

    const imageData = offCtx.getImageData(0, 0, canwid, canhei);
    const pixels = imageData.data;

    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i]   = 255 - pixels[i];     // Red
      pixels[i+1] = 255 - pixels[i+1];   // Green
      pixels[i+2] = 255 - pixels[i+2];   // Blue
    }

    offCtx.putImageData(imageData, 0, 0);

    const data = Array(height)
      .fill()
      .map(() => Array(width).fill(0));

    const scaleX = canwid / width;
    const scaleY = canhei / height;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0;
        let count = 0;
        for (let dy = 0; dy < scaleY; dy++) {
          for (let dx = 0; dx < scaleX; dx++) {
            const px = Math.floor((width - 1 - x) * scaleX + dx);
            const py = Math.floor(y * scaleY + dy);
            if (px >= 0 && px < canwid && py >= 0 && py < canhei) {
              const index = (py * imageData.width + px) * 4;
              sum += 1 - imageData.data[index] / 255;
              count++;
            }
          }
        }
        data[y][x] = count > 0 ? sum / count : 0;
      }
    }

    const arrayData = { data, width, height };
    window.processCanvasInput(arrayData);
  };

  img.src = imgDataURL;
}

const drawBtn = document.getElementById("drawbtn");

drawBtn.addEventListener("click", () => {
  window.location.href = "draw.html";
});

document.addEventListener("DOMContentLoaded", (event) => {
  const box = document.getElementById("controls"); // Updated to match index.html
  let hidden = 69;

  document.addEventListener("keydown", (event) => {
    if (event.key === "m" || event.key === "M") {
      if (hidden === 69) {
        box.style.display = "none";
        hidden = 70;
      } else {
        box.style.display = "flex"; // Matches flex display in index.html
        hidden = 69;
      }
    }
  });

  const paramMap = {
    stars: "NUM_STARS",
    thick: "GALAXY_THICKNESS",
    corex: "CORE_X_DIST",
    corey: "CORE_Y_DIST",
    outcorex: "OUTER_CORE_X_DIST",
    coutcorey: "OUTER_CORE_Y_DIST",
    armx: "ARM_X_DIST",
    army: "ARM_Y_DIST",
    armmx: "ARM_X_MEAN",
    armmy: "ARM_Y_MEAN",
    spiral: "SPIRAL",
    arms: "ARMS",
    barl: "BAR_LENGTH",
    barw: "BAR_WIDTH",
    halorad: "HALO_RADIUS",
    haloden: "HALO_DENSITY",
    armpit: "ARM_PITCH",
    starvari: "STAR_SIZE_VARIANCE",
    nebden: "NEBULA_DENSITY",
    nebmin: "NEBULA_SCALE_MIN",
    nebmax: "NEBULA_SCALE_MAX",
    shader_type: "SHADER_TYPE",
    hemisphere_light_intensity: "HEMISPHERE_LIGHT_INTENSITY",
    point_light_intensity: 'POINT_LIGHT_INTENSITY',
    num_lights: 'NUM_POINT_LIGHTS',
    delta_time: 'ROTATION_DELTA_TIME',
    rotation_velocity: 'ROTATION_VELOCITY',
    bulge_rad: 'BULGE_RADIUS',
  };

  Object.keys(paramMap).forEach((id) => {
    const input = document.getElementById(id);
    if (input && window.config) {
      if (input.tagName === "SELECT") {
        input.value = window.config[paramMap[id]];
        input.addEventListener("change", (e) => {
          window.config[paramMap[id]] = e.target.value;
          if (window.updateGalaxyParameters) window.updateGalaxyParameters();
        });
      } else {
        input.value = window.config[paramMap[id]];
        input.addEventListener("input", (e) => {
          window.config[paramMap[id]] = parseFloat(e.target.value);
          if (window.updateGalaxyParameters) window.updateGalaxyParameters();
        });
      }
    }
  });
});

if (localStorage.getItem("runFunction") === "true") {
  processCanvas();
  localStorage.removeItem("runFunction");
}

document.getElementById('renderRaytrace').addEventListener('click', () => {
  window.renderRaytracePNG();
});