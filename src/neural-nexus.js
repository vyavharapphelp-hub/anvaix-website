/* ═══════════════════════════════════════════════════════
   NEURAL NEXUS — 3D Background System v2
   Low-opacity wireframe mesh with extending connector rods.
   No glowing particles — only delicate connection lines.
   ═══════════════════════════════════════════════════════ */

import * as THREE from 'three';

// ── Configuration ──
const CONFIG = {
  // Sphere mesh
  nodeCount: 1200,
  sphereRadius: 5,
  connectionDistance: 0.9,
  maxConnections: 4000,

  // Extended rods (lines reaching outward across the page)
  rodCount: 40,
  rodMinLength: 6,
  rodMaxLength: 18,

  // Visuals — all very subtle
  lineColor: 0x00e5ff,
  lineOpacity: 0.07,
  rodOpacity: 0.04,

  // Motion
  rotationSpeed: { x: 0.0004, y: 0.0006, z: 0.00025 },
  breatheSpeed: 0.35,
  breatheAmplitude: 0.04,

  // Camera
  cameraZ: 14,
  containerOpacity: 0.45,

  // Mouse
  mouseInfluence: 0.25,
};

export class NeuralNexus {
  constructor(container) {
    this.container = container;
    this.isRunning = false;
    this.animationId = null;
    this.clock = new THREE.Clock();
    this.mouseNorm = { x: 0, y: 0 };

    this._init();
    this._buildWireframeSphere();
    this._buildExtendedRods();
    this._bindEvents();
    this.start();
  }

  // ══════════════════════════════════════
  // INITIALIZATION
  // ══════════════════════════════════════
  _init() {
    const { clientWidth: w, clientHeight: h } = this.container;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100);
    this.camera.position.z = CONFIG.cameraZ;

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);

    this.container.appendChild(this.renderer.domElement);

    // Main group for rotation + breathing
    this.nexusGroup = new THREE.Group();
    this.scene.add(this.nexusGroup);
  }

  // ══════════════════════════════════════
  // WIREFRAME SPHERE (connections only, no dots)
  // ══════════════════════════════════════
  _buildWireframeSphere() {
    const { nodeCount, sphereRadius, connectionDistance, maxConnections, lineColor, lineOpacity } = CONFIG;

    // Generate node positions using fibonacci sphere
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    const nodes = [];

    for (let i = 0; i < nodeCount; i++) {
      const theta = 2 * Math.PI * i / goldenRatio;
      const phi = Math.acos(1 - 2 * (i + 0.5) / nodeCount);
      const r = sphereRadius * (0.92 + Math.random() * 0.16);

      nodes.push(new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      ));
    }

    this.nodes = nodes;

    // Build connection lines between nearby nodes
    const linePositions = [];
    let count = 0;

    for (let i = 0; i < nodeCount && count < maxConnections; i++) {
      for (let j = i + 1; j < nodeCount && count < maxConnections; j++) {
        const dist = nodes[i].distanceTo(nodes[j]);
        if (dist < connectionDistance) {
          linePositions.push(
            nodes[i].x, nodes[i].y, nodes[i].z,
            nodes[j].x, nodes[j].y, nodes[j].z
          );
          count++;
        }
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));

    const material = new THREE.LineBasicMaterial({
      color: lineColor,
      transparent: true,
      opacity: lineOpacity,
      depthWrite: false,
    });

    this.wireframe = new THREE.LineSegments(geometry, material);
    this.nexusGroup.add(this.wireframe);
  }

  // ══════════════════════════════════════
  // EXTENDED RODS (reaching across the page)
  // ══════════════════════════════════════
  _buildExtendedRods() {
    const { rodCount, rodMinLength, rodMaxLength, lineColor, rodOpacity } = CONFIG;
    const rodPositions = [];

    for (let i = 0; i < rodCount; i++) {
      // Pick a random node on the sphere as start point
      const node = this.nodes[Math.floor(Math.random() * this.nodes.length)];

      // Direction = outward from center through the node, with slight random deviation
      const dir = node.clone().normalize();
      dir.x += (Math.random() - 0.5) * 0.3;
      dir.y += (Math.random() - 0.5) * 0.3;
      dir.z += (Math.random() - 0.5) * 0.3;
      dir.normalize();

      // Rod length
      const length = rodMinLength + Math.random() * (rodMaxLength - rodMinLength);

      // End point = node position + direction * length
      const end = node.clone().add(dir.multiplyScalar(length));

      rodPositions.push(
        node.x, node.y, node.z,
        end.x, end.y, end.z
      );
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(rodPositions, 3));

    // Custom shader for gradient fade-out along the rod
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(lineColor) },
        uOpacity: { value: rodOpacity },
        uTime: { value: 0 },
      },
      vertexShader: `
        varying float vAlpha;
        attribute float aAlpha;
        void main() {
          // Even vertices = start (on sphere), odd = end (far away)
          // We use position.length() to determine fade
          float dist = length(position);
          vAlpha = smoothstep(18.0, 4.0, dist); // fade out as they go farther
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform float uTime;
        varying float vAlpha;
        void main() {
          float pulse = 0.6 + 0.4 * sin(uTime * 0.5 + vAlpha * 6.28);
          gl_FragColor = vec4(uColor, vAlpha * uOpacity * pulse);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.rods = new THREE.LineSegments(geometry, material);
    this.nexusGroup.add(this.rods);
  }

  // ══════════════════════════════════════
  // ANIMATION LOOP
  // ══════════════════════════════════════
  _animate() {
    if (!this.isRunning) return;
    this.animationId = requestAnimationFrame(() => this._animate());

    const elapsed = this.clock.getElapsedTime();
    const { rotationSpeed, breatheSpeed, breatheAmplitude, mouseInfluence } = CONFIG;

    // ── Continuous 360° multi-axis rotation ──
    this.nexusGroup.rotation.x += rotationSpeed.x;
    this.nexusGroup.rotation.y += rotationSpeed.y;
    this.nexusGroup.rotation.z += rotationSpeed.z;

    // ── Mouse-influenced gentle tilt ──
    const targetTiltX = this.mouseNorm.y * mouseInfluence;
    const targetTiltY = this.mouseNorm.x * mouseInfluence;
    this.nexusGroup.rotation.x += (targetTiltX - Math.sin(this.nexusGroup.rotation.x)) * 0.001;
    this.nexusGroup.rotation.y += (targetTiltY - Math.sin(this.nexusGroup.rotation.y)) * 0.001;

    // ── Breathing pulse ──
    const breathe = 1 + Math.sin(elapsed * breatheSpeed) * breatheAmplitude;
    this.nexusGroup.scale.setScalar(breathe);

    // ── Subtle wireframe opacity pulse ──
    this.wireframe.material.opacity = CONFIG.lineOpacity * (0.75 + Math.sin(elapsed * 0.6) * 0.25);

    // ── Rod time uniform for pulsing ──
    if (this.rods.material.uniforms) {
      this.rods.material.uniforms.uTime.value = elapsed;
    }

    this.renderer.render(this.scene, this.camera);
  }

  // ══════════════════════════════════════
  // EVENT HANDLERS
  // ══════════════════════════════════════
  _bindEvents() {
    this._resizeHandler = this._debounce(() => this._onResize(), 150);
    window.addEventListener('resize', this._resizeHandler);

    this._mouseMoveHandler = (e) => {
      this.mouseNorm.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouseNorm.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('mousemove', this._mouseMoveHandler, { passive: true });

    this._visibilityHandler = () => {
      if (document.hidden) {
        this.stop();
      } else {
        this.start();
      }
    };
    document.addEventListener('visibilitychange', this._visibilityHandler);
  }

  _onResize() {
    const { clientWidth: w, clientHeight: h } = this.container;
    if (w === 0 || h === 0) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  // ══════════════════════════════════════
  // LIFECYCLE
  // ══════════════════════════════════════
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.clock.start();
    this._animate();
  }

  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  dispose() {
    this.stop();
    window.removeEventListener('resize', this._resizeHandler);
    window.removeEventListener('mousemove', this._mouseMoveHandler);
    document.removeEventListener('visibilitychange', this._visibilityHandler);

    this.wireframe.geometry.dispose();
    this.wireframe.material.dispose();
    this.rods.geometry.dispose();
    this.rods.material.dispose();
    this.renderer.dispose();

    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }

  _debounce(fn, delay) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }
}
