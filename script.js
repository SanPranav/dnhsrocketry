function renderSharedLayout() {
  const navMount = document.getElementById("siteNavMount");
  const footerMount = document.getElementById("siteFooterMount");
  const page = document.body?.dataset?.page || "";

  const activeClass = (slug) => (page === slug ? " class=\"active\"" : "");
  const contactClass = page === "contact" ? " class=\"active apply-link\"" : " class=\"apply-link\"";

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

renderSharedLayout();

const starfield = document.getElementById("starfield");
const cursorField = document.getElementById("cursorField");
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");
const launchScroll = document.querySelector(".launch-scroll");
const launchSticky = document.querySelector(".launch-sticky");
const launchVideo = document.getElementById("launchVideo");
const newsroomGallery = document.querySelector("[data-newsroom-gallery]");
const newsroomGalleryImage = document.getElementById("newsroomGalleryImage");
const newsroomGalleryTitle = document.getElementById("newsroomGalleryTitle");
const newsroomGalleryCaption = document.getElementById("newsroomGalleryCaption");
const newsroomGalleryItems = document.querySelectorAll("[data-gallery-item]");
const newsroomGalleryPrev = document.querySelector("[data-gallery-prev]");
const newsroomGalleryNext = document.querySelector("[data-gallery-next]");
const newsroomGalleryFeed = document.querySelector("[data-gallery-feed]");
const newsroomGallerySentinel = document.querySelector("[data-gallery-sentinel]");
const projectModal = document.getElementById("projectModal");
const reveals = document.querySelectorAll(".reveal");
const spaceScene = document.querySelector(".space-scene");
const heroMedia = document.querySelector(".hero-media");
const cadCanvas = document.getElementById("cadCanvas");
const cadInput = document.getElementById("cadInput");
const cadStatus = document.getElementById("cadStatus");
const projectCadCanvas = document.getElementById("projectCadCanvas");
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
    cadSource: "assets/Assembly1.x_t",
    cadDownload: "assets/Assembly1.x_t",
    video: "videos/launch.mp4"
  }
  // additional projects can be added here following the same structure
};

let cadModel = createPlaceholderModel();
let cadRotation = 0;
let projectCadModel = createPlaceholderModel();
let projectCadRotation = 0;
let activeProjectRender = "natsqual";
const projectCadCache = {};
let projectCadProjected = [];
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

let newsroomGalleryFeedIndex = 0;
const newsroomGalleryFeedBatchSize = 4;

function appendNewsroomGalleryBatch() {
  if (!newsroomGalleryFeed) return;
  const nextItems = newsroomGalleryFeedData.slice(newsroomGalleryFeedIndex, newsroomGalleryFeedIndex + newsroomGalleryFeedBatchSize);
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

  text.split(/\r?\n/).forEach((line) => {
    const parts = line.trim().split(/\s+/);
    if (parts[0] === "v" && parts.length >= 4) {
      points.push(parts.slice(1, 4).map(Number));
    }
    if (parts[0] === "f" && parts.length >= 4) {
      const ids = parts.slice(1).map((part) => Number(part.split("/")[0]) - 1).filter((id) => Number.isFinite(id));
      for (let i = 1; i < ids.length - 1; i += 1) {
        faces.push([ids[0], ids[i], ids[i + 1]]);
      }
      ids.forEach((id, index) => {
        const next = ids[(index + 1) % ids.length];
        edges.add([Math.min(id, next), Math.max(id, next)].join(":"));
      });
    }
  });

  return normalizeModel({ points, edges: [...edges].map((edge) => edge.split(":").map(Number)), faces });
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
    faces: (model.faces || []).slice(0, 6000)
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

  if (projectCadCache[key]) {
    projectCadModel = projectCadCache[key];
    if (uploadStatus) uploadStatus.textContent = "Renderer ready";
    if (projectCadStatus) projectCadStatus.textContent = `${projectData[key].title} CAD render active`;
    return;
  }

  try {
    if (uploadStatus) uploadStatus.textContent = "Loading CAD model";
    if (projectCadStatus) projectCadStatus.textContent = `Loading ${data.cad}`;
    const url = encodeURI(data.cad);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Primary CAD load failed: ${response.status}`);
    const buffer = await response.arrayBuffer();
    const name = data.cad;
    // Try ORK extraction first (handles zipped ORK or XML). If not, try known formats.
    const xml = extractOrkXmlFromBuffer(buffer);
    let model;
    if (xml) {
      model = parseOrkXmlToModel(xml, key);
    } else {
      // Attempt to guess format from bytes
      const ext = (name.split('.').pop() || '').toLowerCase();
      if (ext === 'obj') {
        model = parseObj(new TextDecoder().decode(buffer));
      } else if (ext === 'stl') {
        model = parseStl(buffer);
      } else if (ext === 'ork') {
        // fallback: try reading as text
        model = parseOrkXmlToModel(new TextDecoder().decode(buffer), key);
      } else if (ext === 'x_t') {
        // Parasolid x_t isn't directly renderable in-browser; keep a stable fallback preview.
        model = profileToModel(getFallbackOrkProfile(key));
        if (projectCadStatus) projectCadStatus.textContent = `${name} loaded (parasolid preview fallback)`;
      } else {
        // Unsupported: show fallback model but indicate file loaded
        model = profileToModel(getFallbackOrkProfile(key));
        if (projectCadStatus) projectCadStatus.textContent = `${name} loaded (preview unavailable)`;
      }
    }
    projectCadCache[key] = model;
    projectCadModel = model;
    if (uploadStatus) uploadStatus.textContent = "Renderer ready";
    if (projectCadStatus) projectCadStatus.textContent = `${projectData[key].title} CAD render active`;
  } catch (error) {
    try {
      if (!data.cadSource) throw error;
      if (projectCadStatus) projectCadStatus.textContent = `Converted mesh not found, loading ${data.cadSource}`;
      const sourceUrl = encodeURI(data.cadSource);
      const sourceResponse = await fetch(sourceUrl);
      if (!sourceResponse.ok) throw error;
      await sourceResponse.arrayBuffer();
      projectCadModel = profileToModel(getFallbackOrkProfile(key));
      projectCadCache[key] = projectCadModel;
      if (uploadStatus) uploadStatus.textContent = "Converted mesh missing";
      if (projectCadStatus) {
        projectCadStatus.textContent = `${data.cadSource} loaded (generated preview active)`;
      }
    } catch (fallbackError) {
      projectCadModel = profileToModel(getFallbackOrkProfile(key));
      if (uploadStatus) uploadStatus.textContent = "Using fallback render";
      if (projectCadStatus) projectCadStatus.textContent = `${projectData[key].title} fallback render active`;
    }
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

function renderProjectCad() {
  if (!projectCadCanvas) return;

  const ctx = projectCadCanvas.getContext("2d");
  const rect = projectCadCanvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  if (projectCadCanvas.width !== Math.floor(rect.width * dpr) || projectCadCanvas.height !== Math.floor(rect.height * dpr)) {
    projectCadCanvas.width = Math.floor(rect.width * dpr);
    projectCadCanvas.height = Math.floor(rect.height * dpr);
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, rect.width, rect.height);
  const bg = ctx.createLinearGradient(0, 0, rect.width, rect.height);
  bg.addColorStop(0, "rgba(143,199,255,0.06)");
  bg.addColorStop(1, "rgba(255,138,36,0.03)");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, rect.width, rect.height);

  const scale = Math.min(rect.width, rect.height) * 0.34;
  const cx = rect.width / 2;
  const cy = rect.height / 2;
  const projected = projectModelPoints(projectCadModel, projectCadRotation, -0.3, scale, cx, cy, 1.82);
  // store for selection logic
  projectCadProjected = projected;

  fillProjectedFaces(ctx, projected, projectCadModel.faces, [143, 199, 255]);

  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(143,199,255,0.72)";
  ctx.beginPath();
  projectCadModel.edges.forEach(([a, b]) => {
    const p1 = projected[a];
    const p2 = projected[b];
    if (!p1 || !p2) return;
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
  });
  ctx.stroke();

  // draw selection overlay if present
  if (projectSelection.edges && projectSelection.edges.size) {
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = "rgba(255,200,80,0.95)";
    ctx.beginPath();
    projectSelection.edges.forEach((key) => {
      const [ia, ib] = key.split(':').map(Number);
      const p1 = projected[ia];
      const p2 = projected[ib];
      if (!p1 || !p2) return;
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
    });
    ctx.stroke();
    ctx.lineWidth = 1;
  }

  ctx.strokeStyle = "rgba(255,255,255,0.13)";
  ctx.strokeRect(16, 16, rect.width - 32, rect.height - 32);
  if (projectAutoRotate) projectCadRotation += projectRotateSpeed;
}

function updateLaunchFilm() {
  if (!launchScroll || !launchSticky) return;

  const rect = launchScroll.getBoundingClientRect();
  const travel = Math.max(1, rect.height - window.innerHeight);
  const progress = clamp(-rect.top / travel);

  launchSticky.style.setProperty("--film-scale", (1.04 + progress * 0.08).toFixed(3));
  launchSticky.style.setProperty("--video-opacity", String(0.62 + progress * 0.34));

  if (launchVideo && Number.isFinite(launchVideo.duration) && launchVideo.duration > 0) {
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

      const smoothedTarget = current + delta * 0.48;
      if (typeof launchVideo.fastSeek === "function" && Math.abs(delta) > 0.16) {
        try { launchVideo.fastSeek(smoothedTarget); } catch (e) { launchVideo.currentTime = smoothedTarget; }
      } else {
        launchVideo.currentTime = smoothedTarget;
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

// Project renderer uploader and controls
let projectAutoRotate = true;
let projectRotateSpeed = 0.0055;

function setupProjectRendererControls() {
  const status = document.getElementById('projectUploadStatus');
  const autoToggle = document.getElementById('autoRotateToggle');
  const speed = document.getElementById('rotateSpeed');

  if (autoToggle) {
    projectAutoRotate = !!autoToggle.checked;
    autoToggle.addEventListener('change', () => { projectAutoRotate = !!autoToggle.checked; });
  }
  if (speed) {
    projectRotateSpeed = Number(speed.value) || 0.0055;
    speed.addEventListener('input', () => { projectRotateSpeed = Number(speed.value) || 0.0055; });
  }
}

window.addEventListener('load', () => { setupProjectRendererControls(); });

async function loadExternalCad(url, name) {
  try {
    const ext = (name.split('.').pop() || '').toLowerCase();
    if (ext === 'ork') {
      const buffer = await (await fetch(url)).arrayBuffer();
      const xml = extractOrkXmlFromBuffer(buffer);
      const model = xml ? parseOrkXmlToModel(xml, name) : profileToModel(getFallbackOrkProfile(name));
      projectCadModel = model;
      projectCadRotation = 0;
      if (projectCadStatus) projectCadStatus.textContent = xml ? `${name} ORK render active` : `${name} ORK fallback render active`;
      return;
    }
    if (ext === 'obj') {
      const text = await (await fetch(url)).text();
      const model = parseObj(text);
      projectCadModel = model;
      projectCadRotation = 0;
      if (projectCadStatus) projectCadStatus.textContent = `${name} OBJ render active`;
      return;
    }
    if (ext === 'stl') {
      const buffer = await (await fetch(url)).arrayBuffer();
      const model = parseStl(buffer);
      projectCadModel = model;
      projectCadRotation = 0;
      if (projectCadStatus) projectCadStatus.textContent = `${name} STL render active`;
      return;
    }
    if (projectCadStatus) projectCadStatus.textContent = `Cannot render ${name}`;
  } catch (e) {
    if (projectCadStatus) projectCadStatus.textContent = `Error loading ${name}`;
  }
}

function updateSpace(time) {
  const scrollMax = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const scrollProgress = clamp(window.scrollY / scrollMax);

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
      const glow = clamp(1 - distance / pointerRadius, 0, 1);
      const boosted = clamp(base + flicker + glow * 0.8, 0.08, 1);
      star.style.setProperty("--o", String(boosted));
      star.style.setProperty("--boost", String(glow));
      star.style.boxShadow = `0 0 ${6 + glow * 20}px rgba(255, 255, 255, ${0.26 + glow * 0.74})`;
      star.style.transform = `scale(${1 + glow * 0.72})`;
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
  document.getElementById("modalCad").href = data.cadDownload || data.cadSource || data.cad;
  document.getElementById("modalVideo").href = data.video;

  // Inline modal video player (if present) — prefer inline playback when available
  const modalVideoPlayer = document.getElementById("modalVideoPlayer");
  const modalImageEl = document.getElementById("modalImage");
  if (modalVideoPlayer && data.video) {
    modalVideoPlayer.src = data.video;
    modalVideoPlayer.muted = true;
    modalVideoPlayer.style.display = "block";
    if (modalImageEl) modalImageEl.style.display = "none";
    try { modalVideoPlayer.load(); } catch (e) { /* ignore */ }
  } else if (modalVideoPlayer) {
    try { modalVideoPlayer.pause(); } catch (e) { }
    modalVideoPlayer.removeAttribute('src');
    modalVideoPlayer.style.display = "none";
    if (modalImageEl) modalImageEl.style.display = "block";
  }

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
  // stop/clear modal inline video to free resources
  const modalVideoPlayer = document.getElementById("modalVideoPlayer");
  if (modalVideoPlayer) {
    try { modalVideoPlayer.pause(); } catch (e) { }
    modalVideoPlayer.removeAttribute('src');
    modalVideoPlayer.style.display = "none";
    const modalImageEl = document.getElementById("modalImage");
    if (modalImageEl) modalImageEl.style.display = "block";
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

document.querySelectorAll("[data-project]").forEach((card) => {
  card.addEventListener("click", () => {
    loadProjectCad(card.dataset.project);
    openProjectModal(card.dataset.project);
  });
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      loadProjectCad(card.dataset.project);
      openProjectModal(card.dataset.project);
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

if (projectCadCanvas) {
  loadProjectCad(activeProjectRender);
}

// Selection: allow clicking the project canvas to select vertex/edges
if (projectCadCanvas) {
  projectCadCanvas.addEventListener('click', (ev) => {
    const rect = projectCadCanvas.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    if (!projectCadProjected || !projectCadProjected.length) return;

    // find nearest vertex
    let best = { idx: -1, dist: Infinity };
    for (let i = 0; i < projectCadProjected.length; i += 1) {
      const p = projectCadProjected[i];
      if (!p) continue;
      const dx = p.x - x;
      const dy = p.y - y;
      const d = Math.hypot(dx, dy);
      if (d < best.dist) { best = { idx: i, dist: d }; }
    }

    const threshold = Math.max(12, Math.min(30, (rect.width + rect.height) * 0.01));
    projectSelection.vertex = null;
    projectSelection.edges.clear();
    if (best.dist <= threshold) {
      projectSelection.vertex = best.idx;
      // collect connected edges
      projectCadModel.edges.forEach(([a, b]) => {
        if (a === best.idx || b === best.idx) projectSelection.edges.add(`${a}:${b}`);
      });
      if (projectCadStatus) projectCadStatus.textContent = `Selected vertex ${best.idx} — ${projectSelection.edges.size} edges`;
    } else {
      // try nearest edge to click
      let bestEdge = { key: null, dist: Infinity };
      projectCadModel.edges.forEach(([a, b]) => {
        const p1 = projectCadProjected[a];
        const p2 = projectCadProjected[b];
        if (!p1 || !p2) return;
        // distance from point to segment
        const l2 = (p2.x-p1.x)**2 + (p2.y-p1.y)**2;
        const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((x - p1.x)*(p2.x-p1.x) + (y - p1.y)*(p2.y-p1.y)) / l2));
        const projx = p1.x + t * (p2.x-p1.x);
        const projy = p1.y + t * (p2.y-p1.y);
        const d = Math.hypot(projx - x, projy - y);
        if (d < bestEdge.dist) bestEdge = { key: `${a}:${b}`, dist: d };
      });
      if (bestEdge.dist <= threshold) {
        projectSelection.edges.add(bestEdge.key);
        if (projectCadStatus) projectCadStatus.textContent = `Selected edge ${bestEdge.key}`;
      } else {
        if (projectCadStatus) projectCadStatus.textContent = `No part selected`;
      }
    }
  });
}

document.querySelectorAll("[data-close-modal]").forEach((control) => {
  control.addEventListener("click", closeProjectModal);
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeProjectModal();
});

createStars();
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
