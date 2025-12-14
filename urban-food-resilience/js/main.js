/*
INTERACTION: CMYK Halftone Pattern Background

Core functionality:
- CMYK color separation
- Halftone dot pattern generation
- Random color palette generation
- Motion preferences respect
*/

const canvas = document.getElementById("bg");
const ctx = canvas && canvas.getContext("2d");

// Respect user motion preferences
let reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const btn = document.getElementById("motionToggle");
if (btn) {
  btn.addEventListener("click", () => {
    reduceMotion = !reduceMotion;
    btn.textContent = reduceMotion ? "Enable Motion" : "Reduce Motion";
  });
}

// CMYK colors
let cyan, magenta, yellow, black;
let initialized = false;
let mouseX = 0;
let mouseY = 0;
let time = 0;
let dots = [];

/**
 * Helper: Convert RGB to CMYK
 */
function RGBtoCMYK(r, g, b) {
  let r1 = r / 255;
  let g1 = g / 255;
  let b1 = b / 255;
  let c, m, y, k;
  k = Math.min(1 - r1, 1 - g1, 1 - b1);
  if (k == 1) {
    c = m = y = 0;
  } else {
    c = (1 - r1 - k) / (1 - k);
    m = (1 - g1 - k) / (1 - k);
    y = (1 - b1 - k) / (1 - k);
  }
  return [c, m, y, k];
}

/**
 * Helper: Convert CMYK values to spot sizes
 */
function CMYKtoSpotSize(c, m, y, k, spotSize) {
  let cs = c * spotSize;
  let ms = m * spotSize;
  let ys = y * spotSize;
  let ks = k * spotSize;
  return [cs, ms, ys, ks];
}

/**
 * Create random color palette with curated ranges
 */
function createColorPalette() {
  // Use more refined color ranges for better aesthetic
  const r1 = 100 + Math.random() * 155;
  const g1 = 150 + Math.random() * 105;
  const b1 = 180 + Math.random() * 75;
  cyan = `rgb(${r1}, ${g1}, ${b1})`;
  
  const r2 = 180 + Math.random() * 75;
  const g2 = 100 + Math.random() * 100;
  const b2 = 140 + Math.random() * 115;
  magenta = `rgb(${r2}, ${g2}, ${b2})`;
  
  const r3 = 200 + Math.random() * 55;
  const g3 = 180 + Math.random() * 75;
  const b3 = 80 + Math.random() * 120;
  yellow = `rgb(${r3}, ${g3}, ${b3})`;
  
  const r4 = 40 + Math.random() * 100;
  const g4 = 50 + Math.random() * 100;
  const b4 = 30 + Math.random() * 90;
  black = `rgb(${r4}, ${g4}, ${b4})`;
}

/**
 * Create base graphics with random circles
 */
function createBaseGraphics(w, h) {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = w;
  tempCanvas.height = h;
  const tempCtx = tempCanvas.getContext('2d');
  
  // Draw random circles with varied sizes
  const circleCount = 120;
  for (let i = 0; i < circleCount; i++) {
    let radius = 50 + Math.random() * 80; // More size variation
    const r = 100 + Math.random() * 155;
    const g = 120 + Math.random() * 135;
    const b = 140 + Math.random() * 115;
    const alpha = 0.6 + Math.random() * 0.4;
    tempCtx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
    tempCtx.beginPath();
    tempCtx.arc(Math.random() * w, Math.random() * h, radius, 0, Math.PI * 2);
    tempCtx.fill();
  }
  
  return tempCanvas;
}

/**
 * Initialize halftone pattern
 */
function initHalftone() {
  if (!canvas || !ctx) return;
  
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w;
  canvas.height = h;
  
  // Create color palette
  createColorPalette();
  
  // Create base graphics
  const baseGraphics = createBaseGraphics(w, h);
  const baseCtx = baseGraphics.getContext('2d');
  
  // Store dot positions and colors for animation
  dots = [];
  const diff = 8;
  const spotamp = 15 + Math.random() * 25;
  const gridSpacing = 18;
  
  for (let Y = 50; Y < h - 50; Y += gridSpacing) {
    for (let X = 50; X < w - 50; X += gridSpacing) {
      const imageData = baseCtx.getImageData(X, Y, 1, 1);
      const [r, g, b] = imageData.data;
      const thisCMYK = RGBtoCMYK(r, g, b);
      const spotSizes = CMYKtoSpotSize(...thisCMYK, spotamp);
      
      // Store each CMYK dot with its properties
      dots.push({
        x: X,
        y: Y - diff,
        baseSize: spotSizes[3],
        color: black,
        offset: Math.random() * Math.PI * 2
      });
      dots.push({
        x: X - diff,
        y: Y,
        baseSize: spotSizes[0],
        color: cyan,
        offset: Math.random() * Math.PI * 2
      });
      dots.push({
        x: X,
        y: Y + diff,
        baseSize: spotSizes[1],
        color: magenta,
        offset: Math.random() * Math.PI * 2
      });
      dots.push({
        x: X + diff,
        y: Y,
        baseSize: spotSizes[2],
        color: yellow,
        offset: Math.random() * Math.PI * 2
      });
    }
  }
  
  initialized = true;
  animate();
}

/**
 * Animation loop
 */
function animate() {
  if (!canvas || !ctx || dots.length === 0) return;
  
  const w = window.innerWidth;
  const h = window.innerHeight;
  
  // Background
  ctx.fillStyle = '#e6e6e6';
  ctx.fillRect(0, 0, w, h);
  
  ctx.globalCompositeOperation = 'multiply';
  
  time += 0.01;
  
  // Draw animated dots
  for (let i = 0; i < dots.length; i++) {
    const dot = dots[i];
    
    // Calculate distance from mouse
// Initialize
if (canvas) {
  window.addEventListener('resize', handleResize);
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('touchmove', handleTouchMove);
  draw();
}   
    // Mouse interaction: scale and displacement
    let scale = 1;
    let offsetX = 0;
    let offsetY = 0;
    
    if (dist < maxDist) {
      const influence = 1 - dist / maxDist;
      scale = 1 + influence * 0.8; // Grow when mouse is near
      offsetX = (dx / dist) * influence * 15; // Push away from mouse
      offsetY = (dy / dist) * influence * 15;
    }
    
    // Subtle breathing animation
    const breathe = Math.sin(time + dot.offset) * 0.15 + 1;
    
    // Calculate final size
    const finalSize = dot.baseSize * scale * breathe;
    
    if (finalSize > 0.5) {
      ctx.fillStyle = dot.color;
      ctx.beginPath();
      ctx.arc(dot.x + offsetX, dot.y + offsetY, finalSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  if (!reduceMotion) {
    requestAnimationFrame(animate);
  }
}

/**
 * Mouse tracking
 */
function handleMouseMove(e) {
  mouseX = e.clientX;
  mouseY = e.clientY;
}

/**
 * Touch tracking
 */
function handleTouchMove(e) {
  if (e.touches.length > 0) {
    mouseX = e.touches[0].clientX;
    mouseY = e.touches[0].clientY;
  }
}

/**
 * Main draw loop (static pattern)
 */
function draw() {
  if (!initialized) {
    initHalftone();
  }
} if (!initialized) {
    initHalftone();
  }
  // Pattern is static, no animation needed
}

/**
 * Handle window resize
 */
function handleResize() {
  initialized = false;
  draw();
}

// Initialize
if (canvas) {
  window.addEventListener('resize', handleResize);
  draw();
}
