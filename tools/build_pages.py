#!/usr/bin/env python3
"""Stamp the shared chrome from index.html onto the other pages.

GitHub Pages serves the HTML files directly. This script is only for
regenerating them after a header or footer edit. Run from the repo root:

    python3 tools/build_pages.py
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
home = (ROOT / "index.html").read_text()
header = home[: home.index("<noscript>")]
footer = home[home.index('<footer class="colophon">') : home.index('<script src="/js/config.js">')]

BASE_SCRIPTS = """  <script src="/js/config.js"></script>
  <script src="/js/net.js"></script>
  <script src="/js/wallet.js"></script>
  <script src="/js/chrome.js"></script>
  <script src="/js/stats.js"></script>
  <script src="/js/ai.js"></script>
  <script src="/js/motion.js"></script>
"""

PAGES = []


def add(name, title, description, canonical, scripts, main):
    PAGES.append((name, title, description, canonical, scripts, main))


add(
    "swap.html",
    "Quiet swap — Privyra",
    "Rehearse a Privyra swap. Token selectors, amounts, slippage, and a route panel. No price is invented while the router is unset.",
    "https://privyra.si/swap.html",
    BASE_SCRIPTS + '  <script src="/js/desk.js"></script>\n  <script src="/js/swap.js"></script>\n',
    r"""
  <main id="main" class="page">
    <div class="wrap">
      <header class="page-hero">
        <p class="kicker">Quiet swap</p>
        <h1 class="display-sm">Trade from a seal, not from the wallet the pool already knows.</h1>
        <p class="lede">A quiet swap is a trade whose sender is a one-time seal. The pool learns a fresh address. Your everyday wallet stays off the ticket. The form below is the desk. It will not ask your wallet to sign until a router and a quoter exist, and it will not print a price in their place.</p>
      </header>
      <div class="desk-layout">
        <form class="swap-card" id="swap-form" novalidate>
          <div class="card-head">
            <h2>Ticket</h2>
            <button type="button" class="btn btn-ghost btn-small" data-slip-open>Slippage <span data-slip-label>0.50%</span></button>
          </div>
          <p class="banner" id="swap-banner">Router not deployed. You can fill the ticket. Nothing is signed.</p>
          <div class="slip-pop" hidden>
            <fieldset>
              <legend>Slippage tolerance</legend>
              <div class="choices">
                <label><input type="radio" name="slip" value="0.1"> 0.10%</label>
                <label><input type="radio" name="slip" value="0.5" checked> 0.50%</label>
                <label><input type="radio" name="slip" value="1"> 1.00%</label>
              </div>
              <label class="field"><span>Custom percent</span>
                <input data-slip-custom inputmode="decimal" placeholder="0.30" aria-label="Custom slippage percent">
              </label>
              <p class="help">Saved on this device. It will apply to a minimum-received figure once a quote exists. Today there is no quote, so the field stays a dash.</p>
            </fieldset>
          </div>
          <label class="field"><span>Balance shore</span>
            <select id="swap-shore" name="shore">
              <option value="robinhood">Robinhood Chain</option>
              <option value="elysium">Elysium</option>
            </select>
            <span class="help">Chooses which public RPC a balance is read from. It does not route a trade.</span>
          </label>
          <div class="swap-row">
            <div class="spread">
              <label for="pay-amount">You pay</label>
              <button type="button" class="token-btn" data-token-open="pay" aria-label="Token you pay">ETH</button>
            </div>
            <input id="pay-amount" class="amount" inputmode="decimal" autocomplete="off" placeholder="0" data-amount="pay">
            <div class="spread">
              <span class="help" data-balance="pay">Balance —</span>
              <button type="button" class="text-btn" data-max="pay">Max</button>
            </div>
            <select id="pay-token" tabindex="-1" aria-hidden="true"></select>
          </div>
          <button type="button" class="flip" data-flip aria-label="Flip the two tokens">↓↑</button>
          <div class="swap-row">
            <div class="spread">
              <label for="recv-amount">You receive</label>
              <button type="button" class="token-btn" data-token-open="recv" aria-label="Token you receive">USDC</button>
            </div>
            <input id="recv-amount" class="amount" inputmode="decimal" autocomplete="off" placeholder="—" data-amount="recv" readonly>
            <div class="spread">
              <span class="help" data-balance="recv">Balance —</span>
            </div>
            <select id="recv-token" tabindex="-1" aria-hidden="true"></select>
          </div>
          <dl class="meta">
            <div><dt>Rate</dt><dd data-quote="rate">No pool</dd></div>
            <div><dt>Minimum received</dt><dd data-quote="min">—</dd></div>
            <div><dt>Price impact</dt><dd data-quote="impact">—</dd></div>
            <div><dt>Fee</dt><dd data-quote="fee">—</dd></div>
            <div><dt>Route</dt><dd data-quote="route">Router unset</dd></div>
          </dl>
          <button type="submit" class="btn btn-brass btn-block" id="swap-submit" disabled>Router not deployed</button>
        </form>
        <aside class="side-card">
          <p class="kicker">Why the receive field is empty</p>
          <h2>A rate without a pool would be fiction.</h2>
          <p>Privyra will quote from the chain: reserves in, fee out, minimum received after your slippage. <code>contracts.swapRouter</code> and <code>contracts.quoter</code> in <code>js/config.js</code> are empty, so this page refuses the last step.</p>
          <p>Balances are different. If your wallet is connected, Ether is read with <code>eth_getBalance</code> on the shore you picked, and a token is read with <code>balanceOf</code> once its address is filled in. A failed read says n/a. It does not become zero.</p>
          <p class="help">Max copies the balance into the amount. A live swap would keep a little of the native coin for gas. That reserve is not subtracted here, because nothing is sent.</p>
        </aside>
      </div>
    </div>
  </main>
""",
)

add(
    "pools.html",
    "Pools — Privyra",
    "Privyra liquidity pools. A table for TVL, volume, and APR, and an add-liquidity form. Figures stay blank until a factory address is set.",
    "https://privyra.si/pools.html",
    BASE_SCRIPTS + '  <script src="/js/desk.js"></script>\n  <script src="/js/pools.js"></script>\n',
    r"""
  <main id="main" class="page">
    <div class="wrap">
      <header class="page-hero">
        <p class="kicker">Pools</p>
        <h1 class="display-sm">Liquidity, listed only when a factory can name it.</h1>
        <p class="lede">Pools are how a quiet swap finds a price. Until the factory contract is set, this page keeps the columns and leaves them empty. An empty cell is a statement. A made-up TVL would be a lie.</p>
      </header>
      <p class="callout" id="pool-note">The pool registry is not set.</p>
      <div class="table-wrap">
        <table class="data">
          <caption>Pools indexed from contracts.poolFactory. None are indexed.</caption>
          <thead>
            <tr>
              <th scope="col">Pool</th>
              <th scope="col">Fee</th>
              <th scope="col" class="num">TVL</th>
              <th scope="col" class="num">Volume 24h</th>
              <th scope="col" class="num">APR</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="5">No pools yet. TVL, volume, and APR will be read from the factory after <code>contracts.poolFactory</code> is an address. Nothing is filled in to preview the columns.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="two section">
        <form class="swap-card" id="pool-form">
          <div class="card-head"><h2>Add liquidity</h2></div>
          <label class="field"><span>Shore</span>
            <select id="pool-shore">
              <option value="robinhood">Robinhood Chain</option>
              <option value="elysium">Elysium</option>
            </select>
          </label>
          <div class="swap-row">
            <div class="spread">
              <label for="amount-a">Token A</label>
              <button type="button" class="token-btn" data-token-open="a">ETH</button>
            </div>
            <input id="amount-a" class="amount" inputmode="decimal" autocomplete="off" placeholder="0">
            <p class="help" data-balance="a">Balance —</p>
            <select id="pool-a" tabindex="-1" aria-hidden="true"></select>
          </div>
          <div class="swap-row">
            <div class="spread">
              <label for="amount-b">Token B</label>
              <button type="button" class="token-btn" data-token-open="b">USDC</button>
            </div>
            <input id="amount-b" class="amount" inputmode="decimal" autocomplete="off" placeholder="0">
            <p class="help" data-balance="b">Balance —</p>
            <select id="pool-b" tabindex="-1" aria-hidden="true"></select>
          </div>
          <fieldset>
            <legend>Intended fee tier</legend>
            <div class="choices">
              <label><input type="radio" name="fee" value="0.05"> 0.05%</label>
              <label><input type="radio" name="fee" value="0.30" checked> 0.30%</label>
              <label><input type="radio" name="fee" value="1.00"> 1.00%</label>
            </div>
            <p class="help">A preference for the day a factory exists. It does not create a pool.</p>
          </fieldset>
          <dl class="meta">
            <div><dt>Pool share</dt><dd>—</dd></div>
            <div><dt>Price</dt><dd>No pool</dd></div>
          </dl>
          <button type="submit" class="btn btn-brass btn-block" disabled>Factory not deployed</button>
        </form>
        <aside class="side-card">
          <p class="kicker">What deposit will mean</p>
          <h2>You would fund a pair, not a promise.</h2>
          <p>Adding liquidity sends two amounts into a pool contract and gives you a claim on the fees that pair earns. Privyra will show the share of the pool those amounts represent. Today the share is a dash, because there is no pool to divide.</p>
          <p>The shore selector only changes where a balance is read. Ether on Robinhood Chain and HYPE on Elysium are native. USDC and $PRIVYRA stay “contract unset” until their addresses are written in the config.</p>
        </aside>
      </div>
    </div>
  </main>
""",
)

add(
    "markets.html",
    "Markets — Privyra",
    "A catalogue of tokenized equity names on the Privyra desk, with search, sort, and sector filters. Closes are end-of-day where a public feed exists.",
    "https://privyra.si/markets.html",
    BASE_SCRIPTS + '  <script src="/js/catalogue.js"></script>\n  <script src="/js/markets.js"></script>\n',
    r"""
  <main id="main" class="page">
    <div class="wrap">
      <header class="page-hero">
        <p class="kicker">Markets</p>
        <h1 class="display-sm">The equity catalogue, with the lights labeled.</h1>
        <p class="lede">These are the names the night clerks watch: listed companies and a few index funds a tokenized desk would quote. A figure appears only when a public, CORS-open bundle has a close. The rest of the row stays blank on purpose. This is not a live tape and it is not a solicitation.</p>
      </header>
      <p class="callout" id="market-note">Loading the end-of-day snapshot…</p>
      <div class="toolbar">
        <label class="search"><span>Search</span>
          <input id="market-search" type="search" placeholder="Ticker, company, or sector" autocomplete="off">
        </label>
        <label class="field"><span>Sort</span>
          <select id="market-sort">
            <option value="symbol:asc">Symbol A–Z</option>
            <option value="symbol:desc">Symbol Z–A</option>
            <option value="name:asc">Company A–Z</option>
            <option value="sector:asc">Sector</option>
            <option value="close:desc">Close, high to low</option>
            <option value="close:asc">Close, low to high</option>
            <option value="change:desc">Change, high to low</option>
            <option value="volume:desc">Volume, high to low</option>
          </select>
        </label>
        <button type="button" class="btn btn-ghost" id="market-refresh">Refresh closes from Fin-node</button>
      </div>
      <p id="market-refresh-status" class="help" aria-live="polite"></p>
      <div class="chips" id="market-sectors" role="toolbar" aria-label="Filter by sector"></div>
      <p id="market-count" class="footnote" aria-live="polite"></p>
      <div class="table-wrap">
        <table class="data">
          <caption>Last close is the session date in the row, compared with the prior session in the bundle. It is not a live last price.</caption>
          <thead>
            <tr>
              <th scope="col">Ticker</th>
              <th scope="col">Company</th>
              <th scope="col">Sector</th>
              <th scope="col" class="num">Last close</th>
              <th scope="col" class="num">Vs prior</th>
              <th scope="col" class="num">Volume</th>
              <th scope="col">Session</th>
            </tr>
          </thead>
          <tbody id="market-body">
            <tr><td colspan="7">Loading the catalogue…</td></tr>
          </tbody>
        </table>
      </div>
      <p class="footnote">Closes that carry a date are from <a href="https://www.fin-node.net/api" target="_blank" rel="noopener noreferrer">Fin-node</a> public bundles, which send <code>Access-Control-Allow-Origin: *</code> and describe themselves as a daily snapshot. Yahoo’s chart endpoint does not allow a browser on this origin to read it, so it is not used. A future live tape can be pointed at <code>markets.quoteUrl</code> in the config. Symbols with no bundle — including HOOD, MSTR, the index funds, and most names outside Fin-node’s thirty — show an em dash.</p>
    </div>
  </main>
""",
)

add(
    "bridge.html",
    "The ferry — Privyra",
    "A Robinhood Chain to Elysium bridge desk with a one-time arrival option and a public receipt checker. The ferry contracts are not deployed.",
    "https://privyra.si/bridge.html",
    BASE_SCRIPTS + '  <script src="/js/desk.js"></script>\n  <script src="/js/bridge.js"></script>\n',
    r"""
  <main id="main" class="page">
    <div class="wrap">
      <header class="page-hero">
        <p class="kicker">The ferry</p>
        <h1 class="display-sm">Two shores. One crossing, when the boats exist.</h1>
        <p class="lede">Robinhood Chain settles to Ethereum and burns ETH for gas. Elysium settles to HyperEVM and burns HYPE. A ferry between them is a contract on each shore. Those contracts are unset, so this page will not broadcast. You can still lay out the crossing, including a private arrival, and you can look up any public receipt that already exists.</p>
      </header>
      <div class="shores" aria-hidden="false">
        <article class="shore">
          <p class="index-no">LEAVE</p>
          <h3>Robinhood Chain</h3>
          <p>Chain 4663 · gas in ETH · Blockscout. The loud room, built for tokenized markets.</p>
        </article>
        <div class="ferry-mark" aria-hidden="true">→</div>
        <article class="shore">
          <p class="index-no">ARRIVE</p>
          <h3>Elysium</h3>
          <p>Chain 99901 · gas in HYPE · settles to HyperEVM. The quiet room.</p>
        </article>
      </div>
      <div class="two">
        <form class="swap-card" id="bridge-form">
          <div class="card-head"><h2>Crossing</h2></div>
          <fieldset>
            <legend>Direction</legend>
            <div class="choices">
              <label><input type="radio" name="dir" value="rh-to-el" checked> Robinhood → Elysium</label>
              <label><input type="radio" name="dir" value="el-to-rh"> Elysium → Robinhood</label>
            </div>
          </fieldset>
          <p class="help">Asset on this leg: <strong id="bridge-asset">ETH on Robinhood Chain</strong></p>
          <p class="help" id="bridge-balance">Balance —</p>
          <label class="field"><span>Amount</span>
            <input id="bridge-amount" inputmode="decimal" autocomplete="off" placeholder="0">
          </label>
          <label class="field"><span>Recipient</span>
            <input id="bridge-to" spellcheck="false" autocapitalize="off" placeholder="0x…" aria-describedby="bridge-to-help">
            <span class="help" id="bridge-to-help">The wallet that should be able to spend what arrives. A private arrival still needs this, because the seal is cut for someone.</span>
          </label>
          <label class="check">
            <input type="checkbox" name="private">
            <span>Arrive at a one-time seal. Observers see the landing address, not your recipient’s everyday wallet.</span>
          </label>
          <p class="callout" id="bridge-seal" hidden>Seal preview is unavailable. <code>contracts.bridgeRobinhood</code> and <code>contracts.bridgeElysium</code> are empty, and no viewing key is published, so the page will not fabricate a landing address.</p>
          <button type="submit" class="btn btn-brass btn-block" id="bridge-submit" disabled>Ferry not deployed</button>
        </form>
        <div>
          <form class="side-card" id="receipt-form">
            <p class="kicker">Claim tracking</p>
            <h2>Check a public receipt.</h2>
            <p class="help">There is no Privyra claim index yet. This asks <code>eth_getTransactionByHash</code> on the shore you pick. Pending, success, and reverted are chain facts. A saved row lives only in this browser.</p>
            <label class="field"><span>Chain</span>
              <select id="receipt-chain" name="chain">
                <option value="robinhood">Robinhood Chain</option>
                <option value="elysium">Elysium</option>
              </select>
            </label>
            <label class="field"><span>Transaction hash</span>
              <input id="receipt-hash" name="hash" spellcheck="false" autocapitalize="off" placeholder="0x…">
            </label>
            <button type="submit" class="btn btn-ghost">Check public receipt</button>
            <div id="receipt-out" aria-live="polite"></div>
            <h3>On this device</h3>
            <div class="watch" id="watch-list"></div>
          </form>
        </div>
      </div>
    </div>
  </main>
""",
)

add(
    "transfer.html",
    "Ink transfer — Privyra",
    "Privyra private transfer. Pay a one-time seal instead of a permanent address. The announcer contract is not deployed, so no seal is invented.",
    "https://privyra.si/transfer.html",
    BASE_SCRIPTS + '  <script src="/js/desk.js"></script>\n  <script src="/js/transfer.js"></script>\n',
    r"""
  <main id="main" class="page">
    <div class="wrap">
      <header class="page-hero">
        <p class="kicker">Ink transfer</p>
        <h1 class="display-sm">Pay the seal. Leave the wallet out of the story.</h1>
        <p class="lede">An ink transfer is a payment to an address that exists for that payment. The recipient recognizes it with a viewing key kept in their own session. Everyone else sees a transfer to a stranger. The announcer that would publish the seal is not deployed, so this page builds the letter and stops before the signature.</p>
      </header>
      <div class="two">
        <form class="swap-card" id="transfer-form">
          <div class="card-head"><h2>Letter</h2></div>
          <label class="field"><span>Shore</span>
            <select id="transfer-shore">
              <option value="robinhood">Robinhood Chain</option>
              <option value="elysium">Elysium</option>
            </select>
          </label>
          <div class="swap-row">
            <div class="spread">
              <label for="transfer-amount">Amount</label>
              <button type="button" class="token-btn" data-token-open="send">ETH</button>
            </div>
            <input id="transfer-amount" class="amount" inputmode="decimal" autocomplete="off" placeholder="0">
            <p class="help" id="transfer-balance">Balance —</p>
            <select id="transfer-token" tabindex="-1" aria-hidden="true"></select>
          </div>
          <label class="field"><span>Recipient wallet</span>
            <input id="transfer-to" spellcheck="false" autocapitalize="off" placeholder="0x…" autocomplete="off">
            <span class="help">The permanent address the seal is cut for. It is not where the tokens land.</span>
          </label>
          <label class="field"><span>Note, kept on this device only</span>
            <textarea id="transfer-note" maxlength="240" placeholder="Optional. Never sent."></textarea>
          </label>
          <button class="btn btn-brass btn-block" id="transfer-submit" type="submit" disabled>Announcer not deployed</button>
        </form>
        <aside class="side-card">
          <p class="kicker">Ticket preview</p>
          <h2>What the chain would be asked.</h2>
          <dl class="spec">
            <div><dt>Recipient</dt><dd id="preview-who">—</dd></div>
            <div><dt>Amount</dt><dd id="preview-amount">—</dd></div>
            <div><dt>Seal</dt><dd id="preview-seal">Unavailable</dd></div>
          </dl>
          <h3>The four beats</h3>
          <ol>
            <li>You name the recipient and the amount.</li>
            <li>This page would draw an ephemeral key locally. It does not, until a registry can publish the recipient’s viewing key.</li>
            <li>The chain would see the seal address and an announcement, not your note.</li>
            <li>The recipient’s session would test the announcement and, on a match, spend from the seal.</li>
          </ol>
          <p class="help">Keys for that dance are not stored by Privyra. When the feature is wired, they live in memory for the session, the same way a signature prompt does. Anyone who can sign for your wallet would be able to unlock the same seal. Treat the wallet accordingly.</p>
        </aside>
      </div>
    </div>
  </main>
""",
)

add(
    "agents.html",
    "Night clerks — Privyra",
    "Privyra agents that run in the browser tab: a ledger clerk on Robinhood Chain, a tape clerk for end-of-day closes, and a spread threshold saved locally.",
    "https://privyra.si/agents.html",
    BASE_SCRIPTS + '  <script src="/js/agents.js"></script>\n',
    r"""
  <main id="main" class="page">
    <div class="wrap" id="agents">
      <header class="page-hero">
        <p class="kicker">Night clerks</p>
        <h1 class="display-sm">Readers that clock out when you close the tab.</h1>
        <p class="lede">Privyra does not run a bot on a server with your keys. The clerks are this page. The ledger clerk reads the public Robinhood Chain head while the tab is open. The tape clerk shows end-of-day closes from the same snapshot as Markets. The spread clerk saves a threshold and waits, because there is no live equity tape to compare.</p>
      </header>
      <label class="field narrow"><span>Read the chain every</span>
        <select id="clerk-interval">
          <option value="10">10 seconds</option>
          <option value="15" selected>15 seconds</option>
          <option value="30">30 seconds</option>
          <option value="60">60 seconds</option>
          <option value="120">120 seconds</option>
        </select>
        <span class="help">Saved on this device. The network strip on every page follows it. Nothing is scheduled after you leave.</span>
      </label>
      <div class="clerks">
        <article class="clerk">
          <header>
            <h2>Ledger clerk</h2>
            <span id="ledger-status" class="status-idle">Waiting</span>
          </header>
          <p>Block, gas, and the average interval over the last 240 Robinhood Chain blocks.</p>
          <dl class="spec">
            <div><dt>Block</dt><dd id="clerk-block">n/a</dd></div>
            <div><dt>Gas</dt><dd id="clerk-gas">n/a</dd></div>
            <div><dt>Block time</dt><dd id="clerk-time">n/a</dd></div>
          </dl>
        </article>
        <article class="clerk">
          <header>
            <h2>Tape clerk</h2>
            <span id="tape-status" class="status-idle">Snapshot</span>
          </header>
          <p>A short watchlist. Closes are the dated end-of-day figures, not a live print.</p>
          <label class="field"><span>Symbols, comma separated</span>
            <input id="tape-watch" type="text" autocomplete="off" spellcheck="false">
          </label>
          <ul id="tape-list"></ul>
        </article>
        <article class="clerk">
          <header>
            <h2>Spread clerk</h2>
            <span class="status-idle">Waiting for a live tape</span>
          </header>
          <p>When a live equity feed is configured, this clerk will flag a name whose on-desk price drifts from the exchange print by more than your threshold. It cannot do that against an end-of-day close without pretending the close is live.</p>
          <label class="field"><span>Threshold, basis points</span>
            <input id="spread-bps" type="number" min="0" max="1000" step="1" value="25" inputmode="numeric">
          </label>
          <p class="help">25 bp is a quarter of one percent. The number is stored here and nowhere else. No alert will fire tonight.</p>
        </article>
      </div>
    </div>
  </main>
""",
)

add(
    "token.html",
    "$PRIVYRA — Privyra",
    "The Privyra token page. The contract address is coming soon and is read from one config value. Holder tiers are house rules, not yet enforced.",
    "https://privyra.si/token.html",
    BASE_SCRIPTS,
    r"""
  <main id="main" class="page">
    <div class="wrap">
      <header class="page-hero">
        <p class="kicker">$PRIVYRA</p>
        <h1 class="display-sm">The key to the desk. Not the cargo.</h1>
        <p class="lede">$PRIVYRA is how the house will know the weight of your wax: how many sealed actions the clerks prepare for you in a day. It is not a receipt for the Ether, HYPE, or tokenized shares you move. It has not been issued. When it is, it is intended for Robinhood Chain, chain 4663.</p>
      </header>
      <div class="token-band">
        <div>
          <div class="ca" data-ca>
            <span class="ca-kicker">Contract</span>
            <code data-ca-value>CA: coming soon</code>
            <button type="button" class="btn btn-ghost btn-small" data-ca-copy disabled>Copy</button>
          </div>
          <p class="help">The copy button stays quiet until <code>token.address</code> in <code>js/config.js</code> is a 20-byte address. That single value also feeds the chip on the home page. Replace it once. Do not hunt through the templates.</p>
        </div>
        <dl class="spec">
          <div><dt>Status</dt><dd>Not launched</dd></div>
          <div><dt>Intended chain</dt><dd>Robinhood Chain · 4663</dd></div>
          <div><dt>Intended supply</dt><dd>100,000,000</dd></div>
          <div><dt>Decimals</dt><dd>18</dd></div>
          <div><dt>Transfer tax</dt><dd>None planned</dd></div>
        </dl>
      </div>
      <section class="section">
        <div class="section-head">
          <p class="kicker">House rules, not a meter</p>
          <h2>Five weights of wax.</h2>
          <p class="lede">These tiers are the custom the desk will keep. They are not read from a contract, because <code>contracts.allowance</code> is empty. A connected wallet cannot be told its tier yet. When the token and the allowance contract are both set, the page will call <code>balanceOf</code> and match the row. Until then it will not guess your holding.</p>
        </div>
        <div class="table-wrap">
          <table class="tiers" data-tiers>
            <caption class="visually-hidden">Intended holder tiers for $PRIVYRA</caption>
            <thead>
              <tr><th scope="col">Tier</th><th scope="col">Hold</th><th scope="col">Sealed actions / day</th><th scope="col">What the house means</th></tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
        <p class="footnote">A sealed action is an ink transfer, a quiet swap, or one leg of the ferry. A paid overflow for the day you run out is planned and has no price, no token, and no switch.</p>
      </section>
      <section class="section prose">
        <h2>Intended cut of the supply</h2>
        <p>Written as a proposal, not as an allocation that exists on a chain.</p>
        <ul>
          <li>55% — community liquidity and the sealed-action pool.</li>
          <li>20% — desk treasury, for audits and the public RPC bill.</li>
          <li>15% — contributors, with a four-year vest once a vesting contract exists.</li>
          <li>10% — the partnership shore, for integrations that publish their own clerks.</li>
        </ul>
        <p>No figure above is a balance. Do not treat it as one.</p>
      </section>
    </div>
  </main>
""",
)

add(
    "docs.html",
    "House rules — Privyra",
    "How Privyra works, which network numbers were verified, and every config value the owner still has to fill.",
    "https://privyra.si/docs.html",
    BASE_SCRIPTS + '  <script src="/js/docs.js"></script>\n',
    r"""
  <main id="main" class="page">
    <div class="wrap prose">
      <header class="page-hero">
        <p class="kicker">Docs</p>
        <h1 class="display-sm">House rules.</h1>
        <p class="lede">Privyra is an interface for a private desk stretched between Robinhood Chain and Elysium. It is not a custodian. The interesting state lives on the chains, in your wallet, and, for a few preferences, in this browser.</p>
      </header>
      <h2>The story, short enough to check</h2>
      <p>Public markets are loud because they have to be. A print that nobody can see is not a market. Private intent is the other half of the same trade: the book you would rather not nail to the door of your everyday wallet. Robinhood Chain is where the tape is being built, an Arbitrum chain aimed at tokenized shares, with ETH for gas. Elysium is a quieter Arbitrum chain that settles to HyperEVM and burns HYPE. Privyra is the desk between those rooms.</p>
      <p>The name is from “privy,” as in admitted to a private counsel. The seal in the mark is a closed book seen edge-on: one vertical cut, a drop of wax.</p>
      <h2>What you sign</h2>
      <p>Connecting a wallet reveals an address the site can already see once you approve it. It does not hand over a key. A later transfer, swap, or crossing will be an ordinary transaction your wallet displays. Reject it and nothing happens. Privyra will not ask you to type a seed phrase. Anyone who does is not this site.</p>
      <h2>Seals</h2>
      <p>The intended private transfer follows the shape of a one-time receiving address. You publish a receiving key. A sender derives a fresh address for you and announces it. Your session recognizes the announcement and spends from that address. The permanent wallet is how you authorize the desk, not the address the payment sticks to. The announcer and the registry are unset, so the transfer page does not derive a sample address. A sample would look like a destination. It would not be one.</p>
      <h2>Networks that were checked</h2>
      <p>Checked on 16 November 2026 by calling <code>eth_chainId</code> on the public RPC. Do not edit these to “make the button work.” If a chain changes its id, the wallet add will be wrong in a way that costs people money.</p>
      <h3>Robinhood Chain</h3>
      <dl class="spec">
        <div><dt>Chain id</dt><dd>4663 · 0x1237</dd></div>
        <div><dt>Public RPC</dt><dd>https://rpc.mainnet.chain.robinhood.com</dd></div>
        <div><dt>Gas</dt><dd>ETH</dd></div>
        <div><dt>Explorer</dt><dd>https://robinhoodchain.blockscout.com</dd></div>
        <div><dt>What it is</dt><dd>Arbitrum Layer 2, blobs on Ethereum</dd></div>
      </dl>
      <p>Sources: <a href="https://docs.robinhood.com/chain/connecting/" target="_blank" rel="noopener noreferrer">Robinhood Chain docs, Connecting</a> and <a href="https://robinhood.com/us/en/support/articles/robinhood-chain-mainnet/" target="_blank" rel="noopener noreferrer">Robinhood’s mainnet article</a>. The public RPC is documented as rate-limited. A second explorer, RobinScan at robin.etherscan.io, is run by Etherscan and is not the one Robinhood lists, so the wallet uses Blockscout.</p>
      <h3>Elysium</h3>
      <dl class="spec">
        <div><dt>Chain id</dt><dd>99901 · 0x1863d</dd></div>
        <div><dt>Public RPC</dt><dd>https://rpc.elysium.kinetiq.xyz</dd></div>
        <div><dt>Gas</dt><dd>HYPE</dd></div>
        <div><dt>Explorer</dt><dd>https://elysium.kinetiq.xyz/explorer</dd></div>
        <div><dt>Settles to</dt><dd>HyperEVM · chain id 999</dd></div>
      </dl>
      <p>Sources: <a href="https://elysium.kinetiq.xyz/docs/connecting-to-elysium" target="_blank" rel="noopener noreferrer">Connecting to Elysium</a> (dated 9 November 2026) and the <a href="https://hub.conduit.xyz/elysium-mainnet" target="_blank" rel="noopener noreferrer">Conduit listing</a>. The same chain id was also returned by <code>https://rpc.asphodelhq.com</code>. That endpoint is left as a note, not the default. ElysScan at scan.elysp.com is a working explorer for chain 99901; wallet links use the Kinetiq host because it serves <code>/tx/</code> and <code>/address/</code>.</p>
      <h2>Contracts</h2>
      <p>Every address the desk will call. “Unset” means the config string is empty.</p>
      <div class="table-wrap">
        <table class="data">
          <thead><tr><th scope="col">Contract</th><th scope="col">Config key</th><th scope="col">Address</th></tr></thead>
          <tbody>
            <tr><th scope="row">Seal announcer</th><td>sealAnnouncer</td><td data-contract="sealAnnouncer" data-chain="robinhood">Unset</td></tr>
            <tr><th scope="row">Seal registry</th><td>sealRegistry</td><td data-contract="sealRegistry" data-chain="robinhood">Unset</td></tr>
            <tr><th scope="row">Swap router</th><td>swapRouter</td><td data-contract="swapRouter" data-chain="elysium">Unset</td></tr>
            <tr><th scope="row">Quoter</th><td>quoter</td><td data-contract="quoter" data-chain="elysium">Unset</td></tr>
            <tr><th scope="row">Pool factory</th><td>poolFactory</td><td data-contract="poolFactory" data-chain="elysium">Unset</td></tr>
            <tr><th scope="row">Ferry, Robinhood</th><td>bridgeRobinhood</td><td data-contract="bridgeRobinhood" data-chain="robinhood">Unset</td></tr>
            <tr><th scope="row">Ferry, Elysium</th><td>bridgeElysium</td><td data-contract="bridgeElysium" data-chain="elysium">Unset</td></tr>
            <tr><th scope="row">Allowance</th><td>allowance</td><td data-contract="allowance" data-chain="robinhood">Unset</td></tr>
          </tbody>
        </table>
      </div>
      <h2>Still empty in the config</h2>
      <p id="github-placeholder" class="callout">Checking the GitHub placeholder…</p>
      <ul class="unset-list" id="unset-list"></ul>
      <h2>Privyra AI</h2>
      <p>The clerk in the corner, and on its own page, answers from this site. It can explain a swap, the ferry, an ink transfer, the wax tiers, and $PRIVYRA. It reads the same end-of-day closes as Markets, and the same ether spot as the strip. “Open swap” (and the other pages) navigates. It does not invent a close.</p>
      <p><code>aiEndpoint</code> in <code>js/config.js</code> is empty. Leave it empty and the clerk above is the whole assistant. To use a model later, point that value at an https URL you run yourself, or at a path on this site. The page POSTs <code>{"messages":[{"role":"user","content":"..."}],"page":"swap"}</code> and reads <code>reply</code> (or <code>message</code>) from the JSON. It sends no <code>Authorization</code> header and no key. Put the model key on your server. Prices and navigation stay in the page even when an endpoint is set, so the model cannot invent a print. An optional <code>href</code> in the response is honored only when it is one of this site’s own pages.</p>
      <h2>What is live, precisely</h2>
      <ul>
        <li>Live, from the Robinhood Chain public RPC: block height, gas price, average block time, the home-page tape, and native ETH balances once a wallet is connected.</li>
        <li>Live, from the Elysium public RPC: the head count on the home page, and HYPE balances once a wallet is connected.</li>
        <li>Live, from CoinGecko: the ETH spot price in the strip, and the same figure if you ask Privyra AI for ether. It is not an on-chain oracle. If the request fails, the answer is n/a.</li>
        <li>End-of-day, from Fin-node: equity closes on the markets page and in Privyra AI, labeled with the session date. Not a live tape.</li>
        <li>In the page, with no model: Privyra AI’s explanations and navigation.</li>
        <li>Not live: $PRIVYRA, swaps, pools, the ferry, seals, tiers, and spread alerts.</li>
      </ul>
      <h2>A note on the catalogue</h2>
      <p>Ticker symbols are names of companies and funds. They are not a claim that a tokenized version trades on this desk. When those tokens exist, their addresses belong in the config, beside the prices, and the markets page should start saying so. Until then the page is a catalogue with a cited close or a blank.</p>
    </div>
  </main>
""",
)

add(
    "agent.html",
    "Privyra AI — Privyra",
    "Privyra AI answers questions about the desk, reads the same end-of-day closes as Markets, and opens pages. No API key is in the site.",
    "https://privyra.si/agent.html",
    BASE_SCRIPTS,
    r"""
  <main id="main" class="page">
    <div class="wrap">
      <header class="page-hero">
        <p class="kicker">Privyra AI</p>
        <h1 class="display-sm">A clerk that stays in the page.</h1>
        <p class="lede">Ask how a quiet swap, a ferry crossing, or an ink transfer works. Ask what the wax tiers require. Ask for a close the markets page already has. Or tell it to open a page. The button in the corner of every other page is this same clerk. Nothing here calls a model unless you later set an endpoint, and that value is never a key.</p>
      </header>
      <div class="two">
        <div id="agent-mount"></div>
        <aside class="side-card">
          <p class="kicker">Try one</p>
          <h2>It will not guess a print.</h2>
          <ul>
            <li>“How do I swap?” explains the ticket and why the receive field is empty.</li>
            <li>“Open the ferry” leaves this page for the bridge.</li>
            <li>“AAPL close” reads the end-of-day snapshot, with the session date.</li>
            <li>“Wax tiers” lists Visitor through House from the config, and says they are not enforced.</li>
            <li>“What is the CA?” says coming soon, until <code>token.address</code> is set.</li>
          </ul>
          <p class="help">Night clerks, on the Agents page, watch the chain. This clerk talks. They do not share a memory, and neither one holds a seed.</p>
        </aside>
      </div>
    </div>
  </main>
""",
)

add(
    "404.html",
    "Page not found — Privyra",
    "That page is not on the Privyra desk.",
    "https://privyra.si/404.html",
    BASE_SCRIPTS,
    r"""
  <main id="main" class="page">
    <div class="wrap">
      <header class="page-hero">
        <p class="kicker">404</p>
        <h1 class="display-sm">This page was never in the book.</h1>
        <p class="lede">The address does not match a Privyra page. The desk itself is still where you left it.</p>
        <div class="actions">
          <a class="btn btn-brass" href="/">Back to the desk</a>
          <a class="btn btn-ghost" href="/docs.html">House rules</a>
        </div>
      </header>
    </div>
  </main>
""",
)


def emit(name, title, description, canonical, scripts, main):
    doc = header
    doc = doc.replace('data-page="home"', f'data-page="{name.split(".")[0] if name != "404.html" else "missing"}"', 1)
    doc = doc.replace(
        "<title>Privyra — The tape is public. The book is not.</title>",
        f"<title>{title}</title>",
        1,
    )
    doc = doc.replace(
        'content="Privyra is a private desk between Robinhood Chain and Elysium. One-time seals, a quiet swap, a ferry, and night clerks. You sign every move."',
        f'content="{description}"',
        1,
    )
    doc = doc.replace('href="https://privyra.si/"', f'href="{canonical}"', 1)
    # 404 should not highlight Home via data-page home; data-page is "missing"
    text = doc + "<noscript><p class=\"banner wrap\">JavaScript is off. You can still read every page. Wallet, live chain stats, and end-of-day prices stay unavailable.</p></noscript>\n" + main + footer + scripts + "</body>\n</html>\n"
    (ROOT / name).write_text(text)
    print("wrote", name, len(text))


def main():
    for page in PAGES:
        emit(*page)


if __name__ == "__main__":
    main()
