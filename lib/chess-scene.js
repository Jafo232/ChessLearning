// Three.js owns the lit pieces and their depth and hit testing. The lower canvas
// keeps the board markings crisp and doubles as the non-WebGL renderer.
import * as THREE from "./vendor/three/three.module.min.js";
import { GLTFLoader } from "./vendor/three/GLTFLoader.js";

function studioLightMap() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#635e70";
  ctx.fillRect(0, 0, 256, 128);
  for (const [x, y, w, h, color] of [
    [24, 18, 58, 60, "#fff4de"], [96, 0, 90, 18, "#ebe3ff"],
    [165, 25, 21, 71, "#f7edff"], [205, 55, 34, 50, "#211829"],
  ]) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.mapping = THREE.EquirectangularReflectionMapping;
  return map;
}

export async function createScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-420, 420, 237.5, -237.5, 1, 4000);
  camera.position.z = 1800;
  const env = studioLightMap();
  scene.environment = env;
  scene.add(new THREE.HemisphereLight(0xfff3e6, 0x574864, 1.35));
  for (const [color, intensity, x, y, z] of [
    [0xffe7c5, 2.0, -3, 5, 4], [0xd9caff, 2.2, 3, 4, -2], [0xfff5e2, .55, 1, 2, 4],
  ]) {
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(x, y, z);
    scene.add(light);
  }
  const textureLoader = new THREE.TextureLoader();
  const sprites = new Map(), templates = new Map(), pool = new Map();
  const resources = new Set([env]);
  const ray = new THREE.Raycaster();
  let width = 0, height = 0;
  function dispose() {
    resources.forEach(resource => resource.dispose());
    renderer.dispose();
    renderer.forceContextLoss();
  }
  try {
    const [{ scene: models }, textures] = await Promise.all([
      new GLTFLoader().loadAsync("/models/staunton.glb"),
      Promise.all([..."wb"].flatMap(side => [..."pnbrqk"].map(async type => {
        const key = side + type;
        const map = await textureLoader.loadAsync("/pieces/flat/" + key + ".webp");
        map.colorSpace = THREE.SRGBColorSpace;
        return [key, map];
      }))),
    ]);
    for (const [key, map] of textures) {
      sprites.set(key, map);
      resources.add(map);
    }
    for (const model of models.children) {
      templates.set(model.name, model);
      model.traverse(node => {
        if (node.isMesh) {
          resources.add(node.geometry);
          resources.add(node.material);
        }
      });
    }
    for (const type of "pnbrqk") {
      if (!templates.has(type)) throw Error("Missing model " + type);
    }
  } catch (err) {
    dispose();
    throw err;
  }
  function instance(key, flat) {
    let object;
    const materials = [];
    if (flat) {
      const material = new THREE.SpriteMaterial({ map: sprites.get(key), transparent: true, depthTest: false });
      object = new THREE.Sprite(material);
      object.scale.set(58, 58, 1);
      materials.push(material);
    } else {
      object = templates.get(key[1]).clone(true);
      object.rotation.x = Math.asin(38 / 60);
      object.scale.setScalar(66);
      object.traverse(node => {
        if (!node.isMesh) return;
        const accent = /piping/.test(node.material.name);
        const eye = /detail/.test(node.material.name);
        const color = key[0] === "w" ? (eye ? 0x725841 : accent ? 0xbe9b6c : 0xe7d4b6) :
          (eye ? 0x1b1422 : accent ? 0x5c4860 : 0x352c3b);
        const material = new THREE.MeshStandardMaterial({
          color, metalness: accent ? .54 : .28, roughness: accent ? .23 : .28,
          envMapIntensity: key[0] === "b" ? .85 : .53,
        });
        node.material = material;
        materials.push(material);
      });
    }
    materials.forEach(material => resources.add(material));
    scene.add(object);
    return { object, materials };
  }
  function draw(w, h, vw, vh, flat, pieces, angle) {
    if (width !== w || height !== h) {
      width = w;
      height = h;
      renderer.setSize(w, h, false);
    }
    const scale = Math.min(w / vw, h / vh);
    camera.left = -w / (2 * scale);
    camera.right = -camera.left;
    camera.top = h / (2 * scale);
    camera.bottom = -camera.top;
    camera.updateProjectionMatrix();
    for (const items of pool.values()) for (const {object} of items) object.visible = false;
    const used = new Map();
    for (const [order, {sq, piece, center, opacity}] of pieces.entries()) {
      const key = piece.color + piece.type;
      const group = (flat ? "flat" : "solid") + key;
      if (!pool.has(group)) pool.set(group, []);
      const items = pool.get(group), index = used.get(group) || 0;
      used.set(group, index + 1);
      if (!items[index]) items.push(instance(key, flat));
      const {object, materials} = items[index];
      const pitch = angle.tilt * Math.PI / 180;
      if (!flat) {
        object.rotation.x = pitch;
        object.rotation.y = (angle.rotation + 20) * Math.PI / 180;
      }
      object.visible = opacity > .01;
      object.position.set(center.x - vw / 2, vh / 2 - center.y, flat ? 0 : (center.y - vh / 2) / Math.tan(pitch));
      object.userData.square = sq;
      object.renderOrder = flat ? order : 0;
      for (const mat of materials) {
        mat.opacity = opacity;
        mat.transparent = flat || opacity < .999;
      }
    }
    renderer.render(scene, camera);
  }
  function hit(x, y, skip) {
    ray.setFromCamera(new THREE.Vector2(x * 2 - 1, 1 - y * 2), camera);
    const visible = [...pool.values()].flat().map(x => x.object).filter(x => x.visible && x.userData.square !== skip);
    let object = ray.intersectObjects(visible, true)[0]?.object;
    while (object && !object.userData.square) object = object.parent;
    return object?.userData.square;
  }
  return { draw, hit, dispose };
}
