(function () {
  var list = document.getElementById("unset-list");
  if (!list) return;
  var cfg = window.PRIVYRA_CONFIG;
  var net = window.PrivyraNet;

  function walk(value, prefix, out) {
    if (Array.isArray(value)) {
      value.forEach(function (item, index) {
        walk(item, prefix + "[" + index + "]", out);
      });
      return;
    }
    if (value && typeof value === "object") {
      Object.keys(value).forEach(function (key) {
        walk(value[key], prefix ? prefix + "." + key : key, out);
      });
      return;
    }
    if (value === "") out.push(prefix);
  }

  var empty = [];
  walk(cfg, "", empty);
  empty.forEach(function (path) {
    list.appendChild(net.h("li", {}, [
      net.h("span", { text: path }),
      net.h("span", { text: "empty" }),
    ]));
  });
  var github = document.getElementById("github-placeholder");
  if (github) {
    github.textContent = cfg.social.githubIsPlaceholder
      ? "social.github is the placeholder " + cfg.social.github + ". Replace it when the account exists."
      : "social.github is " + cfg.social.github + ".";
  }

  document.querySelectorAll("[data-contract]").forEach(function (cell) {
    var key = cell.dataset.contract;
    var chain = cell.dataset.chain || "robinhood";
    var value = cfg.contracts[key];
    net.clear(cell);
    if (!net.isAddress(value)) {
      cell.textContent = "Unset";
      return;
    }
    var network = cfg.networks[chain];
    cell.appendChild(net.h("a", {
      href: network.explorer + "/address/" + value,
      target: "_blank",
      rel: "noopener noreferrer",
      text: value,
    }));
  });
})();
