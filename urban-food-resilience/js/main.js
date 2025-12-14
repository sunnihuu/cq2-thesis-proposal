/*
INTERACTION: Particle Morphing Background

Core functionality:
- Particle-based image morphing
- Wind force and attraction physics
- Dithering algorithm for image processing
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

let frameCount = 0;
let particles = [];
let state1 = [];
let state2 = [];
let currentState = 0;

// Particle class
class Grain {
  constructor(x, y) {
    this.pos = { x, y };
    this.target = { x, y };
    this.vel = { x: 0, y: 0 };
    this.acc = { x: 0, y: 0 };
    this.wind = {
      x: (Math.random() - 0.5) * 0.8,
      y: (Math.random() - 0.5) * 0.8
    };
    this.size = 2;
  }

  applyForce(force) {
    this.acc.x += force.x;
    this.acc.y += force.y;
  }

  attractionBy(target) {
    const dx = target.pos.x - this.pos.x;
    const dy = target.pos.y - this.pos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < 1) return { x: 0, y: 0 };
    
    const strength = 0.05;
    return {
      x: (dx / dist) * strength,
      y: (dy / dist) * strength
    };
  }

  update() {
    this.vel.x += this.acc.x;
    this.vel.y += this.acc.y;
    
    // Damping
    this.vel.x *= 0.95;
    this.vel.y *= 0.95;
    
    this.pos.x += this.vel.x;
    this.pos.y += this.vel.y;
    
    this.acc.x = 0;
    this.acc.y = 0;
  }

  show() {
    ctx.fillStyle = '#f2f2e7';
    ctx.fillRect(this.pos.x, this.pos.y, this.size, this.size);
  }

  dist(other) {
    const dx = this.pos.x - other.x;
    const dy = this.pos.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

/**
 * Set up canvas for high DPI displays
 */
function resize() {
  if (!canvas) return;
  const dpr = 1; // Use 1 for better particle performance
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  
  initializePatterns();
}

window.addEventListener("resize", resize);
resize();

/**
 * Random number generator
 */
function random(min, max) {
  if (max === undefined) {
    max = min;
    min = 0;
  }
  return Math.random() * (max - min) + min;
}

/**
 * Initialize the grid pattern
 */
function initializePattern() {
  if (!canvas) return;
  
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = window.innerWidth;
  tempCanvas.height = window.innerHeight;
  const tempCtx = tempCanvas.getContext('2d');
  
  const num = 10;
  const w = window.innerWidth / num;
  
  // Draw checkered pattern with random variations
  for (let i = 0; i < num; i++) {
    for (let j = 0; j < num; j++) {
      const x = i * w;
      const y = j * w;
      
      if ((i % 2 === 0 && j % 2 === 0) || (i % 2 === 1 && j % 2 === 1)) {
        if (random(1) < 0.5) {
          tempCtx.fillStyle = '#ffffff';
        } else {
          tempCtx.fillStyle = '#dcdcdc';
        }
      } else {
        if (random(1) < 0.5) {
          tempCtx.fillStyle = '#000000';
        } else {
          tempCtx.fillStyle = '#F3EEEA';
        }
      }
      tempCtx.fillRect(x, y, w, w);
    }
  }
  
  // Add fine grid overlay
  drawGridOverlay(tempCtx, 100, 0.5);
  
  // Add stripe overlay
  drawStripeOverlay(tempCtx, 100, 0.5);
  
  gridPattern = tempCanvas;
}

/**
 * Draw grid overlay
 */
function drawGridOverlay(ctx, num, size) {
  const w = window.innerWidth / num;
  const w2 = w * size;
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  for (let i = 0; i < num; i++) {
    for (let j = 0; j < num; j++) {
      const x = i * w + w / 2;
      const y = j * w + w / 2;
      ctx.fillRect(x - w2 / 2, y - w2 / 2, w2, w2);
    }
  }
}

/**
 * Draw stripe overlay
 */
function drawStripeOverlay(ctx, num, size) {
  const w = window.innerWidth / num;
  const w2 = w * size;
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  for (let j = 0; j < num; j++) {
    const y = j * w + w / 2;
    ctx.fillRect(0, y - w2 / 2, window.innerWidth, w2);
  }
}

/**
 * Apply glitch effect
 */
function applyGlitchEffect() {
  if (!canvas || !ctx || !gridPattern) return;
  
  const imageData = ctx.getImageData(0, 0, window.innerWidth, window.innerHeight);
  const data = imageData.data;
  
  // Only apply glitch if motion is enabled and after initial delay
  if (!reduceMotion && frameCount > 200) {
    const time = frameCount / 200;
    const blocks = 64;
    
    for (let y = 0; y < window.innerHeight; y++) {
      // Calculate offset for this row
      const blockY = Math.floor(y / (window.innerHeight / blocks));
      const offset = (Math.sin(time + blockY) * 0.03 * window.innerWidth) | 0;
      
      if (Math.abs(offset) > 1) {
        for (let x = 0; x < window.innerWidth; x++) {
          const srcX = Math.max(0, Math.min(window.innerWidth - 1, x + offset));
          const srcIdx = (y * window.innerWidth + srcX) * 4;
          const dstIdx = (y * window.innerWidth + x) * 4;
          
          // RGB channel shift
          if (dstIdx + 3 < data.length && srcIdx + 3 < data.length) {
            data[dstIdx] = data[srcIdx]; // R
            data[dstIdx + 1] = data[srcIdx + 1]; // G
            data[dstIdx + 2] = data[srcIdx + 2]; // B
          }
        }
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  }
}

/**
 * Add white noise with grain effect
 */
function addNoise() {
  if (!canvas || !ctx) return;
  
  const imageData = ctx.getImageData(0, 0, window.innerWidth, window.innerHeight);
  const data = imageData.data;
  
  // Animated noise strength
  const baseNoise = 8;
  const animatedNoise = Math.sin(frameCount * 0.05) * 5;
  const noiseStrength = baseNoise + animatedNoise;
  
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() * 2 - 1) * noiseStrength;
    data[i] += noise;     // R
    data[i + 1] += noise; // G
    data[i + 2] += noise; // B
  }
  
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Apply blur effect around mouse
 */
function applyMouseBlur() {
  if (!canvas || !ctx) return;
  
  // Smooth mouse movement
  mouse.x += (mouse.targetX - mouse.x) * 0.1;
  mouse.y += (mouse.targetY - mouse.y) * 0.1;
  
  // Create radial gradient for blur mask
  const radius = 200;
  const dx = mouse.x - mouse.targetX;
  const dy = mouse.y - mouse.targetY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Scale effect based on mouse movement speed
  const targetScale = 1 + Math.min(distance * 0.01, 0.3);
  mouseScale += (targetScale - mouseScale) * 0.1;
  
  if (mouse.x > 0 && mouse.y > 0) {
    // Save current state
    ctx.save();
    
    // Apply subtle blur by drawing multiple offset copies
    ctx.globalAlpha = 0.15;
    const blurRadius = 3;
    
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
      const offsetX = Math.cos(angle) * blurRadius;
      const offsetY = Math.sin(angle) * blurRadius;
      
      ctx.drawImage(
        canvas,
        mouse.x - radius + offsetX,
        mouse.y - radius + offsetY,
        radius * 2,
        radius * 2,
        mouse.x - radius,
        mouse.y - radius,
        radius * 2,
        radius * 2
      );
    }
    
    ctx.restore();
  }
}

/**
 * Draw interactive elements around mouse
 */
function drawMouseInteraction() {
  if (!canvas || !ctx || mouse.x < 0) return;
  
  const radius = 150 * mouseScale;
  
  // Draw pulsing circle
  ctx.save();
  
  // Outer glow
  const gradient = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, radius);
  gradient.addColorStop(0, 'rgba(255, 176, 0, 0.1)');
  gradient.addColorStop(0.5, 'rgba(255, 176, 0, 0.05)');
  gradient.addColorStop(1, 'rgba(255, 176, 0, 0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(mouse.x - radius, mouse.y - radius, radius * 2, radius * 2);
  
  // Inner circle with scale animation
  const pulse = Math.sin(frameCount * 0.05) * 0.1 + 1;
  const innerRadius = 40 * mouseScale * pulse;
  
  ctx.strokeStyle = 'rgba(255, 176, 0, 0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(mouse.x, mouse.y, innerRadius, 0, Math.PI * 2);
  ctx.stroke();
  
  // Distortion effect on grid
  applyGridDistortion();
  
  ctx.restore();
}

/**
 * Apply distortion to grid around mouse
 */
function applyGridDistortion() {
  if (!gridPattern || !ctx) return;
  
  const distortionRadius = 100;
  const distortionStrength = 15 * (mouseScale - 1);
  
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) {
    const distance = distortionRadius * (0.5 + Math.random() * 0.5);
    const offsetX = Math.cos(angle + frameCount * 0.02) * distance;
    const offsetY = Math.sin(angle + frameCount * 0.02) * distance;
    
    const x = mouse.x + offsetX;
    const y = mouse.y + offsetY;
    
    const dx = x - mouse.x;
    const dy = y - mouse.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < distortionRadius) {
      const force = (1 - dist / distortionRadius) * distortionStrength;
      const pushX = (dx / dist) * force;
      const pushY = (dy / dist) * force;
      
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.translate(pushX, pushY);
      
      const size = 10 + Math.random() * 10;
      ctx.fillStyle = '#ffb000';
      ctx.fillRect(x - size / 2, y - size / 2, size, size);
      
      ctx.restore();
    }
  }
}

/**
 * Main animation loop
 */
function draw() {
  if (!canvas || !ctx || !gridPattern) return;
  
  // Draw base pattern
  ctx.fillStyle = '#1d1d1b';
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
  ctx.drawImage(gridPattern, 0, 0);
  
  // Apply glitch effect after initial delay
  if (frameCount > 200 && !reduceMotion) {
    applyGlitchEffect();
  }
  
  // Add mouse interaction effects
  if (!reduceMotion) {
    drawMouseInteraction();
    applyMouseBlur();
  }
  
  // Add animated noise
  addNoise();
  
  // Add vignette effect
  const gradient = ctx.createRadialGradient(
    window.innerWidth / 2,
    window.innerHeight / 2,
    0,
    window.innerWidth / 2,
    window.innerHeight / 2,
    Math.max(window.innerWidth, window.innerHeight) * 0.7
  );
  gradient.addColorStop(0, 'rgba(29, 29, 27, 0)');
  gradient.addColorStop(1, 'rgba(29, 29, 27, 0.4)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
  
  frameCount++;
  requestAnimationFrame(draw);
}

// Only draw if canvas exists (homepage)
if (canvas) {
  draw();
}


