const starfield = document.getElementById("starfield");
const cursorField = document.getElementById("cursorField");
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");
const launchScroll = document.querySelector(".launch-scroll");
const launchSticky = document.querySelector(".launch-sticky");
const launchVideo = document.getElementById("launchVideo");
const projectModal = document.getElementById("projectModal");
const reveals = document.querySelectorAll(".reveal");
const spaceScene = document.querySelector(".space-scene");
const heroMedia = document.querySelector(".hero-media");
const cadCanvas = document.getElementById("cadCanvas");
const cadInput = document.getElementById("cadInput");
const cadStatus = document.getElementById("cadStatus");

const pointer = {
  x: window.innerWidth * 0.5,
  y: window.innerHeight * 0.5,
  tx: window.innerWidth * 0.5,
  ty: window.innerHeight * 0.5
};

const projectData = {
  phoenix: {
    kicker: "Recovery Validation",
    title: "SR-1 Phoenix",
    image: "images/rocket-1.jpg",
    description: "A low-altitude systems vehicle built to validate recovery timing, fin stability, and post-flight inspection procedures before higher energy launches.",
    specs: ["Mission: Recovery shakedown", "Altitude: 3.2 km", "Propellant: Solid composite", "Airframe: Fiberglass test article", "Recovery: Drogue + main", "Status: Ground review"],
    cad: "assets/openrocket/sr-1-phoenix.ork",
    video: "videos/sr-1-phoenix-test.mp4"
  },
  alpha: {
    kicker: "Avionics Qualification",
    title: "DNHS-Alpha",
    image: "images/rocket-2.jpg",
    description: "A high-power electronics platform for flight computer validation, sensor logging, rail departure analysis, and data review after recovery.",
    specs: ["Mission: Avionics test", "Altitude: 5.8 km", "Propellant: Hybrid test grain", "Airframe: Carbon reinforced", "Payload: Dual logger bay", "Status: Simulation pass"],
    cad: "assets/openrocket/dnhs-alpha.ork",
    video: "videos/dnhs-alpha-test.mp4"
  },
  aurora: {
    kicker: "Payload Flight",
    title: "Aurora Payload",
    image: "images/rocket-3.jpg",
    description: "A compact science payload launch focused on vibration isolation, thermal behavior, clean bay access, and reliable recovery tracking.",
    specs: ["Mission: Payload ascent", "Altitude: 2.4 km", "Propellant: Solid motor", "Bay: Modular payload rail", "Recovery: GPS beacon", "Status: Payload fit check"],
    cad: "assets/openrocket/aurora-payload.ork",
    video: "videos/aurora-payload-test.mp4"
  }
};

let cadModel = createPlaceholderModel();
let cadRotation = 0;

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function lerp(current, target, amount) {
  return current + (target - current) * amount;
}

function createStars() {
  if (!starfield) return;

  const count = window.innerWidth < 640 ? 125 : 230;
  starfield.replaceChildren();

  for (let i = 0; i < count; i += 1) {
    const star = document.createElement("i");
    const size = Math.random() > 0.91 ? Math.random() * 2.2 + 1.2 : Math.random() * 1.05 + 0.45;
    const base = 0.18 + Math.random() * 0.68;
    star.className = "star";
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 124}%`;
    star.style.setProperty("--s", `${size}px`);
    star.style.setProperty("--base-o", `${base}`);
    star.style.setProperty("--o", `${base}`);
    star.dataset.phase = String(Math.random() * Math.PI * 2);
    star.dataset.rate = String(0.35 + Math.random() * 1.1);
    starfield.appendChild(star);
  }
}

function createPlaceholderModel() {
  const points = [
    [0, -1.4, 0], [0.42, -0.62, 0.22], [0.42, 0.8, 0.22], [0, 1.35, 0],
    [-0.42, -0.62, 0.22], [-0.42, 0.8, 0.22], [0.42, -0.62, -0.22],
    [0.42, 0.8, -0.22], [-0.42, -0.62, -0.22], [-0.42, 0.8, -0.22]
  ];
  const edges = [[0,1],[1,2],[2,3],[0,4],[4,5],[5,3],[0,6],[6,7],[7,3],[0,8],[8,9],[9,3],[1,4],[4,8],[8,6],[6,1],[2,5],[5,9],[9,7],[7,2]];
  return { points, edges };
}

function parseObj(text) {
  const points = [];
  const edges = new Set();

  text.split(/\r?\n/).forEach((line) => {
    const parts = line.trim().split(/\s+/);
    if (parts[0] === "v" && parts.length >= 4) {
      points.push(parts.slice(1, 4).map(Number));
    }
    if (parts[0] === "f" && parts.length >= 4) {
      const ids = parts.slice(1).map((part) => Number(part.split("/")[0]) - 1).filter((id) => Number.isFinite(id));
      ids.forEach((id, index) => {
        const next = ids[(index + 1) % ids.length];
        edges.add([Math.min(id, next), Math.max(id, next)].join(":"));
      });
    }
  });

  return normalizeModel({ points, edges: [...edges].map((edge) => edge.split(":").map(Number)) });
}

function parseStl(buffer) {
  const view = new DataView(buffer);
  const decoder = new TextDecoder();
  const header = decoder.decode(buffer.slice(0, Math.min(80, buffer.byteLength))).trim();

  if (header.startsWith("solid")) {
    const text = decoder.decode(buffer);
    const points = [];
    const edges = [];
    let tri = [];
    text.split(/\r?\n/).forEach((line) => {
      const parts = line.trim().split(/\s+/);
      if (parts[0] === "vertex" && parts.length >= 4) {
        points.push(parts.slice(1, 4).map(Number));
        tri.push(points.length - 1);
        if (tri.length === 3) {
          edges.push([tri[0], tri[1]], [tri[1], tri[2]], [tri[2], tri[0]]);
          tri = [];
        }
      }
    });
    return normalizeModel({ points, edges });
  }

  const triangles = view.getUint32(80, true);
  const points = [];
  const edges = [];
  let offset = 84;
  for (let i = 0; i < triangles && offset + 50 <= buffer.byteLength; i += 1) {
    offset += 12;
    const tri = [];
    for (let j = 0; j < 3; j += 1) {
      const point = [view.getFloat32(offset, true), view.getFloat32(offset + 4, true), view.getFloat32(offset + 8, true)];
      points.push(point);
      tri.push(points.length - 1);
      offset += 12;
    }
    edges.push([tri[0], tri[1]], [tri[1], tri[2]], [tri[2], tri[0]]);
    offset += 2;
  }
  return normalizeModel({ points, edges });
}

function normalizeModel(model) {
  if (!model.points.length || !model.edges.length) return createPlaceholderModel();

  const center = [0, 0, 0];
  model.points.forEach((point) => {
    center[0] += point[0];
    center[1] += point[1];
    center[2] += point[2];
  });
  center[0] /= model.points.length;
  center[1] /= model.points.length;
  center[2] /= model.points.length;

  let max = 0;
  const points = model.points.map((point) => {
    const normalized = [point[0] - center[0], point[1] - center[1], point[2] - center[2]];
    max = Math.max(max, Math.hypot(normalized[0], normalized[1], normalized[2]));
    return normalized;
  });

  return {
    points: points.map((point) => point.map((value) => value / (max || 1))),
    edges: model.edges.slice(0, 9000)
  };
}

function renderCad() {
  if (!cadCanvas) return;

  const ctx = cadCanvas.getContext("2d");
  const rect = cadCanvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  if (cadCanvas.width !== Math.floor(rect.width * dpr) || cadCanvas.height !== Math.floor(rect.height * dpr)) {
    cadCanvas.width = Math.floor(rect.width * dpr);
    cadCanvas.height = Math.floor(rect.height * dpr);
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, rect.width, rect.height);
  ctx.fillStyle = "rgba(255,255,255,0.015)";
  ctx.fillRect(0, 0, rect.width, rect.height);

  const scale = Math.min(rect.width, rect.height) * 0.32;
  const cx = rect.width / 2;
  const cy = rect.height / 2;
  const sinY = Math.sin(cadRotation);
  const cosY = Math.cos(cadRotation);
  const sinX = Math.sin(-0.35);
  const cosX = Math.cos(-0.35);

  const projected = cadModel.points.map(([x, y, z]) => {
    const rx = x * cosY - z * sinY;
    const rz = x * sinY + z * cosY;
    const ry = y * cosX - rz * sinX;
    const depth = y * sinX + rz * cosX + 3;
    const perspective = 1.8 / depth;
    return [cx + rx * scale * perspective, cy + ry * scale * perspective, depth];
  });

  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(143,199,255,0.55)";
  ctx.beginPath();
  cadModel.edges.forEach(([a, b]) => {
    const p1 = projected[a];
    const p2 = projected[b];
    if (!p1 || !p2) return;
    ctx.moveTo(p1[0], p1[1]);
    ctx.lineTo(p2[0], p2[1]);
  });
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,255,255,0.13)";
  ctx.strokeRect(16, 16, rect.width - 32, rect.height - 32);
  cadRotation += 0.006;
}

function updateLaunchFilm() {
  if (!launchScroll || !launchSticky) return;

  const rect = launchScroll.getBoundingClientRect();
  const travel = Math.max(1, rect.height - window.innerHeight);
  const progress = clamp(-rect.top / travel);

  launchSticky.style.setProperty("--film-scale", (1.04 + progress * 0.08).toFixed(3));
  launchSticky.style.setProperty("--video-opacity", String(0.62 + progress * 0.34));

  if (launchVideo && Number.isFinite(launchVideo.duration) && launchVideo.duration > 0) {
    launchVideo.currentTime = launchVideo.duration * progress;
  }
}

function updateSpace(time) {
  const scrollMax = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const scrollProgress = clamp(window.scrollY / scrollMax);

  if (starfield) {
    starfield.style.setProperty("--star-drift", `${scrollProgress * -42}px`);
    const stars = starfield.children;
    for (let i = 0; i < stars.length; i += 1) {
      const star = stars[i];
      const base = Number(star.style.getPropertyValue("--base-o")) || 0.4;
      const phase = Number(star.dataset.phase) || 0;
      const rate = Number(star.dataset.rate) || 1;
      const flicker = Math.sin(time * 0.001 * rate + phase) * 0.14;
      star.style.setProperty("--o", String(clamp(base + flicker, 0.08, 0.98)));
    }
  }

  pointer.x = lerp(pointer.x, pointer.tx, 0.08);
  pointer.y = lerp(pointer.y, pointer.ty, 0.08);
  const x = `${pointer.x}px`;
  const y = `${pointer.y}px`;

  if (spaceScene) {
    spaceScene.style.setProperty("--cursor-x", x);
    spaceScene.style.setProperty("--cursor-y", y);
    spaceScene.style.setProperty("--nebula-x", `${scrollProgress * -24}px`);
    spaceScene.style.setProperty("--nebula-y", `${scrollProgress * 28}px`);
  }

  if (cursorField) {
    cursorField.style.setProperty("--cursor-x", x);
    cursorField.style.setProperty("--cursor-y", y);
  }

  if (heroMedia) {
    heroMedia.style.setProperty("--hero-drift", `${window.scrollY * 0.08}px`);
  }
}

function openProjectModal(key) {
  if (!projectModal || !projectData[key]) return;

  const data = projectData[key];
  document.getElementById("modalKicker").textContent = data.kicker;
  document.getElementById("modalTitle").textContent = data.title;
  document.getElementById("modalDescription").textContent = data.description;
  document.getElementById("modalImage").src = data.image;
  document.getElementById("modalImage").alt = `${data.title} project image`;
  document.getElementById("modalCad").href = data.cad;
  document.getElementById("modalVideo").href = data.video;

  const specs = document.getElementById("modalSpecs");
  specs.replaceChildren(...data.specs.map((item) => {
    const span = document.createElement("span");
    span.textContent = item;
    return span;
  }));

  projectModal.classList.add("open");
  projectModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeProjectModal() {
  if (!projectModal) return;
  projectModal.classList.remove("open");
  projectModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function animate(time) {
  updateLaunchFilm();
  updateSpace(time);
  renderCad();
  requestAnimationFrame(animate);
}

window.addEventListener("pointermove", (event) => {
  pointer.tx = event.clientX;
  pointer.ty = event.clientY;
}, { passive: true });

window.addEventListener("resize", createStars, { passive: true });

if (cadInput) {
  cadInput.addEventListener("change", async () => {
    const file = cadInput.files && cadInput.files[0];
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      cadModel = file.name.toLowerCase().endsWith(".obj")
        ? parseObj(new TextDecoder().decode(buffer))
        : parseStl(buffer);
      if (cadStatus) cadStatus.textContent = `${file.name} loaded`;
    } catch (error) {
      cadModel = createPlaceholderModel();
      if (cadStatus) cadStatus.textContent = "Could not read CAD file";
    }
  });
}

if (reveals.length) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("is-visible");
    });
  }, {
    threshold: 0.18,
    rootMargin: "0px 0px -8% 0px"
  });

  reveals.forEach((item) => observer.observe(item));
}

if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(open));
  });

  navLinks.addEventListener("click", (event) => {
    if (event.target.matches("a")) {
      navLinks.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    }
  });
}

document.querySelectorAll("[data-project]").forEach((card) => {
  card.addEventListener("click", () => openProjectModal(card.dataset.project));
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openProjectModal(card.dataset.project);
    }
  });
});

document.querySelectorAll("[data-close-modal]").forEach((control) => {
  control.addEventListener("click", closeProjectModal);
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeProjectModal();
});

createStars();
requestAnimationFrame(animate);
