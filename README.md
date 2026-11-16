# Privyra

A private desk between [Robinhood Chain](https://docs.robinhood.com/chain/connecting/) and [Elysium](https://elysium.kinetiq.xyz/docs/connecting-to-elysium). The tape stays public. The book does not.

The site is static HTML, CSS, and JavaScript. GitHub Pages can serve it with no build. `tools/build_pages.py` only regenerates the inner pages after a shared header or footer edit.

## Run locally

From the repository root:

```bash
python3 -m http.server 4721
```

Open [http://127.0.0.1:4721/](http://127.0.0.1:4721/). Use a local server. Opening the files directly will break the root-absolute asset paths.

## Pages

| Page | File |
| --- | --- |
| Home | `/` (`index.html`) |
| Quiet swap | `/swap.html` |
| Pools | `/pools.html` |
| Markets | `/markets.html` |
| Ferry (bridge) | `/bridge.html` |
| Ink transfer | `/transfer.html` |
| Night clerks | `/agents.html` |
| $PRIVYRA | `/token.html` |
| Privyra AI | `/agent.html` |
| House rules | `/docs.html` |

Each item in the header is its own document. The menu does not scroll to an anchor.

## Config the owner fills

Everything lives in `js/config.js` as `window.PRIVYRA_CONFIG`. Empty strings are unpublished. The pages do not invent them.

| Key | Current value | What to do |
| --- | --- | --- |
| `token.address` | `""` | $PRIVYRA contract on Robinhood Chain. Until this is a `0x` address, both CA chips read **CA: coming soon** and Copy stays disabled. |
| `social.github` | `https://github.com/privyra` | Placeholder. `social.githubIsPlaceholder` is `true`. Point it at the real account when it exists. |
| `social.x` | `https://x.com/privyra_` | Live link. Change only if the handle changes. |
| `contracts.sealAnnouncer` | `""` | Ink-transfer announcer. |
| `contracts.sealRegistry` | `""` | Receiving-key registry. |
| `contracts.swapRouter` | `""` | Quiet-swap router. |
| `contracts.quoter` | `""` | Quote source. A price is not shown until this is wired, even after the address is set. |
| `contracts.poolFactory` | `""` | Pool index. TVL, volume, and APR stay blank until then. |
| `contracts.bridgeRobinhood` | `""` | Ferry contract on Robinhood Chain. |
| `contracts.bridgeElysium` | `""` | Ferry contract on Elysium. |
| `contracts.allowance` | `""` | Tier meter. Tiers are house rules only while this is empty. |
| `tokens[].addresses.robinhood` / `.elysium` | `""` for USDC and $PRIVYRA | Per-shore token contracts. $PRIVYRA on Robinhood Chain is copied from `token.address` when that is set. |
| `markets.quoteUrl` | `""` | Optional CORS-open JSON feed. Leave empty to keep the labeled end-of-day snapshot. |
| `aiEndpoint` | `""` | Optional Privyra AI backend. Empty means the in-page clerk only. Never put an API key here. |

The docs page lists every empty string in the config, so a new blank shows up there without a template edit.

## What is live, and what is not

Live, from the public Robinhood Chain RPC:

- Block height, gas price, and average block time over the last 240 blocks (the strip on every page).
- The home-page tape of recent public transactions. These are not Privyra protocol events.
- Native ETH balances once a wallet is connected.

Live, from the public Elysium RPC:

- The Elysium head count on the home page.
- Native HYPE balances once a wallet is connected.

Live, from CoinGecko, and labeled as such:

- The ETH spot price in the strip. It is not an on-chain oracle. A failure shows **n/a**.

End of day, not a live tape:

- Equity closes on Markets, from [Fin-node](https://www.fin-node.net/api) bundles saved in `data/eod-snapshot.json` (fetched 2026-11-16, sessions mostly 2026-11-13). Each priced row is marked **EOD** plus the session date. **Refresh closes from Fin-node** re-reads the public bundles in the browser. Symbols with no bundle stay blank. Warner Bros. Discovery (`WBD`) was omitted because its bundle was a single stale row.

Not live, and not filled with stand-in numbers:

- $PRIVYRA, the quiet swap quote, pools (TVL / APR / volume), the ferry, seals, holder tiers, and spread alerts.

## Networks

Verified 16 November 2026. `eth_chainId` on each public RPC matched the published id.

### Robinhood Chain

| | |
| --- | --- |
| Chain id | `4663` (`0x1237`) |
| RPC | `https://rpc.mainnet.chain.robinhood.com` |
| Gas | ETH |
| Explorer | `https://robinhoodchain.blockscout.com` |
| Sources | [Connecting to Robinhood Chain](https://docs.robinhood.com/chain/connecting/), [Robinhood Chain mainnet](https://robinhood.com/us/en/support/articles/robinhood-chain-mainnet/) |

The public RPC is documented as rate-limited. RobinScan (`https://robin.etherscan.io`) is Etherscan’s explorer and is not the one Robinhood lists, so wallet links use Blockscout.

### Elysium

| | |
| --- | --- |
| Chain id | `99901` (`0x1863d`) |
| RPC | `https://rpc.elysium.kinetiq.xyz` |
| Gas | HYPE |
| Explorer | `https://elysium.kinetiq.xyz/explorer` |
| Settlement | HyperEVM, chain id `999` |
| Sources | [Connecting to Elysium](https://elysium.kinetiq.xyz/docs/connecting-to-elysium) (9 November 2026), [Conduit](https://hub.conduit.xyz/elysium-mainnet) |

`https://rpc.asphodelhq.com` also returned chain id `0x1863d`. It is noted in the config comments and is not the default. Wallet explorer links use `https://elysium.kinetiq.xyz`, which serves `/tx/` and `/address/`.

## Privyra AI

A floating **Privyra AI** button is on every page, and the same clerk has its own page at `/agent.html`. It answers from the site:

- How a swap, the ferry, an ink transfer, the wax tiers, and $PRIVYRA work.
- End-of-day closes from `data/eod-snapshot.json` (the markets data layer), named as end-of-day, never as a live tape. A name with no bundle stays blank.
- The ether spot from the same CoinGecko URL as the network strip.
- Navigation. “Open swap”, “open the ferry”, “open markets”, and the other pages leave the current document for that page.

No model is called while `aiEndpoint` is empty. The conversation is kept in `sessionStorage` for the tab.

### Plugging in a real LLM later

1. Run a small HTTPS endpoint you control. Put the model API key in that server’s environment, not in this repository.
2. Accept `POST` with `Content-Type: application/json` and no `Authorization` header from the browser:

```json
{
  "messages": [
    { "role": "user", "content": "How do I swap?" },
    { "role": "assistant", "content": "..." }
  ],
  "page": "home"
}
```

3. Respond with JSON: `{ "reply": "Your answer." }`. `message` is accepted as an alias. An optional `href` is followed only when it is one of this site’s own paths (`/swap.html`, `/bridge.html`, and the rest).
4. Set `aiEndpoint` in `js/config.js` to that https URL, or to a same-site path such as `/api/chat` if you later add a proxy. `http://` is ignored except for `localhost` and `127.0.0.1`. A URL with a user, a password, or a `key` / `token` / `api_key` query parameter is ignored on purpose.
5. Redeploy the static files. GitHub Pages still has no secret.

Price questions and “open this page” commands keep using the in-page clerk even after the endpoint is set, so the model cannot invent a close or send someone off-site. If the endpoint errors, times out, or returns an empty reply, the page says so and falls back to the local answer.

## Wallet

**Connect wallet** uses EIP-6963 discovery and falls back to `window.ethereum` (MetaMask, Rabby, Brave, Coinbase, OKX, and other injected EIP-1193 wallets). The connected address is shown in the header. If the wallet is not on Robinhood Chain, the dialog and the wallet menu offer **Add / switch to Robinhood Chain** with the values above. Elysium can be added from the same menu.

Disconnect clears the site session. Wallets that support `wallet_revokePermissions` are asked to revoke it as well.

## GitHub Pages

`CNAME` contains `privyra.si`. `.github/workflows/pages.yml` deploys the repository root on every push to `main`.

In the repository settings, set Pages → Source to **GitHub Actions**. For the apex domain, point DNS at the GitHub Pages A records:

- `185.199.108.153`
- `185.199.109.153`
- `185.199.110.153`
- `185.199.111.153`

A `www` host, if you use one, is a CNAME to `<owner>.github.io`. This repo does not change DNS for you.

## Fonts

Latin subsets of Fraunces, Outfit, and IBM Plex Mono are self-hosted under `assets/fonts/` (SIL Open Font License 1.1). See `assets/fonts/README.md`.
