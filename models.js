// Bộ mô hình 3D đầy đủ cho Văn phòng AI — Three.js low-poly, flat shading.
// Phong cách đã duyệt (23/11): nền sáng, xanh dương/teal, facet phẳng.
// Vật liệu dùng CHUNG theo màu (material cache — gợi ý từ nháp Gemini) để tiết kiệm.
import * as THREE from "three";

const _mats = new Map();
export function mat(color, opts = {}) {
  const key = color + "|" + (opts.roughness ?? 0.85);
  if (!_mats.has(key)) _mats.set(key, new THREE.MeshStandardMaterial({ color, roughness: opts.roughness ?? 0.85, metalness: 0.0, flatShading: true }));
  return _mats.get(key);
}
export function box(w, h, d, color, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
  return m;
}
export function sph(r, color, x = 0, y = 0, z = 0, w = 10, h = 8) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, w, h), mat(color));
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
  return m;
}
export function cyl(rt, rb, h, color, x = 0, y = 0, z = 0, seg = 10) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(color));
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
  return m;
}
export function cone(r, h, color, x = 0, y = 0, z = 0, seg = 9) {
  const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), mat(color));
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
  return m;
}
export function prism(w, h, d, color) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false });
  geo.translate(0, 0, -d / 2);
  const m = new THREE.Mesh(geo, mat(color));
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
export function countStats(gr) {
  let meshes = 0, tris = 0;
  gr.traverse(o => {
    if (o.isMesh) { meshes++; const g = o.geometry; tris += (g.index ? g.index.count : g.attributes.position.count) / 3; }
  });
  return { meshes, triangles: Math.round(tris) };
}

export const PAL = {
  skin1: 0xf2b183, skin2: 0xe8a06c, skin3: 0xf7c79b,
  hairBlack: 0x23272e, hairBrown: 0x5a3a22, hairDarkBrown: 0x3a2a1c, hairGray: 0xb9c0c7,
  navy: 0x2b3a55, teal: 0x14919b, tealDark: 0x0f7c8c, tealLight: 0x7fd1cc,
  cream: 0xf7e8c9, terra: 0xe2703a, terraDark: 0xc85a2e, glass: 0xbfe6ef,
  wood: 0xb5763a, gold: 0xf2b63d, white: 0xffffff, dark: 0x2b2b30,
  green: 0x58b368, greenDark: 0x3f9d63, greenTeal: 0x37a08b, grass: 0x9ed08a,
  trunk: 0x9a6a44, trunkDark: 0x7d5433, rock: 0x9fb6c3,
  pink: 0xf7a8b8, red: 0xe14b4b, orange: 0xf59e4c, orangeDark: 0xef8f35, orangeLight: 0xffd9a8
};

/* ============ NGƯỜI — hàm dùng chung, phân biệt bằng config ============ */
// cfg: { skin, hair, hairStyle: short|long|bun|cap, shirt, pants, shoe, female, accessory }
// accessory: tablet|tie|glasses|headset|box|phone|gimbal|neckphones|notebook|flashlight|none
export function buildPerson(cfg) {
  const g = new THREE.Group();
  const shoe = cfg.shoe ?? PAL.tealDark;
  for (const sx of [-1, 1]) {
    g.add(box(0.30, 0.95, 0.34, cfg.pants, sx * 0.21, 0.62, 0));
    g.add(box(0.32, 0.16, 0.56, shoe, sx * 0.21, 0.13, 0.09));
    g.add(box(0.34, 0.06, 0.58, 0xdfe9ee, sx * 0.21, 0.03, 0.09));
  }
  g.add(box(0.98, 1.05, 0.52, cfg.shirt, 0, 1.62, 0));
  g.add(box(0.30, 0.10, 0.06, cfg.shirt, 0, 2.16, 0.27));
  /* tay: mặc định buông xuôi; có phụ kiện cầm tay thì gập ra trước */
  const holding = ["tablet", "box", "phone", "gimbal", "notebook", "flashlight"].includes(cfg.accessory);
  for (const sx of [-1, 1]) {
    if (holding) {
      const ua = box(0.24, 0.62, 0.26, cfg.shirt, sx * 0.62, 1.86, 0.02);
      ua.rotation.z = sx * -0.5; ua.rotation.x = -0.7; g.add(ua);
      const fa = box(0.19, 0.55, 0.21, cfg.skin, sx * 0.52, 1.52, 0.38);
      fa.rotation.x = -1.15; fa.rotation.z = sx * 0.25; g.add(fa);
      g.add(sph(0.11, cfg.skin, sx * 0.44, 1.47, 0.62, 8, 6));
    } else {
      const arm = box(0.24, 1.0, 0.26, cfg.shirt, sx * 0.63, 1.6, 0);
      arm.rotation.z = sx * 0.07; g.add(arm);
      g.add(sph(0.11, cfg.skin, sx * 0.66, 1.06, 0, 8, 6));
    }
  }
  /* phụ kiện */
  const acc = cfg.accessory;
  if (acc === "tablet" || acc === "notebook") {
    const t = new THREE.Group();
    const bodyC = acc === "tablet" ? 0x37424e : PAL.teal;
    const scrC = acc === "tablet" ? 0x2fb3c4 : 0xfdfdf5;
    t.add(box(0.92, 0.62, 0.05, bodyC, 0, 0, 0));
    t.add(box(0.82, 0.52, 0.02, scrC, 0, 0, 0.03));
    t.position.set(0, 1.52, 0.62); t.rotation.x = -0.18; g.add(t);
  }
  if (acc === "box") g.add(box(0.72, 0.52, 0.52, 0xd9a05f, 0, 1.5, 0.6));
  if (acc === "phone") g.add(box(0.2, 0.36, 0.04, 0x37424e, 0.3, 1.56, 0.6));
  if (acc === "gimbal") {
    const stick = cyl(0.03, 0.03, 0.5, PAL.dark, 0.28, 1.42, 0.58, 6); stick.rotation.x = 0.5; g.add(stick);
    g.add(box(0.3, 0.2, 0.08, PAL.dark, 0.28, 1.72, 0.72));
    g.add(box(0.2, 0.12, 0.02, 0x2fb3c4, 0.28, 1.72, 0.77));
  }
  if (acc === "tie") g.add(box(0.13, 0.5, 0.03, PAL.tealDark, 0, 1.78, 0.28));
  if (acc === "flashlight") {
    const fl = cyl(0.05, 0.06, 0.3, PAL.dark, 0.46, 1.44, 0.6, 7); fl.rotation.x = 1.2; g.add(fl);
    g.add(cyl(0.07, 0.07, 0.05, PAL.gold, 0.46, 1.56, 0.68, 7));
  }
  /* đầu */
  g.add(cyl(0.11, 0.13, 0.16, cfg.skin, 0, 2.2, 0));
  g.add(sph(0.38, cfg.skin, 0, 2.58, 0, 14, 11));
  for (const sx of [-1, 1]) g.add(sph(0.048, PAL.dark, sx * 0.14, 2.6, 0.352, 6, 5));
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.016, 6, 12, Math.PI), mat(0x8a4b2a));
  smile.position.set(0, 2.44, 0.35); smile.rotation.z = Math.PI; g.add(smile);
  /* tóc theo kiểu */
  const hairC = cfg.hair;
  if (cfg.hairStyle === "cap") {
    const capTop = cyl(0.40, 0.42, 0.16, cfg.shirt, 0, 2.86, 0, 12); g.add(capTop);
    g.add(box(0.5, 0.05, 0.3, cfg.shirt, 0, 2.8, 0.42));
    g.add(box(0.7, 0.3, 0.66, hairC, 0, 2.62, -0.06));
  } else {
    const hair = sph(0.405, hairC, 0, 2.68, -0.06, 12, 9);
    hair.scale.set(1, 0.8, 1); g.add(hair);
    const fringe = box(0.55, 0.13, 0.16, hairC, 0.02, 2.83, 0.27);
    fringe.rotation.x = 0.3; g.add(fringe);
    if (cfg.hairStyle === "long") g.add(box(0.62, 0.85, 0.18, hairC, 0, 2.25, -0.3));
    if (cfg.hairStyle === "bun") g.add(sph(0.16, hairC, 0, 3.02, -0.1, 8, 7));
  }
  if (acc === "glasses") {
    for (const sx of [-1, 1]) {
      const lens = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.016, 6, 14), mat(PAL.dark));
      lens.position.set(sx * 0.14, 2.6, 0.37); g.add(lens);
    }
    g.add(box(0.12, 0.03, 0.02, PAL.dark, 0, 2.62, 0.37));
  }
  if (acc === "headset") {
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.03, 6, 14, Math.PI), mat(PAL.dark));
    band.position.set(0, 2.62, 0); band.rotation.z = 0; g.add(band);
    g.add(box(0.1, 0.16, 0.06, PAL.dark, 0.4, 2.52, 0.05));
    const mic = cyl(0.015, 0.015, 0.3, PAL.dark, 0.32, 2.38, 0.2, 5); mic.rotation.z = 0.9; mic.rotation.x = -0.5; g.add(mic);
  }
  if (acc === "neckphones") {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.045, 6, 12, Math.PI), mat(PAL.dark));
    ring.position.set(0, 2.14, 0.12); ring.rotation.x = 0.5; ring.rotation.z = Math.PI; g.add(ring);
  }
  if (cfg.pocket !== false && !holding) g.add(box(0.26, 0.13, 0.03, PAL.teal, 0.24, 1.86, 0.28));
  if (cfg.pocket !== false && holding && acc !== "box") g.add(box(0.26, 0.13, 0.03, PAL.teal, 0.24, 1.86, 0.28));
  return g;
}

/* 10 vai theo roles.js của app */
export const ROLES = [
  { name: "Anh Phong", title: "CEO — điều phối", cfg: { skin: PAL.skin1, hair: PAL.hairBlack, hairStyle: "short", shirt: 0x7fb2e0, pants: PAL.navy, accessory: "tie" } },
  { name: "Thu Trang", title: "Kế toán", cfg: { skin: PAL.skin3, hair: PAL.hairDarkBrown, hairStyle: "bun", shirt: 0xf2c14e, pants: 0x4a4a55, accessory: "glasses", female: true } },
  { name: "Minh Thư", title: "Inbox / CSKH", cfg: { skin: PAL.skin3, hair: PAL.hairBlack, hairStyle: "long", shirt: 0xef8fb8, pants: 0x3a4a6b, accessory: "headset", female: true } },
  { name: "Khánh Vy", title: "CSKH ca 2", cfg: { skin: PAL.skin1, hair: PAL.hairBrown, hairStyle: "long", shirt: 0x9fd08a, pants: 0x3a4a6b, accessory: "headset", female: true } },
  { name: "Lan Anh", title: "Vận hành gian hàng", cfg: { skin: PAL.skin2, hair: PAL.hairBlack, hairStyle: "bun", shirt: 0xf59e4c, pants: PAL.navy, accessory: "box", female: true } },
  { name: "Mai Anh", title: "Theo dõi đối thủ & giá", cfg: { skin: PAL.skin3, hair: PAL.hairBrown, hairStyle: "short", shirt: 0xb39ddb, pants: 0x37424e, accessory: "phone", female: true } },
  { name: "Ngọc Hân", title: "Nội dung / Media", cfg: { skin: PAL.skin1, hair: PAL.hairBlack, hairStyle: "long", shirt: 0x4fc3c9, pants: 0x2b3a55, accessory: "gimbal", female: true } },
  { name: "Huy Minh", title: "Dữ liệu / Kỹ thuật", cfg: { skin: PAL.skin2, hair: PAL.hairBlack, hairStyle: "short", shirt: 0x5b8dd9, pants: 0x37424e, accessory: "neckphones" } },
  { name: "Bé Na", title: "Trợ lý lịch họp", cfg: { skin: PAL.skin3, hair: PAL.hairDarkBrown, hairStyle: "bun", shirt: 0xfdfdf5, pants: 0xef8fb8, accessory: "notebook", female: true } },
  { name: "Chú Tư", title: "An ninh / trực cổng", cfg: { skin: PAL.skin2, hair: PAL.hairGray, hairStyle: "cap", shirt: 0x2e5f8a, pants: 0x22344d, accessory: "flashlight", shoe: 0x37424e } },
  { name: "Mẫu chuẩn", title: "Nhân viên (mẫu duyệt)", cfg: { skin: PAL.skin1, hair: PAL.hairBlack, hairStyle: "short", shirt: 0xa9cfec, pants: PAL.navy, accessory: "tablet" } }
];

/* ============ NHÀ / TÒA NHÀ ============ */
export function buildBuilding() {
  const g = new THREE.Group();
  g.add(cyl(3.1, 3.3, 0.22, PAL.grass, 0, 0.11, 0, 26));
  g.add(box(3.4, 1.7, 2.6, PAL.cream, 0, 1.06, 0));
  g.add(box(3.7, 0.18, 2.9, 0xfdf3d8, 0, 1.98, 0));
  g.add(box(3.4, 1.6, 2.6, PAL.cream, 0, 2.87, 0));
  const roof = prism(4.1, 1.25, 3.3, PAL.terra); roof.position.set(0, 3.67, 0); g.add(roof);
  g.add(box(0.34, 0.22, 3.36, PAL.terraDark, 0, 4.94, 0));
  g.add(box(0.86, 1.3, 0.1, PAL.tealDark, 0, 0.86, 1.31));
  g.add(sph(0.05, PAL.gold, 0.3, 0.86, 1.38, 6, 5));
  const awn = prism(1.5, 0.42, 0.8, PAL.terra); awn.position.set(0, 1.62, 1.62); awn.rotation.x = 0.25; g.add(awn);
  for (const sx of [-1, 1]) g.add(cyl(0.06, 0.06, 0.95, PAL.wood, sx * 0.62, 1.05, 1.86, 7));
  const win = (x, y, z) => {
    const w = new THREE.Group();
    w.add(box(0.62, 0.78, 0.08, PAL.teal, 0, 0, 0));
    w.add(box(0.48, 0.64, 0.1, PAL.glass, 0, 0, 0.01));
    w.add(box(0.05, 0.64, 0.11, PAL.teal, 0, 0, 0.01));
    w.add(box(0.48, 0.05, 0.11, PAL.teal, 0, 0, 0.01));
    w.position.set(x, y, z);
    return w;
  };
  g.add(win(-1.05, 1.15, 1.31)); g.add(win(1.05, 1.15, 1.31));
  g.add(win(-1.1, 2.95, 1.31)); g.add(win(0, 2.95, 1.31)); g.add(win(1.1, 2.95, 1.31));
  g.add(box(3.5, 0.1, 0.5, 0xfdf3d8, 0, 2.02, 1.5));
  g.add(box(3.5, 0.09, 0.09, PAL.teal, 0, 2.5, 1.72));
  for (let i = 0; i < 7; i++) g.add(box(0.07, 0.42, 0.07, PAL.teal, -1.5 + i * 0.5, 2.28, 1.72));
  for (let i = 0; i < 3; i++) g.add(cyl(0.29 + i * 0.02, 0.33 + i * 0.02, 0.07, 0xd8dee2, (i - 1) * 0.28, 0.26, 2.2 + i * 0.42, 9));
  g.add(sph(0.42, PAL.greenTeal, -2.2, 0.55, 1.2, 9, 7));
  g.add(sph(0.34, PAL.green, 2.25, 0.5, 1.1, 9, 7));
  g.add(sph(0.28, PAL.greenDark, 2.0, 0.42, 1.85, 9, 7));
  return g;
}

export function buildTower() {
  const g = new THREE.Group();
  g.add(cyl(2.9, 3.1, 0.22, 0xd8dee2, 0, 0.11, 0, 26));
  g.add(box(3.2, 7.6, 2.6, 0xeef4f7, 0, 3.91, 0));
  /* mặt kính teal 4 tầng */
  for (let f = 0; f < 4; f++) {
    g.add(box(2.7, 1.35, 0.06, 0x9fd8e8, 0, 1.35 + f * 1.85, 1.32));
    g.add(box(2.7, 0.1, 0.07, PAL.teal, 0, 2.1 + f * 1.85, 1.32));
  }
  for (const sx of [-1, 1]) g.add(box(0.14, 7.6, 2.66, PAL.teal, sx * 1.62, 3.91, 0));
  g.add(box(3.6, 0.35, 3.0, PAL.teal, 0, 7.9, 0));
  g.add(box(1.1, 1.5, 0.1, PAL.tealDark, 0, 0.86, 1.31));
  const awn = box(2.2, 0.1, 0.9, PAL.teal, 0, 1.85, 1.7); g.add(awn);
  g.add(box(0.5, 0.7, 0.06, PAL.gold, 0, 7.35, 1.34));
  return g;
}

export function buildCafe() {
  const g = new THREE.Group();
  g.add(cyl(3.0, 3.2, 0.22, PAL.grass, 0, 0.11, 0, 26));
  g.add(box(3.6, 1.9, 2.7, 0xfdf6e3, 0, 1.17, 0));
  const roof = prism(4.3, 1.1, 3.4, PAL.terra); roof.position.set(0, 2.12, 0); g.add(roof);
  g.add(box(0.3, 0.2, 3.46, PAL.terraDark, 0, 3.28, 0));
  /* mặt tiền kính rộng + cửa */
  g.add(box(1.5, 1.3, 0.08, PAL.glass, -0.85, 1.15, 1.36));
  g.add(box(1.56, 0.1, 0.1, PAL.teal, -0.85, 1.85, 1.36));
  g.add(box(0.8, 1.5, 0.09, PAL.tealDark, 0.95, 1.0, 1.36));
  /* hiên + bàn ghế */
  g.add(box(3.8, 0.12, 1.3, PAL.wood, 0, 0.28, 2.2));
  for (const sx of [-1.3, 1.3]) {
    g.add(cyl(0.3, 0.3, 0.05, PAL.white, sx, 0.75, 2.2, 10));
    g.add(cyl(0.04, 0.04, 0.42, PAL.dark, sx, 0.52, 2.2, 6));
    g.add(box(0.4, 0.45, 0.06, PAL.teal, sx - 0.45, 0.6, 2.2));
    g.add(box(0.4, 0.45, 0.06, PAL.teal, sx + 0.45, 0.6, 2.2));
  }
  const umb = cone(0.85, 0.4, PAL.teal, 0, 2.0, 2.2, 10); g.add(umb);
  g.add(cyl(0.035, 0.035, 1.6, PAL.wood, 0, 1.15, 2.2, 6));
  g.add(sph(0.3, PAL.green, -2.3, 0.45, 1.4, 9, 7));
  g.add(sph(0.26, PAL.greenTeal, 2.35, 0.42, 1.2, 9, 7));
  return g;
}

/* ============ CÂY ============ */
export function buildTree() {
  const g = new THREE.Group();
  g.add(cyl(1.7, 1.9, 0.2, PAL.grass, 0, 0.1, 0, 22));
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3), mat(PAL.rock));
  rock.position.set(0.95, 0.3, 0.5); rock.castShadow = true; g.add(rock);
  const rock2 = rock.clone(); rock2.scale.setScalar(0.6); rock2.position.set(-1.0, 0.24, 0.75); g.add(rock2);
  const t1 = cyl(0.22, 0.32, 1.15, PAL.trunk, 0, 0.68, 0, 9); t1.rotation.z = 0.08; g.add(t1);
  const t2 = cyl(0.16, 0.23, 1.15, PAL.trunk, 0.10, 1.62, 0, 9); t2.rotation.z = -0.13; g.add(t2);
  const t3 = cyl(0.11, 0.17, 1.0, PAL.trunkDark, 0.03, 2.45, 0, 9); t3.rotation.z = 0.08; g.add(t3);
  const b1 = cyl(0.06, 0.10, 0.9, PAL.trunkDark, -0.5, 2.7, 0.1, 7); b1.rotation.z = 0.9; g.add(b1);
  const b2 = cyl(0.06, 0.10, 0.9, PAL.trunkDark, 0.52, 2.72, -0.08, 7); b2.rotation.z = -0.9; g.add(b2);
  const blobs = [
    [0, 3.45, 0, 0.85, PAL.green], [-0.7, 3.2, 0.25, 0.66, PAL.greenTeal], [0.72, 3.25, -0.2, 0.68, PAL.green],
    [-0.4, 3.7, -0.35, 0.6, PAL.greenDark], [0.45, 3.75, 0.3, 0.62, PAL.greenTeal], [0.05, 3.9, -0.05, 0.58, PAL.green],
    [-0.75, 3.45, -0.4, 0.55, PAL.green], [0.8, 3.55, 0.35, 0.55, PAL.greenDark], [0, 3.2, 0.55, 0.6, PAL.greenTeal],
    [-0.2, 3.3, -0.6, 0.58, PAL.green]
  ];
  for (const [x, y, z, r, c] of blobs) {
    const s = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), mat(c));
    s.position.set(x, y, z); s.castShadow = true; s.receiveShadow = true; g.add(s);
  }
  const cc = new THREE.Vector3(0, 3.45, 0);
  const flowers = [[0, 2.95, 1.11], [1.27, 3.60, 0.56], [-1.27, 3.00, 0.45], [0.89, 4.05, 0.60], [1.24, 3.11, -0.35], [0.28, 3.39, 1.14]];
  for (const p of flowers) {
    const v = new THREE.Vector3(p[0], p[1], p[2]);
    const out = v.clone().sub(cc).normalize();
    const f = sph(0.16, PAL.pink, v.x, v.y, v.z, 7, 6); f.scale.set(1, 0.55, 1); g.add(f);
    const cen = v.clone().addScaledVector(out, 0.09);
    g.add(sph(0.05, PAL.gold, cen.x, cen.y, cen.z, 6, 5));
  }
  return g;
}

export function buildPhoenixTree() {
  const g = new THREE.Group();
  g.add(cyl(1.8, 2.0, 0.2, PAL.grass, 0, 0.1, 0, 22));
  const t1 = cyl(0.2, 0.3, 1.5, PAL.trunk, 0, 0.9, 0, 9); g.add(t1);
  const t2 = cyl(0.13, 0.19, 1.3, PAL.trunkDark, 0.08, 2.2, 0, 8); t2.rotation.z = -0.1; g.add(t2);
  for (const a of [-0.8, -0.3, 0.3, 0.8]) {
    const b = cyl(0.05, 0.09, 1.2, PAL.trunkDark, Math.sin(a) * 0.5, 3.0, Math.cos(a) * 0.2 - 0.1, 6);
    b.rotation.z = a; g.add(b);
  }
  /* tán xòe rộng, dẹt */
  const canopy = [
    [0, 3.75, 0, 1.5, PAL.green], [-1.3, 3.6, 0.3, 1.0, PAL.greenTeal], [1.3, 3.62, -0.2, 1.02, PAL.green],
    [-0.6, 3.9, -0.6, 0.95, PAL.greenDark], [0.7, 3.92, 0.55, 0.95, PAL.green], [0, 4.0, 0.1, 1.0, PAL.greenTeal]
  ];
  for (const [x, y, z, r, c] of canopy) {
    const s = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), mat(c));
    s.position.set(x, y, z); s.scale.set(1, 0.55, 1); s.castShadow = true; s.receiveShadow = true; g.add(s);
  }
  /* hoa phượng đỏ rải trên mặt tán */
  const fl = [[-1.5, 3.95, 0.5], [-0.5, 4.15, 0.8], [0.6, 4.2, 0.3], [1.5, 3.95, 0.4], [0, 3.8, 1.2], [-1.0, 3.8, -0.7], [1.1, 3.85, -0.8], [0.2, 4.35, -0.3]];
  for (const [x, y, z] of fl) { const f = sph(0.14, PAL.red, x, y, z, 7, 6); f.scale.set(1, 0.6, 1); g.add(f); }
  return g;
}

export function buildCoconut() {
  const g = new THREE.Group();
  g.add(cyl(1.5, 1.7, 0.2, PAL.grass, 0, 0.1, 0, 20));
  /* thân cao cong: 4 đoạn */
  let x = 0, z = 0;
  const pts = [[0, 0.85, 0, 0.26], [0.1, 2.2, 0, 0.21], [0.3, 3.55, 0, 0.17], [0.58, 4.8, 0, 0.14]];
  for (const [px, py, pz, r] of pts) g.add(cyl(r * 0.85, r, 1.5, PAL.trunk, px, py, pz, 8));
  for (let i = 0; i < 4; i++) g.add(cyl(0.155 - i * 0.012, 0.165 - i * 0.012, 0.1, PAL.trunkDark, pts[i][0] + 0.02, pts[i][1] - 0.4, 0, 8));
  /* lá xòe: 9 lá dài cong */
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const leaf = box(0.26, 0.05, 1.9, i % 2 ? PAL.green : PAL.greenTeal, 0.62 + Math.sin(a) * 0.85, 5.55 - Math.abs(Math.sin(a * 2)) * 0.1, Math.cos(a) * 0.85);
    leaf.rotation.y = a; leaf.rotation.x = 0.5; leaf.rotation.z = Math.sin(a) * 0.35;
    g.add(leaf);
    const tip = box(0.16, 0.04, 0.8, i % 2 ? PAL.greenTeal : PAL.greenDark, 0.62 + Math.sin(a) * 1.6, 5.15, Math.cos(a) * 1.6);
    tip.rotation.y = a; tip.rotation.x = 1.0; g.add(tip);
  }
  /* chùm dừa */
  for (const [dx, dz] of [[0.35, 0.2], [0.75, -0.15], [0.55, 0.35]]) g.add(sph(0.19, 0x7fae4c, dx, 5.25, dz, 8, 7));
  return g;
}

export function buildBanyan() {
  const g = new THREE.Group();
  g.add(cyl(1.8, 2.0, 0.2, PAL.grass, 0, 0.1, 0, 22));
  const t1 = cyl(0.3, 0.42, 1.2, PAL.trunk, 0, 0.7, 0, 10); g.add(t1);
  const t2 = cyl(0.2, 0.3, 1.0, PAL.trunkDark, 0.05, 1.75, 0, 9); t2.rotation.z = -0.08; g.add(t2);
  /* tán 3 tầng đĩa */
  const tiers = [[2.6, 1.55, PAL.green], [3.15, 1.25, PAL.greenTeal], [3.65, 0.95, PAL.green]];
  for (const [y, r, c] of tiers) {
    const s = cyl(r, r * 1.06, 0.5, c, 0, y, 0, 14);
    g.add(s);
    const rim = new THREE.Mesh(new THREE.IcosahedronGeometry(r * 0.32, 1), mat(c));
    rim.position.set(r * 0.75, y - 0.05, 0.3); rim.scale.set(1, 0.5, 1); rim.castShadow = true; g.add(rim);
    const rim2 = rim.clone(); rim2.position.set(-r * 0.78, y - 0.05, -0.25); g.add(rim2);
  }
  return g;
}

/* ============ CON VẬT ============ */
export function buildCat() {
  const g = new THREE.Group();
  const body = sph(0.62, PAL.orange, 0, 0.62, -0.08, 14, 11); body.scale.set(1, 1.05, 0.95); g.add(body);
  for (const sx of [-1, 1]) {
    const h = sph(0.30, PAL.orangeDark, sx * 0.52, 0.42, -0.12, 10, 8); h.scale.set(0.75, 1.1, 1.1); g.add(h);
    g.add(box(0.17, 0.52, 0.19, PAL.orange, sx * 0.24, 0.30, 0.42));
    const paw = sph(0.15, PAL.orangeLight, sx * 0.24, 0.09, 0.55, 8, 6); paw.scale.set(1, 0.6, 1.25); g.add(paw);
  }
  const chest = sph(0.34, PAL.orangeLight, 0, 0.62, 0.36, 10, 8); chest.scale.set(0.9, 1.15, 0.6); g.add(chest);
  const tail = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.11, 8, 14, Math.PI * 0.95), mat(PAL.orangeDark));
  tail.position.set(0.62, 0.38, -0.3); tail.rotation.set(0.3, 0.5, -0.5); tail.castShadow = true; g.add(tail);
  g.add(sph(0.56, PAL.orange, 0, 1.52, 0.05, 14, 11));
  const muzzle = sph(0.26, PAL.orangeLight, 0, 1.38, 0.42, 10, 8); muzzle.scale.set(1.25, 0.75, 0.8); g.add(muzzle);
  for (const sx of [-1, 1]) {
    const ear = cone(0.20, 0.36, PAL.orange, sx * 0.34, 2.02, 0.02, 7); ear.rotation.z = sx * -0.15; g.add(ear);
    const inner = cone(0.11, 0.2, PAL.pink, sx * 0.335, 2.0, 0.1, 6); inner.rotation.z = sx * -0.15; g.add(inner);
    const eye = sph(0.075, PAL.dark, sx * 0.21, 1.58, 0.55, 8, 6); eye.scale.set(1, 1.25, 0.5); g.add(eye);
  }
  const nose = cone(0.07, 0.06, 0xf2789f, 0, 1.46, 0.63, 7); nose.rotation.x = Math.PI / 2 + 0.4; g.add(nose);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.40, 0.055, 8, 18), mat(PAL.teal));
  collar.position.set(0, 1.13, 0.08); collar.rotation.x = Math.PI / 2 - 0.25; collar.castShadow = true; g.add(collar);
  g.add(sph(0.085, PAL.gold, 0, 1.0, 0.46, 8, 7));
  return g;
}

export function buildDog() {
  const g = new THREE.Group();
  const fur = 0xf2c14e, furDark = 0xd9a83f, creamC = 0xfdf3d8;
  const body = sph(0.5, fur, 0, 0.78, 0, 12, 9); body.scale.set(0.82, 0.78, 1.25); g.add(body);
  for (const sx of [-1, 1]) for (const zz of [0.32, -0.35]) {
    g.add(cyl(0.075, 0.085, 0.5, fur, sx * 0.24, 0.3, zz, 7));
    const paw = sph(0.11, creamC, sx * 0.24, 0.07, zz + 0.05, 8, 6); paw.scale.set(1, 0.55, 1.3); g.add(paw);
  }
  const tail = cyl(0.05, 0.075, 0.55, furDark, 0, 1.05, -0.62, 7); tail.rotation.x = -0.8; g.add(tail);
  g.add(sph(0.4, fur, 0, 1.28, 0.52, 12, 10));
  const muzzle = sph(0.2, creamC, 0, 1.16, 0.85, 9, 7); muzzle.scale.set(1.1, 0.75, 1.1); g.add(muzzle);
  g.add(sph(0.075, PAL.dark, 0, 1.26, 1.02, 7, 6));
  for (const sx of [-1, 1]) {
    const ear = sph(0.16, furDark, sx * 0.36, 1.3, 0.45, 8, 7); ear.scale.set(0.55, 1.15, 0.8); ear.rotation.z = sx * 0.25; g.add(ear);
    g.add(sph(0.06, PAL.dark, sx * 0.16, 1.36, 0.86, 7, 6));
  }
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.045, 7, 14), mat(0xe14b4b));
  collar.position.set(0, 1.08, 0.5); collar.rotation.x = Math.PI / 2 - 0.35; collar.castShadow = true; g.add(collar);
  return g;
}

export function buildBird() {
  const g = new THREE.Group();
  /* cành đậu */
  const branch = cyl(0.035, 0.045, 1.5, PAL.trunkDark, 0, 0.75, 0, 7); branch.rotation.z = Math.PI / 2 - 0.12; g.add(branch);
  g.add(cyl(0.07, 0.1, 0.75, PAL.trunk, -0.68, 0.37, 0, 7));
  const leaf = sph(0.16, PAL.green, 0.55, 0.95, 0.05, 7, 6); leaf.scale.set(1.3, 0.4, 0.7); g.add(leaf);
  /* chim */
  const b = new THREE.Group();
  const body = sph(0.16, PAL.teal, 0, 0, 0, 10, 8); body.scale.set(0.9, 1, 1.25); b.add(body);
  b.add(sph(0.115, 0x2fb3c4, 0, 0.15, 0.08, 10, 8));
  const belly = sph(0.11, 0xfdf3d8, 0, -0.05, 0.07, 8, 7); belly.scale.set(0.8, 0.9, 0.9); b.add(belly);
  const beak = cone(0.045, 0.12, PAL.gold, 0, 0.15, 0.24, 6); beak.rotation.x = Math.PI / 2; b.add(beak);
  for (const sx of [-1, 1]) {
    b.add(sph(0.028, PAL.dark, sx * 0.055, 0.19, 0.16, 6, 5));
    const wing = sph(0.1, PAL.tealDark, sx * 0.14, 0.0, -0.02, 7, 6); wing.scale.set(0.4, 0.8, 1.2); b.add(wing);
    b.add(cyl(0.012, 0.012, 0.12, PAL.gold, sx * 0.05, -0.19, 0.02, 5));
  }
  const tailF = box(0.09, 0.02, 0.22, PAL.tealDark, 0, 0.03, -0.24); tailF.rotation.x = -0.5; b.add(tailF);
  b.position.set(0.05, 0.98, 0);
  g.add(b);
  return g;
}
