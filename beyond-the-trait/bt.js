/* =============================================================================
   Beyond the Trait — interactive figures
   Plain JavaScript + SVG, no libraries. Every figure is a function in VIZ,
   mounted into <div class="viz" data-viz="NAME"> in index.html.
   Numbers are the paper's own unless a figure note says "simulated" or
   "illustration".
   ========================================================================== */
(function () {
  "use strict";

  /* ------------------------------------------------------------ basics --- */
  var SVGNS = "http://www.w3.org/2000/svg";
  var RM = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var C = {
    cold: "#2F6BA8", hot: "#C2413A", neutral: "#7A8691",
    money: "#2F6BA8", healthy: "#0E8F72", unhealthy: "#B97800",
    drink: "#C2413A", smoke: "#6A55C8",
    axState: "#0E8F72", axPerson: "#6A55C8", axGood: "#B97800",
    plan: "#2F6BA8", act: "#B97800",
    navy: "#0F2438", gold: "#C8A253", ink: "#141A20", ink2: "#3A444E", muted: "#6C7783",
    grid: "#E9EDF1", axis: "#B9C2CB", rule: "#E4E9ED", paper2: "#F7F9FB",
    reject: "#B8322F", amber: "#9A6A00", nul: "#5F6B77", ok: "#147A3C"
  };

  function h(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === undefined || v === null || v === false) return;
      if (k === "text") n.textContent = v;
      else if (k === "html") n.innerHTML = v;           // static, author-written strings only
      else if (k === "class") n.className = v;
      else if (k.slice(0, 2) === "on") n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? "" : v);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  }
  function s(tag, attrs, parent) {
    var n = document.createElementNS(SVGNS, tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === undefined || v === null || v === false) return;
      if (k === "text") n.textContent = v;
      else n.setAttribute(k, v);
    });
    if (parent) parent.appendChild(n);
    return n;
  }
  function svgRoot(holder, w, hgt, label) {
    holder.textContent = "";
    var root = s("svg", { width: w, height: hgt, viewBox: "0 0 " + w + " " + hgt, role: "img", "aria-label": label || "" }, holder);
    return root;
  }
  function lin(d0, d1, r0, r1) {
    var f = function (v) { return r0 + (v - d0) / (d1 - d0) * (r1 - r0); };
    f.inv = function (p) { return d0 + (p - r0) / (r1 - r0) * (d1 - d0); };
    f.d = [d0, d1]; f.r = [r0, r1];
    return f;
  }
  function range(a, b, step) { var out = []; for (var v = a; v <= b + step * 1e-6; v += step) out.push(+v.toFixed(10)); return out; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  var MINUS = "−";
  function fmt(v, d) { d = d === undefined ? 2 : d; var t = Math.abs(v).toFixed(d); return (v < 0 && +t !== 0 ? MINUS : "") + t; }
  function fmtS(v, d) { d = d === undefined ? 2 : d; var t = Math.abs(v).toFixed(d); return (+t === 0 ? "" : v < 0 ? MINUS : "+") + t; }
  function fmtB(v) { return v.toFixed(2); }
  function pct(v, d) { return (v * 100).toFixed(d || 0) + "%"; }

  // seeded random numbers, so simulations are reproducible between reloads
  function rng(seed) {
    var a = seed >>> 0;
    var u = function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    var spare = null;
    u.norm = function () {
      if (spare !== null) { var v = spare; spare = null; return v; }
      var x, y, r; do { x = u() * 2 - 1; y = u() * 2 - 1; r = x * x + y * y; } while (r === 0 || r >= 1);
      var m = Math.sqrt(-2 * Math.log(r) / r); spare = y * m; return x * m;
    };
    return u;
  }
  function mean(a) { var t = 0; for (var i = 0; i < a.length; i++) t += a[i]; return t / a.length; }
  function sd(a) { var m = mean(a), t = 0; for (var i = 0; i < a.length; i++) t += (a[i] - m) * (a[i] - m); return Math.sqrt(t / (a.length - 1)); }
  function corr(a, b) {
    var ma = mean(a), mb = mean(b), sab = 0, saa = 0, sbb = 0;
    for (var i = 0; i < a.length; i++) { sab += (a[i] - ma) * (b[i] - mb); saa += (a[i] - ma) * (a[i] - ma); sbb += (b[i] - mb) * (b[i] - mb); }
    return sab / Math.sqrt(saa * sbb);
  }

  // tween: calls step(t in 0..1) over ms milliseconds (instant under reduced motion)
  function tween(ms, step, done) {
    if (RM || ms <= 0) { step(1); if (done) done(); return function () {}; }
    var t0 = null, stop = false;
    function frame(ts) {
      if (stop) return;
      if (t0 === null) t0 = ts;
      var t = Math.min(1, (ts - t0) / ms);
      step(t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
      if (t < 1) requestAnimationFrame(frame); else if (done) done();
    }
    requestAnimationFrame(frame);
    return function () { stop = true; };
  }

  /* ------------------------------------------------------------ tooltip --- */
  var tipEl = document.querySelector("[data-tip]");
  function showTip(lines, x, y) {
    if (!tipEl) return;
    tipEl.textContent = "";
    lines.forEach(function (ln) {
      if (ln.title) { tipEl.appendChild(h("div", { style: "font-weight:600;color:#141A20;margin-bottom:3px", text: ln.title })); return; }
      if (ln.v !== undefined) tipEl.appendChild(h("div", { class: "tv", text: ln.v }));
      if (ln.l) {
        var row = h("div", { class: "tl" });
        if (ln.c) row.appendChild(h("i", { style: "border-color:" + ln.c }));
        row.appendChild(document.createTextNode(ln.l));
        tipEl.appendChild(row);
      }
      if (ln.note) tipEl.appendChild(h("div", { style: "margin-top:4px;color:#6C7783;font-size:11.5px", text: ln.note }));
    });
    tipEl.classList.add("on");
    var r = tipEl.getBoundingClientRect();
    var px = x + 14, py = y + 14;
    if (px + r.width > window.innerWidth - 8) px = x - r.width - 14;
    if (py + r.height > window.innerHeight - 8) py = y - r.height - 14;
    tipEl.style.left = Math.max(8, px) + "px";
    tipEl.style.top = Math.max(8, py) + "px";
  }
  function hideTip() { if (tipEl) tipEl.classList.remove("on"); }
  // attach hover + keyboard focus behaviour to an SVG node (the hit target)
  function tip(node, lines, label) {
    node.setAttribute("tabindex", "0");
    node.setAttribute("role", "img");
    if (label) node.setAttribute("aria-label", label);
    else node.setAttribute("aria-label", lines.map(function (l) { return [l.title, l.v, l.l, l.note].filter(Boolean).join(" "); }).join("; "));
    node.classList.add("hit");
    node.addEventListener("pointerenter", function (e) { showTip(typeof lines === "function" ? lines() : lines, e.clientX, e.clientY); });
    node.addEventListener("pointermove", function (e) { showTip(typeof lines === "function" ? lines() : lines, e.clientX, e.clientY); });
    node.addEventListener("pointerleave", hideTip);
    node.addEventListener("focus", function () { var b = node.getBoundingClientRect(); showTip(typeof lines === "function" ? lines() : lines, b.right, b.top); });
    node.addEventListener("blur", hideTip);
    return node;
  }
  window.addEventListener("scroll", hideTip, { passive: true });

  /* ------------------------------------------------------------ controls --- */
  function seg(opts, value, onChange, ariaLabel) {
    var wrap = h("div", { class: "seg", role: "group", "aria-label": ariaLabel || "" });
    var btns = opts.map(function (o) {
      var b = h("button", { type: "button", "aria-pressed": String(o.v === value) });
      if (o.sw) b.appendChild(h("span", { class: "sw", style: "background:" + o.sw }));
      b.appendChild(document.createTextNode(o.t));
      b.addEventListener("click", function () { api.set(o.v, true); });
      wrap.appendChild(b);
      return b;
    });
    var api = {
      el: wrap,
      value: value,
      set: function (v, fire) {
        api.value = v;
        btns.forEach(function (b, i) { b.setAttribute("aria-pressed", String(opts[i].v === v)); });
        if (fire && onChange) onChange(v);
      }
    };
    return api;
  }
  var sliderId = 0;
  function slider(o) {
    var id = "sl-" + (++sliderId);
    var input = h("input", { type: "range", id: id, min: o.min, max: o.max, step: o.step, value: o.value });
    var out = h("output", { for: id, text: o.fmt(o.value) });
    var wrap = h("div", { class: "slider" }, [h("label", { for: id, text: o.label }), input, out]);
    input.addEventListener("input", function () { var v = +input.value; out.textContent = o.fmt(v); input.setAttribute("aria-valuetext", o.fmt(v)); o.onInput(v); });
    input.setAttribute("aria-valuetext", o.fmt(o.value));
    return { el: wrap, input: input, set: function (v) { input.value = v; out.textContent = o.fmt(v); } };
  }
  function check(label, checked, onChange) {
    var input = h("input", { type: "checkbox" });
    input.checked = !!checked;
    input.addEventListener("change", function () { onChange(input.checked); });
    return { el: h("label", { class: "check" }, [input, label]), input: input };
  }
  function tile(k, v, accent) {
    var vv = h("span", { class: "v", text: v });
    var el = h("div", { class: "tile" + (accent ? " accent" : "") }, [h("span", { class: "k", text: k }), vv]);
    return { el: el, set: function (t) { vv.textContent = t; }, setHTML: function (t) { vv.innerHTML = t; } };
  }
  function legend(items) {
    return h("div", { class: "legend" }, items.map(function (it) {
      var mark = h("span", { class: it.type || "sw", style: (it.type === "ln" || it.type === "ring" ? "border-color:" : "background:") + it.c + (it.dash ? ";border-top-style:dashed" : "") });
      return h("span", { class: "key" }, [mark, it.t]);
    }));
  }
  function chip(kind, text) {
    var icons = {
      reject: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 3l6 6M9 3l-6 6" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></svg>',
      amber: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 2.2v4.6" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/><circle cx="6" cy="9.3" r="1.1" fill="#fff"/></svg>',
      null: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6h7" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></svg>',
      ok: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6.3l2.3 2.2 4.7-5" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    };
    var c = h("span", { class: "chip " + kind, html: icons[kind] });
    c.appendChild(document.createTextNode(text));
    return c;
  }
  function dataTable(caption, head, rows) {
    var t = h("table");
    t.appendChild(h("thead", null, [h("tr", null, head.map(function (x) { return h("th", { text: x }); }))]));
    var tb = h("tbody");
    rows.forEach(function (r) { tb.appendChild(h("tr", null, r.map(function (x) { return h("td", { text: x }); }))); });
    t.appendChild(tb);
    return h("details", { class: "table" }, [h("summary", { text: caption || "Show the numbers" }), h("div", { class: "tbl-scroll" }, [t])]);
  }

  /* --------------------------------------------- responsive drawing --- */
  // calls draw(width) now and whenever the holder's width changes
  function responsive(holder, draw) {
    var last = -1;
    function run() { var w = Math.floor(holder.clientWidth); if (w > 0 && Math.abs(w - last) > 1) { last = w; draw(w); } }
    if ("ResizeObserver" in window) new ResizeObserver(run).observe(holder);
    else window.addEventListener("resize", run);
    run();
    return function () { last = -1; run(); };
  }

  /* -------------------------------------------------- shared drawing --- */
  // horizontal gridlines with left labels
  function yAxis(g, y, ticks, x0, x1, f, opts) {
    opts = opts || {};
    ticks.forEach(function (t) {
      s("line", { x1: x0, x2: x1, y1: y(t), y2: y(t), class: "grid" }, g);
      s("text", { x: x0 - 8, y: y(t) + 4, "text-anchor": "end", "font-size": 11.5, class: "t-muted", text: f ? f(t) : t }, g);
    });
    if (opts.title) s("text", { x: x0 - 8, y: Math.min(y(ticks[0]), y(ticks[ticks.length - 1])) - 12, "text-anchor": "start", "font-size": 11.5, class: "t-muted", text: opts.title, transform: "" }, g);
  }
  function xAxis(g, x, ticks, y0, y1, f) {
    ticks.forEach(function (t) {
      s("line", { x1: x(t), x2: x(t), y1: y0, y2: y1, class: "grid" }, g);
      s("text", { x: x(t), y: y1 + 16, "text-anchor": "middle", "font-size": 11.5, class: "t-muted", text: f ? f(t) : t }, g);
    });
  }
  // dot with a 2px surface ring
  function dot(g, cx, cy, r, color, hollow) {
    return s("circle", { cx: cx, cy: cy, r: r, fill: hollow ? "#fff" : color, stroke: hollow ? color : "#fff", "stroke-width": 2 }, g);
  }
  function whisker(g, x, y0, y1, color, horizontal, cap) {
    cap = cap === undefined ? 4 : cap;
    if (horizontal) {
      s("line", { x1: y0, x2: y1, y1: x, y2: x, stroke: color, "stroke-width": 2, "stroke-linecap": "round" }, g);
      if (cap) { s("line", { x1: y0, x2: y0, y1: x - cap, y2: x + cap, stroke: color, "stroke-width": 2, "stroke-linecap": "round" }, g); s("line", { x1: y1, x2: y1, y1: x - cap, y2: x + cap, stroke: color, "stroke-width": 2, "stroke-linecap": "round" }, g); }
    } else {
      s("line", { x1: x, x2: x, y1: y0, y2: y1, stroke: color, "stroke-width": 2, "stroke-linecap": "round" }, g);
      if (cap) { s("line", { x1: x - cap, x2: x + cap, y1: y0, y2: y0, stroke: color, "stroke-width": 2, "stroke-linecap": "round" }, g); s("line", { x1: x - cap, x2: x + cap, y1: y1, y2: y1, stroke: color, "stroke-width": 2, "stroke-linecap": "round" }, g); }
    }
  }
  // a column from a baseline with a 4px rounded data-end and square base
  function column(g, x, w, yBase, yVal, color, opacity) {
    var top = Math.min(yBase, yVal), hgt = Math.abs(yVal - yBase);
    var r = Math.min(4, hgt / 2, w / 2);
    var up = yVal < yBase;
    var d;
    if (hgt < 0.5) d = "M" + x + "," + yBase + "h" + w;
    else if (up) d = "M" + x + "," + yBase + "V" + (top + r) + "Q" + x + "," + top + " " + (x + r) + "," + top + "H" + (x + w - r) + "Q" + (x + w) + "," + top + " " + (x + w) + "," + (top + r) + "V" + yBase + "Z";
    else d = "M" + x + "," + yBase + "V" + (yVal - r) + "Q" + x + "," + yVal + " " + (x + r) + "," + yVal + "H" + (x + w - r) + "Q" + (x + w) + "," + yVal + " " + (x + w) + "," + (yVal - r) + "V" + yBase + "Z";
    return s("path", { d: d, fill: color, opacity: opacity === undefined ? 1 : opacity }, g);
  }
  // a horizontal bar from x0 to x1 (rounded data-end on the side away from the baseline)
  function hbar(g, x0, x1, y, hgt, color, opacity) {
    var left = Math.min(x0, x1), w = Math.abs(x1 - x0), r = Math.min(4, w / 2, hgt / 2);
    var d;
    if (w < 0.5) d = "M" + x0 + "," + y + "v" + hgt;
    else if (x1 >= x0) d = "M" + x0 + "," + y + "H" + (x1 - r) + "Q" + x1 + "," + y + " " + x1 + "," + (y + r) + "V" + (y + hgt - r) + "Q" + x1 + "," + (y + hgt) + " " + (x1 - r) + "," + (y + hgt) + "H" + x0 + "Z";
    else d = "M" + x0 + "," + y + "H" + (x1 + r) + "Q" + x1 + "," + y + " " + x1 + "," + (y + r) + "V" + (y + hgt - r) + "Q" + x1 + "," + (y + hgt) + " " + (x1 + r) + "," + (y + hgt) + "H" + x0 + "Z";
    return s("path", { d: d, fill: color, opacity: opacity === undefined ? 1 : opacity }, g);
  }
  function arrowHead(g, x, y, angle, color, size) {
    size = size || 7;
    var a1 = angle + Math.PI * 0.82, a2 = angle - Math.PI * 0.82;
    return s("path", { d: "M" + x + "," + y + "L" + (x + size * Math.cos(a1)) + "," + (y + size * Math.sin(a1)) + "L" + (x + size * Math.cos(a2)) + "," + (y + size * Math.sin(a2)) + "Z", fill: color }, g);
  }
  function wrapText(g, x, y, text, maxW, size, lh, attrs) {
    // simple word-wrap for SVG text using an average glyph width estimate
    var words = text.split(" "), line = "", lines = [];
    var cw = size * 0.53;
    words.forEach(function (wd) {
      var test = line ? line + " " + wd : wd;
      if (test.length * cw > maxW && line) { lines.push(line); line = wd; } else line = test;
    });
    if (line) lines.push(line);
    var t = s("text", Object.assign({ x: x, y: y, "font-size": size }, attrs || {}), g);
    lines.forEach(function (l, i) { s("tspan", { x: x, dy: i === 0 ? 0 : lh, text: l }, t); });
    return lines.length;
  }

  var VIZ = {};

  /* =====================================================================
     HERO — the trait view (one flat β) against a reaction function
     ===================================================================== */
  VIZ.hero = function (node) {
    var animated = false;
    responsive(node, function (w) {
      var H = Math.round(Math.min(w * 0.74, 300));
      var svg = svgRoot(node, w, H, "");
      var m = { l: 30, r: 12, t: 26, b: 44 };
      var x = lin(0, 1, m.l, w - m.r), y = lin(0.64, 1.02, H - m.b, m.t);
      var faint = "rgba(255,255,255,.34)";
      s("line", { x1: m.l, x2: w - m.r, y1: H - m.b, y2: H - m.b, stroke: faint }, svg);
      s("line", { x1: m.l, x2: m.l, y1: m.t - 6, y2: H - m.b, stroke: faint }, svg);
      s("text", { x: m.l - 8, y: m.t - 10, "font-size": 15, fill: "rgba(255,255,255,.8)", "font-style": "italic", "font-family": "Newsreader, serif", text: "β" }, svg);
      s("line", { x1: m.l, x2: w - m.r, y1: y(1), y2: y(1), stroke: "rgba(255,255,255,.2)", "stroke-dasharray": "2 4" }, svg);
      s("text", { x: w - m.r, y: y(1) - 6, "text-anchor": "end", "font-size": 11, fill: "rgba(255,255,255,.5)", text: "β = 1: no present bias" }, svg);
      // the trait view
      s("line", { x1: m.l, x2: w - m.r, y1: y(0.81), y2: y(0.81), stroke: "rgba(255,255,255,.62)", "stroke-width": 1.5, "stroke-dasharray": "6 5" }, svg);
      s("text", { x: m.l + 8, y: y(0.81) + 17, "font-size": 11.5, fill: "rgba(255,255,255,.72)", text: "the trait view: one β" }, svg);
      // the reaction function
      var f = function (v) { return 0.95 - 0.28 * v + 0.03 * v * v; };
      var d = range(0, 1, 0.02).map(function (v, i) { return (i ? "L" : "M") + x(v).toFixed(1) + "," + y(f(v)).toFixed(1); }).join("");
      var path = s("path", { d: d, fill: "none", stroke: "#E0C48A", "stroke-width": 2.6, "stroke-linecap": "round" }, svg);
      s("text", { x: x(0.03), y: y(f(0.03)) - 12, "font-size": 11.5, fill: "#E0C48A", text: "a reaction function" }, svg);
      var pts = [{ v: 0.25, b: 0.88, t: "before work" }, { v: 0.8, b: 0.74, t: "after work" }];
      var dots = pts.map(function (p, i) {
        var g = s("g", { opacity: animated || RM ? 1 : 0 }, svg);
        s("circle", { cx: x(p.v), cy: y(f(p.v)), r: 5.5, fill: "#E0C48A", stroke: "#0F2438", "stroke-width": 2 }, g);
        var cy = y(f(p.v));
        if (i === 0) {   // above-right of the point: the curve falls away below it
          s("text", { x: x(p.v) + 9, y: cy - 10, "font-size": 12.5, fill: "#fff", "font-weight": 600, text: p.b.toFixed(2) }, g);
          s("text", { x: x(p.v) + 9, y: cy - 25, "font-size": 11, fill: "rgba(255,255,255,.66)", text: p.t }, g);
        } else {         // below-left of the point
          s("text", { x: x(p.v) - 9, y: cy + 19, "text-anchor": "end", "font-size": 12.5, fill: "#fff", "font-weight": 600, text: p.b.toFixed(2) }, g);
          s("text", { x: x(p.v) - 9, y: cy + 34, "text-anchor": "end", "font-size": 11, fill: "rgba(255,255,255,.66)", text: p.t }, g);
        }
        return g;
      });
      s("text", { x: m.l, y: H - m.b + 18, "font-size": 11, fill: "rgba(255,255,255,.55)", text: "calm" }, svg);
      s("text", { x: w - m.r, y: H - m.b + 18, "text-anchor": "end", "font-size": 11, fill: "rgba(255,255,255,.55)", text: "hot" }, svg);
      s("text", { x: (m.l + w - m.r) / 2, y: H - m.b + 34, "text-anchor": "middle", "font-size": 11.5, fill: "rgba(255,255,255,.72)", text: "state at the moment of choice" }, svg);
      if (!animated && !RM) {
        var L = path.getTotalLength ? path.getTotalLength() : 0;
        if (L) {
          path.setAttribute("stroke-dasharray", L); path.setAttribute("stroke-dashoffset", L);
          tween(1400, function (t) { path.setAttribute("stroke-dashoffset", L * (1 - t)); }, function () {
            path.removeAttribute("stroke-dasharray"); path.removeAttribute("stroke-dashoffset");
            dots.forEach(function (g, i) { setTimeout(function () { tween(400, function (t) { g.setAttribute("opacity", t); }); }, i * 220); });
          });
        }
      }
      animated = true;
    });
  };

  /* =====================================================================
     FIGURE 1 — same choices, three readings
     ===================================================================== */
  VIZ.readings = function (node) {
    var grid = h("div", { class: "rd-grid" });
    var left = h("div", { class: "rd-left" });
    var right = h("div", { class: "rd-right" });
    grid.appendChild(left); grid.appendChild(right); node.appendChild(grid);

    left.appendChild(h("p", { class: "rd-k", text: "The literature: one β per study" }));
    var stripHolder = h("div");
    left.appendChild(stripHolder);
    left.appendChild(h("p", { class: "rd-t", text: "Published estimates of the “same” parameter run from 0.34 to 1.03." }));

    // positions of the collected estimates as drawn in the paper's Figure 1
    var rows = [
      [0.20, 0.47, 0.60, 0.70, 0.77, 0.85, 0.98, 1.05, 1.13, 1.20, 1.30, 1.43, 1.51, 1.65, 1.77, 1.90, 2.05, 2.17, 2.25, 2.40, 2.55, 2.70, 2.85, 3.00, 3.17, 3.35, 3.50, 3.65, 3.85, 4.05, 4.20, 4.33],
      [2.05, 2.40, 2.75, 3.05, 3.25, 3.55, 3.90, 4.10, 4.25],
      [3.10, 3.35, 3.75, 4.05, 4.20]
    ].map(function (r) { return r.map(function (u) { return 0.4 + (u - 0.55) / 6; }); });

    responsive(stripHolder, function (w) {
      var H = 104, svg = svgRoot(stripHolder, w, H, "Published estimates of beta range from 0.34 to 1.03");
      var x = lin(0.3, 1.1, 8, w - 8), base = 66;
      s("line", { x1: 8, x2: w - 8, y1: base + 8, y2: base + 8, class: "axis" }, svg);
      [0.4, 0.6, 0.8, 1.0].forEach(function (t) {
        s("line", { x1: x(t), x2: x(t), y1: base + 8, y2: base + 12, class: "axis" }, svg);
        s("text", { x: x(t), y: base + 26, "text-anchor": "middle", "font-size": 11.5, class: "t-muted", text: t.toFixed(1) }, svg);
      });
      rows.forEach(function (r, ri) { r.forEach(function (v) { s("circle", { cx: x(v), cy: base - ri * 11, r: 3.6, fill: C.neutral }, svg); }); });
      s("text", { x: x(0.342), y: base - 16, "text-anchor": "start", "font-size": 11.5, class: "t-strong", text: "0.34" }, svg);
      s("text", { x: x(1.03), y: base - 42, "text-anchor": "end", "font-size": 11.5, class: "t-strong", text: "1.03" }, svg);
      tip(s("rect", { x: 0, y: 10, width: w, height: H - 10 }, svg), [{ title: "Published estimates of β" }, { v: "0.34 – 1.03", l: "range across studies (Lockwood, 2020)" }]);
    });

    var panels = {
      state: { t: "State", c: C.axState },
      structure: { t: "Structure", c: C.axPerson },
      good: { t: "Good", c: C.axGood }
    };
    var current = "state";
    var tabs = seg(Object.keys(panels).map(function (k) { return { v: k, t: panels[k].t, sw: panels[k].c }; }), current, function (v) { current = v; redraw(); }, "Reading");
    right.appendChild(h("div", { class: "controls", style: "margin-bottom:8px" }, [tabs.el]));
    var legendSlot = h("div");
    var holder = h("div");
    var text = h("p", { class: "say", style: "margin-top:8px" });
    var link = h("a", { class: "in-paper", href: "#state" });
    right.appendChild(legendSlot); right.appendChild(holder); right.appendChild(text); right.appendChild(link);

    var copy = {
      state: { html: "<b>The same 100 people, before vs after a randomized block of work.</b> The state moves the act, not the plan: <i>β</i> = 0.88 when choosing before work and 0.74 after (<i>p</i> = .008); plans made after work are not lower (<i>p</i> = .27). A state-blind estimate pools the two.", href: "#state", l: "Explore the state result →" },
      structure: { html: "<b>The same 101 people, present bias over effort and over money.</b> Once sampling noise is removed, <i>β</i> varies genuinely across people over effort (s.d. of log <i>β</i> 0.24) and not at all over money (0.00). One parameter cannot be a variable in one setting and a constant in another.", href: "#person", l: "Explore the person result →" },
      good: { html: "<b>The same 697 people, three rewards on one price grid.</b> Money is the <i>most</i> present-biased reward, and within “food” <i>β</i> spans 0.82–0.89 across the snacks people chose: the unit is the pair of person and reward.", href: "#good", l: "Explore the good result →" }
    };

    var redraw = responsive(holder, draw);
    function draw(w) {
      var p = copy[current];
      text.innerHTML = p.html; link.setAttribute("href", p.href); link.textContent = p.l;
      legendSlot.textContent = "";
      if (current === "state") drawState(w);
      else if (current === "structure") drawStructure(w);
      else drawGood(w);
    }
    function drawState(w) {
      legendSlot.appendChild(legend([{ t: "decided before work (cold)", c: C.cold, type: "dt" }, { t: "decided after work (hot)", c: C.hot, type: "dt" }]));
      var H = 230, svg = svgRoot(holder, w, H, "Beta by state: act cold 0.88, act hot 0.74; plan cold 1.00, plan hot 1.04");
      var m = { l: 40, r: 12, t: 14, b: 40 };
      var y = lin(0.6, 1.15, H - m.b, m.t);
      yAxis(svg, y, [0.6, 0.7, 0.8, 0.9, 1.0, 1.1], m.l, w - m.r, function (t) { return t.toFixed(1); });
      var cw = (w - m.l - m.r) / 2;
      var cats = [
        { t: "the act (today)", pts: [{ v: 0.882, lo: 0.802, hi: 0.966, c: C.cold, l: "β, decided cold" }, { v: 0.736, lo: 0.649, hi: 0.822, c: C.hot, l: "β, decided hot" }] },
        { t: "the plan (days ahead)", pts: [{ v: 1.0, c: C.cold, l: "plan made cold (reference)", ref: true }, { v: 1.039, lo: 0.964, hi: 1.111, c: C.hot, l: "plan made hot, relative to cold" }] }
      ];
      cats.forEach(function (cat, ci) {
        var cx = m.l + cw * ci + cw / 2;
        s("text", { x: cx, y: H - m.b + 22, "text-anchor": "middle", "font-size": 12.5, class: "t-ink", text: cat.t }, svg);
        cat.pts.forEach(function (p, pi) {
          var px = cx + (pi === 0 ? -22 : 22);
          if (p.lo !== undefined) whisker(svg, px, y(p.lo), y(p.hi), p.c);
          dot(svg, px, y(p.v), 5.5, p.c, p.ref);
          s("text", { x: px + (pi === 0 ? -10 : 10), y: y(p.v) + 4, "text-anchor": pi === 0 ? "end" : "start", "font-size": 12, class: "t-strong", text: p.v.toFixed(2) }, svg);
          tip(s("rect", { x: px - 14, y: y(p.hi || p.v) - 10, width: 28, height: Math.abs(y(p.lo || p.v) - y(p.hi || p.v)) + 20 }, svg),
            [{ v: p.v.toFixed(2), l: p.l, c: p.c, note: p.lo !== undefined ? "95% interval " + p.lo.toFixed(2) + " – " + p.hi.toFixed(2) : "the cold plan is the reference" }]);
        });
        if (ci === 0) {
          s("line", { x1: cx - 40, x2: cx + 40, y1: y(0.835), y2: y(0.835), stroke: C.ink, "stroke-width": 1.5, "stroke-dasharray": "3 3" }, svg);
          s("text", { x: cx + 44, y: y(0.835) + 4, "font-size": 11.5, class: "t-muted", text: "pooled: 0.83" }, svg);
        }
      });
    }
    function drawStructure(w) {
      legendSlot.appendChild(legend([{ t: "over effort", c: C.axPerson, type: "sw" }, { t: "over money", c: C.money, type: "sw" }]));
      var H = 250, svg = svgRoot(holder, w, H, "True dispersion of individual beta: standard deviation 0.24 over effort, 0.00 over money");
      var m = { l: 14, r: 14, t: 26, b: 40 };
      var x = lin(0.4, 1.6, m.l, w - m.r);
      var rowH = (H - m.t - m.b) / 2;
      var mu = Math.log(0.876), sg = 0.237;
      var dens = function (b) { var z = (Math.log(b) - mu) / sg; return Math.exp(-0.5 * z * z) / (b * sg * Math.sqrt(2 * Math.PI)); };
      var peak = dens(Math.exp(mu - sg * sg));
      var base1 = m.t + rowH - 14, base2 = m.t + 2 * rowH - 6;
      // effort density
      var pts = range(0.42, 1.58, 0.01);
      var dpath = "M" + x(pts[0]) + "," + base1 + pts.map(function (b) { return "L" + x(b).toFixed(1) + "," + (base1 - dens(b) / peak * (rowH - 22)).toFixed(1); }).join("") + "L" + x(pts[pts.length - 1]) + "," + base1 + "Z";
      s("path", { d: dpath, fill: C.axPerson, "fill-opacity": 0.12, stroke: C.axPerson, "stroke-width": 2 }, svg);
      s("line", { x1: m.l, x2: w - m.r, y1: base1, y2: base1, class: "axis" }, svg);
      s("text", { x: m.l, y: m.t - 8, "font-size": 12, class: "t-ink", text: "over effort: s.d. of log β = 0.24" }, svg);
      // money spike
      s("line", { x1: m.l, x2: w - m.r, y1: base2, y2: base2, class: "axis" }, svg);
      s("line", { x1: x(0.987), x2: x(0.987), y1: base2, y2: base1 + 34, stroke: C.money, "stroke-width": 3, "stroke-linecap": "round" }, svg);
      s("text", { x: m.l, y: base1 + 24, "font-size": 12, class: "t-ink", text: "over money: s.d. = 0.00 — everyone at 0.99" }, svg);
      [0.5, 0.75, 1.0, 1.25, 1.5].forEach(function (t) { s("text", { x: x(t), y: base2 + 18, "text-anchor": "middle", "font-size": 11.5, class: "t-muted", text: t.toFixed(2) }, svg); s("line", { x1: x(t), x2: x(t), y1: base2, y2: base2 + 4, class: "axis" }, svg); });
      s("text", { x: (m.l + w - m.r) / 2, y: H - 4, "text-anchor": "middle", "font-size": 11.5, class: "t-muted", text: "individual β, sampling noise removed (same 101 people)" }, svg);
      tip(s("rect", { x: m.l, y: m.t, width: w - m.l - m.r, height: rowH - 6 }, svg), [{ v: "0.24", l: "true s.d. of log β over effort", c: C.axPerson, note: "95% interval 0.16 – 0.32; mean β 0.88" }]);
      tip(s("rect", { x: m.l, y: m.t + rowH, width: w - m.l - m.r, height: rowH - 6 }, svg), [{ v: "0.00", l: "true s.d. of log β over money", c: C.money, note: "95% interval 0 – 0.04; mean β 0.99" }]);
    }
    function drawGood(w) {
      var H = 230, svg = svgRoot(holder, w, H, "Beta by good: money 0.82, healthy food 0.85, unhealthy food 0.86");
      var m = { l: 40, r: 12, t: 14, b: 40 };
      var y = lin(0.76, 0.92, H - m.b, m.t);
      yAxis(svg, y, [0.76, 0.80, 0.84, 0.88, 0.92], m.l, w - m.r, function (t) { return t.toFixed(2); });
      var goods = [
        { t: "money", v: 0.820, lo: 0.784, hi: 0.855, c: C.money },
        { t: "healthy food", v: 0.852, lo: 0.808, hi: 0.893, c: C.healthy },
        { t: "unhealthy food", v: 0.861, lo: 0.819, hi: 0.900, c: C.unhealthy }
      ];
      var cw = (w - m.l - m.r) / 3;
      goods.forEach(function (g, i) {
        var cx = m.l + cw * i + cw / 2;
        whisker(svg, cx, y(g.lo), y(g.hi), g.c);
        dot(svg, cx, y(g.v), 6, g.c);
        s("text", { x: cx + 11, y: y(g.v) + 4, "font-size": 12, class: "t-strong", text: g.v.toFixed(2) }, svg);
        s("text", { x: cx, y: H - m.b + 22, "text-anchor": "middle", "font-size": 12.5, class: "t-ink", text: g.t }, svg);
        tip(s("rect", { x: cx - 18, y: y(g.hi) - 8, width: 36, height: y(g.lo) - y(g.hi) + 16 }, svg), [{ v: g.v.toFixed(3), l: "β over " + g.t, c: g.c, note: "95% interval " + g.lo.toFixed(3) + " – " + g.hi.toFixed(3) }]);
      });
    }
  };

  /* =====================================================================
     FIGURE 2 — the plan-versus-act simulator
     ===================================================================== */
  VIZ.vantage = function (node) {
    var st = { beta: 0.8, W: 20, b: 0.65 };
    var ctr = h("div", { class: "controls" });
    var sB = slider({ label: "Present bias β", min: 0.5, max: 1, step: 0.01, value: st.beta, fmt: fmtB, onInput: function (v) { st.beta = v; redraw(); } });
    var sW = slider({ label: "Piece rate", min: 1, max: 35, step: 1, value: st.W, fmt: function (v) { return v + "¢"; }, onInput: function (v) { st.W = v; redraw(); } });
    var sb = slider({ label: "Effort’s response to pay, b", min: 0.3, max: 1.5, step: 0.05, value: st.b, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { st.b = v; redraw(); } });
    ctr.appendChild(sB.el); ctr.appendChild(sW.el); ctr.appendChild(sb.el);
    node.appendChild(ctr);
    var holder = h("div"); node.appendChild(holder);
    var tPlan = tile("Planned for the work date", ""), tAct = tile("Done on the day", ""), tTheta = tile("Log-wedge θ = log act − log plan", ""), tBeta = tile("β recovered = exp(θ / b)", "", true);
    node.appendChild(h("div", { class: "readouts" }, [tPlan.el, tAct.el, tTheta.el, tBeta.el]));
    var say = h("p", { class: "say", "aria-live": "polite" }); node.appendChild(say);

    var redraw = responsive(holder, draw);
    function draw(w) {
      var ePlan = 40 * Math.pow(st.W / 20, st.b);
      var eAct = ePlan * Math.pow(st.beta, st.b);
      var theta = Math.log(eAct) - Math.log(ePlan);
      tPlan.set(ePlan.toFixed(1) + " tasks"); tAct.set(eAct.toFixed(1) + " tasks");
      tTheta.set(fmt(theta, 3)); tBeta.set((Math.exp(theta / st.b)).toFixed(2));
      var gap = ePlan - eAct;
      say.innerHTML = st.beta >= 0.995
        ? "With <b>β = 1</b> the person does exactly what they planned: no wedge, no present bias."
        : "A <b>β of " + st.beta.toFixed(2) + "</b> shows up as a shortfall of <b>" + gap.toFixed(1) + " tasks (" + (100 * gap / ePlan).toFixed(0) + "%)</b>. Change <i>b</i> or the piece rate and the shortfall changes — but θ / <i>b</i>, and so the recovered <i>β</i>, does not.";

      var narrow = w < 560;
      var H = narrow ? 250 : 236;
      var svg = svgRoot(holder, w, H, "Planned effort " + ePlan.toFixed(1) + " tasks, effort on the day " + eAct.toFixed(1) + " tasks");
      // timeline
      var tl = 34, x0 = 16, x1 = w - 16;
      s("line", { x1: x0, x2: x1, y1: tl, y2: tl, class: "axis" }, svg);
      arrowHead(svg, x1, tl, 0, C.axis, 7);
      var marks = [
        { x: x0 + (x1 - x0) * 0.08, t: narrow ? "Plan" : "Advance: the plan", sub: "effort and pay both later — β cancels", c: C.plan },
        { x: x0 + (x1 - x0) * (narrow ? 0.5 : 0.52), t: narrow ? "Act (work date)" : "The work date: the act", sub: "effort now, pay later — β bites", c: C.act },
        { x: x0 + (x1 - x0) * 0.93, t: "Payment", sub: "", c: C.neutral }
      ];
      marks.forEach(function (mk, i) {
        s("circle", { cx: mk.x, cy: tl, r: 5, fill: mk.c, stroke: "#fff", "stroke-width": 2 }, svg);
        var anchor = i === 0 ? "start" : i === 2 ? "end" : "middle";
        var tx = i === 0 ? mk.x - 5 : i === 2 ? mk.x + 5 : mk.x;
        s("text", { x: tx, y: tl - 12, "text-anchor": anchor, "font-size": 12, class: "t-strong", text: narrow && i === 2 ? "Pay" : mk.t }, svg);
        if (mk.sub && !narrow) s("text", { x: tx, y: tl + 20, "text-anchor": anchor, "font-size": 11.5, class: "t-muted", text: mk.sub }, svg);
      });
      // bars
      var top = narrow ? 70 : 76, bh = 22, gapY = narrow ? 52 : 50;
      var lab = narrow ? 0 : 150;
      var bx0 = 16 + lab, bx1 = w - 70;
      var x = lin(0, 100, bx0, bx1);   // a fixed scale, so pay and responsiveness move the plan too
      var rows = [{ t: "Planned (advance)", v: ePlan, c: C.plan }, { t: "Done on the day", v: eAct, c: C.act }];
      rows.forEach(function (r, i) {
        var yy = top + i * gapY + (narrow ? 16 : 0);
        if (narrow) s("text", { x: bx0, y: yy - 6, "font-size": 12, class: "t-ink", text: r.t }, svg);
        else s("text", { x: 16, y: yy + bh / 2 + 4, "font-size": 12.5, class: "t-ink", text: r.t }, svg);
        hbar(svg, bx0, x(r.v), yy, bh, r.c);
        s("text", { x: x(r.v) + 8, y: yy + bh / 2 + 4, "font-size": 12.5, class: "t-strong", text: r.v.toFixed(1) + " tasks" }, svg);
        tip(s("rect", { x: bx0, y: yy - 2, width: Math.max(30, x(r.v) - bx0), height: bh + 4 }, svg), [{ v: r.v.toFixed(1) + " tasks", l: r.t, c: r.c }]);
      });
      // the gap bracket
      var yb = top + gapY + bh + (narrow ? 28 : 14);
      if (gap > 0.05) {
        s("line", { x1: x(eAct), x2: x(ePlan), y1: yb, y2: yb, stroke: C.ink, "stroke-width": 1.5 }, svg);
        s("line", { x1: x(eAct), x2: x(eAct), y1: yb - 5, y2: yb + 5, stroke: C.ink, "stroke-width": 1.5 }, svg);
        s("line", { x1: x(ePlan), x2: x(ePlan), y1: yb - 5, y2: yb + 5, stroke: C.ink, "stroke-width": 1.5 }, svg);
        s("line", { x1: x(ePlan), x2: x(ePlan), y1: top + bh, y2: yb, stroke: C.axis, "stroke-dasharray": "2 3" }, svg);
        var mid = (x(eAct) + x(ePlan)) / 2;
        s("text", { x: Math.min(mid, w - 90), y: yb + 18, "text-anchor": "middle", "font-size": 12, class: "t-ink", text: "wedge: " + gap.toFixed(1) + " tasks" }, svg);
      }
      s("text", { x: 16, y: H - 6, "font-size": 11.5, class: "t-muted", text: narrow ? "Same person, wage and date; only the vantage differs." : "Same person, same wage, same work date — only the vantage differs." }, svg);
    }
  };

  /* =====================================================================
     FIGURE 3 — the three axes
     ===================================================================== */
  VIZ.axes = function (node) {
    var views = {
      money: { t: "Money literature", c: C.navy, text: "<b>The money literature</b> sits almost entirely in reward–reward choices over dated payments, made in calm states. There, present bias is often small." },
      effort: { t: "Effort literature", c: C.navy, text: "<b>The effort literature</b> sits in cost–cost choices over dated work. There, present bias is regularly found. Comparing the two changes the good <i>and</i> the structure." },
      ar: { t: "Augenblick & Rabin (2019)", c: C.axState, text: "<b>Axis 3, the state.</b> Augenblick and Rabin (2019) assign the state within person — before or after a block of work — at a fixed structure (cost–cost) and a fixed good (effort)." },
      ans: { t: "Augenblick et al. (2015)", c: C.axPerson, text: "<b>Money vs effort in the same people.</b> Augenblick, Niederle and Sprenger (2015) step from money to effort — a step across the structure <i>and</i> the good at once (R–R → C–C)." },
      ctw: { t: "Cheung et al. (2022)", c: C.axGood, text: "<b>Axis 2, the good.</b> Cheung et al. (2022) vary the good — money, healthy food, unhealthy food — at a fixed structure (reward–reward) and a fixed vantage protocol." }
    };
    var cur = "ar";
    var sg = seg(Object.keys(views).map(function (k) { return { v: k, t: views[k].t }; }), cur, function (v) { cur = v; redraw(); }, "Literature or dataset");
    node.appendChild(h("div", { class: "controls" }, [sg.el]));
    var holder = h("div"); node.appendChild(holder);
    var say = h("p", { class: "say", "aria-live": "polite" }); node.appendChild(say);
    var redraw = responsive(holder, draw);
    function draw(w) {
      var v = views[cur]; say.innerHTML = v.text;
      var narrow = w < 560;
      var m = { l: narrow ? 58 : 82, r: 8, t: narrow ? 56 : 62, b: 30 };
      var H = narrow ? 300 : 320;
      var svg = svgRoot(holder, w, H, "Grid of structures by goods; " + v.t);
      var cols = [{ t: "R–R", s: narrow ? "reward–reward" : "reward vs reward" }, { t: "C–C", s: narrow ? "cost–cost" : "cost vs cost" }, { t: "R⁺C⁻", s: narrow ? "temptation" : "a temptation" }, { t: "C⁺R⁻", s: narrow ? "investment" : "an investment" }];
      var rowsG = ["food", "effort", "money"];
      var cw = (w - m.l - m.r) / 4, rh = (H - m.t - m.b) / 3;
      var cx = function (i) { return m.l + i * cw; }, ry = function (j) { return m.t + j * rh; };
      s("text", { x: m.l + (w - m.l - m.r) / 2, y: 14, "text-anchor": "middle", "font-size": 11.5, "font-weight": 600, fill: C.ink, text: "Axis 1: the sign–timing structure →" }, svg);
      cols.forEach(function (c, i) {
        s("text", { x: cx(i) + cw / 2, y: m.t - 24, "text-anchor": "middle", "font-size": 13, class: "t-strong", text: c.t }, svg);
        s("text", { x: cx(i) + cw / 2, y: m.t - 9, "text-anchor": "middle", "font-size": narrow ? 10 : 11, class: "t-muted", text: c.s }, svg);
      });
      rowsG.forEach(function (g, j) { s("text", { x: m.l - 10, y: ry(j) + rh / 2 + 4, "text-anchor": "end", "font-size": 12.5, class: "t-ink", text: g }, svg); });
      s("text", { x: 12, y: m.t + (H - m.t - m.b) / 2, "text-anchor": "middle", "font-size": 11.5, "font-weight": 600, fill: C.ink, transform: "rotate(-90 12 " + (m.t + (H - m.t - m.b) / 2) + ")", text: "Axis 2: the good →" }, svg);
      for (var i = 0; i < 4; i++) for (var j = 0; j < 3; j++) s("rect", { x: cx(i) + 1, y: ry(j) + 1, width: cw - 2, height: rh - 2, fill: C.paper2, stroke: C.rule }, svg);
      var cell = function (i, j) { return { x: cx(i) + 1, y: ry(j) + 1, w: cw - 2, h: rh - 2, cx: cx(i) + cw / 2, cy: ry(j) + rh / 2 }; };
      var mon = cell(0, 2), eff = cell(1, 1), food = cell(0, 0);
      var hl = function (c, col, label) {
        s("rect", { x: c.x, y: c.y, width: c.w, height: c.h, fill: col, "fill-opacity": 0.14, stroke: col, "stroke-width": 2, rx: 3 }, svg);
        if (label) s("text", { x: c.cx, y: c.y + c.h - 8, "text-anchor": "middle", "font-size": narrow ? 10 : 11, "font-weight": 600, fill: C.ink, text: label }, svg);
      };
      var arrow = function (x1, y1, x2, y2, col) {
        s("line", { x1: x1, y1: y1, x2: x2, y2: y2, stroke: col, "stroke-width": 2.2, "stroke-linecap": "round" }, svg);
        arrowHead(svg, x2, y2, Math.atan2(y2 - y1, x2 - x1), col, 9);
      };
      // persistent faint marks for the two literatures
      s("text", { x: mon.cx, y: mon.cy + 4, "text-anchor": "middle", "font-size": narrow ? 10 : 11, class: "t-muted", text: "money lit." }, svg);
      s("text", { x: eff.cx, y: eff.y + 14, "text-anchor": "middle", "font-size": narrow ? 10 : 11, class: "t-muted", text: "effort lit." }, svg);
      if (cur === "money") hl(mon, C.navy);
      if (cur === "effort") hl(eff, C.navy);
      if (cur === "ar") {
        hl(eff, C.axState);
        var bw = Math.min(30, eff.w / 4), bh2 = Math.min(22, eff.h / 3.2);
        s("rect", { x: eff.cx - bw - 4, y: eff.cy - bh2 / 2, width: bw, height: bh2, fill: C.cold, rx: 3 }, svg);
        s("rect", { x: eff.cx + 4, y: eff.cy - bh2 / 2, width: bw, height: bh2, fill: C.hot, rx: 3 }, svg);
        s("text", { x: eff.cx - bw / 2 - 4, y: eff.cy + bh2 / 2 + 13, "text-anchor": "middle", "font-size": 10.5, class: "t-ink", text: "cold" }, svg);
        s("text", { x: eff.cx + bw / 2 + 4, y: eff.cy + bh2 / 2 + 13, "text-anchor": "middle", "font-size": 10.5, class: "t-ink", text: "hot" }, svg);
      }
      if (cur === "ans") { hl(mon, C.axPerson); hl(eff, C.axPerson); arrow(mon.cx + mon.w * 0.2, mon.cy - 6, eff.cx - eff.w * 0.18, eff.cy + 10, C.axPerson); }
      if (cur === "ctw") {
        hl(mon, C.axGood); hl(food, C.axGood, "healthy · unhealthy");
        arrow(food.cx + food.w * 0.28, mon.cy - 12, food.cx + food.w * 0.28, food.cy + 8, C.axGood);
      }
      s("text", { x: m.l, y: H - 8, "font-size": 11.5, class: "t-muted", text: "Axis 3, the state, is a layer inside every cell." }, svg);
    }
  };

  // run fn once, the first time node scrolls into view
  function onVisible(node, fn) {
    if (!("IntersectionObserver" in window)) { fn(); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); fn(); } });
    }, { rootMargin: "0px 0px -20% 0px" });
    io.observe(node);
  }

  /* =====================================================================
     FIGURE 4 — the restriction ladder
     ===================================================================== */
  VIZ.ladder = function (node) {
    var rungs = [
      { n: 0, short: "β(X) free", title: "Rung 0 — an unrestricted reaction function", c: "#0E8F72",
        assumes: "Every state cell has its own β, with no link between cells.",
        weight: "Balance within every cell. It annihilates each cell’s β, so nothing is left to test.",
        chip: ["null", "untestable"], data: "Any vector of cell statistics is rationalized exactly (Proposition 2). “State dependence” as such is not a hypothesis." },
      { n: 1, short: "β independent of the state", title: "Rung 1 — the random-β null", c: "#2F6BA8",
        assumes: "β may vary across people, days and choices — randomly or persistently — as long as its distribution does not depend on the assigned state.",
        weight: "Recentered functions of the assigned state: each decision is weighted by its state minus its expected state. Exact randomization inference.",
        chip: ["reject", "rejected"], data: "For the assigned state (randomization p = .09 on all 100 people, .02 on the original sample), for the stakes and for proximity. Bounded nulls for executive load and appetite." },
      { n: 2, short: "β monotone in the state", title: "Rung 2 — a monotone reaction", c: "#B97800",
        assumes: "β moves with the state in a direction fixed in advance.",
        weight: "The distance from the adjacent increments to the cone of monotone profiles, run in both directions.",
        chip: ["reject", "decreasing in the stake: rejected"], data: "β does not fall as stakes rise; a monotone proximity profile is not rejected. Finer shapes depend on the binning." },
      { n: 3, short: "β constant", title: "Rung 3 — the trait", c: "#C2413A",
        assumes: "One β per person across states, structures and goods: standard quasi-hyperbolic discounting.",
        weight: "Within-person contrasts across structures or goods, with a measurement-error model for individual estimates.",
        chip: ["reject", "rejected"], data: "Across structures (effort vs money, Chapter 7) and across goods (money vs food, Chapter 8)." },
      { n: 4, short: "β = 1", title: "Rung 4 — no present bias", c: "#5F6B77",
        assumes: "Exponential discounting: the present gets no extra weight.",
        weight: "No balance at all: the level of the wedge. This is the one question the level statistic answers correctly.",
        chip: ["reject", "rejected on effort data"], data: "The null that no wage cell has a positive wedge is rejected (p = .004). In household consumption data, exponential discounting needs ≥ 6% measurement error, quasi-hyperbolic about 1% (Chapter 9)." }
    ];
    var cur = 1;
    var wrap = h("div", { class: "ladder" });
    var list = h("div", { class: "ladder-list", role: "group", "aria-label": "Rungs of the ladder" });
    var side = h("p", { class: "ladder-side", text: "↓ each rung is more restrictive — and more testable — than the one above" });
    var detail = h("div", { class: "ladder-detail", "aria-live": "polite" });
    var btns = rungs.map(function (r, i) {
      var b = h("button", { type: "button", class: "rung", "aria-pressed": String(i === cur), style: "--i:" + i + ";--c:" + r.c }, [
        h("span", { class: "rung-n", text: "Rung " + r.n }), h("span", { class: "rung-t", text: r.short })]);
      b.addEventListener("click", function () { cur = i; render(); });
      list.appendChild(b);
      return b;
    });
    var listWrap = h("div", { class: "ladder-col" }, [list, side]);
    wrap.appendChild(listWrap); wrap.appendChild(detail); node.appendChild(wrap);
    function row(k, v) { return h("div", { class: "ld-row" }, [h("div", { class: "ld-k", text: k }), h("div", { class: "ld-v", text: v })]); }
    function render() {
      btns.forEach(function (b, i) { b.setAttribute("aria-pressed", String(i === cur)); });
      var r = rungs[cur];
      detail.textContent = "";
      detail.style.setProperty("--c", r.c);
      detail.appendChild(h("h4", { text: r.title }));
      detail.appendChild(row("What it assumes", r.assumes));
      detail.appendChild(row("The weight that tests it", r.weight));
      var dv = h("div", { class: "ld-v" }, [chip(r.chip[0], r.chip[1]), h("div", { style: "margin-top:6px", text: r.data })]);
      detail.appendChild(h("div", { class: "ld-row" }, [h("div", { class: "ld-k", text: "What the data say" }), dv]));
    }
    render();
  };

  /* =====================================================================
     FIGURE 5 — the test lab (simulated experiments)
     ===================================================================== */
  VIZ.testlab = function (node) {
    var worlds = {
      trait: { t: "A trait", d: "Everyone has β = 0.80, always." },
      random: { t: "Random β", d: "β varies across people and days — but not with the state." },
      reaction: { t: "A reaction function", d: "β is 0.88 when cold and 0.74 when hot." }
    };
    var world = "trait", unequal = true, rate = null, nDone = 0, busy = false, seed = 7;
    var sgW = seg(Object.keys(worlds).map(function (k) { return { v: k, t: worlds[k].t }; }), world, function (v) { world = v; run(); }, "True world");
    var ck = check("Unequal exposure, as in the real design", unequal, function (v) { unequal = v; run(); });
    var btn = h("button", { type: "button", class: "btn-run", text: "Run 200 experiments" });
    btn.addEventListener("click", function () { run(); });
    node.appendChild(h("div", { class: "controls" }, [h("span", { class: "ctl-label", text: "True world" }), sgW.el, ck.el, btn]));
    var desc = h("p", { class: "say", style: "margin:0 0 6px" }); node.appendChild(desc);
    var holder = h("div"); node.appendChild(holder);
    var say = h("p", { class: "say", "aria-live": "polite" }); node.appendChild(say);

    var tests = [
      { k: "level", t: "Level statistic", s: "is the wedge different from zero?" },
      { k: "raw", t: "Raw state contrast", s: "hot vs cold, not recentered" },
      { k: "rec", t: "Recentered contrast", s: "state minus expected state" }
    ];

    function oneRep(rand) {
      var N = 100, D = 6, mus = unequal ? [0.46, 0.60, 0.83] : [0.63, 0.63, 0.63], alpha = [-0.10, 0, 0.10], b = 0.65;
      var S = [], G = [], Wk = [], I = [];
      for (var i = 0; i < N; i++) {
        var u = rand.norm() * 0.15;
        for (var d = 0; d < D; d++) for (var w = 0; w < 3; w++) {
          var st = rand() < mus[w] ? 1 : 0;
          var lb = world === "trait" ? Math.log(0.8)
            : world === "random" ? Math.log(0.8) + u + rand.norm() * 0.15
            : (st ? Math.log(0.74) : Math.log(0.88)) + 0.5 * u;
          S.push(st); G.push(b * lb + alpha[w] + rand.norm() * 0.35); Wk.push(w); I.push(i);
        }
      }
      var sbar = mean(S), per = D * 3, mL = [], mR = [], mC = [];
      for (var j = 0; j < N; j++) {
        var a = 0, r = 0, c = 0;
        for (var k = j * per; k < (j + 1) * per; k++) { a += G[k]; r += (S[k] - sbar) * G[k]; c += (S[k] - mus[Wk[k]]) * G[k]; }
        mL.push(a / per); mR.push(r / per); mC.push(c / per);
      }
      var tt = function (arr) { return Math.abs(mean(arr) / (sd(arr) / Math.sqrt(arr.length))) > 1.984; };
      return { level: tt(mL), raw: tt(mR), rec: tt(mC) };
    }
    function run() {
      if (busy) return;
      busy = true; btn.disabled = true;
      desc.textContent = worlds[world].d + (unequal ? " Slots are hot 46%, 60% and 83% of the time." : " Every slot is hot 63% of the time.");
      var rand = rng(seed++ * 9973), R = 200, hits = { level: 0, raw: 0, rec: 0 };
      nDone = 0; rate = { level: 0, raw: 0, rec: 0 };
      function batch() {
        var n = RM ? R : 8;
        for (var q = 0; q < n && nDone < R; q++) { var o = oneRep(rand); nDone++; Object.keys(hits).forEach(function (k) { if (o[k]) hits[k]++; }); }
        Object.keys(hits).forEach(function (k) { rate[k] = hits[k] / nDone; });
        redraw();
        if (nDone < R) requestAnimationFrame(batch); else { busy = false; btn.disabled = false; btn.textContent = "Run again"; summarize(); redraw(); }
      }
      batch();
    }
    function verdict(k) {
      if (!rate) return "";
      var r = rate[k];
      if (world === "reaction") return r >= 0.5 ? "✓ detects it" : "✗ mostly misses it";
      return r <= 0.1 ? "✓ about 5%: correct" : "✗ false alarms";
    }
    function summarize() {
      if (world === "reaction") say.innerHTML = "Here <i>β</i> really depends on the state, and the recentered test finds it in " + pct(rate.rec) + " of experiments. The level statistic fires too — but it fired just as often when <i>β</i> did not depend on the state.";
      else say.innerHTML = "<i>β</i> does not depend on the state here. The level statistic still rejects in <b>" + pct(rate.level) + "</b> of experiments: it detects that present bias exists, not that it depends on the state. " +
        (unequal ? "The raw contrast rejects in <b>" + pct(rate.raw) + "</b>: slots that are more often hot also carry their own wedge. Only the recentered contrast stays near 5% (<b>" + pct(rate.rec) + "</b>)." : "With equal exposure the raw contrast is valid too (" + pct(rate.raw) + "); the recentered one stays near 5% (" + pct(rate.rec) + ").");
    }
    var redraw = responsive(holder, function (w) {
      var narrow = w < 600;
      var lab = narrow ? 0 : 200, vcol = narrow ? 0 : 150;
      var rowH = narrow ? 64 : 46, top = 18;
      var H = top + rowH * 3 + 30;
      var svg = svgRoot(holder, w, H, "Rejection rates over " + nDone + " simulated experiments");
      var x0 = lab + 4, x1 = w - vcol - 46;
      var x = lin(0, 1, x0, x1);
      [0, 0.25, 0.5, 0.75, 1].forEach(function (t) {
        s("line", { x1: x(t), x2: x(t), y1: top - 4, y2: top + rowH * 3 - 8, class: "grid" }, svg);
        s("text", { x: x(t), y: top + rowH * 3 + 8, "text-anchor": "middle", "font-size": 11.5, class: "t-muted", text: (t * 100) + "%" }, svg);
      });
      s("line", { x1: x(0.05), x2: x(0.05), y1: top - 10, y2: top + rowH * 3 - 8, stroke: C.ink, "stroke-width": 1.2, "stroke-dasharray": "3 3" }, svg);
      s("text", { x: x(0.05) + 4, y: top - 6, "font-size": 11, class: "t-muted", text: "5%" }, svg);
      s("text", { x: narrow ? (x0 + x1) / 2 : x1, y: top + rowH * 3 + 24, "text-anchor": narrow ? "middle" : "end", "font-size": 11.5, class: "t-muted", text: (narrow ? "share that “find” state dependence" : "share of experiments that “find” state dependence") + (nDone && !narrow ? " · " + nDone + " run" : "") }, svg);
      tests.forEach(function (tst, i) {
        var y = top + i * rowH + (narrow ? 26 : 6), bh = 18;
        if (narrow) {
          s("text", { x: x0, y: y - 8, "font-size": 12.5, class: "t-strong halo", text: tst.t }, svg);
        } else {
          s("text", { x: 0, y: y + 7, "font-size": 12.5, class: "t-strong", text: tst.t }, svg);
          s("text", { x: 0, y: y + 22, "font-size": 11.5, class: "t-muted", text: tst.s }, svg);
        }
        s("rect", { x: x0, y: y, width: x1 - x0, height: bh, fill: C.paper2, rx: 3 }, svg);
        var r = rate ? rate[tst.k] : 0;
        var col = tst.k === "rec" ? C.cold : C.neutral;
        if (r > 0) hbar(svg, x0, x(r), y, bh, col);
        s("text", { x: x(r) + 6, y: y + 13, "font-size": 12.5, class: "t-strong", text: rate ? pct(r) : "" }, svg);
        if (!narrow) s("text", { x: w - vcol + 6, y: y + 13, "font-size": 12, class: "t-ink", text: busy ? "" : verdict(tst.k) }, svg);
        else if (!busy && rate) s("text", { x: x1 + 44, y: y + 13, "text-anchor": "end", "font-size": 11, class: "t-muted", text: "" }, svg);
        tip(s("rect", { x: x0, y: y - 3, width: x1 - x0, height: bh + 6 }, svg), function () { return [{ v: rate ? pct(rate[tst.k], 1) : "—", l: tst.t + ": share of experiments rejecting", c: col, note: verdict(tst.k) }]; }, tst.t);
      });
    });
    desc.textContent = worlds[world].d + " Slots are hot 46%, 60% and 83% of the time.";
    onVisible(node, run);
  };

  /* =====================================================================
     FIGURE 6 — unequal exposure and recentering
     ===================================================================== */
  VIZ.recenter = function (node) {
    var draws = {
      A: ["F1", "G1", "work", "C", "G2", "F2"],
      B: ["G1", "work", "C", "F1", "F2", "G2"]
    };
    var cur = "A", show = "both";
    var sgD = seg([{ v: "A", t: "Draw A" }, { v: "B", t: "Draw B" }], cur, function (v) { cur = v; redraw(); }, "Possible ordering of the day");
    var sgS = seg([{ v: "raw", t: "Unadjusted" }, { v: "rec", t: "Recentered" }, { v: "both", t: "Both" }], show, function (v) { show = v; redraw(); }, "Estimator");
    node.appendChild(h("div", { class: "controls" }, [h("span", { class: "ctl-label", text: "Same day, two orderings" }), sgD.el, h("span", { class: "ctl-label", text: "Estimates" }), sgS.el]));
    var holder = h("div"); node.appendChild(holder);
    var mu = [{ k: "C", v: 0.46, t: "today’s work" }, { k: "F1", v: 0.60, t: "first future set" }, { k: "F2", v: 0.83, t: "second future set" }, { k: "G1", v: 0.59, t: "first prediction" }, { k: "G2", v: 0.83, t: "second prediction" }];
    var est = [
      { t: "act: today’s decisions", raw: -0.078, rec: -0.077 },
      { t: "plan: future decisions", raw: 0.021, rec: -0.010 },
      { t: "Δ log β (the β gap)", raw: -0.180, rec: -0.122 }
    ];
    node.appendChild(h("p", { class: "say", html: "<b>What survives:</b> the act moves by about 8 log points under both (exact randomization <i>p</i> = .018 on all 100; ≤ .001 on the original 72). <b>What changes:</b> the plan-side zero — the later, farther future set was more often hot — and with it the <i>β</i> gap: 0.88 vs 0.74 becomes 0.85 vs 0.75." }));
    node.appendChild(dataTable("Show the numbers", ["", "Unadjusted", "Recentered"], est.map(function (e) { return [e.t, fmtS(e.raw, 3), fmtS(e.rec, 3)]; })));
    var redraw = responsive(holder, function (w) {
      var two = w >= 720;
      var leftW = two ? Math.floor(w * 0.5) - 14 : w;
      var Hl = 236, Hr = 230;
      var H = two ? Math.max(Hl, Hr) : Hl + Hr + 24;
      var svg = svgRoot(holder, w, H, "Exposure to the hot state by component, and estimates before and after recentering");
      // ---- left: the day and the exposure
      var gL = s("g", {}, svg);
      s("text", { x: 0, y: 12, "font-size": 12, class: "t-strong", text: "One possible draw of the day (" + cur + ")" }, gL);
      var slots = draws[cur], sw = (leftW - 5 * 6) / 6, after = false;
      slots.forEach(function (k, i) {
        var x = i * (sw + 6);
        if (k === "work") after = true;
        var fill = k === "work" ? C.navy : after ? C.hot : "#fff";
        s("rect", { x: x, y: 24, width: sw, height: 30, rx: 4, fill: fill, stroke: k === "work" ? C.navy : after ? C.hot : C.axis }, gL);
        s("text", { x: x + sw / 2, y: 43, "text-anchor": "middle", "font-size": 12, "font-weight": 600, fill: k === "work" || after ? "#fff" : C.ink, text: k }, gL);
      });
      s("text", { x: 0, y: 72, "font-size": 11.5, class: "t-muted", text: "white = before the block (cold) · red = after it (hot)" }, gL);
      s("text", { x: 0, y: 100, "font-size": 12, class: "t-strong", text: "Exposure: μ = Pr(hot | component)" }, gL);
      var hotNow = {}; var aft = false; slots.forEach(function (k) { if (k === "work") aft = true; else hotNow[k] = aft; });
      var bw = Math.min(46, (leftW - 4 * 12) / 5), gap = (leftW - 5 * bw) / 4;
      var y = lin(0, 1, 214, 116);
      mu.forEach(function (m, i) {
        var x = i * (bw + gap);
        s("rect", { x: x, y: y(1), width: bw, height: y(0) - y(1), fill: C.paper2, rx: 3 }, gL);
        column(gL, x, bw, y(0), y(m.v), C.hot, 0.82);
        s("text", { x: x + bw / 2, y: y(m.v) + 15, "text-anchor": "middle", "font-size": 12, "font-weight": 600, fill: "#fff", text: m.v.toFixed(2) }, gL);
        s("text", { x: x + bw / 2, y: 230, "text-anchor": "middle", "font-size": 12, class: hotNow[m.k] ? "t-strong" : "t-ink", text: m.k + (hotNow[m.k] ? " •" : "") }, gL);
        tip(s("rect", { x: x, y: y(1), width: bw, height: y(0) - y(1) + 22 }, gL), [{ v: m.v.toFixed(2), l: "μ: chance that " + m.t + " is hot", c: C.hot, note: hotNow[m.k] ? "hot in draw " + cur : "cold in draw " + cur }]);
      });
      // ---- right: estimates
      var gR = s("g", { transform: two ? "translate(" + (leftW + 28) + ",0)" : "translate(0," + (Hl + 24) + ")" }, svg);
      var rw = two ? w - leftW - 28 : w;
      s("text", { x: 0, y: 12, "font-size": 12, class: "t-strong", text: "Effect of the hot state, before and after recentering" }, gR);
      var yl = lin(-0.2, 0.05, Hr - 34, 48);
      var lx = 34;
      [-0.2, -0.15, -0.1, -0.05, 0, 0.05].forEach(function (t) {
        s("line", { x1: lx, x2: rw, y1: yl(t), y2: yl(t), class: t === 0 ? "axis" : "grid" }, gR);
        s("text", { x: lx - 6, y: yl(t) + 4, "text-anchor": "end", "font-size": 11, class: "t-muted", text: fmtS(t, 2) }, gR);
      });
      var gw = (rw - lx) / 3, cb = Math.min(22, gw / 5), gapB = Math.max(14, cb * 0.7);
      est.forEach(function (e, i) {
        var cx = lx + gw * i + gw / 2;
        var series = show === "both" ? ["raw", "rec"] : [show];
        series.forEach(function (k, j) {
          var bx = series.length === 2 ? cx - cb - gapB / 2 + j * (cb + gapB) : cx - cb / 2;
          var col = k === "raw" ? C.neutral : C.cold;
          column(gR, bx, cb, yl(0), yl(e[k]), col);
          var ly = e[k] < 0 ? yl(e[k]) + 13 : yl(e[k]) - 5;
          s("text", { x: bx + cb / 2, y: ly, "text-anchor": "middle", "font-size": 10.5, class: "t-strong", text: fmtS(e[k], 2) }, gR);
          tip(s("rect", { x: bx - 2, y: Math.min(yl(0), yl(e[k])) - 4, width: cb + 4, height: Math.abs(yl(e[k]) - yl(0)) + 8 }, gR), [{ v: fmtS(e[k], 3), l: (k === "raw" ? "unadjusted" : "recentered") + " · " + e.t, c: col }]);
        });
        var words = e.t.split(": ");
        s("text", { x: cx, y: Hr - 16, "text-anchor": "middle", "font-size": 11.5, class: "t-ink", text: words[0] }, gR);
        if (words[1]) s("text", { x: cx, y: Hr - 2, "text-anchor": "middle", "font-size": 11, class: "t-muted", text: words[1] }, gR);
      });
      var lg = s("g", { transform: "translate(" + lx + ",22)" }, gR);
      [["unadjusted", C.neutral], ["recentered", C.cold]].forEach(function (p, i) {
        if (show !== "both" && ((show === "raw") !== (i === 0))) return;
        s("rect", { x: i * 96, y: 0, width: 10, height: 10, rx: 2, fill: p[1] }, lg);
        s("text", { x: i * 96 + 15, y: 9, "font-size": 11.5, class: "t-ink", text: p[0] }, lg);
      });
    });
  };

  /* =====================================================================
     FIGURE 7 — the state moves the act, not the plan
     ===================================================================== */
  VIZ.state = function (node) {
    var st = { proj: false, hot: 0.46 };
    var ck = check("Show what projection bias would predict", false, function (v) { st.proj = v; redraw(); });
    var sl = slider({ label: "Share of choices made hot", min: 0, max: 1, step: 0.01, value: st.hot, fmt: function (v) { return Math.round(v * 100) + "%"; }, onInput: function (v) { st.hot = v; redraw(); } });
    node.appendChild(h("div", { class: "controls" }, [sl.el, ck.el]));
    var holder = h("div"); node.appendChild(holder);
    var tC = tile("β, decided cold", "0.88"), tH = tile("β, decided hot", "0.74"), tP = tile("What a state-blind study reports", "", true);
    node.appendChild(h("div", { class: "readouts" }, [tC.el, tH.el, tP.el]));
    var say = h("p", { class: "say", "aria-live": "polite" }); node.appendChild(say);
    node.appendChild(dataTable("Show the numbers", ["", "Estimate", "95% interval"], [
      ["Effect of hot state on the plan (log points)", "+0.021", "−0.020 to +0.058"],
      ["Effect of hot state on the act (log points)", "−0.078", "p = .02"],
      ["β, state held cold", "0.882", "0.802 to 0.966"],
      ["β, state held hot", "0.736", "0.649 to 0.822"],
      ["Δ log β", "−0.180", "−0.310 to −0.062 (p = .008)"]
    ]));
    var pooled = function (hs) { return Math.exp((1 - hs) * Math.log(0.882) + hs * Math.log(0.736)); };
    var redraw = responsive(holder, function (w) {
      var pv = pooled(st.hot);
      tP.set(pv.toFixed(2) + "  at " + Math.round(st.hot * 100) + "% hot");
      say.innerHTML = "Run every choice right after work and a study reports <b>0.74</b>; run none and it reports <b>0.88</b>. Same people, same task: the “trait” depends on the mix of states in the design.";
      var two = w >= 640, H1 = 250, H = two ? H1 : H1 * 2 + 20;
      var pw = two ? (w - 30) / 2 : w;
      var svg = svgRoot(holder, w, H, "Effect of the hot state: plan +0.021, act −0.078. Beta cold 0.88, hot 0.74, state-blind " + pv.toFixed(2));
      // panel A
      var gA = s("g", {}, svg);
      s("text", { x: 0, y: 12, "font-size": 12, class: "t-strong", text: "Effect of deciding just after work" }, gA);
      s("text", { x: 0, y: 27, "font-size": 11.5, class: "t-muted", text: "log points; 95% intervals" }, gA);
      var ya = lin(-0.16, 0.08, H1 - 42, 44), la = 44;
      [-0.15, -0.1, -0.05, 0, 0.05].forEach(function (t) {
        s("line", { x1: la, x2: pw, y1: ya(t), y2: ya(t), class: t === 0 ? "axis" : "grid" }, gA);
        s("text", { x: la - 6, y: ya(t) + 4, "text-anchor": "end", "font-size": 11, class: "t-muted", text: fmtS(t, 2) }, gA);
      });
      var cwA = (pw - la) / 2, bwA = Math.min(56, cwA * 0.42);
      [{ t: "the plan", s: "future-dated decisions", v: 0.021, lo: -0.020, hi: 0.058, c: C.neutral }, { t: "the act", s: "today’s decisions", v: -0.078, lo: -0.140, hi: -0.018, c: C.hot }].forEach(function (b, i) {
        var cx = la + cwA * i + cwA / 2;
        if (st.proj && i === 0) {
          s("rect", { x: cx - bwA / 2, y: ya(0), width: bwA, height: ya(-0.078) - ya(0), fill: "none", stroke: C.hot, "stroke-width": 1.5, "stroke-dasharray": "4 3", rx: 3 }, gA);
          s("text", { x: cx, y: ya(-0.078) + 16, "text-anchor": "middle", "font-size": 11, fill: C.hot, "font-weight": 600, text: "projection bias:" }, gA);
          s("text", { x: cx, y: ya(-0.078) + 30, "text-anchor": "middle", "font-size": 11, fill: C.hot, "font-weight": 600, text: "the plan falls too" }, gA);
        }
        column(gA, cx - bwA / 2, bwA, ya(0), ya(b.v), b.c, 0.9);
        whisker(gA, cx, ya(b.lo), ya(b.hi), C.ink);
        s("text", { x: cx + bwA / 2 + 6, y: ya(b.v) + 4, "font-size": 12, class: "t-strong", text: fmtS(b.v, 3) }, gA);
        s("text", { x: cx, y: H1 - 22, "text-anchor": "middle", "font-size": 12.5, class: "t-ink", text: b.t }, gA);
        s("text", { x: cx, y: H1 - 7, "text-anchor": "middle", "font-size": 11, class: "t-muted", text: b.s }, gA);
        tip(s("rect", { x: cx - bwA / 2 - 4, y: ya(b.hi) - 4, width: bwA + 8, height: ya(b.lo) - ya(b.hi) + 8 }, gA), [{ v: fmtS(b.v, 3), l: "effect of the hot state on " + b.t, c: b.c, note: "95% interval " + fmtS(b.lo, 3) + " to " + fmtS(b.hi, 3) }]);
      });
      // panel B
      var gB = s("g", { transform: two ? "translate(" + (pw + 30) + ",0)" : "translate(0," + (H1 + 20) + ")" }, svg);
      s("text", { x: 0, y: 12, "font-size": 12, class: "t-strong", text: "β with the state held fixed" }, gB);
      s("text", { x: 0, y: 27, "font-size": 11.5, class: "t-muted", text: "all 100 subjects; 95% intervals" }, gB);
      var yb = lin(0.6, 1.04, H1 - 42, 44), lb = 40;
      [0.6, 0.7, 0.8, 0.9, 1.0].forEach(function (t) {
        s("line", { x1: lb, x2: pw, y1: yb(t), y2: yb(t), class: "grid" }, gB);
        s("text", { x: lb - 6, y: yb(t) + 4, "text-anchor": "end", "font-size": 11, class: "t-muted", text: t.toFixed(1) }, gB);
      });
      s("text", { x: pw, y: yb(1) - 5, "text-anchor": "end", "font-size": 11, class: "t-muted", text: "β = 1" }, gB);
      var cwB = (pw - lb) / 3;
      [{ t: "cold", s: "before work", v: 0.882, lo: 0.802, hi: 0.966, c: C.cold }, { t: "hot", s: "after work", v: 0.736, lo: 0.649, hi: 0.822, c: C.hot }].forEach(function (b, i) {
        var cx = lb + cwB * i + cwB / 2;
        whisker(gB, cx, yb(b.lo), yb(b.hi), b.c);
        dot(gB, cx, yb(b.v), 6.5, b.c);
        s("text", { x: cx + 12, y: yb(b.v) + 4, "font-size": 12.5, class: "t-strong", text: b.v.toFixed(2) }, gB);
        s("text", { x: cx, y: H1 - 22, "text-anchor": "middle", "font-size": 12.5, class: "t-ink", text: b.t }, gB);
        s("text", { x: cx, y: H1 - 7, "text-anchor": "middle", "font-size": 11, class: "t-muted", text: b.s }, gB);
        tip(s("rect", { x: cx - 16, y: yb(b.hi) - 6, width: 32, height: yb(b.lo) - yb(b.hi) + 12 }, gB), [{ v: b.v.toFixed(3), l: "β, decided " + b.t, c: b.c, note: "95% interval " + b.lo.toFixed(3) + " – " + b.hi.toFixed(3) }]);
      });
      var cx3 = lb + cwB * 2 + cwB / 2;
      s("line", { x1: lb + 4, x2: pw, y1: yb(pv), y2: yb(pv), stroke: C.ink, "stroke-width": 1.5, "stroke-dasharray": "5 4" }, gB);
      dot(gB, cx3, yb(pv), 6.5, C.ink);
      s("text", { x: cx3, y: yb(pv) - 12, "text-anchor": "middle", "font-size": 12.5, class: "t-strong", text: pv.toFixed(2) }, gB);
      s("text", { x: cx3, y: H1 - 22, "text-anchor": "middle", "font-size": 12.5, class: "t-ink", text: "state-blind" }, gB);
      s("text", { x: cx3, y: H1 - 7, "text-anchor": "middle", "font-size": 11, class: "t-muted", text: Math.round(st.hot * 100) + "% decided hot" }, gB);
    });
  };

  /* =====================================================================
     FIGURE 8 — randomization inference
     ===================================================================== */
  VIZ.ri = function (node) {
    var cfg = {
      act: { t: "The hot state on the act", obs: -0.077, sd: 0.034, c5: 0.064, c10: 0.053, p: ".018", p72: ".001" },
      gap: { t: "State × today: the β gap", obs: -0.067, sd: 0.039, c5: 0.077, c10: 0.065, p: ".091", p72: ".021" }
    };
    var cur = "act", draws = [], timer = null;
    var sg = seg([{ v: "act", t: cfg.act.t }, { v: "gap", t: cfg.gap.t }], cur, function (v) { cur = v; stop(); draws = []; redraw(); }, "Statistic");
    var btn = h("button", { type: "button", class: "btn-run", text: "Run 999 redraws" });
    btn.addEventListener("click", function () { start(); });
    node.appendChild(h("div", { class: "controls" }, [sg.el, btn]));
    var holder = h("div"); node.appendChild(holder);
    var tN = tile("Redraws so far", "0"), tE = tile("As extreme as observed", "—"), tP = tile("Exact p in the paper (N = 100 / 72)", "", true);
    node.appendChild(h("div", { class: "readouts" }, [tN.el, tE.el, tP.el]));
    function stop() { if (timer) { cancelAnimationFrame(timer); timer = null; } btn.disabled = false; }
    function start() {
      stop(); draws = []; btn.disabled = true;
      var rand = rng(cur === "act" ? 4242 : 777), c = cfg[cur];
      function step() {
        var n = RM ? 999 : 14;
        for (var i = 0; i < n && draws.length < 999; i++) draws.push(rand.norm() * c.sd);
        redraw();
        if (draws.length < 999) timer = requestAnimationFrame(step); else stop();
      }
      step();
    }
    var redraw = responsive(holder, function (w) {
      var c = cfg[cur];
      tN.set(String(draws.length));
      var ext = draws.filter(function (d) { return Math.abs(d) >= Math.abs(c.obs); }).length;
      tE.set(draws.length ? ext + "  (" + (ext / draws.length).toFixed(3).replace(/^0/, "") + ")" : "—");
      tP.set(c.p + " / " + c.p72);
      var H = 230, m = { l: 34, r: 10, t: 22, b: 34 };
      var svg = svgRoot(holder, w, H, "Null distribution of the recentered coefficient with the observed value " + c.obs);
      var x = lin(-0.13, 0.13, m.l, w - m.r);
      var bins = 52, bw = 0.26 / bins, counts = new Array(bins).fill(0);
      draws.forEach(function (d) { var b = Math.floor((d + 0.13) / bw); if (b >= 0 && b < bins) counts[b]++; });
      var ymax = Math.max(60, Math.max.apply(null, counts) * 1.1);
      var y = lin(0, ymax, H - m.b, m.t);
      // rejection regions
      s("rect", { x: m.l, y: m.t, width: x(-c.c5) - m.l, height: H - m.b - m.t, fill: C.hot, "fill-opacity": 0.07 }, svg);
      s("rect", { x: x(c.c5), y: m.t, width: w - m.r - x(c.c5), height: H - m.b - m.t, fill: C.hot, "fill-opacity": 0.07 }, svg);
      [-0.1, -0.05, 0, 0.05, 0.1].forEach(function (t) { s("text", { x: x(t), y: H - m.b + 16, "text-anchor": "middle", "font-size": 11.5, class: "t-muted", text: fmtS(t, 2) }, svg); });
      s("text", { x: (m.l + w - m.r) / 2, y: H - 4, "text-anchor": "middle", "font-size": 11.5, class: "t-muted", text: "recentered coefficient under redrawn orderings (log points)" }, svg);
      var pxw = (x(bw) - x(0)) - 1.5;
      counts.forEach(function (n, i) { if (n) column(svg, x(-0.13 + i * bw) + 0.75, Math.max(1, pxw), y(0), y(n), C.neutral, 0.75); });
      s("line", { x1: m.l, x2: w - m.r, y1: y(0), y2: y(0), class: "axis" }, svg);
      [-1, 1].forEach(function (sgn) {
        s("line", { x1: x(sgn * c.c5), x2: x(sgn * c.c5), y1: m.t, y2: y(0), stroke: C.ink, "stroke-dasharray": "5 3", "stroke-width": 1.2 }, svg);
        s("line", { x1: x(sgn * c.c10), x2: x(sgn * c.c10), y1: m.t, y2: y(0), stroke: C.ink, "stroke-dasharray": "1.5 3", "stroke-width": 1.2 }, svg);
      });
      s("text", { x: x(c.c5) + 4, y: m.t + 10, "font-size": 11, class: "t-muted", text: w < 520 ? "5%" : "5% critical ±" + c.c5.toFixed(3).replace(/^0/, "") }, svg);
      s("line", { x1: x(c.obs), x2: x(c.obs), y1: m.t - 6, y2: y(0), stroke: C.hot, "stroke-width": 2.5 }, svg);
      s("text", { x: x(c.obs) - 6, y: m.t + 4, "text-anchor": "end", "font-size": 12, "font-weight": 600, fill: C.ink, text: "observed " + fmtS(c.obs, 3) }, svg);
      if (!draws.length) s("text", { x: x(0.0), y: (m.t + H - m.b) / 2, "text-anchor": "middle", "font-size": 13, class: "t-muted", text: "Press “Run 999 redraws”" }, svg);
    });
    onVisible(node, start);
  };

  /* =====================================================================
     FIGURE 9 — where β moves and where it stops
     ===================================================================== */
  VIZ.margins = function (node) {
    var cards = [
      { g: "within", t: "Visceral state, assigned", src: "Augenblick & Rabin: just worked, all 100", chip: ["reject", "Rung 1 rejected"], note: "β 0.88 → 0.74; recentered RI p = .09 (all 100), .02 (N = 72)",
        yd: [0.6, 1.02], ticks: [0.6, 0.7, 0.8, 0.9, 1.0], ref: 1, connect: true,
        cats: [{ t: "cold", v: 0.882, lo: 0.802, hi: 0.966, c: C.cold }, { t: "hot", v: 0.736, lo: 0.649, hi: 0.822, c: C.hot }], yl: "β" },
      { g: "within", t: "Stakes", src: "Augenblick & Rabin: wage quintile, N = 72", chip: ["reject", "Rung 1 rejected"], note: "flatness rejected (χ²₄ = 27.8); not decreasing; the dip depends on the binning",
        yd: [0.5, 1.02], ticks: [0.6, 0.8, 1.0], ref: 1, connect: true,
        cats: [{ t: "Q1", v: 0.865 }, { t: "Q2", v: 0.60 }, { t: "Q3", v: 0.91 }, { t: "Q4", v: 0.94 }, { t: "Q5", v: 0.84 }], yl: "β" },
      { g: "within", t: "Proximity", src: "Augenblick & Rabin: future work, within work date", chip: ["reject", "Rung 1 rejected"], note: "effort for a date falls as the date approaches (p = .0004)",
        yd: [-0.07, 0.07], ticks: [-0.05, 0, 0.05], ref: 0, connect: true, signed: true,
        cats: [{ t: "16–26", v: 0.045 }, { t: "9–15", v: 0.035 }, { t: "7–8", v: -0.043 }, { t: "4–6", v: -0.042 }], yl: "allocation, log", xl: "days to the work date" },
      { g: "within", t: "Hunger, induced", src: "March & Gluth: food choice, 70 people", chip: ["amber", "consistent with rejection"], note: "taste beats health 4.5 pp more often when hungry",
        yd: [-3, 11], ticks: [0, 5, 10], ref: 0, cats: [{ t: "hungry − sated", v: 4.5, lo: 0.3, hi: 8.8, c: C.unhealthy }], yl: "pp" },
      { g: "across", t: "Intoxication", src: "Schilbach: rickshaw drivers", chip: ["null", "collapses within person"], note: "−0.38 across drivers, −0.11 within the same driver",
        yd: [-0.55, 0.2], ticks: [-0.4, -0.2, 0], ref: 0, signed: true,
        cats: [{ t: "across drivers", v: -0.38, lo: -0.473, hi: -0.287, c: C.neutral }, { t: "within driver", v: -0.11, lo: -0.34, hi: 0.11, c: C.neutral, hollow: true }], yl: "take-up" },
      { g: "across", t: "Executive load (sleep)", src: "Bessone et al.: measured sleep", chip: ["null", "bounded null"], note: "flat across sleep quartiles (slope t = 0.9)",
        yd: [0.6, 1.02], ticks: [0.6, 0.8, 1.0], ref: 1, connect: true,
        cats: [{ t: "Q1", v: 0.89 }, { t: "Q2", v: 0.88 }, { t: "Q3", v: 0.85 }, { t: "Q4", v: 0.95 }], yl: "β", xl: "sleep quartile, least → most" },
      { g: "across", t: "Appetite × good", src: "Cheung et al.: measured appetite", chip: ["null", "bounded null"], note: "food − money gap moves by at most ±0.042 per s.d.",
        yd: [-0.06, 0.06], ticks: [-0.04, 0, 0.04], ref: 0, band: 0.042, signed: true,
        cats: [{ t: "per s.d. of appetite", v: -0.004, lo: -0.027, hi: 0.020, c: C.neutral }], yl: "Δβ" },
      { g: "placebo", t: "Payment medium", src: "Hoel et al.: randomized, 338 people", chip: ["ok", "survives (placebo)"], note: "the switching point does not move, as theory predicts",
        yd: [-0.5, 1.5], ticks: [0, 0.5, 1.0], ref: 0, signed: true,
        cats: [{ t: "censoring-aware", v: 0.52, lo: -0.11, hi: 1.14, c: C.healthy }, { t: "raw", v: 0.29, c: C.healthy, hollow: true }], yl: "rows" }
    ];
    var filt = "all";
    var sg = seg([{ v: "all", t: "All" }, { v: "within", t: "State varies within a person" }, { v: "across", t: "Measured, or across people" }, { v: "placebo", t: "Placebo" }], filt, function (v) { filt = v; apply(); }, "Filter margins");
    node.appendChild(h("div", { class: "controls" }, [sg.el]));
    var gridEl = h("div", { class: "mgrid" }); node.appendChild(gridEl);
    var els = cards.map(function (cd) {
      var holder = h("div", { class: "mchart" });
      var el = h("div", { class: "mcard", "data-g": cd.g }, [h("div", { class: "mhead" }, [h("h4", { text: cd.t }), h("p", { class: "src", text: cd.src })]), h("p", { class: "yl", text: cd.yl }), holder, h("div", { class: "mfoot" }, [chip(cd.chip[0], cd.chip[1]), h("p", { text: cd.note })])]);
      gridEl.appendChild(el);
      responsive(holder, function (w) { mini(holder, w, cd); });
      return el;
    });
    function apply() { els.forEach(function (el, i) { var on = filt === "all" || cards[i].g === filt; el.classList.toggle("dim", !on); el.setAttribute("aria-hidden", String(!on)); }); }
    function mini(holder, w, cd) {
      var H = 150, m = { l: 34, r: 8, t: 10, b: cd.xl ? 38 : 26 };
      var svg = svgRoot(holder, w, H, cd.t + ": " + cd.cats.map(function (c) { return c.t + " " + c.v; }).join(", "));
      var y = lin(cd.yd[0], cd.yd[1], H - m.b, m.t);
      cd.ticks.forEach(function (t) {
        s("line", { x1: m.l, x2: w - m.r, y1: y(t), y2: y(t), class: "grid" }, svg);
        s("text", { x: m.l - 5, y: y(t) + 4, "text-anchor": "end", "font-size": 10.5, class: "t-muted", text: cd.signed ? fmtS(t, Math.abs(t) < 0.1 && t !== 0 ? 2 : (t % 1 ? 1 : 0)) : (t % 1 ? t.toFixed(1) : t.toFixed(0)) }, svg);
      });
      if (cd.band) s("rect", { x: m.l, y: y(cd.band), width: w - m.l - m.r, height: y(-cd.band) - y(cd.band), fill: C.neutral, "fill-opacity": 0.1 }, svg);
      if (cd.ref !== undefined) s("line", { x1: m.l, x2: w - m.r, y1: y(cd.ref), y2: y(cd.ref), class: "ref" }, svg);
      var n = cd.cats.length, cw = (w - m.l - m.r) / n;
      var px = function (i) { return m.l + cw * i + cw / 2; };
      if (cd.connect) s("path", { d: cd.cats.map(function (c, i) { return (i ? "L" : "M") + px(i) + "," + y(c.v); }).join(""), fill: "none", stroke: C.ink2, "stroke-width": 1.5, "stroke-opacity": 0.6 }, svg);
      cd.cats.forEach(function (c, i) {
        var col = c.c || C.ink2;
        if (c.lo !== undefined) whisker(svg, px(i), y(c.lo), y(c.hi), col, false, 3);
        dot(svg, px(i), y(c.v), 4.5, col, c.hollow);
        var words = c.t.split(" ");
        var lines = n > 2 || c.t.length < 12 ? [c.t] : [words.slice(0, Math.ceil(words.length / 2)).join(" "), words.slice(Math.ceil(words.length / 2)).join(" ")];
        lines.forEach(function (ln, li) { s("text", { x: px(i), y: H - m.b + 14 + li * 12, "text-anchor": "middle", "font-size": 10.5, class: "t-ink", text: ln }, svg); });
        tip(s("rect", { x: px(i) - Math.min(cw / 2, 18), y: m.t, width: Math.min(cw, 36), height: H - m.t - m.b }, svg),
          [{ v: (cd.signed ? fmtS(c.v, Math.abs(c.v) < 1 ? 3 : 1) : String(c.v)), l: cd.t + " · " + c.t, c: col, note: c.lo !== undefined ? "95% interval " + fmtS(c.lo, 3) + " to " + fmtS(c.hi, 3) : "" }]);
      });
      if (cd.xl) s("text", { x: (m.l + w - m.r) / 2, y: H - 4, "text-anchor": "middle", "font-size": 10.5, class: "t-muted", text: cd.xl }, svg);
    }
  };

  /* =====================================================================
     FIGURE 10 — separating dispersion from noise (simulated people)
     ===================================================================== */
  VIZ.noise = function (node) {
    var rand = rng(2015), P = [];
    for (var i = 0; i < 96; i++) {
      var te = Math.log(0.876) + 0.237 * rand.norm(), tm = Math.log(0.987) + 0.003 * rand.norm();
      var se = Math.exp(Math.log(0.2) + 0.35 * rand.norm()), sm = Math.exp(Math.log(0.077) + 0.35 * rand.norm());
      P.push({ te: te, tm: tm, ne: se * rand.norm(), nm: sm * rand.norm(), j1: rand() - 0.5, j2: rand() - 0.5 });
    }
    var k = 0, anim = null;
    var sl = slider({ label: "Sampling noise removed", min: 0, max: 1, step: 0.01, value: 0, fmt: function (v) { return Math.round(v * 100) + "%"; }, onInput: function (v) { if (anim) anim(); k = v; redraw(); } });
    var btn = h("button", { type: "button", class: "btn-run", text: "Remove the noise" });
    btn.addEventListener("click", function () {
      if (anim) anim();
      var from = k, to = k > 0.5 ? 0 : 1;
      btn.textContent = to ? "Add the noise back" : "Remove the noise";
      anim = tween(1600, function (t) { k = from + (to - from) * t; sl.set(k); redraw(); }, function () { anim = null; });
    });
    node.appendChild(h("div", { class: "controls" }, [sl.el, btn]));
    var holder = h("div"); node.appendChild(holder);
    var tE = tile("Spread over effort (s.d. of log β)", ""), tM = tile("Spread over money (s.d. of log β)", ""), tR = tile("Correlation effort–money", "", true);
    node.appendChild(h("div", { class: "readouts" }, [tE.el, tM.el, tR.el]));
    var redraw = responsive(holder, function (w) {
      var ve = P.map(function (p) { return p.te + (1 - k) * p.ne; }), vm = P.map(function (p) { return p.tm + (1 - k) * p.nm; });
      var sE = sd(ve), sM = sd(vm);
      tE.set(sE.toFixed(2)); tM.set(sM.toFixed(2));
      tR.set(sM < 0.012 ? "undefined" : fmtS(corr(ve, vm), 2));
      var two = w >= 700;
      var sw = two ? Math.floor(w * 0.58) : w, H1 = 210, H2 = two ? H1 : 230;
      var H = two ? H1 : H1 + H2 + 18;
      var svg = svgRoot(holder, w, H, "Individual estimates of beta over effort and over money with " + Math.round(k * 100) + "% of sampling noise removed");
      var lo = Math.log(0.35), hi = Math.log(2.2);
      // strips
      var x = lin(lo, hi, 70, sw - 10);
      var ticks = [0.5, 0.75, 1, 1.5, 2];
      ticks.forEach(function (t) {
        s("line", { x1: x(Math.log(t)), x2: x(Math.log(t)), y1: 10, y2: H1 - 34, class: "grid" }, svg);
        s("text", { x: x(Math.log(t)), y: H1 - 18, "text-anchor": "middle", "font-size": 11.5, class: "t-muted", text: String(t) }, svg);
      });
      s("text", { x: (70 + sw - 10) / 2, y: H1 - 2, "text-anchor": "middle", "font-size": 11.5, class: "t-muted", text: "individual β (log scale)" }, svg);
      [{ t: "over effort", v: ve, c: C.axPerson, y: 52, jk: "j1" }, { t: "over money", v: vm, c: C.money, y: 128, jk: "j2" }].forEach(function (r) {
        s("text", { x: 0, y: r.y + 4, "font-size": 12.5, class: "t-ink", text: r.t }, svg);
        r.v.forEach(function (v, i) { s("circle", { cx: x(clamp(v, lo, hi)), cy: r.y + P[i][r.jk] * 44, r: 3.4, fill: r.c, "fill-opacity": 0.75, stroke: "#fff", "stroke-width": 1 }, svg); });
      });
      // scatter
      var g = s("g", { transform: two ? "translate(" + (sw + 26) + ",0)" : "translate(0," + (H1 + 18) + ")" }, svg);
      var gw = two ? w - sw - 26 : w, gh = H2;
      var xs = lin(Math.log(0.4), Math.log(2.0), 40, gw - 6), ys = lin(Math.log(0.78), Math.log(1.25), gh - 38, 18);
      s("rect", { x: 40, y: 18, width: gw - 46, height: gh - 56, fill: "none", stroke: C.rule }, g);
      [0.5, 1, 1.5].forEach(function (t) { s("text", { x: xs(Math.log(t)), y: gh - 22, "text-anchor": "middle", "font-size": 11, class: "t-muted", text: String(t) }, g); });
      [0.8, 1, 1.2].forEach(function (t) { s("text", { x: 34, y: ys(Math.log(t)) + 4, "text-anchor": "end", "font-size": 11, class: "t-muted", text: t.toFixed(1) }, g); s("line", { x1: 40, x2: gw - 6, y1: ys(Math.log(t)), y2: ys(Math.log(t)), class: "grid" }, g); });
      s("text", { x: (40 + gw) / 2, y: gh - 6, "text-anchor": "middle", "font-size": 11.5, class: "t-muted", text: "β over effort" }, g);
      s("text", { x: 40, y: 10, "font-size": 11.5, class: "t-muted", text: "β over money ↑   (same person)" }, g);
      P.forEach(function (p, i) { s("circle", { cx: xs(clamp(ve[i], Math.log(0.4), Math.log(2))), cy: ys(clamp(vm[i], Math.log(0.78), Math.log(1.25))), r: 3.2, fill: C.ink2, "fill-opacity": 0.55 }, g); });
      if (sM < 0.012) s("text", { x: gw - 8, y: ys(Math.log(0.987)) - 10, "text-anchor": "end", "font-size": 11.5, "font-weight": 600, fill: C.ink, text: "a variable against a constant" }, g);
    });
  };

  /* =====================================================================
     FIGURE 11 — correlations within and across structures
     ===================================================================== */
  VIZ.corr = function (node) {
    var holder = h("div"); node.appendChild(holder);
    var rows = [
      { grp: "Within one structure: reward–reward (Cheung et al., 2022)", short: "Within one structure (reward–reward)" },
      { t: "money – healthy food", v: 0.92, lo: 0.81, hi: 1.0, c: C.axGood },
      { t: "money – unhealthy food", v: 0.89, lo: 0.76, hi: 1.0, c: C.axGood },
      { t: "healthy – unhealthy food", v: 0.71, lo: 0.55, hi: 0.87, c: C.axGood },
      { grp: "Across structures: effort (C–C) vs money (R–R) (Augenblick et al., 2015)", short: "Across structures (effort vs money)" },
      { t: "effort – money", v: 0.03, lo: -0.10, hi: 0.15, c: C.axPerson, raw: true }
    ];
    node.appendChild(dataTable("Show the numbers", ["Pair", "Correlation", "95% interval"], rows.filter(function (r) { return !r.grp; }).map(function (r) { return [r.t, (r.raw ? "raw estimates only: " : "true: ") + fmtS(r.v, 2), fmtS(r.lo, 2) + " to " + fmtS(r.hi, 2)]; })));
    responsive(holder, function (w) {
      var narrow = w < 560, lab = narrow ? 0 : 190, rh = narrow ? 44 : 34;
      var H = 32; rows.forEach(function (r) { H += r.grp ? 30 : rh; }); H += 30;
      var svg = svgRoot(holder, w, H, "True correlations within one structure 0.92, 0.89, 0.71; across structures not defined, raw +0.03");
      var x = lin(-0.2, 1.0, lab + 8, w - 40);
      var y = 16, top = 16;
      [-0.2, 0, 0.2, 0.4, 0.6, 0.8, 1.0].forEach(function (t) { s("text", { x: x(t), y: H - 12, "text-anchor": "middle", "font-size": 11, class: "t-muted", text: fmtS(t, 1) }, svg); });
      var gridTop = top, gridBot = H - 26;
      [-0.2, 0, 0.2, 0.4, 0.6, 0.8, 1.0].forEach(function (t) { s("line", { x1: x(t), x2: x(t), y1: gridTop, y2: gridBot, class: t === 0 ? "axis" : "grid" }, svg); });
      rows.forEach(function (r) {
        if (r.grp) { if (y > 20) y += 12; s("text", { x: 0, y: y + 14, "font-size": 12, class: "t-strong", text: narrow ? r.short : r.grp }, svg); y += 30; return; }
        var cy = y + (narrow ? 28 : rh / 2);
        if (narrow) s("text", { x: x(-0.2), y: y + 12, "font-size": 12, class: "t-ink", text: r.t }, svg);
        else s("text", { x: 0, y: cy + 4, "font-size": 12.5, class: "t-ink", text: r.t }, svg);
        if (!r.raw) {
          s("rect", { x: x(0.47), y: cy - 9, width: x(0.60) - x(0.47), height: 18, fill: C.neutral, "fill-opacity": 0.16, rx: 2 }, svg);
          if (r.t === "money – healthy food") s("text", { x: (x(0.47) + x(0.60)) / 2, y: cy - 13, "text-anchor": "middle", "font-size": 10.5, class: "t-muted", text: "raw 0.47–0.60" }, svg);
        }
        whisker(svg, cy, x(r.lo), x(r.hi), r.c, true, 4);
        dot(svg, x(r.v), cy, 6, r.c, r.raw);
        s("text", { x: x(r.hi) + 8, y: cy + 4, "font-size": 12, class: "t-strong", text: r.raw ? "raw " + fmtS(r.v, 2) + " · true: not defined" : fmtS(r.v, 2) }, svg);
        tip(s("rect", { x: x(r.lo) - 6, y: cy - 12, width: x(r.hi) - x(r.lo) + 12, height: 24 }, svg), [{ v: fmtS(r.v, 2), l: r.t + (r.raw ? " (raw estimates)" : " (noise removed)"), c: r.c, note: r.raw ? "With no true dispersion over money, the true correlation is not defined." : "95% interval " + fmtS(r.lo, 2) + " to " + fmtS(r.hi, 2) + " · grey band: raw correlations 0.47–0.60" }]);
        y += rh;
      });
    });
  };

  /* =====================================================================
     FIGURE 12 — predict, then reveal: β by good
     ===================================================================== */
  VIZ.predict = function (node) {
    var goods = [
      { k: "money", t: "Money", v: 0.820, lo: 0.784, hi: 0.855, cv: 0.799, clo: 0.758, chi: 0.838, c: C.money },
      { k: "healthy", t: "Healthy snack", v: 0.852, lo: 0.808, hi: 0.893, cv: 0.863, clo: 0.823, chi: 0.903, c: C.healthy },
      { k: "unhealthy", t: "Unhealthy snack", v: 0.861, lo: 0.819, hi: 0.900, cv: 0.869, clo: 0.829, chi: 0.905, c: C.unhealthy }
    ];
    var pick = null, common = false;
    var picks = h("div", { class: "picks", role: "group", "aria-label": "Your prediction" });
    goods.forEach(function (g) {
      var b = h("button", { type: "button", class: "pick", "aria-pressed": "false" }, [h("span", { class: "dt", style: "background:" + g.c }), g.t]);
      b.addEventListener("click", function () { pick = g.k; picks.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); reveal(); });
      picks.appendChild(b);
    });
    var skip = h("button", { type: "button", class: "btn-run ghost", text: "Just show me" });
    skip.addEventListener("click", function () { reveal(); });
    node.appendChild(h("div", { class: "controls" }, [picks, skip]));
    var feedback = h("p", { class: "say", "aria-live": "polite", style: "margin-top:0" }); node.appendChild(feedback);
    var ck = check("Also show estimates with one common elasticity", false, function (v) { common = v; redraw(); });
    var after = h("div", { hidden: true }, [h("div", { class: "controls", style: "margin-top:4px" }, [ck.el])]);
    var holder = h("div"); after.appendChild(holder);
    node.appendChild(after);
    var redraw = function () {};
    function reveal() {
      var right = pick === "money";
      feedback.innerHTML = pick === null ? "" : right
        ? "<b>Right — and against most theories.</b> The commodity view (money is fungible, storable and “cold”) predicts money to be the <i>least</i> present-biased; the temptation view predicts unhealthy snacks to be the most. The data reject both."
        : "<b>Most theories would agree with you — the data do not.</b> The commodity view (money is fungible, storable and “cold”) predicts money to be the <i>least</i> present-biased; the temptation view predicts unhealthy snacks to be the most. Money is the <i>most</i> present-biased, and the two foods are indistinguishable.";
      if (pick === null) feedback.innerHTML = "The commodity view predicts money to be the <i>least</i> present-biased; the temptation view predicts unhealthy snacks to be the most. The data reject both.";
      if (after.hidden) { after.hidden = false; redraw = responsive(holder, draw); } else redraw();
    }
    function draw(w) {
      var H = 240, m = { l: 44, r: 10, t: 16, b: 36 };
      var svg = svgRoot(holder, w, H, "Beta by good: money 0.820, healthy 0.852, unhealthy 0.861");
      var y = lin(0.74, 0.92, H - m.b, m.t);
      yAxis(svg, y, [0.75, 0.80, 0.85, 0.90], m.l, w - m.r, function (t) { return t.toFixed(2); });
      var cw = (w - m.l - m.r) / 3;
      goods.forEach(function (g, i) {
        var cx = m.l + cw * i + cw / 2 + (common ? 12 : 0);
        if (common) {
          whisker(svg, cx - 24, y(g.clo), y(g.chi), C.neutral);
          dot(svg, cx - 24, y(g.cv), 5.5, C.neutral, true);
        }
        whisker(svg, cx, y(g.lo), y(g.hi), g.c);
        dot(svg, cx, y(g.v), 7, g.c);
        s("text", { x: cx + 12, y: y(g.v) + 4, "font-size": 13, class: "t-strong", text: g.v.toFixed(3) }, svg);
        s("text", { x: m.l + cw * i + cw / 2, y: H - m.b + 22, "text-anchor": "middle", "font-size": 12.5, class: pick === g.k ? "t-strong" : "t-ink", text: g.t + (pick === g.k ? " (your pick)" : "") }, svg);
        tip(s("rect", { x: cx - 18, y: y(g.hi) - 6, width: 36, height: y(g.lo) - y(g.hi) + 12 }, svg), [{ v: g.v.toFixed(3), l: "β over " + g.t.toLowerCase() + ", good-specific elasticity", c: g.c, note: "95% interval " + g.lo.toFixed(3) + " – " + g.hi.toFixed(3) + (common ? " · common elasticity: " + g.cv.toFixed(3) : "") }]);
      });
      if (common) s("text", { x: w - m.r, y: m.t + 4, "text-anchor": "end", "font-size": 11.5, class: "t-muted", text: "hollow: one common elasticity (money − food gap −0.068; intervals approximate)" }, svg);
    }
  };

  /* =====================================================================
     FIGURE 13 — snack-choice groups: person effect + good effect
     ===================================================================== */
  VIZ.snacks = function (node) {
    var G = [
      { k: "H1", x: 0.791, y: 0.816, r: 9, f: "healthy" }, { k: "H2", x: 0.861, y: 0.890, r: 7, f: "healthy" }, { k: "H3", x: 0.820, y: 0.867, r: 5, f: "healthy" },
      { k: "U1", x: 0.775, y: 0.817, r: 7, f: "unhealthy" }, { k: "U2", x: 0.854, y: 0.871, r: 7, f: "unhealthy" }, { k: "U3", x: 0.823, y: 0.882, r: 9, f: "unhealthy" }
    ];
    var mode = "data", t = 1, from = "data", stopT = null;
    var target = function (g, md) { return md === "data" ? g.y : md === "person" ? g.x : g.x + 0.036; };
    var sg = seg([{ v: "person", t: "1 · Person effect only" }, { v: "good", t: "2 · Add a good effect" }, { v: "data", t: "3 · The data" }], mode, function (v) {
      if (stopT) stopT(); from = mode; mode = v; t = 0;
      stopT = tween(900, function (u) { t = u; redraw(); });
    }, "Decomposition");
    node.appendChild(h("div", { class: "controls" }, [sg.el]));
    node.appendChild(legend([{ t: "healthy-snack groups (H)", c: C.healthy, type: "dt" }, { t: "unhealthy-snack groups (U)", c: C.unhealthy, type: "sw" }, { t: "β snack = β money", c: C.neutral, type: "ln" }, { t: "+ 0.036", c: C.hot, type: "ln", dash: true }]));
    var holder = h("div"); node.appendChild(holder);
    var say = h("p", { class: "say", "aria-live": "polite" }); node.appendChild(say);
    var copy = {
      person: "<b>A pure person effect</b> would put every group on the diagonal: groups that are more present-biased over money would be equally so over their snack.",
      good: "<b>Add a good effect of +0.036</b> — food is less present-biased than money for everyone — and every group shifts up by the same amount.",
      data: "<b>The data</b> sit close to that line: groups line up along it (person effect, correlation 0.89), all above the diagonal (good effect). Within “food”, β spans 0.82–0.89 — more than the money–food gap."
    };
    node.appendChild(dataTable("Show the numbers", ["Group", "β over money", "β over chosen snack"], G.map(function (g) { return [g.k + (g.f === "healthy" ? " (healthy)" : " (unhealthy)"), g.x.toFixed(3), g.y.toFixed(3)]; })));
    var redraw = responsive(holder, function (w) {
      say.innerHTML = copy[mode];
      var size = Math.min(w, 520), H = Math.round(size * 0.82);
      var m = { l: 46, r: 14, t: 12, b: 40 };
      var svg = svgRoot(holder, w, H, "Six snack-choice groups: beta over money against beta over the chosen snack");
      var ox = (w - size) / 2;
      var g = s("g", { transform: "translate(" + ox + ",0)" }, svg);
      var x = lin(0.76, 0.91, m.l, size - m.r), y = lin(0.76, 0.91, H - m.b, m.t);
      [0.78, 0.82, 0.86, 0.90].forEach(function (v) {
        s("line", { x1: x(v), x2: x(v), y1: m.t, y2: H - m.b, class: "grid" }, g);
        s("line", { x1: m.l, x2: size - m.r, y1: y(v), y2: y(v), class: "grid" }, g);
        s("text", { x: x(v), y: H - m.b + 16, "text-anchor": "middle", "font-size": 11.5, class: "t-muted", text: v.toFixed(2) }, g);
        s("text", { x: m.l - 6, y: y(v) + 4, "text-anchor": "end", "font-size": 11.5, class: "t-muted", text: v.toFixed(2) }, g);
      });
      s("text", { x: (m.l + size - m.r) / 2, y: H - 4, "text-anchor": "middle", "font-size": 11.5, class: "t-muted", text: "β over money, same people" }, g);
      s("text", { x: m.l, y: m.t - 0, "font-size": 11.5, class: "t-muted", text: "", transform: "" }, g);
      s("text", { x: 12, y: (m.t + H - m.b) / 2, "text-anchor": "middle", "font-size": 11.5, class: "t-muted", transform: "rotate(-90 12 " + ((m.t + H - m.b) / 2) + ")", text: "β over the chosen snack" }, g);
      s("line", { x1: x(0.76), y1: y(0.76), x2: x(0.91), y2: y(0.91), stroke: C.neutral, "stroke-width": 1.5 }, g);
      if (mode !== "person") s("line", { x1: x(0.76), y1: y(0.796), x2: x(0.874), y2: y(0.91), stroke: C.hot, "stroke-width": 1.5, "stroke-dasharray": "6 4", opacity: mode === "person" ? 0 : 1 }, g);
      G.forEach(function (d) {
        var yy = target(d, from) + (target(d, mode) - target(d, from)) * t;
        var cx = x(d.x), cy = y(yy), col = d.f === "healthy" ? C.healthy : C.unhealthy;
        if (d.f === "healthy") s("circle", { cx: cx, cy: cy, r: d.r, fill: col, stroke: "#fff", "stroke-width": 2 }, g);
        else s("rect", { x: cx - d.r, y: cy - d.r, width: 2 * d.r, height: 2 * d.r, rx: 1.5, fill: col, stroke: "#fff", "stroke-width": 2 }, g);
        s("text", { x: cx + d.r + 5, y: cy + 4, "font-size": 11.5, class: "t-ink", text: d.k }, g);
        tip(s("circle", { cx: cx, cy: cy, r: Math.max(14, d.r + 4) }, g), [{ title: d.k + " · " + d.f + "-snack group" }, { v: d.x.toFixed(3), l: "β over money", c: C.money }, { v: d.y.toFixed(3), l: "β over the chosen snack", c: col }]);
      });
    });
  };

  /* =====================================================================
     FIGURE 14 — a shift (trait) vs a tilt (drinking, smoking)
     ===================================================================== */
  VIZ.tilt = function (node) {
    var mode = "shift", z = 0;
    var base = [0.820, 0.852, 0.861], slope = [0.043, 0.034, 0.006];
    var groups = [
      { t: "neither (585)", v: [0.838, 0.857, 0.865], c: C.neutral },
      { t: "drinks (95)", v: [0.737, 0.822, 0.868], c: C.drink },
      { t: "smokes (50)", v: [0.762, 0.890, 0.847], c: C.smoke }
    ];
    var ctl = h("div", { class: "controls" });
    var sl = slider({ label: "Self-reported patience", min: -1, max: 1, step: 0.05, value: 0, fmt: function (v) { return (v > 0 ? "+" : v < 0 ? MINUS : "") + Math.abs(v).toFixed(1) + " s.d."; }, onInput: function (v) { z = v; redraw(); } });
    var sg = seg([{ v: "shift", t: "Patience: a shift" }, { v: "tilt", t: "Drinking & smoking: a tilt" }], mode, function (v) { mode = v; sl.el.hidden = v !== "shift"; redraw(); }, "View");
    ctl.appendChild(sg.el); ctl.appendChild(sl.el);
    node.appendChild(ctl);
    var leg = h("div"); node.appendChild(leg);
    var holder = h("div"); node.appendChild(holder);
    var say = h("p", { class: "say", "aria-live": "polite" }); node.appendChild(say);
    var redraw = responsive(holder, function (w) {
      leg.textContent = "";
      if (mode === "tilt") leg.appendChild(legend(groups.map(function (g) { return { t: g.t, c: g.c, type: "dt" }; })));
      else leg.appendChild(legend([{ t: "at the chosen patience", c: C.navy, type: "dt" }, { t: "average person", c: C.neutral, type: "ring" }]));
      say.innerHTML = mode === "shift"
        ? "A more patient person is less present-biased <b>over every reward</b>: money +0.043 and healthy food +0.034 per s.d. The whole profile moves together — the signature of a trait."
        : "Drinkers and smokers are more present-biased <b>over money only</b>: β falls from 0.84 to 0.74 (drinkers) and 0.76 (smokers), while food barely moves. Cash buys immediate consumption that no snack can.";
      var H = 250, m = { l: 44, r: 16, t: 14, b: 34 };
      var svg = svgRoot(holder, w, H, mode === "shift" ? "Beta profile across goods by patience" : "Beta profile across goods by drinking and smoking");
      var y = lin(0.70, 0.92, H - m.b, m.t);
      yAxis(svg, y, [0.70, 0.75, 0.80, 0.85, 0.90], m.l, w - m.r, function (t) { return t.toFixed(2); });
      var names = ["money", "healthy food", "unhealthy food"], cw = (w - m.l - m.r) / 3;
      var px = function (i) { return m.l + cw * i + cw / 2; };
      names.forEach(function (n, i) { s("text", { x: px(i), y: H - m.b + 22, "text-anchor": "middle", "font-size": 12.5, class: "t-ink", text: n }, svg); });
      var line = function (vals, col, dash, hollow, label) {
        s("path", { d: vals.map(function (v, i) { return (i ? "L" : "M") + px(i) + "," + y(v); }).join(""), fill: "none", stroke: col, "stroke-width": 2, "stroke-dasharray": dash || null }, svg);
        vals.forEach(function (v, i) {
          dot(svg, px(i), y(v), 5.5, col, hollow);
          tip(s("circle", { cx: px(i), cy: y(v), r: 13 }, svg), [{ v: v.toFixed(3), l: label + " · " + names[i], c: col }]);
        });
      };
      if (mode === "shift") {
        var cur = base.map(function (b, i) { return b + slope[i] * z; });
        line(base, C.neutral, "4 4", true, "average person");
        line(cur, C.navy, null, false, "patience " + (z >= 0 ? "+" : MINUS) + Math.abs(z).toFixed(1) + " s.d.");
        cur.forEach(function (v, i) { s("text", { x: px(i) + 10, y: y(v) - 9, "font-size": 12, class: "t-strong", text: v.toFixed(3) }, svg); });
      } else {
        groups.forEach(function (g) { line(g.v, g.c, null, false, g.t); });
        var x0 = px(0) - 26;
        s("line", { x1: x0, x2: x0, y1: y(0.838) + 2, y2: y(0.737) - 8, stroke: C.drink, "stroke-width": 2 }, svg);
        arrowHead(svg, x0, y(0.737) - 2, Math.PI / 2, C.drink, 7);
        s("text", { x: x0 - 6, y: (y(0.838) + y(0.737)) / 2 + 4, "text-anchor": "end", "font-size": 12, class: "t-strong", text: MINUS + "0.10" }, svg);
      }
    });
  };

  /* =====================================================================
     FIGURE 15 — three frameworks: the weaker the assumptions, the wider
     ===================================================================== */
  VIZ.frameworks = function (node) {
    var data = {
      ar: { t: "Augenblick & Rabin (2019)", rows: [{ v: 0.80 }, { lo: 0.75, hi: 0.95 }, { lo: 0.72, hi: 1.00 }] },
      fe: { t: "Fedyk (2024)", rows: [{ v: 0.74, lo: 0.68, hi: 0.80 }, { lo: 0.80, hi: 0.95 }, { lo: 0.67, hi: 1.00 }] }
    };
    var names = [
      { t: "Parametric two-step", s: "isoelastic cost", verdict: ["reject", "β = 1 rejected"] },
      { t: "Measurement-error-robust set", s: "monotone supply + centered error", verdict: ["reject", "β = 1 rejected"] },
      { t: "Nonparametric bracket", s: "monotone supply only", verdict: ["null", "cannot exclude β = 1"] }
    ];
    var cur = "ar";
    var sg = seg([{ v: "ar", t: data.ar.t }, { v: "fe", t: data.fe.t }], cur, function (v) { cur = v; redraw(); }, "Experiment");
    node.appendChild(h("div", { class: "controls" }, [sg.el]));
    var holder = h("div"); node.appendChild(holder);
    var chips = h("div", { class: "fw-chips" }); node.appendChild(chips);
    var redraw = responsive(holder, function (w) {
      chips.textContent = "";
      names.forEach(function (n) { chips.appendChild(h("span", { class: "fw-chip" }, [h("b", { text: n.t + ": " }), chip(n.verdict[0], n.verdict[1])])); });
      var narrow = w < 600, lab = narrow ? 0 : 230, rh = narrow ? 58 : 50;
      var H = 26 + rh * 3 + 40;
      var svg = svgRoot(holder, w, H, "Bounds on beta under three frameworks for " + data[cur].t);
      var x = lin(0.6, 1.05, lab + 10, w - 16);
      [0.6, 0.7, 0.8, 0.9, 1.0].forEach(function (t) {
        s("line", { x1: x(t), x2: x(t), y1: 14, y2: H - 34, class: "grid" }, svg);
        s("text", { x: x(t), y: H - 18, "text-anchor": "middle", "font-size": 11.5, class: "t-muted", text: t.toFixed(1) }, svg);
      });
      s("line", { x1: x(1), x2: x(1), y1: 8, y2: H - 34, stroke: C.ink, "stroke-width": 1.2, "stroke-dasharray": "3 3" }, svg);
      s("text", { x: x(1) + 4, y: 12, "font-size": 11, class: "t-muted", text: "β = 1" }, svg);
      s("text", { x: (lab + w) / 2, y: H - 2, "text-anchor": "middle", "font-size": 11.5, class: "t-muted", text: "values of β not ruled out" }, svg);
      data[cur].rows.forEach(function (r, i) {
        var cy = 26 + i * rh + (narrow ? 30 : rh / 2);
        var n = names[i];
        if (narrow) { s("text", { x: x(0.6), y: cy - 16, "font-size": 12.5, class: "t-strong", text: n.t }, svg); }
        else { s("text", { x: 0, y: cy - 2, "font-size": 12.5, class: "t-strong", text: n.t }, svg); s("text", { x: 0, y: cy + 13, "font-size": 11.5, class: "t-muted", text: n.s }, svg); }
        var col = i === 0 ? C.navy : i === 1 ? C.cold : C.neutral;
        if (r.lo !== undefined && r.v === undefined) {
          s("rect", { x: x(r.lo), y: cy - 8, width: x(r.hi) - x(r.lo), height: 16, rx: 8, fill: col, "fill-opacity": 0.22, stroke: col, "stroke-width": 2 }, svg);
          s("text", { x: (x(r.lo) + x(r.hi)) / 2, y: cy + 4, "text-anchor": "middle", "font-size": 12, class: "t-strong", text: "[" + r.lo.toFixed(2) + ", " + r.hi.toFixed(2) + "]" }, svg);
        } else {
          if (r.lo !== undefined) whisker(svg, cy, x(r.lo), x(r.hi), col, true, 5);
          dot(svg, x(r.v), cy, 6.5, col);
          if (narrow) s("text", { x: x(r.hi !== undefined ? r.hi : r.v) + 10, y: cy + 4, "font-size": 12, class: "t-strong", text: r.v.toFixed(2) }, svg);
          else s("text", { x: x(r.v), y: cy - 12, "text-anchor": "middle", "font-size": 12, class: "t-strong", text: r.v.toFixed(2) + (r.lo !== undefined ? "  [" + r.lo.toFixed(2) + ", " + r.hi.toFixed(2) + "]" : "") }, svg);
        }
        tip(s("rect", { x: x(0.6), y: cy - 14, width: x(1.05) - x(0.6), height: 28 }, svg), [{ v: r.v !== undefined ? r.v.toFixed(2) : "[" + r.lo.toFixed(2) + ", " + r.hi.toFixed(2) + "]", l: n.t + " · " + data[cur].t, c: col, note: n.s }]);
      });
    });
  };

  /* =====================================================================
     FIGURE 16 — the household panel grid (ECPF)
     ===================================================================== */
  VIZ.ecpf = function (node) {
    var deltas = [0.94, 0.95, 0.96, 0.97, 0.98, 0.99, 0.995, 1];
    var betas = ["1 (ED)", "0.99", "0.975", "0.95", "0.9", "0.8", "0.7"];
    var D = {
      singles: { t: "Single-person households (185)", m: [
        [10.9, 10.4, 9.2, 7.1, 6.0, 7.8, 8.6, 9.3], [10.7, 10.2, 8.9, 6.4, 3.5, 4.2, 5.9, 7.2], [10.5, 9.9, 8.6, 6.0, 2.8, 1.4, 1.4, 2.1],
        [10.4, 9.7, 8.4, 5.8, 2.6, 1.0, 0.8, 0.7], [10.3, 9.6, 8.2, 5.6, 2.4, 0.9, 0.6, 0.5], [10.2, 9.5, 8.0, 5.5, 2.3, 0.8, 0.6, 0.4], [10.1, 9.4, 8.0, 5.4, 2.3, 0.8, 0.5, 0.4]],
        ok: function (r, c) { return (c === 4 && r >= 1) || ((c === 5 || c === 6) && r >= 2) || (c === 7 && r >= 3); } },
      couples: { t: "Couples (2,004)", m: [
        [10.7, 10.3, 9.3, 7.1, 6.3, 8.3, 9.1, 9.7], [10.5, 10.1, 8.9, 6.3, 3.5, 4.9, 6.4, 7.8], [10.3, 9.8, 8.6, 5.9, 2.6, 1.7, 1.9, 2.7],
        [10.1, 9.6, 8.3, 5.6, 2.3, 1.1, 0.9, 0.8], [10.0, 9.4, 8.2, 5.5, 2.2, 0.9, 0.7, 0.6], [9.9, 9.3, 8.0, 5.4, 2.1, 0.9, 0.7, 0.5], [9.8, 9.2, 8.0, 5.3, 2.0, 0.8, 0.6, 0.5]],
        ok: function (r, c) { return ((c === 5 || c === 6) && r >= 2) || (c === 7 && r >= 3); } }
    };
    var cur = "singles", tol = 1.5;
    var sg = seg([{ v: "singles", t: "Singles" }, { v: "couples", t: "Couples" }], cur, function (v) { cur = v; redraw(); }, "Sample");
    var sl = slider({ label: "Error you tolerate", min: 0, max: 11, step: 0.1, value: tol, fmt: function (v) { return v.toFixed(1) + "%"; }, onInput: function (v) { tol = v; redraw(); } });
    node.appendChild(h("div", { class: "controls" }, [sg.el, sl.el]));
    node.appendChild(legend([{ t: "rationalized within your tolerance", c: C.gold, type: "ring" }, { t: "not rejected at 5% (robust test)", c: C.navy, type: "ln" }]));
    var holder = h("div"); node.appendChild(holder);
    var tA = tile("Exponential discounting needs at least", ""), tB = tile("Quasi-hyperbolic with β ≤ 0.95, δ ≥ 0.99, needs", ""), tC = tile("Pairs rationalized at your tolerance", "", true);
    node.appendChild(h("div", { class: "readouts" }, [tA.el, tB.el, tC.el]));
    // sequential: one hue (blue), light = little error, dark = a lot
    var ramp = ["#EEF4FB", "#cde2fb", "#b7d3f6", "#9ec5f4", "#86b6ef", "#6da7ec", "#5598e7", "#3987e5", "#2a78d6", "#256abf", "#1c5cab", "#184f95"];
    var colorOf = function (v) { return ramp[clamp(Math.floor(v), 0, ramp.length - 1)]; };
    var redraw = responsive(holder, function (w) {
      var d = D[cur];
      var edMin = Math.min.apply(null, d.m[0]);
      var q = d.m[3].slice(5, 8);
      tA.set(edMin.toFixed(1) + "% of spending"); tB.set(Math.min.apply(null, q).toFixed(1) + "–" + Math.max.apply(null, q).toFixed(1) + "% of spending");
      var cnt = 0; d.m.forEach(function (row) { row.forEach(function (v) { if (v <= tol + 1e-9) cnt++; }); });
      tC.set(cnt + " of 56");
      var lab = 62, top = 26, cw = Math.min(64, (w - lab - 4) / 8), ch = Math.min(38, Math.max(28, cw * 0.62));
      var gw = lab + cw * 8, ox = Math.max(0, (w - gw) / 2);
      var H = top + ch * 7 + 44;
      var svg = svgRoot(holder, w, H, d.t + ": measurement error required by each beta-delta pair");
      var g = s("g", { transform: "translate(" + ox + ",0)" }, svg);
      s("text", { x: lab, y: 14, "font-size": 12, class: "t-strong", text: d.t }, g);
      d.m.forEach(function (row, ri) {
        s("text", { x: lab - 8, y: top + ri * ch + ch / 2 + 4, "text-anchor": "end", "font-size": 11.5, class: "t-ink", text: betas[ri] }, g);
        row.forEach(function (v, ci) {
          var x = lab + ci * cw, y = top + ri * ch;
          s("rect", { x: x + 1, y: y + 1, width: cw - 2, height: ch - 2, fill: colorOf(v), rx: 2 }, g);
          var inTol = v <= tol + 1e-9;
          if (inTol) s("rect", { x: x + 3, y: y + 3, width: cw - 6, height: ch - 6, fill: "none", stroke: C.gold, "stroke-width": 2.5, rx: 2 }, g);
          s("text", { x: x + cw / 2, y: y + ch / 2 + 4, "text-anchor": "middle", "font-size": cw < 40 ? 10.5 : 11.5, "font-weight": inTol ? 700 : 500, fill: Math.floor(v) >= 6 ? "#fff" : C.ink, text: v.toFixed(1) }, g);
          tip(s("rect", { x: x, y: y, width: cw, height: ch }, g), [{ v: v.toFixed(1) + "%", l: "error required at β ≤ " + betas[ri].replace(" (ED)", "") + ", δ = " + deltas[ci], c: colorOf(v), note: d.ok(ri, ci) ? "not rejected at 5% by the robust test" : "rejected at 5% by the robust test" }]);
        });
      });
      // outline of the non-rejected region
      var path = "";
      for (var r2 = 0; r2 < 7; r2++) for (var c2 = 0; c2 < 8; c2++) {
        if (!d.ok(r2, c2)) continue;
        var x0 = lab + c2 * cw, y0 = top + r2 * ch;
        if (r2 === 0 || !d.ok(r2 - 1, c2)) path += "M" + x0 + "," + y0 + "h" + cw;
        if (r2 === 6 || !d.ok(r2 + 1, c2)) path += "M" + x0 + "," + (y0 + ch) + "h" + cw;
        if (c2 === 0 || !d.ok(r2, c2 - 1)) path += "M" + x0 + "," + y0 + "v" + ch;
        if (c2 === 7 || !d.ok(r2, c2 + 1)) path += "M" + (x0 + cw) + "," + y0 + "v" + ch;
      }
      s("path", { d: path, stroke: C.navy, "stroke-width": 3, fill: "none", "stroke-linecap": "square" }, g);
      deltas.forEach(function (dl, ci) { s("text", { x: lab + ci * cw + cw / 2, y: top + 7 * ch + 16, "text-anchor": "middle", "font-size": 11, class: "t-muted", text: String(dl) }, g); });
      s("text", { x: lab + 4 * cw, y: top + 7 * ch + 34, "text-anchor": "middle", "font-size": 11.5, class: "t-muted", text: "exponential factor δ (quarterly) →" }, g);
      s("text", { x: 0, y: top - 8, "font-size": 11.5, class: "t-muted", text: "β ≤" }, g);
    });
  };

  /* =====================================================================
     FIGURE 17 — type shares
     ===================================================================== */
  VIZ.types = function (node) {
    var T = [
      { t: "Time-consistent", lo: 0.67, hi: 0.79, c: C.neutral },
      { t: "Naïve present-biased", lo: 0.09, hi: 0.32, c: C.hot },
      { t: "Sophisticated present-biased", lo: 0, hi: 0.11, c: C.cold },
      { t: "Money-driven", lo: 0, hi: 0.12, c: C.unhealthy },
      { t: "Future-biased", lo: 0, hi: 0.015, c: C.healthy }
    ];
    var holder = h("div"); node.appendChild(holder);
    node.appendChild(h("p", { class: "say", html: "Present bias over effort is real but held by a <b>minority</b> — between 9% and 32% are naïve, at most 11% sophisticated. In the raw data, 19 of the 36 people with a clear effort wedge predict its sign: about the half that pure chance would give a naïve type." }));
    node.appendChild(dataTable("Show the numbers", ["Type", "Lower bound", "Upper bound"], T.map(function (r) { return [r.t, pct(r.lo, r.lo && r.lo < 0.1 ? 0 : 0), r.hi < 0.02 ? pct(r.hi, 1) : pct(r.hi)]; })));
    responsive(holder, function (w) {
      var narrow = w < 560, lab = narrow ? 0 : 210, rh = narrow ? 46 : 34;
      var H = 14 + rh * T.length + 30;
      var svg = svgRoot(holder, w, H, "Bounds on type shares: time-consistent 67 to 79 percent, naive 9 to 32, sophisticated 0 to 11, money-driven 0 to 12, future-biased 0 to 1.5");
      var x = lin(0, 1, lab + 8, w - 60);
      [0, 0.25, 0.5, 0.75, 1].forEach(function (t) {
        s("line", { x1: x(t), x2: x(t), y1: 8, y2: H - 24, class: "grid" }, svg);
        s("text", { x: x(t), y: H - 8, "text-anchor": "middle", "font-size": 11.5, class: "t-muted", text: (t * 100) + "%" }, svg);
      });
      T.forEach(function (r, i) {
        var cy = 14 + i * rh + (narrow ? 28 : rh / 2);
        if (narrow) s("text", { x: x(0), y: cy - 13, "font-size": 12, class: "t-ink", text: r.t }, svg);
        else s("text", { x: 0, y: cy + 4, "font-size": 12.5, class: "t-ink", text: r.t }, svg);
        s("rect", { x: x(0), y: cy - 7, width: x(1) - x(0), height: 14, fill: C.paper2, rx: 7 }, svg);
        s("rect", { x: x(r.lo), y: cy - 7, width: Math.max(4, x(r.hi) - x(r.lo)), height: 14, fill: r.c, "fill-opacity": 0.85, rx: 7 }, svg);
        s("text", { x: x(r.hi) + 8, y: cy + 4, "font-size": 12, class: "t-strong", text: Math.round(r.lo * 100) + "–" + (r.hi < 0.02 ? (r.hi * 100).toFixed(1) : Math.round(r.hi * 100)) + "%" }, svg);
        tip(s("rect", { x: x(0), y: cy - 12, width: x(1) - x(0), height: 24 }, svg), [{ v: Math.round(r.lo * 100) + "% – " + (r.hi * 100).toFixed(r.hi < 0.02 ? 1 : 0) + "%", l: r.t, c: r.c, note: "simultaneous 95% bounds on the population share" }]);
      });
    });
  };

  /* =====================================================================
     FIGURE 18 — forecasts miss the wedge
     ===================================================================== */
  VIZ.forecast = function (node) {
    var st = "hot";
    var sg = seg([{ v: "cold", t: "Decided cold", sw: C.cold }, { v: "hot", t: "Decided hot", sw: C.hot }], st, function (v) { st = v; redraw(); }, "State");
    node.appendChild(h("div", { class: "controls" }, [h("span", { class: "ctl-label", text: "Augenblick & Rabin" }), sg.el]));
    var holder = h("div"); node.appendChild(holder);
    var A = {
      cold: { f: 1.01, flo: 0.925, fhi: 1.09, r: 0.882, rlo: 0.802, rhi: 0.966, c: C.cold, share: "about 0%" },
      hot: { f: 0.99, flo: 0.945, fhi: 1.04, r: 0.736, rlo: 0.649, rhi: 0.822, c: C.hot, share: "3%" }
    };
    var F = [{ t: "New Year’s resolutions", v: 11, lo: 9, hi: 13 }, { t: "gym attendance goal", v: 37, lo: 35, hi: 40 }, { t: "working full-time past 62", v: 10, lo: 9.5, hi: 11 }, { t: "sober days (Chennai)", v: 28, lo: 21, hi: 35 }];
    var tS = tile("Share of the wedge the forecast anticipated", ""), tG = tile("Self-control gap Γ (in β)", "", true);
    node.appendChild(h("div", { class: "readouts" }, [tS.el, tG.el]));
    var redraw = responsive(holder, function (w) {
      var a = A[st];
      tS.set(a.share); tG.set((a.f - a.r).toFixed(2));
      var two = w >= 700, H1 = 260, lw = two ? Math.floor(w * 0.44) : w;
      var H = two ? H1 : H1 * 2 + 20;
      var svg = svgRoot(holder, w, H, "Own forecast of beta " + a.f + " against realized " + a.r);
      // left
      var gL = s("g", {}, svg);
      s("text", { x: 0, y: 12, "font-size": 12, class: "t-strong", text: "Forecast vs choice on the day" }, gL);
      var y = lin(0.6, 1.12, H1 - 30, 30), lx = 38;
      [0.6, 0.7, 0.8, 0.9, 1.0, 1.1].forEach(function (t) {
        s("line", { x1: lx, x2: lw, y1: y(t), y2: y(t), class: t === 1 ? "axis" : "grid" }, gL);
        s("text", { x: lx - 6, y: y(t) + 4, "text-anchor": "end", "font-size": 11, class: "t-muted", text: t.toFixed(1) }, gL);
      });
      s("text", { x: lw, y: y(1) - 5, "text-anchor": "end", "font-size": 11, class: "t-muted", text: "the plan" }, gL);
      var nar = lw < 460, cx1 = lx + (lw - lx) * (nar ? 0.22 : 0.3), cx2 = lx + (lw - lx) * (nar ? 0.56 : 0.55);
      whisker(gL, cx1, y(a.flo), y(a.fhi), C.neutral); dot(gL, cx1, y(a.f), 6.5, C.neutral, true);
      whisker(gL, cx2, y(a.rlo), y(a.rhi), a.c); dot(gL, cx2, y(a.r), 6.5, a.c);
      s("text", { x: cx1 - 10, y: y(a.f) + 4, "text-anchor": "end", "font-size": 12, class: "t-strong", text: a.f.toFixed(2) }, gL);
      s("text", { x: cx2 + 10, y: y(a.r) + 4, "font-size": 12, class: "t-strong", text: a.r.toFixed(2) }, gL);
      s("text", { x: cx1, y: H1 - 10, "text-anchor": "middle", "font-size": 12, class: "t-ink", text: nar ? "forecast" : "own forecast" }, gL);
      s("text", { x: cx2, y: H1 - 10, "text-anchor": "middle", "font-size": 12, class: "t-ink", text: nar ? "on the day" : "choice on the day" }, gL);
      var gx = lx + (lw - lx) * 0.8;
      s("line", { x1: gx, x2: gx, y1: y(a.f) + 2, y2: y(a.r) - 2, stroke: C.ink, "stroke-width": 1.8 }, gL);
      arrowHead(gL, gx, y(a.r), Math.PI / 2, C.ink, 7); arrowHead(gL, gx, y(a.f), -Math.PI / 2, C.ink, 7);
      s("text", { x: gx + 8, y: (y(a.f) + y(a.r)) / 2 + 5, "font-size": 15, "font-style": "italic", "font-family": "Newsreader, serif", fill: C.ink, text: "Γ" }, gL);
      tip(s("rect", { x: cx1 - 14, y: y(a.fhi) - 6, width: 28, height: y(a.flo) - y(a.fhi) + 12 }, gL), [{ v: a.f.toFixed(2), l: "β implied by own forecast (" + st + ")", c: C.neutral, note: "incentivized predictions, re-estimated by state" }]);
      tip(s("rect", { x: cx2 - 14, y: y(a.rhi) - 6, width: 28, height: y(a.rlo) - y(a.rhi) + 12 }, gL), [{ v: a.r.toFixed(2), l: "β realized on the day (" + st + ")", c: a.c }]);
      // right
      var gR = s("g", { transform: two ? "translate(" + (lw + 34) + ",0)" : "translate(0," + (H1 + 20) + ")" }, svg);
      var rw = two ? w - lw - 34 : w;
      s("text", { x: 0, y: 12, "font-size": 12, class: "t-strong", text: "Field: forecast minus outcome (points)" }, gR);
      var narrowR = rw < 420, lab = narrowR ? 0 : 170;
      var xr = lin(0, 45, lab + 6, rw - 40);
      var rh = narrowR ? 52 : 48;
      [0, 10, 20, 30, 40].forEach(function (t) {
        s("line", { x1: xr(t), x2: xr(t), y1: 28, y2: 28 + rh * 4, class: t === 0 ? "axis" : "grid" }, gR);
        s("text", { x: xr(t), y: 28 + rh * 4 + 16, "text-anchor": "middle", "font-size": 11, class: "t-muted", text: String(t) }, gR);
      });
      F.forEach(function (f, i) {
        var cy = 28 + i * rh + (narrowR ? 32 : rh / 2);
        if (narrowR) s("text", { x: xr(0) + 4, y: cy - 13, "font-size": 12, class: "t-ink", text: f.t }, gR);
        else s("text", { x: 0, y: cy + 4, "font-size": 12, class: "t-ink", text: f.t }, gR);
        whisker(gR, cy, xr(f.lo), xr(f.hi), C.healthy, true, 4);
        dot(gR, xr(f.v), cy, 5.5, C.healthy);
        s("text", { x: xr(f.hi) + 8, y: cy + 4, "font-size": 12, class: "t-strong", text: "+" + f.v }, gR);
        tip(s("rect", { x: xr(f.lo) - 6, y: cy - 12, width: xr(f.hi) - xr(f.lo) + 12, height: 24 }, gR), [{ v: "+" + f.v + " points", l: f.t, c: C.healthy }]);
      });
    });
  };

  /* =====================================================================
     FIGURE 19 — commitment demand: belief = accurate part + error
     ===================================================================== */
  VIZ.commit = function (node) {
    var split = false, t = 1, stopT = null;
    var btn = h("button", { type: "button", class: "btn-run", text: "Split the belief into its accurate part and its error" });
    btn.addEventListener("click", function () {
      split = !split; btn.textContent = split ? "Show the belief as stated" : "Split the belief into its accurate part and its error";
      if (stopT) stopT(); t = 0; stopT = tween(700, function (u) { t = u; redraw(); });
    });
    node.appendChild(h("div", { class: "controls" }, [btn]));
    var holder = h("div"); node.appendChild(holder);
    var say = h("p", { class: "say", "aria-live": "polite" }); node.appendChild(say);
    var main = [
      { t: "stated belief", v: 0.20, lo: -0.10, hi: 0.44, c: C.neutral, part: "belief" },
      { t: "accurate part (realized sobriety)", v: 0.45, lo: 0.23, hi: 0.66, c: C.healthy, part: "split" },
      { t: "forecast error", v: -0.39, lo: -0.65, hi: -0.12, c: C.hot, part: "split" }
    ];
    var others = [
      { t: "gym: contract", v: -0.02, lo: -0.12, hi: 0.08 }, { t: "gym: goal", v: 0.11, lo: 0.05, hi: 0.17 },
      { t: "food deserts", v: -0.18, lo: -0.28, hi: -0.08 }, { t: "data entry", v: 0.12, lo: -0.17, hi: 0.42 }, { t: "smartphones", v: 0.04, lo: -0.03, hi: 0.10 }
    ];
    var fed = [{ t: "actual", v: 0.74, c: C.hot }, { t: "self-assessed", v: 0.97, c: C.neutral }, { t: "believed for others", v: 0.92, c: C.cold }];
    var redraw = responsive(holder, function (w) {
      say.innerHTML = split
        ? "Split the belief and the pattern is stark: demand for commitment rises with the <b>accurate</b> part (+0.45) and falls with the <b>error</b> (−0.39). Those who most underestimate their problem are the least likely to ask for help."
        : "Among 63 drivers, a more optimistic belief about one’s own sobriety goes with <b>more</b> demand for commitment (+0.20). Does demand track how much help people need?";
      var narrow = w < 560, lab = narrow ? 0 : 230, rh = narrow ? 40 : 30;
      var nMain = split ? 3 : 1;
      var H = 24 + rh * 3 + 30 + rh * others.length + 50 + 110;
      var svg = svgRoot(holder, w, H, "Correlation of commitment demand with stated belief, its accurate part and its error");
      var x = lin(-0.7, 0.75, lab + 8, w - 46);
      var top = 24, bottom = top + rh * 3 + 30 + rh * others.length;
      [-0.5, 0, 0.5].forEach(function (v) {
        s("line", { x1: x(v), x2: x(v), y1: top - 8, y2: bottom, class: v === 0 ? "axis" : "grid" }, svg);
        s("text", { x: x(v), y: bottom + 16, "text-anchor": "middle", "font-size": 11, class: "t-muted", text: fmtS(v, 1) }, svg);
      });
      s("text", { x: (x(-0.7) + x(0.75)) / 2, y: bottom + 32, "text-anchor": "middle", "font-size": 11.5, class: "t-muted", text: "correlation with demand for commitment" }, svg);
      s("text", { x: 0, y: 12, "font-size": 12, class: "t-strong", text: "Rickshaw drivers (Schilbach, 2019)" }, svg);
      main.forEach(function (r, i) {
        var alpha = r.part === "belief" ? (split ? 1 - 0.5 * t : 0.5 + 0.5 * t) : (split ? t : 1 - t);
        if (r.part !== "belief" && alpha < 0.12) {
          var gy = top + i * rh + (narrow ? 26 : rh / 2);
          if (narrow) s("text", { x: x(-0.7), y: gy - 11, "font-size": 12, fill: "#B9C2CB", text: r.t }, svg);
          else s("text", { x: 0, y: gy + 4, "font-size": 12.5, fill: "#B9C2CB", text: r.t }, svg);
          s("text", { x: x(0), y: gy + 4, "text-anchor": "middle", "font-size": 12, fill: "#B9C2CB", text: "?" }, svg);
          return;
        }
        var cy = top + i * rh + (narrow ? 26 : rh / 2);
        var g = s("g", { opacity: alpha.toFixed(3) }, svg);
        if (narrow) s("text", { x: x(-0.7), y: cy - 11, "font-size": 12, class: "t-ink", text: r.t }, g);
        else s("text", { x: 0, y: cy + 4, "font-size": 12.5, class: i ? "t-strong" : "t-ink", text: r.t }, g);
        whisker(g, cy, x(r.lo), x(r.hi), r.c, true, 4);
        dot(g, x(r.v), cy, 6, r.c);
        s("text", { x: x(r.hi) + 8, y: cy + 4, "font-size": 12, class: "t-strong", text: fmtS(r.v, 2) }, g);
        if (alpha > 0.5) tip(s("rect", { x: x(r.lo) - 6, y: cy - 12, width: x(r.hi) - x(r.lo) + 12, height: 24 }, g), [{ v: fmtS(r.v, 2), l: "correlation with demand · " + r.t, c: r.c }]);
      });
      var y2 = top + rh * 3 + 18;
      s("line", { x1: 0, x2: w, y1: y2 - 8, y2: y2 - 8, stroke: C.rule }, svg);
      s("text", { x: 0, y: y2 + 8, "font-size": 12, class: "t-strong", text: "Demand vs own wedge, four more datasets" }, svg);
      others.forEach(function (r, i) {
        var cy = y2 + 14 + i * rh + (narrow ? 24 : rh / 2);
        if (narrow) s("text", { x: x(-0.7), y: cy - 11, "font-size": 11.5, class: "t-muted", text: r.t }, svg);
        else s("text", { x: 0, y: cy + 4, "font-size": 12, class: "t-muted", text: r.t }, svg);
        whisker(svg, cy, x(r.lo), x(r.hi), C.neutral, true, 3);
        dot(svg, x(r.v), cy, 4.5, C.neutral);
        tip(s("rect", { x: x(r.lo) - 6, y: cy - 10, width: x(r.hi) - x(r.lo) + 12, height: 20 }, svg), [{ v: fmtS(r.v, 2), l: r.t + ": correlation of commitment with own wedge", c: C.neutral }]);
      });
      // Fedyk strip
      var fy = bottom + 80;
      s("text", { x: 0, y: fy - 16, "font-size": 12, class: "t-strong", text: "Others see it better (Fedyk, 2024): β over effort" }, svg);
      var xf = lin(0.65, 1.02, lab + 8, w - 46);
      s("line", { x1: xf(0.65), x2: xf(1.02), y1: fy + 10, y2: fy + 10, class: "axis" }, svg);
      [0.7, 0.8, 0.9, 1.0].forEach(function (v) { s("text", { x: xf(v), y: fy + 26, "text-anchor": "middle", "font-size": 11, class: "t-muted", text: v.toFixed(1) }, svg); s("line", { x1: xf(v), x2: xf(v), y1: fy + 10, y2: fy + 14, class: "axis" }, svg); });
      fed.forEach(function (f, i) {
        dot(svg, xf(f.v), fy + 10, 6, f.c);
        var above = i !== 2;
        s("text", { x: i === 1 ? xf(f.v) + 6 : xf(f.v), y: above ? fy - 2 : fy + 42, "text-anchor": i === 1 ? "end" : "middle", "font-size": 11.5, class: "t-ink", text: f.t + " " + f.v.toFixed(2) }, svg);
        tip(s("circle", { cx: xf(f.v), cy: fy + 10, r: 13 }, svg), [{ v: f.v.toFixed(2), l: "β " + f.t, c: f.c }]);
      });
    });
  };

  /* =====================================================================
     FIGURE 20 — the Multi-System Control framework (toy parametrization)
     ===================================================================== */
  VIZ.msc = function (node) {
    var st = { hx: 0.2, ctl: 0.5, pi: 1.0, off: false, freeze: false };
    var weights = function (hx) {
      var hh = st.freeze ? 0.5 : hx;
      var eD = 0.6 + 1.6 * st.ctl * (1 - 0.5 * hh), eI = -1.2 + 1.6 * hh;
      if (st.off) return { d: 1, i: 0 };
      var wd = 1 / (1 + Math.exp(eI - eD));
      return { d: wd, i: 1 - wd };
    };
    var beff = function (hx) { var w = weights(hx); return w.d / (w.d + w.i * st.pi); };
    var c1 = h("div", { class: "controls" });
    var s1 = slider({ label: "State: calm → hot, cued", min: 0, max: 1, step: 0.01, value: st.hx, fmt: function (v) { return v < 0.34 ? "calm" : v < 0.67 ? "warm" : "hot"; }, onInput: function (v) { st.hx = v; redraw(); } });
    var s2 = slider({ label: "Executive control", min: 0, max: 1, step: 0.01, value: st.ctl, fmt: function (v) { return Math.round(v * 100) + "%"; }, onInput: function (v) { st.ctl = v; redraw(); } });
    var s3 = slider({ label: "Immediate appeal π", min: 0.2, max: 2, step: 0.05, value: st.pi, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { st.pi = v; redraw(); } });
    c1.appendChild(s1.el); c1.appendChild(s2.el); c1.appendChild(s3.el);
    var k1 = check("Switch off the impulsive system", false, function (v) { st.off = v; redraw(); });
    var k2 = check("Freeze the weights across states", false, function (v) { st.freeze = v; redraw(); });
    node.appendChild(c1);
    node.appendChild(h("div", { class: "controls" }, [k1.el, k2.el]));
    var holder = h("div"); node.appendChild(holder);
    var tW = tile("Weights of D and I", ""), tB = tile("Effective present bias β", "", true), tM = tile("This is…", "");
    node.appendChild(h("div", { class: "readouts" }, [tW.el, tB.el, tM.el]));
    var redraw = responsive(holder, function (w) {
      var W = weights(st.hx), b = beff(st.hx);
      tW.set(W.d.toFixed(2) + " / " + W.i.toFixed(2)); tB.set(b.toFixed(2));
      tM.set(st.off ? "exponential discounting" : st.freeze ? "a constant β (the trait)" : "a state-dependent β");
      var two = w >= 720, compact = w < 560, H1 = compact ? 296 : 250, dw = two ? Math.floor(w * 0.56) : w;
      var H = two ? H1 : H1 + 230 + 16;
      var svg = svgRoot(holder, w, H, "Deliberative weight " + W.d.toFixed(2) + ", impulsive weight " + W.i.toFixed(2) + ", effective beta " + b.toFixed(2));
      // diagram
      var g = s("g", {}, svg);
      var bx = function (x, y, ww, hh, title, sub, stroke, fill) {
        s("rect", { x: x, y: y, width: ww, height: hh, rx: 6, fill: fill || "#fff", stroke: stroke || C.rule, "stroke-width": 1.5 }, g);
        s("text", { x: x + ww / 2, y: y + (sub ? hh / 2 - 3 : hh / 2 + 4), "text-anchor": "middle", "font-size": 12, "font-weight": 600, fill: C.ink, text: title }, g);
        if (sub) s("text", { x: x + ww / 2, y: y + hh / 2 + 12, "text-anchor": "middle", "font-size": 10.5, class: "t-muted", text: sub }, g);
      };
      var arrowL = function (x1, y1, x2, y2, wdt, col) {
        var a = Math.atan2(y2 - y1, x2 - x1);
        s("line", { x1: x1, y1: y1, x2: x2 - 6 * Math.cos(a), y2: y2 - 6 * Math.sin(a), stroke: col, "stroke-width": wdt, "stroke-linecap": "round", opacity: 0.9 }, g);
        arrowHead(g, x2, y2, a, col, 6 + wdt);
      };
      var sub = function (x, y, base, subTxt, rest, anchor) {
        var t = s("text", { x: x, y: y, "font-size": 11.5, "font-weight": 600, fill: C.ink, "text-anchor": anchor || "start" }, g);
        s("tspan", { text: base }, t); s("tspan", { "font-size": 8.5, dy: 3, text: subTxt }, t); s("tspan", { dy: -3, text: " " + rest }, t);
      };
      var heat = st.hx, stateTxt = heat < 0.34 ? "calm" : heat < 0.67 ? "warm" : "hot, cued";
      var stateFill = "rgba(194,65,58," + (0.05 + 0.25 * heat).toFixed(3) + ")";
      s("text", { x: 0, y: 20, "font-size": 12, class: "t-strong", text: "The state sets the weights, not the valuations" }, g);
      if (compact) {
        var half = (w - 14) / 2;
        bx(0, 34, w, 40, "State X: " + stateTxt, "", C.rule, stateFill);
        bx(0, 108, half, 50, "Deliberative D", "far-sighted, costly", C.cold, "#F2F6FB");
        bx(half + 14, 108, half, 50, "Impulsive I", st.off ? "switched off" : "fast, cue-triggered", C.hot, st.off ? "#F4F5F6" : "#FBF2F1");
        arrowL(half / 2, 74, half / 2, 108, 1.5, C.axis);
        arrowL(half + 14 + half / 2, 74, half + 14 + half / 2, 108, 1.5, C.axis);
        var aw = w * 0.58;
        bx(0, 206, aw, 48, "Arbitrator", "Σ ω·v", C.rule, C.paper2);
        bx(aw + 22, 206, w - aw - 22, 48, "Action", "", C.navy, "#fff");
        arrowL(half / 2, 158, aw * 0.3, 206, 1 + 9 * W.d, C.cold);
        if (!st.off) arrowL(half + 14 + half / 2, 158, aw * 0.75, 206, 1 + 9 * W.i, C.hot);
        arrowL(aw, 230, aw + 22, 230, 2, C.navy);
        sub(half / 2 + 12, 186, "ω", "D", W.d.toFixed(2));
        sub(half + 14 + half / 2 + 10, 186, "ω", "I", W.i.toFixed(2));
        s("text", { x: 0, y: 282, "font-size": 11, class: "t-muted", text: "executive control " + Math.round(st.ctl * 100) + "% raises D’s weight, at a cost" }, g);
      } else {
        var colW = Math.min(118, (dw - 40) / 4);
        var xS = 0, xSys = xS + colW + 22, xA = xSys + colW + 34, xO = xA + colW + 22;
        bx(xS, 70, colW, 100, "State X", stateTxt, C.rule, stateFill);
        bx(xSys, 40, colW, 54, "Deliberative D", "far-sighted, costly", C.cold, "#F2F6FB");
        bx(xSys, 146, colW, 54, "Impulsive I", st.off ? "switched off" : "fast, cue-triggered", C.hot, st.off ? "#F4F5F6" : "#FBF2F1");
        bx(xA, 70, colW, 100, "Arbitrator", "Σ ω·v", C.rule, C.paper2);
        bx(xO, 95, Math.max(60, dw - xO - 2), 50, "Action", "", C.navy, "#fff");
        arrowL(xS + colW, 100, xSys, 67, 1.5, C.axis);
        arrowL(xS + colW, 140, xSys, 173, 1.5, C.axis);
        arrowL(xSys + colW, 67, xA, 100, 1 + 9 * W.d, C.cold);
        if (!st.off) arrowL(xSys + colW, 173, xA, 140, 1 + 9 * W.i, C.hot);
        arrowL(xA + colW, 120, xO, 120, 2, C.navy);
        sub(xSys + colW + 4, 58, "ω", "D", W.d.toFixed(2));
        sub(xSys + colW + 4, 196, "ω", "I", W.i.toFixed(2));
        s("rect", { x: xSys, y: 214, width: colW, height: 28, rx: 5, fill: "#fff", stroke: C.navy, "stroke-width": 1.2 }, g);
        s("text", { x: xSys + colW / 2, y: 232, "text-anchor": "middle", "font-size": 10.5, fill: C.ink, text: "executive: " + Math.round(st.ctl * 100) + "%" }, g);
        s("path", { d: "M" + (xSys + colW) + ",228 H" + (xA + colW / 2) + " V" + 176, fill: "none", stroke: C.navy, "stroke-width": 1.2, "stroke-dasharray": "3 3" }, g);
        arrowHead(g, xA + colW / 2, 171, -Math.PI / 2, C.navy, 6);
        s("text", { x: xA + colW / 2 + 6, y: 205, "font-size": 10.5, class: "t-muted", text: "raises D’s weight" }, g);
      }
      // β_eff as a function of the state
      var gR = s("g", { transform: two ? "translate(" + (dw + 30) + ",0)" : "translate(0," + (H1 + 16) + ")" }, svg);
      var rw = two ? w - dw - 30 : w, rh = 220;
      s("text", { x: 0, y: 14, "font-size": 12, class: "t-strong", text: "Effective β across states" }, gR);
      var x = lin(0, 1, 36, rw - 8), y = lin(0.3, 1.02, rh - 30, 44);
      [0.4, 0.6, 0.8, 1.0].forEach(function (t) { s("line", { x1: 36, x2: rw - 8, y1: y(t), y2: y(t), class: "grid" }, gR); s("text", { x: 30, y: y(t) + 4, "text-anchor": "end", "font-size": 11, class: "t-muted", text: t.toFixed(1) }, gR); });
      s("text", { x: 36, y: rh - 12, "font-size": 11, class: "t-muted", text: "calm" }, gR);
      s("text", { x: rw - 8, y: rh - 12, "text-anchor": "end", "font-size": 11, class: "t-muted", text: "hot" }, gR);
      s("path", { d: range(0, 1, 0.02).map(function (v, i) { return (i ? "L" : "M") + x(v).toFixed(1) + "," + y(beff(v)).toFixed(1); }).join(""), fill: "none", stroke: C.gold, "stroke-width": 2.5 }, gR);
      dot(gR, x(st.hx), y(b), 6.5, C.navy);
      s("text", { x: x(st.hx) + (st.hx > 0.7 ? -10 : 10), y: y(b) - 10, "text-anchor": st.hx > 0.7 ? "end" : "start", "font-size": 12.5, class: "t-strong", text: b.toFixed(2) }, gR);
    });
  };

  /* =====================================================================
     FIGURE 21 — every β in the tour, on one line
     ===================================================================== */
  VIZ.landscape = function (node) {
    var rows = [
      { t: "State", c: C.axState, pts: [{ v: 0.882, l: "decided before work (cold)" }, { v: 0.736, l: "decided after work (hot)" }, { v: 0.804, l: "state-blind pooled estimate", hollow: true }] },
      { t: "Structure", c: C.axPerson, pts: [{ v: 0.876, l: "over effort (cost–cost)" }, { v: 0.987, l: "over money (reward–reward)" }] },
      { t: "Good & person", c: C.axGood, pts: [{ v: 0.820, l: "money" }, { v: 0.852, l: "healthy food" }, { v: 0.861, l: "unhealthy food" }, { v: 0.737, l: "money, students who drink" }, { v: 0.762, l: "money, students who smoke" }, { v: 0.838, l: "money, neither" }] }
    ];
    node.appendChild(legend(rows.map(function (r) { return { t: r.t, c: r.c, type: "dt" }; })));
    var holder = h("div"); node.appendChild(holder);
    node.appendChild(dataTable("Show the numbers", ["Axis", "Setting", "β"], [].concat.apply([], rows.map(function (r) { return r.pts.map(function (p) { return [r.t, p.l, p.v.toFixed(3)]; }); }))));
    responsive(holder, function (w) {
      var narrow = w < 560, lab = narrow ? 0 : 120, rh = narrow ? 64 : 58;
      var H = 20 + rh * rows.length + 34;
      var svg = svgRoot(holder, w, H, "Values of beta across states, structures and goods, from 0.74 to 0.99");
      var x = lin(0.70, 1.02, lab + 14, w - 14);
      [0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1.0].forEach(function (t) {
        s("line", { x1: x(t), x2: x(t), y1: 10, y2: H - 28, class: t === 1 ? "axis" : "grid" }, svg);
        s("text", { x: x(t), y: H - 12, "text-anchor": "middle", "font-size": 11.5, class: "t-muted", text: t.toFixed(2) }, svg);
      });
      rows.forEach(function (r, i) {
        var cy = 20 + i * rh + rh / 2 + (narrow ? 8 : 0);
        if (narrow) s("text", { x: x(0.7), y: cy - 20, "font-size": 12, class: "t-strong", text: r.t }, svg);
        else s("text", { x: 0, y: cy + 4, "font-size": 12.5, class: "t-strong", text: r.t }, svg);
        s("line", { x1: x(0.7), x2: x(1.02), y1: cy, y2: cy, stroke: C.rule }, svg);
        var sorted = r.pts.slice().sort(function (a, b) { return a.v - b.v; });
        sorted.forEach(function (p, j) {
          var jitter = 0;
          for (var q = 0; q < j; q++) if (Math.abs(x(sorted[q].v) - x(p.v)) < 11) jitter += 1;
          var cy2 = cy + (jitter % 2 ? -9 : jitter ? 9 : 0);
          dot(svg, x(p.v), cy2, 6, r.c, p.hollow);
          tip(s("circle", { cx: x(p.v), cy: cy2, r: 12 }, svg), [{ v: p.v.toFixed(3), l: p.l, c: r.c }]);
        });
        var lo = sorted[0], hi = sorted[sorted.length - 1];
        s("text", { x: x(lo.v) - 10, y: cy + 4, "text-anchor": "end", "font-size": 11.5, class: "t-strong", text: lo.v.toFixed(2) }, svg);
        s("text", { x: x(hi.v) + 10, y: cy + 4, "font-size": 11.5, class: "t-strong", text: hi.v.toFixed(2) }, svg);
      });
    });
  };

  /* =====================================================================
     mount everything, plus the chapter nav and reading progress
     ===================================================================== */
  function mount() {
    document.querySelectorAll("[data-viz]").forEach(function (node) {
      var f = VIZ[node.getAttribute("data-viz")];
      if (!f) return;
      try { f(node); }
      catch (err) { node.textContent = "This figure could not be displayed."; if (window.console) console.error(err); }
    });
    // reveal figures as they scroll in
    var figs = document.querySelectorAll(".fig");
    if ("IntersectionObserver" in window && !RM) {
      document.documentElement.classList.add("reveal");
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -8% 0px" });
      figs.forEach(function (f) { io.observe(f); });
    } else figs.forEach(function (f) { f.classList.add("in"); });
    // nav highlight
    var links = Array.prototype.slice.call(document.querySelectorAll("[data-nav] a"));
    var secs = links.map(function (a) { return document.querySelector(a.getAttribute("href")); });
    var bar = document.querySelector("[data-progress]");
    var navUl = document.querySelector("[data-nav]");
    var lastId = null;
    function onScroll() {
      var y = window.scrollY + 120, cur = null;
      secs.forEach(function (sec) { if (sec && sec.offsetTop <= y) cur = sec.id; });
      if (cur !== lastId) {
        lastId = cur;
        if (cur === null && navUl) navUl.scrollTo({ left: 0 });
        links.forEach(function (a) {
          var on = a.getAttribute("href") === "#" + cur;
          a.classList.toggle("is-current", on);
          if (on) { a.setAttribute("aria-current", "true"); var li = a.parentNode; if (navUl && li) { var l = li.offsetLeft, r = l + li.offsetWidth; if (l < navUl.scrollLeft || r > navUl.scrollLeft + navUl.clientWidth - 30) navUl.scrollTo({ left: Math.max(0, l - 20), behavior: RM ? "auto" : "smooth" }); } }
          else a.removeAttribute("aria-current");
        });
      }
      if (bar) { var max = document.documentElement.scrollHeight - window.innerHeight; bar.style.transform = "scaleX(" + (max > 0 ? clamp(window.scrollY / max, 0, 1) : 0) + ")"; }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    var yr = document.querySelector("[data-year]"); if (yr) yr.textContent = String(new Date().getFullYear());
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
})();
