import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { feature } from "topojson-client";
import type { Journey } from "../data/journeys";
import { approach, canvasTexture, prefersReducedMotion, type Stage } from "./stage";
import { makeCanvas } from "./writing";

type Ring = number[][];
type Geo = { type: string; coordinates: unknown; geometries?: Geo[] };

const R = 1;
const SEA = "#0f141b";
const LAND = "#d8c49a";
const COAST = "#5b3b1c";
const GRID = "rgba(232,212,154,0.10)";

/** Lat/lon (degrees) to a point on the globe, matching three's equirectangular sphere mapping. */
export function latLonToVec(lat: number, lon: number, r = R): THREE.Vector3 {
  const phi = THREE.MathUtils.degToRad(lat);
  const lam = THREE.MathUtils.degToRad(lon);
  return new THREE.Vector3(r * Math.cos(phi) * Math.cos(lam), r * Math.sin(phi), -r * Math.cos(phi) * Math.sin(lam));
}

function polygonsOf(g: Geo): Ring[][] {
  if (g.type === "Polygon") return [g.coordinates as Ring[]];
  if (g.type === "MultiPolygon") return g.coordinates as Ring[][];
  if (g.type === "GeometryCollection") return (g.geometries || []).flatMap(polygonsOf);
  return [];
}

/** Draw land as parchment on dark sea, for a lon/lat window, onto a canvas. */
function paintMap(
  polys: Ring[][],
  w: number,
  h: number,
  box: { lonMin: number; lonMax: number; latMin: number; latMax: number },
  coastPx: number
): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(w, h);
  const sea = ctx.createLinearGradient(0, 0, 0, h);
  sea.addColorStop(0, "#121a24");
  sea.addColorStop(1, SEA);
  ctx.fillStyle = sea;
  ctx.fillRect(0, 0, w, h);
  const x = (lon: number) => ((lon - box.lonMin) / (box.lonMax - box.lonMin)) * w;
  const y = (lat: number) => ((box.latMax - lat) / (box.latMax - box.latMin)) * h;
  ctx.strokeStyle = GRID;
  ctx.lineWidth = Math.max(1, coastPx * 0.6);
  for (let lon = -180; lon <= 180; lon += 10) {
    if (lon < box.lonMin || lon > box.lonMax) continue;
    ctx.beginPath();
    ctx.moveTo(x(lon), 0);
    ctx.lineTo(x(lon), h);
    ctx.stroke();
  }
  for (let lat = -80; lat <= 80; lat += 10) {
    if (lat < box.latMin || lat > box.latMax) continue;
    ctx.beginPath();
    ctx.moveTo(0, y(lat));
    ctx.lineTo(w, y(lat));
    ctx.stroke();
  }
  ctx.beginPath();
  for (const poly of polys) {
    for (const ring of poly) {
      // Rings that cross the date line (Eurasia does, in Siberia) jump by 360°. Make the longitudes
      // continuous, then draw the ring again one world to each side so both halves land on the map.
      const flat: [number, number][] = [];
      let shift = 0;
      ring.forEach(([lon, lat], i) => {
        if (i) {
          const d = lon + shift - flat[i - 1][0];
          if (d > 180) shift -= 360;
          else if (d < -180) shift += 360;
        }
        flat.push([lon + shift, lat]);
      });
      for (const offset of [-360, 0, 360]) {
        flat.forEach(([lon, lat], i) => (i ? ctx.lineTo(x(lon + offset), y(lat)) : ctx.moveTo(x(lon + offset), y(lat))));
        ctx.closePath();
      }
    }
  }
  ctx.fillStyle = LAND;
  ctx.fill("evenodd");
  ctx.strokeStyle = COAST;
  ctx.lineWidth = coastPx;
  ctx.stroke();
  return c;
}

/** Points along the great circle from a to b, `n` steps. */
function arc(a: THREE.Vector3, b: THREE.Vector3, n: number): THREE.Vector3[] {
  const out: THREE.Vector3[] = [];
  const an = a.clone().normalize();
  const bn = b.clone().normalize();
  const angle = an.angleTo(bn);
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    if (angle < 1e-6) {
      out.push(an.clone());
      continue;
    }
    const s = Math.sin(angle);
    out.push(
      an
        .clone()
        .multiplyScalar(Math.sin((1 - t) * angle) / s)
        .add(bn.clone().multiplyScalar(Math.sin(t * angle) / s))
    );
  }
  return out;
}

export type GlobeHandle = {
  /** Fly to a stop and draw the route up to it. */
  goTo: (index: number) => void;
  dispose: () => void;
};

export async function buildGlobe(
  stage: Stage,
  journey: Journey,
  opts: { labels: HTMLElement; onPick: (index: number) => void }
): Promise<GlobeHandle> {
  const renderer = stage.renderer;
  const reduced = prefersReducedMotion();
  const topo = (await import("world-atlas/land-50m.json")).default as unknown as Parameters<typeof feature>[0];
  const land = feature(topo, (topo as unknown as { objects: { land: Parameters<typeof feature>[1] } }).objects.land) as unknown as {
    features?: { geometry: Geo }[];
    geometry?: Geo;
  };
  const polys = (land.features ? land.features.map((f) => f.geometry) : land.geometry ? [land.geometry] : []).flatMap(polygonsOf);

  const maxTex = Math.min(renderer.capabilities.maxTextureSize, 4096);
  const world = paintMap(polys, maxTex, maxTex / 2, { lonMin: -180, lonMax: 180, latMin: -90, latMax: 90 }, 1.2);
  // A sharper patch over the Mediterranean, where every journey so far happens.
  const box = { lonMin: 4, lonMax: 44, latMin: 28, latMax: 48 };
  const region = paintMap(polys, maxTex, maxTex / 2, box, 2.2);

  const globe = new THREE.Group();
  stage.scene.add(globe);
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(R, 128, 64),
    new THREE.MeshStandardMaterial({ map: canvasTexture(world, renderer), roughness: 0.95, metalness: 0 })
  );
  globe.add(sphere);
  const deg = Math.PI / 180;
  const patch = new THREE.Mesh(
    new THREE.SphereGeometry(
      R * 1.0006,
      160,
      80,
      (box.lonMin + 180) * deg,
      (box.lonMax - box.lonMin) * deg,
      (90 - box.latMax) * deg,
      (box.latMax - box.latMin) * deg
    ),
    new THREE.MeshStandardMaterial({ map: canvasTexture(region, renderer), roughness: 0.95 })
  );
  globe.add(patch);

  // A thin glow round the rim of the world.
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(R * 1.12, 64, 32),
    new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { color: { value: new THREE.Color("#e8c68a") } },
      vertexShader: "varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader:
        "uniform vec3 color; varying vec3 vN; void main(){ float a = pow(max(0.0, 0.62 - dot(vN, vec3(0.0,0.0,1.0))), 3.0); gl_FragColor = vec4(color, a * 1.6); }"
    })
  );
  stage.scene.add(halo);

  // Faint stars far behind.
  const starGeo = new THREE.BufferGeometry();
  const starPos: number[] = [];
  for (let i = 0; i < 900; i++) {
    const v = new THREE.Vector3().randomDirection().multiplyScalar(30 + Math.random() * 10);
    starPos.push(v.x, v.y, v.z);
  }
  starGeo.setAttribute("position", new THREE.Float32BufferAttribute(starPos, 3));
  stage.scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: "#f3e2a8", size: 0.06, transparent: true, opacity: 0.5 })));

  // The lamp travels with the camera, so the side you look at is always lit.
  const lamp = new THREE.DirectionalLight("#fff1d6", 2.2);
  lamp.position.set(1, 1, 2);
  stage.camera.add(lamp);
  stage.scene.add(stage.camera);
  stage.scene.add(new THREE.AmbientLight("#8090b0", 0.55));

  // Route legs: solid where the hop is recorded, dashed where even the stops are unknown.
  const stopById = new Map(journey.stops.map((s, i) => [s.id, { ...s, index: i }]));
  // Lines are drawn in screen pixels (Line2), so the route stays a thin line at every zoom; a tube in globe
  // units grew to a thick band as the camera came down to a cluster of stops.
  const lineMats: LineMaterial[] = [];
  const solidMat = new LineMaterial({ color: 0xc0321a, linewidth: 2.2, worldUnits: false });
  const dashMat = new LineMaterial({ color: 0x8a3a1c, linewidth: 1.6, worldUnits: false, dashed: true, dashSize: 0.008, gapSize: 0.006, transparent: true, opacity: 0.9 });
  lineMats.push(solidMat, dashMat);
  type Leg = { toIndex: number; line: Line2; segments: number; path: THREE.Vector3[] };
  const legs: Leg[] = journey.legs.map((leg) => {
    const a = stopById.get(leg.from)!;
    const b = stopById.get(leg.to)!;
    const corners = [[a.lat, a.lon], ...(leg.via ?? []), [b.lat, b.lon]].map(([la, lo]) => latLonToVec(la, lo));
    const path: THREE.Vector3[] = [];
    corners.forEach((p, i) => {
      if (!i) return;
      const seg = arc(corners[i - 1], p, Math.max(6, Math.round(corners[i - 1].angleTo(p) / 0.004)));
      path.push(...(path.length ? seg.slice(1) : seg));
    });
    // Lift the line off the ground; sea crossings arch a little higher.
    const lifted = path.map((p, i) => {
      const t = i / (path.length - 1);
      const lift = leg.by === "sea" ? 0.004 + 0.02 * Math.sin(Math.PI * t) : 0.004;
      return p.clone().normalize().multiplyScalar(R + lift);
    });
    const geo = new LineGeometry();
    geo.setPositions(lifted.flatMap((p) => [p.x, p.y, p.z]));
    const line = new Line2(geo, leg.certainty === "attested" ? solidMat : dashMat);
    line.computeLineDistances();
    line.visible = false;
    globe.add(line);
    return { toIndex: b.index, line, segments: lifted.length - 1, path: lifted };
  });

  // Stop markers: a gold bead with a soft ring.
  const bead = new THREE.SphereGeometry(0.0045, 16, 12);
  const ringGeo = new THREE.RingGeometry(0.0075, 0.0105, 32);
  const markers = journey.stops.map((s) => {
    const p = latLonToVec(s.lat, s.lon, R + 0.003);
    const m = new THREE.Mesh(bead, new THREE.MeshBasicMaterial({ color: "#7a1606" }));
    m.position.copy(p);
    const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: "#a3210c", transparent: true, opacity: 0.7, side: THREE.DoubleSide }));
    ring.position.copy(p);
    ring.lookAt(p.clone().multiplyScalar(2));
    globe.add(m, ring);
    return { pos: p, ring, bead: m };
  });

  const traveler = new THREE.Mesh(new THREE.SphereGeometry(0.007, 16, 12), new THREE.MeshBasicMaterial({ color: "#fff6dc" }));
  const glowC = makeCanvas(64, 64);
  const g = glowC[1].createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,230,170,0.9)");
  g.addColorStop(1, "rgba(255,230,170,0)");
  glowC[1].fillStyle = g;
  glowC[1].fillRect(0, 0, 64, 64);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTexture(glowC[0], renderer), depthWrite: false, transparent: true }));
  glow.scale.setScalar(0.05);
  traveler.add(glow);
  globe.add(traveler);

  // HTML labels: real buttons, so they are readable, clickable and reachable by keyboard.
  const labelEls = journey.stops.map((s, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "jg-label jg-label--" + (s.label ?? "right");
    b.textContent = s.name;
    b.addEventListener("click", () => opts.onPick(i));
    opts.labels.appendChild(b);
    return b;
  });

  const controls = new OrbitControls(stage.camera, stage.canvas);
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  // Close enough for a cluster of stops a day's walk apart (Carthage, Curubis), at the cost of a softer coastline.
  controls.minDistance = 1.15;
  controls.maxDistance = 4.2;
  controls.rotateSpeed = 0.5;
  controls.zoomSpeed = 0.6;
  let userMoving = false;
  controls.addEventListener("start", () => {
    userMoving = true;
    flyTo = null;
  });
  controls.addEventListener("end", () => (userMoving = false));
  controls.addEventListener("change", () => stage.invalidate());

  const start = latLonToVec(38.5, 26, 1).normalize();
  stage.camera.position.copy(start.clone().multiplyScalar(reduced ? 2.1 : 3.6));
  stage.camera.lookAt(0, 0, 0);

  let flyTo: { dir: THREE.Vector3; dist: number } | null = { dir: start, dist: 2.1 };
  let progress = 0; // stops reached, fractional while travelling
  let goal = 0;
  const tmp = new THREE.Vector3();

  function travelerAt(p: number) {
    // p runs from 0 (first stop) to stops-1 (last); find the leg and how far along it.
    const i = Math.min(legs.length - 1, Math.floor(p));
    const leg = legs[Math.max(0, i)];
    const t = Math.min(1, Math.max(0, p - i));
    const path = leg.path;
    const f = t * (path.length - 1);
    const k = Math.floor(f);
    return path[Math.min(k, path.length - 1)].clone().lerp(path[Math.min(k + 1, path.length - 1)], f - k);
  }

  /**
   * Keep the markers, the traveller and the lines the same size on screen at any zoom: a few pixels, so the
   * route itself shows. (In globe units they swelled as the camera came down to a close cluster of stops.)
   */
  function sizeToScreen() {
    const { w, h } = stage.size();
    lineMats.forEach((m) => m.resolution.set(w, h));
    const above = Math.max(0.02, stage.camera.position.length() - R);
    const unitsPerPx = (2 * above * Math.tan(THREE.MathUtils.degToRad(stage.camera.fov / 2))) / Math.max(1, h);
    markers.forEach((mk, i) => {
      mk.bead.scale.setScalar((3 * unitsPerPx) / 0.0045);
      mk.ring.scale.setScalar(((Math.round(goal) === i ? 9 : 6) * unitsPerPx) / 0.0105);
    });
    traveler.scale.setScalar((3.5 * unitsPerPx) / 0.007);
  }

  function drawRoute() {
    legs.forEach((leg, i) => {
      const t = Math.min(1, Math.max(0, progress - i));
      // Each piece of a Line2 is one instance: drawing the first n draws the route that far.
      (leg.line.geometry as LineGeometry).instanceCount = Math.round(leg.segments * t);
      leg.line.visible = t > 0;
    });
    traveler.position.copy(travelerAt(progress));
    markers.forEach((m, i) => {
      const reached = progress >= i - 0.02;
      (m.ring.material as THREE.MeshBasicMaterial).opacity = reached ? 0.8 : 0.25;
    });
  }

  // Stops at the same spot (a city visited again) share one name tag: four tags on Alexandria hid the routes.
  const spotOf = journey.stops.map((s) => s.lat.toFixed(2) + "," + s.lon.toFixed(2));

  /** Of the stops at one spot, the one whose name shows: the current stop, else the latest reached, else the first. */
  function shownAtSpot(i: number): boolean {
    const same = spotOf.map((k, j) => (k === spotOf[i] ? j : -1)).filter((j) => j >= 0);
    if (same.length === 1) return true;
    const current = Math.round(goal);
    if (same.includes(current)) return i === current;
    const reached = same.filter((j) => progress >= j - 0.02);
    return i === (reached.length ? reached[reached.length - 1] : same[0]);
  }

  function placeLabels() {
    const { w, h } = stage.size();
    const camDir = tmp.copy(stage.camera.position).normalize();
    markers.forEach((m, i) => {
      const facing = m.pos.clone().normalize().dot(camDir);
      const p = m.pos.clone().project(stage.camera);
      const el = labelEls[i];
      const show = facing > 0.15 && shownAtSpot(i);
      el.style.opacity = show ? String(Math.min(1, (facing - 0.15) * 6)) : "0";
      el.style.pointerEvents = show ? "auto" : "none";
      el.tabIndex = show ? 0 : -1;
      el.style.transform = `translate(${((p.x + 1) / 2) * w}px, ${((1 - p.y) / 2) * h}px)`;
      el.classList.toggle("is-reached", progress >= i - 0.02);
      el.classList.toggle("is-current", Math.round(goal) === i);
    });
  }

  const stopFrame = stage.onFrame((dt) => {
    let moving = false;
    let m: boolean;
    [progress, m] = approach(progress, goal, reduced ? 100 : 1.6, dt);
    moving ||= m;
    if (flyTo && !userMoving) {
      const cur = stage.camera.position;
      const dist = cur.length();
      const dir = cur.clone().normalize();
      const k = 1 - Math.exp(-(reduced ? 100 : 2.4) * dt);
      dir.lerp(flyTo.dir, k).normalize();
      const nd = dist + (flyTo.dist - dist) * k;
      cur.copy(dir.multiplyScalar(nd));
      stage.camera.lookAt(0, 0, 0);
      if (cur.clone().normalize().angleTo(flyTo.dir) < 0.002 && Math.abs(nd - flyTo.dist) < 0.002) flyTo = null;
      else moving = true;
    }
    if (controls.update()) moving = true;
    sizeToScreen();
    drawRoute();
    placeLabels();
    return moving;
  });

  sizeToScreen();
  drawRoute();
  stage.invalidate();

  /**
   * How near the camera comes to each stop. Stops close together (Carthage and Curubis, Thagaste and Madauros)
   * merge into one blob at the usual height, so the camera comes down until the nearest other place sits
   * clear of it. Stops at the very same spot (a return to a city) do not count: their names sit on different sides.
   */
  const stopDist = journey.stops.map((s, i) => {
    const d = latLonToVec(s.lat, s.lon, 1).normalize();
    let gap = Infinity;
    journey.stops.forEach((o, j) => {
      const a = d.angleTo(latLonToVec(o.lat, o.lon, 1).normalize());
      if (j !== i && a > 0.002) gap = Math.min(gap, a);
    });
    // At a 30° view the visible half-height is about (dist − 1) × 0.27 radians; keep the gap near a tenth of it.
    const near = Math.max(controls.minDistance + 0.03, Math.min(1.75, 1 + gap / 0.03));
    return near >= 1.75 && (s.id === "rome" || s.id === "antioch") ? 2.0 : near;
  });

  return {
    goTo(index: number) {
      goal = Math.max(0, Math.min(journey.stops.length - 1, index));
      const s = journey.stops[goal];
      flyTo = { dir: latLonToVec(s.lat, s.lon, 1).normalize(), dist: stopDist[goal] };
      stage.invalidate();
    },
    dispose() {
      stopFrame();
      controls.dispose();
      labelEls.forEach((el) => el.remove());
    }
  };
}
