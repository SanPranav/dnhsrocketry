function renderSharedLayout() {
  const navMount = document.getElementById("siteNavMount");
  const footerMount = document.getElementById("siteFooterMount");
  const page = document.body?.dataset?.page || "";

  const activeClass = (slug) => (page === slug ? " class=\"active\"" : "");
  const contactClass = page === "contact" ? " class=\"active apply-link\"" : " class=\"apply-link\"";

  if (!document.getElementById("pageCometLayer")) {
    document.body.insertAdjacentHTML("afterbegin", `
      <div class="page-comet-layer" id="pageCometLayer" aria-hidden="true">
        <div class="page-comet" style="--lane: 22; --speed: 118; --delay: 0; --tilt: -12deg; --size: 18px;"></div>
        <div class="page-comet" style="--lane: 41; --speed: 136; --delay: 36; --tilt: 10deg; --size: 15px;"></div>
        <div class="page-comet" style="--lane: 63; --speed: 124; --delay: 78; --tilt: -8deg; --size: 17px;"></div>
        <div class="page-comet" style="--lane: 79; --speed: 148; --delay: 112; --tilt: 7deg; --size: 14px;"></div>
      </div>
    `);
  }

  if (navMount) {
    navMount.innerHTML = `
      <header class="site-header">
        <div class="nav-shell">
          <a class="brand" href="index.html" aria-label="DNHS Rocketry Club home">
            <div class="logo"><img src="images/logo.png" alt="DNHS Rocketry Club Logo"></div>
            DNHS Rocketry Club
          </a>
          <button class="menu-toggle" id="menuToggle" aria-label="Toggle navigation" aria-expanded="false">
            <span></span><span></span><span></span>
          </button>
          <nav class="nav-links" id="navLinks" aria-label="Primary navigation">
            <a${activeClass("home")} href="index.html">Home</a>
            <a${activeClass("projects")} href="projects.html">Projects</a>
            <a${activeClass("crew")} href="crew.html">Crew</a>
            <a${activeClass("newsroom")} href="newsroom.html">Newsroom</a>
            <a${contactClass} href="contact.html">Contact Us</a>
          </nav>
        </div>
      </header>
    `;
  }

  if (footerMount) {
    footerMount.innerHTML = `
      <footer class="site-footer">
        <div class="footer-shell">
          <p class="eyebrow">Made Possible By</p>
          <div class="footer-sponsors" aria-label="Footer sponsor logos">
            <img src="images/sponsor-1.png" alt="Sponsor one logo">
            <img src="images/sponsor-2.png" alt="Sponsor two logo">
            <img src="images/sponsor-1.png" alt="Sponsor three logo">
            <img src="images/sponsor-2.png" alt="Sponsor four logo">
          </div>
          <p class="footer-meta">DNHS Rocketry Club // Del Norte High School</p>
        </div>
      </footer>
    `;
  }
}

function setupProjectScrubUI() {
  const slider = document.getElementById("projectScrubSlider");
  if (!slider || !projectViewerState) return;
  const controls = projectViewerState.controls;
  if (!controls) return;

  // normalize slider to [0,1] representing full 360° of theta
  slider.min = 0; slider.max = 1; slider.step = 0.001;
  // Support sliders that use degrees (0-360) or normalized 0-1 values.
  const thetaToValue = (theta) => {
    const deg = ((((theta % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) * 180) / Math.PI;
    return deg; // degrees
  };
  const valueToTheta = (v) => {
    const num = parseFloat(v) || 0;
    return (num * Math.PI) / 180; // degrees -> radians
  };

  // initialize
  slider.value = thetaToValue(controls.theta || 0);

  const scrubValueDisplay = document.getElementById("projectScrubValue");
  slider.addEventListener("input", () => {
    controls.theta = valueToTheta(slider.value);
    if (scrubValueDisplay) scrubValueDisplay.textContent = `${Math.round(parseFloat(slider.value) || 0)}°`;
    // also rotate the model group so camera-based and object-based rotations stay visually in sync
    if (projectViewerState.group) projectViewerState.group.rotation.y = controls.theta;
    controls.needsUpdate = true;
  });

  // keyboard left/right to rotate
  const keyHandler = (e) => {
    if (!projectViewerState.controls) return;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      projectViewerState.controls.theta += (e.key === "ArrowLeft" ? -1 : 1) * 0.04;
      projectViewerState.controls.needsUpdate = true;
      slider.value = thetaToValue(projectViewerState.controls.theta);
      e.preventDefault();
    }
  };
  window.addEventListener("keydown", keyHandler);

  // sync slider to manual drags
  let rafId = null;
  const sync = () => {
    if (!projectViewerState.controls) return;
    const v = Math.round(thetaToValue(projectViewerState.controls.theta));
    if (Math.abs(parseFloat(slider.value) - v) > 0.5) slider.value = v;
    if (scrubValueDisplay) scrubValueDisplay.textContent = `${v}°`;
    // mirror camera azimuth to model Y rotation for consistent visual behaviour
    if (projectViewerState.group) projectViewerState.group.rotation.y = projectViewerState.controls.theta;
    rafId = requestAnimationFrame(sync);
  };
  sync();

  // cleanup if viewer is destroyed
  const cleanup = () => {
    window.removeEventListener("keydown", keyHandler);
    if (rafId) cancelAnimationFrame(rafId);
  };
  // Reset view button
  const resetBtn = document.getElementById("resetViewBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (!projectViewerState.controls) return;
      projectViewerState.controls.theta = Math.PI * 0.32;
      projectViewerState.controls.phi = Math.PI * 0.38;
      projectViewerState.controls.radius = Math.max(projectViewerState.controls.radius || 4, 2.5);
      projectViewerState.controls.needsUpdate = true;
      // reset group rotations and sliders
      if (projectViewerState.group) projectViewerState.group.rotation.set(0, projectViewerState.controls.theta, 0);
      const rotX = document.getElementById("rotX");
      const rotY = document.getElementById("rotY");
      const rotZ = document.getElementById("rotZ");
      if (rotX) rotX.value = 0;
      if (rotY) rotY.value = Math.round((projectViewerState.controls.theta * 180 / Math.PI));
      if (rotZ) rotZ.value = 0;
      const scrubValueDisplay = document.getElementById("projectScrubValue");
      const sliderEl = document.getElementById("projectScrubSlider");
      if (sliderEl) sliderEl.value = Math.round(projectViewerState.controls.theta * 180 / Math.PI);
      if (scrubValueDisplay) scrubValueDisplay.textContent = `${Math.round(projectViewerState.controls.theta * 180 / Math.PI)}°`;
    });
  }
  // store for potential teardown
  projectViewerState._scrubCleanup = cleanup;
}

renderSharedLayout();

const starfield = document.getElementById("starfield");
const cursorField = document.getElementById("cursorField");
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");
const launchScroll = document.querySelector(".launch-scroll");
const launchSticky = document.querySelector(".launch-sticky");
const launchVideo = document.getElementById("launchVideo");
const launchFilmFrame = document.getElementById("launchFilmFrame");
const launchFilmFrames = Array.from({ length: 24 }, (_, index) => `images/launch-film/frame-${String(index + 1).padStart(2, "0")}.jpg`);
const motionLab = document.querySelector(".motion-lab");
const motionScene = document.querySelector(".motion-scene");
const motionRockets = document.querySelectorAll(".motion-rocket");
const motionComets = document.querySelectorAll(".motion-comet");
const motionStreaks = document.querySelectorAll(".motion-streak");
const pageCometLayer = document.getElementById("pageCometLayer");
const pageComets = document.querySelectorAll(".page-comet");
const newsroomGallery = document.querySelector("[data-newsroom-gallery]");
const newsroomGalleryImage = document.getElementById("newsroomGalleryImage");
const newsroomGalleryTitle = document.getElementById("newsroomGalleryTitle");
const newsroomGalleryCaption = document.getElementById("newsroomGalleryCaption");
const newsroomGalleryItems = document.querySelectorAll("[data-gallery-item]");
const newsroomGalleryPrev = document.querySelector("[data-gallery-prev]");
const newsroomGalleryNext = document.querySelector("[data-gallery-next]");
const newsroomGalleryFeed = document.querySelector("[data-gallery-feed]");
const newsroomGallerySentinel = document.querySelector("[data-gallery-sentinel]");
const reveals = document.querySelectorAll(".reveal");
const spaceScene = document.querySelector(".space-scene");
const heroMedia = document.querySelector(".hero-media");
const cadCanvas = document.getElementById("cadCanvas");
const cadInput = document.getElementById("cadInput");
const cadStatus = document.getElementById("cadStatus");
const projectCadViewer = document.getElementById("projectCadViewer");
const projectCadStatus = document.getElementById("projectCadStatus");
const projectCadButtons = document.querySelectorAll("[data-render-project]");

const pointer = {
  x: window.innerWidth * 0.5,
  y: window.innerHeight * 0.5,
  tx: window.innerWidth * 0.5,
  ty: window.innerHeight * 0.5
};

const projectData = {
  natsqual: {
    kicker: "2026 Nationals Qual Rocket",
    title: "Zenith",
    image: "images/rocket-1.png",
    description: "Zenith is our current nationals-qualifier build focused on stable flight and consistent recovery. The team is tuning mass distribution, fin alignment, and deployment timing before final field validation.",
    specs: ["Mission: National TARC Qualifier", "Target Altitude: 750 ft", "Motor: Solid composite", "Airframe: Fiberglass test article", "Recovery: Dual deployment", "Status: Pre-flight validation"],
    cad: "assets/models/Assembly_1.obj",
    cadSource: "assets/models/Assembly_1.obj",
    cadDownload: "assets/models/Assembly_1.obj",
    video: "videos/launch.mp4"
  }
  // additional projects can be added here following the same structure
};

const projectViewerState = {
  ready: false,
  scene: null,
  camera: null,
  renderer: null,
  controls: null,
  group: null,
  currentUrl: null,
  resizeObserver: null,
  autoRotate: false,
  rotateSpeed: 0,
  frameId: 0
};

let cadModel = createPlaceholderModel();
let cadRotation = 0;
let activeProjectRender = "natsqual";
let projectSelection = { vertex: null, edges: new Set() };
let launchLastSeekAt = 0;
let newsroomGalleryIndex = 0;
const newsroomGalleryData = [
  {
    image: "images/team-1.png",
    title: "Program Workshop",
    caption: "Design reviews and subsystem planning with the team."
  },
  {
    image: "images/team-2.png",
    title: "The Shop",
    caption: "Where parts turn into flight-ready hardware."
  },
  {
    image: "images/team-3.png",
    title: "Competition Day",
    caption: "Range prep, launch, and recovery all in one frame."
  }
];

const newsroomGalleryFeedData = [
  { image: "images/team-1.png", title: "Workshop Notes", caption: "Whiteboard plans, layout checks, and subsystem handoffs." },
  { image: "images/team-2.png", title: "Hardware Bench", caption: "Parts, tools, and the focus that turns ideas into flight hardware." },
  { image: "images/team-3.png", title: "Launch Day", caption: "Pre-flight checks and range-side setup before liftoff." },
  { image: "images/team-1.png", title: "CAD Review", caption: "Iteration time with the current build and the next revision queued." },
  { image: "images/team-2.png", title: "Recovery Setup", caption: "Packing, folding, and confirming deployment timing before field day." },
  { image: "images/team-3.png", title: "Flight Line", caption: "Team coordination right before the vehicle leaves the rail." },
  { image: "images/team-1.png", title: "Subsystem Sync", caption: "Engineering notes across propulsion, avionics, and recovery." },
  { image: "images/team-2.png", title: "Build Table", caption: "The shop setup where the next round of parts gets assembled." },
  { image: "images/team-3.png", title: "Post-Flight", caption: "Recovered hardware, fresh notes, and the next iteration list." },
  { image: "images/team-1.png", title: "Crew Huddle", caption: "Quick alignment before the next check-in or test window." },
  { image: "images/team-2.png", title: "Finishing Pass", caption: "Cleanup, measurement, and a final look at the details." },
  { image: "images/team-3.png", title: "Range Prep", caption: "Everything staged, labeled, and ready for the next launch." }
];

function updateNewsroomMonthlyStats() {
  const statsRoot = document.querySelector(".newsroom-hero-stats");
  if (!statsRoot) return;

  const reportCount = newsroomGalleryFeedData.length;
  const featuredCount = newsroomGalleryData.length;
  const queuedCount = Math.max(0, Math.ceil(reportCount / 3) - 1);

  statsRoot.replaceChildren(
    createNewsroomStat(String(reportCount), "reports this month"),
    createNewsroomStat(String(featuredCount), "featured sessions"),
    createNewsroomStat(String(queuedCount), "launch recaps queued")
  );
}

function createNewsroomStat(value, label) {
  const article = document.createElement("article");
  const strong = document.createElement("strong");
  strong.textContent = value;
  const span = document.createElement("span");
  span.textContent = label;
  article.append(strong, span);
  return article;
}

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
    const left = Math.random() * 100;
    const top = Math.random() * 124;
    star.className = "star";
    star.style.left = `${left}%`;
    star.style.top = `${top}%`;
    star.style.setProperty("--s", `${size}px`);
    star.style.setProperty("--base-o", `${base}`);
    star.style.setProperty("--o", `${base}`);
    star.style.setProperty("--boost", "0");
    star.dataset.phase = String(Math.random() * Math.PI * 2);
    star.dataset.rate = String(0.35 + Math.random() * 1.1);
    star.dataset.left = String(left);
    star.dataset.top = String(top);
    starfield.appendChild(star);
  }
}

function setNewsroomGallery(index) {
  if (!newsroomGalleryData.length || !newsroomGalleryImage || !newsroomGalleryTitle || !newsroomGalleryCaption) return;

  newsroomGalleryIndex = (index + newsroomGalleryData.length) % newsroomGalleryData.length;
  const item = newsroomGalleryData[newsroomGalleryIndex];
  newsroomGalleryImage.src = item.image;
  newsroomGalleryImage.alt = item.title;
  newsroomGalleryTitle.textContent = item.title;
  newsroomGalleryCaption.textContent = item.caption;

  newsroomGalleryItems.forEach((button, itemIndex) => {
    const active = itemIndex === newsroomGalleryIndex;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function advanceNewsroomGallery(direction) {
  setNewsroomGallery(newsroomGalleryIndex + direction);
}

function createGalleryCard(item, index) {
  const card = document.createElement("article");
  const wide = index % 5 === 0;
  const tall = index % 7 === 0;
  card.className = `gallery-feed-card${wide ? " is-wide" : ""}${tall ? " is-tall" : ""}`;

  const figure = document.createElement("figure");
  const image = document.createElement("img");
  image.src = item.image;
  image.alt = item.title;
  figure.appendChild(image);

  const caption = document.createElement("figcaption");
  const title = document.createElement("strong");
  title.textContent = item.title;
  const text = document.createElement("span");
  text.textContent = item.caption;
  caption.append(title, text);
  figure.appendChild(caption);
  card.appendChild(figure);
  return card;
}

function parseMtl(text) {
  const materials = new Map();
  let current = null;

  text.split(/\r?\n/).forEach((line) => {
    const parts = line.trim().split(/\s+/);
    if (!parts.length || !parts[0]) return;

    if (parts[0] === "newmtl" && parts[1]) {
      current = { name: parts.slice(1).join(" "), color: [0.8, 0.8, 0.8], opacity: 1 };
      materials.set(current.name, current);
      return;
    }

    if (!current) return;

    if (parts[0] === "Kd" && parts.length >= 4) {
      current.color = parts.slice(1, 4).map((value) => clamp(Number(value), 0, 1));
    } else if (parts[0] === "d" && parts[1] !== undefined) {
      current.opacity = clamp(Number(parts[1]), 0, 1);
    } else if (parts[0] === "Tr" && parts[1] !== undefined) {
      current.opacity = 1 - clamp(Number(parts[1]), 0, 1);
    }
  });

  return materials;
}

function createObjPart(name = "", material = "") {
  return { name, material, faces: [], edges: [] };
}

function fitCrewNames() {
  const crewCards = document.querySelectorAll(".crew-card");
  if (!crewCards.length) return;

  crewCards.forEach((card) => {
    const name = card.querySelector("h2");
    if (!name) return;

    name.style.fontSize = "";
    name.style.lineHeight = "";

    const maxWidth = Math.max(0, card.clientWidth - 48);
    if (!maxWidth) return;

    const minSize = 9;
    const textLength = Math.max(10, (name.textContent || "").trim().length);
    let size = Math.min(22, Math.max(10, maxWidth / textLength * 1.55));
    name.style.fontSize = `${size}px`;

    while (name.scrollWidth > maxWidth && size > minSize) {
      size -= 0.5;
      name.style.fontSize = `${size}px`;
    }
  });
}

let newsroomGalleryFeedIndex = 0;
const newsroomGalleryFeedBatchSize = 4;

function appendNewsroomGalleryBatch() {
  if (!newsroomGalleryFeed) return;
  // Pull a batch from the feed data; if we run out, generate more by cycling base images
  let nextItems = newsroomGalleryFeedData.slice(newsroomGalleryFeedIndex, newsroomGalleryFeedIndex + newsroomGalleryFeedBatchSize);
  if (!nextItems.length) {
    // generate a small batch by cycling existing team images so the feed never fully ends
    const base = [
      { image: 'images/team-1.png', title: 'Workshop', caption: 'Behind the bench.' },
      { image: 'images/team-2.png', title: 'Build Table', caption: 'Parts and tools.' },
      { image: 'images/team-3.png', title: 'Range Day', caption: 'Launch prep.' }
    ];
    nextItems = new Array(newsroomGalleryFeedBatchSize).fill(0).map((_, i) => {
      const sample = base[(newsroomGalleryFeedIndex + i) % base.length];
      return { image: sample.image, title: `${sample.title} ${Math.floor(newsroomGalleryFeedIndex / base.length) + 1}`, caption: sample.caption };
    });
  }

  nextItems.forEach((item, index) => {
    newsroomGalleryFeed.appendChild(createGalleryCard(item, newsroomGalleryFeedIndex + index));
  });
  newsroomGalleryFeedIndex += nextItems.length;
}

function createPlaceholderModel() {
  const points = [
    [0, -1.4, 0], [0.42, -0.62, 0.22], [0.42, 0.8, 0.22], [0, 1.35, 0],
    [-0.42, -0.62, 0.22], [-0.42, 0.8, 0.22], [0.42, -0.62, -0.22],
    [0.42, 0.8, -0.22], [-0.42, -0.62, -0.22], [-0.42, 0.8, -0.22]
  ];
  const edges = [[0,1],[1,2],[2,3],[0,4],[4,5],[5,3],[0,6],[6,7],[7,3],[0,8],[8,9],[9,3],[1,4],[4,8],[8,6],[6,1],[2,5],[5,9],[9,7],[7,2]];
  const faces = [[0,1,2],[0,2,3],[0,4,5],[0,5,3],[0,6,7],[0,7,3],[0,8,9],[0,9,3],[1,4,8],[1,8,6],[2,5,9],[2,9,7]];
  return { points, edges, faces };
}

function parseObj(text) {
  const points = [];
  const edges = new Set();
  const faces = [];
  const parts = [];
  let currentPart = createObjPart();

  const flushPart = () => {
    if (currentPart && (currentPart.faces.length || currentPart.edges.length)) {
      parts.push(currentPart);
    }
    currentPart = createObjPart(currentPart?.name || "", currentPart?.material || "");
  };

  text.split(/\r?\n/).forEach((line) => {
    const parts = line.trim().split(/\s+/);
    if (!parts.length || !parts[0]) return;

    if (parts[0] === "o" || parts[0] === "g") {
      flushPart();
      currentPart.name = parts.slice(1).join(" ");
      return;
    }

    if (parts[0] === "usemtl") {
      flushPart();
      currentPart.material = parts.slice(1).join(" ");
      return;
    }

    if (parts[0] === "v" && parts.length >= 4) {
      points.push(parts.slice(1, 4).map(Number));
    }

    if (parts[0] === "f" && parts.length >= 4) {
      const ids = parts.slice(1).map((part) => Number(part.split("/")[0]) - 1).filter((id) => Number.isFinite(id));
      for (let i = 1; i < ids.length - 1; i += 1) {
        const tri = [ids[0], ids[i], ids[i + 1]];
        faces.push(tri);
        currentPart.faces.push(tri);
      }
      ids.forEach((id, index) => {
        const next = ids[(index + 1) % ids.length];
        const edge = [Math.min(id, next), Math.max(id, next)].join(":");
        edges.add(edge);
        currentPart.edges.push([Math.min(id, next), Math.max(id, next)]);
      });
    }
  });

  flushPart();

  return normalizeModel({ points, edges: [...edges].map((edge) => edge.split(":").map(Number)), faces, parts });
}

function parseStl(buffer) {
  const view = new DataView(buffer);
  const decoder = new TextDecoder();
  const header = decoder.decode(buffer.slice(0, Math.min(80, buffer.byteLength))).trim();

  if (header.startsWith("solid")) {
    const text = decoder.decode(buffer);
    const points = [];
    const edges = [];
    const faces = [];
    let tri = [];
    text.split(/\r?\n/).forEach((line) => {
      const parts = line.trim().split(/\s+/);
      if (parts[0] === "vertex" && parts.length >= 4) {
        points.push(parts.slice(1, 4).map(Number));
        tri.push(points.length - 1);
        if (tri.length === 3) {
          faces.push(tri.slice());
          edges.push([tri[0], tri[1]], [tri[1], tri[2]], [tri[2], tri[0]]);
          tri = [];
        }
      }
    });
    return normalizeModel({ points, edges, faces });
  }

  const triangles = view.getUint32(80, true);
  const points = [];
  const edges = [];
  const faces = [];
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
    faces.push(tri.slice());
    edges.push([tri[0], tri[1]], [tri[1], tri[2]], [tri[2], tri[0]]);
    offset += 2;
  }
  return normalizeModel({ points, edges, faces });
}

function normalizeModel(model) {
  if (!model.points.length || (!model.edges.length && (!model.faces || !model.faces.length))) return createPlaceholderModel();

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
    edges: (model.edges || []).slice(0, 9000),
    faces: (model.faces || []).slice(0, 6000),
    parts: (model.parts || []).map((part) => ({
      name: part.name,
      material: part.material,
      faces: (part.faces || []).slice(0, 6000),
      edges: (part.edges || []).slice(0, 9000)
    }))
  };
}

function getFallbackOrkProfile(key) {
  if (key === "alpha") {
    return [
      { length: 0.3, r0: 0.03, r1: 0.15 },
      { length: 0.25, r0: 0.15, r1: 0.15 },
      { length: 0.4, r0: 0.15, r1: 0.16 },
      { length: 0.35, r0: 0.16, r1: 0.16 },
      { length: 0.25, r0: 0.16, r1: 0.14 }
    ];
  }
  if (key === "aurora") {
    return [
      { length: 0.26, r0: 0.03, r1: 0.13 },
      { length: 0.32, r0: 0.13, r1: 0.13 },
      { length: 0.3, r0: 0.13, r1: 0.145 },
      { length: 0.3, r0: 0.145, r1: 0.145 },
      { length: 0.22, r0: 0.145, r1: 0.12 }
    ];
  }
  return [
    { length: 0.28, r0: 0.03, r1: 0.14 },
    { length: 0.28, r0: 0.14, r1: 0.14 },
    { length: 0.34, r0: 0.14, r1: 0.15 },
    { length: 0.34, r0: 0.15, r1: 0.15 },
    { length: 0.2, r0: 0.15, r1: 0.13 }
  ];
}

function profileToModel(profile) {
  const points = [];
  const edges = [];
  const faces = [];
  const sides = 26;
  let y = -1;
  const total = profile.reduce((sum, seg) => sum + seg.length, 0) || 1;

  profile.forEach((seg) => {
    const y0 = y;
    const y1 = y + (seg.length / total) * 2;
    const ring0 = [];
    const ring1 = [];
    for (let i = 0; i < sides; i += 1) {
      const angle = (i / sides) * Math.PI * 2;
      ring0.push(points.length);
      points.push([Math.cos(angle) * seg.r0, y0, Math.sin(angle) * seg.r0]);
      ring1.push(points.length);
      points.push([Math.cos(angle) * seg.r1, y1, Math.sin(angle) * seg.r1]);
    }
    for (let i = 0; i < sides; i += 1) {
      const p0 = ring0[i];
      const p1 = ring0[(i + 1) % sides];
      const p2 = ring1[i];
      const p3 = ring1[(i + 1) % sides];
      faces.push([p0, p2, p3], [p0, p3, p1]);
      edges.push([p0, p1], [p0, p2], [p1, p3], [p2, p3]);
    }
    y = y1;
  });

  return normalizeModel({ points, edges, faces });
}

function projectModelPoints(model, rotationY, rotationX, scale, cx, cy, perspectiveFactor = 1.8) {
  const sinY = Math.sin(rotationY);
  const cosY = Math.cos(rotationY);
  const sinX = Math.sin(rotationX);
  const cosX = Math.cos(rotationX);

  return model.points.map((point) => {
    const rx = point[0] * cosY - point[2] * sinY;
    const rz = point[0] * sinY + point[2] * cosY;
    const ry = point[1] * cosX - rz * sinX;
    const depth = point[1] * sinX + rz * cosX + 3;
    const perspective = perspectiveFactor / depth;
    return {
      x: cx + rx * scale * perspective,
      y: cy + ry * scale * perspective,
      z: depth,
      rx,
      ry,
      rz
    };
  });
}

function faceNormal(a, b, c) {
  const ux = b.rx - a.rx;
  const uy = b.ry - a.ry;
  const uz = b.rz - a.rz;
  const vx = c.rx - a.rx;
  const vy = c.ry - a.ry;
  const vz = c.rz - a.rz;

  return [
    uy * vz - uz * vy,
    uz * vx - ux * vz,
    ux * vy - uy * vx
  ];
}

function fillProjectedFaces(ctx, projected, faces, fillBase = [143, 199, 255]) {
  if (!faces || !faces.length) return;

  const light = [0.35, 0.55, 0.76];
  const sorted = faces
    .map((face) => ({
      face,
      depth: face.reduce((sum, index) => sum + (projected[index]?.z || 0), 0) / face.length
    }))
    .sort((a, b) => b.depth - a.depth);

  sorted.forEach(({ face }) => {
    const a = projected[face[0]];
    const b = projected[face[1]];
    const c = projected[face[2]];
    if (!a || !b || !c) return;

    const normal = faceNormal(a, b, c);
    const normalLength = Math.hypot(normal[0], normal[1], normal[2]) || 1;
    const nx = normal[0] / normalLength;
    const ny = normal[1] / normalLength;
    const nz = normal[2] / normalLength;
    const intensity = clamp((nx * light[0] + ny * light[1] + nz * light[2]) * 0.5 + 0.58, 0.16, 1);
    const fillAlpha = 0.16 + intensity * 0.28;
    const strokeAlpha = 0.06 + intensity * 0.12;

    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineTo(c.x, c.y);
    ctx.closePath();
    ctx.fillStyle = `rgba(${fillBase[0]}, ${fillBase[1]}, ${fillBase[2]}, ${fillAlpha})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(255, 255, 255, ${strokeAlpha})`;
    ctx.stroke();
  });
}

function parseOrkProfile(text, key) {
  const lengths = [...text.matchAll(/<length>([0-9.]+)<\/length>/g)].map((m) => Number(m[1])).filter((v) => Number.isFinite(v) && v > 0);
  const radii = [...text.matchAll(/<(?:outerradius|radius)>([0-9.]+)<\/(?:outerradius|radius)>/g)].map((m) => Number(m[1])).filter((v) => Number.isFinite(v) && v > 0);

  if (!lengths.length) return getFallbackOrkProfile(key);

  const trimmedLengths = lengths.slice(0, 6);
  const profile = trimmedLengths.map((length, index) => {
    const r = radii[index] || radii[radii.length - 1] || 0.14;
    const nextR = radii[index + 1] || r;
    return {
      length,
      r0: Math.max(0.02, Math.min(0.26, r)),
      r1: Math.max(0.02, Math.min(0.26, nextR))
    };
  });

  return profile.length ? profile : getFallbackOrkProfile(key);
}

function parseOrkXmlToModel(text, key) {
  const profile = parseOrkProfile(text, key);
  return profileToModel(profile);
}

function extractOrkXmlFromBuffer(buffer) {
  const bytes = new Uint8Array(buffer);
  const decoder = new TextDecoder();
  const sniff = decoder.decode(bytes.slice(0, Math.min(bytes.length, 128)));

  if (sniff.includes("<openrocket") || sniff.trimStart().startsWith("<?xml")) {
    return decoder.decode(bytes);
  }

  // OpenRocket .ork files are commonly ZIP containers with an inner rocket.ork XML file.
  if ((bytes[0] === 0x50 && bytes[1] === 0x4b) && typeof window.fflate !== "undefined") {
    try {
      const archive = window.fflate.unzipSync(bytes);
      const names = Object.keys(archive);
      const inner = names.find((n) => /rocket\.ork$/i.test(n)) || names.find((n) => /\.ork$/i.test(n)) || names.find((n) => /\.xml$/i.test(n));
      if (inner && archive[inner]) {
        return window.fflate.strFromU8(archive[inner]);
      }
    } catch (e) {
      return "";
    }
  }

  return "";
}

async function loadProjectCad(key) {
  if (!projectData[key]) return;
  const data = projectData[key];
  const uploadStatus = document.getElementById("projectUploadStatus");

  activeProjectRender = key;
  if (projectCadButtons.length) {
    projectCadButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.renderProject === key);
    });
  }

  if (!projectViewerState.ready && !initProjectViewer()) {
    if (uploadStatus) uploadStatus.textContent = "Viewer unavailable";
    if (projectCadStatus) projectCadStatus.textContent = `${projectData[key].title} viewer failed to initialize`;
    return;
  }

  if (projectViewerState.currentUrl === data.cad) {
    if (uploadStatus) uploadStatus.textContent = "Viewer ready";
    if (projectCadStatus) projectCadStatus.textContent = `${projectData[key].title} viewer active`;
    return;
  }

  try {
    if (uploadStatus) uploadStatus.textContent = "Loading CAD source";
    if (projectCadStatus) projectCadStatus.textContent = `Loading ${data.cad}`;
    await projectViewerLoadSource(data.cad);
    if (uploadStatus) uploadStatus.textContent = "Viewer ready";
    if (projectCadStatus) projectCadStatus.textContent = `${projectData[key].title} viewer active`;
  } catch (error) {
    if (uploadStatus) uploadStatus.textContent = "Viewer failed to load";
    if (projectCadStatus) projectCadStatus.textContent = `${projectData[key].title} failed to load`;
    console.error("Project viewer load failed", error);
  }
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
  const bg = ctx.createLinearGradient(0, 0, rect.width, rect.height);
  bg.addColorStop(0, "rgba(143,199,255,0.06)");
  bg.addColorStop(1, "rgba(255,138,36,0.03)");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, rect.width, rect.height);

  const scale = Math.min(rect.width, rect.height) * 0.32;
  const cx = rect.width / 2;
  const cy = rect.height / 2;
  const projected = projectModelPoints(cadModel, cadRotation, -0.35, scale, cx, cy);

  fillProjectedFaces(ctx, projected, cadModel.faces, [143, 199, 255]);

  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(143,199,255,0.55)";
  ctx.beginPath();
  cadModel.edges.forEach(([a, b]) => {
    const p1 = projected[a];
    const p2 = projected[b];
    if (!p1 || !p2) return;
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
  });
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,255,255,0.13)";
  ctx.strokeRect(16, 16, rect.width - 32, rect.height - 32);
  cadRotation += 0.006;
}

function initProjectViewer() {
  if (projectViewerState.ready) return true;
  if (!projectCadViewer || !window.THREE) return false;

  const rect = projectCadViewer.getBoundingClientRect();
  const width = Math.max(1, rect.width || projectCadViewer.clientWidth || 960);
  const height = Math.max(1, rect.height || projectCadViewer.clientHeight || 420);

  try {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05070d);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0.8, 4.6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    // Cap device pixel ratio to avoid huge GPU work on high-DPR displays
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    if (renderer.outputColorSpace !== undefined) renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.domElement.style.touchAction = "none";
    projectCadViewer.replaceChildren(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 1.7));

    const keyLight = new THREE.DirectionalLight(0x9fd0ff, 2.2);
    keyLight.position.set(4, 7, 6);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffb37a, 1.1);
    fillLight.position.set(-4, -2, -5);
    scene.add(fillLight);

    const controls = createProjectOrbitControls(camera, renderer.domElement, projectCadViewer);

    projectViewerState.ready = true;
    projectViewerState.scene = scene;
    projectViewerState.camera = camera;
    projectViewerState.renderer = renderer;
    projectViewerState.controls = controls;
    projectViewerState.group = null;

    // Wire optional scrub UI (range slider / keyboard) if present
    try { setupProjectScrubUI(); } catch (err) { /* ignore if not defined yet */ }

    const resizeViewer = () => {
      const nextRect = projectCadViewer.getBoundingClientRect();
      const nextWidth = Math.max(1, nextRect.width || projectCadViewer.clientWidth || 960);
      const nextHeight = Math.max(1, nextRect.height || projectCadViewer.clientHeight || 420);
      camera.aspect = nextWidth / nextHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(nextWidth, nextHeight, false);
    };

    resizeViewer();
    if (window.ResizeObserver) {
      projectViewerState.resizeObserver = new ResizeObserver(resizeViewer);
      projectViewerState.resizeObserver.observe(projectCadViewer);
    }

    if (!projectViewerState.frameId) {
      projectViewerState.frameId = requestAnimationFrame(renderProjectViewer);
    }
    return true;
  } catch (error) {
    projectViewerState.ready = false;
    projectViewerState.scene = null;
    projectViewerState.camera = null;
    projectViewerState.renderer = null;
    projectViewerState.controls = null;
    projectViewerState.group = null;
    return false;
  }
}

async function projectViewerLoadSource(url) {
  if (!projectViewerState.ready && !initProjectViewer()) throw new Error("three.js viewer unavailable");
  if (!projectViewerState.ready || !projectViewerState.scene) throw new Error("three.js viewer unavailable");

  if (projectViewerState.group) {
    projectViewerState.scene.remove(projectViewerState.group);
    projectViewerState.group.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach((material) => material.dispose());
        else child.material.dispose();
      }
    });
  }

  const ext = (url.split(".").pop() || "").toLowerCase();
  let model = null;
  let materialMap = new Map();

  if (ext === "obj") {
    const objText = await (await fetch(encodeURI(url))).text();
    const baseUrl = url.slice(0, url.lastIndexOf("/") + 1);
    const mtllibMatch = objText.match(/^mtllib\s+(.+)$/mi);
    if (mtllibMatch && mtllibMatch[1]) {
      const mtlPath = mtllibMatch[1].trim();
      try {
        const mtlText = await (await fetch(encodeURI(`${baseUrl}${mtlPath}`))).text();
        materialMap = parseMtl(mtlText);
      } catch (error) {
        console.warn("MTL load failed", error);
      }
    }
    model = parseObj(objText);
  } else if (ext === "ork" || ext === "xml") {
    const buffer = await (await fetch(encodeURI(url))).arrayBuffer();
    const orkXml = extractOrkXmlFromBuffer(buffer);
    if (!orkXml) throw new Error(`Unable to read OpenRocket source: ${url}`);
    model = parseOrkXmlToModel(orkXml, url);
  } else if (ext === "stl") {
    const buffer = await (await fetch(encodeURI(url))).arrayBuffer();
    model = parseStl(buffer);
  } else {
    throw new Error(`Unsupported model type: ${ext || "unknown"}`);
  }

  const group = buildProjectViewerGroup(model, materialMap);
  projectViewerState.scene.add(group);
  projectViewerState.group = group;
  projectViewerState.currentUrl = url;
  frameProjectViewerToGroup(group);
  // populate UI controls for the loaded model
  try { setupModelControlsForGroup(group); } catch (e) { /* ignore */ }
}

function renderProjectViewer() {
  const { renderer, scene, camera, group, controls } = projectViewerState;
  if (!renderer || !scene || !camera) return;

  const now = performance.now();
  const minFrameMs = 1000 / 30; // target 30 FPS when idle
  if (!projectViewerState._lastRenderAt) projectViewerState._lastRenderAt = 0;

  const needs = controls ? controls.needsUpdate : true;
  if (needs || now - projectViewerState._lastRenderAt >= minFrameMs) {
    if (controls) {
      updateProjectOrbitControls(controls, camera);
      controls.needsUpdate = false;
    }
    renderer.render(scene, camera);
    projectViewerState._lastRenderAt = now;
  }

  projectViewerState.frameId = requestAnimationFrame(renderProjectViewer);
}

function createProjectOrbitControls(camera, domElement, container) {
  const state = {
    target: new THREE.Vector3(0, 0, 0),
    theta: Math.PI * 0.35,
    phi: Math.PI * 0.36,
    radius: 5.6,
    minRadius: 0.9,
    maxRadius: 40,
    minPhi: 0.12,
    maxPhi: Math.PI - 0.12,
    rotateSpeed: 0.006,
    panSpeed: 0.002,
    zoomSpeed: 0.0012,
    dragging: false,
    panning: false,
    lastX: 0,
    lastY: 0,
    pointers: new Map(),
    needsUpdate: true
  };

  const getViewport = () => {
    const rect = container.getBoundingClientRect();
    return {
      width: Math.max(1, rect.width || container.clientWidth || 1),
      height: Math.max(1, rect.height || container.clientHeight || 1)
    };
  };

  const setPointerState = (event, active) => {
    if (active) state.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY, button: event.button, shiftKey: event.shiftKey });
    else state.pointers.delete(event.pointerId);
  };

  const startInteraction = (event) => {
    container.setPointerCapture?.(event.pointerId);
    setPointerState(event, true);
    state.dragging = true;
    state.panning = event.button === 1 || event.button === 2 || event.shiftKey;
    state.lastX = event.clientX;
    state.lastY = event.clientY;
    state.needsUpdate = true;
  };

  const moveInteraction = (event) => {
    if (!state.dragging) return;
    const dx = event.clientX - state.lastX;
    const dy = event.clientY - state.lastY;
    state.lastX = event.clientX;
    state.lastY = event.clientY;

    if (state.panning) {
      const forward = new THREE.Vector3().subVectors(state.target, camera.position).normalize();
      const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
      const up = new THREE.Vector3().crossVectors(right, forward).normalize();
      const { width, height } = getViewport();
      const panScale = (state.radius / Math.max(1, Math.min(width, height))) * state.panSpeed * 220;
      state.target.addScaledVector(right, -dx * panScale);
      state.target.addScaledVector(up, dy * panScale);
    } else {
      state.theta -= dx * state.rotateSpeed;
      state.phi -= dy * state.rotateSpeed;
    }

    state.needsUpdate = true;
  };

  const endInteraction = (event) => {
    setPointerState(event, false);
    state.dragging = false;
    state.panning = false;
    state.needsUpdate = true;
    try { container.releasePointerCapture?.(event.pointerId); } catch (error) { /* ignore */ }
  };

  domElement.addEventListener("pointerdown", startInteraction);
  domElement.addEventListener("pointermove", moveInteraction);
  domElement.addEventListener("pointerup", endInteraction);
  domElement.addEventListener("pointercancel", endInteraction);
  domElement.addEventListener("pointerleave", () => { state.dragging = false; state.panning = false; });
  domElement.addEventListener("contextmenu", (event) => event.preventDefault());
  domElement.addEventListener("wheel", (event) => {
    event.preventDefault();
    const zoomFactor = Math.exp(event.deltaY * state.zoomSpeed);
    state.radius = clamp(state.radius * zoomFactor, state.minRadius, state.maxRadius);
    state.needsUpdate = true;
  }, { passive: false });

  return state;
}

function updateProjectOrbitControls(state, camera) {
  state.phi = clamp(state.phi, state.minPhi, state.maxPhi);
  state.radius = clamp(state.radius, state.minRadius, state.maxRadius);

  const sinPhi = Math.sin(state.phi);
  const cosPhi = Math.cos(state.phi);
  const x = state.target.x + state.radius * sinPhi * Math.cos(state.theta);
  const y = state.target.y + state.radius * cosPhi;
  const z = state.target.z + state.radius * sinPhi * Math.sin(state.theta);

  camera.position.set(x, y, z);
  camera.lookAt(state.target);
}

function frameProjectViewerToGroup(group) {
  if (!projectViewerState.camera || !projectViewerState.controls || !group) return;

  const box = new THREE.Box3().setFromObject(group);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  const maxSize = Math.max(size.x, size.y, size.z) || 1;
  const camera = projectViewerState.camera;
  const controls = projectViewerState.controls;
  const fitDistance = maxSize / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5))) * 1.3;

  controls.target.copy(center);
  controls.radius = Math.max(fitDistance, maxSize * 1.25, 2.5);
  controls.minRadius = Math.max(0.7, controls.radius * 0.18);
  controls.maxRadius = Math.max(controls.radius * 8, controls.radius + 8);
  camera.near = Math.max(0.01, controls.radius / 200);
  camera.far = Math.max(200, controls.radius * 20);
  camera.updateProjectionMatrix();
  controls.theta = Math.PI * 0.32;
  controls.phi = Math.PI * 0.38;
  updateProjectOrbitControls(controls, camera);
}

function buildProjectViewerGroup(model, materialMap = new Map()) {
  const group = new THREE.Group();
  const defaultColor = new THREE.Color(0xdde9ff);
  const lineBaseColor = new THREE.Color(0x9fd0ff);

  const makeMaterial = (entry, index) => {
    const color = new THREE.Color();
    if (entry?.color) {
      color.setRGB(entry.color[0], entry.color[1], entry.color[2]);
    } else {
      color.copy(defaultColor).offsetHSL(((index % 7) - 3) * 0.02, 0, 0);
    }
    return new THREE.MeshStandardMaterial({
      color,
      metalness: 0.12,
      roughness: 0.38,
      side: THREE.DoubleSide,
      transparent: entry?.opacity !== undefined && entry.opacity < 1,
      opacity: entry?.opacity !== undefined ? entry.opacity : 1
    });
  };

  if (model.parts && model.parts.length) {
    model.parts.forEach((part, index) => {
      if (!part.faces.length) return;

      const materialEntry = part.material ? materialMap.get(part.material) : null;
      const material = makeMaterial(materialEntry, index);
      const lineMaterial = new THREE.LineBasicMaterial({
        color: material.color.clone().lerp(lineBaseColor, 0.4),
        transparent: true,
        opacity: 0.54
      });
      const geometry = new THREE.BufferGeometry();
      const positions = [];
      const normals = [];

      part.faces.forEach(([a, b, c]) => {
        const pA = model.points[a];
        const pB = model.points[b];
        const pC = model.points[c];
        if (!pA || !pB || !pC) return;
        const va = new THREE.Vector3(pA[0], pA[1], pA[2]);
        const vb = new THREE.Vector3(pB[0], pB[1], pB[2]);
        const vc = new THREE.Vector3(pC[0], pC[1], pC[2]);
        const normal = new THREE.Vector3().subVectors(vb, va).cross(new THREE.Vector3().subVectors(vc, va)).normalize();
        [va, vb, vc].forEach((vertex) => {
          positions.push(vertex.x, vertex.y, vertex.z);
          normals.push(normal.x, normal.y, normal.z);
        });
      });

      geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
      geometry.computeBoundingSphere();
      const mesh = new THREE.Mesh(geometry, material);
      // preserve part name for selection UI
      mesh.userData = mesh.userData || {};
      mesh.userData.partName = part.name || `part-${index}`;
      mesh.name = mesh.userData.partName;
      group.add(mesh);

      if (part.edges && part.edges.length) {
        const edgePositions = [];
        part.edges.forEach(([a, b]) => {
          const pA = model.points[a];
          const pB = model.points[b];
          if (!pA || !pB) return;
          edgePositions.push(pA[0], pA[1], pA[2], pB[0], pB[1], pB[2]);
        });
        const edgeGeometry = new THREE.BufferGeometry();
        edgeGeometry.setAttribute("position", new THREE.Float32BufferAttribute(edgePositions, 3));
        group.add(new THREE.LineSegments(edgeGeometry, lineMaterial));
      }
    });
  } else if (model.faces && model.faces.length) {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const normals = [];

    model.faces.forEach(([a, b, c]) => {
      const pA = model.points[a];
      const pB = model.points[b];
      const pC = model.points[c];
      if (!pA || !pB || !pC) return;
      const va = new THREE.Vector3(pA[0], pA[1], pA[2]);
      const vb = new THREE.Vector3(pB[0], pB[1], pB[2]);
      const vc = new THREE.Vector3(pC[0], pC[1], pC[2]);
      const normal = new THREE.Vector3().subVectors(vb, va).cross(new THREE.Vector3().subVectors(vc, va)).normalize();
      [va, vb, vc].forEach((vertex) => {
        positions.push(vertex.x, vertex.y, vertex.z);
        normals.push(normal.x, normal.y, normal.z);
      });
    });

    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
    geometry.computeBoundingSphere();
    const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0xdde9ff, metalness: 0.12, roughness: 0.38, side: THREE.DoubleSide }));
    group.add(mesh);
  }

  if (model.edges && model.edges.length) {
    const positions = [];
    model.edges.forEach(([a, b]) => {
      const pA = model.points[a];
      const pB = model.points[b];
      if (!pA || !pB) return;
      positions.push(pA[0], pA[1], pA[2], pB[0], pB[1], pB[2]);
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    const lines = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: 0x9fd0ff, transparent: true, opacity: 0.58 }));
    group.add(lines);
  }

  const box = new THREE.Box3().setFromObject(group);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  group.position.sub(center);
  return group;
}

// Populate part select and axis controls when a model is loaded
function setupModelControlsForGroup(group) {
  try {
    const partSelect = document.getElementById("partSelect");
    const focusBtn = document.getElementById("focusPartBtn");
    const rotX = document.getElementById("rotX");
    const rotY = document.getElementById("rotY");
    const rotZ = document.getElementById("rotZ");
    if (!group) return;

    // gather part names from meshes
    const parts = [];
    group.traverse((child) => {
      if (child.isMesh && child.userData && child.userData.partName) parts.push({ name: child.userData.partName, mesh: child });
    });

    // populate select
    if (partSelect) {
      partSelect.innerHTML = "<option value=''>(none)</option>";
      parts.forEach((p, i) => {
        const opt = document.createElement("option");
        opt.value = String(i);
        opt.textContent = p.name || `part-${i}`;
        partSelect.appendChild(opt);
      });
    }

    let highlighted = null;
    const clearHighlight = () => {
      if (highlighted) {
        highlighted.material.emissive && highlighted.material.emissive.setHex(highlighted.userData._origEmissive || 0x000000);
        highlighted = null;
      }
    };

    const highlightPart = (idx) => {
      clearHighlight();
      const p = parts[Number(idx)];
      if (!p) return;
      highlighted = p.mesh;
      highlighted.userData._origEmissive = highlighted.material.emissive ? highlighted.material.emissive.getHex() : 0x000000;
      if (highlighted.material.emissive) highlighted.material.emissive.setHex(0x3366ff);
    };

    if (partSelect) {
      partSelect.addEventListener("change", () => {
        highlightPart(partSelect.value);
      });
    }

    if (focusBtn) {
      focusBtn.addEventListener("click", () => {
        const idx = Number(partSelect.value);
        const p = parts[idx];
        if (!p) return;
        // frame only that mesh
        const box = new THREE.Box3().setFromObject(p.mesh);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);
        if (projectViewerState.controls) {
          projectViewerState.controls.target.copy(center);
          projectViewerState.controls.radius = Math.max(size.length() * 1.5, 0.5);
          projectViewerState.controls.needsUpdate = true;
        }
      });
    }

    // axis sliders -> rotate group
    if (rotX || rotY || rotZ) {
      const onAxis = () => {
        if (!projectViewerState.group) return;
        projectViewerState.group.rotation.x = parseFloat(rotX?.value || 0);
        projectViewerState.group.rotation.y = parseFloat(rotY?.value || 0);
        projectViewerState.group.rotation.z = parseFloat(rotZ?.value || 0);
      };
      rotX && rotX.addEventListener("input", onAxis);
      rotY && rotY.addEventListener("input", onAxis);
      rotZ && rotZ.addEventListener("input", onAxis);
    }
  } catch (e) { console.warn("setupModelControlsForGroup failed", e); }
}

function renderProjectCad() {
  renderProjectViewer();
}

function updateLaunchFilm() {
  if (!launchScroll || !launchSticky) return;

  const rect = launchScroll.getBoundingClientRect();
  const travel = Math.max(1, rect.height - window.innerHeight);
  const progress = clamp(-rect.top / travel);

  if (launchFilmFrame && launchFilmFrames.length) {
    const frameIndex = Math.min(launchFilmFrames.length - 1, Math.max(0, Math.round(progress * (launchFilmFrames.length - 1))));
    const nextFrame = launchFilmFrames[frameIndex];
    if (launchFilmFrame.dataset.frame !== String(frameIndex)) {
      launchFilmFrame.src = nextFrame;
      launchFilmFrame.dataset.frame = String(frameIndex);
    }
  }

  launchSticky.style.setProperty("--film-scale", (0.98 + progress * 0.03).toFixed(3));
  launchSticky.style.setProperty("--video-opacity", String(0.62 + progress * 0.34));

  if (!launchVideo) return;

  if (Number.isFinite(launchVideo.duration) && launchVideo.duration > 0) {
    const duration = launchVideo.duration;
    const rangeStart = clamp(Number(launchVideo.dataset.rangeStart ?? 0), 0, duration);
    const parsedRangeEnd = Number(launchVideo.dataset.rangeEnd);
    const rangeEnd = clamp(Number.isFinite(parsedRangeEnd) ? parsedRangeEnd : duration, rangeStart, duration);
    const target = rangeStart + (rangeEnd - rangeStart) * progress;
    try {
      if (launchVideo.seeking) return;
      const now = performance.now();
      if (now - launchLastSeekAt < 20) return;

      const current = launchVideo.currentTime || 0;
      const delta = target - current;
      if (Math.abs(delta) < 0.012) return;

      if (typeof launchVideo.fastSeek === "function" && Math.abs(delta) > 0.16) {
        try { launchVideo.fastSeek(target); } catch (e) { launchVideo.currentTime = target; }
      } else {
        launchVideo.currentTime = target;
      }

      launchVideo.muted = true;
      launchVideo.controls = false;
      launchLastSeekAt = now;
    } catch (e) { /* ignore seek errors */ }
  }
}

// Ensure we update scrub after metadata is available
if (launchVideo) {
  // Keep launch film muted and controlled by scroll position.
  try { launchVideo.muted = true; } catch (e) { /* ignore */ }
  try { launchVideo.controls = false; } catch (e) { /* ignore */ }
  launchVideo.preload = "auto";
  launchVideo.playsInline = true;
  if (Number.isFinite(launchVideo.duration) && launchVideo.duration > 0) {
    updateLaunchFilm();
    try { launchVideo.pause(); } catch (e) { /* ignore */ }
  } else {
    launchVideo.addEventListener("loadedmetadata", () => {
      try { updateLaunchFilm(); launchVideo.pause(); } catch (e) { /* ignore */ }
    }, { once: true });
  }
}

async function loadExternalCad(url, name) {
  try {
    const ext = (name.split('.').pop() || '').toLowerCase();
    if (ext === 'obj' || ext === 'ork' || ext === 'xml' || ext === 'stl') {
      await projectViewerLoadSource(url);
      if (projectCadStatus) projectCadStatus.textContent = `${name} render active`;
      return;
    }
    if (projectCadStatus) projectCadStatus.textContent = `Unsupported file type: ${name}`;
  } catch (e) {
    if (projectCadStatus) projectCadStatus.textContent = `Error loading ${name}`;
    console.error("External CAD load failed", e);
  }
}

function updateSpace(time) {
  const scrollMax = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const scrollProgress = clamp(window.scrollY / scrollMax);
  const pulse = (Math.sin(time * 0.00032) + 1) * 0.5;
  const pulse2 = (Math.sin(time * 0.00019 + 2.35) + 1) * 0.5;

  if (starfield) {
    starfield.style.setProperty("--star-drift", `${scrollProgress * -42}px`);
    const stars = starfield.children;
    const pointerRadius = Math.min(window.innerWidth, window.innerHeight) * 0.32;
    for (let i = 0; i < stars.length; i += 1) {
      const star = stars[i];
      const base = Number(star.style.getPropertyValue("--base-o")) || 0.4;
      const phase = Number(star.dataset.phase) || 0;
      const rate = Number(star.dataset.rate) || 1;
      const left = Number(star.dataset.left) || 0;
      const top = Number(star.dataset.top) || 0;
      const flicker = Math.sin(time * 0.001 * rate + phase) * 0.14;
      const starX = (left / 100) * window.innerWidth;
      const starY = ((top / 124) * window.innerHeight) - (window.innerHeight * 0.12);
      const distance = Math.hypot(pointer.x - starX, pointer.y - starY);
      // Only apply a visible glow for stars near the cursor; avoid a broad global glow
      const raw = clamp(1 - distance / pointerRadius, 0, 1);
      const glow = raw > 0.06 ? raw : 0; // threshold to prevent subtle global wash
      const boosted = clamp(base + flicker + glow * 1.0, 0.08, 1);
      star.style.setProperty("--o", String(boosted));
      star.style.setProperty("--boost", String(glow));
      if (glow > 0) {
        star.style.boxShadow = `0 0 ${6 + glow * 28}px rgba(255, 255, 255, ${0.26 + glow * 0.74})`;
        star.style.transform = `scale(${1 + glow * 0.82})`;
      } else {
        // minimal baseline shadow for distant stars, keep subtle and not cursor-linked
        star.style.boxShadow = `0 0 4px rgba(255,255,255,0.06)`;
        star.style.transform = `scale(1)`;
      }
    }
  }

  pointer.x = lerp(pointer.x, pointer.tx, 0.08);
  pointer.y = lerp(pointer.y, pointer.ty, 0.08);
  const x = `${pointer.x}px`;
  const y = `${pointer.y}px`;

  if (spaceScene) {
    spaceScene.style.setProperty("--blue-glow-x", `${(68 + Math.sin(time * 0.00018) * 10 + scrollProgress * 4).toFixed(1)}%`);
    spaceScene.style.setProperty("--blue-glow-y", `${(30 + Math.cos(time * 0.00022) * 8).toFixed(1)}%`);
    spaceScene.style.setProperty("--blue-glow-a", (0.10 + pulse * 0.11).toFixed(3));
    spaceScene.style.setProperty("--blue-glow-2x", `${(24 + Math.cos(time * 0.00014 + 1.7) * 14).toFixed(1)}%`);
    spaceScene.style.setProperty("--blue-glow-2y", `${(70 + Math.sin(time * 0.0002 + 0.9) * 10).toFixed(1)}%`);
    spaceScene.style.setProperty("--blue-glow-b", (0.04 + pulse2 * 0.08).toFixed(3));
    spaceScene.style.setProperty("--nebula-a", (0.06 + pulse * 0.07).toFixed(3));
    spaceScene.style.setProperty("--nebula-b", (0.05 + pulse2 * 0.06).toFixed(3));
    spaceScene.style.setProperty("--nebula-scale-a", `${1 + pulse * 0.08}`);
    spaceScene.style.setProperty("--nebula-scale-b", `${1 + pulse2 * 0.08}`);
    spaceScene.style.setProperty("--cursor-x", x);
    spaceScene.style.setProperty("--cursor-y", y);
    spaceScene.style.setProperty("--nebula-x", `${scrollProgress * -24}px`);
    spaceScene.style.setProperty("--nebula-y", `${scrollProgress * 28}px`);
    spaceScene.style.setProperty("--nebula-scale", `${1 + pulse * 0.08}`);
  }

  if (cursorField) {
    cursorField.style.setProperty("--cursor-x", x);
    cursorField.style.setProperty("--cursor-y", y);
  }

  if (heroMedia) {
    heroMedia.style.setProperty("--hero-drift", `${window.scrollY * 0.08}px`);
  }

  if (pageCometLayer && pageComets.length) {
    const launchTop = launchScroll ? launchScroll.offsetTop : window.innerHeight * 0.9;
    const launchBottom = launchScroll ? (launchScroll.offsetTop + launchScroll.offsetHeight) : window.innerHeight * 1.8;
    const enableComets = window.scrollY > launchBottom;
    pageCometLayer.style.opacity = enableComets ? "1" : "0";

    if (enableComets) {
      const cometProgress = clamp((window.scrollY - launchBottom) / Math.max(window.innerHeight * 1.2, 1), 0, 12);
      pageComets.forEach((comet, index) => {
        const lane = Number.parseFloat(comet.style.getPropertyValue("--lane")) || (24 + index * 18);
        const speed = Number.parseFloat(comet.style.getPropertyValue("--speed")) || 120;
        const delay = Number.parseFloat(comet.style.getPropertyValue("--delay")) || (index * 40);
        const travel = (cometProgress * speed + delay) % 190;
        const xPos = -24 + travel;
        const yWobble = Math.sin((time * 0.0012) + index * 1.4) * 1.8;
        const yPos = lane + yWobble;
        const scale = 0.9 + ((index % 3) * 0.08);
        comet.style.transform = `translate3d(${xPos.toFixed(2)}vw, ${yPos.toFixed(2)}vh, 0) scale(${scale.toFixed(2)})`;
        comet.style.opacity = String(0.32 + (Math.sin(time * 0.0016 + index) + 1) * 0.24);
      });
    } else {
      pageComets.forEach((comet) => {
        comet.style.opacity = "0";
      });
    }
  }

  if (motionLab) {
    const motionRect = motionLab.getBoundingClientRect();
    const motionProgress = clamp(1 - (motionRect.top / (window.innerHeight * 1.35)), 0, 1);

    if (motionScene) {
      motionScene.style.setProperty("--motion-grid-y", "0px");
    }

    motionRockets.forEach((rocket, index) => {
      const direction = index === 0 ? 1 : -1;
      const x = index === 0 ? (-18 + motionProgress * 138) : (118 - motionProgress * 144);
      const y = index === 0 ? (24 + Math.sin(time * 0.00045) * 4 - motionProgress * 12) : (64 + Math.cos(time * 0.00038) * 3 - motionProgress * 8);
      const rotate = index === 0 ? (-18 + motionProgress * 16) : (12 - motionProgress * 14);
      rocket.style.transform = `translate3d(${x.toFixed(2)}vw, ${y.toFixed(2)}vh, 0) rotate(${rotate.toFixed(2)}deg) scale(${1 + motionProgress * 0.08}) scaleX(${direction})`;
      rocket.style.opacity = String(0.34 + motionProgress * 0.66);
    });

    motionComets.forEach((comet, index) => {
      const drift = index === 0 ? (110 - motionProgress * 146) : (-12 + motionProgress * 150);
      const lift = index === 0 ? (26 + Math.sin(time * 0.00055) * 6 - motionProgress * 11) : (72 + Math.cos(time * 0.0005) * 5 - motionProgress * 9);
      const tilt = index === 0 ? (-12 + motionProgress * 9) : (16 - motionProgress * 8);
      comet.style.transform = `translate3d(${drift.toFixed(2)}vw, ${lift.toFixed(2)}vh, 0) rotate(${tilt.toFixed(2)}deg) scale(${1 + motionProgress * 0.52})`;
      comet.style.opacity = String(0.3 + motionProgress * 0.7);
    });

    motionStreaks.forEach((streak, index) => {
      const offset = index === 0 ? -22 : index === 1 ? 8 : 34;
      const horizontal = index === 0 ? (motionProgress * 124 - 12) : index === 1 ? (motionProgress * -128 + 118) : (12 + motionProgress * 32);
      const vertical = index === 0 ? 14 + motionProgress * 8 : index === 1 ? 46 + motionProgress * 6 : 84 - motionProgress * 18;
      const rot = index === 0 ? -10 + motionProgress * 10 : index === 1 ? 12 - motionProgress * 14 : -4 + motionProgress * 6;
      streak.style.transform = `translate3d(${horizontal.toFixed(2)}vw, ${vertical.toFixed(2)}vh, 0) rotate(${rot.toFixed(2)}deg) scaleX(${1 + motionProgress * 0.24})`;
      streak.style.opacity = String(0.18 + motionProgress * 0.82);
      streak.style.width = `${(22 + index * 6 + motionProgress * 18).toFixed(2)}vw`;
      streak.style.left = streak.classList.contains('motion-streak-c') ? `${(12 + motionProgress * 18).toFixed(2)}vw` : '';
    });
  }
}

function animate(time) {
  updateLaunchFilm();
  updateSpace(time);
  renderCad();
  renderProjectCad();
  requestAnimationFrame(animate);
}

window.addEventListener("pointermove", (event) => {
  pointer.tx = event.clientX;
  pointer.ty = event.clientY;
}, { passive: true });

window.addEventListener("resize", createStars, { passive: true });
window.addEventListener("scroll", () => updateSpace(performance.now()), { passive: true });
window.addEventListener("scroll", updateLaunchFilm, { passive: true });

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

if (newsroomGallery && newsroomGalleryItems.length) {
  newsroomGalleryItems.forEach((button, index) => {
    button.addEventListener("click", () => setNewsroomGallery(index));
  });
  if (newsroomGalleryPrev) newsroomGalleryPrev.addEventListener("click", () => advanceNewsroomGallery(-1));
  if (newsroomGalleryNext) newsroomGalleryNext.addEventListener("click", () => advanceNewsroomGallery(1));
  setNewsroomGallery(0);
}

if (newsroomGalleryFeed && newsroomGalleryFeedData.length) {
  appendNewsroomGalleryBatch();
  if (newsroomGallerySentinel && "IntersectionObserver" in window) {
    const galleryObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        if (newsroomGalleryFeedIndex >= newsroomGalleryFeedData.length) {
          galleryObserver.disconnect();
          return;
        }
        appendNewsroomGalleryBatch();
      });
    }, { rootMargin: "600px 0px" });
    galleryObserver.observe(newsroomGallerySentinel);
  }
}

updateNewsroomMonthlyStats();

document.querySelectorAll("[data-project]").forEach((card) => {
  card.addEventListener("click", () => {
    loadProjectCad(card.dataset.project);
  });
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      loadProjectCad(card.dataset.project);
    }
  });
});

if (projectCadButtons.length) {
  projectCadButtons.forEach((button) => {
    button.addEventListener("click", () => {
      loadProjectCad(button.dataset.renderProject);
    });
  });
}

if (projectCadViewer) {
  loadProjectCad(activeProjectRender);
}

fitCrewNames();
window.addEventListener("resize", () => {
  window.requestAnimationFrame(fitCrewNames);
});
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => window.requestAnimationFrame(fitCrewNames)).catch(() => {});
}


createStars();
updateSpace(performance.now());
requestAnimationFrame(animate);

// Header hide/show on scroll: hide on scroll down, show on scroll up; compact when small scroll
(function headerScrollBehavior() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  let lastY = window.scrollY || 0;
  let ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY || 0;
      const delta = y - lastY;

      // keep header visible if nav menu is open
      const navOpen = document.getElementById('navLinks') && document.getElementById('navLinks').classList.contains('open');
      if (navOpen) {
        header.classList.remove('nav-hidden');
        header.classList.remove('compact');
        lastY = y;
        ticking = false;
        return;
      }

      if (y > 120 && delta > 8) {
        // user scrolled down -> hide
        header.classList.add('nav-hidden');
        header.classList.remove('compact');
      } else if (delta < -8) {
        // scrolled up -> show
        header.classList.remove('nav-hidden');
        header.classList.add('compact');
      } else {
        // small moves: make compact if scrolled a bit
        if (y > 60) header.classList.add('compact'); else header.classList.remove('compact');
      }

      lastY = y;
      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  // ensure correct initial state
  onScroll();
})();
