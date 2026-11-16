/* Public Robinhood Chain tape, plus an Elysium head count. Not Privyra activity. */
(function () {
  var net = window.PrivyraNet;
  var cfg = window.PRIVYRA_CONFIG;

  function age(ts) {
    if (!Number.isFinite(ts)) return "n/a";
    var seconds = Math.max(0, Math.floor(Date.now() / 1000 - ts));
    if (seconds < 5) return "just now";
    if (seconds < 60) return seconds + "s";
    if (seconds < 3600) return Math.floor(seconds / 60) + "m";
    return Math.floor(seconds / 3600) + "h";
  }

  function kind(tx) {
    var input = tx.input || "0x";
    return input === "0x" || input === "0x0" ? "Transfer" : "Call";
  }

  var seenTape = Object.create(null);

  async function loadTape() {
    var box = document.getElementById("tape");
    if (!box) return;
    var rh = cfg.networks.robinhood;
    try {
      var latest = net.hexToNum(await net.rpc(rh.rpc[0], "eth_blockNumber", []));
      var rows = [];
      var guard = 0;
      var cursor = latest;
      while (rows.length < 8 && guard < 6 && cursor > 0) {
        var block = await net.rpc(rh.rpc[0], "eth_getBlockByNumber", ["0x" + cursor.toString(16), true]);
        var txs = Array.isArray(block.transactions) ? block.transactions : [];
        var ts = net.hexToNum(block.timestamp);
        txs.forEach(function (tx) {
          if (rows.length >= 8) return;
          if (typeof tx === "string") {
            rows.push({ hash: tx, kind: "Tx", to: "", value: "—", age: age(ts) });
            return;
          }
          rows.push({
            hash: tx.hash,
            kind: kind(tx),
            to: tx.to || "",
            value: net.formatUnits(tx.value, 18, 5) + " ETH",
            age: age(ts),
          });
        });
        cursor -= 1;
        guard += 1;
      }
      net.clear(box);
      if (!rows.length) {
        box.appendChild(net.h("p", { class: "muted", text: "The newest blocks had no transactions in the window we read." }));
        return;
      }
      rows.forEach(function (row) {
        var hashLink = net.isHash(row.hash)
          ? net.h("a", {
              href: rh.explorer + "/tx/" + row.hash,
              target: "_blank",
              rel: "noopener noreferrer",
              text: row.hash.slice(0, 8) + "…" + row.hash.slice(-4),
            })
          : net.h("span", { text: "n/a" });
        var toNode = net.isAddress(row.to)
          ? net.h("a", { href: rh.explorer + "/address/" + row.to, target: "_blank", rel: "noopener noreferrer", text: net.shortAddr(row.to) })
          : net.h("span", { text: row.to ? "contract" : "—" });
        var fresh = row.hash && !seenTape[row.hash];
        if (row.hash) seenTape[row.hash] = true;
        box.appendChild(net.h("div", { class: fresh ? "tape-row is-new" : "tape-row" }, [
          hashLink,
          net.h("span", { text: row.kind }),
          toNode,
          net.h("span", { text: row.value }),
          net.h("span", { text: row.age }),
        ]));
      });
    } catch (err) {
      net.clear(box);
      box.appendChild(net.h("p", { class: "muted", text: "Tape unavailable. The public Robinhood Chain RPC did not answer. n/a" }));
    }
  }

  async function loadShores() {
    var nodes = document.querySelectorAll("[data-shore-block]");
    if (!nodes.length) return;
    nodes.forEach(async function (node) {
      var key = node.dataset.shoreBlock;
      var network = cfg.networks[key];
      if (!network) return;
      try {
        var hex = await net.rpc(network.rpc[0], "eth_blockNumber", []);
        var label = net.hexToNum(hex).toLocaleString("en-US");
        node.textContent = label;
        document.dispatchEvent(new CustomEvent("privyra:shore", { detail: { node: node, text: label } }));
      } catch (err) {
        node.textContent = "n/a";
      }
    });
  }

  function init() {
    if (!document.getElementById("tape") && !document.querySelector("[data-shore-block]")) return;
    loadTape();
    loadShores();
    setInterval(function () {
      if (!document.hidden) {
        loadTape();
        loadShores();
      }
    }, 15000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
