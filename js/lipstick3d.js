/* מיכל לכטר — photoreal 3D lipstick (Three.js r160 UMD).
   Real-product construction: black lacquer base + gold ring, ribbed polished-gold sleeve, satin-cream bullet
   with a crisp angled face, studio strip-light reflections. Drag to spin. Renders only while visible. */
(function () {
  const canvas = document.getElementById('lip3d');
  if (!canvas) return;
  const stage = canvas.parentElement;
  if (!window.THREE) { stage.classList.add('no-webgl'); return; }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); }
  catch (e) { stage.classList.add('no-webgl'); return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100);
  camera.position.set(0, 0.9, 11);
  const target = new THREE.Vector3(0, 0.15, 0);

  /* Photo-studio environment: long thin strip softboxes are what create the crisp vertical
     highlight lines that make metal and lipstick read as "real". */
  (function env() {
    const pm = new THREE.PMREMGenerator(renderer);
    const room = new THREE.Scene();
    room.add(new THREE.Mesh(new THREE.BoxGeometry(30, 30, 30), new THREE.MeshBasicMaterial({ color: 0x24161d, side: THREE.BackSide })));
    const box = (w, h, x, y, z, ry, c, k) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), side: THREE.DoubleSide }));
      m.position.set(x, y, z); m.lookAt(0, y, 0); room.add(m);
    };
    box(1.2, 16, 8, 1, 6, 0, 0xffffff, 14);      // key strip (front-right)
    box(0.8, 16, -9, 1, 4, 0, 0xfff1e8, 9);      // fill strip (front-left)
    box(2.5, 16, 0, 1, -12, 0, 0xffd9cf, 3);     // back rim
    box(10, 3, 0, 12, 0, 0, 0xffffff, 3);        // top soft
    box(3, 16, -11, 0, -6, 0, 0xff4d5e, 2.2);    // coral kicker (brand accent in reflections)
    scene.environment = pm.fromScene(room, 0.012).texture;
    pm.dispose();
  })();
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(4, 7, 6);
  key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.radius = 8;
  key.shadow.camera.left = -3; key.shadow.camera.right = 3; key.shadow.camera.top = 4; key.shadow.camera.bottom = -4;
  scene.add(key);
  const rim = new THREE.PointLight(0xff6b78, 18, 14); rim.position.set(-3.5, 2, -3); scene.add(rim);

  /* procedural textures */
  function ribTexture() {                      // fine vertical ribs for the gold sleeve
    const c = document.createElement('canvas'); c.width = 512; c.height = 8;
    const g = c.getContext('2d');
    for (let x = 0; x < 512; x++) { const v = 128 + Math.sin(x / 512 * Math.PI * 2 * 48) * 110; g.fillStyle = `rgb(${v|0},${v|0},${v|0})`; g.fillRect(x, 0, 1, 8); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
  }
  function creamTexture() {                    // subtle creamy micro-texture + tiny swirls on the bullet
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d'); g.fillStyle = '#808080'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 3500; i++) { const v = 110 + Math.random() * 40; g.fillStyle = `rgba(${v|0},${v|0},${v|0},.5)`; g.fillRect(Math.random() * 256, Math.random() * 256, 1.4, 1.4); }
    g.strokeStyle = 'rgba(150,150,150,.35)'; g.lineWidth = 2;
    for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(Math.random() * 256, Math.random() * 256, 20 + Math.random() * 60, 0, 2); g.stroke(); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
  }

  const gold = new THREE.MeshPhysicalMaterial({ color: 0xE6C08A, metalness: 1, roughness: 0.14, clearcoat: 0.6, clearcoatRoughness: 0.05 });
  const goldRibbed = gold.clone(); goldRibbed.bumpMap = ribTexture(); goldRibbed.bumpScale = 1.4; goldRibbed.roughness = 0.2;
  const lacquer = new THREE.MeshPhysicalMaterial({ color: 0x120a0e, metalness: 0, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.03 });
  const cream = creamTexture();
  const lipMat = new THREE.MeshPhysicalMaterial({
    color: 0xC0182F, roughness: 0.38, roughnessMap: cream, bumpMap: cream, bumpScale: 0.35,
    clearcoat: 0.9, clearcoatRoughness: 0.12, sheen: 0.7, sheenRoughness: 0.35, sheenColor: new THREE.Color(0xff8a96)
  });

  const lipstick = new THREE.Group(); scene.add(lipstick);
  const lathe = (pts, mat, seg = 160) => { const m = new THREE.Mesh(new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), seg), mat); m.castShadow = true; return m; };

  // base: black lacquer with softly rounded edges
  lipstick.add(lathe([[0, -2.1], [0.52, -2.1], [0.56, -2.06], [0.57, -2.0], [0.57, -0.62], [0.555, -0.6], [0, -0.6]], lacquer));
  // gold ring at the top of the base
  lipstick.add(lathe([[0.555, -0.62], [0.585, -0.6], [0.59, -0.52], [0.585, -0.48], [0.555, -0.47]], gold));
  // ribbed gold sleeve
  const sleeve = lathe([[0.47, -0.48], [0.475, -0.47], [0.475, 0.32], [0.46, 0.34], [0.43, 0.345], [0.43, 0.3]], goldRibbed);
  goldRibbed.bumpMap.repeat.set(1, 1); lipstick.add(sleeve);

  // bullet: lathe body with a rounded shoulder, then a crisp angled face (vertices projected onto a slanted plane)
  const R = 0.38, H0 = 0.32, H1 = 1.55;
  const prof = [[0.001, H0], [R, H0]];
  for (let i = 0; i <= 24; i++) { const t = i / 24; prof.push([R - Math.pow(t, 6) * 0.03, H0 + t * (H1 - H0)]); }
  prof.push([0.3, H1 + 0.05], [0.001, H1 + 0.06]);
  const bulletGeo = new THREE.LatheGeometry(prof.map(p => new THREE.Vector2(p[0], p[1])), 160, 0, Math.PI * 2);
  const pos = bulletGeo.attributes.position, slope = 0.95, top = H1 - 0.05;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i);
    const plane = top - (x + R) * slope;              // the cut face, high on one side, low on the other
    if (y > plane) pos.setY(i, plane + (y - plane) * 0.02);
  }
  bulletGeo.computeVertexNormals();
  const bullet = new THREE.Mesh(bulletGeo, lipMat); bullet.castShadow = true; lipstick.add(bullet);

  // the cap, floating beside (lacquer with gold ring)
  const cap = new THREE.Group();
  cap.add(lathe([[0.58, -0.9], [0.6, -0.88], [0.6, 0.86], [0.57, 0.9], [0.001, 0.9]], lacquer));
  cap.add(lathe([[0.6, -0.9], [0.63, -0.88], [0.63, -0.78], [0.6, -0.76]], gold));
  const capIn = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 1.75, 96, 1, true), new THREE.MeshStandardMaterial({ color: 0x080406, side: THREE.BackSide })); cap.add(capIn);
  cap.position.set(1.7, 0.9, -0.8); cap.rotation.set(0.35, 0, -0.42); scene.add(cap);

  lipstick.rotation.set(0.12, 0.6, -0.12);

  // soft contact shadow under the floating product
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.ShadowMaterial({ opacity: 0.35 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -2.75; ground.receiveShadow = true; scene.add(ground);

  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w / h < 0.8 ? 32 : 26; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(stage); resize();

  let vel = reduce ? 0 : 0.35, dragging = false, lastX = 0, tiltT = 0;
  stage.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; stage.setPointerCapture(e.pointerId); });
  stage.addEventListener('pointermove', e => {
    const r = stage.getBoundingClientRect(); tiltT = ((e.clientY - r.top) / r.height - 0.5) * 0.35;
    if (!dragging) return; const dx = e.clientX - lastX; lastX = e.clientX; vel = dx * 0.25; lipstick.rotation.y += dx * 0.012;
  });
  addEventListener('pointerup', () => { dragging = false; });

  let visible = true, last = performance.now();
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) { last = performance.now(); requestAnimationFrame(tick); } }).observe(stage);
  function tick(t) {
    if (!visible) return;
    const dt = Math.min(0.05, (t - last) / 1000); last = t;
    if (!dragging) { vel += ((reduce ? 0 : 0.35) - vel) * dt * 1.5; lipstick.rotation.y += vel * dt; }
    lipstick.rotation.x += (0.12 + tiltT - lipstick.rotation.x) * dt * 3;
    if (!reduce) {
      lipstick.position.y = 0.25 + Math.sin(t * 0.001) * 0.07;
      cap.position.y = 0.9 + Math.sin(t * 0.0012 + 1) * 0.1; cap.rotation.y += dt * 0.3;
    }
    camera.lookAt(target);
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  lipstick.position.y = 0.25;
  stage.classList.add('ready');
  requestAnimationFrame(tick);
})();
