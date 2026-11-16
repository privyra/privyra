/* Privyra AI. Local clerk by default. Optional endpoint, never a key. */
(function () {
  var cfg = window.PRIVYRA_CONFIG;
  var net = window.PrivyraNet;
  var STORE = "privyra.ai.thread";
  var ENGLISH = { now: 1, cost: 1, all: 1, for: 1, are: 1, it: 1, on: 1, be: 1, or: 1, an: 1, open: 1, low: 1, high: 1, key: 1, cat: 1 };

  var PAGES = [
    { id: "home", title: "Home", href: "/", keys: ["home", "start", "front"] },
    { id: "swap", title: "the quiet swap", href: "/swap", keys: ["quiet swap", "swap", "trade"] },
    { id: "pools", title: "Pools", href: "/pools", keys: ["liquidity", "pools", "pool"] },
    { id: "markets", title: "Markets", href: "/markets", keys: ["markets", "market", "stocks", "catalogue", "catalog"] },
    { id: "bridge", title: "the ferry", href: "/bridge", keys: ["bridge", "ferry", "crossing"] },
    { id: "transfer", title: "ink transfer", href: "/transfer", keys: ["private transfer", "ink transfer", "transfer", "send", "ink"] },
    { id: "agents", title: "the night clerks", href: "/agents", keys: ["night clerks", "night clerk", "clerks", "clerk", "agents"] },
    { id: "agent", title: "Privyra AI", href: "/agent", keys: ["privyra ai", "assistant", "chat", "ai page", "ai"] },
    { id: "token", title: "the $PRIVYRA page", href: "/token", keys: ["token page", "$privyra", "privyra token", "contract address", "token"] },
    { id: "docs", title: "the house rules", href: "/docs", keys: ["house rules", "docs", "documentation", "rules"] },
  ];

  var SUGGESTIONS = ["How do I swap?", "Open the ferry", "AAPL close", "Wax tiers"];

  function loadThread() {
    try {
      var parsed = JSON.parse(sessionStorage.getItem(STORE) || "[]");
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(function (item) {
        return item && (item.role === "user" || item.role === "assistant") && typeof item.content === "string";
      }).slice(-30);
    } catch (err) {
      return [];
    }
  }

  function saveThread(thread) {
    try { sessionStorage.setItem(STORE, JSON.stringify(thread.slice(-30))); }
    catch (err) { /* private mode can refuse storage; the reply still shows */ }
  }

  function endpointUrl() {
    var raw = typeof cfg.aiEndpoint === "string" ? cfg.aiEndpoint.trim() : "";
    if (!raw) return { url: "", state: "off" };
    if (raw.charAt(0) === "/" && raw.indexOf("//") !== 0 && raw.indexOf("?") === -1) return { url: raw, state: "on" };
    try {
      var url = new URL(raw);
      var local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
      if (url.username || url.password || /[?&](key|token|api_key|apikey)=/i.test(url.search)) {
        return { url: "", state: "rejected" };
      }
      if (url.protocol === "https:") return { url: url.toString(), state: "on" };
      if (url.protocol === "http:" && local) return { url: url.toString(), state: "on" };
    } catch (err) { /* fall through */ }
    return { url: "", state: "rejected" };
  }

  function money(value) {
    return value.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function snapshot() {
    if (!snapshot.promise) {
      snapshot.promise = fetch(cfg.markets.snapshotUrl).then(function (res) {
        if (!res.ok) throw new Error("snapshot");
        return res.json();
      }).catch(function () { return null; });
    }
    return snapshot.promise;
  }

  function catalogue() {
    if (window.PRIVYRA_CATALOGUE) return Promise.resolve(window.PRIVYRA_CATALOGUE);
    return new Promise(function (resolve) {
      var script = document.createElement("script");
      script.src = "/js/catalogue.js";
      script.onload = function () { resolve(window.PRIVYRA_CATALOGUE || []); };
      script.onerror = function () { resolve([]); };
      document.head.appendChild(script);
    });
  }

  function matchPage(phrase) {
    var text = " " + phrase.toLowerCase().replace(/[^a-z0-9$\s]/g, " ").replace(/\s+/g, " ").trim() + " ";
    var best = null;
    var bestLen = 0;
    PAGES.forEach(function (page) {
      page.keys.forEach(function (key) {
        var needle = " " + key + " ";
        if (text.indexOf(needle) !== -1 && key.length > bestLen) {
          best = page;
          bestLen = key.length;
        }
      });
    });
    return best;
  }

  function canonicalHref(href) {
    var id = net.pageId(href);
    if (!id) return "";
    var match = null;
    PAGES.forEach(function (page) {
      if (page.id === id) match = page;
    });
    if (!match) return "";
    var raw = String(href);
    var cut = raw.search(/[?#]/);
    return match.href + (cut === -1 ? "" : raw.slice(cut));
  }

  function navigation(lower) {
    var match = lower.match(/^(?:please\s+)?(?:open|go to|goto|take me to|navigate to|visit|launch|show(?:\s+me)?)\s+(?:the\s+|a\s+)?(.+?)\s*[.!?]?$/);
    if (!match) return null;
    var rest = match[1].replace(/\bpage\b/g, " ").replace(/\s+/g, " ").trim();
    if (/\b(how|what|why|when|close|price)\b/.test(rest)) return null;
    return matchPage(rest);
  }

  function wantsPrice(lower) {
    return /\b(price|prices|close|closes|quote|quotes|worth|trading at|trading)\b/.test(lower);
  }

  function findMention(lower, list) {
    var best = null;
    var score = 0;
    list.forEach(function (item) {
      var name = item.name.toLowerCase();
      if (name.length >= 4 && lower.indexOf(name) !== -1 && name.length > score) {
        best = item;
        score = name.length;
      }
      var sym = item.symbol.toLowerCase();
      var word = new RegExp("\\b" + sym.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i");
      if (!word.test(lower)) return;
      var isolated = lower.replace(/[?.!,]/g, "").trim() === sym;
      var priced = new RegExp("(?:price|close|quote|worth)\\s+(?:of\\s+)?" + sym + "\\b", "i").test(lower)
        || new RegExp("\\b" + sym + "\\s+(?:price|close|quote)\\b", "i").test(lower);
      if (ENGLISH[sym] && !isolated && !priced) return;
      if (sym.length < 3 && !isolated && !priced) return;
      var symScore = sym.length + (priced || isolated ? 12 : 6);
      if (symScore > score) {
        best = item;
        score = symScore;
      }
    });
    return best;
  }

  function priceReply(item, book) {
    var quote = book && book.quotes ? book.quotes[item.symbol] : null;
    if (!quote || typeof quote.close !== "number") {
      return item.symbol + ", " + item.name + ", is on the catalogue. The desk has no close for it in the public feed, so I will not invent one.";
    }
    var line = item.symbol + ", " + item.name + ". The desk's end-of-day close is " + money(quote.close) + " for the session of " + quote.date + ".";
    if (typeof quote.prevClose === "number" && quote.prevClose) {
      var pct = ((quote.close - quote.prevClose) / quote.prevClose) * 100;
      var sign = pct > 0 ? "+" : pct < 0 ? "−" : "";
      line += " Prior session " + money(quote.prevClose) + " (" + sign + Math.abs(pct).toFixed(2) + "%).";
    }
    line += " Same feed as the markets page: Fin-node, labeled end-of-day. Not a live tape.";
    return line;
  }

  function tiersReply() {
    var lines = cfg.tiers.map(function (tier) {
      var hold = tier.hold === 0 ? "no $PRIVYRA required" : tier.hold.toLocaleString("en-US") + " $PRIVYRA";
      var actions = tier.actions == null ? "unmetered" : tier.actions + " sealed actions a day";
      return tier.name + " — " + hold + ", " + actions + ". " + tier.note;
    });
    return "The wax tiers are house rules, not a meter. The allowance contract is unset, so a connected wallet is not graded yet.\n\n" + lines.join("\n");
  }

  function tokenReply() {
    var address = net.isAddress(cfg.token.address) ? cfg.token.address : "coming soon";
    var supply = Number(cfg.token.intendedSupply);
    var supplyText = Number.isFinite(supply) ? supply.toLocaleString("en-US") : cfg.token.intendedSupply;
    return "$PRIVYRA is the key to the desk, not a claim on the assets you move. This desk does not quote a price for it. Contract address: " + address + ". Intended supply, as a design note only: " + supplyText + ". Intended chain: Robinhood Chain, 4663. Say “open the token page” if you want the full table.";
  }

  function faq(lower) {
    if (/\b(tier|tiers|wax|allowance)\b/.test(lower)) return tiersReply();
    if (/\b(swap|swapping)\b/.test(lower)) {
      return "A quiet swap is a trade whose sender is meant to be a one-time seal, so the pool learns a fresh address instead of the wallet you use everywhere else. The swap page lets you pick two tokens, type an amount, flip them, and set slippage (saved on this device). It will not ask you to sign, and it will not print a rate, until the router and the quoter are real addresses in the config. A connected wallet can still read an ETH or HYPE balance from the public RPC. Say “open swap” and I will take you there.";
    }
    if (/\b(bridge|ferry|crossing|cross)\b/.test(lower)) {
      return "The ferry is the crossing between Robinhood Chain and Elysium. Robinhood Chain is chain 4663 and burns ETH. Elysium is chain 99901 and burns HYPE. You choose a direction, an amount, a recipient, and whether the arrival should be a one-time seal. The ferry contracts are unset, so the form does not broadcast. The receipt box does work: paste a real transaction hash and it asks the public RPC. Say “open the ferry” and I will take you there.";
    }
    if (/\b(transfer|seal|private|ink)\b/.test(lower) && !/\bprivyra ai\b/.test(lower)) {
      return "An ink transfer pays a one-time seal instead of a permanent address. You name the recipient wallet and an amount. The chain would see the seal, not your everyday address. This page does not derive one, because the announcer and the registry are unset. A made-up address would look like somewhere to send funds. Say “open transfer” and I will take you there.";
    }
    if (/\b(\$privyra|token|contract|ca\b|coming soon)\b/.test(lower)) return tokenReply();
    if (/\b(wallet|metamask|rabby|connect)\b/.test(lower)) {
      return "Connect wallet uses the wallet already in your browser: MetaMask, Rabby, or any other EIP-1193 injection, including EIP-6963 when the browser announces it. If you are not on Robinhood Chain, the dialog offers to add or switch to chain 4663, with the public RPC and Blockscout. Elysium can be added from the wallet menu. The site never asks for a seed phrase.";
    }
    if (/\b(pool|pools|liquidity|tvl|apr)\b/.test(lower)) {
      return "Pools will list a pair, its fee tier, TVL, 24 hour volume, and APR, and the page already has the add-liquidity form. Those figures stay blank until contracts.poolFactory is an address. No stand-in TVL is shown. Say “open pools” and I will take you there.";
    }
    if (/\b(market|markets|stock|stocks|live tape|end-of-day|eod)\b/.test(lower)) {
      return "Markets is a catalogue of equities and a few funds. A close is shown only when the Fin-node end-of-day bundle has one, and the row is marked EOD with the session date. Names without a bundle stay blank, including HOOD. It is not a live tape. Ask me for a ticker, for example “NVDA close”.";
    }
    if (/\b(clerk|clerks|agent)\b/.test(lower) && !/\bai\b/.test(lower)) {
      return "Night clerks are the readers on the Agents page. The ledger clerk reads the Robinhood Chain head while the tab is open. The tape clerk shows the same end-of-day closes. The spread clerk stores a threshold and waits, because comparing it to a close would pretend the close is live. They are not this chat. Say “open the night clerks” and I will take you there.";
    }
    if (/\b(elysium|robinhood chain|chain id|network|hype|gas)\b/.test(lower)) {
      return "Robinhood Chain is chain 4663, gas in ETH, public RPC rpc.mainnet.chain.robinhood.com, explorer robinhoodchain.blockscout.com. Elysium is chain 99901, gas in HYPE, public RPC rpc.elysium.kinetiq.xyz, and it settles to HyperEVM (chain 999). Both ids were read back from those RPCs. The strip on every page is the Robinhood Chain head; if the RPC does not answer, it says n/a.";
    }
    if (/\b(help|what can you do|who are you|what are you)\b/.test(lower)) {
      return "I am Privyra AI, the clerk in this page. I can explain a swap, the ferry, an ink transfer, the wax tiers, and $PRIVYRA. I can read the same end-of-day closes as Markets, and the ether spot the strip uses. Say “open swap” (or ferry, pools, markets, transfer, agents, token, docs) and I will open that page. I do not invent a figure the desk does not have.";
    }
    if (/\b(what is privyra|what's privyra|about privyra|this desk|this site)\b/.test(lower)) {
      return "Privyra is a private desk between Robinhood Chain and Elysium. The tape stays public. The book does not. You connect a wallet you already own and you sign every move. The desk does not hold the coin and does not see a seed.";
    }
    return "";
  }

  async function localAnswer(text) {
    var lower = text.toLowerCase().replace(/\s+/g, " ").trim();
    var page = navigation(lower);
    if (page) {
      var here = (document.body.dataset.page || "") === page.id || net.pageId(location.pathname) === page.id;
      if (here) return { reply: "You are already on " + page.title + ".", handled: true };
      return { reply: "Opening " + page.title + ".", href: page.href, handled: true };
    }
    if (/\b(\$privyra|privyra token)\b/.test(lower) && wantsPrice(lower)) {
      return { reply: tokenReply(), handled: true };
    }
    if (/\b(ether|ethereum)\b/.test(lower) && (wantsPrice(lower) || /^(ether|ethereum|eth)$/.test(lower.replace(/[?.!]/g, "").trim()))) {
      try {
        var res = await fetch(cfg.markets.ethPriceUrl);
        if (!res.ok) throw new Error("eth");
        var body = await res.json();
        var usd = body && body.ethereum && body.ethereum.usd;
        if (typeof usd !== "number") throw new Error("shape");
        return { reply: "Ether, from CoinGecko, the same spot the network strip uses, is " + money(usd) + ". It is not a Robinhood Chain oracle. If that request had failed I would have said n/a rather than guess.", handled: true };
      } catch (err) {
        return { reply: "I could not read the CoinGecko ether spot just now. I will not guess a price. The strip shows n/a in the same case.", handled: true };
      }
    }
    if (/\bhype\b/.test(lower) && wantsPrice(lower)) {
      return { reply: "HYPE is the gas coin on Elysium. This desk does not have a price feed for it, so I will not quote one.", handled: true };
    }
    var list = await catalogue();
    if (!list.length) {
      var bookOnly = await snapshot();
      if (bookOnly && bookOnly.quotes) {
        list = Object.keys(bookOnly.quotes).map(function (sym) {
          return { symbol: sym, name: sym, sector: "" };
        });
      }
    }
    var bare = lower.replace(/[?.!,]/g, "").trim();
    var mentioned = null;
    if (wantsPrice(lower) || list.some(function (item) { return bare === item.symbol.toLowerCase() || bare === item.name.toLowerCase(); })) {
      mentioned = findMention(lower, list) || list.find(function (item) {
        return bare === item.symbol.toLowerCase() || bare === item.name.toLowerCase();
      });
    }
    if (mentioned) {
      var book = await snapshot();
      if (!book) return { reply: "The end-of-day snapshot did not load, so I have no close to read. I will not fill one in.", handled: true };
      return { reply: priceReply(mentioned, book), handled: true };
    }
    if (wantsPrice(lower)) {
      return { reply: "Name a ticker or a company in the catalogue, for example AAPL or NVIDIA. I read the same end-of-day snapshot as the markets page, and I leave a blank where that feed has no close.", handled: true };
    }
    var known = faq(lower);
    if (known) return { reply: known, handled: false };
    return {
      reply: "I can open a page (try “open swap”), read an end-of-day close (try “NVDA”), or explain the swap, the ferry, an ink transfer, the wax tiers, and $PRIVYRA. I do not invent a number the desk does not have.",
      handled: false,
    };
  }

  async function answer(text, prior) {
    var local = await localAnswer(text);
    if (local.handled) return local;
    var gate = endpointUrl();
    if (gate.state !== "on") return local;
    var messages = prior.concat([{ role: "user", content: text.slice(0, 2000) }]).slice(-12).map(function (item) {
      return { role: item.role, content: String(item.content).slice(0, 2000) };
    });
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, 12000);
    try {
      var res = await fetch(gate.url, {
        method: "POST",
        headers: { "content-type": "application/json", "accept": "application/json" },
        body: JSON.stringify({ messages: messages, page: document.body.dataset.page || "" }),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      var body = await res.json();
      var reply = body && (typeof body.reply === "string" ? body.reply : typeof body.message === "string" ? body.message : "");
      if (!reply.trim()) throw new Error("empty");
      var out = { reply: reply.trim(), source: "endpoint" };
      if (body && typeof body.href === "string") {
        var next = canonicalHref(body.href);
        if (next) out.href = next;
      }
      return out;
    } catch (err) {
      return { reply: "The assistant endpoint did not answer. This reply is from the desk in the page.\n\n" + local.reply, href: local.href };
    } finally {
      clearTimeout(timer);
    }
  }

  function noteText() {
    var gate = endpointUrl();
    if (gate.state === "on") {
      return "A custom endpoint is set. Prices and “open this page” still come from the desk, so a model cannot invent a close. This page sends no API key.";
    }
    if (gate.state === "rejected") {
      return "The endpoint in config was ignored. Use an https URL or a path on this site, with no key in the value. Until then, this clerk answers on its own.";
    }
    return "This clerk runs in the page. It reads the desk’s own closes and pages. No model key is stored here.";
  }

  function bubble(role, text) {
    return net.h("div", { class: "ai-bubble " + role, text: text });
  }

  function sealIcon() {
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 32 32");
    svg.setAttribute("aria-hidden", "true");
    function part(name, attrs) {
      var node = document.createElementNS(ns, name);
      Object.keys(attrs).forEach(function (key) { node.setAttribute(key, attrs[key]); });
      svg.appendChild(node);
    }
    part("circle", { cx: "16", cy: "16", r: "11", fill: "none", stroke: "#24180f", "stroke-width": "1.4" });
    part("path", { d: "M16 7.5v17", stroke: "#e25b45", "stroke-width": "1.6", "stroke-linecap": "round" });
    part("circle", { cx: "16", cy: "16", r: "2.1", fill: "#24180f" });
    return svg;
  }

  function mount(host, embedded) {
    var thread = loadThread();
    var panel = net.h("section", {
      class: "ai-panel" + (embedded ? " ai-embedded" : ""),
      id: embedded ? "ai-panel" : "ai-panel",
      role: embedded ? "region" : "dialog",
      "aria-labelledby": "ai-title",
    });
    if (!embedded) panel.hidden = true;
    var log = net.h("div", { class: "ai-log", role: "log", "aria-live": "polite", "aria-relevant": "additions" });
    var suggestions = net.h("div", { class: "ai-suggestions" });
    var input = net.h("input", {
      type: "text",
      maxlength: "500",
      placeholder: "Ask about a swap, a close, a tier…",
      "aria-label": "Message Privyra AI",
      autocomplete: "off",
    });
    var send = net.h("button", { type: "submit", class: "btn btn-brass btn-small", text: "Send" });
    var form = net.h("form", { class: "ai-form" }, [input, send]);
    var closer = net.h("button", { type: "button", class: "icon-x", text: "Close", "aria-label": "Close Privyra AI" });

    function paint() {
      net.clear(log);
      if (!thread.length) {
        log.appendChild(bubble("assistant", "I am Privyra AI. Ask how a swap, a ferry crossing, or an ink transfer works, ask for a close such as AAPL, or tell me to open a page."));
      }
      thread.forEach(function (item) {
        log.appendChild(bubble(item.role, item.content));
      });
      if (log.lastElementChild) log.lastElementChild.classList.add("is-fresh");
      log.scrollTop = log.scrollHeight;
    }

    async function ask(text) {
      var clean = text.trim();
      if (!clean || send.disabled) return;
      thread.push({ role: "user", content: clean });
      saveThread(thread);
      paint();
      input.value = "";
      send.disabled = true;
      var pending = bubble("assistant", "Reading the book…");
      log.appendChild(pending);
      log.scrollTop = log.scrollHeight;
      try {
        var prior = thread.slice(0, -1);
        var result = await answer(clean, prior);
        thread.push({ role: "assistant", content: result.reply });
        saveThread(thread);
        paint();
        if (result.href) {
          window.setTimeout(function () { window.location.assign(result.href); }, 650);
        }
      } catch (err) {
        thread.push({ role: "assistant", content: "I lost the thread on that one. Ask again." });
        saveThread(thread);
        paint();
      } finally {
        send.disabled = false;
        input.focus();
      }
    }

    SUGGESTIONS.forEach(function (label) {
      var button = net.h("button", { type: "button", text: label });
      button.addEventListener("click", function () { ask(label); });
      suggestions.appendChild(button);
    });

    panel.append(
      net.h("div", { class: "ai-head" }, [
        net.h("h2", { id: "ai-title", text: "Privyra AI" }),
        embedded ? net.h("span", { class: "pill", text: "In the page" }) : closer,
      ]),
      net.h("p", { class: "ai-note", text: noteText() }),
      log,
      suggestions,
      form
    );
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      ask(input.value);
    });
    paint();
    return { panel: panel, input: input, closer: closer };
  }

  function init() {
    var embeddedHost = document.getElementById("agent-mount");
    if (embeddedHost) {
      var embedded = mount(embeddedHost, true);
      embeddedHost.appendChild(embedded.panel);
      return;
    }
    var dock = net.h("div", { class: "ai-dock" });
    var launcher = net.h("button", { type: "button", class: "ai-launcher", "aria-expanded": "false", "aria-controls": "ai-panel" });
    launcher.append(sealIcon(), net.h("span", { text: "Privyra AI" }));
    var ui = mount(dock, false);
    function setOpen(open) {
      ui.panel.hidden = !open;
      launcher.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) ui.input.focus();
    }
    launcher.addEventListener("click", function () { setOpen(ui.panel.hidden); });
    ui.closer.addEventListener("click", function () { setOpen(false); launcher.focus(); });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !ui.panel.hidden) {
        setOpen(false);
        launcher.focus();
      }
    });
    document.addEventListener("click", function (event) {
      if (ui.panel.hidden) return;
      if (event.target.closest(".ai-dock")) return;
      setOpen(false);
    });
    dock.append(ui.panel, launcher);
    document.body.appendChild(dock);
  }

  window.PrivyraAI = { answer: answer };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
