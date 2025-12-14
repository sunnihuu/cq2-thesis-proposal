import * as THREE from 'three';

let container;
let camera, scene, renderer, parentTransform;

const pointer = new THREE.Vector2();
const radius = 100;
let theta = 0;
let lineObjects = [];

init();

function init() {
  container = document.getElementById('three-container');

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 10000);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff); // White background to match your site

  const lineGeometry = new THREE.BufferGeometry();
  const points = [];

  const point = new THREE.Vector3();
  const direction = new THREE.Vector3();

  for (let i = 0; i < 50; i++) {
    direction.x += Math.random() - 0.5;
    direction.y += Math.random() - 0.5;
    direction.z += Math.random() - 0.5;
    direction.normalize().multiplyScalar(10);

    point.add(direction);
    points.push(point.x, point.y, point.z);
  }

  lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));

  parentTransform = new THREE.Object3D();
  parentTransform.position.x = Math.random() * 40 - 20;
  parentTransform.position.y = Math.random() * 40 - 20;
  parentTransform.position.z = Math.random() * 40 - 20;

  parentTransform.rotation.x = Math.random() * 2 * Math.PI;
  parentTransform.rotation.y = Math.random() * 2 * Math.PI;
  parentTransform.rotation.z = Math.random() * 2 * Math.PI;

  parentTransform.scale.x = Math.random() + 0.5;
  parentTransform.scale.y = Math.random() + 0.5;
  parentTransform.scale.z = Math.random() + 0.5;

  // Create black and white lines
  for (let i = 0; i < 50; i++) {
    let object;

    // Random grayscale colors
    const grayValue = Math.floor(Math.random() * 100); // 0-100 for darker tones
    const color = (grayValue << 16) | (grayValue << 8) | grayValue;
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: color,
      opacity: 0.6,
      transparent: true
    });

    if (Math.random() > 0.5) {
      object = new THREE.Line(lineGeometry, lineMaterial);
    } else {
      object = new THREE.LineSegments(lineGeometry, lineMaterial);
    }

    object.position.x = Math.random() * 400 - 200;
    object.position.y = Math.random() * 400 - 200;
    object.position.z = Math.random() * 400 - 200;

    object.rotation.x = Math.random() * 2 * Math.PI;
    object.rotation.y = Math.random() * 2 * Math.PI;
    object.rotation.z = Math.random() * 2 * Math.PI;

    const baseScale = Math.random() + 0.5;
    object.scale.x = baseScale;
    object.scale.y = baseScale;
    object.scale.z = baseScale;
    
    // Store base scale for animation
    object.userData.baseScale = baseScale;

    parentTransform.add(object);
    lineObjects.push(object);
  }

  scene.add(parentTransform);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  container.appendChild(renderer.domElement);

  document.addEventListener('pointermove', onPointerMove);
  window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onPointerMove(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function animate() {
  render();
}

function render() {
  theta += 0.1;

  camera.position.x = radius * Math.sin(THREE.MathUtils.degToRad(theta));
  camera.position.y = radius * Math.sin(THREE.MathUtils.degToRad(theta));
  camera.position.z = radius * Math.cos(THREE.MathUtils.degToRad(theta));
  camera.lookAt(scene.position);

  camera.updateMatrixWorld();

  // Animate lines based on cursor position
  lineObjects.forEach((line, index) => {
    // Project line position to screen space
    const screenPos = line.position.clone();
    screenPos.project(camera);
    
    // Calculate distance from cursor to line in screen space
    const dx = screenPos.x - pointer.x;
    const dy = screenPos.y - pointer.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Scale based on distance (closer = bigger, farther = smaller)
    const baseScale = line.userData.baseScale;
    let scaleFactor;
    
    if (distance < 0.5) {
      // Close to cursor - make bigger
      scaleFactor = 1 + (0.5 - distance) * 2; // Scale up to 2x
    } else if (distance < 1.0) {
      // Medium distance - normal to slightly smaller
      scaleFactor = 1 - (distance - 0.5) * 0.6; // Scale down to 0.7x
    } else {
      // Far from cursor - smaller
      scaleFactor = 0.4;
    }
    
    // Smooth transition
    const targetScale = baseScale * scaleFactor;
    line.scale.x += (targetScale - line.scale.x) * 0.1;
    line.scale.y += (targetScale - line.scale.y) * 0.1;
    line.scale.z += (targetScale - line.scale.z) * 0.1;
    
    // Also adjust opacity based on scale
    line.material.opacity = 0.3 + (scaleFactor * 0.3);
  });

  renderer.render(scene, camera);
}
