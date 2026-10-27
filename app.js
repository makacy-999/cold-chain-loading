/* ============================================================
   盛世华人 · 装载计算可视化
   Data model + 3D engine + UI
   ============================================================ */

/* ---------------- 1. 数据模型 ---------------- */

const PRODUCT = {
  MCV: { key:'mcv', name:'MCV（流脑）', short:'MCV', pack:'1200 支裸瓶 / 箱', dims:[427,270,279], vial:1200, hex:0x8b8cff, css:'#8B8CFF' },
  PCV: { key:'pcv', name:'PCV（肺炎）', short:'PCV', pack:'200 支 / 箱',     dims:[540,290,290], vial:200,  hex:0x2ed9c8, css:'#2ED9C8' }
};

/* 内腔统一按 [长 x, 高 y, 宽 z] 存储，与三维坐标轴一致；
   对外展示时再还原为文档口径「长 × 宽 × 高」。 */
const CONT = {
  huaren: { key:'huaren', name:'华人托盘箱', inner:[990,1180,790],    outer:[1200,1600,1000], tag:'温控箱' },
  tp:     { key:'tp',     name:'TP1750L',    inner:[1400,1250,1020],  outer:[1530,1570,1120], tag:'温控箱' },
  ct:     { key:'ct',     name:'40 尺高柜',  inner:[10599,2500,2218], outer:[12192,2896,2438],tag:'集装箱' }
};

const dimText = arr => `${arr[0]} × ${arr[2]} × ${arr[1]}`;

/* ------------------------------------------------------------------
   装载排布 1:1 复刻《产品装载计算图示》原图
   坐标系：x = 容器长向，y = 高向，z = 宽向；单位 mm，原点在内腔一角。
   groups 每个元素是一段规则堆码：
     n = [长向件数, 高向件数, 宽向件数]
     b = [dx, dy, dz]           单件三维（dy 恒为上表面的高度边，全部平放不立放）
     o = [ox, oy, oz]           本组起点相对内腔原点的偏移
   同一场景内可有多组不同朝向，用来还原原图里的混排/错位。
   ------------------------------------------------------------------ */
const SCENES = [
  {
    id:'a1', az:-0.60, el:0.36, stage:'温控箱内 · 产品装箱', label:'MCV → 华人托盘箱',
    cont:CONT.huaren, item:PRODUCT.MCV,
    pieceLabel:'产品箱', unitLabel:'支', unitDims:'427 × 270 × 279',
    layers:4, unitsPerPiece:1200,
    groups:[
      { n:[2,4,1], b:[427,279,270], o:[0,0,0]   },   /* 前排 2 箱：427 沿箱长 */
      { n:[3,4,1], b:[270,279,427], o:[0,0,270] }    /* 后排 3 箱：427 沿箱宽 */
    ],
    note:'每层 5 箱 —— 2 箱以 427 边沿箱长、270 边沿箱宽；3 箱转 90°，以 270 边沿箱长、427 边沿箱宽。共 4 层，单层高 279。',
    color:0x8b8cff, cssColor:'#8B8CFF'
  },
  {
    id:'a2', az:-0.60, el:0.36, stage:'温控箱内 · 产品装箱', label:'MCV → TP1750L',
    cont:CONT.tp, item:PRODUCT.MCV,
    pieceLabel:'产品箱', unitLabel:'支', unitDims:'427 × 270 × 279',
    layers:4, unitsPerPiece:1200,
    groups:[
      { n:[3,4,1], b:[427,279,270], o:[0,0,0]   },   /* 一排 3 箱 */
      { n:[3,4,1], b:[427,279,270], o:[0,0,270] },   /* 二排 3 箱 */
      { n:[5,4,1], b:[270,279,427], o:[0,0,540] }    /* 三排 5 箱，转 90° */
    ],
    note:'每层 11 箱 —— 两排各 3 箱（427 沿箱长）+ 一排 5 箱（转 90°，270 沿箱长）。共 4 层，单层高 279。',
    color:0x8b8cff, cssColor:'#8B8CFF'
  },
  {
    id:'b1', az:-0.60, el:0.36, stage:'温控箱内 · 产品装箱', label:'PCV → 华人托盘箱',
    cont:CONT.huaren, item:PRODUCT.PCV,
    pieceLabel:'产品箱', unitLabel:'支', unitDims:'540 × 290 × 290',
    layers:4, unitsPerPiece:200,
    groups:[
      { n:[3,4,1], b:[290,290,540], o:[0,0,0] }      /* 3 箱并排，540 边沿箱宽 */
    ],
    note:'每层 3 箱 —— 540 边沿箱宽方向摆放，290 边沿箱长方向并排 3 箱。共 4 层，单层高 290。',
    color:0x2ed9c8, cssColor:'#2ED9C8'
  },
  {
    id:'b2', az:-0.60, el:0.36, stage:'温控箱内 · 产品装箱', label:'PCV → TP1750L',
    cont:CONT.tp, item:PRODUCT.PCV,
    pieceLabel:'产品箱', unitLabel:'支', unitDims:'540 × 290 × 290',
    layers:4, unitsPerPiece:200,
    groups:[
      { n:[1,4,3], b:[540,290,290], o:[0,0,0]    },  /* 一列 3 深 */
      { n:[1,4,3], b:[540,290,290], o:[540,0,0]  },  /* 二列 3 深 */
      { n:[1,4,1], b:[290,290,540], o:[1080,0,0] }   /* 余条 1 箱，转 90° */
    ],
    note:'每层 7 箱 —— 两列各 3 箱（540 沿箱长、3 箱进深）+ 余下一条 290 宽的窄位转 90° 放 1 箱。共 4 层，单层高 290。',
    color:0x2ed9c8, cssColor:'#2ED9C8'
  },
  {
    id:'c1', az:-0.42, el:0.52, stage:'集装箱内 · 整柜出运', label:'华人托盘箱 → 40 尺高柜',
    cont:CONT.ct, item:PRODUCT.MCV,
    pieceLabel:'温控箱', unitLabel:'支', unitDims:'1200 × 1000 × 1600',
    layers:1, unitsPerPiece:24000,
    groups:[
      { n:[10,1,1], b:[1000,1600,1200], o:[0,0,0]    },  /* 一排 10 托：1000 沿柜长 */
      { n:[8,1,1],  b:[1200,1600,1000], o:[0,0,1200] }   /* 一排 8 托：1200 沿柜长 */
    ],
    note:'两排并列 —— 一排 10 托（1000 边沿柜长、占宽 1200），一排 8 托（1200 边沿柜长、占宽 1000），合计占宽 2200。单层 1600 高。',
    color:0x8b8cff, cssColor:'#8B8CFF'
  },
  {
    id:'c2', az:-0.42, el:0.52, stage:'集装箱内 · 整柜出运', label:'TP1750L → 40 尺高柜',
    cont:CONT.ct, item:PRODUCT.MCV,
    pieceLabel:'温控箱', unitLabel:'支', unitDims:'1530 × 1120 × 1570',
    layers:1, unitsPerPiece:52800,
    groups:[
      { n:[9,1,1], b:[1120,1570,1530], o:[0,0,0] }    /* 单排 9 托：1120 沿柜长 */
    ],
    note:'单排 9 托 —— 1120 边沿柜长、1530 边沿柜宽，单层 1570 高。',
    color:0x9b87ff, cssColor:'#A28FFF'
  }
];

const piecesOf = s => s.groups.reduce((a, g) => a + g.n[0] * g.n[1] * g.n[2], 0);

/* ---------------- 2. 计算 ---------------- */

const fmt = n => n.toLocaleString('en-US');

/* 展开 groups → 逐件位置 + 包络尺寸 + 体积和 */
function layout(s) {
  const list = [];
  const mn = [Infinity, Infinity, Infinity];
  const mx = [-Infinity, -Infinity, -Infinity];
  let vol = 0;
  s.groups.forEach((g, gi) => {
    const B = g.b, N = g.n, O = g.o;
    for (let i = 0; i < N[0]; i++) {
      for (let j = 0; j < N[1]; j++) {
        for (let k = 0; k < N[2]; k++) {
          const p = [ O[0] + B[0] * (i + 0.5), O[1] + B[1] * (j + 0.5), O[2] + B[2] * (k + 0.5) ];
          list.push({ p, b: B, gi });
          for (let t = 0; t < 3; t++) {
            const lo = p[t] - B[t] / 2, hi = p[t] + B[t] / 2;
            if (lo < mn[t]) mn[t] = lo;
            if (hi > mx[t]) mx[t] = hi;
          }
          vol += B[0] * B[1] * B[2];
        }
      }
    }
  });
  return {
    list, mn, mx, vol,
    env: [ mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2] ],
    n: list.length
  };
}

function calc(s) {
  const L = layout(s);
  const c = s.cont.inner;
  const n = piecesOf(s);
  return {
    n,
    env: L.env,
    util: L.vol / (c[0] * c[1] * c[2]),
    rem: [ c[0] - L.env[0], c[1] - L.env[1], c[2] - L.env[2] ],
    units: n * s.unitsPerPiece,
    perLayer: Math.round(n / s.layers),
    layers: s.layers
  };
}

/* ---------------- 3. 等距线框 SVG ---------------- */

function isoBox(w, h, d) {
  const C = 0.8660254, S = 0.5;
  const p = (x, y, z) => [ (x - z) * C, (x + z) * S - y ];
  const raw = {
    A:[0,0,0], B:[w,0,0], Cc:[w,0,d], D:[0,0,d],
    E:[0,h,0], F:[w,h,0], G:[w,h,d], H:[0,h,d]
  };
  const V = {};
  for (const k in raw) V[k] = p(raw[k][0], raw[k][1], raw[k][2]);

  const xs = Object.values(V).map(v => v[0]);
  const ys = Object.values(V).map(v => v[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);

  const W = 240, H = 132, pad = 22;
  const s = Math.min((W - pad * 2) / (maxX - minX || 1), (H - pad * 2) / (maxY - minY || 1));
  const ox = (W - (maxX - minX) * s) / 2 - minX * s;
  const oy = (H - (maxY - minY) * s) / 2 - minY * s;
  const T = k => [V[k][0] * s + ox, V[k][1] * s + oy];
  const poly = keys => keys.map(k => T(k).map(v => v.toFixed(2)).join(',')).join(' ');

  const top   = poly(['E','F','G','H']);
  const right = poly(['B','F','G','Cc']);
  const left  = poly(['D','Cc','G','H']);

  /* 三个尺寸标注 */
  const B1 = T('B'), E1 = T('E'), F1 = T('F'), H1 = T('H');
  const lbl = (x, y, txt, anchor) =>
    `<text class="dim-txt" x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${anchor||'middle'}">${txt}</text>`;

  const wTxt = lbl((E1[0]+F1[0])/2 + 2, (E1[1]+F1[1])/2 + 13, w);
  const dTxt = lbl((E1[0]+H1[0])/2 - 4, (E1[1]+H1[1])/2 + 13, d);
  const hTxt = lbl((B1[0]+F1[0])/2 + 9, (B1[1]+F1[1])/2 + 3, h, 'start');

  return `<svg class="iso-box" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <polygon class="f-left" points="${left}"/>
    <polygon class="f-right" points="${right}"/>
    <polygon class="f-top" points="${top}"/>
    <polygon class="edge" points="${top}" style="stroke-dasharray:none"/>
    <polygon class="edge" points="${right}"/>
    <polygon class="edge" points="${left}" style="opacity:.7"/>
    ${wTxt}${dTxt}${hTxt}
  </svg>`;
}

/* ---------------- 4. 参数卡 ---------------- */

function renderCards() {
  const hostP = document.getElementById('cardsProduct');
  const hostC = document.getElementById('cardsCont');
  if (!hostP || !hostC) return;

  const items = [
    { name:PRODUCT.MCV.name, kick:'产品箱型', pill:'violet', tagPill:'1200 支 / 箱',
      dims:PRODUCT.MCV.dims, rows:[['单箱装载','1,200<small>支</small>'],['箱体尺寸','427×270×279<small>mm</small>'],['裸瓶形态','玻璃瓶 · 需缓冲']] },
    { name:PRODUCT.PCV.name, kick:'产品箱型', pill:'mint', tagPill:'200 支 / 箱',
      dims:PRODUCT.PCV.dims, rows:[['单箱装载','200<small>支</small>'],['箱体尺寸','540×290×290<small>mm</small>'],['箱型特征','扁方箱 · 单层可叠']] },
    { name:'华人托盘箱', kick:'温控箱 · 内腔', pill:'cyan', tagPill:'内腔 990×790×1180',
      dims:[990,1180,790], rows:[['外径','1200×1000×1600<small>mm</small>'],['有效内径','990×790×1180<small>mm</small>'],['有效容积','0.923<small>m³</small>']] },
    { name:'TP1750L', kick:'温控箱 · 内腔', pill:'cyan', tagPill:'内腔 1400×1020×1250',
      dims:[1400,1250,1020], rows:[['外径','1530×1120×1570<small>mm</small>'],['有效内径','1400×1020×1250<small>mm</small>'],['有效容积','1.785<small>m³</small>']] },
    { name:'40 尺高柜', kick:'集装箱 · 内腔', pill:'cyan', tagPill:'内腔 10599×2218×2500',
      dims:[10599,2500,2218], rows:[['有效内径','10599×2218×2500<small>mm</small>'],['有效容积','58.77<small>m³</small>'],['温控箱层高','单层 · 余 900<small>mm</small>']] }
  ];

  const html = it => `
    <article class="pcard reveal">
      <div class="pcard-top">
        <div>
          <h3>${it.name}</h3>
          <div class="kick">${it.kick}</div>
        </div>
        <span class="pill ${it.pill}">${it.tagPill}</span>
      </div>
      ${isoBox(it.dims[0], it.dims[1], it.dims[2])}
      <div class="spec">
        ${it.rows.map(r => `<div class="spec-row"><span class="k">${r[0]}</span><span class="v">${r[1]}</span></div>`).join('')}
      </div>
    </article>`;

  hostP.innerHTML = items.slice(0, 2).map(html).join('');
  hostC.innerHTML = items.slice(2).map(html).join('');
}

/* ---------------- 5. 装载计算表 ---------------- */

function renderTable() {
  const tb = document.getElementById('tblBody');
  if (!tb) return;
  tb.innerHTML = SCENES.map(s => {
    const c = calc(s);
    return `<tr>
      <td>
        <span class="swatch" style="background:${s.cssColor}"></span>
        <span class="strong">${s.label}</span>
        <span class="sub">${s.cont.tag}内腔 · ${s.item.short} 产品箱</span>
      </td>
      <td class="num" data-label="容器内腔">${dimText(s.cont.inner)}</td>
      <td class="num" data-label="单品尺寸">${s.unitDims}</td>
      <td class="num lay" data-label="排布"><span>${c.perLayer}<i>/层</i> × ${c.layers}<i>层</i></span></td>
      <td class="num" data-label="数量">${c.n}<span class="sub">${s.pieceLabel}</span></td>
      <td class="num" data-label="装载量">${fmt(c.units)}<span class="sub">${s.unitLabel}</span></td>
      <td data-label="空间利用率">
        <div class="meter">
          <div class="track"><div class="fill" style="width:${(c.util*100).toFixed(1)}%"></div></div>
          <span class="pct">${(c.util*100).toFixed(1)}%</span>
        </div>
      </td>
    </tr>`;
  }).join('');
}

/* ---------------- 6. 方案对比 ---------------- */

function renderCompare() {
  const host = document.getElementById('compare');
  if (!host) return;

  const byId = id => SCENES.find(s => s.id === id);
  const c1 = piecesOf(byId('c1')), c2 = piecesOf(byId('c2'));

  /* 单柜支数 = 柜内温控箱数 × 每箱产品箱数 × 单箱支数 */
  const fam = [
    { label:'MCV（流脑）',
      a: c1 * piecesOf(byId('a1')) * PRODUCT.MCV.vial,
      b: c2 * piecesOf(byId('a2')) * PRODUCT.MCV.vial },
    { label:'PCV（肺炎）',
      a: c1 * piecesOf(byId('b1')) * PRODUCT.PCV.vial,
      b: c2 * piecesOf(byId('b2')) * PRODUCT.PCV.vial }
  ];
  const max = Math.max(...fam.flatMap(f => [f.a, f.b]));

  host.innerHTML = fam.map(f => {
    const up = (f.b / f.a - 1) * 100;
    return `<div class="cmp-card reveal">
      <div class="cmp-head">
        <h3>${f.label} · 单柜可装载支数</h3>
        <span class="note">40 尺高柜 · 有效内径 10599×2218×2500 mm</span>
      </div>
      <div class="bar-row">
        <div class="bar-label">华人托盘箱方案</div>
        <div class="bar-track"><div class="bar-fill a" data-w="${(f.a/max*100).toFixed(1)}"></div></div>
        <div class="bar-val">${fmt(f.a)}<small>支</small></div>
      </div>
      <div class="bar-row">
        <div class="bar-label">TP1750L 方案</div>
        <div class="bar-track"><div class="bar-fill b" data-w="${(f.b/max*100).toFixed(1)}"></div></div>
        <div class="bar-val">${fmt(f.b)}<small>支</small></div>
      </div>
      <div class="cmp-foot">
        <span class="delta">+${up.toFixed(1)}%</span>
        <span>TP1750L 方案单柜多装 ${fmt(f.b - f.a)} 支</span>
      </div>
    </div>`;
  }).join('');
}

/* ---------------- 7. 3D 引擎 ---------------- */

const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function createViewer(canvas, opt) {
  opt = opt || {};
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (THREE.ColorManagement) {
    if ('legacyMode' in THREE.ColorManagement) THREE.ColorManagement.legacyMode = false;
    if ('enabled' in THREE.ColorManagement) THREE.ColorManagement.enabled = true;
  }

  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true, powerPreference:'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  if ('outputEncoding' in renderer) renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 1, 1e7);
  const world = new THREE.Group();
  scene.add(world);

  /* --- 灯光 --- */
  const hemi = new THREE.HemisphereLight(0xa9d8ff, 0x060a12, 0.42);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffffff, 0.95);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0008;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x5be7ff, 0.30);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0x8b8cff, 0.26);
  scene.add(rim);

  /* --- 相机状态 --- */
  const DEFAULT_AZ = opt.az !== undefined ? opt.az : 0.72;
  let az0 = DEFAULT_AZ;
  const EL0 = opt.el !== undefined ? opt.el : 0.34;
  const st = { az: az0, el: EL0, dist: 4000, azT: az0, elT: EL0, distT: 4000, base: 4000 };
  let autoRotate = opt.autoRotate !== false && !reduce;
  let explodeT = 0, explode = 0;
  let shellVisible = true;
  let t0 = 0;
  let boxes = [];
  let radius = 1000;
  let current = null;
  let alive = true;

  /* --- 构建场景 --- */
  function disposeNode(o) {
    o.traverse(n => {
      if (n.geometry) n.geometry.dispose();
      if (n.material) {
        if (Array.isArray(n.material)) n.material.forEach(m => m.dispose());
        else n.material.dispose();
      }
    });
  }

  function clearWorld() {
    while (world.children.length) {
      const o = world.children.pop();
      disposeNode(o);
    }
    boxes = [];
  }

  function build(s) {
    clearWorld();
    current = s;

    const C = s.cont.inner;
    const L = layout(s);
    radius = Math.sqrt(C[0]*C[0] + C[1]*C[1] + C[2]*C[2]) / 2;

    /* 内腔底面（承接投影） */
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(C[0], C[2]),
      new THREE.MeshStandardMaterial({ color:0x0c1728, roughness:0.94, metalness:0.0 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -C[1] / 2 + 0.6;
    floor.receiveShadow = true;
    world.add(floor);

    /* 容器壳体 */
    const shellGeo = new THREE.BoxGeometry(C[0], C[1], C[2]);
    const shell = new THREE.Mesh(shellGeo, new THREE.MeshPhysicalMaterial({
      color: 0x9fd8ff, metalness: 0.0, roughness: 0.22,
      transparent: true, opacity: shellVisible ? 0.045 : 0.0,
      side: THREE.DoubleSide, depthWrite: false
    }));
    shell.name = 'shell';
    world.add(shell);

    const shellEdge = new THREE.LineSegments(
      new THREE.EdgesGeometry(shellGeo),
      new THREE.LineBasicMaterial({ color: 0x63e6ff, transparent: true, opacity: 0.7 })
    );
    shellEdge.name = 'shellEdge';
    world.add(shellEdge);

    /* 包络在容器内居中（长、宽均分余量），高度贴底码放 */
    const off = [
      -C[0] / 2 + (C[0] - L.env[0]) / 2 - L.mn[0],
      -C[1] / 2 - L.mn[1],
      -C[2] / 2 + (C[2] - L.env[2]) / 2 - L.mn[2]
    ];

    /* 堆垛几何中心：拆分视图以此为原点向外散开 */
    const ctr = new THREE.Vector3(0, -C[1] / 2 + L.env[1] / 2, 0);

    const mat = new THREE.MeshStandardMaterial({
      color: s.color, roughness: 0.38, metalness: 0.16,
      emissive: s.color, emissiveIntensity: 0.05
    });
    const edgeMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22 });

    /* 每组尺寸不同，各自建几何体 */
    const geos = s.groups.map(g => new THREE.BoxGeometry(
      g.b[0] * 0.972, g.b[1] * 0.972, g.b[2] * 0.972
    ));
    const edgeGeos = geos.map(g => new THREE.EdgesGeometry(g));

    const n = L.n;
    const step = Math.min(0.055, 1.05 / n);

    L.list.forEach((it, i) => {
      const px = it.p[0] + off[0];
      const py = it.p[1] + off[1];
      const pz = it.p[2] + off[2];

      const m = new THREE.Mesh(geos[it.gi], mat);
      m.castShadow = true;
      m.receiveShadow = true;
      m.position.set(px, py, pz);
      m.add(new THREE.LineSegments(edgeGeos[it.gi], edgeMat));
      world.add(m);

      boxes.push({
        mesh: m,
        base: new THREE.Vector3(px, py, pz),
        dir: new THREE.Vector3(px - ctr.x, py - ctr.y, pz - ctr.z).multiplyScalar(1.22),
        delay: i * step
      });
    });

    /* 灯光随尺度调整 */
    key.position.set(radius * 1.15, radius * 2.0, radius * 1.35);
    const sc = key.shadow.camera;
    const d = radius * 1.9;
    sc.left = -d; sc.right = d; sc.top = d; sc.bottom = -d;
    sc.near = radius * 0.2; sc.far = radius * 9;
    sc.updateProjectionMatrix();
    fill.position.set(-radius * 1.6, radius * 0.8, -radius * 1.1);
    rim.position.set(radius * 0.4, radius * 0.5, -radius * 1.8);

    explode = 0; explodeT = 0;
    t0 = performance.now() / 1000;
    /* 每个场景可用 az / el 指定默认取景，让构图与 Word 原图一致 */
    az0 = (s.az !== undefined) ? s.az : DEFAULT_AZ;
    st.azT = st.az = az0;
    st.elT = st.el = (s.el !== undefined) ? s.el : EL0;

    fit();
  }

  /* --- 相机适配（迭代投影，保证完整入画） --- */
  function fit() {
    if (!current) return;
    const C = current.cont.inner;
    const corners = [];
    for (let sx = -1; sx <= 1; sx += 2) {
      for (let sy = -1; sy <= 1; sy += 2) {
        for (let sz = -1; sz <= 1; sz += 2) {
          corners.push(new THREE.Vector3(sx * C[0] / 2, sy * C[1] / 2, sz * C[2] / 2));
        }
      }
    }

    const ce = Math.cos(st.el), se = Math.sin(st.el);
    const dir = new THREE.Vector3(ce * Math.sin(st.az), se, ce * Math.cos(st.az));
    const v = new THREE.Vector3();

    const savedNear = camera.near, savedFar = camera.far;
    camera.near = radius * 0.02;
    camera.far = radius * 200;

    /* 取初始角与自动摆动两端的最远距离，保证旋转时不裁切 */
    const azList = [az0 - 0.28, az0, az0 + 0.28];
    let worst = 0;

    for (let a = 0; a < azList.length; a++) {
      const ce2 = Math.cos(st.el), se2 = Math.sin(st.el);
      const dir2 = new THREE.Vector3(ce2 * Math.sin(azList[a]), se2, ce2 * Math.cos(azList[a]));
      let d = radius * 3;
      for (let k = 0; k < 5; k++) {
        camera.position.copy(dir2).multiplyScalar(d);
        camera.lookAt(0, 0, 0);
        camera.updateMatrixWorld();
        camera.updateProjectionMatrix();
        let mx = 0;
        for (let i = 0; i < corners.length; i++) {
          v.copy(corners[i]).project(camera);
          mx = Math.max(mx, Math.abs(v.x), Math.abs(v.y));
        }
        if (!isFinite(mx) || mx <= 1e-4) break;
        d = d * (mx / 0.82);
      }
      worst = Math.max(worst, d);
    }

    camera.near = savedNear;
    camera.far = savedFar;
    st.base = worst;
    st.dist = st.distT = worst;
  }

  /* --- 交互 --- */
  let dragging = false, lx = 0, ly = 0;
  const onDown = e => {
    dragging = true; lx = e.clientX; ly = e.clientY;
    if (canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);
  };
  const onMove = e => {
    if (!dragging) return;
    const dx = e.clientX - lx, dy = e.clientY - ly;
    lx = e.clientX; ly = e.clientY;
    st.azT -= dx * 0.0085;
    st.elT = clamp(st.elT + dy * 0.0065, -0.22, 1.32);
  };
  const onUp = () => { dragging = false; };
  const onWheel = e => {
    e.preventDefault();
    st.distT = clamp(st.distT * (1 + e.deltaY * 0.0011), st.base * 0.32, st.base * 2.6);
  };

  canvas.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });

  /* --- 尺寸 --- */
  function resize() {
    const w = canvas.clientWidth || canvas.parentElement.clientWidth;
    const h = canvas.clientHeight || canvas.parentElement.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    fit();
  }
  const ro = new ResizeObserver(resize);
  if (canvas.parentElement) ro.observe(canvas.parentElement);
  window.addEventListener('resize', resize);

  /* --- 循环 --- */
  let last = performance.now() / 1000;
  function loop() {
    if (!alive) return;
    requestAnimationFrame(loop);

    const now = performance.now() / 1000;
    const dt = Math.min(now - last, 0.05);
    last = now;

    if (autoRotate && !dragging) {
      const tgt = az0 + Math.sin(now * 0.24) * 0.3;
      st.azT += (tgt - st.azT) * Math.min(1, dt * 1.6);
    }

    st.az += (st.azT - st.az) * Math.min(1, dt * 7);
    st.el += (st.elT - st.el) * Math.min(1, dt * 7);
    st.dist += (st.distT - st.dist) * Math.min(1, dt * 5);

    const ce = Math.cos(st.el), se = Math.sin(st.el);
    camera.position.set(
      st.dist * ce * Math.sin(st.az),
      st.dist * se,
      st.dist * ce * Math.cos(st.az)
    );
    camera.lookAt(0, 0, 0);
    camera.near = Math.max(1, st.dist / 400);
    camera.far = st.dist * 40;
    camera.updateProjectionMatrix();

    explode += (explodeT - explode) * Math.min(1, dt * 5);
    const ex = explode;

    const el2 = now - t0;
    for (let i = 0; i < boxes.length; i++) {
      const b = boxes[i];
      const raw = (el2 - 0.15 - b.delay) / 0.72;
      const t = reduce ? 1 : clamp(raw, 0, 1);
      const e = easeOutCubic(t);
      const drop = radius * 1.15 * (1 - e);
      b.mesh.position.set(
        b.base.x + b.dir.x * ex,
        b.base.y + b.dir.y * ex + drop,
        b.base.z + b.dir.z * ex
      );
    }

    renderer.render(scene, camera);
  }
  loop();

  /* --- 对外方法 --- */
  return {
    load: build,
    resize,
    setAutoRotate(v) { autoRotate = v; },
    getAutoRotate() { return autoRotate; },
    setExplode(v) {
      explodeT = v ? 1 : 0;
      st.distT = v ? st.base * 2.1 : st.base;
    },
    getExplode() { return explodeT > 0.5; },
    setShell(v) {
      shellVisible = v;
      world.children.forEach(o => {
        if (o.name === 'shell') o.material.opacity = v ? 0.045 : 0.0;
        if (o.name === 'shellEdge') o.material.opacity = v ? 0.7 : 0.0;
      });
    },
    replay() { t0 = performance.now() / 1000; },
    debug() {
      const out = { aspect: camera.aspect, fov: camera.fov, dist: st.dist, base: st.base, radius, az: st.az, el: st.el, ndc: 0 };
      if (current) {
        const C = current.cont.inner;
        const v = new THREE.Vector3();
        let mx = 0, nx = 0, ny = 0;
        for (let sx = -1; sx <= 1; sx += 2)
          for (let sy = -1; sy <= 1; sy += 2)
            for (let sz = -1; sz <= 1; sz += 2) {
              v.set(sx*C[0]/2, sy*C[1]/2, sz*C[2]/2).project(camera);
              nx = Math.max(nx, Math.abs(v.x));
              ny = Math.max(ny, Math.abs(v.y));
            }
        out.ndc = Math.max(nx, ny);
        out.nx = nx; out.ny = ny;
        out.n = boxes.length;
        out.yMin = Math.min.apply(null, boxes.map(b => b.mesh.position.y));
        out.yMax = Math.max.apply(null, boxes.map(b => b.mesh.position.y));
        out.explode = explode;
        out.explodeT = explodeT;
      }
      return out;
    },
    dispose() {
      alive = false;
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('resize', resize);
      renderer.dispose();
    }
  };
}

/* ---------------- 8. 场景切换 UI ---------------- */

function initStage() {
  const canvas = document.getElementById('stageCanvas');
  if (!canvas || !window.THREE) return;

  const viewer = createViewer(canvas, { az: 0.66 });
  let idx = 0;

  const tabsHost = document.getElementById('tabs');
  const groups = [];
  SCENES.forEach((s, i) => {
    let g = groups.find(x => x.name === s.stage);
    if (!g) { g = { name: s.stage, items: [] }; groups.push(g); }
    g.items.push({ s, i });
  });

  tabsHost.innerHTML = groups.map(g =>
    `<div class="tab-row"><span class="tab-group-label">${g.name}</span>` +
    g.items.map(({ s, i }) => `<button class="tab${i === 0 ? ' on' : ''}" data-i="${i}">${s.label}</button>`).join('') +
    `</div>`
  ).join('');

  const hudTitle = document.getElementById('hudTitle');
  const hudSub = document.getElementById('hudSub');
  const hudChips = document.getElementById('hudChips');
  const hudNote = document.getElementById('stageNote');
  const stageStats = document.getElementById('stageStats');

  function apply(s) {
    viewer.load(s);
    const c = calc(s);
    hudTitle.textContent = s.label;
    hudSub.textContent = `${s.cont.name} · 内腔 ${dimText(s.cont.inner)} mm`;

    hudChips.innerHTML = [
      `每层 <b>${c.perLayer}</b> 件 · <b>${c.layers}</b> 层`,
      `${s.pieceLabel} <b>${c.n}</b>`,
      `装载 <b>${fmt(c.units)}</b> ${s.unitLabel}`,
      `空间利用 <b>${(c.util * 100).toFixed(1)}%</b>`
    ].map(t => `<span class="hud-chip">${t}</span>`).join('');

    hudNote.innerHTML = `<span class="mk">◆</span><span>${s.note}
      单品 ${s.unitDims} mm（长×宽×高）；剩余空间 长 ${c.rem[0]} / 宽 ${c.rem[2]} / 高 ${c.rem[1]} mm，居中排布后两侧均分。</span>`;

    if (stageStats) {
      stageStats.querySelectorAll('[data-k]').forEach(el => {
        const k = el.getAttribute('data-k');
        if (k === 'n') el.textContent = c.n;
        if (k === 'units') el.textContent = fmt(c.units);
        if (k === 'util') el.textContent = (c.util * 100).toFixed(1) + '%';
      });
    }
  }

  tabsHost.addEventListener('click', e => {
    const b = e.target.closest('.tab');
    if (!b) return;
    idx = +b.dataset.i;
    tabsHost.querySelectorAll('.tab').forEach(t => t.classList.toggle('on', +t.dataset.i === idx));
    apply(SCENES[idx]);
  });

  /* 控件 */
  const btnRot = document.getElementById('btnRotate');
  const btnExp = document.getElementById('btnExplode');
  const btnShell = document.getElementById('btnShell');
  const btnReplay = document.getElementById('btnReplay');

  btnRot.classList.toggle('on', viewer.getAutoRotate());
  btnRot.addEventListener('click', () => {
    const v = !viewer.getAutoRotate();
    viewer.setAutoRotate(v);
    btnRot.classList.toggle('on', v);
  });
  btnExp.addEventListener('click', () => {
    const v = !viewer.getExplode();
    viewer.setExplode(v);
    btnExp.classList.toggle('on', v);
  });
  btnShell.addEventListener('click', () => {
    const hide = !btnShell.classList.contains('on');
    viewer.setShell(!hide);
    btnShell.classList.toggle('on', hide);
  });
  btnReplay.addEventListener('click', () => viewer.replay());

  apply(SCENES[0]);
  window.__stageViewer = viewer;
}

/* ---------------- 9. 首屏视觉 ---------------- */

function initHeroViewer() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas || !window.THREE) return;
  const v = createViewer(canvas, { az: 0.95, el: 0.3, autoRotate: true });
  v.load(SCENES[4]);
  window.__heroViewer = v;
}

/* ---------------- 10. 动效 ---------------- */

function initReveal() {
  const io = new IntersectionObserver(es => {
    es.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        if (e.target.dataset.bar) {
          const fs = e.target.querySelectorAll('.bar-fill');
          setTimeout(() => { fs.forEach(f => { f.style.width = f.dataset.w + '%'; }); }, 140);
        }
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });

  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  document.querySelectorAll('.cmp-card').forEach(el => { el.dataset.bar = '1'; });
}

function initCounters() {
  const nodes = document.querySelectorAll('[data-count]');
  const io = new IntersectionObserver(es => {
    es.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const to = +el.dataset.count;
      const dur = 1400;
      const s = performance.now();
      const tick = now => {
        const p = Math.min(1, (now - s) / dur);
        el.textContent = fmt(Math.round(to * easeOutCubic(p)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      io.unobserve(el);
    });
  }, { threshold: 0.5 });
  nodes.forEach(n => io.observe(n));
}

function initScrollUI() {
  const nav = document.getElementById('nav');
  const bar = document.getElementById('progress');
  const onScroll = () => {
    const y = window.scrollY || document.documentElement.scrollTop;
    nav.classList.toggle('solid', y > 40);
    const h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ---------------- 11. 启动 ---------------- */

function boot() {
  renderCards();
  renderTable();
  renderCompare();
  initHeroViewer();
  initStage();
  initReveal();
  initCounters();
  initScrollUI();
  document.body.classList.add('ready');
}

(function start() {
  if (window.THREE) { boot(); return; }
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/three@0.147.0/build/three.min.js';
  s.onload = boot;
  s.onerror = () => {
    document.body.classList.add('no3d');
    renderCards(); renderTable(); renderCompare(); initReveal(); initCounters(); initScrollUI();
  };
  document.head.appendChild(s);
})();
