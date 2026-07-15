import * as THREE from "./assets/three.module.min.js";

const topbar = document.querySelector(".topbar");
const menu = document.querySelector(".menu");
const mobile = document.querySelector(".mobile-menu");

const updateHeader = () => topbar?.classList.toggle("solid", scrollY > 40);
updateHeader();
addEventListener("scroll", updateHeader, { passive: true });

menu?.addEventListener("click", () => {
  const open = menu.getAttribute("aria-expanded") !== "true";
  menu.setAttribute("aria-expanded", String(open));
  menu.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
  mobile?.classList.toggle("open", open);
});

mobile?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
  menu?.setAttribute("aria-expanded", "false");
  menu?.setAttribute("aria-label", "메뉴 열기");
  mobile.classList.remove("open");
}));

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("visible");
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.1, rootMargin: "0px 0px -45px" });
document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

const canvas = document.querySelector(".hero-canvas");
const hero = document.querySelector(".hero");
const heroMark = document.querySelector(".hero-mark");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

if (canvas && hero) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
  renderer.setClearColor(0x050505, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0, 8.4);

  const group = new THREE.Group();
  group.position.set(2.8, 0, 0);
  scene.add(group);

  const knot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1.75, 0.34, 180, 22, 2, 3),
    new THREE.MeshBasicMaterial({ color: 0x0068ff, wireframe: true, transparent: true, opacity: 0.37 })
  );
  knot.rotation.set(0.4, -0.5, 0.2);
  group.add(knot);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.75, 0.018, 8, 180),
    new THREE.MeshBasicMaterial({ color: 0xff21b8, transparent: true, opacity: 0.7 })
  );
  ring.rotation.set(1.05, 0.2, 0.25);
  group.add(ring);

  const particlePositions = [];
  for (let index = 0; index < 220; index += 1) {
    particlePositions.push(
      (Math.random() - 0.5) * 18,
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 7
    );
  }
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute("position", new THREE.Float32BufferAttribute(particlePositions, 3));
  const particles = new THREE.Points(
    particleGeometry,
    new THREE.PointsMaterial({ color: 0x55e2dd, size: 0.035, transparent: true, opacity: 0.6 })
  );
  scene.add(particles);

  const pointer = { x: 0, y: 0 };
  const resize = () => {
    const width = hero.clientWidth;
    const height = hero.clientHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
    group.position.x = width < 760 ? 2.1 : 3.1;
  };
  resize();
  addEventListener("resize", resize, { passive: true });

  hero.addEventListener("pointermove", (event) => {
    pointer.x = event.clientX / innerWidth - 0.5;
    pointer.y = event.clientY / innerHeight - 0.5;
    if (heroMark && innerWidth > 900) {
      heroMark.style.transform = `translateY(-50%) rotateY(${pointer.x * 12 - 11}deg) rotateX(${pointer.y * -10 + 5}deg)`;
    }
  }, { passive: true });

  const clock = new THREE.Clock();
  const render = () => {
    const elapsed = clock.getElapsedTime();
    if (!reducedMotion) {
      knot.rotation.y = elapsed * 0.12 + pointer.x * 0.25;
      knot.rotation.x = 0.4 + Math.sin(elapsed * 0.25) * 0.08 + pointer.y * 0.18;
      ring.rotation.z = elapsed * -0.06;
      particles.rotation.y = elapsed * 0.012;
      group.position.y += ((pointer.y * -0.35) - group.position.y) * 0.025;
    }
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  };
  render();
}

const form = document.querySelector(".join-form");
form?.addEventListener("submit", (event) => {
  const selectedCourses = form.querySelectorAll('input[name="참여 과정"]:checked');
  const note = form.querySelector(".form-note");
  if (!selectedCourses.length) {
    event.preventDefault();
    note.textContent = "참여 희망 과정을 하나 이상 선택해 주세요.";
    note.classList.add("error");
    form.querySelector('input[name="참여 과정"]')?.focus();
    return;
  }
  note.textContent = "신청서를 안전하게 전송하고 있습니다.";
  note.classList.remove("error");
  const button = form.querySelector("button");
  button.disabled = true;
  button.firstChild.textContent = "전송 중... ";
});
