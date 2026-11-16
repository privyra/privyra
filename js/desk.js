/* Shared token list, picker, and balance reads for Swap and Pools. */
(function () {
  var net = window.PrivyraNet;
  var cfg = window.PRIVYRA_CONFIG;

  function tokens() {
    return cfg.tokens.map(function (token) {
      var copy = {
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals,
        nativeOn: token.nativeOn || "",
        addresses: Object.assign({}, token.addresses || {}),
      };
      if (copy.symbol === "PRIVYRA" && net.isAddress(cfg.token.address) && !net.isAddress(copy.addresses.robinhood)) {
        copy.addresses.robinhood = cfg.token.address;
      }
      return copy;
    });
  }

  function find(symbol) {
    return tokens().find(function (token) { return token.symbol === symbol; }) || tokens()[0];
  }

  function locate(token, shore) {
    if (token.nativeOn && token.nativeOn === shore) return "native";
    var addr = token.addresses && token.addresses[shore];
    return net.isAddress(addr) ? addr : "";
  }

  function statusLine(token, shore) {
    var where = locate(token, shore);
    var shoreName = cfg.networks[shore] ? cfg.networks[shore].name : shore;
    if (where === "native") return "Native coin on " + shoreName;
    if (where) return where;
    return "Contract unset on " + shoreName;
  }

  function ensureDialog() {
    if (document.getElementById("token-dialog")) return;
    var dialog = net.h("dialog", { id: "token-dialog", class: "modal", "aria-labelledby": "token-dialog-title" });
    var search = net.h("input", { id: "token-search", type: "search", placeholder: "Search symbol or name", "aria-label": "Search tokens" });
    var list = net.h("div", { id: "token-options", class: "provider-list" });
    dialog.append(
      net.h("div", { class: "spread" }, [
        net.h("h2", { id: "token-dialog-title", text: "Choose a token" }),
        net.h("button", { type: "button", class: "icon-x", "data-close": "1", text: "Close" }),
      ]),
      search,
      net.h("p", { class: "help", text: "Only native coins can be read today. Other addresses stay blank until js/config.js has them." }),
      list
    );
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog || event.target.closest("[data-close]")) dialog.close();
    });
    dialog.addEventListener("close", function () { dialog._onPick = null; });
    search.addEventListener("input", function () { paint(search.value); });
    document.body.appendChild(dialog);
  }

  function paint(query) {
    var list = document.getElementById("token-options");
    var dialog = document.getElementById("token-dialog");
    var q = (query || "").trim().toLowerCase();
    net.clear(list);
    tokens().filter(function (token) {
      return !q || token.symbol.toLowerCase().indexOf(q) !== -1 || token.name.toLowerCase().indexOf(q) !== -1;
    }).forEach(function (token) {
      var button = net.h("button", { type: "button", class: "provider" }, [
        net.h("span", { class: "avatar", "aria-hidden": "true", text: token.symbol.slice(0, 1) }),
        net.h("span", {}, [
          net.h("strong", { text: token.symbol }),
          document.createTextNode(" "),
          net.h("span", { class: "muted", text: token.name }),
          net.h("div", { class: "help", text: token.nativeOn ? ("Native on " + cfg.networks[token.nativeOn].name) : "Address configured per shore" }),
        ]),
      ]);
      button.addEventListener("click", function () {
        if (dialog._onPick) dialog._onPick(token.symbol);
        dialog.close();
      });
      list.appendChild(button);
    });
    if (!list.childElementCount) {
      list.appendChild(net.h("p", { class: "muted", text: "No token matches that search." }));
    }
  }

  function openPicker(onPick) {
    ensureDialog();
    var dialog = document.getElementById("token-dialog");
    dialog._onPick = onPick;
    var search = document.getElementById("token-search");
    search.value = "";
    paint("");
    dialog.showModal();
    search.focus();
  }

  function plainUnits(hex, decimals) {
    var value;
    try { value = BigInt(hex || "0x0"); }
    catch (err) { return ""; }
    if (value < 0n) value = -value;
    var scale = 10n ** BigInt(decimals);
    var whole = value / scale;
    var frac = (value % scale).toString().padStart(decimals, "0").replace(/0+$/, "");
    return frac ? whole.toString() + "." + frac : whole.toString();
  }

  async function balance(shore, symbol, account) {
    if (!net.isAddress(account)) return { state: "nowallet" };
    var token = find(symbol);
    var where = locate(token, shore);
    if (!where) return { state: "unset" };
    var rpcUrl = cfg.networks[shore].rpc[0];
    try {
      var hex;
      if (where === "native") {
        hex = await net.rpc(rpcUrl, "eth_getBalance", [account, "latest"]);
      } else {
        var data = "0x70a08231" + account.slice(2).toLowerCase().padStart(64, "0");
        hex = await net.rpc(rpcUrl, "eth_call", [{ to: where, data: data }, "latest"]);
      }
      if (!hex || hex === "0x") return { state: "error" };
      return {
        state: "ok",
        text: net.formatUnits(hex, token.decimals, 6),
        input: plainUnits(hex, token.decimals),
        symbol: token.symbol,
      };
    } catch (err) {
      return { state: "error" };
    }
  }

  function fillSelect(select) {
    var current = select.value;
    net.clear(select);
    tokens().forEach(function (token) {
      var option = net.h("option", { value: token.symbol, text: token.symbol + " · " + token.name });
      select.appendChild(option);
    });
    if (current && find(current)) select.value = current;
  }

  function slipKey() { return "privyra.slippage"; }

  function readSlip(root) {
    var custom = root.querySelector("[data-slip-custom]");
    if (custom && custom.value.trim() !== "") {
      var n = Number(custom.value);
      if (Number.isFinite(n) && n >= 0 && n <= 50) return n;
    }
    var checked = root.querySelector('input[name="slip"]:checked');
    return checked ? Number(checked.value) : 0.5;
  }

  function mountSlip(root) {
    var label = root.querySelector("[data-slip-label]");
    var pop = root.querySelector(".slip-pop");
    var opener = root.querySelector("[data-slip-open]");
    var stored = localStorage.getItem(slipKey());
    if (stored) {
      var match = root.querySelector('input[name="slip"][value="' + stored + '"]');
      if (match) match.checked = true;
      else if (root.querySelector("[data-slip-custom]")) root.querySelector("[data-slip-custom]").value = stored;
    }
    function paintLabel() {
      var value = readSlip(root);
      localStorage.setItem(slipKey(), String(value));
      if (label) label.textContent = value.toFixed(2) + "%";
    }
    if (opener && pop) {
      opener.addEventListener("click", function () { pop.hidden = !pop.hidden; });
    }
    root.addEventListener("change", paintLabel);
    root.addEventListener("input", function (event) {
      if (event.target.matches("[data-slip-custom]")) paintLabel();
    });
    paintLabel();
  }

  window.PrivyraDesk = {
    tokens: tokens,
    find: find,
    locate: locate,
    statusLine: statusLine,
    openPicker: openPicker,
    balance: balance,
    fillSelect: fillSelect,
    readSlip: readSlip,
    mountSlip: mountSlip,
  };
})();
