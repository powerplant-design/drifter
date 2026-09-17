/* drifter.js — embeddable driving-game overlay.
   Host usage:  <script src="https://tm270c.github.io/drifter/drifter.js"
                        data-floor="(optional URL, defaults to this page)"
                        data-banner="none | sidepiece"></script>
   The game runs in the host page's own origin and uses that page as the road. */
(function () {
  // Recursion guard: when the game iframes the host page as its floor, that nested
  // copy must NOT start a second game.
  try { if (window.name === 'drifter-floor' || /[?&#]drifterFloor/.test(location.href)) return; } catch (e) {}
  if (window.__DRIFTER_ACTIVE__) return; window.__DRIFTER_ACTIVE__ = true;

  var me = document.currentScript || (function () { var s = document.getElementsByTagName('script'); return s[s.length - 1]; })();
  var BASE = new URL('.', me.src).href;
  var floorRaw = me.getAttribute('data-floor') || location.href;
  var floorSrc = floorRaw + (floorRaw.indexOf('#') === -1 ? '#' : '&') + 'drifterFloor';
  var DRIFTER = { base: BASE, floorSrc: floorSrc, banner: (me.getAttribute('data-banner') || 'none').toLowerCase() };

  var LIBS = ['https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
              'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js',
              'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/renderers/CSS3DRenderer.js'];
  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start);
  function start() {
    injectStyles();
    injectChrome();
    loadSeq(LIBS, 0, boot);
  }

  function loadSeq(list, i, done) {
    if (i >= list.length) return done();
    var s = document.createElement('script'); s.src = list[i];
    s.onload = function () { loadSeq(list, i + 1, done); };
    s.onerror = function () { console.error('Drifter: failed to load ' + list[i]); };
    document.head.appendChild(s);
  }

  function injectStyles() {
    var el = document.createElement('style');
    el.textContent = `        body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            overflow-x: hidden;
            background-color: #ffffff; /* Start white to blend seamlessly with the website */
            font-family: sans-serif;
        }
        
        :root {
            --red: #cc323e;
            --white: #ffffff;
            --transition-speed: 0.3s;
        }
        #info {
            position: absolute;
            top: 10px;
            left: 10px;
            color: white;
            background: rgba(0, 0, 0, 0.5);
            padding: 10px 15px;
            border-radius: 8px;
            pointer-events: none;
            user-select: none;
            z-index: 10;
            opacity: 0;
            transition: opacity 1s ease-in-out;
        }
        
        .footer {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            max-width: 100vw;
            height: 3rem;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 2rem;
            z-index: 10;
            background-color: var(--red);
            box-sizing: border-box;
            overflow: hidden;
        }
        .footer a {
            font-family: Helvetica, sans-serif;
            font-weight: bold;
            font-size: clamp(1.05rem, 3vw, 1.5rem);
            color: var(--white);
            text-decoration: none;
            transition: letter-spacing var(--transition-speed) ease;
        }
        .footer a:hover {
            letter-spacing: 0.1em;
        }
        
        .drive-btn {
            position: absolute;
            right: 2rem;
            background-color: var(--red);
            color: var(--white);
            border: 2px solid var(--red);
            font-family: Helvetica, sans-serif;
            font-weight: bold;
            font-size: clamp(1.05rem, 3vw, 1.5rem);
            padding: 0.2rem 1rem;
            cursor: pointer;
            transition: all var(--transition-speed) ease;
        }
        .drive-btn:hover {
            background-color: var(--white);
            color: var(--red);
        }
        
        @media (max-width: 1024px) {
            .drive-btn {
                display: none !important;
            }
        }
        @media (max-width: 640px) {
            .footer {
                gap: 0.6rem;
                padding: 0 0.5rem;
                height: 3rem;
                justify-content: center;
                flex-wrap: nowrap;
            }
            .footer a {
                font-size: 0.85rem;
            }
        }`;
    document.head.appendChild(el);
  }

  function injectChrome() {
    var info = document.createElement('div'); info.id = 'info';
    info.innerHTML = '<strong>Controls:</strong><br>[\u2191] Accelerate | [\u2193] Brake/Reverse<br>[\u2190] [\u2192] Steer | [Space] Jump';
    document.body.appendChild(info);
    var db = document.createElement('button'); db.id = 'driveBtn'; db.className = 'drive-btn'; db.textContent = 'DRIVE';
    if (DRIFTER.banner === 'sidepiece') {
      // Red banner bar. Hardcoded links are just a fallback — pullBanner() swaps in the real site's.
      var footer = document.createElement('footer'); footer.className = 'footer';
      footer.innerHTML = '<a href="https://www.instagram.com/sidepiece.niseko/" target="_blank" rel="noopener noreferrer">INSTAGRAM</a>'
                       + '<a href="https://www.facebook.com/p/SIDE-PIECE-61572041270089/" target="_blank" rel="noopener noreferrer">METABOOK</a>'
                       + '<a href="https://fabradiokk.com" target="_blank" rel="noopener noreferrer">FAB RADIO</a>';
      footer.appendChild(db);
      document.body.appendChild(footer);
    } else {
      // No banner: a prominent, self-contained floating DRIVE button (doesn't rely on .drive-btn).
      db.style.cssText = 'position:fixed;bottom:1.2rem;right:1.2rem;left:auto;top:auto;z-index:10;'
        + 'background:#cc323e;color:#fff;border:2px solid #cc323e;border-radius:8px;'
        + 'font-family:Helvetica,Arial,sans-serif;font-weight:bold;font-size:clamp(1.05rem,3vw,1.4rem);'
        + 'padding:0.5rem 1.4rem;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,0.35);'
        + '-webkit-tap-highlight-color:transparent;';
      document.body.appendChild(db);
    }
  }

  function boot() {
        // ==========================================
        // 1. CONFIGURATION & CONSTANTS
        // ==========================================
        const initViewHeight = 894.7; // Visible CSS px (vertical) at camera y=72, FOV=45 -> maps to screen height
        const PX2WORLD = 128 / 1920;  // world units per CSS pixel (the zoom level). Keeps the view ~1:1.
        // Floor width now tracks the viewport aspect so the embedded site renders at a width that actually
        // fits the screen (its responsive/mobile layout kicks in) instead of showing a fixed 1920px slice.
        function floorWidthPx() { return Math.max(360, Math.round(initViewHeight * (window.innerWidth / window.innerHeight))); }
        let floorPxW = floorWidthPx();
        let tileSize = floorPxW * PX2WORLD;   // world X-width of a floor tile = the visible screen width
        const jumpGravity = 0.015;
        const maxSkids = 150; // Radically reduced to prevent transparency overdraw bottlenecks
        
        const startCamPos = new THREE.Vector3(0, 72, 0); // 1:1 Pixel Mapping Zoom
        const cameraOffset = new THREE.Vector3(0, 20, -25); // Behind the car (facing +Z)
        const targetCameraPos = new THREE.Vector3();

        // --- Mobile mode: narrow viewport OR a touch device without a fine pointer ---
        function detectMobile() {
            return window.matchMedia('(max-width: 820px)').matches ||
                   (window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(pointer: fine)').matches);
        }
        let isMobile = detectMobile();
        let mobileGameActive = false, mobileGameStart = 0;   // auto-drive-on-phone state
        const CAM_ZOOM_MOBILE = 1.55;                         // pull the camera back on small screens
        function applyCameraZoom() {
            const z = isMobile ? CAM_ZOOM_MOBILE : 1;
            cameraOffset.set(0, 20 * z, -25 * z);             // still centred on the van, just further out
        }
        applyCameraZoom();

        const carConfig = {
            acceleration: 0.02,     // ~2x — restores the speed the 120Hz build had before the frame-rate fix
            braking: 0.045,
            reverseAccel: 0.009,
            friction: 0.98,         // Drag/Coasting
            lateralFriction: 0.88,  // Grip/Drift (1.0 = ice, 0.0 = rails)
            maxSpeed: 1,
            maxReverseSpeed: 0.45,
            steerSpeed: 0.04,
            maxSteer: 0.4,
            turnSpeed: 0.13         // How fast the chassis rotates (nudged up for the higher speed)
        };

        const pitchConfig = {
            accelTargetAngle: -0.1, // Target pitch when accelerating
            brakeTargetAngle: 0.05, // Target pitch when braking
            wobbleFreq: 0.08,       // Bounce frequency (spring stiffness)
            wobbleDecay: 0.85       // Bounce decay (damping)
        };

        const rollConfig = {
            targetAngle: -0.4,      // Target roll when steering fully (reduced left/right tilt)
            wobbleFreq: 0.08,       // Bounce frequency (spring stiffness)
            wobbleDecay: 0.85       // Bounce decay (damping)
        };

        // Editable lighting — softer, less harsh. Tweak colours (hex), intensities, [x,y,z] directions.
        const lightConfig = {
            ambient: { color: 0xdde8f5, intensity: 1.10 }, // bright, soft, faint blue tint in shadow
            key:     { color: 0xfff4e6, intensity: 0.50, position: [ 100, 150,   50], shadowSoftness: 8 }, // gentle main light
            fill:    { color: 0xffe6de, intensity: 1.15, position: [-120,  70,   40] }, // warm fill (echoes Blender's pink area light)
            rim:     { color: 0xffffff, intensity: 0.30, position: [ -30,  90, -140] }  // subtle back edge highlight
        };

        // Editable material feel — metalness 0 + higher roughness = less shiny & lit properly (no env reflections);
        // emissive lifts the baked colours so it doesn't read dark.
        const matConfig = {
            metalness: 0.0,
            roughness: 1.3,           // multiplier on the roughness map (lower now, so shiny windows read as shiny)
            emissiveIntensity: 0.22,  // lifts baked colours so it's not so dark
            normalScale: 0.35,        // bump strength (lower = flatter)
            envMapIntensity: 0.3      // how strongly surfaces reflect the environment map (dimmed down)
        };

        // ==========================================
        // 2. GLOBAL STATE
        // ==========================================
        let isDriving = false;
        let entryAngle = 0;          // random intro approach direction
        let vanModel = null;         // loaded GLB scene (for clicks / honk / inspect)
        // Honk
        let honkSound = null, notesTexture = null;
        let honkWobble = 0, honkWobbleVel = 0;
        const noteSprites = [];
        // Inspect mode (click the van to view it as a floating menu item)
        let inspectMode = false, isDragging = false, dragMoved = 0;
        let dragPrevX = 0, dragPrevY = 0;
        let inspectYaw = 0.5, inspectPitch = 0.35;
        let modelHome = null;
        let inspectAnim = 1;                       // 0->1 open-animation progress (1 = settled)
        const inspStart = { pos: new THREE.Vector3(), quat: new THREE.Quaternion() };
        const inspTarget = { pos: new THREE.Vector3(), quat: new THREE.Quaternion() };
        let inspDoorFrom = 0;
        const raycaster = new THREE.Raycaster();
        const ndc = new THREE.Vector2();
        let lastInputTime = 0;   // auto-drive: timestamp of last manual control
        let autoDrive = false;   // true once idle for >1s while driving
        let autoSteerDir = 0;    // -1 left, 0 straight, 1 right (wander)
        let autoNextTurn = 0;    // when to pick a new wander direction
        let autoNextHonk = 0, autoNextJump = 0, autoJumpUntil = 0; // AI horn/jump scheduling
        let lastHonk = 0, lastJump = 0;   // 0.5s cooldowns for horn + jump
        let originalScrollY = 0;
        let swoopProgress = 0;
        let targetCarZ = 0; 
        let tileLengthZ = initViewHeight * PX2WORLD;

        let heading = 0; 
        let velocity = { x: 0, z: 0 };
        let steeringAngle = 0;
        let leanAngle = 0;
        let leanVelocity = 0;
        let rollAngle = 0;
        let rollVelocity = 0;
        
        let jumpPhase = 0;
        let jumpAnimProgress = 0;
        let verticalVelocity = 0;

        let prevForwardSpeed = 0;
        let prevLateralSpeed = 0;
        let doorAngleL = 0;
        let doorAngleR = 0;
        let doorVelL = 0;
        let doorVelR = 0;
        let doorL = null, doorR = null;
        let bodyMesh = null, bodyTilt = null;

        let skidState = 0;
        let hasLastPos = false;
        let wasSkidding = false;
        
        const lastPosL = new THREE.Vector3();
        const lastPosR = new THREE.Vector3();
        const currentPosL = new THREE.Vector3();
        const currentPosR = new THREE.Vector3();

        const keys = {
            ArrowUp: false,
            ArrowDown: false,
            ArrowLeft: false,
            ArrowRight: false,
            Space: false
        };

        // Arrays for tracking spawned objects
        const tiles = [];
        const cssTiles = [];
        const wheels = [];
        const skidMarks = [];

        // ==========================================
        // 3. SCENE & RENDERER SETUP
        // ==========================================
        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0xffffff, 0.005); // Start with white fog

        const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        scene.add(camera); // lets camera-parented objects (the inspect/menu van) render
        
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
        renderer.setClearColor(0xffffff, 0);
        renderer.outputEncoding = THREE.sRGBEncoding;         // correct gamma
        renderer.toneMapping = THREE.ACESFilmicToneMapping;   // soft filmic highlights (approximates Blender's AgX)
        renderer.toneMappingExposure = 1.08;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap resolution on 4K/Retina displays
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.domElement.style.position = 'absolute';
        renderer.domElement.style.top = '0';
        renderer.domElement.style.zIndex = '2';
        renderer.domElement.style.pointerEvents = 'none'; 
        document.body.appendChild(renderer.domElement);

        // --- Environment map: gives the shiny (low-roughness) window bake something to reflect.
        //     Procedural sky-over-ground gradient + a soft sun. Swap the canvas for an equirect
        //     PNG/HDRI later if you want a real scene reflected. ---
        (function setupEnv() {
            const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
            const ctx = c.getContext('2d');
            const g = ctx.createLinearGradient(0, 0, 0, 512);
            g.addColorStop(0.00, '#4a525c');   // sky top (dim)
            g.addColorStop(0.42, '#565f6a');
            g.addColorStop(0.50, '#6a7178');   // soft horizon band (no longer blown-out white)
            g.addColorStop(0.58, '#3c424a');
            g.addColorStop(1.00, '#23272c');   // dark ground
            ctx.fillStyle = g; ctx.fillRect(0, 0, 1024, 512);
            // faint highlight so curved glass still shows a gentle moving glint
            const sx = 720, sy = 130, r = 130;
            const rg = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
            rg.addColorStop(0, 'rgba(190,200,210,0.45)');
            rg.addColorStop(1, 'rgba(190,200,210,0)');
            ctx.fillStyle = rg; ctx.fillRect(sx - r, sy - r, r * 2, r * 2);
            const equ = new THREE.CanvasTexture(c);
            equ.mapping = THREE.EquirectangularReflectionMapping;
            const pmrem = new THREE.PMREMGenerator(renderer);
            scene.environment = pmrem.fromEquirectangular(equ).texture;
            equ.dispose(); pmrem.dispose();
        })();

        const cssRenderer = new THREE.CSS3DRenderer();
        cssRenderer.setSize(window.innerWidth, window.innerHeight);
        cssRenderer.domElement.style.position = 'absolute';
        cssRenderer.domElement.style.top = '0';
        cssRenderer.domElement.style.zIndex = '1';
        document.body.appendChild(cssRenderer.domElement);
        const cssScene = new THREE.Scene();
        
        // ==========================================
        // 4. LIGHTING
        // ==========================================
        const ambientLight = new THREE.AmbientLight(lightConfig.ambient.color, lightConfig.ambient.intensity);
        scene.add(ambientLight);

        // --- Three simple infinite (directional) lights: KEY / FILL / RIM (values from lightConfig) ---
        const dirLight = new THREE.DirectionalLight(lightConfig.key.color, lightConfig.key.intensity);
        dirLight.position.set(lightConfig.key.position[0], lightConfig.key.position[1], lightConfig.key.position[2]);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 500;
        dirLight.shadow.camera.left = -60;
        dirLight.shadow.camera.right = 60;
        dirLight.shadow.camera.top = 60;
        dirLight.shadow.camera.bottom = -60;
        dirLight.shadow.radius = lightConfig.key.shadowSoftness; // softer, blurrier shadow edges
        scene.add(dirLight);
        scene.add(dirLight.target);

        const fillLight = new THREE.DirectionalLight(lightConfig.fill.color, lightConfig.fill.intensity);
        fillLight.position.set(lightConfig.fill.position[0], lightConfig.fill.position[1], lightConfig.fill.position[2]);
        scene.add(fillLight);

        const rimLight = new THREE.DirectionalLight(lightConfig.rim.color, lightConfig.rim.intensity);
        rimLight.position.set(lightConfig.rim.position[0], lightConfig.rim.position[1], lightConfig.rim.position[2]);
        scene.add(rimLight);

        // ==========================================
        // 5. ENVIRONMENT & TILING
        // ==========================================
        const tileBase = new THREE.Group();
        const planeGeo = new THREE.PlaneGeometry(tileSize, tileLengthZ);
        const planeMat = new THREE.ShadowMaterial({
            opacity: 0.5
        });
        const plane = new THREE.Mesh(planeGeo, planeMat);
        plane.rotation.x = -Math.PI / 2;
        plane.rotation.z = Math.PI; 
        plane.position.y = -0.1;
        plane.receiveShadow = true;
        plane.renderOrder = -1; 
        tileBase.add(plane);

        // Create 3x3 grid of tiles
        for (let x = -1; x <= 1; x++) {
            for (let z = -1; z <= 1; z++) {
                // 1. WebGL Shadow Catcher
                const tile = tileBase.clone();
                scene.add(tile);
                tiles.push(tile);
                
                // 2. CSS3D Interactive Iframe Tiling
                const div = document.createElement('div');
                div.style.width = floorPxW + 'px';
                div.style.height = initViewHeight + 'px'; 
                div.style.backgroundColor = '#ffffff'; 
                
                const iframe = document.createElement('iframe');
                iframe.src = DRIFTER.floorSrc; iframe.name = 'drifter-floor';
                iframe.style.width = '100%';
                iframe.style.height = '100%';
                iframe.style.border = 'none';

                const hideInterval = setInterval(() => {
                    try {
                        const doc = iframe.contentDocument;
                        if (doc && doc.head) {
                            if (!doc.getElementById('hide-footer-style')) {
                                const style = doc.createElement('style');
                                style.id = 'hide-footer-style';
                                style.textContent = '.footer { display: none !important; }';
                                doc.head.appendChild(style);
                            }
                            const innerFooter = doc.querySelector('.footer');
                            if (innerFooter && innerFooter.style.display !== 'none') {
                                innerFooter.style.display = 'none';
                                iframe.contentWindow.dispatchEvent(new Event('resize'));
                                clearInterval(hideInterval);
                            }
                        }
                    } catch(err) {}
                }, 10);
                
                iframe.onload = () => clearInterval(hideInterval); 

                div.appendChild(iframe);

                const cssObj = new THREE.CSS3DObject(div);
                cssObj.scale.set(PX2WORLD, PX2WORLD, 1);
                cssObj.rotation.x = -Math.PI / 2;
                cssObj.rotation.z = Math.PI; 
                cssScene.add(cssObj);
                cssTiles.push(cssObj);
            }
        }

        // ==========================================
        // 6. CAR ASSETS
        // ==========================================
        // Van sizing
        const VAN_SCALE = 3;               // make the van larger (tweak to taste)
        const RIDE_HEIGHT = 1.1 * VAN_SCALE; // keeps the wheels on the ground as it scales

        const car = new THREE.Group();
        car.position.set(0, 0, -40); // Start off-screen at the bottom (-Z)
        scene.add(car);

        const carBody = new THREE.Group();
        carBody.position.set(0, RIDE_HEIGHT, 2);
        car.add(carBody);

        const gltfLoader = new THREE.GLTFLoader();
        gltfLoader.load(DRIFTER.base + 'van.glb', (gltf) => {
            const model = gltf.scene;
            const wheelMeshes = [];
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    // Flatten metalness + raise roughness so surfaces are lit (not dark) and less shiny,
                    // and add a gentle emissive from the baked base colour so it doesn't read dark.
                    const mats = Array.isArray(child.material) ? child.material : [child.material];
                    mats.forEach((m) => {
                        if (!m) return;
                        m.metalness = matConfig.metalness;
                        m.roughness = matConfig.roughness;                 // >1 boosts roughness (less shiny)
                        m.envMapIntensity = matConfig.envMapIntensity;     // reflect scene.environment (shiny windows pick it up)
                        if (m.normalMap) m.normalScale.set(matConfig.normalScale, matConfig.normalScale); // reduce bump
                        if (m.map) {
                            m.emissiveMap = m.map;
                            m.emissive = new THREE.Color(0xffffff);
                            m.emissiveIntensity = matConfig.emissiveIntensity;
                        }
                        m.needsUpdate = true;
                    });
                }
                if (child.name === 'Body') bodyMesh = child;
                if (child.name === 'DoorL') doorL = child;
                if (child.name === 'DoorR') doorR = child;
                if (child.name && child.name.indexOf('Wheel_') === 0) {
                    wheelMeshes.push(child);
                }
            });
            // Body-only tilt group: body + doors tilt with lean/roll; the wheels stay planted
            bodyTilt = new THREE.Group();
            model.add(bodyTilt);
            if (bodyMesh) bodyTilt.add(bodyMesh);
            if (doorL) bodyTilt.add(doorL);
            if (doorR) bodyTilt.add(doorR);
            // Each wheel goes inside a pivot: spinning/steering the pivot preserves the wheel's
            // baked orientation (fixes the wrong-axis spin). Pivots sit outside bodyTilt so the
            // wheels stay upright while the body tilts.
            wheelMeshes.forEach((wm) => {
                const pivot = new THREE.Group();
                pivot.name = wm.name + '_pivot';
                pivot.rotation.order = 'YXZ';
                pivot.position.copy(wm.position);
                pivot.userData.isFront = wm.name.indexOf('Wheel_F') === 0;
                pivot.userData.homePos = wm.position.clone();
                model.add(pivot);
                wm.position.set(0, 0, 0);
                pivot.add(wm);
                wheels.push(pivot);
            });
            model.scale.set(VAN_SCALE, VAN_SCALE, VAN_SCALE);
            carBody.add(model);
            vanModel = model;
        }, undefined, (error) => {
            console.error('Error loading the van GLB:', error);
        });

        // Doors and wheels are provided by van.glb (captured in the loader above)

        // ==========================================
        // 7. INPUTS & UI LOGIC
        // ==========================================
        const WASD = { KeyW:'ArrowUp', KeyS:'ArrowDown', KeyA:'ArrowLeft', KeyD:'ArrowRight' };
        window.addEventListener('keydown', (e) => {
            const arrow = WASD[e.code];                       // WASD drives too
            if (arrow) keys[arrow] = true;
            if (arrow || ['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
                e.preventDefault(); // Prevent default browser scrolling
            }
            if (e.code === 'Space') keys.Space = true;
            if (e.code === 'KeyH') honk();
            if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
            // Any control input cancels autopilot and resets the idle timer
            if (arrow || ['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
                lastInputTime = performance.now();
                if (autoDrive) {
                    autoDrive = false;
                    keys.ArrowUp = keys.ArrowDown = keys.ArrowLeft = keys.ArrowRight = false;
                    if (arrow) keys[arrow] = true;
                    else if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            const arrow = WASD[e.code];
            if (arrow) keys[arrow] = false;
            if (e.code === 'Space') keys.Space = false;
            if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
        });

        // ==========================================
        // ON-SCREEN WASD + H + SPACE KEYBOARD
        // ==========================================
        (function keyboardUI(){
          const RED = '#cc323e';
          const KEY = 80;        // key width (px)
          const DEPTH = 11;      // press travel
          const wrap = document.createElement('div');
          wrap.id = 'wasdWrap';
          wrap.style.cssText = 'position:absolute;right:1.4rem;bottom:4.6rem;width:280px;height:240px;z-index:9;pointer-events:none;user-select:none;opacity:0;transition:opacity 0.25s ease;';
          if (isMobile || window.innerWidth <= 1024) wrap.style.display = 'none';   // no on-screen controls on phones/tablets (van auto-drives)
          document.body.appendChild(wrap);
          // Isometric arrangement — positions in KEY units (tweak gx/gy to nudge). Keys interlock.
          const defs = [
            {code:'KeyW', file:'button W.svg', gx:0.30, gy:0.00, w:1,    h:1},
            {code:'KeyD', file:'button-D.svg', gx:1.30, gy:0.03, w:1,    h:1},
            {code:'KeyS', file:'button S.svg', gx:0.80, gy:0.36, w:1,    h:1},
            {code:'KeyA', file:'button A.svg', gx:0.30, gy:0.72, w:1,    h:1},
            {code:'Space',file:'SPACE.svg',    gx:1.12, gy:0.80, w:2.0,  h:1.55, shadow:'SPACE-shadow.svg'},
          ];
          const objs = {};
          defs.sort((a,b)=> a.gy - b.gy);   // front keys (higher gy / lower on screen) draw on top
          defs.forEach((d, idx) => {
            const cell = document.createElement('div');
            cell.style.cssText = `position:absolute;left:${d.gx*KEY}px;top:${d.gy*KEY}px;width:${d.w*KEY}px;height:${d.h*KEY}px;z-index:${idx};`;
            wrap.appendChild(cell);
            const shadowDiv = document.createElement('div');   // static shadow, bottom-aligned
            shadowDiv.style.cssText = 'position:absolute;left:0;right:0;bottom:0;';
            cell.appendChild(shadowDiv);
            const keyDiv = document.createElement('div');       // animated key, bottom-aligned
            keyDiv.style.cssText = 'position:absolute;left:0;right:0;bottom:0;will-change:transform,filter;';
            cell.appendChild(keyDiv);
            const o = { y:-DEPTH, vel:0, pressed:false, keyDiv, top:null, letters:null, intro:0, introDelay: idx*0.06, introOrder: idx };
            objs[d.code] = o;
            fetch(DRIFTER.base + (d.shadow || 'shadow.svg')).then(r=>r.text()).then(t=>{
              shadowDiv.innerHTML = t;
              const s = shadowDiv.querySelector('svg'); if(s){ s.style.width='100%'; s.style.height='auto'; s.style.display='block'; }
            }).catch(()=>{});
            fetch(DRIFTER.base + d.file).then(r=>r.text()).then(t=>{
              keyDiv.innerHTML = t;
              const svg = keyDiv.querySelector('svg');
              if (svg){ svg.style.width='100%'; svg.style.height='auto'; svg.style.display='block'; svg.style.overflow='visible'; }
              o.top = keyDiv.querySelector('path[style*="fill:white"]');
              o.letters = Array.from(keyDiv.querySelectorAll('path[style*="fill-rule:nonzero"]')); // every glyph (all of SPACE, not just S)
            }).catch(()=>{});
          });
          function setPressed(code, p){
            const o = objs[code]; if(!o) return;
            o.pressed = p;
            if (o.top) o.top.style.fill = p ? RED : 'white';
            if (o.letters) o.letters.forEach(pt => pt.style.fill = p ? '#fff' : '#000');
          }
          // On-screen keys mirror the game drive-state, so the player AND the autopilot both light them up
          window.addEventListener('blur', () => { for (const c in objs) setPressed(c, false); });
          let lastT = performance.now();
          let wasDriving = false;
          (function tick(now){
            requestAnimationFrame(tick);
            now = now || performance.now();
            const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
            const drv = (typeof isDriving !== 'undefined') && isDriving;
            if (drv && !wasDriving) {                  // DRIVE pressed -> show + (re)play the entrance
              for (const k in objs){ const oo = objs[k]; oo.intro = 0; oo.introDelay = oo.introOrder * 0.06; }
              wrap.style.opacity = '1';
            }
            if (!drv) wrap.style.opacity = '0';        // hidden until we press DRIVE
            wasDriving = drv;
            setPressed('KeyW', !!keys.ArrowUp);
            setPressed('KeyA', !!keys.ArrowLeft);
            setPressed('KeyS', !!keys.ArrowDown);
            setPressed('KeyD', !!keys.ArrowRight);
            setPressed('Space', !!keys.Space);
            for (const c in objs){
              const o = objs[c];
              const target = o.pressed ? 0 : -DEPTH;   // pressed = down onto shadow; rest = raised (shadow stays put)
              o.vel += (target - o.y) * 0.35;          // spring
              o.vel *= 0.6;                            // damping -> quick down, inertial bounce up
              o.y += o.vel;
              // Entrance (only while driving): settle DOWN while fading from white (opaque -> keys occlude)
              if (drv) {
                if (o.introDelay > 0) o.introDelay -= dt;
                else if (o.intro < 1) o.intro = Math.min(1, o.intro + dt * 3.5);
              }
              const e = 1 - Math.pow(1 - o.intro, 3);   // easeOut
              const introY = -(1 - e) * 22;             // starts slightly higher, settles down
              o.keyDiv.style.filter = e < 0.999 ? `brightness(${(1 + (1 - e) * 1.7).toFixed(3)}) contrast(${(0.1 + e * 0.9).toFixed(3)})` : 'none';
              o.keyDiv.style.transform = `translateY(${(o.y + introY).toFixed(2)}px)`;
            }
          })();
        })();

        document.getElementById('driveBtn').addEventListener('click', () => {
            if (isMobile || window.innerWidth <= 1024) return;          // tablets/phones: DRIVE is disabled
            startTransitionToDrive();
        });

        function startTransitionToDrive(opts) {
            if (isDriving) return; // Prevent spacebar from re-triggering the button!
            const auto = !!(opts && opts.auto);
            isDriving = true;
            lastInputTime = auto ? -1e9 : performance.now(); // auto -> start wandering immediately
            autoDrive = auto;
            if (auto) { mobileGameActive = true; mobileGameStart = performance.now(); }
            cssRenderer.domElement.style.pointerEvents = 'none';
            interactionLayer.style.pointerEvents = 'auto'; // capture the mouse for the sim while driving
            const btn = document.getElementById('driveBtn');
            btn.style.opacity = '0';
            btn.style.pointerEvents = 'none';
            btn.blur(); // Remove focus from the button
            if (!isMobile) document.getElementById('info').style.opacity = '1'; // no key hints on phones
            driveCloseBtn.style.display = 'flex';                                // red ✕ to close the game
            if (auto || isMobile) mobileHint.style.display = 'block';            // portrait explainer box

            try {
                const centerIframe = cssTiles[4].element.querySelector('iframe');
                const doc = centerIframe.contentDocument;
                
                originalScrollY = centerIframe.contentWindow.scrollY || doc.documentElement.scrollTop || 0;
                const scrollY = originalScrollY;
                
                cssTiles.forEach(cssObj => {
                    const ifrDoc = cssObj.element.querySelector('iframe').contentDocument;
                    if (ifrDoc) {
                        const mapContainer = ifrDoc.querySelector('.map-container');
                        if (mapContainer) {
                            const currentPixelHeight = mapContainer.getBoundingClientRect().height;
                            mapContainer.style.height = currentPixelHeight + 'px';
                        }
                    }
                });
                
                const scrollHeight = Math.max(
                    doc.body.scrollHeight, 
                    doc.documentElement.scrollHeight,
                    doc.body.offsetHeight, 
                    doc.documentElement.offsetHeight,
                    doc.documentElement.getBoundingClientRect().height
                ) || 1920;
                const newHeight = scrollHeight + 'px';
                
                cssTiles.forEach(cssObj => {
                    const div = cssObj.element;
                    const ifr = div.querySelector('iframe');
                    
                    div.style.height = newHeight;
                    
                    ifr.contentDocument.body.style.overflow = 'hidden';
                    ifr.contentDocument.documentElement.style.overflow = 'hidden';
                    ifr.contentWindow.scrollTo(0, 0);
                    
                    const mapContainer = ifr.contentDocument.querySelector('.map-container');
                    if (mapContainer) {
                        const gMap = mapContainer.querySelector('iframe');
                        if (gMap) gMap.style.display = 'none';
                        
                        let staticMap = mapContainer.querySelector('.static-map');
                        if (!staticMap) {
                            staticMap = ifr.contentDocument.createElement('a');
                            staticMap.href = 'https://maps.app.goo.gl/fn7HLwbL2EFgKkhe8';
                            staticMap.target = '_blank';
                            staticMap.className = 'static-map';
                            staticMap.style.display = 'block';
                            staticMap.style.width = '100%';
                            staticMap.style.height = '100%';
                            
                            const img = ifr.contentDocument.createElement('img');
                            img.src = DRIFTER.base + 'map.png'; // Absolutely resolve to the parent window's path
                            img.style.width = '100%';
                            img.style.height = '100%';
                            img.style.objectFit = 'cover';
                            img.style.display = 'block';
                            
                            staticMap.appendChild(img);
                            mapContainer.appendChild(staticMap);
                        } else {
                            staticMap.style.display = 'block';
                        }
                    }
                });

                const newTileLengthZ = scrollHeight * PX2WORLD;
                const newPlaneGeo = new THREE.PlaneGeometry(tileSize, newTileLengthZ);
                tiles.forEach(tileGroup => {
                    const mesh = tileGroup.children[0];
                    mesh.geometry.dispose();
                    mesh.geometry = newPlaneGeo;
                });

                const zShift = (newTileLengthZ - tileLengthZ) / 2 - (scrollY * PX2WORLD);
                targetCarZ = zShift;
                // Always enter from the bottom (-Z), driving forward into view
                car.position.x = 0;
                car.position.z = targetCarZ - 40;
                heading = 0;
                car.rotation.y = 0;
                startCamPos.z += zShift;

                tileLengthZ = newTileLengthZ;
            } catch(err) {
                console.warn("Could not read iframe properties due to CORS", err);
            }
        }

        function exitDriveMode() {
            if (!isDriving) return;
            if (inspectMode) exitInspect(); // tab-out / page-out also closes the inspect view

            isDriving = false;
            autoDrive = false;
            swoopProgress = 0;
            cssRenderer.domElement.style.pointerEvents = 'auto'; // restore website interactivity when parked
            interactionLayer.style.pointerEvents = 'none';

            car.position.set(0, 0, -40);
            car.rotation.set(0, 0, 0);
            heading = 0;
            velocity = { x: 0, z: 0 };
            steeringAngle = 0;
            leanAngle = 0;
            leanVelocity = 0;
            rollAngle = 0;
            rollVelocity = 0;
            jumpPhase = 0;
            jumpAnimProgress = 0;
            verticalVelocity = 0;
            carBody.rotation.set(0, 0, 0);
            if (bodyTilt) bodyTilt.rotation.set(0, 0, 0);
            carBody.scale.set(1, 1, 1);
            
            prevForwardSpeed = 0;
            prevLateralSpeed = 0;
            doorAngleL = 0;
            doorAngleR = 0;
            doorVelL = 0;
            doorVelR = 0;
            if (doorL) doorL.rotation.y = 0;
            if (doorR) doorR.rotation.y = 0;
            
            wheels.forEach(wheel => {
                wheel.rotation.set(0, 0, 0);
                if (wheel.userData.homePos) wheel.position.copy(wheel.userData.homePos);
            });

            for (let k in keys) keys[k] = false;

            skidState = 0;
            hasLastPos = false;
            wasSkidding = false;

            cssTiles.forEach(cssObj => {
                const div = cssObj.element;
                const ifr = div.querySelector('iframe');
                const doc = ifr.contentDocument;
                
                div.style.height = initViewHeight + 'px';
                
                if (doc) {
                    doc.body.style.overflow = '';
                    doc.documentElement.style.overflow = '';
                    
                    const mapContainer = doc.querySelector('.map-container');
                    if (mapContainer) {
                        mapContainer.style.height = '';
                        const gMap = mapContainer.querySelector('iframe');
                        if (gMap) gMap.style.display = '';
                        const staticMap = mapContainer.querySelector('.static-map');
                        if (staticMap) staticMap.style.display = 'none';
                    }
                    ifr.contentWindow.scrollTo(0, originalScrollY);
                    ifr.contentWindow.dispatchEvent(new Event('resize'));
                }
            });

            tileLengthZ = initViewHeight * PX2WORLD;
            const newPlaneGeo = new THREE.PlaneGeometry(tileSize, tileLengthZ);
            tiles.forEach(tileGroup => {
                const mesh = tileGroup.children[0];
                mesh.geometry.dispose();
                mesh.geometry = newPlaneGeo;
            });

            startCamPos.z = 0; 
            
            const btn = document.getElementById('driveBtn');
            btn.style.opacity = '1';
            btn.style.pointerEvents = 'auto';
            document.getElementById('info').style.opacity = '0';
            driveCloseBtn.style.display = 'none';
            mobileHint.style.display = 'none';
            
            scene.fog.color.setHex(0xffffff);
            renderer.setClearColor(0xffffff, 0);
            document.body.style.backgroundColor = '#ffffff';
        }

        window.addEventListener('blur', () => {
            // Ignore blurs caused by clicking the iframe screen (so the car doesn't freeze)
            if (document.activeElement && document.activeElement.tagName.toLowerCase() === 'iframe') {
                // Return focus to the main window immediately so keyboard controls keep working
                setTimeout(() => window.focus(), 0);
                return;
            }
            exitDriveMode();
        });
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) exitDriveMode();
        });

        // ==========================================
        // 8. SKID MARKS SETUP
        // ==========================================
        const skidCanvas = document.createElement('canvas');
        skidCanvas.width = 128;
        skidCanvas.height = 64; // Default to 2x1 ratio placeholder
        
        const skidTexture = new THREE.CanvasTexture(skidCanvas);
        skidTexture.wrapS = THREE.ClampToEdgeWrapping;
        skidTexture.wrapT = THREE.ClampToEdgeWrapping;

        // Load the external tire.png graphic
        const skidImg = new Image();
        skidImg.onload = () => {
            skidCanvas.width = skidImg.width;
            skidCanvas.height = skidImg.height;
            const ctx = skidCanvas.getContext('2d');
            ctx.drawImage(skidImg, 0, 0);
            
            // Tint it solid white so it can be cleanly colored by the material
            ctx.globalCompositeOperation = 'source-in';
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, skidCanvas.width, skidCanvas.height);
            
            skidTexture.needsUpdate = true;
        };
        skidImg.src = DRIFTER.base + 'tire.png';

        const skidMaterial = new THREE.MeshBasicMaterial({
            map: skidTexture,
            color: 0x202B27, 
            transparent: true,
            opacity: 0.6,
            depthWrite: false
        });

        function setUVs(geometry, uMin, uMax) {
            const uvs = geometry.attributes.uv;
            uvs.setXY(0, uMax, 1);
            uvs.setXY(1, uMax, 0);
            uvs.setXY(2, uMin, 1);
            uvs.setXY(3, uMin, 0);
            uvs.needsUpdate = true;
        }

        const skidGeoStart = new THREE.PlaneGeometry(1, 1);
        setUVs(skidGeoStart, 0.0, 0.5);

        const skidGeoMid = new THREE.PlaneGeometry(1, 1);
        setUVs(skidGeoMid, 0.5, 1.0);

        function addSkidMark(pos1, pos2, type) {
            const dist = pos1.distanceTo(pos2);
            if (dist < 0.01) return;

            let geo = skidGeoMid;
            if (type === 0 || type === 2) geo = skidGeoStart;

            const mat = skidMaterial.clone();
            const mesh = new THREE.Mesh(geo, mat);
            const center = new THREE.Vector3().addVectors(pos1, pos2).multiplyScalar(0.5);
            mesh.position.copy(center);
            mesh.position.y = 0.02;

            mesh.lookAt(pos2.x, 0.02, pos2.z);
            mesh.rotateX(-Math.PI / 2);
            
            if (type === 0) {
                mesh.rotateZ(Math.PI);
            }

            mesh.scale.set(0.6, dist * 1.02, 1); // Reduced width of the skid marks to match the physical wheels
            mesh.renderOrder = 1; 

            scene.add(mesh);
            skidMarks.push(mesh);

            if (skidMarks.length > maxSkids) {
                const oldSkid = skidMarks.shift();
                scene.remove(oldSkid);
                oldSkid.material.dispose();
            }
        }

        // ==========================================
        // 9. GAME LOOP & UPDATES
        // ==========================================
        function updateTiles() {
            const refX = (isDriving && swoopProgress >= 1) ? car.position.x : startCamPos.x;
            const refZ = (isDriving && swoopProgress >= 1) ? car.position.z : startCamPos.z;
            const currentTileX = Math.round(refX / tileSize);
            const currentTileZ = Math.round(refZ / tileLengthZ);

            let i = 0;
            for (let x = -1; x <= 1; x++) {
                for (let z = -1; z <= 1; z++) {
                    tiles[i].position.set(
                        (currentTileX + x) * tileSize,
                        0,
                        (currentTileZ + z) * tileLengthZ
                    );
                    cssTiles[i].position.set(
                        (currentTileX + x) * tileSize,
                        0,
                        (currentTileZ + z) * tileLengthZ
                    );
                    i++;
                }
            }
        }

        // ==========================================
        // HONK, MUSIC NOTES & INSPECT MODE
        // ==========================================
        honkSound = new Audio(DRIFTER.base + 'honk.mp3');
        honkSound.preload = 'auto';
        // Two music-note SVGs (transparent background) -> a texture each
        const noteTextures = [], noteAspect = [];
        ['note-1.svg', 'note-2.svg'].forEach((file, i) => {
            const img = new Image();
            img.onload = () => {
                const S = 256;
                const aw = img.naturalWidth || img.width || 1, ah = img.naturalHeight || img.height || 1;
                const ar = aw / ah;
                const cw = ar >= 1 ? S : Math.max(1, Math.round(S * ar));
                const ch = ar >= 1 ? Math.max(1, Math.round(S / ar)) : S;
                const cvs = document.createElement('canvas');
                cvs.width = cw; cvs.height = ch;
                cvs.getContext('2d').drawImage(img, 0, 0, cw, ch);
                const tex = new THREE.CanvasTexture(cvs);
                tex.needsUpdate = true;
                noteTextures[i] = tex; noteAspect[i] = ar;
            };
            img.src = DRIFTER.base + file;
        });

        function honk() {
            if (performance.now() - lastHonk < 500) return;   // 0.5s cooldown
            lastHonk = performance.now();
            if (honkSound) { try { honkSound.currentTime = 0; honkSound.play(); } catch (e) {} }
            honkWobbleVel += 0.18;              // cheerful inertial side-to-side wobble
            spawnNotes();
        }

        function spawnNotes() {
            if (!noteTextures[0] || !noteTextures[1] || !vanModel) return;
            const base = new THREE.Vector3();
            vanModel.getWorldPosition(base);
            base.y += 4;
            for (let i = 0; i < 2; i++) {
                const mat = new THREE.SpriteMaterial({
                    map: noteTextures[i], transparent: true, depthWrite: false, depthTest: false // SVG has native alpha
                });
                const s = new THREE.Sprite(mat);
                s.scale.set(1.5 * (noteAspect[i] || 0.8), 1.5, 1);
                s.position.copy(base);
                const dir = i === 0 ? -1 : 1;
                s.position.x += dir * 1.2;
                // shoot mostly UP with a little outward spread; gravity brings them down in updateNotes
                s.userData.vel = new THREE.Vector3(dir * (1.5 + Math.random() * 1.5), 8 + Math.random() * 2, 0);
                s.userData.life = 0;
                s.userData.maxLife = 1.7;
                scene.add(s);
                noteSprites.push(s);
            }
        }

        function updateNotes(dt) {
            for (let i = noteSprites.length - 1; i >= 0; i--) {
                const s = noteSprites[i];
                s.userData.life += dt;
                s.userData.vel.y -= 16 * dt;                      // gravity: they rise then fall back a little
                s.userData.vel.x *= 0.985;                        // light horizontal drag
                s.position.addScaledVector(s.userData.vel, dt);
                const t = s.userData.life / s.userData.maxLife;
                s.material.opacity = t < 0.55 ? 1 : Math.max(0, 1 - (t - 0.55) / 0.45); // hold, then fade at the end
                if (s.userData.life >= s.userData.maxLife) {
                    scene.remove(s);
                    if (s.material.map) s.material.map.dispose();
                    s.material.dispose();
                    noteSprites.splice(i, 1);
                }
            }
        }

        // Dark overlay + close button (built in JS, no HTML edits needed)
        const inspectOverlay = document.createElement('div');
        inspectOverlay.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,0.6);z-index:1;opacity:0;transition:opacity 0.35s ease;pointer-events:none;';
        document.body.appendChild(inspectOverlay);
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕';
        closeBtn.style.cssText = 'position:absolute;top:1.2rem;right:1.2rem;z-index:11;width:44px;height:44px;border-radius:50%;border:2px solid #fff;background:rgba(0,0,0,0.4);color:#fff;font-size:1.3rem;cursor:pointer;display:none;';
        document.body.appendChild(closeBtn);

        // "Drive" button under the van in inspect mode (mobile only) — WASD red/black palette.
        // Launches the game with the van driving itself; the tall portrait framing leaves room below.
        const driveGameBtn = document.createElement('button');
        driveGameBtn.textContent = 'Drive';
        driveGameBtn.style.cssText = 'position:absolute;right:1.4rem;bottom:15%;z-index:11;display:none;'
            + 'padding:0.6rem 2.4rem;font-family:Helvetica,sans-serif;font-weight:bold;font-size:1.5rem;letter-spacing:0.03em;'
            + 'color:#fff;background:#cc323e;border:3px solid #000;border-radius:12px;cursor:pointer;'
            + 'box-shadow:0 5px 0 #000,0 9px 14px rgba(0,0,0,0.45);-webkit-tap-highlight-color:transparent;transition:transform 0.06s ease,box-shadow 0.06s ease;';
        if (isMobile || window.innerWidth <= 1024) driveGameBtn.style.display = 'none';
        document.body.appendChild(driveGameBtn);
        // chunky key-press feel (right-anchored so it can't be cropped off in portrait)
        const drivePress = () => { driveGameBtn.style.transform = 'translateY(5px)'; driveGameBtn.style.boxShadow = '0 0 0 #000,0 3px 8px rgba(0,0,0,0.45)'; };
        const driveRelease = () => { driveGameBtn.style.transform = 'translateY(0)'; driveGameBtn.style.boxShadow = '0 5px 0 #000,0 9px 14px rgba(0,0,0,0.45)'; };
        driveGameBtn.addEventListener('pointerdown', (e) => { e.stopPropagation(); drivePress(); });
        driveGameBtn.addEventListener('pointerup', (e) => { e.stopPropagation(); driveRelease(); });
        driveGameBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            exitInspect();                       // put the van back on the road
            startTransitionToDrive({ auto: true }); // ...then let it drive itself
        });

        // Red ✕ (top-right) to close the driving game, + a portrait explainer box at the bottom
        const driveCloseBtn = document.createElement('button');
        driveCloseBtn.textContent = '✕';
        driveCloseBtn.style.cssText = 'position:absolute;top:1.1rem;right:1.1rem;z-index:12;'
            + 'align-items:center;justify-content:center;width:44px;height:44px;border-radius:50%;'
            + 'border:2px solid #000;background:#cc323e;color:#fff;font-size:1.25rem;font-weight:bold;cursor:pointer;'
            + '-webkit-tap-highlight-color:transparent;box-shadow:0 3px 8px rgba(0,0,0,0.35);';
        driveCloseBtn.style.display = 'none';
        document.body.appendChild(driveCloseBtn);
        driveCloseBtn.addEventListener('click', (e) => { e.stopPropagation(); mobileGameActive = false; exitDriveMode(); });

        const mobileHint = document.createElement('div');
        mobileHint.textContent = 'Find us on Momiji Zaka Street, Niseko';
        mobileHint.style.cssText = 'position:absolute;left:50%;bottom:4.8rem;transform:translateX(-50%);z-index:10;display:none;'
            + 'white-space:nowrap;text-align:center;padding:0.32rem 0.75rem;border-radius:8px;background:rgba(204,50,62,0.92);color:#fff;'
            + 'font-family:Helvetica,sans-serif;font-weight:bold;font-size:0.68rem;line-height:1.2;pointer-events:none;box-shadow:0 3px 10px rgba(0,0,0,0.3);';
        document.body.appendChild(mobileHint);

        // Transparent capture layer ABOVE the road iframes + van (z-index 3) so the sim receives the
        // mouse while driving. The road/website iframes otherwise swallow every pointer event.
        const interactionLayer = document.createElement('div');
        interactionLayer.style.cssText = 'position:absolute;inset:0;z-index:3;background:transparent;pointer-events:none;';
        document.body.appendChild(interactionLayer);

        function enterInspect() {
            if (inspectMode || !vanModel) return;
            inspectMode = true;
            // Reset driving tilt/wobble/wheels so the van sits level & straight while inspected
            if (bodyTilt) bodyTilt.rotation.set(0, 0, 0);
            leanAngle = leanVelocity = rollAngle = rollVelocity = 0;
            honkWobble = honkWobbleVel = 0;
            wheels.forEach(w => { w.rotation.set(0, 0, 0); if (w.userData.homePos) w.position.copy(w.userData.homePos); });
            inspectYaw = -0.7; inspectPitch = 0.15;             // standard 3/4 showcase pose (no spin)
            modelHome = { parent: vanModel.parent, pos: vanModel.position.clone(),
                          quat: vanModel.quaternion.clone(), scale: vanModel.scale.clone() };
            velocity.x = 0; velocity.z = 0; autoDrive = false; // stop the van so it's steady to inspect
            // Reparent to the camera preserving the CURRENT world transform (no jump) -> tween start
            camera.updateMatrixWorld(true);
            camera.attach(vanModel);
            inspStart.pos.copy(vanModel.position);
            inspStart.quat.copy(vanModel.quaternion);
            // Target pose: 3/4 rotation, centred on the camera axis at a fixed distance
            inspTarget.quat.setFromEuler(new THREE.Euler(inspectPitch, inspectYaw, 0));
            const sp = vanModel.position.clone(), sq = vanModel.quaternion.clone();
            vanModel.quaternion.copy(inspTarget.quat); vanModel.position.set(0, 0, -22.5);
            vanModel.updateMatrixWorld(true);
            const _c = camera.worldToLocal(new THREE.Box3().setFromObject(vanModel).getCenter(new THREE.Vector3()));
            inspTarget.pos.set(-_c.x, -_c.y, -22.5);
            vanModel.position.copy(sp); vanModel.quaternion.copy(sq); // restore to start for the animation
            inspectAnim = 0;                                   // kick off the open animation
            inspDoorFrom = doorL ? doorL.rotation.y : 0;
            if (doorR) doorR.rotation.y = 0;
            inspectOverlay.style.opacity = '1';                // fades in via CSS transition
            inspectOverlay.style.pointerEvents = 'auto';
            closeBtn.style.display = 'block';
            if (isMobile || window.innerWidth <= 1024) {                                    // show the "Drive" launch button, hide footer DRIVE
                driveGameBtn.style.display = 'none';
                const fb = document.getElementById('driveBtn');
                fb.style.opacity = '0'; fb.style.pointerEvents = 'none';
            }
        }

        function exitInspect() {
            if (!inspectMode) return;
            inspectMode = false;
            if (modelHome) {
                modelHome.parent.add(vanModel);
                vanModel.position.copy(modelHome.pos);
                vanModel.quaternion.copy(modelHome.quat);
                vanModel.scale.copy(modelHome.scale);
            }
            inspectOverlay.style.opacity = '0';
            inspectOverlay.style.pointerEvents = 'none';
            closeBtn.style.display = 'none';
            driveGameBtn.style.display = 'none';
            if ((isMobile || window.innerWidth <= 1024) && !isDriving) {                      // back to the parked page -> restore DRIVE button
                const fb = document.getElementById('driveBtn');
                fb.style.opacity = '0'; fb.style.pointerEvents = 'none';
            }
        }
        closeBtn.addEventListener('click', exitInspect);

        function raycastVan(clientX, clientY) {
            if (!vanModel) return false;
            ndc.x = (clientX / window.innerWidth) * 2 - 1;
            ndc.y = -(clientY / window.innerHeight) * 2 + 1;
            raycaster.setFromCamera(ndc, camera);
            return raycaster.intersectObject(vanModel, true).length > 0;
        }

        let _downOnVan = false;
        // Mobile auto-drive: a tap anywhere (except the footer links) resets to the main page.
        // Capture phase so it fires before the sim's interaction layer swallows the event.
        window.addEventListener('pointerdown', (e) => {
            if (!mobileGameActive) return;
            if (performance.now() - mobileGameStart < 400) return;   // ignore the launch tap itself
            if (e.target.closest && e.target.closest('a')) return;   // keep footer links tappable
            mobileGameActive = false;
            exitDriveMode();
        }, true);
        window.addEventListener('pointerdown', (e) => {
            if (!isDriving && !inspectMode) return;
            _downOnVan = raycastVan(e.clientX, e.clientY);
            dragMoved = 0; dragPrevX = e.clientX; dragPrevY = e.clientY;
            if (inspectMode && _downOnVan) isDragging = true;
        });
        window.addEventListener('pointermove', (e) => {
            if (isDragging) {
                const dx = e.clientX - dragPrevX, dy = e.clientY - dragPrevY;
                dragPrevX = e.clientX; dragPrevY = e.clientY;
                dragMoved += Math.abs(dx) + Math.abs(dy);
                inspectYaw += dx * 0.01;
                inspectPitch += dy * 0.01;
                inspectPitch = Math.max(-0.1, Math.min(inspectPitch, 1.3)); // top + sides only, never underneath
                return;
            }
            // Hover feedback: pointer cursor when the van is under the mouse (so you know it's clickable)
            if ((isDriving || inspectMode) && vanModel) {
                interactionLayer.style.cursor = raycastVan(e.clientX, e.clientY) ? 'pointer' : 'default';
            }
        });
        window.addEventListener('pointerup', () => {
            isDragging = false;
            if (dragMoved > 6) return;               // that was a drag, not a click
            if (!inspectMode) { if (_downOnVan) enterInspect(); }
            else { if (!_downOnVan) exitInspect(); } // click off the van closes
        });

        function updateSim(ts) {
            const damp = (k) => Math.pow(k, ts);   // frame-rate-correct multiplicative damping (ts=1 @ 60fps)
            // Honk wobble (inertial side-to-side) + floating music notes
            honkWobbleVel += (0 - honkWobble) * 0.12 * ts;
            honkWobbleVel *= damp(0.90);
            honkWobble += honkWobbleVel * ts;
            updateNotes(ts / 60);

            if (inspectMode) {
                if (inspectAnim < 1) {
                    inspectAnim = Math.min(1, inspectAnim + 0.05 * ts); // ~0.33s open animation
                    const t = 1 - Math.pow(1 - inspectAnim, 3);         // easeOut
                    vanModel.position.lerpVectors(inspStart.pos, inspTarget.pos, t);
                    vanModel.quaternion.copy(inspStart.quat).slerp(inspTarget.quat, t);
                    if (doorL) doorL.rotation.y = inspDoorFrom + (0.45 - inspDoorFrom) * t;
                } else if (vanModel) {
                    vanModel.position.copy(inspTarget.pos);
                    vanModel.rotation.set(inspectPitch, inspectYaw, 0);      // drag pose (no honk on the whole van)
                    if (bodyTilt) bodyTilt.rotation.set(0, 0, honkWobble);  // honk wiggles the body only, not the wheels
                }
                return;
            }

            dirLight.position.set(car.position.x + 100, 150, car.position.z + 50);
            dirLight.target.position.copy(car.position);

            if (isDriving && swoopProgress >= 1) {
                // --- Auto-drive: after 1s with no manual input, wander around automatically ---
                const _now = performance.now();
                if (_now - lastInputTime > 2000) {
                    if (!autoDrive) { autoNextHonk = _now + 1500 + Math.random()*2500; autoNextJump = _now + 2500 + Math.random()*3000; }
                    autoDrive = true;
                }
                if (autoDrive) {
                    if (_now > autoNextTurn) {
                        const r = Math.random();
                        autoSteerDir = r < 0.34 ? -1 : (r < 0.68 ? 1 : 0); // left / right / straight
                        autoNextTurn = _now + 700 + Math.random() * 1600;
                    }
                    keys.ArrowUp = true;
                    keys.ArrowDown = false;
                    keys.ArrowLeft = autoSteerDir < 0;
                    keys.ArrowRight = autoSteerDir > 0;
                    // AI jumps now and then (but never honks — the horn is the user's)
                    if (_now > autoNextJump) { keys.Space = true; autoJumpUntil = _now + 140; autoNextJump = _now + 4000 + Math.random()*6000; }
                    if (autoJumpUntil && _now > autoJumpUntil) { keys.Space = false; autoJumpUntil = 0; }
                }

                // --- Input & Steering ---
                if (keys.ArrowLeft) {
                    steeringAngle += carConfig.steerSpeed * ts;
                } else if (keys.ArrowRight) {
                    steeringAngle -= carConfig.steerSpeed * ts;
                } else {
                    steeringAngle *= damp(0.85);
                }
                steeringAngle = Math.max(-carConfig.maxSteer, Math.min(steeringAngle, carConfig.maxSteer));

                // --- Physics & Velocity ---
                const fX = Math.sin(heading);
                const fZ = Math.cos(heading);
                const rX = Math.cos(heading);
                const rZ = -Math.sin(heading);

                let forwardSpeed = velocity.x * fX + velocity.z * fZ;
                let lateralSpeed = velocity.x * rX + velocity.z * rZ;
                const speedBefore = Math.sqrt(velocity.x ** 2 + velocity.z ** 2);

                if (keys.ArrowUp) {
                    if (forwardSpeed < -0.01) {
                        forwardSpeed += carConfig.braking * ts;
                        if (forwardSpeed > 0) forwardSpeed = 0;
                    } else {
                        forwardSpeed += carConfig.acceleration * ts;
                    }
                } else if (keys.ArrowDown) {
                    if (forwardSpeed > 0.01) {
                        forwardSpeed -= carConfig.braking * ts;
                        if (forwardSpeed < 0) forwardSpeed = 0;
                    } else if (speedBefore < 0.1 || forwardSpeed < -0.01) {
                        forwardSpeed -= carConfig.reverseAccel * ts;
                    } else {
                        forwardSpeed *= damp(0.5);
                        lateralSpeed *= damp(0.8);
                    }
                }

                forwardSpeed *= damp(carConfig.friction);
                lateralSpeed *= damp(carConfig.lateralFriction);

                if (Math.abs(forwardSpeed) < 0.0001) forwardSpeed = 0;
                if (Math.abs(lateralSpeed) < 0.0001) lateralSpeed = 0;

                if (forwardSpeed < -carConfig.maxReverseSpeed) forwardSpeed = -carConfig.maxReverseSpeed;

                if (jumpPhase !== 3) {
                    heading += steeringAngle * carConfig.turnSpeed * (forwardSpeed / carConfig.maxSpeed) * ts;
                }

                // --- Jump Logic ---
                if (keys.Space && jumpPhase === 0 && performance.now() - lastJump > 500) {
                    lastJump = performance.now();   // 0.5s cooldown
                    jumpPhase = 1;
                    jumpAnimProgress = 0;
                }

                if (jumpPhase === 1) {
                    jumpAnimProgress += 0.08 * ts;
                    const t = jumpAnimProgress;
                    carBody.scale.y = 1.0 - 0.2 * t;
                    carBody.scale.x = 1.0 + 0.1 * t;
                    carBody.scale.z = 1.0 + 0.1 * t;
                    if (t >= 1) { jumpPhase = 2; jumpAnimProgress = 0; }
                } else if (jumpPhase === 2) {
                    jumpAnimProgress += 0.12 * ts;
                    const t = jumpAnimProgress;
                    carBody.scale.y = 0.8 + 0.6 * t;
                    carBody.scale.x = 1.1 - 0.3 * t;
                    carBody.scale.z = 1.1 - 0.3 * t;
                    if (t >= 1) { jumpPhase = 3; verticalVelocity = 0.35; }
                } else if (jumpPhase === 3) {
                    verticalVelocity -= jumpGravity * ts;
                    car.position.y += verticalVelocity * ts;

                    carBody.scale.y += (1.0 - carBody.scale.y) * (1 - damp(0.9));
                    carBody.scale.x += (1.0 - carBody.scale.x) * (1 - damp(0.9));
                    carBody.scale.z += (1.0 - carBody.scale.z) * (1 - damp(0.9));

                    if (car.position.y <= 0) {
                        car.position.y = 0;
                        jumpPhase = 4;
                        jumpAnimProgress = 0;
                    }
                } else if (jumpPhase === 4) {
                    jumpAnimProgress += 0.25 * ts;
                    const t = jumpAnimProgress;
                    carBody.scale.y = 1.0 - 0.4 * t;
                    carBody.scale.x = 1.0 + 0.2 * t;
                    carBody.scale.z = 1.0 + 0.2 * t;
                    if (t >= 1) { jumpPhase = 5; jumpAnimProgress = 0; }
                } else if (jumpPhase === 5) {
                    jumpAnimProgress += 0.1 * ts;
                    const t = jumpAnimProgress;
                    carBody.scale.y = 0.6 + 0.4 * t;
                    carBody.scale.x = 1.2 - 0.2 * t;
                    carBody.scale.z = 1.2 - 0.2 * t;
                    if (t >= 1) { jumpPhase = 0; carBody.scale.set(1, 1, 1); }
                }

                velocity.x = fX * forwardSpeed + rX * lateralSpeed;
                velocity.z = fZ * forwardSpeed + rZ * lateralSpeed;

                const currentSpeed = Math.sqrt(velocity.x ** 2 + velocity.z ** 2);
                if (currentSpeed > carConfig.maxSpeed) {
                    velocity.x = (velocity.x / currentSpeed) * carConfig.maxSpeed;
                    velocity.z = (velocity.z / currentSpeed) * carConfig.maxSpeed;
                }

                car.position.x += velocity.x * ts;
                car.position.z += velocity.z * ts;
                car.rotation.y = heading;

                // --- Suspension & Momentum Leaning ---
                let targetLean = 0;
                let targetRoll = 0;
                
                // Only apply momentum lean when firmly grounded
                if (jumpPhase === 0) {
                    targetLean = keys.ArrowUp ? pitchConfig.accelTargetAngle : (keys.ArrowDown ? pitchConfig.brakeTargetAngle : 0);
                    const speedRatio = Math.min(currentSpeed / carConfig.maxSpeed, 1.0);
                    const steerRatio = steeringAngle / carConfig.maxSteer;
                    targetRoll = -steerRatio * rollConfig.targetAngle * speedRatio;
                }

                leanVelocity += (targetLean - leanAngle) * pitchConfig.wobbleFreq * ts;
                leanVelocity *= damp(pitchConfig.wobbleDecay);
                if (Math.abs(leanVelocity) < 0.0001) leanVelocity = 0;
                leanAngle += leanVelocity * ts;
                if (bodyTilt) bodyTilt.rotation.x = leanAngle;

                rollVelocity += (targetRoll - rollAngle) * rollConfig.wobbleFreq * ts;
                rollVelocity *= damp(rollConfig.wobbleDecay);
                if (Math.abs(rollVelocity) < 0.0001) rollVelocity = 0;
                rollAngle += rollVelocity * ts;
                if (bodyTilt) bodyTilt.rotation.z = rollAngle + honkWobble; // roll + honk wobble

                // Wheels follow the body's tilt in width/depth (stay under the arches) but keep
                // their ground height and stay upright — only the position tracks the tilt, not the rotation.
                const _tilt = new THREE.Euler(leanAngle, 0, rollAngle, 'XYZ');
                wheels.forEach((pv) => {
                    const h = pv.userData.homePos;
                    if (!h) return;
                    const p = h.clone().applyEuler(_tilt);
                    pv.position.set(p.x, h.y, p.z);
                });
                
                carBody.position.y = RIDE_HEIGHT + currentSpeed * 0.05;

                wheels.forEach((wheel) => {
                    wheel.rotation.x -= forwardSpeed * 0.5 * ts;
                    if (wheel.userData.isFront) {
                        wheel.rotation.y = steeringAngle;
                    }
                });

                // --- Skid Marks ---
                car.updateMatrixWorld();
                // Place skids at the actual rear wheels so they match the wheelbase
                let gotWheels = false;
                for (const w of wheels) {
                    if (w.name === 'Wheel_RL_pivot') { w.getWorldPosition(currentPosL); gotWheels = true; }
                    else if (w.name === 'Wheel_RR_pivot') { w.getWorldPosition(currentPosR); }
                }
                if (!gotWheels) {
                    currentPosL.set(-0.8, 0.4, 0).applyMatrix4(car.matrixWorld);
                    currentPosR.set(0.8, 0.4, 0).applyMatrix4(car.matrixWorld);
                }
                currentPosL.y = 0.02;
                currentPosR.y = 0.02;

                const skidThreshold = 0.025; // Lowered threshold makes drifting trigger more naturally
                const currentlySkidding = Math.abs(lateralSpeed) > skidThreshold && currentSpeed > 0.15 && jumpPhase !== 3;

                if (!hasLastPos) {
                    hasLastPos = true;
                    lastPosL.copy(currentPosL);
                    lastPosR.copy(currentPosR);
                } else if (currentlySkidding) {
                    if (lastPosL.distanceTo(currentPosL) > 1.5) { // Spaced out to match their newly stretched length
                        addSkidMark(lastPosL, currentPosL, skidState);
                        addSkidMark(lastPosR, currentPosR, skidState);
                        skidState = 1;
                        lastPosL.copy(currentPosL);
                        lastPosR.copy(currentPosR);
                    }
                } else {
                    if (skidState > 0 || (wasSkidding && lastPosL.distanceTo(currentPosL) > 0.02)) {
                        addSkidMark(lastPosL, currentPosL, 2);
                        addSkidMark(lastPosR, currentPosR, 2);
                    }
                    skidState = 0;
                    lastPosL.copy(currentPosL);
                    lastPosR.copy(currentPosR);
                }
                wasSkidding = currentlySkidding;

                // --- Fade Skid Marks ---
                for (let i = skidMarks.length - 1; i >= 0; i--) {
                    const skid = skidMarks[i];
                    skid.material.opacity -= 0.005 * ts; // Fade out 5x faster to free up GPU fill-rate
                    if (skid.material.opacity <= 0) {
                        scene.remove(skid);
                        skid.material.dispose();
                        skidMarks.splice(i, 1);
                    }
                }

                // --- Swinging Door Physics ---
                // The target "rest" angle when completely stopped and upright (half open)
                const neutralAngle = 0.3; 
                
                // 1. Gravity / Roll Force
                // Leaning left (rollAngle > 0) pulls left door open (+), pushes right door closed (-)
                // Leaning right (rollAngle < 0) pushes left door closed (-), pulls right door open (+)
                const gravityFactor = 0.02;
                const rollForceL = rollAngle * gravityFactor;
                const rollForceR = -rollAngle * gravityFactor;

                // 2. Wind & Acceleration Inertia
                const accel = forwardSpeed - prevForwardSpeed;
                const accelForce = -accel * 0.5; // Braking throws doors open (+), accelerating shuts them (-)
                
                // Driving forward gently pushes doors closed. Reversing catches the doors and flings them wide!
                const windForce = forwardSpeed > 0 ? -forwardSpeed * 0.005 : -forwardSpeed * 0.05;

                // 3. Spring Force (Hinge Tension)
                // Low stiffness creates the "inertial bounce that has a long decay"
                const springStiffness = 0.02; 
                const springForceL = (neutralAngle - doorAngleL) * springStiffness;
                const springForceR = (neutralAngle - doorAngleR) * springStiffness;

                doorVelL += (rollForceL + windForce + accelForce + springForceL) * ts;
                doorVelR += (rollForceR + windForce + accelForce + springForceR) * ts;

                // Damping for the long wobble decay
                doorVelL *= damp(0.95);
                doorVelR *= damp(0.95);

                doorAngleL += doorVelL * ts;
                doorAngleR += doorVelR * ts;

                // Collisions (Slamming / Hyperextension)
                const maxDoorAngle = Math.PI * 0.6; // Past 90 degrees

                // Left Door Limits
                if (doorAngleL <= 0) {
                    doorAngleL = 0;
                    doorVelL *= -0.2; // Slam close with a very slight wobble
                } else if (doorAngleL >= maxDoorAngle) {
                    doorAngleL = maxDoorAngle;
                    doorVelL *= -0.4; // Bounce off the hinges when fully open
                }

                // Right Door Limits
                if (doorAngleR <= 0) {
                    doorAngleR = 0;
                    doorVelR *= -0.2; // Slam close with a very slight wobble
                } else if (doorAngleR >= maxDoorAngle) {
                    doorAngleR = maxDoorAngle;
                    doorVelR *= -0.4; // Bounce off the hinges when fully open
                }

                if (doorL) doorL.rotation.y = doorAngleL;
                if (doorR) doorR.rotation.y = -doorAngleR;

                prevForwardSpeed = forwardSpeed;
                prevLateralSpeed = lateralSpeed;
            }

            updateTiles();

            // --- Camera Tracking & Intro Swoop ---
            targetCameraPos.copy(car.position).add(cameraOffset);
            targetCameraPos.y -= car.position.y; // Prevent camera from flying up when the car jumps

            if (!isDriving) {
                camera.position.copy(startCamPos);
                camera.up.set(0, 0, 1);
                camera.lookAt(startCamPos.x, 0, startCamPos.z);
                // Page-off / parked: keep the wheels pointing straight so they never spin turned
                steeringAngle = 0;
                wheels.forEach(w => { w.rotation.y = 0; });
            } else if (swoopProgress < 1) {
                swoopProgress += 0.011 * ts;   // faster fly-in (~2x)
                const t = Math.min(1, swoopProgress);
                const easeOut = 1 - Math.pow(1 - t, 3);

                car.position.z = targetCarZ - 40 * (1 - easeOut);

                wheels.forEach((wheel) => {
                    wheel.rotation.x -= 0.6 * (1 - t) * ts;
                });

                const startColor = new THREE.Color(0xffffff);
                const endColor = new THREE.Color(0xffffff); // white sky
                scene.fog.color.lerpColors(startColor, endColor, easeOut);
                renderer.setClearColor(scene.fog.color, 0); 
                document.body.style.backgroundColor = scene.fog.color.getStyle(); 
                
                const finalCamPos = new THREE.Vector3(0, 0, targetCarZ).add(cameraOffset);
                camera.position.lerpVectors(startCamPos, finalCamPos, easeOut);
                
                camera.up.set(0, easeOut, 1 - easeOut).normalize();
                if (camera.up.lengthSq() === 0) camera.up.set(0, 1, 0);
                
                const lookTarget = new THREE.Vector3(startCamPos.x, 0, startCamPos.z);
                lookTarget.lerp(car.position, easeOut);
                camera.lookAt(lookTarget);
            } else {
                camera.up.set(0, 1, 0);
                camera.position.lerp(targetCameraPos, 1 - damp(0.85));
                camera.lookAt(camera.position.x - cameraOffset.x, camera.position.y - cameraOffset.y, camera.position.z - cameraOffset.z);
            }

        }

        // --- Frame loop: exactly one simulation step per rendered frame, scaled by real elapsed time.
        //     `ts` (time-scale) is 1.0 at 60fps; ~0.5 on a 120 Hz screen, ~2 on a throttled 30 Hz one.
        //     Every frame is both simulated AND drawn, so motion stays smooth at any refresh rate while
        //     the van keeps the same real-world speed — no low-battery slow-mo, and no 60/120 Hz jitter. ---
        let _lastFrame = performance.now();
        function animate() {
            requestAnimationFrame(animate);
            const now = performance.now();
            let dt = (now - _lastFrame) / 1000;
            _lastFrame = now;
            if (dt > 0.05) dt = 0.05;                    // clamp big gaps (tab switch) to ~20fps of motion
            updateSim(dt * 60);                          // ts = dt * 60  (1.0 at 60fps)
            cssRenderer.render(cssScene, camera);
            renderer.render(scene, camera);
        }

        // --- Window resizing ---
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            cssRenderer.setSize(window.innerWidth, window.innerHeight);
            // Re-evaluate mobile mode (viewport / orientation change) and adjust camera + keyboard
            isMobile = detectMobile();
            applyCameraZoom();
            const kb = document.getElementById('wasdWrap');
            if (kb) kb.style.display = (isMobile || window.innerWidth <= 1024) ? 'none' : '';
            // Re-fit the floor to the new aspect so the site re-lays-out (no zoomed/cropped slice)
            floorPxW = floorWidthPx();
            tileSize = floorPxW * PX2WORLD;
            cssTiles.forEach(cssObj => { cssObj.element.style.width = floorPxW + 'px'; });
            const rezGeo = new THREE.PlaneGeometry(tileSize, tileLengthZ);
            tiles.forEach(t => { const m = t.children[0]; m.geometry.dispose(); m.geometry = rezGeo; });
        });

        animate();

    // Side-Piece: pull the live site's banner links in (rather than duplicating them)
    if (DRIFTER.banner === 'sidepiece') pullBanner();
    function pullBanner() {
      var footer = document.querySelector('footer.footer'); if (!footer) return;
      var tries = 0;
      var iv = setInterval(function () {
        var ok = false;
        try {
          var ifr = cssTiles[4] && cssTiles[4].element.querySelector('iframe');
          var doc = ifr && ifr.contentDocument;
          var src = doc && doc.querySelector('.footer');
          if (src && src.querySelectorAll('a').length) {
            var db = footer.querySelector('#driveBtn');
            Array.prototype.forEach.call(footer.querySelectorAll('a'), function (a) { a.remove(); });
            Array.prototype.forEach.call(src.querySelectorAll('a'), function (a) { footer.insertBefore(a.cloneNode(true), db); });
            // Preserve hardcoded links that aren't in the iframe footer
            var existingHrefs = Array.prototype.map.call(footer.querySelectorAll('a'), function(a){ return a.href; });
            if (existingHrefs.indexOf('https://fabradiokk.com/') === -1 && existingHrefs.indexOf('https://fabradiokk.com') === -1) {
              var fab = document.createElement('a');
              fab.href = 'https://fabradiokk.com'; fab.target = '_blank'; fab.rel = 'noopener noreferrer'; fab.textContent = 'FAB RADIO';
              footer.insertBefore(fab, db);
            }
            ok = true;
          }
        } catch (e) {}
        if (ok || ++tries > 20) clearInterval(iv);
      }, 300);
    }
  }
})();