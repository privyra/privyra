(function () {
  var body = document.getElementById("market-body");
  if (!body) return;
  var net = window.PrivyraNet;
  var cfg = window.PRIVYRA_CONFIG;
  var catalogue = window.PRIVYRA_CATALOGUE.slice();
  var quotes = {};
  var meta = { kind: "end-of-day", notLive: true, attribution: "", disclaimer: "", fetchedAt: "", omitted: [] };
  var state = { q: "", sector: "all", sort: "symbol", dir: "asc" };

  function money(value) {
    if (typeof value !== "number" || !Number.isFinite(value)) return "—";
    return value.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function compact(value) {
    if (typeof value !== "number" || !Number.isFinite(value)) return "—";
    return value.toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 2 });
  }

  function change(quote) {
    if (!quote || typeof quote.close !== "number" || typeof quote.prevClose !== "number" || quote.prevClose === 0) return null;
    return ((quote.close - quote.prevClose) / quote.prevClose) * 100;
  }

  function rows() {
    var q = state.q.trim().toLowerCase();
    var list = catalogue.filter(function (item) {
      if (state.sector !== "all" && item.sector !== state.sector) return false;
      if (!q) return true;
      return item.symbol.toLowerCase().indexOf(q) !== -1 || item.name.toLowerCase().indexOf(q) !== -1 || item.sector.toLowerCase().indexOf(q) !== -1;
    });
    var dir = state.dir === "desc" ? -1 : 1;
    list.sort(function (a, b) {
      function blank(item) {
        var quote = quotes[item.symbol];
        if (state.sort === "close") return quote ? quote.close : null;
        if (state.sort === "change") return change(quote);
        if (state.sort === "volume") return quote ? quote.volume : null;
        return 0;
      }
      if (state.sort === "close" || state.sort === "change" || state.sort === "volume") {
        var av = blank(a);
        var bv = blank(b);
        if (av == null && bv == null) return a.symbol.localeCompare(b.symbol);
        if (av == null) return 1;
        if (bv == null) return -1;
        return av === bv ? a.symbol.localeCompare(b.symbol) : (av - bv) * dir;
      }
      var field = state.sort === "name" ? "name" : state.sort === "sector" ? "sector" : "symbol";
      return a[field].localeCompare(b[field]) * dir;
    });
    return list;
  }

  function render() {
    net.clear(body);
    var list = rows();
    var count = document.getElementById("market-count");
    var priced = catalogue.filter(function (item) { return quotes[item.symbol]; }).length;
    if (count) {
      count.textContent = list.length + " shown · " + priced + " of " + catalogue.length + " have an end-of-day close";
    }
    if (!list.length) {
      body.appendChild(net.h("tr", {}, [
        net.h("td", { colspan: "7", text: "Nothing in the catalogue matches that search." }),
      ]));
      return;
    }
    list.forEach(function (item) {
      var quote = quotes[item.symbol];
      var delta = change(quote);
      var deltaNode = net.h("td", { class: "num" });
      if (delta == null) deltaNode.textContent = "—";
      else {
        deltaNode.textContent = (delta > 0 ? "+" : delta < 0 ? "−" : "") + Math.abs(delta).toFixed(2) + "%";
        deltaNode.className = "num " + (delta > 0 ? "up" : delta < 0 ? "down" : "");
      }
      var session = net.h("td", {});
      if (quote && quote.date) {
        session.append(
          net.h("span", { class: "pill", text: "EOD" }),
          document.createTextNode(" " + quote.date)
        );
      } else {
        session.textContent = "No public feed";
      }
      body.appendChild(net.h("tr", {}, [
        net.h("th", { scope: "row", text: item.symbol }),
        net.h("td", { text: item.name }),
        net.h("td", { text: item.sector }),
        net.h("td", { class: "num", text: quote ? money(quote.close) : "—" }),
        deltaNode,
        net.h("td", { class: "num", text: quote ? compact(quote.volume) : "—" }),
        session,
      ]));
    });
  }

  function applyPayload(payload) {
    quotes = payload && payload.quotes ? payload.quotes : {};
    meta.kind = payload.kind || "end-of-day";
    meta.notLive = payload.notLive !== false;
    meta.attribution = payload.attribution || "";
    meta.disclaimer = payload.disclaimer || "";
    meta.fetchedAt = payload.fetchedAt || "";
    meta.omitted = payload.omitted || [];
    var note = document.getElementById("market-note");
    if (note) {
      var bits = [];
      if (meta.notLive) bits.push("These closes are end-of-day, not a live tape.");
      else bits.push("This feed is marked live by its payload.");
      if (meta.disclaimer) bits.push(meta.disclaimer);
      if (meta.attribution) bits.push("Source: " + meta.attribution + ".");
      if (meta.fetchedAt) bits.push("Snapshot fetched " + meta.fetchedAt + ".");
      meta.omitted.forEach(function (item) {
        bits.push(item.symbol + ": " + item.reason);
      });
      note.textContent = bits.join(" ");
    }
    render();
  }

  function sectors() {
    var wrap = document.getElementById("market-sectors");
    if (!wrap) return;
    var names = ["all"].concat(Array.from(new Set(catalogue.map(function (item) { return item.sector; }))));
    names.forEach(function (name) {
      var button = net.h("button", {
        type: "button",
        text: name === "all" ? "All" : name,
        "aria-pressed": name === "all" ? "true" : "false",
      });
      button.addEventListener("click", function () {
        state.sector = name;
        wrap.querySelectorAll("button").forEach(function (other) {
          other.setAttribute("aria-pressed", other === button ? "true" : "false");
        });
        render();
      });
      wrap.appendChild(button);
    });
  }

  async function loadSnapshot() {
    var res = await fetch(cfg.markets.snapshotUrl);
    if (!res.ok) throw new Error("snapshot HTTP " + res.status);
    applyPayload(await res.json());
  }

  async function refreshLive() {
    var status = document.getElementById("market-refresh-status");
    var symbols = Object.keys(quotes);
    if (!symbols.length) symbols = catalogue.map(function (item) { return item.symbol; });
    var next = {};
    var cursor = 0;
    var failed = 0;
    async function worker() {
      while (cursor < symbols.length) {
        var index = cursor;
        cursor += 1;
        var symbol = symbols[index];
        if (status) status.textContent = "Refreshing " + (index + 1) + " of " + symbols.length + "…";
        try {
          var res = await fetch("https://www.fin-node.net/api/" + encodeURIComponent(symbol) + ".json");
          if (!res.ok) throw new Error("HTTP " + res.status);
          var bundle = await res.json();
          var prices = bundle.prices || [];
          if (prices.length < 1) throw new Error("empty");
          var last = prices[prices.length - 1];
          var prev = prices.length > 1 ? prices[prices.length - 2] : null;
          if (typeof last.Close !== "number" || !last.Date) throw new Error("shape");
          if (symbol === "WBD" && prices.length < 2) throw new Error("stale");
          next[symbol] = {
            date: last.Date,
            close: last.Close,
            prevClose: prev && typeof prev.Close === "number" ? prev.Close : null,
            volume: last.Volume,
            updated: bundle.updated || "",
          };
        } catch (err) {
          failed += 1;
          if (quotes[symbol]) next[symbol] = quotes[symbol];
        }
      }
    }
    var workers = [worker(), worker(), worker()];
    await Promise.all(workers);
    applyPayload({
      kind: "end-of-day",
      notLive: true,
      attribution: "Fin-node (fin-node.net)",
      disclaimer: "Refreshed in this browser from Fin-node public bundles. Still end-of-day, not a live tape, and not investment advice.",
      fetchedAt: new Date().toISOString(),
      omitted: failed ? [{ symbol: "Note", reason: failed + " symbol request" + (failed === 1 ? "" : "s") + " failed and kept the previous close where one existed." }] : [],
      quotes: next,
    });
    if (status) status.textContent = failed ? "Refresh finished with " + failed + " miss" + (failed === 1 ? "" : "es") + "." : "Refresh finished.";
  }

  function init() {
    sectors();
    document.getElementById("market-search").addEventListener("input", function (event) {
      state.q = event.target.value;
      render();
    });
    document.getElementById("market-sort").addEventListener("change", function (event) {
      var parts = event.target.value.split(":");
      state.sort = parts[0];
      state.dir = parts[1] || "asc";
      render();
    });
    var button = document.getElementById("market-refresh");
    if (button) button.addEventListener("click", function () { refreshLive(); });
    loadSnapshot().catch(function () {
      var note = document.getElementById("market-note");
      if (note) note.textContent = "The end-of-day snapshot could not be loaded. Prices are left blank. n/a";
      render();
    });
    if (cfg.markets.quoteUrl) {
      fetch(cfg.markets.quoteUrl).then(function (res) {
        if (!res.ok) throw new Error("quote url");
        return res.json();
      }).then(applyPayload).catch(function () {
        var note = document.getElementById("market-note");
        if (note) note.textContent += " The configured quoteUrl did not load. Showing the snapshot instead.";
      });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
