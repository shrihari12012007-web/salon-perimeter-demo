/**
 * ============================================================================
 * SRINIDHI EYE CARE & OPTICALS — CLIENT APPLICATION LOGIC
 * Peerzad Street, Vidya Nagar, Gangavathi, Karnataka - 583227
 * Phone: +91 87628 88866
 * ============================================================================
 */

(function () {
  'use strict';

  const config = window.SRINIDHI_CONFIG || {
    API_BASE_URL: 'http://localhost:5000'
  };

  const API_URL = `${config.API_BASE_URL}/api/appointments`;

  // ==========================================================================
  // 1. MOBILE DRAWER NAVIGATION
  // ==========================================================================
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const mobileLinks = document.querySelectorAll('.mobile-link');

  if (mobileMenuBtn && mobileDrawer) {
    mobileMenuBtn.addEventListener('click', () => {
      const isOpen = mobileDrawer.classList.toggle('open');
      mobileMenuBtn.setAttribute('aria-expanded', isOpen);
    });

    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileDrawer.classList.remove('open');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ==========================================================================
  // 2. THE 360-DEGREE INTERACTIVE SPECTACLES 3D ENGINE (THREE.JS)
  // ==========================================================================
  const spectCanvas = document.getElementById('spect360Canvas');
  const spectStage = document.getElementById('spectStage');
  const degSlider = document.getElementById('degSlider');
  const autoSpinBtn = document.getElementById('autoSpinBtn');
  const angleBtns = document.querySelectorAll('.spect-angle-btn');
  const ctrlBtns = document.querySelectorAll('.ctrl-btn');

  let spect3D = {
    renderer: null,
    scene: null,
    camera: null,
    controls: null,
    glassesGroup: null,
    leftLens: null,
    rightLens: null,
    isAutoSpin: true,        // Smoothly rotates automatically by default
    userWantsAutoSpin: true, // Resume auto-spinning after user interaction
    materials: {}
  };

  let autoSpinResumeTimer = null;
  const outerPantoPts = [
    [-0.7955,0.6818],[-0.7132,0.6898],[-0.6208,0.6966],[-0.5201,0.7022],[-0.4126,0.7065],
    [-0.3001,0.7095],[-0.1842,0.7109],[-0.0666,0.7108],[0.0511,0.7091],[0.1672,0.7057],
    [0.2801,0.7005],[0.388,0.6934],[0.4893,0.6844],[0.5824,0.6733],[0.6656,0.6602],
    [0.7371,0.6449],[0.7955,0.6273],[0.8278,0.6138],[0.8566,0.5972],[0.8821,0.5778],
    [0.9044,0.5557],[0.9237,0.531],[0.9401,0.5039],[0.9537,0.4746],[0.9648,0.4432],
    [0.9734,0.4099],[0.9797,0.3748],[0.9838,0.3381],[0.9859,0.3],[0.9862,0.2606],
    [0.9847,0.2201],[0.9817,0.1786],[0.9773,0.1364],[0.9666,0.0602],[0.9513,-0.0145],
    [0.9313,-0.0874],[0.9062,-0.1582],[0.8758,-0.2266],[0.8398,-0.2922],[0.798,-0.3547],
    [0.75,-0.4136],[0.6956,-0.4688],[0.6346,-0.5197],[0.5666,-0.5661],[0.4915,-0.6077],
    [0.4089,-0.644],[0.3185,-0.6748],[0.2202,-0.6996],[0.1136,-0.7182],[0.005,-0.7271],
    [-0.0992,-0.7268],[-0.1987,-0.7179],[-0.2933,-0.7006],[-0.3829,-0.6754],[-0.4672,-0.6428],
    [-0.5461,-0.6031],[-0.6193,-0.5568],[-0.6867,-0.5044],[-0.748,-0.4462],[-0.803,-0.3826],
    [-0.8516,-0.3142],[-0.8935,-0.2413],[-0.9285,-0.1643],[-0.9565,-0.0838],[-0.9773,-0.0],
    [-0.9849,0.0511],[-0.9907,0.102],[-0.9945,0.1525],[-0.9962,0.2024],[-0.9955,0.2515],
    [-0.9925,0.2996],[-0.9868,0.3465],[-0.9784,0.392],[-0.9671,0.436],[-0.9529,0.4781],
    [-0.9354,0.5182],[-0.9146,0.5561],[-0.8904,0.5916],[-0.8626,0.6246],[-0.831,0.6547]
  ];

  const innerPantoPts = [
    [-0.7227,0.5727],[-0.6559,0.5807],[-0.579,0.5876],[-0.4938,0.5933],[-0.4017,0.5977],
    [-0.3043,0.6009],[-0.2031,0.6028],[-0.0996,0.6032],[0.0045,0.6023],[0.1078,0.5998],
    [0.2087,0.5958],[0.3057,0.5902],[0.3972,0.583],[0.4816,0.574],[0.5575,0.5633],
    [0.6232,0.5508],[0.6773,0.5364],[0.7017,0.5251],[0.7238,0.5118],[0.7437,0.4965],
    [0.7615,0.4793],[0.7772,0.4603],[0.7909,0.4395],[0.8026,0.4171],[0.8125,0.3932],
    [0.8206,0.3677],[0.8269,0.3409],[0.8315,0.3127],[0.8345,0.2832],[0.836,0.2526],
    [0.836,0.2209],[0.8346,0.1882],[0.8318,0.1545],[0.8231,0.09],[0.8103,0.0263],
    [0.7933,-0.0363],[0.7719,-0.0974],[0.7459,-0.1568],[0.7152,-0.214],[0.6795,-0.2686],
    [0.6386,-0.3205],[0.5925,-0.3691],[0.5408,-0.4142],[0.4834,-0.4554],[0.4202,-0.4923],
    [0.3508,-0.5247],[0.2752,-0.5522],[0.1932,-0.5743],[0.1045,-0.5909],[0.014,-0.6001],
    [-0.0733,-0.6009],[-0.1572,-0.5935],[-0.2375,-0.5784],[-0.314,-0.5561],[-0.3864,-0.527],
    [-0.4545,-0.4915],[-0.5182,-0.45],[-0.5772,-0.403],[-0.6312,-0.3509],[-0.6802,-0.294],
    [-0.7239,-0.233],[-0.762,-0.168],[-0.7943,-0.0997],[-0.8207,-0.0284],[-0.8409,0.0455],
    [-0.8471,0.0893],[-0.8519,0.1322],[-0.8552,0.1741],[-0.857,0.2148],[-0.8571,0.2542],
    [-0.8555,0.2922],[-0.852,0.3287],[-0.8466,0.3636],[-0.8392,0.3969],[-0.8296,0.4283],
    [-0.8179,0.4578],[-0.8038,0.4852],[-0.7874,0.5106],[-0.7684,0.5337],[-0.7469,0.5544]
  ];

  function initSpectacle3D() {
    if (!spectCanvas || typeof THREE === 'undefined') return;

    const width = spectCanvas.clientWidth || 960;
    const height = spectCanvas.clientHeight || 520;

    spect3D.renderer = new THREE.WebGLRenderer({ canvas: spectCanvas, antialias: true, alpha: true });
    spect3D.renderer.setSize(width, height);
    spect3D.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    spect3D.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    spect3D.renderer.toneMappingExposure = 1.15;

    spect3D.scene = new THREE.Scene();
    spect3D.camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    spect3D.camera.position.set(0, 0.25, 5.8);

    if (typeof THREE.OrbitControls !== 'undefined') {
      spect3D.controls = new THREE.OrbitControls(spect3D.camera, spectCanvas);
      spect3D.controls.enableDamping = true;
      spect3D.controls.dampingFactor = 0.08;
      spect3D.controls.enableZoom = true;
      spect3D.controls.minDistance = 3.2;
      spect3D.controls.maxDistance = 8.0;
      spect3D.controls.maxPolarAngle = Math.PI / 2 + 0.15;
      spect3D.controls.minPolarAngle = Math.PI / 4;

      // Pause auto-rotation while user is actively dragging
      spect3D.controls.addEventListener('start', () => {
        spect3D.isAutoSpin = false;
        if (autoSpinResumeTimer) clearTimeout(autoSpinResumeTimer);
      });

      // Resume auto-rotation after 2 seconds of inactivity
      spect3D.controls.addEventListener('end', () => {
        if (spect3D.userWantsAutoSpin) {
          if (autoSpinResumeTimer) clearTimeout(autoSpinResumeTimer);
          autoSpinResumeTimer = setTimeout(() => {
            spect3D.isAutoSpin = true;
            if (autoSpinBtn) {
              autoSpinBtn.innerHTML = 'Pause &#10074;&#10074;';
              autoSpinBtn.classList.add('active');
            }
          }, 2000);
        }
      });

      spect3D.controls.addEventListener('change', () => {
        if (!spect3D.isAutoSpin && spect3D.glassesGroup) {
          let angleRad = Math.atan2(spect3D.camera.position.x, spect3D.camera.position.z) - spect3D.glassesGroup.rotation.y;
          let deg = Math.round((angleRad * 180 / Math.PI)) % 360;
          if (deg < 0) deg += 360;
          if (degSlider) degSlider.value = deg;
        }
      });
    }

    // Studio Triple Softbox Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.85);
    spect3D.scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    keyLight.position.set(6, 8, 8);
    spect3D.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xcceeff, 1.0);
    fillLight.position.set(-7, 4, 6);
    spect3D.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 1.6);
    rimLight.position.set(0, 9, -5);
    spect3D.scene.add(rimLight);

    // High-End Materials
    const acetateMat = new THREE.MeshPhysicalMaterial({
      color: 0x121212,
      roughness: 0.1,
      metalness: 0.05,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      reflectivity: 0.95
    });

    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xf2f2f2,
      roughness: 0.15,
      metalness: 0.95
    });

    const siliconeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.7,
      roughness: 0.35
    });

    // Pure Optical Glass Materials (Zero text inside lenses)
    spect3D.materials.clear = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.35,
      roughness: 0.02,
      transmission: 0.94,
      ior: 1.52,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03
    });

    spect3D.materials.bluecut = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
      roughness: 0.02,
      transmission: 0.86,
      ior: 1.54,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      attenuationColor: new THREE.Color(0x38bdf8),
      attenuationDistance: 1.5
    });

    spect3D.materials.antiglare = new THREE.MeshPhysicalMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.40,
      roughness: 0.02,
      transmission: 0.88,
      ior: 1.53,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      attenuationColor: new THREE.Color(0x10b981),
      attenuationDistance: 1.8
    });

    spect3D.materials.progressive = new THREE.MeshPhysicalMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.42,
      roughness: 0.02,
      transmission: 0.86,
      ior: 1.52,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      attenuationColor: new THREE.Color(0xf59e0b),
      attenuationDistance: 1.2
    });

    spect3D.glassesGroup = new THREE.Group();

    // 1. PANTO RIM GEOMETRY
    const pShape = new THREE.Shape();
    pShape.moveTo(outerPantoPts[0][0], outerPantoPts[0][1]);
    for (let i = 1; i < outerPantoPts.length; i++) {
      pShape.lineTo(outerPantoPts[i][0], outerPantoPts[i][1]);
    }
    pShape.closePath();

    const pHole = new THREE.Path();
    pHole.moveTo(innerPantoPts[0][0], innerPantoPts[0][1]);
    for (let i = 1; i < innerPantoPts.length; i++) {
      pHole.lineTo(innerPantoPts[i][0], innerPantoPts[i][1]);
    }
    pHole.closePath();
    pShape.holes.push(pHole);

    const rimGeom = new THREE.ExtrudeGeometry(pShape, {
      steps: 1,
      depth: 0.12,
      bevelEnabled: true,
      bevelThickness: 0.025,
      bevelSize: 0.02,
      bevelSegments: 4
    });
    rimGeom.center();

    // Left Rim
    const leftRim = new THREE.Mesh(rimGeom, acetateMat);
    leftRim.position.set(-1.18, 0, 0);
    spect3D.glassesGroup.add(leftRim);

    // Right Rim
    const rightRim = new THREE.Mesh(rimGeom, acetateMat);
    rightRim.position.set(1.18, 0, 0);
    rightRim.scale.set(-1, 1, 1);
    spect3D.glassesGroup.add(rightRim);

    // 2. LENSES (Prescription Glass with Meniscus Curve & Zero Text)
    const lShape = new THREE.Shape();
    lShape.moveTo(innerPantoPts[0][0], innerPantoPts[0][1]);
    for (let i = 1; i < innerPantoPts.length; i++) {
      lShape.lineTo(innerPantoPts[i][0], innerPantoPts[i][1]);
    }
    lShape.closePath();

    const lensGeom = new THREE.ShapeGeometry(lShape);
    lensGeom.center();

    spect3D.leftLens = new THREE.Mesh(lensGeom, spect3D.materials.clear);
    spect3D.leftLens.position.set(-1.18, 0, 0.035);
    spect3D.glassesGroup.add(spect3D.leftLens);

    spect3D.rightLens = new THREE.Mesh(lensGeom, spect3D.materials.clear);
    spect3D.rightLens.position.set(1.18, 0, 0.035);
    spect3D.rightLens.scale.set(-1, 1, 1);
    spect3D.glassesGroup.add(spect3D.rightLens);

    // 3. KEYHOLE BRIDGE
    const bridgeCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-0.35, 0.12, 0.03),
      new THREE.Vector3(0, 0.30, 0.03),
      new THREE.Vector3(0.35, 0.12, 0.03)
    );
    const bridgeGeom = new THREE.TubeGeometry(bridgeCurve, 24, 0.045, 12, false);
    const bridge = new THREE.Mesh(bridgeGeom, acetateMat);
    spect3D.glassesGroup.add(bridge);

    // 4. PAD ARMS & MEDICAL SILICONE PADS
    function createPad(isLeft) {
      const sign = isLeft ? -1 : 1;
      const armCurve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(sign * 0.30, 0.08, -0.04),
        new THREE.Vector3(sign * 0.26, -0.06, -0.12),
        new THREE.Vector3(sign * 0.27, -0.16, -0.14)
      );
      const armGeom = new THREE.TubeGeometry(armCurve, 16, 0.012, 8, false);
      const arm = new THREE.Mesh(armGeom, chromeMat);
      spect3D.glassesGroup.add(arm);

      const padGeom = new THREE.CylinderGeometry(0.035, 0.045, 0.16, 16);
      const pad = new THREE.Mesh(padGeom, siliconeMat);
      pad.position.set(sign * 0.27, -0.16, -0.14);
      pad.rotation.z = sign * -0.25;
      pad.rotation.y = sign * 0.15;
      spect3D.glassesGroup.add(pad);
    }
    createPad(true);
    createPad(false);

    // 5. OUTER ENDPIECE LUGS WITH DUAL CHROME RIVETS
    function createLug(isLeft) {
      const sign = isLeft ? -1 : 1;
      const lugGeom = new THREE.BoxGeometry(0.24, 0.14, 0.14);
      const lug = new THREE.Mesh(lugGeom, acetateMat);
      lug.position.set(sign * 2.14, 0.38, 0);
      spect3D.glassesGroup.add(lug);

      // Dual Rivet Pins
      const rivetGeom = new THREE.CylinderGeometry(0.016, 0.016, 0.02, 12);
      const r1 = new THREE.Mesh(rivetGeom, chromeMat);
      r1.rotation.x = Math.PI / 2;
      r1.position.set(sign * 2.18, 0.40, 0.075);
      spect3D.glassesGroup.add(r1);

      const r2 = new THREE.Mesh(rivetGeom, chromeMat);
      r2.rotation.x = Math.PI / 2;
      r2.position.set(sign * 2.10, 0.40, 0.075);
      spect3D.glassesGroup.add(r2);

      // 5-Barrel Chrome Hinge Block
      const hingeGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.12, 16);
      const hinge = new THREE.Mesh(hingeGeom, chromeMat);
      hinge.position.set(sign * 2.24, 0.38, -0.06);
      spect3D.glassesGroup.add(hinge);
    }
    createLug(true);
    createLug(false);

    // 6. TEMPLES EXTENDING IN Z WITH ERGONOMIC EAR HOOKS
    function createTemple(isLeft) {
      const sign = isLeft ? -1 : 1;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(sign * 2.24, 0.38, -0.06),
        new THREE.Vector3(sign * 2.26, 0.38, -0.6),
        new THREE.Vector3(sign * 2.22, 0.36, -1.8),
        new THREE.Vector3(sign * 2.14, 0.34, -2.5),
        new THREE.Vector3(sign * 2.10, 0.18, -3.0),
        new THREE.Vector3(sign * 2.11, -0.10, -3.2)
      ]);

      const templeGeom = new THREE.TubeGeometry(curve, 48, 0.038, 10, false);
      const temple = new THREE.Mesh(templeGeom, acetateMat);
      spect3D.glassesGroup.add(temple);

      const wireGeom = new THREE.TubeGeometry(curve, 48, 0.016, 8, false);
      const wire = new THREE.Mesh(wireGeom, chromeMat);
      spect3D.glassesGroup.add(wire);
    }
    createTemple(true);
    createTemple(false);

    // 7. STUDIO FLOOR SHADOW
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sCtx = shadowCanvas.getContext('2d');
    const sGrad = sCtx.createRadialGradient(128, 128, 0, 128, 128, 128);
    sGrad.addColorStop(0, 'rgba(0,0,0,0.95)');
    sGrad.addColorStop(0.35, 'rgba(0,0,0,0.55)');
    sGrad.addColorStop(0.7, 'rgba(0,0,0,0.12)');
    sGrad.addColorStop(1, 'transparent');
    sCtx.fillStyle = sGrad;
    sCtx.fillRect(0, 0, 256, 256);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowPlaneGeom = new THREE.PlaneGeometry(6.5, 6.5);
    const shadowPlaneMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.95 });
    const floorShadow = new THREE.Mesh(shadowPlaneGeom, shadowPlaneMat);
    floorShadow.rotation.x = -Math.PI / 2;
    floorShadow.position.set(0, -0.9, -1.2);
    spect3D.glassesGroup.add(floorShadow);

    spect3D.scene.add(spect3D.glassesGroup);

    // 60 FPS Render Loop
    function animate() {
      requestAnimationFrame(animate);

      if (spect3D.isAutoSpin && spect3D.glassesGroup) {
        spect3D.glassesGroup.rotation.y += 0.0075; // Smooth automatic 360 rotation
        let deg = Math.round((spect3D.glassesGroup.rotation.y * 180 / Math.PI)) % 360;
        if (deg < 0) deg += 360;
        if (degSlider) degSlider.value = deg;
      }

      if (spect3D.controls) spect3D.controls.update();
      spect3D.renderer.render(spect3D.scene, spect3D.camera);
    }
    animate();

    // Resize Handler
    window.addEventListener('resize', () => {
      if (!spectCanvas || !spect3D.renderer || !spect3D.camera) return;
      const w = spectCanvas.clientWidth;
      const h = spectCanvas.clientHeight;
      spect3D.camera.aspect = w / h;
      spect3D.camera.updateProjectionMatrix();
      spect3D.renderer.setSize(w, h);
    });
  }

  window.setSpectacleAngle = function(deg) {
    if (!spect3D.glassesGroup) return;
    spect3D.isAutoSpin = false;
    spect3D.glassesGroup.rotation.y = deg * Math.PI / 180;
    if (degSlider) degSlider.value = deg;

    angleBtns.forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.getAttribute('data-angle')) === deg);
    });

    // Pause on this perspective for 2.5 seconds, then resume auto-rotation
    if (spect3D.userWantsAutoSpin) {
      if (autoSpinResumeTimer) clearTimeout(autoSpinResumeTimer);
      autoSpinResumeTimer = setTimeout(() => {
        spect3D.isAutoSpin = true;
        if (autoSpinBtn) {
          autoSpinBtn.innerHTML = 'Pause &#10074;&#10074;';
          autoSpinBtn.classList.add('active');
        }
      }, 2500);
    }
  };

  window.setSpectacleCoating = function(type) {
    if (!spect3D.leftLens || !spect3D.rightLens) return;
    const mat = spect3D.materials[type] || spect3D.materials.clear;
    spect3D.leftLens.material = mat;
    spect3D.rightLens.material = mat;
  };

  // Connect Slider
  if (degSlider) {
    degSlider.addEventListener('input', (e) => {
      spect3D.isAutoSpin = false;
      if (autoSpinResumeTimer) clearTimeout(autoSpinResumeTimer);
      const deg = parseInt(e.target.value);
      if (spect3D.glassesGroup) {
        spect3D.glassesGroup.rotation.y = deg * Math.PI / 180;
      }
    });

    degSlider.addEventListener('change', () => {
      if (spect3D.userWantsAutoSpin) {
        if (autoSpinResumeTimer) clearTimeout(autoSpinResumeTimer);
        autoSpinResumeTimer = setTimeout(() => {
          spect3D.isAutoSpin = true;
          if (autoSpinBtn) {
            autoSpinBtn.innerHTML = 'Pause &#10074;&#10074;';
            autoSpinBtn.classList.add('active');
          }
        }, 2000);
      }
    });
  }

  // Connect Auto-Spin Button
  if (autoSpinBtn) {
    autoSpinBtn.addEventListener('click', () => {
      if (spect3D.isAutoSpin) {
        spect3D.isAutoSpin = false;
        spect3D.userWantsAutoSpin = false;
        if (autoSpinResumeTimer) clearTimeout(autoSpinResumeTimer);
        autoSpinBtn.innerHTML = 'Auto-Spin &#9654;';
        autoSpinBtn.classList.remove('active');
      } else {
        spect3D.isAutoSpin = true;
        spect3D.userWantsAutoSpin = true;
        autoSpinBtn.innerHTML = 'Pause &#10074;&#10074;';
        autoSpinBtn.classList.add('active');
      }
    });
  }

  // Connect Preset Angle Buttons
  angleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const deg = parseInt(btn.getAttribute('data-angle'));
      window.setSpectacleAngle(deg);
    });
  });

  // Connect Coating Filter Buttons
  ctrlBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      ctrlBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filterType = btn.getAttribute('data-filter') || 'clear';
      window.setSpectacleCoating(filterType);
    });
  });

  // Initialize Three.js
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initSpectacle3D);
  } else {
    initSpectacle3D();
  }

  // ==========================================================================
  // 4. SERVICE QUICK BOOKING BUTTONS
  // ==========================================================================
  const serviceSelect = document.getElementById('serviceSelect');
  const bookServiceBtns = document.querySelectorAll('.book-service-btn');

  bookServiceBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetService = btn.getAttribute('data-service');
      if (serviceSelect && targetService) {
        let matched = false;
        for (let i = 0; i < serviceSelect.options.length; i++) {
          if (serviceSelect.options[i].value === targetService) {
            serviceSelect.selectedIndex = i;
            matched = true;
            break;
          }
        }
        if (!matched) {
          const newOpt = new Option(targetService, targetService, true, true);
          serviceSelect.add(newOpt);
        }
      }

      const bookingSec = document.getElementById('booking');
      if (bookingSec) {
        bookingSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => {
          const nameInput = document.getElementById('clientName');
          if (nameInput) nameInput.focus();
        }, 600);
      }
    });
  });

  // ==========================================================================
  // 5. DATE PICKER SETUP (SET MIN DATE TO TODAY)
  // ==========================================================================
  const prefDateInput = document.getElementById('prefDate');
  if (prefDateInput) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    prefDateInput.min = `${yyyy}-${mm}-${dd}`;

    // Default to tomorrow if late evening
    const tomorrow = new Date(today);
    if (today.getHours() >= 18) {
      tomorrow.setDate(today.getDate() + 1);
    }
    const tY = tomorrow.getFullYear();
    const tM = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const tD = String(tomorrow.getDate()).padStart(2, '0');
    prefDateInput.value = `${tY}-${tM}-${tD}`;
  }

  // ==========================================================================
  // 6. FORM VALIDATION & BACKEND SUBMISSION
  // ==========================================================================
  const form = document.getElementById('appointmentForm');
  const formAlert = document.getElementById('formAlert');
  const submitBtn = document.getElementById('submitBtn');

  const clientName = document.getElementById('clientName');
  const clientPhone = document.getElementById('clientPhone');
  const clientEmail = document.getElementById('clientEmail');
  const prefDate = document.getElementById('prefDate');
  const prefTime = document.getElementById('prefTime');
  const clientMessage = document.getElementById('clientMessage');

  const nameError = document.getElementById('nameError');
  const phoneError = document.getElementById('phoneError');
  const emailError = document.getElementById('emailError');
  const serviceError = document.getElementById('serviceError');
  const dateError = document.getElementById('dateError');
  const timeError = document.getElementById('timeError');

  // Confirmation Modal Elements
  const confirmationModal = document.getElementById('confirmationModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalAcknowledgeBtn = document.getElementById('modalAcknowledgeBtn');
  const modalRefCode = document.getElementById('modalRefCode');
  const modalPatientName = document.getElementById('modalPatientName');
  const modalDepartment = document.getElementById('modalDepartment');
  const modalDate = document.getElementById('modalDate');
  const modalTime = document.getElementById('modalTime');
  const modalPhone = document.getElementById('modalPhone');
  const modalEmail = document.getElementById('modalEmail');
  const modalEmailRow = document.getElementById('modalEmailRow');

  function clearErrors() {
    [nameError, phoneError, emailError, serviceError, dateError, timeError].forEach(span => {
      if (span) span.textContent = '';
    });
    if (formAlert) {
      formAlert.style.display = 'none';
      formAlert.className = 'form-alert';
    }
  }

  function validateForm() {
    clearErrors();
    let isValid = true;

    // 1. Name
    const nameVal = clientName.value.trim();
    if (!nameVal) {
      nameError.textContent = 'Please enter your full name.';
      isValid = false;
    } else if (nameVal.length < 2) {
      nameError.textContent = 'Name must be at least 2 characters.';
      isValid = false;
    }

    // 2. Phone
    const phoneVal = clientPhone.value.trim();
    const cleanPhone = phoneVal.replace(/[\s\-\(\)\+]/g, '');
    const isIndianPhone = /^(?:91|0)?[6-9]\d{9}$/.test(cleanPhone);
    if (!phoneVal) {
      phoneError.textContent = 'Mobile number is required.';
      isValid = false;
    } else if (!isIndianPhone) {
      phoneError.textContent = 'Enter a valid 10-digit Indian mobile number (e.g. 8762888866).';
      isValid = false;
    }

    // 3. Email (Optional)
    const emailVal = clientEmail.value.trim();
    if (emailVal) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailVal)) {
        emailError.textContent = 'Please enter a valid email address.';
        isValid = false;
      }
    }

    // 4. Service
    if (!serviceSelect.value) {
      serviceError.textContent = 'Please select a consultation type.';
      isValid = false;
    }

    // 5. Date
    const dateVal = prefDate.value.trim();
    if (!dateVal) {
      dateError.textContent = 'Please select an appointment date.';
      isValid = false;
    } else {
      const chosen = new Date(dateVal + 'T00:00:00');
      const now = new Date();
      const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (chosen < todayDate) {
        dateError.textContent = 'Appointment date cannot be in the past.';
        isValid = false;
      }
    }

    // 6. Time Slot
    if (!prefTime.value) {
      timeError.textContent = 'Please select a preferred time slot.';
      isValid = false;
    }

    return isValid;
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!validateForm()) {
        const firstError = form.querySelector('.err-text:not(:empty)');
        if (firstError) {
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }

      submitBtn.disabled = true;
      const btnText = submitBtn.querySelector('.btn-text');
      const spinner = submitBtn.querySelector('.spinner');
      if (btnText) btnText.textContent = 'Reserving Slot...';
      if (spinner) spinner.style.display = 'inline-block';

      const payload = {
        customer_name: clientName.value.trim(),
        phone: clientPhone.value.trim(),
        email: clientEmail.value.trim(),
        service: serviceSelect.value,
        preferred_date: prefDate.value.trim(),
        preferred_time: prefTime.value,
        message: clientMessage.value.trim()
      };

      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok && result.success) {
          const appointmentData = result.data || {};
          const refId = appointmentData.id 
            ? `SNE-${appointmentData.id.substring(0, 8).toUpperCase()}`
            : `SNE-2026-${Math.floor(1000 + Math.random() * 9000)}`;

          modalRefCode.textContent = refId;
          modalPatientName.textContent = payload.customer_name;
          modalDepartment.textContent = payload.service;
          modalDate.textContent = formatDateIndian(payload.preferred_date);
          modalTime.textContent = payload.preferred_time;
          modalPhone.textContent = payload.phone;

          if (payload.email) {
            modalEmail.textContent = payload.email;
            modalEmailRow.style.display = 'flex';
          } else {
            modalEmailRow.style.display = 'none';
          }

          confirmationModal.style.display = 'flex';
          form.reset();

          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          prefDate.value = tomorrow.toISOString().split('T')[0];
        } else {
          formAlert.textContent = result.message || 'We could not process your request. Please call our clinic at +91 87628 88866.';
          formAlert.className = 'form-alert alert-error';
          formAlert.style.display = 'block';
          formAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      } catch (err) {
        console.error('[BOOKING] Error:', err);
        formAlert.innerHTML = `
          <strong>Connection Notice:</strong> Unable to reach server right now. 
          Please call or WhatsApp us directly at <a href="tel:+918762888866" style="color:#FFFFFF;text-decoration:underline;font-weight:bold;">+91 87628 88866</a> 
          to reserve your eye checkup immediately.
        `;
        formAlert.className = 'form-alert alert-error';
        formAlert.style.display = 'block';
        formAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } finally {
        submitBtn.disabled = false;
        if (btnText) btnText.textContent = 'Confirm Appointment Request';
        if (spinner) spinner.style.display = 'none';
      }
    });
  }

  function formatDateIndian(dateStr) {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  }

  // ==========================================================================
  // 7. MODAL CONTROLS
  // ==========================================================================
  function closeModal() {
    if (confirmationModal) confirmationModal.style.display = 'none';
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
  if (modalAcknowledgeBtn) modalAcknowledgeBtn.addEventListener('click', closeModal);

  if (confirmationModal) {
    confirmationModal.addEventListener('click', (e) => {
      if (e.target === confirmationModal) closeModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && confirmationModal && confirmationModal.style.display !== 'none') {
      closeModal();
    }
  });

})();
