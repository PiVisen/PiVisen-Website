/* =====================================================================
   PiVisen AI — home page "vision panel" (illustration, not live data)
   Draws a stylised shop aisle seen by an AI camera: people are tracked
   with detection boxes, and every few seconds an event goes through a
   second AI check before it is marked as an alert or dismissed.
   - Runs at ~30 fps and pauses when off screen or in a hidden tab.
   - With prefers-reduced-motion it draws one still frame only.
   ===================================================================== */
(function () {
  "use strict";
  var canvas = document.getElementById("vision-canvas");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var C = {
    accent: "46, 230, 200",
    blue: "59, 184, 255",
    amber: "251, 191, 36",
    red: "255, 107, 107",
    text: "rgba(226, 232, 245, 0.9)",
    dim: "rgba(148, 163, 184, 0.55)"
  };
  var W = 0, H = 0, dpr = 1;
  var running = false, visible = true, last = 0, t0 = performance.now();

  // People walk along the aisle; x is 0..1 across, depth is 0 (far) .. 1 (near)
  var people = [
    { id: "01", x: 0.18, depth: 0.85, speed: 0.022, dir: 1, phase: 0 },
    { id: "02", x: 0.72, depth: 0.45, speed: 0.016, dir: -1, phase: 1.7 },
    { id: "03", x: 0.42, depth: 0.25, speed: 0.012, dir: 1, phase: 3.1 }
  ];

  function resize() {
    var rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, Math.round(rect.width));
    H = Math.max(1, Math.round(rect.height));
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!running) draw(performance.now());
  }

  // perspective helpers: horizon at 30% height, floor fills the rest
  function floorY(depth) { return H * (0.34 + depth * 0.6); }
  function scaleAt(depth) { return 0.35 + depth * 0.75; }

  function drawScene() {
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#070b18");
    g.addColorStop(1, "#04060d");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    var vx = W * 0.5, vy = H * 0.3;
    ctx.lineWidth = 1;
    // floor grid converging to vanishing point
    ctx.strokeStyle = "rgba(" + C.blue + ", 0.10)";
    for (var i = -6; i <= 6; i++) {
      ctx.beginPath();
      ctx.moveTo(vx, vy);
      ctx.lineTo(vx + i * W * 0.16, H);
      ctx.stroke();
    }
    for (var j = 1; j <= 7; j++) {
      var y = vy + (H - vy) * Math.pow(j / 7, 1.8);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    // shelves on both sides
    function shelf(side) {
      var xNear = side < 0 ? 0 : W, xFar = vx + side * W * 0.11;
      ctx.fillStyle = "rgba(" + C.blue + ", 0.05)";
      ctx.strokeStyle = "rgba(" + C.blue + ", 0.22)";
      ctx.beginPath();
      ctx.moveTo(xNear, H * 0.06);
      ctx.lineTo(xFar, vy - H * 0.12);
      ctx.lineTo(xFar, vy + H * 0.06);
      ctx.lineTo(xNear, H * 0.98);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      for (var k = 1; k < 5; k++) {
        var f = k / 5;
        ctx.beginPath();
        ctx.moveTo(xNear, H * 0.06 + (H * 0.92) * f);
        ctx.lineTo(xFar, vy - H * 0.12 + H * 0.18 * f);
        ctx.stroke();
      }
    }
    shelf(-1);
    shelf(1);
  }

  function personBox(p, time) {
    var s = scaleAt(p.depth);
    var h = H * 0.42 * s, w = h * 0.38;
    var cx = W * (0.24 + p.x * 0.52);
    var bob = reduceMotion ? 0 : Math.sin(time * 6 + p.phase) * h * 0.012;
    var bottom = floorY(p.depth) + bob;
    return { x: cx - w / 2, y: bottom - h, w: w, h: h, cx: cx };
  }

  function drawPerson(b) {
    ctx.fillStyle = "rgba(148, 163, 184, 0.28)";
    var r = b.w * 0.24;
    ctx.beginPath();
    ctx.arc(b.cx, b.y + r * 1.1, r, 0, Math.PI * 2);
    ctx.fill();
    var bodyTop = b.y + r * 2.4;
    ctx.beginPath();
    ctx.moveTo(b.cx - b.w * 0.42, b.y + b.h);
    ctx.lineTo(b.cx - b.w * 0.46, bodyTop + b.w * 0.2);
    ctx.quadraticCurveTo(b.cx, bodyTop - b.w * 0.25, b.cx + b.w * 0.46, bodyTop + b.w * 0.2);
    ctx.lineTo(b.cx + b.w * 0.42, b.y + b.h);
    ctx.closePath();
    ctx.fill();
  }

  function brackets(b, color, alpha) {
    var len = Math.max(8, Math.min(b.w, b.h) * 0.22);
    ctx.strokeStyle = "rgba(" + color + "," + alpha + ")";
    ctx.lineWidth = 2;
    ctx.beginPath();
    // four corners
    ctx.moveTo(b.x, b.y + len); ctx.lineTo(b.x, b.y); ctx.lineTo(b.x + len, b.y);
    ctx.moveTo(b.x + b.w - len, b.y); ctx.lineTo(b.x + b.w, b.y); ctx.lineTo(b.x + b.w, b.y + len);
    ctx.moveTo(b.x + b.w, b.y + b.h - len); ctx.lineTo(b.x + b.w, b.y + b.h); ctx.lineTo(b.x + b.w - len, b.y + b.h);
    ctx.moveTo(b.x + len, b.y + b.h); ctx.lineTo(b.x, b.y + b.h); ctx.lineTo(b.x, b.y + b.h - len);
    ctx.stroke();
    ctx.strokeStyle = "rgba(" + color + "," + alpha * 0.25 + ")";
    ctx.lineWidth = 1;
    ctx.strokeRect(b.x, b.y, b.w, b.h);
  }

  function label(x, y, text, color) {
    ctx.font = "600 " + Math.max(9, Math.round(W * 0.018)) + "px ui-monospace, Menlo, Consolas, monospace";
    var pad = 5, tw = ctx.measureText(text).width, th = Math.max(14, Math.round(W * 0.03));
    ctx.fillStyle = "rgba(" + color + ", 0.9)";
    ctx.fillRect(x, y - th, tw + pad * 2, th);
    ctx.fillStyle = "#03211c";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x + pad, y - th / 2 + 1);
  }

  function hud(time, phase) {
    var fs = Math.max(9, Math.round(W * 0.019));
    ctx.font = "500 " + fs + "px ui-monospace, Menlo, Consolas, monospace";
    ctx.textBaseline = "top";
    var m = Math.round(W * 0.03);
    // REC indicator + clock
    var blink = reduceMotion || Math.floor(time * 1.2) % 2 === 0;
    ctx.fillStyle = blink ? "rgba(" + C.red + ", 0.95)" : "rgba(" + C.red + ", 0.25)";
    ctx.beginPath();
    ctx.arc(m + 5, m + fs / 2, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.text;
    var d = new Date();
    var clock = [d.getHours(), d.getMinutes(), d.getSeconds()].map(function (n) { return String(n).padStart(2, "0"); }).join(":");
    ctx.fillText("REC  CAM 01  " + clock, m + 16, m);
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(" + C.accent + ", 0.9)";
    ctx.fillText("ON-DEVICE AI", W - m, m);
    ctx.fillStyle = C.dim;
    ctx.fillText("VIDEO STAYS ON SITE", W - m, m + fs * 1.5);
    ctx.textAlign = "left";
    // bottom status line
    ctx.textBaseline = "bottom";
    ctx.fillStyle = C.dim;
    ctx.fillText("TRACKING " + people.length + " PEOPLE", m, H - m);
    ctx.textAlign = "right";
    var status = { idle: ["MONITORING", C.accent], check: ["2ND AI CHECK…", C.amber], alert: ["ALERT CONFIRMED → OWNER", C.red], clear: ["CHECKED: NORMAL — NO ALERT", C.accent] }[phase];
    ctx.fillStyle = "rgba(" + status[1] + ", 0.95)";
    ctx.fillText(status[0], W - m, H - m);
    ctx.textAlign = "left";
  }

  function draw(now) {
    var time = (now - t0) / 1000;
    // event cycle: 0-3s idle, 3-5.5s check, 5.5-8s result; alternate outcomes
    var cycle = reduceMotion ? 6 : time % 8;
    var round = reduceMotion ? 0 : Math.floor(time / 8);
    var phase = cycle < 3 ? "idle" : cycle < 5.5 ? "check" : round % 2 === 0 ? "clear" : "alert";

    drawScene();

    // move people
    people.forEach(function (p) {
      if (!reduceMotion) {
        p.x += p.dir * p.speed / 30;
        if (p.x > 1) { p.x = 1; p.dir = -1; }
        if (p.x < 0) { p.x = 0; p.dir = 1; }
      }
    });
    // draw far to near
    var sorted = people.slice().sort(function (a, b) { return a.depth - b.depth; });
    sorted.forEach(function (p) {
      var b = personBox(p, time);
      drawPerson(b);
      var focus = p.id === "01" && phase !== "idle";
      var color = !focus ? C.accent : phase === "check" ? C.amber : phase === "alert" ? C.red : C.accent;
      var pad = b.w * 0.18;
      var box = { x: b.x - pad, y: b.y - pad, w: b.w + pad * 2, h: b.h + pad * 1.4 };
      brackets(box, color, focus ? 0.95 : 0.7);
      label(box.x, box.y - 2, "PERSON " + p.id, color);
      if (focus && phase === "check") {
        var prog = Math.min(1, (cycle - 3) / 2.5);
        ctx.fillStyle = "rgba(" + C.amber + ", 0.25)";
        ctx.fillRect(box.x, box.y + box.h + 6, box.w, 4);
        ctx.fillStyle = "rgba(" + C.amber + ", 0.95)";
        ctx.fillRect(box.x, box.y + box.h + 6, box.w * prog, 4);
      }
    });

    // scanning line
    if (!reduceMotion) {
      var sy = (time * 0.18 % 1) * H;
      var sg = ctx.createLinearGradient(0, sy - 40, 0, sy);
      sg.addColorStop(0, "rgba(" + C.accent + ", 0)");
      sg.addColorStop(1, "rgba(" + C.accent + ", 0.10)");
      ctx.fillStyle = sg;
      ctx.fillRect(0, sy - 40, W, 40);
    }
    hud(time, phase);
  }

  function loop(now) {
    if (!running) return;
    if (now - last >= 33) { // ~30 fps
      last = now;
      draw(now);
    }
    requestAnimationFrame(loop);
  }
  function start() {
    if (running || reduceMotion || !visible || document.hidden) return;
    running = true;
    requestAnimationFrame(loop);
  }
  function stop() { running = false; }

  resize();
  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener("resize", resize);

  if (reduceMotion) { draw(performance.now()); return; }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) start(); else stop();
    }).observe(canvas);
  }
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop(); else start();
  });
  start();
})();
