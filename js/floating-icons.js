// Floating and rotating food icons animation

const icons = [
  { src: 'images/icons/Apple.png', alt: 'Apple', url: '#', title: 'Data, Audience and Proof of Concept' },
  { src: 'images/icons/Broccoli.png', alt: 'Broccoli', url: '#', title: 'Methods' },
  { src: 'images/icons/Carrot.png', alt: 'Carrot', url: '#', title: 'Precedent and References' },
  { src: 'images/icons/Cherries.png', alt: 'Cherries', url: '#', title: 'Project Overview' },
  { src: 'images/icons/Pear.png', alt: 'Pear', url: '#', title: 'Conceptual Framework' }
];

// Function to check if two circles overlap
function isOverlapping(x1, y1, r1, x2, y2, r2, padding = 30) {
  const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  return distance < (r1 + r2 + padding);
}

// Generate non-overlapping positions with better randomization
function generateNonOverlappingPositions(count, viewportWidth, viewportHeight) {
  const positions = [];
  const maxAttempts = 200;
  const iconSize = 120; // Fixed size for all icons
  
  for (let i = 0; i < count; i++) {
    let placed = false;
    let attempts = 0;
    
    while (!placed && attempts < maxAttempts) {
      const radius = iconSize / 2;
      
      // Constrain to center area (20-80% of viewport) to avoid corner text
      const marginX = 20 + Math.random() * 5; // 20-25% margin
      const marginY = 20 + Math.random() * 5; // 20-25% margin
      const x = marginX + Math.random() * (100 - 2 * marginX);
      const y = marginY + Math.random() * (100 - 2 * marginY);
      
      // Check overlap with existing positions
      let overlaps = false;
      for (const pos of positions) {
        if (isOverlapping(x, y, radius, pos.x, pos.y, pos.size / 2)) {
          overlaps = true;
          break;
        }
      }
      
      if (!overlaps) {
        positions.push({ x, y, size: iconSize });
        placed = true;
      }
      
      attempts++;
    }
    
    // If couldn't place after max attempts, try a grid-based fallback
    if (!placed) {
      const cols = Math.ceil(Math.sqrt(count));
      const row = Math.floor(i / cols);
      const col = i % cols;
      const spacing = 60 / cols;
      
      positions.push({
        x: 20 + col * spacing + Math.random() * 5,
        y: 20 + row * spacing + Math.random() * 5,
        size: iconSize
      });
    }
  }
  
  return positions;
}

function initFloatingIcons() {
  const container = document.getElementById('floating-icons-container');
  if (!container) return;

  // Generate non-overlapping positions
  const positions = generateNonOverlappingPositions(icons.length, window.innerWidth, window.innerHeight);

  icons.forEach((icon, index) => {
    // Create anchor element
    const link = document.createElement('a');
    link.href = icon.url;
    link.className = 'floating-icon';
    link.title = icon.title; // Add tooltip text
    
    // Create image element
    const img = document.createElement('img');
    img.src = icon.src;
    img.alt = icon.alt;
    
    link.appendChild(img);
    container.appendChild(link);

    const pos = positions[index];
    
    link.style.left = `${pos.x}%`;
    link.style.top = `${pos.y}%`;

    // Random animation parameters
    const floatDuration = 15 + Math.random() * 15; // 15-30 seconds
    const rotateDuration = 10 + Math.random() * 10; // 10-20 seconds
    const floatDelay = Math.random() * 5; // 0-5 seconds delay
    const rotateDelay = Math.random() * 3; // 0-3 seconds delay
    
    // Random float distance and direction (smaller to prevent overlap)
    const floatX = (Math.random() - 0.5) * 60; // -30 to 30
    const floatY = (Math.random() - 0.5) * 60; // -30 to 30
    
    // Random rotation direction
    const rotateDirection = Math.random() > 0.5 ? 1 : -1;
    const rotateDegrees = rotateDirection * (180 + Math.random() * 180); // 180-360 degrees
    
    // Apply custom CSS variables for animations
    link.style.setProperty('--float-x', `${floatX}px`);
    link.style.setProperty('--float-y', `${floatY}px`);
    link.style.setProperty('--rotate-deg', `${rotateDegrees}deg`);
    link.style.setProperty('--float-duration', `${floatDuration}s`);
    link.style.setProperty('--rotate-duration', `${rotateDuration}s`);
    link.style.setProperty('--float-delay', `${floatDelay}s`);
    link.style.setProperty('--rotate-delay', `${rotateDelay}s`);
    link.style.setProperty('--icon-size', `${pos.size}px`);
    
    // Make draggable
    makeDraggable(link);
  });
}

// Draggable functionality
function makeDraggable(element) {
  let isDragging = false;
  let startX, startY, initialLeft, initialTop;
  
  element.addEventListener('mousedown', (e) => {
    if (e.target.tagName === 'A' || e.target.tagName === 'IMG') {
      e.preventDefault();
      isDragging = true;
      
      // Pause animations while dragging
      element.style.animationPlayState = 'paused';
      
      startX = e.clientX;
      startY = e.clientY;
      
      // Get current position
      const computedStyle = window.getComputedStyle(element);
      initialLeft = parseFloat(computedStyle.left);
      initialTop = parseFloat(computedStyle.top);
      
      element.style.cursor = 'grabbing';
    }
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    e.preventDefault();
    
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    
    element.style.left = `${initialLeft + deltaX}px`;
    element.style.top = `${initialTop + deltaY}px`;
  });
  
  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      
      // Resume animations
      element.style.animationPlayState = 'running';
      element.style.cursor = '';
    }
  });
  
  // Prevent default link behavior when dragging
  element.addEventListener('click', (e) => {
    if (Math.abs(e.clientX - startX) > 5 || Math.abs(e.clientY - startY) > 5) {
      e.preventDefault();
    }
  });
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFloatingIcons);
} else {
  initFloatingIcons();
}
