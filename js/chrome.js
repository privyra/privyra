/* Header, footer, contract-address chip, mobile menu. */
(function () {
  var cfg = window.PRIVYRA_CONFIG;
  var net = window.PrivyraNet;

  var NAV_PAGES = { home: 1, swap: 1, pools: 1, markets: 1, bridge: 1, transfer: 1, agents: 1, token: 1, agent: 1, docs: 1 };

  function initNav() {
    var fromPath = net.pageId(location.pathname);
    var page = NAV_PAGES[fromPath] ? fromPath : (document.body.dataset.page || "");
    document.querySelectorAll("[data-page-link]").forEach(function (link) {
      var id = link.dataset.pageLink;
      var linkId = net.pageId(link.getAttribute("href") || "");
      if (id === page || (linkId && linkId === page)) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    var burger = document.querySelector(".burger");
    var drawer = document.getElementById("drawer");
    if (!burger || !drawer) return;
    function close() {
      drawer.hidden = true;
      burger.setAttribute("aria-expanded", "false");
      document.body.classList.remove("nav-open");
    }
    burger.addEventListener("click", function () {
      var open = burger.getAttribute("aria-expanded") === "true";
      if (open) close();
      else {
        drawer.hidden = false;
        burger.setAttribute("aria-expanded", "true");
        document.body.classList.add("nav-open");
        var first = drawer.querySelector("a");
        if (first) first.focus();
      }
    });
    drawer.addEventListener("click", function (event) {
      if (event.target.closest("a")) close();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") close();
    });
  }

  function initSocial() {
    document.querySelectorAll(".github-link").forEach(function (link) {
      link.href = cfg.social.github;
    });
    document.querySelectorAll(".x-link").forEach(function (link) {
      link.href = cfg.social.x;
    });
    document.querySelectorAll("[data-year]").forEach(function (node) {
      node.textContent = String(new Date().getFullYear());
    });
  }

  function tokenAddress() {
    return net.isAddress(cfg.token.address) ? cfg.token.address : "";
  }

  function initCa() {
    var address = tokenAddress();
    document.querySelectorAll("[data-ca]").forEach(function (wrap) {
      var code = wrap.querySelector("[data-ca-value]");
      var button = wrap.querySelector("[data-ca-copy]");
      if (code) code.textContent = address ? address : "CA: coming soon";
      if (!button) return;
      if (!address) {
        button.disabled = true;
        button.textContent = "Copy";
        button.title = "The copy button turns on when token.address is set in js/config.js.";
        return;
      }
      button.disabled = false;
      button.title = "Copy the contract address";
      button.addEventListener("click", function () {
        net.copyText(address).then(function () {
          button.textContent = "Copied";
          setTimeout(function () { button.textContent = "Copy"; }, 1400);
        }).catch(function () {
          net.toast("Could not copy");
        });
      });
    });
  }

  function renderTiers(table) {
    var body = table.querySelector("tbody");
    if (!body) return;
    net.clear(body);
    cfg.tiers.forEach(function (tier) {
      var hold = tier.hold === 0 ? "None" : tier.hold.toLocaleString("en-US") + " $PRIVYRA";
      var actions = tier.actions == null ? "Unmetered" : String(tier.actions);
      body.appendChild(net.h("tr", {}, [
        net.h("th", { scope: "row", text: tier.name }),
        net.h("td", { text: hold }),
        net.h("td", { text: actions }),
        net.h("td", { text: tier.note }),
      ]));
    });
  }

  function initTiers() {
    document.querySelectorAll("[data-tiers]").forEach(renderTiers);
  }

  function init() {
    initNav();
    initSocial();
    initCa();
    initTiers();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
