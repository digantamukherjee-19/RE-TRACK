/**
 * RE-TRACK — 3D Cybernetic Scene Controller
 * Pure Vanilla Three.js + WebGL
 * Preserves 100% of underlying application features & DOM
 */

import * as THREE from './vendor/three.module.js';

class Retrack3DExperience {
  constructor() {
    this.canvas = document.getElementById('webgl-canvas');
    if (!this.canvas) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.particles = null;
    this.torusKnot = null;
    this.outerRing = null;
    this.clock = new THREE.Clock();

    // Mouse interpolation target
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.scroll = { y: 0, targetY: 0 };
    this.theme = document.body.getAttribute('data-theme') || 'light';
    this.activeTab = 'home';

    this.init();
  }

  init() {
    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    this.camera.position.set(0, 0, 18);

    // 3. Renderer with antialiasing & alpha transparency
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // 4. Build 3D Elements
    this.createInteractiveParticleField();
    this.createGeometricMonolith();
    this.createLighting();

    // 5. Events
    this.bindEvents();

    // 6. Start Loop
    this.animate();
  }

  createLighting() {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(this.ambientLight);

    // Dynamic directional lights with cybernetic hues
    this.pointLight1 = new THREE.PointLight(0x6366f1, 3.5, 35);
    this.pointLight1.position.set(10, 8, 10);
    this.scene.add(this.pointLight1);

    this.pointLight2 = new THREE.PointLight(0x06b6d4, 3.0, 35);
    this.pointLight2.position.set(-10, -8, 8);
    this.scene.add(this.pointLight2);
  }

  createInteractiveParticleField() {
    const particleCount = 650;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const color1 = new THREE.Color(0x6366f1); // Indigo
    const color2 = new THREE.Color(0x06b6d4); // Cyan
    const color3 = new THREE.Color(0xa855f7); // Purple

    for (let i = 0; i < particleCount; i++) {
      // Cylindrical distribution around view axis
      const radius = 6 + Math.random() * 22;
      const theta = Math.random() * Math.PI * 2;
      const z = (Math.random() - 0.5) * 28;

      positions[i * 3] = Math.cos(theta) * radius;
      positions[i * 3 + 1] = Math.sin(theta) * radius;
      positions[i * 3 + 2] = z;

      // Color variation
      const mixedColor = color1.clone().lerp(Math.random() > 0.5 ? color2 : color3, Math.random());
      colors[i * 3] = mixedColor.r;
      colors[i * 3 + 1] = mixedColor.g;
      colors[i * 3 + 2] = mixedColor.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Custom circle particle texture created dynamically via Canvas
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(165, 180, 252, 0.8)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 0.28,
      vertexColors: true,
      map: texture,
      transparent: true,
      opacity: this.theme === 'dark' ? 0.75 : 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  createGeometricMonolith() {
    // Center holographic habit progress core
    this.monolithGroup = new THREE.Group();

    // Elegant Torus Knot representing unbroken habit loops
    const knotGeom = new THREE.TorusKnotGeometry(2.2, 0.45, 128, 32, 2, 3);
    const knotMat = new THREE.MeshPhysicalMaterial({
      color: 0x6366f1,
      emissive: 0x1e1b4b,
      roughness: 0.2,
      metalness: 0.8,
      wireframe: true,
      transparent: true,
      opacity: this.theme === 'dark' ? 0.25 : 0.12
    });

    this.torusKnot = new THREE.Mesh(knotGeom, knotMat);
    this.monolithGroup.add(this.torusKnot);

    // Concentric orbiting rings
    const ringGeom = new THREE.TorusGeometry(3.6, 0.04, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      wireframe: true,
      transparent: true,
      opacity: this.theme === 'dark' ? 0.35 : 0.18
    });
    this.outerRing = new THREE.Mesh(ringGeom, ringMat);
    this.monolithGroup.add(this.outerRing);

    const ringGeom2 = new THREE.TorusGeometry(4.4, 0.03, 16, 100);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      wireframe: true,
      transparent: true,
      opacity: this.theme === 'dark' ? 0.25 : 0.12
    });
    this.outerRing2 = new THREE.Mesh(ringGeom2, ringMat2);
    this.outerRing2.rotation.x = Math.PI / 3;
    this.monolithGroup.add(this.outerRing2);

    // Initial position aligned towards the right side of the desktop hero section
    this.updateMonolithPlacement();

    this.scene.add(this.monolithGroup);
  }

  updateMonolithPlacement() {
    if (!this.monolithGroup) return;

    const width = window.innerWidth;
    if (width < 768) {
      // Mobile: tucked behind center
      this.monolithGroup.position.set(0, 0, -6);
      this.monolithGroup.scale.set(0.7, 0.7, 0.7);
    } else if (this.activeTab === 'tracker') {
      // Tracker tab: centered subtly behind chart panel
      this.monolithGroup.position.set(-6, 0, -4);
      this.monolithGroup.scale.set(0.9, 0.9, 0.9);
    } else if (this.activeTab === 'list') {
      // List tab: floated right
      this.monolithGroup.position.set(6.5, 0.5, -4);
      this.monolithGroup.scale.set(0.85, 0.85, 0.85);
    } else {
      // Home tab: cinematic hero placement
      this.monolithGroup.position.set(6.0, 0, -3);
      this.monolithGroup.scale.set(1.05, 1.05, 1.05);
    }
  }

  bindEvents() {
    window.addEventListener('resize', () => this.onResize(), { passive: true });

    window.addEventListener('mousemove', (e) => {
      this.mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    }, { passive: true });

    window.addEventListener('scroll', () => {
      this.scroll.targetY = window.scrollY;
    }, { passive: true });

    // Listen for theme changes on body
    const observer = new MutationObserver(() => {
      const currentTheme = document.body.getAttribute('data-theme') || 'light';
      if (currentTheme !== this.theme) {
        this.theme = currentTheme;
        this.updateThemeVisuals();
      }
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });

    // Listen for navigation tab changes to shift 3D focal alignment
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabId = e.currentTarget.getAttribute('data-tab');
        if (tabId) {
          this.activeTab = tabId;
          this.transitionTab(tabId);
        }
      });
    });

    document.querySelectorAll('.quick-card').forEach(card => {
      card.addEventListener('click', () => {
        const jump = card.getAttribute('data-jump');
        if (jump) {
          this.activeTab = jump;
          this.transitionTab(jump);
        }
      });
    });
  }

  updateThemeVisuals() {
    const isDark = this.theme === 'dark';
    if (this.particles) {
      this.particles.material.opacity = isDark ? 0.75 : 0.4;
    }
    if (this.torusKnot) {
      this.torusKnot.material.opacity = isDark ? 0.25 : 0.1;
      this.torusKnot.material.color.setHex(isDark ? 0x6366f1 : 0x4f46e5);
    }
    if (this.outerRing) {
      this.outerRing.material.opacity = isDark ? 0.35 : 0.15;
    }
    if (this.outerRing2) {
      this.outerRing2.material.opacity = isDark ? 0.25 : 0.1;
    }
  }

  transitionTab(tabId) {
    if (typeof gsap !== 'undefined' && this.monolithGroup) {
      let targetX = 6.0;
      let targetY = 0;
      let targetRotY = this.monolithGroup.rotation.y + Math.PI * 0.5;

      if (tabId === 'tracker') {
        targetX = -6.5;
        targetY = 0.5;
      } else if (tabId === 'list') {
        targetX = 6.5;
        targetY = -0.5;
      }

      if (window.innerWidth < 768) {
        targetX = 0;
        targetY = 0;
      }

      gsap.to(this.monolithGroup.position, {
        x: targetX,
        y: targetY,
        duration: 1.2,
        ease: 'power3.out'
      });

      gsap.to(this.monolithGroup.rotation, {
        y: targetRotY,
        duration: 1.4,
        ease: 'power2.out'
      });
    } else {
      this.updateMonolithPlacement();
    }
  }

  onResize() {
    if (!this.camera || !this.renderer) return;
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.updateMonolithPlacement();
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // Smooth cursor inertia
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    // Rotate particle cloud subtly
    if (this.particles) {
      this.particles.rotation.y = elapsedTime * 0.02;
      this.particles.rotation.x = this.mouse.y * 0.1;
    }

    // Monolith mechanical orbit
    if (this.torusKnot) {
      this.torusKnot.rotation.x = elapsedTime * 0.35 + this.mouse.y * 0.2;
      this.torusKnot.rotation.y = elapsedTime * 0.45 + this.mouse.x * 0.2;
    }

    if (this.outerRing) {
      this.outerRing.rotation.z = -elapsedTime * 0.25;
      this.outerRing.rotation.y = elapsedTime * 0.15;
    }

    if (this.outerRing2) {
      this.outerRing2.rotation.z = elapsedTime * 0.2;
      this.outerRing2.rotation.x = -elapsedTime * 0.3;
    }

    // Gentle camera parallax
    this.camera.position.x = this.mouse.x * 0.8;
    this.camera.position.y = this.mouse.y * 0.8;
    this.camera.lookAt(0, 0, 0);

    this.renderer.render(this.scene, this.camera);
  }
}

// Instantiate on DOM load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new Retrack3DExperience());
} else {
  new Retrack3DExperience();
}
