(function () {
  var root = document.getElementById("agents");
  if (!root) return;
  var net = window.PrivyraNet;

  var block = document.getElementById("clerk-block");
  var gas = document.getElementById("clerk-gas");
  var time = document.getElementById("clerk-time");
  var ledgerStatus = document.getElementById("ledger-status");

  document.addEventListener("privyra:stats", function (event) {
    var detail = event.detail || {};
    if (block) block.textContent = detail.block || "n/a";
    if (gas) gas.textContent = detail.gas || "n/a";
    if (time) time.textContent = detail.time || "n/a";
    if (ledgerStatus) {
      ledgerStatus.textContent = detail.ok ? "Reading this tab" : "RPC n/a";
      ledgerStatus.className = detail.ok ? "status-on" : "status-idle";
    }
  });

  var interval = root.querySelector("#clerk-interval");
  var stored = localStorage.getItem("privyra.interval");
  if (stored && interval.querySelector('option[value="' + stored + '"]')) interval.value = stored;
  interval.addEventListener("change", function () {
    localStorage.setItem("privyra.interval", interval.value);
    document.dispatchEvent(new CustomEvent("privyra:interval"));
  });

  var spread = root.querySelector("#spread-bps");
  var spreadStored = localStorage.getItem("privyra.spread");
  if (spreadStored) spread.value = spreadStored;
  spread.addEventListener("change", function () {
    var n = Number(spread.value);
    if (!Number.isFinite(n) || n < 0 || n > 1000) {
      spread.setCustomValidity("Use a threshold from 0 to 1000 basis points.");
      spread.reportValidity();
      return;
    }
    spread.setCustomValidity("");
    localStorage.setItem("privyra.spread", String(n));
    net.toast("Threshold saved on this device");
  });

  var watch = document.getElementById("tape-watch");
  var list = document.getElementById("tape-list");
  function symbols() {
    var raw = (localStorage.getItem("privyra.watchlist") || "AAPL,NVDA,MSFT,TSLA").split(",");
    return raw.map(function (item) { return item.trim().toUpperCase(); }).filter(Boolean).slice(0, 8);
  }
  function paintWatch(quotes) {
    net.clear(list);
    symbols().forEach(function (symbol) {
      var quote = quotes[symbol];
      var line = symbol + " · ";
      if (!quote || typeof quote.close !== "number") line += "no close in the snapshot";
      else line += "EOD " + quote.close.toLocaleString("en-US", { style: "currency", currency: "USD" }) + " · " + quote.date;
      list.appendChild(net.h("li", { text: line }));
    });
  }
  watch.value = symbols().join(", ");
  watch.addEventListener("change", function () {
    var next = watch.value.split(",").map(function (item) { return item.trim().toUpperCase(); }).filter(Boolean).slice(0, 8);
    localStorage.setItem("privyra.watchlist", next.join(","));
    watch.value = next.join(", ");
    loadQuotes();
  });

  function loadQuotes() {
    fetch(window.PRIVYRA_CONFIG.markets.snapshotUrl).then(function (res) { return res.json(); }).then(function (payload) {
      paintWatch(payload.quotes || {});
      var status = document.getElementById("tape-status");
      if (status) status.textContent = "Showing the end-of-day snapshot";
    }).catch(function () {
      paintWatch({});
      var status = document.getElementById("tape-status");
      if (status) status.textContent = "Snapshot n/a";
    });
  }
  loadQuotes();
})();
