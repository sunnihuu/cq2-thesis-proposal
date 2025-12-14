/*
INTERACTION: CMYK Halftone Pattern Background with Animation

Core functionality:
- CMYK color separation
- Halftone dot pattern generation
- Mouse-responsive breathing animation
- Touch support
*/

const canvas = document.getElementById("bg");
const ctx = canvas && canvas.getContext("2d");

// Animation state
let mouseX = 0;
let mouseY = 0;
let time = 0;
let dots = [];
let initialized = false;

// CMYK colors
let cyan, magenta, yellow, black;

// Motion preferences
let reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const motionBtn = document.getElementById("motionToggle");
if (motionBtn) {
  motionBtn.addEventListener("click", () => {
    reduceMotion = !reduceMotion;
    motionBtn.textContent = reduceMotion ? "Enable Motion" : "Reduce Motion";
  });
}

/**
 * Convert RGB to CMYK color space
 */
function RGBtoCMYK(r, g, b) {
  const r1 = r / 255;
  const g1 = g / 255;
  const b1 = b / 255;
  
  const k = Math.min(1 - r1, 1 - g1, 1 - b1);
  
  if (k === 1) {
    return [0, 0, 0, 1];
  }
  
  const c = (1 - r1 - k) / (1 - k);
  const m = (1 - g1 - k) / (1 - k);
  const y = (1 - b1 - k) / (1 - k);
  
  return [c, m, y, k];
}

/**
 * Convert CMYK values to halftone dot sizes
 */
function CMYKtoSpotSize(c, m, y, k, spotSize) {
  return [c * spotSize, m * spotSize, y * spotSize, k * spotSize];
}

/**
 * Generate random color palette with harmonious ranges
 */
function createColorPalette() {
  cyan = `rgb(${60 + Math.random() * 100}, ${160 + Math.random() * 95}, ${180 + Math.random() * 75})`;
  magenta = `rgb(${180 + Math.random() * 75}, ${60 + Math.random() * 80}, ${140 + Math.random() * 115})`;
  yellow = `rgb(${200 + Math.random() * 55}, ${160 + Math.random() * 95}, ${40 + Math.random() * 80})`;
  black = `rgb(${50 + Math.random() * 60}, ${60 + Math.random() * 60}, ${45 + Math.random() * 60})`;
}

/**
 * Create base graphics with random circles
 */
function createBaseGraphics(w, h) {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = w;
  tempCanvas.height = h;
  const tempCtx = tempCanvas.getContext('2d');
  
  // Draw 120 random circles with varying sizes and opacity
  for (let i = 0; i < 120; i++) {
    const radius = 50 + Math.random() * 80;
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
 * Initialize halftone pattern and dots array
 */
function initHalftone() {
  if (!canvas || !ctx) return;
  
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w;
  canvas.height = h;
  
  // Generate color scheme
  createColorPalette();
  
  // Create source graphic for halftone
  const baseGraphics = createBaseGraphics(w, h);
  const baseCtx = baseGraphics.getContext('2d');
  
  // Parameters for halftone generation
  const diff = 8; // Offset between CMYK dots
  const spotamp = 15 + Math.random() * 25; // Dot size amplitude
  const gridSpacing = 18; // Grid sampling distance
  
  // Clear dots array and populate with new pattern
  dots = [];
  
  for (let Y = 50; Y < h - 50; Y += gridSpacing) {
    for (let X = 50; X < w - 50; X += gridSpacing) {
      // Sample color from base graphics
      const imageData = baseCtx.getImageData(X, Y, 1, 1);
      const [r, g, b] = imageData.data;
      
      // Convert to CMYK and calculate dot sizes
      const cmyk = RGBtoCMYK(r, g, b);
      const spotSizes = CMYKtoSpotSize(...cmyk, spotamp);
      
      // Store CMYK dots (K, C, M, Y order for proper layering)
      const dotPositions = [
        { x: X, y: Y - diff, size: spotSizes[3], color: black },
        { x: X - diff, y: Y, size: spotSizes[0], color: cyan },
        { x: X, y: Y + diff, size: spotSizes[1], color: magenta },
        { x: X + diff, y: Y, size: spotSizes[2], color: yellow }
      ];
      
      dotPositions.forEach(pos => {
        dots.push({
          x: pos.x,
          y: pos.y,
          baseSize: pos.size,
          color: pos.color,
          phase: Math.random() * Math.PI * 2
        });
      });
    }
  }
  
  initialized = true;
}

/**
 * Animation loop with mouse interaction
 */
function animate() {
  if (!canvas || !ctx || dots.length === 0) return;
  
  // Clear canvas
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
  
  ctx.globalCompositeOperation = 'screen';
  
  time += 0.01;
  
  // Draw each dot with animation
  dots.forEach(dot => {
    // Calculate mouse influence
    const dx = mouseX - dot.x;
    const dy = mouseY - dot.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const interactionRadius = 200;
    
    // Mouse interaction parameters
    let scale = 1;
    let offsetX = 0;
    let offsetY = 0;
    
    if (distance < interactionRadius) {
      const influence = 1 - distance / interactionRadius;
      scale = 1 + influence * 0.8; // Amplify near mouse
      offsetX = (distance > 0 ? (dx / distance) * influence * 15 : 0); // Repulsion
      offsetY = (distance > 0 ? (dy / distance) * influence * 15 : 0);
    }
    
    // Breathing animation with phase offset
    const breathing = Math.sin(time + dot.phase) * 0.15 + 1;
    
    // Calculate final size
    const finalSize = dot.baseSize * scale * breathing;
    
    // Draw dot if visible
    if (finalSize > 0.3) {
      ctx.fillStyle = dot.color;
      ctx.beginPath();
      ctx.arc(dot.x + offsetX, dot.y + offsetY, finalSize, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  
  // Continue animation loop if motion not reduced
  if (!reduceMotion) {
    requestAnimationFrame(animate);
  }
}

/**
 * Initialize on page load
 */
function init() {
  if (!initialized) {
    initHalftone();
    animate();
  }
}

/**
 * Handle window resize
 */
function handleResize() {
  initialized = false;
  init();
}

/**
 * Track mouse position
 */
function handleMouseMove(e) {
  mouseX = e.clientX;
  mouseY = e.clientY;
}

/**
 * Track touch position for mobile
 */
function handleTouchMove(e) {
  if (e.touches.length > 0) {
    mouseX = e.touches[0].clientX;
    mouseY = e.touches[0].clientY;
  }
}

// Button navigation
document.querySelectorAll('.control-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const target = btn.getAttribute('data-target');
    if (target) {
      window.location.href = target;
    }
  });
});

// Event listeners
if (canvas) {
  window.addEventListener('resize', handleResize);
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('touchmove', handleTouchMove);
  init();
}
