const canvas = document.getElementById("drawCanvas");
const ctx = canvas.getContext("2d");
const brushSizeInput = document.getElementById("brushSize");
const eraseToggleBtn = document.getElementById("eraseToggle");
const clearBtn = document.getElementById("clearBtn");
const genbtn = document.getElementById("genbtn");
const gened = false;

function resizeCanvas() {
  const canvas = document.getElementById("drawCanvas");
  // Use CSS size converted to pixels:
  const style = getComputedStyle(canvas);
  canvas.width = parseInt(style.width);
  canvas.height = parseInt(style.height);
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

let drawing = false;
let brushSize = 3;
let isErasing = false;

// Update brush size from range input
brushSizeInput.addEventListener("input", (e) => {
  brushSize = e.target.value;
});

// Toggle erase mode on button click
eraseToggleBtn.addEventListener("click", () => {
  isErasing = !isErasing;
  eraseToggleBtn.textContent = `Erase: ${isErasing ? "On" : "Off"}`;
  // Change cursor to indicate erase mode
  canvas.style.cursor = isErasing ? "crosshair" : "crosshair";
});

clearBtn.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

function startPosition(e) {
  drawing = true;
  draw(e);
}

function finishedPosition() {
  drawing = false;
  ctx.beginPath();
}

function draw(e) {
  if (!drawing) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  ctx.lineWidth = brushSize;
  ctx.lineCap = "round";

  if (isErasing) {
    // Erase by drawing white lines (or canvas background color)
    ctx.strokeStyle = "#000000ff";
  } else {
    ctx.strokeStyle = "#ffffffff"; // Your brush color
  }

  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y);
}

canvas.addEventListener("mousedown", startPosition);
canvas.addEventListener("mouseup", finishedPosition);
canvas.addEventListener("mouseout", finishedPosition);
canvas.addEventListener("mousemove", draw);


genbtn.addEventListener("click", () => {

  const imgDataURL = canvas.toDataURL();

  localStorage.setItem("runFunction", "true");
  localStorage.setItem("width", canvas.width);
  localStorage.setItem("height", canvas.height);
  sessionStorage.setItem("imgdata", imgDataURL);
  window.location.href = "index.html";
});
