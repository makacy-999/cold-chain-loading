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
  ct:     { key:'ct',     name:'40 尺冷柜',  inner:[10599,2500,2218], outer:[12192,2896,2438],tag:'集装箱' },
  /* 裸木托盘：长1200 × 宽800 × 高200；inner 高度取「实际货高」= 7 层堆码高，
     使「空间利用率」= 面填充率（MCV 7×279=1953，PCV 7×290=2030） */
  pallet:     { key:'pallet',     name:'木托盘', inner:[1200,1953,800], outer:[1200,200,800], tag:'木托盘' },
  pallet_pcv: { key:'pallet_pcv', name:'木托盘', inner:[1200,2030,800], outer:[1200,200,800], tag:'木托盘' }
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
    id:'a1', az:-0.60, el:0.36, stage:'产品装箱 · 温控箱 / 木托盘', label:'MCV → 华人托盘箱',
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
    id:'a2', az:-0.60, el:0.36, stage:'产品装箱 · 温控箱 / 木托盘', label:'MCV → TP1750L',
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
    id:'b1', az:-0.60, el:0.36, stage:'产品装箱 · 温控箱 / 木托盘', label:'PCV → 华人托盘箱',
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
    id:'b2', az:-0.60, el:0.36, stage:'产品装箱 · 温控箱 / 木托盘', label:'PCV → TP1750L',
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
    id:'c1', az:-0.42, el:0.52, stage:'集装箱内 · 整柜出运', label:'华人托盘箱 → 40 尺冷柜',
    cont:CONT.ct, item:PRODUCT.MCV,
    mix:true, alt:{ short:'PCV', unitsPerPiece:2400 },
    pieceLabel:'温控箱', unitLabel:'支', unitDims:'1200 × 1000 × 1600',
    layers:1, unitsPerPiece:24000,
    groups:[
      { n:[10,1,1], b:[1000,1600,1200], o:[0,0,0]    },  /* 一排 10 托：1000 沿柜长 */
      { n:[8,1,1],  b:[1200,1600,1000], o:[0,0,1200] }   /* 一排 8 托：1200 沿柜长 */
    ],
    note:'两排并列 —— 一排 10 托（1000 沿柜长、占宽 1200）+ 一排 8 托（1200 沿柜长、占宽 1000），合计 18 托、占宽 2200，单层 1600 高。箱壳一样、箱内可混装：全装 MCV 为 18×20×1200 = 432,000 支，全装 PCV 为 18×12×200 = 43,200 支，两种产品混装按箱数加权。',
    color:0x8b8cff, cssColor:'#8B8CFF'
  },
  {
    id:'c2', az:-0.42, el:0.52, stage:'集装箱内 · 整柜出运', label:'TP1750L → 40 尺冷柜',
    cont:CONT.ct, item:PRODUCT.MCV,
    mix:true, alt:{ short:'PCV', unitsPerPiece:5600 },
    pieceLabel:'温控箱', unitLabel:'支', unitDims:'1530 × 1120 × 1570',
    layers:1, unitsPerPiece:52800,
    groups:[
      { n:[9,1,1], b:[1120,1570,1530], o:[0,0,0] }    /* 单排 9 托：1120 沿柜长 */
    ],
    note:'单排 9 托 —— 1120 边沿柜长、1530 边沿柜宽，单层 1570 高。箱壳一样、箱内可混装：全装 MCV 为 9×44×1200 = 475,200 支，全装 PCV 为 9×28×200 = 50,400 支，两种产品混装按箱数加权。',
    color:0x9b87ff, cssColor:'#A28FFF'
  },
  /* ============ V3 新增：产品直接码放在裸木托盘上 ============ */
  {
    id:'p1', az:-0.62, el:0.34, stage:'产品装箱 · 温控箱 / 木托盘', label:'MCV → 木托盘',
    cont:CONT.pallet, item:PRODUCT.MCV,
    pieceLabel:'产品箱', unitLabel:'支', unitDims:'427 × 270 × 279',
    layers:7, unitsPerPiece:1200, mode:'openPallet',
    groups:[
      { n:[2,7,1], b:[427,279,270], o:[0,0,0]   },  /* 前排 2 箱横放：427 沿托盘长 */
      { n:[4,7,1], b:[270,279,427], o:[0,0,270] }   /* 后排 4 箱转 90°：错位补满整面 */
    ],
    note:'每层 6 箱 —— 前排 2 箱 427 沿托盘长横放，后排 4 箱转 90°（270 沿长）错位补满；码 7 层 = 42 箱/托，单托货高 1953，面利用率 72%。',
    color:0x8b8cff, cssColor:'#8B8CFF'
  },
  {
    id:'p2', az:-0.62, el:0.34, stage:'产品装箱 · 温控箱 / 木托盘', label:'PCV → 木托盘',
    cont:CONT.pallet_pcv, item:PRODUCT.PCV,
    pieceLabel:'产品箱', unitLabel:'支', unitDims:'540 × 290 × 290',
    layers:7, unitsPerPiece:200, mode:'openPallet',
    groups:[
      { n:[2,7,2], b:[540,290,290], o:[0,0,0] }   /* 每层 2×2=4 箱：该托盘面已达几何上限 */
    ],
    note:'PCV 箱 540×290 在 1200×800 托盘面上，2×2=4 箱/层已是几何最满（面利用率约 65%）；码 7 层 = 28 箱/托，单托货高 2030。',
    color:0x2ed9c8, cssColor:'#2ED9C8'
  },
  /* ============ V3 新增：整柜装裸木托盘（托盘上带产品堆码） ============ */
  {
    id:'p3', az:-0.42, el:0.52, stage:'集装箱内 · 整柜出运', label:'木托盘(MCV) → 40 尺冷柜',
    cont:CONT.ct, item:PRODUCT.MCV,
    pieceLabel:'木托盘', unitLabel:'支', unitDims:'1200 × 800 × 200',
    layers:1, unitsPerPiece:50400, mode:'containerOpenPallet',
    groups:[
      { n:[13,1,1], b:[800,2153,1200], o:[0,0,0]    },  /* 前段 13 托转 90°：800 沿柜长、1200 占柜宽 */
      { n:[8,1,1],  b:[1200,2153,800], o:[0,0,1200] }   /* 余宽 1018 里顺放 8 托：1200 沿柜长 */
    ],
    /* 每块木托盘上的产品堆码（MCV：每层 6 箱，7 层 = 42 箱，货高 1953） */
    palletLoad:{ groups:[
      { n:[2,7,1], b:[427,279,270], o:[0,0,0]   },
      { n:[4,7,1], b:[270,279,427], o:[0,0,270] }
    ], color:0x8b8cff },
    note:'单层混排 21 托 —— 13 托转 90°（800 沿柜长，占满 1200 柜宽）+ 余下 1018 宽里顺放 8 托，合计占宽 2000、占长 10400。每托 42 箱 ×1200 支 = 50,400 支，整柜 1,058,400 支。',
    color:0x8b8cff, cssColor:'#8B8CFF'
  },
  {
    id:'p4', az:-0.42, el:0.52, stage:'集装箱内 · 整柜出运', label:'木托盘(PCV) → 40 尺冷柜',
    cont:CONT.ct, item:PRODUCT.PCV,
    pieceLabel:'木托盘', unitLabel:'支', unitDims:'1200 × 800 × 200',
    layers:1, unitsPerPiece:5600, mode:'containerOpenPallet',
    groups:[
      { n:[13,1,1], b:[800,2230,1200], o:[0,0,0]    },  /* 前段 13 托转 90°：800 沿柜长、1200 占柜宽 */
      { n:[8,1,1],  b:[1200,2230,800], o:[0,0,1200] }   /* 余宽 1018 里顺放 8 托：1200 沿柜长 */
    ],
    /* 每块木托盘上的产品堆码（PCV：每层 4 箱，7 层 = 28 箱，货高 2030，加托盘 200 = 2230） */
    palletLoad:{ groups:[
      { n:[2,7,2], b:[540,290,290], o:[0,0,0] }
    ], color:0x2ed9c8 },
    note:'单层混排 21 托 —— 13 托转 90°（800 沿柜长，占满 1200 柜宽）+ 余下 1018 宽里顺放 8 托，合计占宽 2000、占长 10400。每托 28 箱（4 箱/层 × 7 层）×200 支 = 5,600 支，整柜 21 托 ×5,600 = 117,600 支；托高 200 + 货高 2030 = 2230，柜内净高 2500 余 270 mm。',
    color:0x2ed9c8, cssColor:'#2ED9C8'
  }
];

/* Tab 顺序：按产品归组 —— 木托盘紧跟在对应产品的 TP1750L 之后 */
(function reorderScenes() {
  const order = ['a1', 'a2', 'p1', 'b1', 'b2', 'p2', 'c1', 'c2', 'p3', 'p4'];
  SCENES.sort((x, y) => order.indexOf(x.id) - order.indexOf(y.id));
})();

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
    /* 温控箱柜：同一柜可混装 MCV / PCV，给出两种产品各自满柜的支数 */
    altUnits: s.alt ? n * s.alt.unitsPerPiece : null,
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
    { name:'40 尺冷柜', kick:'集装箱 · 内腔', pill:'cyan', tagPill:'内腔 10599×2218×2500',
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
        <span class="sub">${s.cont.tag}内腔 · ${s.alt ? 'MCV / PCV 产品箱混装' : s.item.short + ' 产品箱'}</span>
      </td>
      <td class="num" data-label="容器内腔"><span class="v">${dimText(s.cont.inner)}</span></td>
      <td class="num" data-label="单品尺寸"><span class="v">${s.unitDims}</span></td>
      <td class="num lay" data-label="排布"><span class="v">${c.perLayer}<i>/层</i> × ${c.layers}<i>层</i></span></td>
      <td class="num" data-label="数量"><span class="v">${c.n}<span class="sub">${s.pieceLabel}</span></span></td>
      <td class="num" data-label="装载量">${s.alt
        ? `<span class="duo">${fmt(c.units)}<span class="sub">${s.unitLabel} · 全 ${s.item.short}</span><br>${fmt(c.altUnits)}<span class="sub">${s.unitLabel} · 全 ${s.alt.short}</span></span>`
        : `<span class="v">${fmt(c.units)}<span class="sub">${s.unitLabel}</span></span>`}</td>
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
  host.innerHTML = fam.map(f => {
    const up = (f.b / f.a - 1) * 100;
    /* 条形按"本组最大值"归一：题干说明即如此，同组两种温控箱的差异才看得清 */
    const fmax = Math.max(f.a, f.b);
    return `<div class="cmp-card reveal">
      <div class="cmp-head">
        <h3>${f.label} · 单柜可装载支数</h3>
        <span class="note">40 尺冷柜 · 有效内径 10599×2218×2500 mm</span>
      </div>
      <div class="bar-row">
        <div class="bar-label">华人托盘箱方案</div>
        <div class="bar-track"><div class="bar-fill a" data-w="${(f.a/fmax*100).toFixed(1)}"></div></div>
        <div class="bar-val">${fmt(f.a)}<small>支</small></div>
      </div>
      <div class="bar-row">
        <div class="bar-label">TP1750L 方案</div>
        <div class="bar-track"><div class="bar-fill b" data-w="${(f.b/fmax*100).toFixed(1)}"></div></div>
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

/* ============================================================
   7.0 实物表现构件（托盘箱 / 保温集装箱）
   仅用于「三维推演」舞台；首屏 hero 仍走原来的抽象表现。
   ============================================================ */

/* 竖向瓦楞纹理：白色箱体 / 保温箱侧壁的细密竖纹 */
function corrugationTexture(base, line, reps) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = base;
  g.fillRect(0, 0, 128, 128);
  g.strokeStyle = line;
  g.lineWidth = 1.2;
  for (let i = 0; i <= 16; i++) {
    const x = (i / 16) * 128 + 0.5;
    g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 128); g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(reps || 1, 1);
  t.anisotropy = 4;
  return t;
}

/* 印刷标签：透明底 + 蓝字，可多行 */
function labelTexture(lines, o) {
  o = o || {};
  const c = document.createElement('canvas');
  c.width = 512; c.height = 320;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 512, 320);
  const fs = o.size || 78;
  g.font = '700 ' + fs + 'px "PingFang SC","Microsoft YaHei",Arial,sans-serif';
  g.textAlign = 'left';
  g.textBaseline = 'top';
  const arr = Array.isArray(lines) ? lines : String(lines).split('\n');
  g.lineJoin = 'round';
  g.lineWidth = Math.max(4, fs * 0.14);
  g.strokeStyle = 'rgba(255,255,255,0.92)';
  arr.forEach((ln, i) => g.strokeText(ln, 18, 20 + i * (fs + 6)));
  g.fillStyle = o.color || '#1e56b0';
  arr.forEach((ln, i) => g.fillText(ln, 18, 20 + i * (fs + 6)));
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  return t;
}

/* 共享材质包（每次 build 重建，避免跨场景残留） */
function makeKit() {
  /* 木质件：场景里有一盏青色补光，纯漫反射的木头在背光面会被染成青绿，
     这里压低环境反射、补一点暖色自发光，让侧面读起来仍是木头本色 */
  return {
    wood:     new THREE.MeshStandardMaterial({
      color: 0xa8824e, roughness: 0.93, metalness: 0.02,
      emissive: 0x503717, emissiveIntensity: 0.5, envMapIntensity: 0.3
    }),
    woodDark: new THREE.MeshStandardMaterial({
      color: 0x86683e, roughness: 0.95, metalness: 0.02,
      emissive: 0x3a2711, emissiveIntensity: 0.5, envMapIntensity: 0.3
    }),
    metal:    new THREE.MeshStandardMaterial({ color: 0xb7c0ca, roughness: 0.34, metalness: 0.82 }),
    frame:    new THREE.MeshStandardMaterial({ color: 0xccd4dd, roughness: 0.46, metalness: 0.4 }),
    white:    new THREE.MeshStandardMaterial({ color: 0xf3f6f9, roughness: 0.58, metalness: 0.03 }),
    yellow:   new THREE.MeshStandardMaterial({ color: 0xf2c414, roughness: 0.55, metalness: 0.15 }),
    dark:     new THREE.MeshStandardMaterial({ color: 0x2b3038, roughness: 0.7,  metalness: 0.35 })
  };
}

/* 圆角矩形路径 */
function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

/* 程序化「影棚」环境贴图（等距柱状）：柔和渐变天光 + 几处高光斑，
   经 PMREM 预滤波后作为 IBL，让金属角件 / 清漆白箱产生真实反射，
   整体读起来像产品实拍而非塑料模型。无需任何外部资源，单文件离线可用。 */
function makeEnvTexture() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 512;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0.00, '#bcd8ff');
  grad.addColorStop(0.42, '#eaf4ff');
  grad.addColorStop(0.50, '#ffffff');
  grad.addColorStop(0.58, '#c4cfdb');
  grad.addColorStop(1.00, '#10161f');
  g.fillStyle = grad; g.fillRect(0, 0, 1024, 512);
  const blob = (x, y, r, col) => {
    const rg = g.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, col); rg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rg; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  };
  blob(300, 150, 160, 'rgba(255,255,255,0.92)');
  blob(720, 120, 130, 'rgba(208,234,255,0.85)');
  blob(540, 205, 95,  'rgba(255,255,255,0.7)');
  const t = new THREE.CanvasTexture(c);
  t.mapping = THREE.EquirectangularReflectionMapping;
  if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding;
  return t;
}

/* 华人品牌徽标：透明底 + 蓝底白字「华人」+ 可选车型副标，用作箱体印刷 Logo */
function makeBrandLogo(opts) {
  opts = opts || {};
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 512, 512);
  const bw = 360, bh = 210, bx = (512 - bw) / 2, by = 56, r = 44;
  g.fillStyle = '#15489a';
  roundRect(g, bx, by, bw, bh, r); g.fill();
  g.lineWidth = 6; g.strokeStyle = 'rgba(255,255,255,0.85)';
  roundRect(g, bx, by, bw, bh, r); g.stroke();
  g.fillStyle = '#ffffff';
  g.font = '700 132px "PingFang SC","Microsoft YaHei",sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('华人', 256, by + bh / 2 - 4);
  if (opts.sub) {
    g.fillStyle = '#dce6f4';
    g.font = '600 56px "PingFang SC",Arial,sans-serif';
    g.fillText(opts.sub, 256, by + bh + 66);
  }
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  return t;
}

/* ---- 客户品牌标（華人供應鏈管理 / Sino S.C.M.）----
   内联 base64，保证单文件离线可用；宽度按原始比例（aspect）横贴箱面 */
const BRAND_LOGO_SRC = "data:image/png;base64,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";
const BRAND_LOGO_ASPECT = 4.3207;
let _brandLogoTex = null;
function brandLogoTex() {
  if (!_brandLogoTex) {
    _brandLogoTex = new THREE.TextureLoader().load(BRAND_LOGO_SRC);
    _brandLogoTex.anisotropy = 8;
    if (THREE.sRGBEncoding) _brandLogoTex.encoding = THREE.sRGBEncoding;
  }
  return _brandLogoTex;
}

/* 单个实物托盘箱：木托盘 + 白色瓦楞箱体 + 金属框架(上下框 + 四立柱) + 门闩 + 品牌 Logo
   outer = [长 x, 高 y, 宽 z]（与容器轴序一致）
   返回 { group, shellParts }，shellParts 供「外壳」按钮显隐 */
function makePalletBox(outer, kit, o) {
  o = o || {};
  const Lx = outer[0], Hy = outer[1], Wz = outer[2];
  const g = new THREE.Group();
  const palletH = Math.max(Hy * 0.085, 50);
  const bodyY0 = -Hy / 2 + palletH;
  const bodyY1 = Hy / 2;
  const bodyH = bodyY1 - bodyY0;
  const shellParts = [];

  /* 木托盘：面板 + 三根垫墩（露出叉车孔） */
  const deck = new THREE.Mesh(new THREE.BoxGeometry(Lx * 0.99, palletH * 0.36, Wz * 0.99), kit.wood);
  deck.position.y = -Hy / 2 + palletH * 0.18;
  deck.castShadow = deck.receiveShadow = true;
  g.add(deck);
  for (let i = -1; i <= 1; i++) {
    const blk = new THREE.Mesh(new THREE.BoxGeometry(Lx * 0.07, palletH * 0.6, Wz * 0.95), kit.woodDark);
    blk.position.set(i * Lx * 0.4, -Hy / 2 + palletH * 0.36 + palletH * 0.3, 0);
    blk.castShadow = true;
    g.add(blk);
  }

  /* 白色瓦楞箱体 */
  const transparent = o.opacity != null && o.opacity < 1;
  const bodyMat = o.bodyMat || new THREE.MeshPhysicalMaterial({
    color: 0xd8e1ec, roughness: 0.5, metalness: 0.03, clearcoat: 0.45, clearcoatRoughness: 0.3,
    emissive: 0xe2e9f2, emissiveIntensity: transparent ? 0.05 : 0.03, envMapIntensity: 0.22,
    transparent, opacity: o.opacity != null ? o.opacity : 1,
    side: THREE.FrontSide, depthWrite: !transparent
  });
  if (o.ribs) bodyMat.map = o.ribs;
  const body = new THREE.Mesh(new THREE.BoxGeometry(Lx * 0.99, bodyH, Wz * 0.99), bodyMat);
  body.position.y = (bodyY0 + bodyY1) / 2;
  body.castShadow = body.receiveShadow = true;
  g.add(body); shellParts.push(body);

  /* 上下金属框（略宽于箱体） */
  const fT = new THREE.Mesh(new THREE.BoxGeometry(Lx * 1.01, Math.max(Hy * 0.022, 18), Wz * 1.01), kit.frame);
  fT.position.y = bodyY1 - Math.max(Hy * 0.022, 18) / 2;
  g.add(fT); shellParts.push(fT);
  const fB = new THREE.Mesh(new THREE.BoxGeometry(Lx * 1.01, Math.max(Hy * 0.02, 16), Wz * 1.01), kit.frame);
  fB.position.y = bodyY0 + Math.max(Hy * 0.02, 16) / 2;
  g.add(fB); shellParts.push(fB);

  /* 四角金属立柱，勾出框架结构 */
  const pr = Math.min(Lx, Wz) * 0.026;
  for (let sx = -1; sx <= 1; sx += 2)
    for (let sz = -1; sz <= 1; sz += 2) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(pr * 2, bodyH + Math.max(Hy * 0.022, 18), pr * 2), kit.frame);
      post.position.set(sx * (Lx / 2 - pr), (bodyY0 + bodyY1) / 2, sz * (Wz / 2 - pr));
      post.castShadow = true;
      g.add(post); shellParts.push(post);
    }

  /* 正面门板：右侧两道门闩把手（贴近实物照片） */
  const latchMat = new THREE.MeshStandardMaterial({ color: 0xe2e8ef, roughness: 0.5, metalness: 0.2 });
  for (let k = 0; k < 2; k++) {
    const latch = new THREE.Mesh(new THREE.BoxGeometry(Lx * 0.03, bodyH * 0.05, Wz * 0.05), latchMat);
    latch.position.set(Lx * 0.40, bodyY0 + bodyH * (0.30 + k * 0.26), Wz / 2 * 1.001);
    g.add(latch); shellParts.push(latch);
  }

  /* 客户品牌标：按原始比例横贴箱面，像印刷品牌 */
  if (o.logo) {
    const aspect = o.logoAspect || BRAND_LOGO_ASPECT;
    const lw = (o.logoScale != null ? o.logoScale : 0.66) * Lx;
    const lh = lw / aspect;
    const lp = new THREE.Mesh(
      new THREE.PlaneGeometry(lw, lh),
      new THREE.MeshBasicMaterial({ map: o.logo, transparent: true, opacity: 0.96, depthWrite: false })
    );
    lp.position.set(0, (bodyY0 + bodyY1) / 2 + bodyH * 0.05, Wz / 2 * 1.002);
    g.add(lp); shellParts.push(lp);
  }

  return { group: g, shellParts, body };
}

/* 裸木托盘底座：与「华人托盘箱」同款木质（kit.wood / kit.woodDark），
   结构 = 顶面平板 + 3 根垫墩（留叉车孔），总高 palletH（默认 200mm）。
   origin 在托盘底面中心，便于直接摆到地面/柜底。 */
function makeWoodPallet(Lx, Wz, palletH, kit) {
  const g = new THREE.Group();
  const deck = new THREE.Mesh(new THREE.BoxGeometry(Lx * 0.99, palletH * 0.30, Wz * 0.99), kit.wood);
  deck.position.y = palletH - palletH * 0.15;
  deck.castShadow = deck.receiveShadow = true;
  g.add(deck);
  for (let i = -1; i <= 1; i++) {
    const blk = new THREE.Mesh(new THREE.BoxGeometry(Lx * 0.07, palletH * 0.55, Wz * 0.95), kit.woodDark);
    blk.position.set(i * Lx * 0.4, palletH * 0.275, 0);
    blk.castShadow = true;
    g.add(blk);
  }
  return g;
}

/* 把一组产品箱码放到木托盘上，返回 group（origin 在托盘底面中心）。
   onBox(mesh, x, y, z, i) 用于登记到拆分/点击系统。 */
function buildPalletLoad(loadL, loadW, palletH, groups, color, kit, onBox) {
  const g = new THREE.Group();
  g.add(makeWoodPallet(loadL, loadW, palletH, kit));

  const L = layout({ groups: groups });
  const offX = -loadL / 2 + (loadL - L.env[0]) / 2 - L.mn[0];
  const offZ = -loadW / 2 + (loadW - L.env[2]) / 2 - L.mn[2];
  const offY = palletH - L.mn[1];

  const mat = new THREE.MeshStandardMaterial({
    color: color, roughness: 0.42, metalness: 0.14,
    emissive: color, emissiveIntensity: 0.07, envMapIntensity: 0.28
  });
  const edgeMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.16 });
  const geos = groups.map(gp => new THREE.BoxGeometry(gp.b[0] * 0.985, gp.b[1] * 0.985, gp.b[2] * 0.985));
  const edgeGeos = geos.map(geo => new THREE.EdgesGeometry(geo));

  L.list.forEach((it, i) => {
    const px = it.p[0] + offX, py = it.p[1] + offY, pz = it.p[2] + offZ;
    const m = new THREE.Mesh(geos[it.gi], mat);
    m.castShadow = m.receiveShadow = true;
    m.position.set(px, py, pz);
    m.add(new THREE.LineSegments(edgeGeos[it.gi], edgeMat));
    g.add(m);
    if (onBox) onBox(m, px, py, pz, i);
  });
  return g;
}

/* 保温集装箱外壳：半透明白色箱体 + 黄色角件 + 制冷机组 + 侧壁品牌字 */
function makeContainerShell(dims, kit, o) {
  o = o || {};
  const Lx = dims[0], Hy = dims[1], Wz = dims[2];
  const g = new THREE.Group();
  const shellParts = [];

  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: 0xf4f8fc, roughness: 0.55, metalness: 0.04, clearcoat: 0.55, clearcoatRoughness: 0.25,
    emissive: 0xdfe9f2, emissiveIntensity: 0.12, envMapIntensity: 0.85,
    transparent: true, opacity: o.opacity != null ? o.opacity : 0.2,
    side: THREE.FrontSide, depthWrite: false
  });
  if (o.ribs) bodyMat.map = o.ribs;
  const bodyGeo = new THREE.BoxGeometry(Lx, Hy, Wz);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  g.add(body); shellParts.push(body);

  /* 冷柜棱线，勾出白色箱体轮廓 */
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(bodyGeo),
    new THREE.LineBasicMaterial({ color: 0xe4eef7, transparent: true, opacity: 0.55 })
  );
  g.add(edges); shellParts.push(edges);

  /* 8 个黄色角件 */
  const cw = Math.min(Wz, Lx) * 0.05, ch = Hy * 0.05, cd = Math.min(Wz, Lx) * 0.05;
  for (let sx = -1; sx <= 1; sx += 2)
    for (let sy = -1; sy <= 1; sy += 2)
      for (let sz = -1; sz <= 1; sz += 2) {
        const c = new THREE.Mesh(new THREE.BoxGeometry(cw * 2, ch, cd * 2), kit.yellow);
        c.position.set(sx * (Lx / 2 - cw), sy * (Hy / 2 - ch / 2), sz * (Wz / 2 - cd));
        g.add(c); shellParts.push(c);
      }

  /* 制冷机组（前端 -x） */
  const ruW = Lx * 0.055;
  const ru = new THREE.Mesh(new THREE.BoxGeometry(ruW, Hy * 0.84, Wz * 0.9), kit.white);
  ru.position.set(-Lx / 2 + ruW / 2, 0, 0);
  g.add(ru); shellParts.push(ru);
  const grille = new THREE.Mesh(new THREE.PlaneGeometry(Wz * 0.52, Hy * 0.34), kit.dark);
  grille.position.set(-Lx / 2 + ruW + 0.6, Hy * 0.12, 0);
  grille.rotation.y = Math.PI / 2;
  g.add(grille); shellParts.push(grille);

  /* 侧壁品牌标：按原始比例横贴，两侧各一（柜体两侧均有印刷） */
  if (o.brand) {
    const aspect = o.brandAspect || BRAND_LOGO_ASPECT;
    const lw = Lx * 0.24;
    const lh = lw / aspect;
    for (let sz = -1; sz <= 1; sz += 2) {
      const lp = new THREE.Mesh(
        new THREE.PlaneGeometry(lw, lh),
        new THREE.MeshBasicMaterial({ map: o.brand, transparent: true, opacity: 0.9, depthWrite: false })
      );
      lp.position.set(Lx * 0.10, Hy * 0.34, sz * (Wz * 0.5 + 0.6));
      if (sz < 0) lp.rotation.y = Math.PI;
      g.add(lp); shellParts.push(lp);
    }
  }

  return { group: g, shellParts };
}

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
  renderer.toneMappingExposure = 1.04;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 1, 1e7);
  const world = new THREE.Group();
  scene.add(world);

  /* --- 程序化影棚环境（IBL 反射，让材质更「实拍」）--- */
  try {
    if (THREE.PMREMGenerator) {
      const pmrem = new THREE.PMREMGenerator(renderer);
      const et = makeEnvTexture();
      const rt = pmrem.fromEquirectangular(et);
      scene.environment = rt.texture;
      et.dispose();
      pmrem.dispose();
    }
  } catch (e) { /* 环境贴图可选，失败不影响渲染 */ }

  /* --- 灯光 --- */
  const hemi = new THREE.HemisphereLight(0xa9d8ff, 0x060a12, 0.34);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffffff, 1.18);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0008;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x5be7ff, 0.32);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0x8b8cff, 0.30);
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
  let fitDim = null;

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
    const real = !!opt.realistic;
    const mode = s.mode || '';
    const isCt = s.cont.key === 'ct';
    const isPallet = s.cont.key === 'huaren' || s.cont.key === 'tp';

    /* 取景基准：实物模式下按「外径」框住整套箱体/柜体。
       裸托盘场景要把产品堆码高度也算进去，否则会裁掉上半截。 */
    let fitC;
    if (real) {
      if (mode === 'openPallet') fitC = [s.cont.outer[0], s.cont.outer[1] + L.env[1], s.cont.outer[2]];
      else fitC = s.cont.outer;
    } else fitC = C;
    fitDim = fitC;
    radius = Math.sqrt(fitC[0] * fitC[0] + fitC[1] * fitC[1] + fitC[2] * fitC[2]) / 2;

    /* 底面（承接投影） */
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(fitC[0], fitC[2]),
      new THREE.MeshStandardMaterial({ color: 0x0c1728, roughness: 0.72, metalness: isCt && real ? 0.24 : 0.0 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -fitC[1] / 2 + 0.6;
    floor.receiveShadow = true;
    world.add(floor);

    /* 包络在容器内居中（长、宽均分余量），高度贴底码放 */
    const off = [
      -C[0] / 2 + (C[0] - L.env[0]) / 2 - L.mn[0],
      -C[1] / 2 - L.mn[1],
      -C[2] / 2 + (C[2] - L.env[2]) / 2 - L.mn[2]
    ];

    /* 堆垛几何中心：拆分视图以此为原点向外散开 */
    const ctr = new THREE.Vector3(0, -C[1] / 2 + L.env[1] / 2, 0);

    const n = L.n;
    const step = Math.min(0.055, 1.05 / n);

    /* 把一件货物加到世界并登记装箱动画 */
    const pushBox = (mesh, px, py, pz, i) => {
      world.add(mesh);
      boxes.push({
        mesh,
        base: new THREE.Vector3(px, py, pz),
        dir: new THREE.Vector3(px - ctr.x, py - ctr.y, pz - ctr.z).multiplyScalar(1.22),
        delay: i * step
      });
    };

    if (!real) {
      /* ========== 首屏 hero：保持原来的抽象表现 ========== */
      const shellGeo = new THREE.BoxGeometry(C[0], C[1], C[2]);
      const shell = new THREE.Mesh(shellGeo, new THREE.MeshPhysicalMaterial({
        color: 0x9fd8ff, metalness: 0.0, roughness: 0.22,
        transparent: true, opacity: shellVisible ? 0.045 : 0.0,
        side: THREE.FrontSide, depthWrite: false
      }));
      shell.name = 'shell';
      world.add(shell);

      const shellEdge = new THREE.LineSegments(
        new THREE.EdgesGeometry(shellGeo),
        new THREE.LineBasicMaterial({ color: 0x63e6ff, transparent: true, opacity: 0.7 })
      );
      shellEdge.name = 'shellEdge';
      world.add(shellEdge);

      const mat = new THREE.MeshStandardMaterial({
        color: s.color, roughness: 0.38, metalness: 0.16,
        emissive: s.color, emissiveIntensity: 0.05
      });
      const edgeMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22 });
      const geos = s.groups.map(g => new THREE.BoxGeometry(g.b[0] * 0.972, g.b[1] * 0.972, g.b[2] * 0.972));
      const edgeGeos = geos.map(g => new THREE.EdgesGeometry(g));

      L.list.forEach((it, i) => {
        const px = it.p[0] + off[0], py = it.p[1] + off[1], pz = it.p[2] + off[2];
        const m = new THREE.Mesh(geos[it.gi], mat);
        m.castShadow = m.receiveShadow = true;
        m.position.set(px, py, pz);
        m.add(new THREE.LineSegments(edgeGeos[it.gi], edgeMat));
        pushBox(m, px, py, pz, i);
      });

    } else {
      /* ========== 三维推演舞台：实物表现 ========== */
      const kit = makeKit();

      if (mode === 'openPallet') {
        /* --- V3：产品箱直接码放在裸木托盘上 --- */
        const pl = CONT.pallet;
        /* 相机看向世界原点，取景框高度 = 托盘 + 堆码高度，
           所以「托盘」和「产品箱」都必须整体下移 h/2，
           否则堆码顶部会被裁掉（pushBox 直接挂到 world，需在回调里同步偏移） */
        const yOff = -fitC[1] / 2;
        const load = buildPalletLoad(
          pl.outer[0], pl.outer[2], pl.outer[1],
          s.groups, s.color, kit,
          (m, x, y, z, i) => pushBox(m, x, y + yOff, z, i)
        );
        load.position.y = yOff;
        world.add(load);

      } else if (isPallet) {
        /* --- 产品装箱视图：托盘箱作为外壳 --- */
        const pb = makePalletBox(s.cont.outer, kit, {
          opacity: 0.24,
          ribs: corrugationTexture('#d5dfea', '#7f93a8', Math.max(14, Math.round(s.cont.outer[0] / 55))),
          logo: brandLogoTex(), logoAspect: BRAND_LOGO_ASPECT, logoScale: 0.66
        });
        pb.shellParts.forEach(m => { m.name = 'shellPart'; });
        world.add(pb.group);

        /* 内部产品箱：还原「原版深色」配方 —— 纯产品本色 + 同色微自发光，
           让颜色厚重饱和（不被白色漂淡），并压低环境反射避免发虚 */
        const mat = new THREE.MeshStandardMaterial({
          color: s.color, roughness: 0.42, metalness: 0.14,
          emissive: s.color, emissiveIntensity: 0.07, envMapIntensity: 0.28
        });
        const edgeMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.16 });
        const geos = s.groups.map(g => new THREE.BoxGeometry(g.b[0] * 0.985, g.b[1] * 0.985, g.b[2] * 0.985));
        const edgeGeos = geos.map(g => new THREE.EdgesGeometry(g));

        L.list.forEach((it, i) => {
          const px = it.p[0] + off[0], py = it.p[1] + off[1], pz = it.p[2] + off[2];
          const m = new THREE.Mesh(geos[it.gi], mat);
          m.castShadow = m.receiveShadow = true;
          m.position.set(px, py, pz);
          m.add(new THREE.LineSegments(edgeGeos[it.gi], edgeMat));
          pushBox(m, px, py, pz, i);
        });

      } else if (isCt && mode === 'containerOpenPallet') {
        /* --- V3：整柜装裸木托盘，每托带产品堆码 --- */
        const cs = makeContainerShell(s.cont.outer, kit, {
          opacity: 0.24,
          ribs: corrugationTexture('#f7fbfe', '#bfcbda', Math.max(18, Math.round(s.cont.outer[0] / 200))),
          brand: brandLogoTex(), brandAspect: BRAND_LOGO_ASPECT
        });
        cs.shellParts.forEach(m => { m.name = 'shellPart'; });
        world.add(cs.group);

        const pl = CONT.pallet;
        const plLoad = s.palletLoad || { groups: s.groups, color: s.color };
        L.list.forEach((it, i) => {
          const cx = it.p[0] + off[0];
          const cz = it.p[2] + off[2];
          /* 托盘原点在底面中心，所以取「槽位底面」而不是槽位中心 ——
             双层码放时上层才会落在下层托盘顶面上，而不是和下层重叠。 */
          const cy = (it.p[1] - it.b[1] / 2) + off[1];
          const unit = buildPalletLoad(
            pl.outer[0], pl.outer[2], pl.outer[1],
            plLoad.groups, (plLoad.color != null ? plLoad.color : s.color), kit
          );
          unit.position.set(cx, cy, cz);
          /* 槽位是「转 90°」的（长边沿柜宽），托盘本体也要跟着转，
             否则 1200 长边会横穿到后一排去。 */
          if (it.b[0] < it.b[2]) unit.rotation.y = Math.PI / 2;
          world.add(unit);
          pushBox(unit, cx, cy, cz, i);
        });

      } else if (isCt) {
        /* --- 整柜视图：实物保温箱 + 实物托盘箱裸装 --- */
        const cs = makeContainerShell(s.cont.outer, kit, {
          opacity: 0.24,
          ribs: corrugationTexture('#f7fbfe', '#bfcbda', Math.max(18, Math.round(s.cont.outer[0] / 200))),
          brand: brandLogoTex(), brandAspect: BRAND_LOGO_ASPECT
        });
        cs.shellParts.forEach(m => { m.name = 'shellPart'; });
        world.add(cs.group);

        /* 共享一套货物材质，避免 18 件重复建材质 */
        const itemBodyMat = new THREE.MeshPhysicalMaterial({ color: 0xdbe4ef, roughness: 0.5, metalness: 0.03, clearcoat: 0.4, envMapIntensity: 0.22 });
        const itemLogo = brandLogoTex();

        L.list.forEach((it, i) => {
          const px = it.p[0] + off[0], py = it.p[1] + off[1], pz = it.p[2] + off[2];
          const pb = makePalletBox(it.b, kit, {
            bodyMat: itemBodyMat, logo: itemLogo, logoAspect: BRAND_LOGO_ASPECT, logoScale: 0.6
          });
          pb.group.position.set(px, py, pz);
          pushBox(pb.group, px, py, pz, i);
        });
      }

      /* 让「外壳」按钮状态对新建的实物外壳同样生效 */
      world.traverse(o => { if (o.name === 'shellPart') o.visible = shellVisible; });
    }

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
    const C = fitDim || current.cont.inner;
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
    const fitFill = (opt.fitFill != null ? opt.fitFill : 0.82);
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
        d = d * (mx / fitFill);
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
      world.traverse(o => {
        if (o.name === 'shell') o.material.opacity = v ? 0.045 : 0.0;
        if (o.name === 'shellEdge') o.material.opacity = v ? 0.7 : 0.0;
        if (o.name === 'shellPart') o.visible = v;
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

  const viewer = createViewer(canvas, { az: 0.66, realistic: true });
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
      ['lay', `每层 <b>${c.perLayer}</b> 件 · <b>${c.layers}</b> 层`],
      ['pieces', `${s.pieceLabel} <b>${c.n}</b>`],
      ['units', s.alt ? `装载 <b>${fmt(c.units)}</b> ${s.unitLabel}（全 ${s.item.short}）` : `装载 <b>${fmt(c.units)}</b> ${s.unitLabel}`],
      s.alt ? ['units2', `装载 <b>${fmt(c.altUnits)}</b> ${s.unitLabel}（全 ${s.alt.short}）`] : null,
      ['util', `空间利用 <b>${(c.util * 100).toFixed(1)}%</b>`]
    ].filter(Boolean).map(([k, t]) => `<span class="hud-chip" data-k="${k}">${t}</span>`).join('');

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
  /* 首屏同样走实物渲染：40 尺冷柜 + 装进柜内的华人托盘箱 */
  const v = createViewer(canvas, { az: 0.8, el: 0.3, autoRotate: true, realistic: true, fitFill: 0.9 });
  /* 首屏用整柜场景（顺序调整后索引会变，按容器类型取，别写死下标） */
  const heroScene = SCENES.find(s => s.cont && s.cont.key === 'ct') || SCENES[SCENES.length - 1];
  v.load(heroScene);
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
