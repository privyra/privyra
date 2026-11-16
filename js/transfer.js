(function () {
  var form = document.getElementById("transfer-form");
  if (!form) return;
  var net = window.PrivyraNet;
  var desk = window.PrivyraDesk;
  var cfg = window.PRIVYRA_CONFIG;
  var token = form.querySelector("#transfer-token");
  var shore = form.querySelector("#transfer-shore");

  function paint() {
    var opener = form.querySelector('[data-token-open="send"]');
    opener.textContent = token.value;
    opener.setAttribute("aria-label", "Asset, " + token.value);
    var who = form.querySelector("#transfer-to").value.trim();
    var amount = form.querySelector("#transfer-amount").value.trim();
    var whoNode = document.getElementById("preview-who");
    var amountNode = document.getElementById("preview-amount");
    var sealNode = document.getElementById("preview-seal");
    var whoOk = net.isAddress(who);
    whoNode.textContent = who === "" ? "—" : whoOk ? who : "Not a 20-byte address";
    whoNode.classList.toggle("invalid", who !== "" && !whoOk);
    amountNode.textContent = amount || "—";
    var announcer = cfg.contracts.sealAnnouncer;
    var registry = cfg.contracts.sealRegistry;
    if (!net.isAddress(announcer) || !net.isAddress(registry)) {
      sealNode.textContent = "Unavailable — announcer and registry are unset, so a seal is not derived.";
    } else {
      sealNode.textContent = "Contracts are set. Derivation is not wired on this page, so no seal is shown.";
    }
    var button = document.getElementById("transfer-submit");
    button.disabled = true;
    button.textContent = "Announcer not deployed";
    var slot = document.getElementById("transfer-balance");
    desk.balance(shore.value, token.value, window.PrivyraWallet.state.account).then(function (result) {
      if (result.state === "ok") slot.textContent = "Balance " + result.text + " " + result.symbol;
      else if (result.state === "unset") slot.textContent = desk.statusLine(desk.find(token.value), shore.value);
      else if (result.state === "error") slot.textContent = "Balance n/a";
      else slot.textContent = "Connect a wallet to read a balance";
    });
  }

  desk.fillSelect(token);
  token.value = "ETH";
  form.querySelector('[data-token-open="send"]').addEventListener("click", function () {
    desk.openPicker(function (symbol) { token.value = symbol; paint(); });
  });
  form.addEventListener("input", paint);
  form.addEventListener("change", paint);
  form.addEventListener("submit", function (event) { event.preventDefault(); });
  document.addEventListener("privyra:wallet", paint);
  paint();
})();
