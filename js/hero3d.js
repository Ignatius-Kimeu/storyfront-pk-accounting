/* PK Accounting — hero "Paper to File" (Three.js r128)
   Scattered papers (receipt, P9, bank statement, invoice) drift into one neat stack,
   then a red-ink FILED stamp lands on top. Falls back to the static CSS stack when
   WebGL is missing or the visitor prefers reduced motion. */
(function () {
  var stage = document.getElementById('hero-stage');
  if (!stage || !window.THREE) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var probe = document.createElement('canvas');
  if (!(probe.getContext('webgl') || probe.getContext('experimental-webgl'))) return;

  var T = window.THREE;
  var GREEN = '#0E3B30', GREEN7 = '#1F6A55', RED = '#B8322A', PAPER = '#FBFCFA', LINE = '#D4DFD8', MUTED = '#6B7D75';

  var renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  stage.appendChild(renderer.domElement);

  var scene = new T.Scene();
  var camera = new T.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 7.2, 8.6);
  camera.lookAt(0, 0.2, 0);

  scene.add(new T.HemisphereLight(0xffffff, 0xcfe0d6, 0.75));
  var sun = new T.DirectionalLight(0xffffff, 0.75);
  sun.position.set(-3, 9, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -5; sun.shadow.camera.right = 5;
  sun.shadow.camera.top = 5; sun.shadow.camera.bottom = -5;
  sun.shadow.radius = 6;
  scene.add(sun);

  var floor = new T.Mesh(new T.PlaneGeometry(20, 20), new T.ShadowMaterial({ opacity: 0.16 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.02;
  floor.receiveShadow = true;
  scene.add(floor);

  /* ---------- paper textures drawn on canvas ---------- */
  function paperTexture(kind) {
    var W = 512, H = 700, c = document.createElement('canvas');
    c.width = W; c.height = H;
    var g = c.getContext('2d');
    g.fillStyle = PAPER; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(14,59,48,.035)';
    for (var i = 0; i < 1400; i++) g.fillRect(Math.random() * W, Math.random() * H, 1.2, 1.2); // paper grain
    var mono = '500 22px "IBM Plex Mono", Consolas, monospace';
    var monoS = '400 17px "IBM Plex Mono", Consolas, monospace';
    g.textBaseline = 'alphabetic';

    function lines(y0, n, gap, withFigures) {
      g.font = monoS;
      for (var k = 0; k < n; k++) {
        var y = y0 + k * gap;
        g.fillStyle = LINE; g.fillRect(44, y + 10, W - 88, 2);
        if (withFigures) {
          g.fillStyle = MUTED;
          g.fillRect(48, y - 6, 110 + ((k * 53) % 120), 7);
          g.textAlign = 'right';
          g.fillText((1200 + ((k * 7919) % 48000)).toLocaleString('en-KE') + '.00', W - 48, y + 2);
          g.textAlign = 'left';
        }
      }
    }
    function heading(t, sub) {
      g.fillStyle = GREEN; g.font = mono; g.textAlign = 'left';
      g.fillText(t, 44, 78);
      g.fillStyle = MUTED; g.font = monoS; g.fillText(sub, 44, 108);
      g.fillStyle = GREEN; g.fillRect(44, 128, W - 88, 3);
    }

    if (kind === 'receipt') {
      heading('RECEIPT', 'No. 004817 · Nairobi');
      lines(190, 9, 44, true);
      g.fillStyle = GREEN; g.fillRect(44, 600, W - 88, 3);
      g.font = mono; g.fillText('TOTAL', 44, 640);
      g.textAlign = 'right'; g.fillText('KES —', W - 44, 640);
    } else if (kind === 'p9') {
      heading('P9 FORM', 'Tax deduction card · 2025');
      g.strokeStyle = LINE; g.lineWidth = 2;
      for (var col = 0; col < 5; col++) g.strokeRect(44 + col * 85, 170, 85, 440);
      lines(210, 9, 44, false);
    } else if (kind === 'bank') {
      heading('BANK STATEMENT', 'Account summary · Q2');
      lines(190, 10, 42, true);
    } else if (kind === 'invoice') {
      heading('INVOICE', 'eTIMS · INV-2026-0192');
      lines(200, 7, 48, true);
      g.fillStyle = GREEN7; g.fillRect(44, 560, 180, 60);
      g.fillStyle = PAPER; g.font = mono; g.fillText('PAID', 90, 598);
    } else { // return — the top sheet
      heading('INCOME TAX RETURN', 'Year of income 2025');
      lines(200, 8, 46, true);
      g.fillStyle = GREEN; g.fillRect(44, 590, W - 88, 3);
      g.font = mono; g.fillText('TAX DUE', 44, 632);
      g.fillStyle = RED; g.fillRect(W - 210, 646, 166, 3); g.fillRect(W - 210, 654, 166, 3); // the double rule
    }
    var tex = new T.CanvasTexture(c);
    tex.encoding = T.sRGBEncoding;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return tex;
  }

  function stampTexture() {
    var W = 512, H = 256, c = document.createElement('canvas');
    c.width = W; c.height = H;
    var g = c.getContext('2d');
    g.strokeStyle = RED; g.lineWidth = 12;
    roundRect(g, 14, 14, W - 28, H - 28, 22); g.stroke();
    g.fillStyle = RED; g.textAlign = 'center';
    g.font = '600 104px "IBM Plex Mono", Consolas, monospace';
    g.fillText('FILED', W / 2, 150);
    g.fillRect(110, 180, W - 220, 8); g.fillRect(110, 196, W - 220, 8);
    // ink texture: knock out random specks so it reads as rubber-stamped
    g.globalCompositeOperation = 'destination-out';
    for (var i = 0; i < 900; i++) { g.globalAlpha = Math.random() * 0.6; g.fillRect(Math.random() * W, Math.random() * H, 3, 3); }
    var tex = new T.CanvasTexture(c);
    tex.encoding = T.sRGBEncoding;
    return tex;
  }
  function roundRect(g, x, y, w, h, r) {
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }

  /* ---------- build the papers ---------- */
  var group = new T.Group();
  scene.add(group);
  var kinds = ['receipt', 'p9', 'bank', 'invoice', 'return'];
  var edgeMat = new T.MeshStandardMaterial({ color: 0xe9efeb, roughness: 0.95 });
  var docs = [];
  var PW = 2.6, PH = 3.55, TH = 0.024;

  // scattered start positions (x, y, z, rotX, rotY, rotZ)
  var scatter = [
    [-2.6, 1.9, -0.6, -0.9, 0.5, 0.35],
    [2.4, 2.4, -1.1, 0.7, -0.4, -0.5],
    [-1.8, 3.1, 1.3, 0.5, 0.9, 0.6],
    [2.1, 1.4, 1.2, -0.6, -0.8, 0.3],
    [0.2, 3.6, 0.1, 0.35, 0.25, -0.25]
  ];

  function build() {
    kinds.forEach(function (k, i) {
      var top = new T.MeshStandardMaterial({ map: paperTexture(k), roughness: 0.88 });
      // box faces: +x, -x, +y (top), -y, +z, -z
      var mesh = new T.Mesh(new T.BoxGeometry(PW, TH, PH), [edgeMat, edgeMat, top, edgeMat, edgeMat, edgeMat]);
      mesh.castShadow = true; mesh.receiveShadow = true;
      var s = scatter[i];
      var rest = { x: (Math.random() - 0.5) * 0.14, y: TH / 2 + i * (TH + 0.004), z: (Math.random() - 0.5) * 0.14, ry: (Math.random() - 0.5) * 0.16 };
      if (i === kinds.length - 1) rest.ry = -0.03;
      mesh.userData = { from: s, rest: rest, delay: 0.35 + i * 0.28, phase: Math.random() * 6.28 };
      mesh.position.set(s[0], s[1], s[2]);
      mesh.rotation.set(s[3], s[4], s[5]);
      group.add(mesh);
      docs.push(mesh);
    });

    var stamp = new T.Mesh(new T.PlaneGeometry(1.25, 0.625),
      new T.MeshBasicMaterial({ map: stampTexture(), transparent: true, opacity: 0, depthWrite: false }));
    stamp.rotation.x = -Math.PI / 2;
    stamp.rotation.z = 0.16;
    stamp.userData.restY = docs[docs.length - 1].userData.rest.y + TH / 2 + 0.003;
    stamp.position.set(0.32, 2.2, 0.72);
    group.add(stamp);
    docs.stamp = stamp;
  }

  /* ---------- sizing ---------- */
  function resize() {
    var w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // pull the camera back on tall/narrow stages so the stack never clips
    var dist = w / h < 1.05 ? 8.3 : 7.6;
    camera.position.set(0, dist * 0.78, dist * 0.93);
    camera.lookAt(0, 0.25, 0);
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);

  /* ---------- interaction: gentle parallax ---------- */
  var target = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
  window.addEventListener('pointermove', function (e) {
    target.x = (e.clientX / window.innerWidth - 0.5);
    target.y = (e.clientY / window.innerHeight - 0.5);
  }, { passive: true });
  var scrollK = 0;
  window.addEventListener('scroll', function () { scrollK = Math.min(window.scrollY / 600, 1); }, { passive: true });

  /* ---------- animation ---------- */
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function clamp01(t) { return t < 0 ? 0 : t > 1 ? 1 : t; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  var start = null, visible = true, running = false, built = false;
  function kick() { if (built && visible && !running) { running = true; requestAnimationFrame(frame); } }
  var SETTLE = 1.25; // seconds each sheet takes to land

  function frame(now) {
    if (!visible) { running = false; return; }
    if (start === null) start = now;
    var t = (now - start) / 1000;

    docs.forEach(function (m) {
      var u = m.userData, f = u.from, r = u.rest;
      var p = easeInOut(clamp01((t - u.delay) / SETTLE));
      var bob = (1 - p) * Math.sin(t * 1.6 + u.phase) * 0.12; // float while scattered
      m.position.set(lerp(f[0], r.x, p), lerp(f[1], r.y, p) + bob, lerp(f[2], r.z, p));
      m.rotation.set(lerp(f[3], 0, p), lerp(f[4], r.ry, p), lerp(f[5], 0, p));
    });

    var st = docs.stamp, sd = docs[docs.length - 1].userData.delay + SETTLE + 0.25;
    var sp = clamp01((t - sd) / 0.32);
    if (sp > 0) {
      var land = easeOut(sp);
      st.material.opacity = Math.min(1, sp * 2.2) * 0.92;
      st.position.y = lerp(1.6, st.userData.restY, land);
      var sc = lerp(1.5, 1, land);
      var squash = sp >= 1 ? 1 + Math.max(0, 0.06 - (t - sd - 0.32) * 0.3) : 1;
      st.scale.set(sc * squash, sc * squash, 1);
    }

    // idle: the finished stack breathes and follows the cursor a little
    cur.x += (target.x - cur.x) * 0.05;
    cur.y += (target.y - cur.y) * 0.05;
    group.rotation.y = -0.42 + cur.x * 0.35 + Math.sin(t * 0.35) * 0.04 + scrollK * 0.25;
    group.rotation.x = cur.y * 0.12;
    group.position.y = -0.1 - scrollK * 0.4;

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  // stop drawing when the hero is off-screen or the tab is hidden (saves battery on phones)
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      visible = en[0].isIntersecting && !document.hidden;
      kick();
    }).observe(stage);
  }
  document.addEventListener('visibilitychange', function () {
    visible = !document.hidden;
    kick();
  });

  // wait for the mono font so the paper labels render in IBM Plex Mono, not a fallback
  var fontsReady = document.fonts && document.fonts.load ? Promise.all([
    document.fonts.load('500 22px "IBM Plex Mono"'), document.fonts.load('400 17px "IBM Plex Mono"'), document.fonts.load('600 104px "IBM Plex Mono"')
  ]).catch(function () {}) : Promise.resolve();
  var timeout = new Promise(function (res) { setTimeout(res, 1500); });

  Promise.race([fontsReady, timeout]).then(function () {
    build();
    resize();
    stage.classList.add('gl');
    // start once the splash has cleared so the settle is actually seen
    var delay = document.querySelector('.splash:not(.done)') ? 700 : 0;
    setTimeout(function () { built = true; kick(); }, delay);
  });
})();
