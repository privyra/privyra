/* Injected EIP-1193 wallets, plus EIP-6963 discovery (MetaMask, Rabby, and others). */
(function () {
  var net = window.PrivyraNet;
  var cfg = window.PRIVYRA_CONFIG;
  var STORE = "privyra.wallet";
  var state = {
    providers: [],
    selected: null,
    account: "",
    chainId: null,
    busy: false,
  };
  var bound = new WeakSet();

  function saved() {
    try { return JSON.parse(localStorage.getItem(STORE) || "null"); }
    catch (err) { return null; }
  }

  function remember() {
    if (!state.selected) return;
    localStorage.setItem(STORE, JSON.stringify({
      uuid: state.selected.info.uuid,
      name: state.selected.info.name || "",
    }));
  }

  function forget() {
    localStorage.removeItem(STORE);
  }

  function addProvider(detail) {
    if (!detail || !detail.provider || !detail.info) return;
    var uuid = detail.info.uuid || detail.info.rdns || detail.info.name;
    if (state.providers.some(function (item) { return item.info.uuid === uuid; })) return;
    if (state.providers.some(function (item) { return item.provider === detail.provider; })) return;
    state.providers.push({
      info: {
        uuid: uuid,
        name: detail.info.name || "Wallet",
        icon: detail.info.icon || "",
      },
      provider: detail.provider,
    });
  }

  window.addEventListener("eip6963:announceProvider", function (event) {
    addProvider(event.detail);
    var dialog = document.getElementById("wallet-dialog");
    if (dialog && dialog.open) renderDialog();
  });

  function requestAnnounce() {
    window.dispatchEvent(new Event("eip6963:requestProvider"));
  }

  function fallbackInjected() {
    var eth = window.ethereum;
    if (!eth) return;
    var list = Array.isArray(eth.providers) && eth.providers.length ? eth.providers : [eth];
    list.forEach(function (provider, index) {
      var name = "Browser wallet";
      if (provider.isRabby) name = "Rabby";
      else if (provider.isMetaMask) name = "MetaMask";
      else if (provider.isBraveWallet) name = "Brave Wallet";
      else if (provider.isCoinbaseWallet) name = "Coinbase Wallet";
      else if (provider.isOkxWallet || provider.isOkx) name = "OKX Wallet";
      addProvider({
        info: { uuid: "legacy-" + index + "-" + name, name: name, icon: "" },
        provider: provider,
      });
    });
  }

  function chainParams(network) {
    return {
      chainId: network.chainIdHex,
      chainName: network.name,
      nativeCurrency: network.nativeCurrency,
      rpcUrls: network.rpc.slice(),
      blockExplorerUrls: [network.explorer],
    };
  }

  function errorText(err) {
    if (!err) return "The wallet did not complete the request.";
    if (err.code === 4001) return "The request was cancelled in the wallet.";
    return err.message ? String(err.message) : "The wallet returned an error.";
  }

  async function switchTo(key) {
    var network = cfg.networks[key];
    var provider = state.selected && state.selected.provider;
    if (!provider || !network) return;
    var offer = document.getElementById("wallet-chain-offer");
    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: network.chainIdHex }],
      });
    } catch (err) {
      var missing = err && (err.code === 4902 || err.code === -32603);
      if (!missing) {
        if (offer) offer.textContent = errorText(err);
        return;
      }
      try {
        await provider.request({
          method: "wallet_addEthereumChain",
          params: [chainParams(network)],
        });
      } catch (addErr) {
        if (offer) offer.textContent = errorText(addErr);
        return;
      }
    }
    try {
      state.chainId = net.hexToNum(await provider.request({ method: "eth_chainId" }));
    } catch (err) { /* chainChanged will catch up */ }
    renderButton();
    renderPop();
    if (offer) offer.textContent = "Wallet is on " + network.name + ".";
    document.dispatchEvent(new CustomEvent("privyra:wallet"));
  }

  function bind(provider) {
    if (!provider || bound.has(provider) || typeof provider.on !== "function") return;
    bound.add(provider);
    provider.on("accountsChanged", function (accounts) {
      state.account = accounts && accounts[0] ? accounts[0] : "";
      if (!state.account) {
        state.selected = null;
        forget();
      }
      renderButton();
      renderPop();
      document.dispatchEvent(new CustomEvent("privyra:wallet"));
    });
    provider.on("chainChanged", function (id) {
      state.chainId = net.hexToNum(id);
      renderButton();
      renderPop();
      document.dispatchEvent(new CustomEvent("privyra:wallet"));
    });
    provider.on("disconnect", function () {
      state.account = "";
      state.selected = null;
      forget();
      renderButton();
      document.dispatchEvent(new CustomEvent("privyra:wallet"));
    });
  }

  async function useProvider(entry, interactive) {
    var provider = entry.provider;
    state.busy = true;
    renderButton();
    try {
      var accounts = await provider.request({
        method: interactive ? "eth_requestAccounts" : "eth_accounts",
      });
      if (!accounts || !accounts[0]) {
        if (!interactive) {
          forget();
          return false;
        }
        throw new Error("The wallet returned no account.");
      }
      state.selected = entry;
      state.account = accounts[0];
      state.chainId = net.hexToNum(await provider.request({ method: "eth_chainId" }));
      bind(provider);
      remember();
      renderButton();
      renderPop();
      document.dispatchEvent(new CustomEvent("privyra:wallet"));
      return true;
    } catch (err) {
      var offer = document.getElementById("wallet-chain-offer");
      if (offer && interactive) offer.textContent = errorText(err);
      return false;
    } finally {
      state.busy = false;
      renderButton();
    }
  }

  function ensureDialog() {
    if (document.getElementById("wallet-dialog")) return;
    var dialog = net.h("dialog", { id: "wallet-dialog", class: "modal", "aria-labelledby": "wallet-dialog-title" });
    dialog.append(
      net.h("div", { class: "spread" }, [
        net.h("h2", { id: "wallet-dialog-title", text: "Connect a wallet" }),
        net.h("button", { type: "button", class: "icon-x", "data-close": "1", text: "Close" }),
      ]),
      net.h("p", { id: "wallet-dialog-copy", class: "muted" }),
      net.h("div", { id: "wallet-providers", class: "provider-list" }),
      net.h("div", { id: "wallet-chain-offer", class: "help" })
    );
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog || event.target.closest("[data-close]")) dialog.close();
    });
    document.body.appendChild(dialog);
  }

  function safeIcon(src) {
    return typeof src === "string" && /^(data:image\/(?:png|svg\+xml|gif|jpeg|webp);base64,|https:\/\/)/.test(src);
  }

  function renderDialog() {
    ensureDialog();
    var copy = document.getElementById("wallet-dialog-copy");
    var list = document.getElementById("wallet-providers");
    var offer = document.getElementById("wallet-chain-offer");
    net.clear(list);
    offer.textContent = "";
    if (!state.providers.length) {
      copy.textContent = "No injected wallet was found. Install MetaMask, Rabby, or another EIP-1193 wallet, then reload this page.";
      return;
    }
    copy.textContent = "Privyra asks the wallet you already have. It never sees a seed phrase.";
    state.providers.forEach(function (entry) {
      var mark;
      if (safeIcon(entry.info.icon)) {
        mark = net.h("img", { src: entry.info.icon, alt: "" });
      } else {
        mark = net.h("span", { class: "avatar", "aria-hidden": "true", text: (entry.info.name || "?").slice(0, 1) });
      }
      var button = net.h("button", { type: "button", class: "provider" }, [
        mark,
        net.h("span", {}, [
          net.h("strong", { text: entry.info.name }),
          net.h("span", { class: "muted", text: " · EIP-1193" }),
        ]),
      ]);
      button.addEventListener("click", async function () {
        var ok = await useProvider(entry, true);
        if (!ok) return;
        var known = net.networkByChainId(state.chainId);
        if (state.chainId === cfg.networks.robinhood.chainId) {
          offer.textContent = "Connected on Robinhood Chain as " + net.shortAddr(state.account) + ".";
        } else {
          offer.textContent = "Connected as " + net.shortAddr(state.account) + " on " + (known ? known.name : ("chain " + state.chainId)) + ". The desk reads Robinhood Chain as chain 4663.";
          var row = net.h("div", { class: "actions" });
          var add = net.h("button", { type: "button", class: "btn btn-brass btn-small", text: "Add / switch to Robinhood Chain" });
          add.addEventListener("click", function () { switchTo("robinhood"); });
          row.appendChild(add);
          offer.appendChild(document.createTextNode(" "));
          offer.appendChild(row);
        }
      });
      list.appendChild(button);
    });
  }

  function renderButton() {
    document.querySelectorAll("[data-connect]").forEach(function (button) {
      button.classList.toggle("is-wrong", !!(state.account && state.chainId !== cfg.networks.robinhood.chainId));
      if (state.busy) {
        button.textContent = "Connecting…";
        return;
      }
      if (!state.account) {
        button.textContent = "Connect wallet";
        button.removeAttribute("aria-expanded");
        return;
      }
      button.textContent = net.shortAddr(state.account);
      var wrong = state.chainId !== cfg.networks.robinhood.chainId;
      button.setAttribute("aria-label", wrong
        ? "Wallet " + state.account + ", wrong network. Open the wallet menu to switch to Robinhood Chain."
        : "Wallet " + state.account + " on Robinhood Chain. Open the wallet menu.");
    });
  }

  function renderPop() {
    var pop = document.getElementById("wallet-pop");
    if (!pop) return;
    net.clear(pop);
    if (!state.account) {
      pop.hidden = true;
      return;
    }
    var known = net.networkByChainId(state.chainId);
    pop.appendChild(net.h("p", {
      class: "pop-note",
      text: (known ? known.name : ("Chain " + state.chainId)) + " · " + state.account,
    }));
    function item(label, fn) {
      var b = net.h("button", { type: "button", text: label });
      b.addEventListener("click", function () { fn(); });
      pop.appendChild(b);
    }
    item("Copy address", function () { net.copyText(state.account); });
    if (state.chainId !== cfg.networks.robinhood.chainId) {
      item("Add / switch to Robinhood Chain", function () { switchTo("robinhood"); });
    } else {
      item("Robinhood Chain is selected", function () {});
    }
    item("Add / switch to Elysium", function () { switchTo("elysium"); });
    item("Disconnect", async function () {
      var provider = state.selected && state.selected.provider;
      try {
        if (provider) {
          await provider.request({ method: "wallet_revokePermissions", params: [{ eth_accounts: {} }] });
        }
      } catch (err) { /* Many wallets do not implement revoke. Local session still ends. */ }
      state.account = "";
      state.selected = null;
      state.chainId = null;
      forget();
      pop.hidden = true;
      renderButton();
      document.dispatchEvent(new CustomEvent("privyra:wallet"));
      net.toast("Disconnected on this site");
    });
  }

  function openDialog() {
    requestAnnounce();
    setTimeout(function () {
      fallbackInjected();
      renderDialog();
      var dialog = document.getElementById("wallet-dialog");
      if (dialog && !dialog.open) dialog.showModal();
    }, 180);
  }

  function onConnectClick(event) {
    var pop = document.getElementById("wallet-pop");
    if (state.account && pop) {
      pop.hidden = !pop.hidden;
      event.currentTarget.setAttribute("aria-expanded", pop.hidden ? "false" : "true");
      return;
    }
    openDialog();
  }

  document.addEventListener("click", function (event) {
    var pop = document.getElementById("wallet-pop");
    if (!pop || pop.hidden) return;
    if (event.target.closest("#wallet-pop") || event.target.closest("[data-connect]")) return;
    pop.hidden = true;
  });
  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    var pop = document.getElementById("wallet-pop");
    if (pop) pop.hidden = true;
  });

  async function restore() {
    requestAnnounce();
    await new Promise(function (resolve) { setTimeout(resolve, 250); });
    fallbackInjected();
    var memory = saved();
    if (!memory) return;
    var entry = state.providers.find(function (item) { return item.info.uuid === memory.uuid; }) || state.providers[0];
    if (!entry) return;
    await useProvider(entry, false);
  }

  function init() {
    document.querySelectorAll("[data-connect]").forEach(function (button) {
      button.addEventListener("click", onConnectClick);
    });
    renderButton();
    restore();
  }

  window.PrivyraWallet = {
    get state() { return { account: state.account, chainId: state.chainId }; },
    switchTo: switchTo,
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
