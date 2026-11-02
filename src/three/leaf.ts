import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { canvasTexture, type Stage } from "./stage";
import { makeCanvas, paintParchment } from "./writing";

export type LeafHandle = { dispose: () => void };

/**
 * One real manuscript page as a leaf of parchment you can tilt and zoom. The lamp follows the
 * pointer, raking across the surface like a reader's candle, and the image doubles as a bump map
 * so the ink and the skin catch the light.
 */
export async function buildLeaf(stage: Stage, opts: { url: string; onError: () => void }): Promise<LeafHandle> {
  const loader = new THREE.TextureLoader();
  loader.setCrossOrigin("anonymous");
  let tex: THREE.Texture;
  try {
    tex = await loader.loadAsync(opts.url);
  } catch {
    opts.onError();
    return { dispose() {} };
  }
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(16, stage.renderer.capabilities.getMaxAnisotropy());
  const img = tex.image as { width: number; height: number };
  const aspect = img.width / img.height;
  const H = 2;
  const W = H * aspect;

  // Parchment is never flat: a gentle cockle across the leaf and a lift at the outer edge.
  const geo = new THREE.PlaneGeometry(W, H, 64, 64);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) / W + 0.5;
    const y = pos.getY(i) / H + 0.5;
    const z = 0.035 * Math.sin(x * Math.PI * 2.2) * Math.sin(y * Math.PI * 1.3) + 0.08 * Math.pow(x, 4);
    pos.setZ(i, z);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();

  // The same texture doubles as the bump map. A clone would send the whole image to the GPU a second
  // time, which freezes the page for a moment on slower machines.
  const front = new THREE.MeshStandardMaterial({ map: tex, bumpMap: tex, bumpScale: 1.2, roughness: 0.85, side: THREE.FrontSide });
  const [backC, backCtx] = makeCanvas(512, Math.round(512 / aspect));
  paintParchment(backCtx, backC.width, backC.height, 3);
  const back = new THREE.MeshStandardMaterial({ map: canvasTexture(backC, stage.renderer), roughness: 0.9, side: THREE.BackSide });
  const leaf = new THREE.Group();
  leaf.add(new THREE.Mesh(geo, front), new THREE.Mesh(geo, back));
  leaf.rotation.set(-0.08, 0.1, 0);
  stage.scene.add(leaf);

  const lamp = new THREE.PointLight("#ffdcae", 6, 9, 1.4);
  lamp.position.set(-1.5, 1.2, 1.4);
  stage.scene.add(lamp, new THREE.AmbientLight("#9aa6c0", 0.45));

  const cam = stage.camera;
  cam.position.set(0, 0, 3.4);
  const controls = new OrbitControls(cam, stage.canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 0.6;
  controls.maxDistance = 5;
  controls.minPolarAngle = Math.PI * 0.25;
  controls.maxPolarAngle = Math.PI * 0.75;
  controls.minAzimuthAngle = -Math.PI * 0.35;
  controls.maxAzimuthAngle = Math.PI * 0.35;
  controls.screenSpacePanning = true;
  controls.addEventListener("change", () => stage.invalidate());
  const fit = stage.onResize((w, h) => {
    const half = THREE.MathUtils.degToRad(cam.fov / 2);
    const d = Math.max(H / 2 / Math.tan(half), W / 2 / (Math.tan(half) * (w / h))) * 1.12;
    cam.position.set(0, 0, d);
    controls.maxDistance = d * 1.6;
    controls.update();
  });

  // The lamp follows the pointer across the page.
  const aim = new THREE.Vector3(-1.5, 1.2, 1.4);
  const onMove = (e: PointerEvent) => {
    const r = stage.canvas.getBoundingClientRect();
    aim.set(((e.clientX - r.left) / r.width - 0.5) * W * 1.6, -((e.clientY - r.top) / r.height - 0.5) * H * 1.6, 0.9);
    stage.invalidate();
  };
  stage.canvas.addEventListener("pointermove", onMove);
  const stopFrame = stage.onFrame((dt) => {
    lamp.position.lerp(aim, 1 - Math.exp(-6 * dt));
    const moving = lamp.position.distanceTo(aim) > 0.002;
    return controls.update() || moving;
  });
  stage.invalidate();

  return {
    dispose() {
      stopFrame();
      fit();
      controls.dispose();
      stage.canvas.removeEventListener("pointermove", onMove);
    }
  };
}
