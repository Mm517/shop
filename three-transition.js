/**
 * انتقال ثلاثي الأبعاد بين الصفحات (Three.js)
 * فكرة التصميم: خطوط "مسار الجري" المائلة تنطلق عبر الشاشة أثناء تغيير الصفحة،
 * وكأن عداء يمر أمام الكاميرا لحظة الانتقال.
 */
(function () {
  const canvas = document.getElementById("page-transition-canvas");
  if (!canvas || !window.THREE) return;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const uniforms = {
    u_time: { value: 0 },
    u_progress: { value: 0 }, // 0 = مخفي, 1 = مغطى بالكامل
    u_color1: { value: new THREE.Color(0x1d33f0) },
    u_color2: { value: new THREE.Color(0x14171a) },
    u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform float u_progress;
      uniform vec3 u_color1;
      uniform vec3 u_color2;
      uniform vec2 u_resolution;

      void main() {
        vec2 uv = vUv;
        float aspect = u_resolution.x / u_resolution.y;
        // خطوط مائلة متعددة (مسارات جري)
        float diag = (uv.x + uv.y * 0.35) ;
        float lanes = fract(diag * 6.0);
        float edge = smoothstep(u_progress - 0.18, u_progress + 0.02, diag * 0.9 + 0.05);
        float laneMix = step(0.5, lanes);
        vec3 col = mix(u_color1, u_color2, laneMix);
        float alpha = 1.0 - edge;
        alpha *= step(0.0001, u_progress);
        gl_FragColor = vec4(col, alpha);
      }
    `,
  });

  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(quad);

  let animId = null;
  function renderFrame() {
    uniforms.u_time.value += 0.016;
    renderer.render(scene, camera);
    animId = requestAnimationFrame(renderFrame);
  }
  renderFrame();

  window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
  });

  function animateProgress(from, to, duration, onDone) {
    const start = performance.now();
    canvas.style.opacity = 1;
    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      uniforms.u_progress.value = from + (to - from) * eased;
      renderer.render(scene, camera);
      if (t < 1) {
        requestAnimationFrame(step);
      } else if (onDone) {
        onDone();
      }
    }
    requestAnimationFrame(step);
  }

  // كشف الانتقال: يغطي الشاشة قبل مغادرة الصفحة، وإذا كانت الصفحة القادمة
  // معلّمة بأنها بعد انتقال، يبدأ مكشوفاً بالكامل ثم يكشف تدريجياً.
  window.PageTransition = {
    coverAndGo(href) {
      animateProgress(0, 1.05, 480, () => {
        sessionStorage.setItem("veloce_transition_in", "1");
        window.location.href = href;
      });
    },
    revealOnLoad() {
      const shouldReveal = sessionStorage.getItem("veloce_transition_in") === "1";
      sessionStorage.removeItem("veloce_transition_in");
      if (shouldReveal) {
        uniforms.u_progress.value = 1.05;
        canvas.style.opacity = 1;
        animateProgress(1.05, 0, 520, () => {
          canvas.style.opacity = 0;
        });
      } else {
        canvas.style.opacity = 0;
      }
    },
  };

  // اعتراض روابط التنقل الداخلية لتشغيل الانتقال
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-transition]");
    if (!a) return;
    const href = a.getAttribute("href");
    if (!href || href.startsWith("#")) return;
    e.preventDefault();
    window.PageTransition.coverAndGo(href);
  });

  window.PageTransition.revealOnLoad();
})();
