/* Robinhood Chain head, gas, and block time. ETH spot is a separate CoinGecko read. */
(function () {
  var net = window.PrivyraNet;
  var cfg = window.PRIVYRA_CONFIG;
  var rh = cfg.networks.robinhood;
  var timer = 0;
  var running = false;

  function intervalMs() {
    var raw = Number(localStorage.getItem("privyra.interval") || 15);
    if (!Number.isFinite(raw)) raw = 15;
    return Math.min(120, Math.max(10, raw)) * 1000;
  }

  function setStat(name, text, title) {
    document.querySelectorAll('[data-stat="' + name + '"]').forEach(function (node) {
      node.textContent = text;
      if (title) node.title = title;
    });
  }

  function setDot(ok) {
    document.querySelectorAll('[data-stat="dot"]').forEach(function (node) {
      node.classList.toggle("ok", !!ok);
      node.classList.toggle("bad", !ok);
    });
  }

  function formatGas(weiHex) {
    var wei = net.hexToNum(weiHex);
    if (!Number.isFinite(wei)) return "n/a";
    var gwei = wei / 1e9;
    if (gwei < 0.001) return gwei.toFixed(5) + " gwei";
    if (gwei < 1) return gwei.toFixed(4) + " gwei";
    return gwei.toFixed(2) + " gwei";
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds <= 0) return "n/a";
    if (seconds < 1) return Math.round(seconds * 1000) + " ms";
    if (seconds < 10) return seconds.toFixed(2) + " s";
    return seconds.toFixed(1) + " s";
  }

  async function readChain() {
    var rpcUrl = rh.rpc[0];
    var latestHex = await net.rpc(rpcUrl, "eth_blockNumber", []);
    var latest = net.hexToNum(latestHex);
    var gasHex = await net.rpc(rpcUrl, "eth_gasPrice", []);
    var span = 240;
    var head = await net.rpc(rpcUrl, "eth_getBlockByNumber", ["0x" + latest.toString(16), false]);
    var prevNum = Math.max(0, latest - span);
    var prev = await net.rpc(rpcUrl, "eth_getBlockByNumber", ["0x" + prevNum.toString(16), false]);
    var dt = net.hexToNum(head.timestamp) - net.hexToNum(prev.timestamp);
    var blocks = net.hexToNum(head.number) - net.hexToNum(prev.number);
    var avg = blocks > 0 ? dt / blocks : NaN;
    return {
      block: latest.toLocaleString("en-US"),
      gas: formatGas(gasHex),
      time: formatTime(avg),
      timestamp: net.hexToNum(head.timestamp),
      ok: true,
    };
  }

  async function readEth() {
    var key = "privyra.eth";
    try {
      var cached = JSON.parse(sessionStorage.getItem(key) || "null");
      if (cached && Date.now() - cached.at < 60000 && Number.isFinite(cached.usd)) return cached;
    } catch (err) { /* ignore broken cache */ }
    var res = await fetch(cfg.markets.ethPriceUrl);
    if (!res.ok) throw new Error("ETH price HTTP " + res.status);
    var body = await res.json();
    var usd = body && body.ethereum && body.ethereum.usd;
    if (typeof usd !== "number") throw new Error("ETH price missing");
    var record = { usd: usd, at: Date.now(), updated: body.ethereum.last_updated_at || null };
    sessionStorage.setItem(key, JSON.stringify(record));
    return record;
  }

  async function tick() {
    if (running || document.hidden) return;
    running = true;
    var detail = { block: "n/a", gas: "n/a", time: "n/a", eth: "n/a", ok: false };
    try {
      var chain = await readChain();
      detail.block = chain.block;
      detail.gas = chain.gas;
      detail.time = chain.time;
      detail.timestamp = chain.timestamp;
      detail.ok = true;
      setDot(true);
    } catch (err) {
      setDot(false);
    }
    setStat("block", detail.block, "eth_blockNumber on " + rh.rpc[0]);
    setStat("gas", detail.gas, "eth_gasPrice on the public Robinhood Chain RPC");
    setStat("time", detail.time, "Average interval across the last 240 Robinhood Chain blocks");
    try {
      var eth = await readEth();
      detail.eth = eth.usd.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
      setStat("eth", detail.eth, "Ether spot from CoinGecko. Not a Robinhood Chain oracle.");
    } catch (err) {
      setStat("eth", "n/a", "CoinGecko did not answer.");
    }
    document.dispatchEvent(new CustomEvent("privyra:stats", { detail: detail }));
    running = false;
  }

  function arm() {
    clearTimeout(timer);
    timer = setTimeout(function () {
      tick().finally(arm);
    }, intervalMs());
  }

  function start() {
    if (!document.getElementById("net-strip") && !document.querySelector("[data-stat]")) return;
    tick().finally(arm);
  }

  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) tick();
  });
  document.addEventListener("privyra:interval", function () {
    clearTimeout(timer);
    arm();
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
