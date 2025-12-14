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
 * Create text-based pattern
 */
function createTextPattern(text, width, height) {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d');
  
  tempCtx.fillStyle = '#ffffff';
  tempCtx.fillRect(0, 0, width, height);
  
  tempCtx.fillStyle = '#000000';
  tempCtx.font = 'bold ' + Math.floor(height * 0.15) + 'px sans-serif';
  tempCtx.textAlign = 'center';
  tempCtx.textBaseline = 'middle';
  tempCtx.fillText(text, width / 2, height / 2);
  
  return tempCtx.getImageData(0, 0, width, height);
}

/**
 * Apply dithering algorithm
 */
function applyDithering(imageData) {
  const width = imageData.width;
  const height = imageData.height;
  const pixels = new Array(width * height);
  
  // Convert to grayscale array
  for (let i = 0; i < pixels.length; i++) {
    const r = imageData.data[i * 4];
    const g = imageData.data[i * 4 + 1];
    const b = imageData.data[i * 4 + 2];
    pixels[i] = (r + g + b) / 3;
  }
  
  // Apply Floyd-Steinberg dithering
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = x + y * width;
      const oldPixel = pixels[idx];
      const newPixel = oldPixel > 128 ? 255 : 0;
      const error = oldPixel - newPixel;
      
      pixels[idx] = newPixel;
      
      // Distribute error
      pixels[idx + 1] += error * 7 / 16;
      pixels[idx - 1 + width] += error * 3 / 16;
      pixels[idx + width] += error * 5 / 16;
      pixels[idx + 1 + width] += error * 1 / 16;
      
      // Random white pixels for texture
      if (Math.floor(Math.random() * 20) === 0) {
        pixels[idx] = 255;
      }
    }
  }
  
  return pixels;
}

/**
 * Initialize particle patterns from text
 */
function initializePatterns() {
  if (!canvas) return;
  
  const w = Math.min(window.innerWidth, 800);
  const h = Math.min(window.innerHeight, 600);
  
  // Create two text patterns
  const pattern1 = createTextPattern('URBAN', w, h);
  const pattern2 = createTextPattern('FOOD', w, h);
  
  // Apply dithering
  const dithered1 = applyDithering(pattern1);
  const dithered2 = applyDithering(pattern2);
  
  // Clear previous particles
  particles = [];
  state1 = [];
  state2 = [];
  
  const scale = Math.min(window.innerWidth / w, window.innerHeight / h);
  const offsetX = (window.innerWidth - w * scale) / 2;
  const offsetY = (window.innerHeight - h * scale) / 2;
  
  // Create particles from first pattern
  for (let i = 0; i < dithered1.length; i++) {
    if (dithered1[i] === 0) {
      const x = (i % w) * scale + offsetX;
      const y = Math.floor(i / w) * scale + offsetY;
      state1.push({ x, y });
    }
  }
  
  // Create particles from second pattern
  for (let i = 0; i < dithered2.length; i++) {
    if (dithered2[i] === 0) {
      const x = (i % w) * scale + offsetX;
      const y = Math.floor(i / w) * scale + offsetY;
      state2.push({ x, y });
    }
  }
  
  // Initialize particles at first state
  const maxParticles = Math.min(state1.length, state2.length, 8000);
  for (let i = 0; i < maxParticles; i++) {
    if (state1[i]) {
      particles.push(new Grain(state1[i].x, state1[i].y));
    }
  }
  
  frameCount = 0;
}

/**
 * Main animation loop
 */
function draw() {
  if (!canvas || !ctx || particles.length === 0) return;
  
  // Background
  ctx.fillStyle = '#1d1d1b';
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
  
  // Animation sequence
  if (frameCount < 60) {
    // Phase 1: Show initial state
    for (let i = 0; i < particles.length; i++) {
      particles[i].show();
    }
  } else if (frameCount < 180) {
    // Phase 2: Apply wind force (disperse)
    if (!reduceMotion) {
      for (let i = 0; i < particles.length; i++) {
        particles[i].applyForce(particles[i].wind);
        particles[i].update();
        particles[i].show();
      }
    } else {
      for (let i = 0; i < particles.length; i++) {
        particles[i].show();
      }
    }
  } else if (frameCount < 400) {
    // Phase 3: Attract to second state
    if (!reduceMotion) {
      for (let i = 0; i < particles.length; i++) {
        const targetIdx = Math.min(i, state2.length - 1);
        if (state2[targetIdx] && particles[i].dist(state2[targetIdx]) > 2) {
          particles[i].applyForce(particles[i].attractionBy({ pos: state2[targetIdx] }));
          particles[i].update();
        }
        particles[i].show();
      }
    } else {
      for (let i = 0; i < particles.length; i++) {
        particles[i].show();
      }
    }
  } else if (frameCount < 460) {
    // Phase 4: Hold second state
    for (let i = 0; i < particles.length; i++) {
      particles[i].show();
    }
  } else if (frameCount < 580) {
    // Phase 5: Disperse again
    if (!reduceMotion) {
      for (let i = 0; i < particles.length; i++) {
        particles[i].applyForce({
          x: (Math.random() - 0.5) * 0.8,
          y: (Math.random() - 0.5) * 0.8
        });
        particles[i].update();
        particles[i].show();
      }
    } else {
      for (let i = 0; i < particles.length; i++) {
        particles[i].show();
      }
    }
  } else if (frameCount < 800) {
    // Phase 6: Return to first state
    if (!reduceMotion) {
      for (let i = 0; i < particles.length; i++) {
        const targetIdx = Math.min(i, state1.length - 1);
        if (state1[targetIdx] && particles[i].dist(state1[targetIdx]) > 2) {
          particles[i].applyForce(particles[i].attractionBy({ pos: state1[targetIdx] }));
          particles[i].update();
        }
        particles[i].show();
      }
    } else {
      for (let i = 0; i < particles.length; i++) {
        particles[i].show();
      }
    }
  } else {
    // Reset animation
    frameCount = 0;
  }
  
  frameCount++;
  requestAnimationFrame(draw);
}

// Only draw if canvas exists (homepage)
if (canvas) {
  draw();
}


