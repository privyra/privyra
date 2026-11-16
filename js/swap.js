(function () {
  var root = document.getElementById("swap-form");
  if (!root) return;
  var net = window.PrivyraNet;
  var desk = window.PrivyraDesk;
  var cfg = window.PRIVYRA_CONFIG;

  var paySel = root.querySelector("#pay-token");
  var recvSel = root.querySelector("#recv-token");
  var payBtn = root.querySelector('[data-token-open="pay"]');
  var recvBtn = root.querySelector('[data-token-open="recv"]');
  var shore = root.querySelector("#swap-shore");

  function label(button, symbol, which) {
    button.textContent = symbol;
    button.setAttribute("aria-label", (which === "pay" ? "Token you pay, " : "Token you receive, ") + symbol);
  }

  function syncButtons() {
    label(payBtn, paySel.value, "pay");
    label(recvBtn, recvSel.value, "recv");
    var route = root.querySelector('[data-quote="route"]');
    var rate = root.querySelector('[data-quote="rate"]');
    var min = root.querySelector('[data-quote="min"]');
    var impact = root.querySelector('[data-quote="impact"]');
    var fee = root.querySelector('[data-quote="fee"]');
    var router = cfg.contracts.swapRouter;
    var quoter = cfg.contracts.quoter;
    if (!net.isAddress(router)) {
      route.textContent = "Router unset";
      rate.textContent = "No pool";
    } else if (!net.isAddress(quoter)) {
      route.textContent = "Router is set. Quoter is not.";
      rate.textContent = "No quote method wired";
    } else {
      route.textContent = "Quoter address is set. The call is not wired, so no price is shown.";
      rate.textContent = "—";
    }
    min.textContent = "—";
    impact.textContent = "—";
    fee.textContent = "—";
    var banner = document.getElementById("swap-banner");
    if (banner) {
      banner.textContent = net.isAddress(router)
        ? "A router address is configured, and this page still will not send a transaction until a quote call is wired."
        : "Router not deployed. You can fill the ticket. Nothing is signed.";
    }
  }

  async function paintBalance(which) {
    var sel = which === "pay" ? paySel : recvSel;
    var slot = root.querySelector('[data-balance="' + which + '"]');
    var account = window.PrivyraWallet.state.account;
    var result = await desk.balance(shore.value, sel.value, account);
    if (!slot) return;
    if (result.state === "nowallet") slot.textContent = "Connect a wallet to read a balance";
    else if (result.state === "unset") slot.textContent = desk.statusLine(desk.find(sel.value), shore.value);
    else if (result.state === "error") slot.textContent = "Balance n/a";
    else slot.textContent = "Balance " + result.text + " " + result.symbol;
  }

  function refresh() {
    syncButtons();
    paintBalance("pay");
    paintBalance("recv");
  }

  desk.fillSelect(paySel);
  desk.fillSelect(recvSel);
  paySel.value = "ETH";
  recvSel.value = "USDC";
  desk.mountSlip(root);

  payBtn.addEventListener("click", function () {
    desk.openPicker(function (symbol) {
      paySel.value = symbol;
      refresh();
    });
  });
  recvBtn.addEventListener("click", function () {
    desk.openPicker(function (symbol) {
      recvSel.value = symbol;
      refresh();
    });
  });
  root.querySelector("[data-flip]").addEventListener("click", function () {
    var symbol = paySel.value;
    var amount = root.querySelector('[data-amount="pay"]').value;
    paySel.value = recvSel.value;
    recvSel.value = symbol;
    root.querySelector('[data-amount="pay"]').value = root.querySelector('[data-amount="recv"]').value;
    root.querySelector('[data-amount="recv"]').value = amount;
    refresh();
  });
  root.querySelectorAll("[data-max]").forEach(function (button) {
    button.addEventListener("click", async function () {
      var which = button.dataset.max;
      var sel = which === "pay" ? paySel : recvSel;
      var account = window.PrivyraWallet.state.account;
      var result = await desk.balance(shore.value, sel.value, account);
      var input = root.querySelector('[data-amount="' + which + '"]');
      if (result.state !== "ok") {
        net.toast("No balance to copy in");
        return;
      }
      input.value = result.input || "";
    });
  });
  shore.addEventListener("change", refresh);
  paySel.addEventListener("change", refresh);
  recvSel.addEventListener("change", refresh);
  root.addEventListener("submit", function (event) {
    event.preventDefault();
  });
  document.addEventListener("privyra:wallet", refresh);
  refresh();
})();
