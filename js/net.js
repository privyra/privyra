/* Small shared helpers. No network policy lives here — callers pass a URL. */
(function () {
  function isAddress(value) {
    return typeof value === "string" && /^0x[a-fA-F0-9]{40}$/.test(value);
  }

  function isHash(value) {
    return typeof value === "string" && /^0x[a-fA-F0-9]{64}$/.test(value);
  }

  function hexToNum(value) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "bigint") return Number(value);
    if (typeof value !== "string" || value === "") return NaN;
    return Number.parseInt(value, value.startsWith("0x") || value.startsWith("0X") ? 16 : 10);
  }

  function rpc(url, method, params, timeoutMs) {
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, timeoutMs || 8000);
    return fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: method, params: params || [] }),
      signal: ctrl.signal,
    }).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    }).then(function (body) {
      if (!body || body.error) {
        var msg = body && body.error && body.error.message ? body.error.message : "RPC error";
        throw new Error(msg);
      }
      return body.result;
    }).finally(function () {
      clearTimeout(timer);
    });
  }

  function formatUnits(hex, decimals, maxFrac) {
    var fracDigits = maxFrac == null ? 6 : maxFrac;
    var value;
    try {
      value = BigInt(hex || "0x0");
    } catch (err) {
      return "n/a";
    }
    if (value < 0n) value = -value;
    if (value === 0n) return "0";
    var scale = 10n ** BigInt(decimals);
    var whole = value / scale;
    var frac = value % scale;
    if (whole === 0n && fracDigits < decimals) {
      var min = 10n ** BigInt(decimals - fracDigits);
      if (frac < min) return "<" + (1 / Math.pow(10, fracDigits)).toFixed(fracDigits);
    }
    var fracStr = frac.toString().padStart(decimals, "0").slice(0, fracDigits).replace(/0+$/, "");
    var wholeStr = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return fracStr ? wholeStr + "." + fracStr : wholeStr;
  }

  function shortAddr(addr) {
    if (!isAddress(addr)) return "";
    return addr.slice(0, 6) + "…" + addr.slice(-4);
  }

  function h(tag, props, kids) {
    var node = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (key) {
        var val = props[key];
        if (val == null || val === false) return;
        if (key === "class") node.className = val;
        else if (key === "text") node.textContent = String(val);
        else if (key === "title") node.title = String(val);
        else node.setAttribute(key, String(val));
      });
    }
    (kids || []).forEach(function (kid) {
      if (kid == null || kid === false) return;
      node.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    });
    return node;
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function toast(message) {
    var region = document.getElementById("toast");
    if (!region) {
      region = h("div", { id: "toast", class: "toast", role: "status" });
      document.body.appendChild(region);
    }
    region.textContent = message;
    region.classList.add("is-on");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { region.classList.remove("is-on"); }, 1800);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { toast("Copied"); });
    }
    return new Promise(function (resolve, reject) {
      var area = h("textarea", { class: "visually-hidden" });
      area.value = text;
      document.body.appendChild(area);
      area.select();
      try {
        document.execCommand("copy");
        toast("Copied");
        resolve();
      } catch (err) {
        reject(err);
      } finally {
        area.remove();
      }
    });
  }

  function networkByKey(key) {
    return window.PRIVYRA_CONFIG.networks[key];
  }

  function networkByChainId(id) {
    var nets = window.PRIVYRA_CONFIG.networks;
    var found = null;
    Object.keys(nets).forEach(function (key) {
      if (nets[key].chainId === id) found = nets[key];
    });
    return found;
  }

  /* /pools, /pools.html, ./pools.html, and pools.html are the same page. Query and hash stay put. */
  function pagePath(value) {
    var path = String(value == null ? "" : value).trim();
    var cut = path.search(/[?#]/);
    if (cut !== -1) path = path.slice(0, cut);
    if (!path || /^[a-z][a-z0-9+.-]*:/i.test(path) || path.slice(0, 2) === "//") return "";
    if (path.slice(0, 2) === "./") path = path.slice(1);
    if (path.charAt(0) !== "/") path = "/" + path;
    path = path.replace(/\/+$/, "") || "/";
    path = path.replace(/\.html$/i, "") || "/";
    if (path === "/index") return "/";
    return path;
  }

  function pageId(value) {
    var path = pagePath(value);
    if (!path) return "";
    return path === "/" ? "home" : path.slice(1);
  }

  function cleanHref(value) {
    var raw = String(value == null ? "" : value).trim();
    var path = pagePath(raw);
    if (!path) return "";
    var cut = raw.search(/[?#]/);
    return path + (cut === -1 ? "" : raw.slice(cut));
  }

  window.PrivyraNet = {
    isAddress: isAddress,
    isHash: isHash,
    hexToNum: hexToNum,
    rpc: rpc,
    formatUnits: formatUnits,
    shortAddr: shortAddr,
    h: h,
    clear: clear,
    toast: toast,
    copyText: copyText,
    networkByKey: networkByKey,
    networkByChainId: networkByChainId,
    pagePath: pagePath,
    pageId: pageId,
    cleanHref: cleanHref,
  };
})();
