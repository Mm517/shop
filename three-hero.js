/**
 * مشهد ثلاثي الأبعاد في الصفحة الرئيسية: شكل ديناميكي يرمز للحركة والطاقة،
 * يتفاعل بلطف مع حركة الماوس، مبني بألوان الهوية (كوبالت + فولت).
 */
(function () {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas || !window.THREE) return;

  const parent = canvas.parentElement;
  let width = parent.clientWidth;
  let height = parent.clientHeight;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(0, 0, 7);

  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);
  const key = new THREE.DirectionalLight(0xd3ff3d, 1.4);
  key.position.set(4, 5, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x1d33f0, 1.6);
  rim.position.set(-5, -3, -4);
  scene.add(rim);

  // الشكل الرئيسي: عقدة طاقة ملتوية ترمز للحركة والسرعة
  const geometry = new THREE.TorusKnotGeometry(1.5, 0.42, 220, 32, 2, 3);
  const material = new THREE.MeshStandardMaterial({
    color: 0x1d33f0,
    metalness: 0.35,
    roughness: 0.25,
    emissive: 0x0a1080,
    emissiveIntensity: 0.25,
  });
  const knot = new THREE.Mesh(geometry, material);
  scene.add(knot);

  // حلقة خارجية بلون الفولت تعطي إحساس مسار سباق
  const ringGeo = new THREE.TorusGeometry(2.9, 0.03, 16, 100);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xd3ff3d, transparent: true, opacity: 0.8 });
  const ring1 = new THREE.Mesh(ringGeo, ringMat);
  ring1.rotation.x = Math.PI / 2.3;
  scene.add(ring1);
  const ring2 = ring1.clone();
  ring2.rotation.x = Math.PI / 1.6;
  ring2.rotation.y = 0.6;
  scene.add(ring2);

  // جسيمات خفيفة تتناثر حول الشكل
  const particlesCount = 120;
  const positions = new Float32Array(particlesCount * 3);
  for (let i = 0; i < particlesCount; i++) {
    const r = 3.2 + Math.random() * 1.6;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  const particlesGeo = new THREE.BufferGeometry();
  particlesGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const particlesMat = new THREE.PointsMaterial({ color: 0xf2f2ee, size: 0.035, transparent: true, opacity: 0.7 });
  const particles = new THREE.Points(particlesGeo, particlesMat);
  scene.add(particles);

  let targetX = 0, targetY = 0;
  window.addEventListener("mousemove", (e) => {
    targetX = (e.clientX / window.innerWidth - 0.5) * 0.6;
    targetY = (e.clientY / window.innerHeight - 0.5) * 0.6;
  });

  const clock = new THREE.Clock();
  function animate() {
    const t = clock.getElapsedTime();
    knot.rotation.x = t * 0.25 + targetY;
    knot.rotation.y = t * 0.35 + targetX;
    ring1.rotation.z = t * 0.2;
    ring2.rotation.z = -t * 0.15;
    particles.rotation.y = t * 0.05;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();

  window.addEventListener("resize", () => {
    width = parent.clientWidth;
    height = parent.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  });
})();
