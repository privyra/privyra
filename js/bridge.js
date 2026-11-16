(function () {
  var form = document.getElementById("bridge-form");
  if (!form) return;
  var net = window.PrivyraNet;
  var cfg = window.PRIVYRA_CONFIG;
  var desk = window.PrivyraDesk;
  var WATCH = "privyra.watch";

  function direction() {
    var checked = form.querySelector('input[name="dir"]:checked');
    return checked && checked.value === "el-to-rh" ? "el-to-rh" : "rh-to-el";
  }

  function paint() {
    var toElysium = direction() === "rh-to-el";
    var asset = document.getElementById("bridge-asset");
    var shoreKey = toElysium ? "robinhood" : "elysium";
    var symbol = toElysium ? "ETH" : "HYPE";
    asset.textContent = symbol + " on " + cfg.networks[shoreKey].name;
    var slot = document.getElementById("bridge-balance");
    desk.balance(shoreKey, symbol, window.PrivyraWallet.state.account).then(function (result) {
      if (result.state === "ok") slot.textContent = "Balance " + result.text + " " + symbol;
      else if (result.state === "nowallet") slot.textContent = "Connect a wallet to read the source balance";
      else slot.textContent = "Balance n/a";
    });
    var seal = document.getElementById("bridge-seal");
    var privateBox = form.querySelector('input[name="private"]');
    seal.hidden = !(privateBox && privateBox.checked);
    var submit = document.getElementById("bridge-submit");
    var ready = net.isAddress(cfg.contracts.bridgeRobinhood) && net.isAddress(cfg.contracts.bridgeElysium);
    submit.disabled = true;
    submit.textContent = ready ? "Ferry addresses are set, sending is not wired" : "Ferry not deployed";
  }

  function readWatch() {
    try { return JSON.parse(localStorage.getItem(WATCH) || "[]"); }
    catch (err) { return []; }
  }

  function writeWatch(items) {
    localStorage.setItem(WATCH, JSON.stringify(items.slice(0, 12)));
  }

  function renderWatch() {
    var list = document.getElementById("watch-list");
    if (!list) return;
    net.clear(list);
    var items = readWatch();
    if (!items.length) {
      list.appendChild(net.h("p", { class: "help", text: "Nothing saved on this device." }));
      return;
    }
    items.forEach(function (item) {
      var network = cfg.networks[item.chain];
      var button = net.h("button", {
        type: "button",
        text: (network ? network.name : item.chain) + " · " + item.hash.slice(0, 10) + "… · " + (item.status || "saved"),
      });
      button.addEventListener("click", function () {
        document.getElementById("receipt-chain").value = item.chain;
        document.getElementById("receipt-hash").value = item.hash;
        document.getElementById("receipt-form").requestSubmit();
      });
      list.appendChild(button);
    });
  }

  form.addEventListener("change", paint);
  form.addEventListener("submit", function (event) { event.preventDefault(); });
  document.addEventListener("privyra:wallet", paint);

  var receipt = document.getElementById("receipt-form");
  receipt.addEventListener("submit", async function (event) {
    event.preventDefault();
    var out = document.getElementById("receipt-out");
    var chain = document.getElementById("receipt-chain").value;
    var hash = document.getElementById("receipt-hash").value.trim();
    var network = cfg.networks[chain];
    net.clear(out);
    if (!net.isHash(hash)) {
      out.appendChild(net.h("p", { class: "invalid", text: "Enter a 32-byte transaction hash, 0x followed by 64 hex characters." }));
      return;
    }
    out.appendChild(net.h("p", { class: "muted", text: "Asking " + network.name + "…" }));
    try {
      var tx = await net.rpc(network.rpc[0], "eth_getTransactionByHash", [hash]);
      net.clear(out);
      if (!tx) {
        out.appendChild(net.h("p", { text: "Not found on " + network.name + "." }));
        return;
      }
      var receiptBody = null;
      var status = "Seen, receipt not in yet";
      try {
        receiptBody = await net.rpc(network.rpc[0], "eth_getTransactionReceipt", [hash]);
        if (receiptBody && receiptBody.status) {
          status = receiptBody.status === "0x1" ? "Success" : receiptBody.status === "0x0" ? "Reverted" : receiptBody.status;
        }
      } catch (err) { status = "Seen, receipt unread"; }
      var dl = net.h("dl", { class: "spec" });
      function row(term, text) {
        dl.appendChild(net.h("div", {}, [net.h("dt", { text: term }), net.h("dd", { text: text })]));
      }
      row("Status", status);
      row("From", tx.from || "—");
      row("To", tx.to || "Contract creation");
      row("Value", net.formatUnits(tx.value, network.nativeCurrency.decimals, 6) + " " + network.nativeCurrency.symbol);
      row("Block", tx.blockNumber ? String(net.hexToNum(tx.blockNumber)) : "Pending");
      out.append(
        net.h("p", { class: "help", text: "Public receipt on " + network.name + ". This is not a Privyra claim." }),
        dl,
        net.h("a", {
          href: network.explorer + "/tx/" + hash,
          target: "_blank",
          rel: "noopener noreferrer",
          text: "Open in " + network.explorerName,
        })
      );
      var keep = net.h("button", { type: "button", class: "btn btn-ghost btn-small", text: "Keep on this device" });
      keep.addEventListener("click", function () {
        var items = readWatch().filter(function (item) { return item.hash !== hash || item.chain !== chain; });
        items.unshift({ hash: hash, chain: chain, status: status });
        writeWatch(items);
        renderWatch();
        net.toast("Saved on this device");
      });
      out.appendChild(keep);
    } catch (err) {
      net.clear(out);
      out.appendChild(net.h("p", { class: "invalid", text: "The RPC did not answer. n/a" }));
    }
  });

  paint();
  renderWatch();
})();
