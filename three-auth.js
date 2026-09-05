/**
 * مشهد ثلاثي الأبعاد لصفحات الدخول/التسجيل: شبكة متعددة الأوجه دوّارة
 * بأسلوب بسيط يعكس هوية الحركة الخاصة بالمتجر.
 */
(function () {
  const canvas = document.getElementById("auth-canvas");
  if (!canvas || !window.THREE) return;

  const parent = canvas.parentElement;
  let width = parent.clientWidth;
  let height = parent.clientHeight;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(0, 0, 6);

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const l1 = new THREE.DirectionalLight(0xd3ff3d, 1.2);
  l1.position.set(3, 4, 5);
  scene.add(l1);
  const l2 = new THREE.DirectionalLight(0x1d33f0, 1.4);
  l2.position.set(-4, -2, -3);
  scene.add(l2);

  const geo = new THREE.IcosahedronGeometry(1.9, 1);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x1d33f0,
    metalness: 0.4,
    roughness: 0.3,
    flatShading: true,
  });
  const solid = new THREE.Mesh(geo, mat);
  scene.add(solid);

  const wireGeo = new THREE.IcosahedronGeometry(2.35, 1);
  const wireMat = new THREE.MeshBasicMaterial({ color: 0xd3ff3d, wireframe: true, transparent: true, opacity: 0.5 });
  const wire = new THREE.Mesh(wireGeo, wireMat);
  scene.add(wire);

  const clock = new THREE.Clock();
  function animate() {
    const t = clock.getElapsedTime();
    solid.rotation.x = t * 0.3;
    solid.rotation.y = t * 0.4;
    wire.rotation.x = -t * 0.15;
    wire.rotation.y = t * 0.2;
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
