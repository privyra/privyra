/* Motion for Privyra. Transforms and opacity only. Honors reduced motion. */
(function () {
  var reduce = false;
  try {
    reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (err) {}

  var net = window.PrivyraNet;
  var cfg = window.PRIVYRA_CONFIG;

  function h(tag, props, kids) {
    return net.h(tag, props, kids);
  }

  function bootAtmosphere() {
    var canvas = h("canvas", { id: "ink-field", "aria-hidden": "true" });
    document.body.prepend(canvas);
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    var dpr = 1;
    var w = 0;
    var hgt = 0;
    var motes = [];
    var phase = 0;
    var running = false;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = window.innerWidth || 1200;
      hgt = window.innerHeight || 800;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(hgt * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = hgt + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var area = w * hgt;
      var count = w < 720 ? 16 : Math.min(48, Math.max(22, Math.floor(area / 28000)));
      motes = [];
      for (var i = 0; i < count; i++) {
        motes.push({
          x: Math.random() * w,
          y: Math.random() * hgt,
          r: Math.random() * 1.3 + 0.3,
          s: Math.random() * 0.22 + 0.04,
          drift: (Math.random() - 0.5) * 0.15,
          wax: Math.random() > 0.82,
        });
      }
    }

    function frame(move) {
      ctx.clearRect(0, 0, w, hgt);
      var g1 = ctx.createRadialGradient(w * 0.85, hgt * 0.05 + Math.sin(phase) * 20, 0, w * 0.85, 0, w * 0.55);
      g1.addColorStop(0, "rgba(224, 196, 154, 0.13)");
      g1.addColorStop(1, "rgba(224, 196, 154, 0)");
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, w, hgt);
      var g2 = ctx.createRadialGradient(w * 0.08, hgt * 0.2, 0, 0, hgt * 0.2, w * 0.4);
      g2.addColorStop(0, "rgba(226, 91, 69, 0.09)");
      g2.addColorStop(1, "rgba(226, 91, 69, 0)");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, w, hgt);

      ctx.strokeStyle = "rgba(224, 196, 154, 0.045)";
      ctx.lineWidth = 1;
      var shift = (phase * 18) % 48;
      var y;
      for (y = -48 + shift; y < hgt; y += 48) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      for (var i = 0; i < motes.length; i++) {
        var m = motes[i];
        if (move) {
          m.y -= m.s;
          m.x += m.drift;
          if (m.y < -6) {
            m.y = hgt + 6;
            m.x = Math.random() * w;
          }
          if (m.x < -6) m.x = w + 6;
          if (m.x > w + 6) m.x = -6;
        }
        ctx.fillStyle = m.wax ? "rgba(226, 91, 69, 0.35)" : "rgba(224, 196, 154, 0.32)";
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (move) phase += 0.004;
    }

    resize();
    window.addEventListener("resize", resize);
    frame(false);
    if (reduce) return;

    function loop() {
      if (document.hidden) {
        running = false;
        return;
      }
      frame(true);
      requestAnimationFrame(loop);
    }
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden && !running) {
        running = true;
        requestAnimationFrame(loop);
      }
    });
    running = true;
    requestAnimationFrame(loop);
  }

  function bootProgress() {
    var bar = h("div", { class: "scroll-progress", "aria-hidden": "true" });
    var ink = h("i");
    bar.appendChild(ink);
    document.body.prepend(bar);
    var ticking = false;
    function paint() {
      ticking = false;
      var doc = document.documentElement;
      var max = Math.max(1, doc.scrollHeight - doc.clientHeight);
      var y = window.scrollY || doc.scrollTop || 0;
      ink.style.transform = "scaleX(" + Math.min(1, Math.max(0, y / max)) + ")";
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(paint);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    paint();
  }

  function bootReveals() {
    var blocks = document.querySelectorAll(".section, .card, .panel, .swap-card, .side-card, .clerk, .shore, .step, .token-band, .table-wrap, .callout");
    blocks.forEach(function (el, index) {
      el.classList.add("reveal");
      el.style.setProperty("--stagger", String((index % 5) * 60) + "ms");
    });
    if (reduce || !("IntersectionObserver" in window)) {
      blocks.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var viewH = window.innerHeight || 800;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    blocks.forEach(function (el) {
      var rect = el.getBoundingClientRect();
      if (rect.top < viewH * 0.92 && rect.bottom > 0) el.classList.add("is-in");
      else io.observe(el);
    });
  }

  function bootParallax() {
    var nodes = document.querySelectorAll(".hero-art");
    if (reduce || !nodes.length) return;
    var ticking = false;
    function paint() {
      ticking = false;
      var vh = window.innerHeight || 800;
      nodes.forEach(function (el) {
        var rect = el.getBoundingClientRect();
        var mid = rect.top + rect.height / 2 - vh / 2;
        var shift = Math.max(-24, Math.min(24, mid * -0.04));
        el.style.transform = "translate3d(0," + shift.toFixed(2) + "px,0)";
      });
    }
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(paint);
    }, { passive: true });
    paint();
  }

  function splitStat(text) {
    var match = String(text).match(/^(.*?)(-?[\d,]+(?:\.\d+)?)(.*)$/);
    if (!match) return null;
    var raw = match[2];
    var num = parseFloat(raw.replace(/,/g, ""));
    if (!Number.isFinite(num)) return null;
    return {
      pre: match[1],
      num: num,
      suf: match[3],
      decimals: (raw.split(".")[1] || "").length,
      grouped: raw.indexOf(",") !== -1 || num >= 1000,
    };
  }

  function formatStat(part, value) {
    var body = value.toLocaleString("en-US", {
      minimumFractionDigits: part.decimals,
      maximumFractionDigits: part.decimals,
      useGrouping: part.grouped,
    });
    return part.pre + body + part.suf;
  }

  var anims = new WeakMap();

  function countTo(node, text) {
    var part = splitStat(text);
    if (!part || reduce) {
      node.textContent = text;
      return;
    }
    var prev = anims.get(node);
    var from = prev && Number.isFinite(prev.current) ? prev.current : part.num - Math.min(Math.abs(part.num) * 0.012, part.num > 1000 ? 400 : Math.abs(part.num) * 0.08);
    if (prev && prev.raf) cancelAnimationFrame(prev.raf);
    var start = performance.now();
    var state = { current: from, raf: 0 };
    anims.set(node, state);
    function tick(now) {
      var t = Math.min(1, (now - start) / 700);
      var eased = 1 - Math.pow(1 - t, 3);
      state.current = from + (part.num - from) * eased;
      node.textContent = formatStat(part, t === 1 ? part.num : state.current);
      if (t < 1) state.raf = requestAnimationFrame(tick);
      else node.textContent = text;
    }
    state.raf = requestAnimationFrame(tick);
  }

  function watchStats() {
    document.addEventListener("privyra:stats", function (event) {
      var detail = event.detail || {};
      ["block", "gas", "time", "eth"].forEach(function (key) {
        if (!detail[key]) return;
        document.querySelectorAll('[data-stat="' + key + '"]').forEach(function (node) {
          countTo(node, detail[key]);
        });
      });
      paintTickerStats(detail);
    });
    document.addEventListener("privyra:shore", function (event) {
      var detail = event.detail || {};
      if (detail.node && detail.text) countTo(detail.node, detail.text);
    });
  }

  var tickerSeqs = [];

  function tick(label, value, extra) {
    var node = h("span", { class: "tick" });
    node.appendChild(h("b", { text: label }));
    node.appendChild(document.createTextNode(" " + value + (extra ? " " + extra : "")));
    return node;
  }

  function fillSeq(seq, quotes, stats) {
    while (seq.firstChild) seq.removeChild(seq.firstChild);
    var symbols = ["AAPL", "NVDA", "MSFT", "TSLA", "AMZN", "META", "GOOGL", "AMD", "NFLX", "COIN", "PLTR", "AVGO"];
    symbols.forEach(function (sym) {
      var quote = quotes[sym];
      if (!quote || typeof quote.close !== "number") return;
      var change = "";
      if (typeof quote.prevClose === "number" && quote.prevClose) {
        var pct = ((quote.close - quote.prevClose) / quote.prevClose) * 100;
        change = (pct > 0 ? "+" : pct < 0 ? "−" : "") + Math.abs(pct).toFixed(2) + "%";
      }
      var node = tick(sym, quote.close.toLocaleString("en-US", { style: "currency", currency: "USD" }), change ? change + " EOD" : "EOD");
      if (change) node.classList.add(change.charAt(0) === "+" ? "is-up" : change.charAt(0) === "−" ? "is-down" : "");
      seq.appendChild(node);
    });
    if (stats) {
      if (stats.block) seq.appendChild(tick("BLOCK", stats.block));
      if (stats.gas) seq.appendChild(tick("GAS", stats.gas));
      if (stats.time) seq.appendChild(tick("TIME", stats.time));
      if (stats.eth) seq.appendChild(tick("ETH", stats.eth));
    }
    if (!seq.childNodes.length) seq.appendChild(tick("PRIVYRA", "the book stays shut"));
  }

  var latestStats = null;

  function paintTickerStats(detail) {
    latestStats = detail;
    if (!tickerSeqs.length || !tickerQuotes) return;
    tickerSeqs.forEach(function (seq) { fillSeq(seq, tickerQuotes, latestStats); });
  }

  var tickerQuotes = null;

  function bootTicker() {
    var strip = document.getElementById("net-strip");
    var bar = h("div", { class: "ink-ticker" });
    bar.setAttribute("role", "region");
    bar.setAttribute("aria-label", "End-of-day closes and chain stats");
    var track = h("div", { class: "ticker-track" });
    var copies = reduce ? 1 : 2;
    for (var i = 0; i < copies; i++) {
      var seq = h("div", { class: "ticker-seq" });
      track.appendChild(seq);
      tickerSeqs.push(seq);
    }
    bar.appendChild(track);
    if (strip && strip.parentNode) strip.parentNode.insertBefore(bar, strip.nextSibling);
    else document.body.appendChild(bar);

    fetch(cfg.markets.snapshotUrl).then(function (res) {
      if (!res.ok) throw new Error("snapshot");
      return res.json();
    }).then(function (payload) {
      tickerQuotes = (payload && payload.quotes) || {};
      tickerSeqs.forEach(function (seq) { fillSeq(seq, tickerQuotes, latestStats); });
    }).catch(function () {
      tickerQuotes = {};
      tickerSeqs.forEach(function (seq) { fillSeq(seq, tickerQuotes, latestStats); });
    });
  }

  function init() {
    document.documentElement.classList.add(reduce ? "reduce-motion" : "motion-on");
    bootAtmosphere();
    bootProgress();
    bootTicker();
    bootReveals();
    bootParallax();
    watchStats();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
