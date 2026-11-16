(function () {
  var root = document.getElementById("pool-form");
  if (!root) return;
  var net = window.PrivyraNet;
  var desk = window.PrivyraDesk;
  var cfg = window.PRIVYRA_CONFIG;
  var a = root.querySelector("#pool-a");
  var b = root.querySelector("#pool-b");
  var shore = root.querySelector("#pool-shore");

  function paint() {
    root.querySelector('[data-token-open="a"]').textContent = a.value;
    root.querySelector('[data-token-open="b"]').textContent = b.value;
    root.querySelector('[data-token-open="a"]').setAttribute("aria-label", "First token, " + a.value);
    root.querySelector('[data-token-open="b"]').setAttribute("aria-label", "Second token, " + b.value);
    ["a", "b"].forEach(async function (which) {
      var sel = which === "a" ? a : b;
      var slot = root.querySelector('[data-balance="' + which + '"]');
      var result = await desk.balance(shore.value, sel.value, window.PrivyraWallet.state.account);
      if (result.state === "ok") slot.textContent = "Balance " + result.text;
      else if (result.state === "unset") slot.textContent = "Contract unset";
      else if (result.state === "error") slot.textContent = "Balance n/a";
      else slot.textContent = "Balance —";
    });
    var note = document.getElementById("pool-note");
    if (!note) return;
    note.textContent = net.isAddress(cfg.contracts.poolFactory)
      ? "A factory address is set. This page does not index it yet, so TVL, volume, and APR stay blank."
      : "The pool registry is not set. TVL, volume, and APR stay blank until contracts.poolFactory is an address. No stand-in figures are shown.";
  }

  desk.fillSelect(a);
  desk.fillSelect(b);
  a.value = "ETH";
  b.value = "USDC";
  root.querySelector('[data-token-open="a"]').addEventListener("click", function () {
    desk.openPicker(function (symbol) { a.value = symbol; paint(); });
  });
  root.querySelector('[data-token-open="b"]').addEventListener("click", function () {
    desk.openPicker(function (symbol) { b.value = symbol; paint(); });
  });
  shore.addEventListener("change", paint);
  root.addEventListener("submit", function (event) { event.preventDefault(); });
  document.addEventListener("privyra:wallet", paint);
  paint();
})();
