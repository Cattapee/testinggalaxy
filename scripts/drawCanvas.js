export function initDrawCanvas() {
  const drawCanvas = document.getElementById('drawCanvas');
  const drawControls = document.getElementById('drawControls');
  const generateButton = document.getElementById('generateGalaxyButton');
  const clearButton = document.getElementById('clearCanvasButton');
  const lightingButton = document.getElementById('LightingModeButton');
  let ctx = null;
  let isDrawing = false;

  function resizeDrawCanvas() {
    if (drawCanvas) {
      drawCanvas.width = window.innerWidth;
      drawCanvas.height = window.innerHeight;
      ctx = drawCanvas.getContext('2d');
      if (ctx) {
        ctx.globalAlpha = 1.0; 
        ctx.fillStyle = 'rgb(255, 255, 255)';
        ctx.fillRect(0, 0, drawCanvas.width, drawCanvas.height);
        ctx.globalAlpha = 1.0; // Reset for drawing
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
      }
    }
  }

  function processCanvas() {
    if (!ctx) return;
    const width = 200; // Match resolution for detail
    const height = 200;
    const imageData = ctx.getImageData(0, 0, drawCanvas.width, drawCanvas.height);
    const data = Array(height).fill().map(() => Array(width).fill(0));

    // Downsample canvas to 200x200 array with averaging
    const scaleX = drawCanvas.width / width;
    const scaleY = drawCanvas.height / height;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0;
        let count = 0;
        // Average pixels in each grid cell
        for (let dy = 0; dy < scaleY; dy++) {
          for (let dx = 0; dx < scaleX; dx++) {
            const px = Math.floor((width - 1 - x) * scaleX + dx); // Reverse x to fix mirroring
            const py = Math.floor(y * scaleY + dy);
            if (px >= 0 && px < drawCanvas.width && py >= 0 && py < drawCanvas.height) {
              const index = (py * imageData.width + px) * 4;
              sum += 1 - (imageData.data[index] / 255); // Invert: black (0) -> 1, white (255) -> 0
              count++;
            }
          }
        }
        data[y][x] = count > 0 ? sum / count : 0; // Average intensity
      }
    }

    const arrayData = { data, width, height };
    window.processCanvasInput(arrayData);
  }

  function clearCanvas() {
    if (ctx) {
      ctx.fillStyle = 'rgba(255, 255, 255, 1.0 )';
      ctx.fillRect(0, 0, drawCanvas.width, drawCanvas.height);  
      
    }
  }

  if (drawCanvas) {
    resizeDrawCanvas();

    drawCanvas.addEventListener('mousedown', (e) => {
      if (ctx) {
        isDrawing = true;
        ctx.beginPath();
        ctx.moveTo(e.clientX, e.clientY);
      }
    });

    drawCanvas.addEventListener('mousemove', (e) => {
      if (isDrawing && ctx) {
        ctx.lineTo(e.clientX, e.clientY);
        ctx.stroke();
      }
    });

    drawCanvas.addEventListener('mouseup', () => {
      isDrawing = false;
      if (ctx) ctx.closePath();
    });

    drawCanvas.addEventListener('mouseout', () => {
      isDrawing = false;
      if (ctx) ctx.closePath();
    });

    window.addEventListener('resize', resizeDrawCanvas);
  }

  if (generateButton) {
    generateButton.addEventListener('click', () => {
      processCanvas();
      if (drawCanvas && drawControls) {
        drawCanvas.classList.remove('active');
        drawControls.classList.remove('active');
        document.getElementById('controls').style.display = 'flex';
      }
    });
  }

  if (clearButton) {
    clearButton.addEventListener('click', clearCanvas);
  }

  // if (lightingButton){
  //   lightingButton.addEventListener('click', clearCanvas);
  // }

}