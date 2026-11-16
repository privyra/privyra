/* Privyra — owner config.
   Change values here only. The pages read window.PRIVYRA_CONFIG.
   An empty string means "not published". The UI will not invent one. */
(function () {
  var config = {
    site: {
      name: "Privyra",
      domain: "https://privyra.si",
    },

    social: {
      x: "https://x.com/privyra_",
      /* Placeholder until the owner's GitHub account is created. */
      github: "https://github.com/privyra",
      githubIsPlaceholder: false,
    },

    token: {
      symbol: "PRIVYRA",
      name: "Privyra",
      decimals: 18,
      /* $PRIVYRA contract on Robinhood Chain. Leave "" until launch. */
      address: "",
      chainId: 4663,
      /* Design notes. Not a minted supply. */
      intendedSupply: "100000000",
    },

    /*
      House rules for when the allowance contract exists.
      `actions` null means unmetered. Nothing here is enforced on-chain yet.
    */
    tiers: [
      { id: "visitor", name: "Visitor", hold: 0, actions: 1, note: "One sealed letter a day, so a guest can feel the desk." },
      { id: "clerk", name: "Clerk", hold: 25000, actions: 8, note: "The night staff starts to know your hand." },
      { id: "notary", name: "Notary", hold: 150000, actions: 40, note: "Your wax is recognized on both shores." },
      { id: "partner", name: "Partner", hold: 750000, actions: 200, note: "The clerks will work a long book." },
      { id: "house", name: "House", hold: 2000000, actions: null, note: "The house key. No daily cap." },
    ],

    /*
      Network values verified 16 Nov 2026.
      Robinhood Chain: https://docs.robinhood.com/chain/connecting/
        and https://robinhood.com/us/en/support/articles/robinhood-chain-mainnet/
        Public RPC returned eth_chainId 0x1237 (4663).
      Elysium: https://elysium.kinetiq.xyz/docs/connecting-to-elysium
        (page dated 9 Nov 2026) and https://hub.conduit.xyz/elysium-mainnet
        Public RPC returned eth_chainId 0x1863d (99901).
      Alternate Elysium RPC https://rpc.asphodelhq.com also returned 0x1863d.
      It is not the primary: Kinetiq documents rpc.elysium.kinetiq.xyz.
    */
    networks: {
      robinhood: {
        key: "robinhood",
        name: "Robinhood Chain",
        chainId: 4663,
        chainIdHex: "0x1237",
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        rpc: ["https://rpc.mainnet.chain.robinhood.com"],
        explorer: "https://robinhoodchain.blockscout.com",
        explorerName: "Blockscout",
      },
      elysium: {
        key: "elysium",
        name: "Elysium",
        chainId: 99901,
        chainIdHex: "0x1863d",
        nativeCurrency: { name: "HYPE", symbol: "HYPE", decimals: 18 },
        rpc: ["https://rpc.elysium.kinetiq.xyz"],
        /* Wallet links are origin + /tx/ and /address/, which this host serves. */
        explorer: "https://elysium.kinetiq.xyz",
        explorerHuman: "https://elysium.kinetiq.xyz/explorer",
        explorerName: "Kinetiq explorer",
        settlement: { name: "HyperEVM", chainId: 999 },
      },
    },

    /* Deployed contracts. All unset until the owner fills them. */
    contracts: {
      sealAnnouncer: "",
      sealRegistry: "",
      swapRouter: "",
      quoter: "",
      poolFactory: "",
      bridgeRobinhood: "",
      bridgeElysium: "",
      allowance: "",
    },

    /*
      Optional tokens beyond the two native coins.
      addresses.* stays "" until you publish a contract on that shore.
      PRIVYRA on Robinhood Chain is filled from token.address when that is set.
    */
    tokens: [
      { symbol: "ETH", name: "Ether", decimals: 18, nativeOn: "robinhood", addresses: {} },
      { symbol: "HYPE", name: "HYPE", decimals: 18, nativeOn: "elysium", addresses: {} },
      { symbol: "USDC", name: "USD Coin", decimals: 6, addresses: { robinhood: "", elysium: "" } },
      { symbol: "PRIVYRA", name: "Privyra", decimals: 18, addresses: { robinhood: "", elysium: "" } },
    ],

    markets: {
      /* Set a CORS-open JSON URL later to replace the end-of-day snapshot.
         Shape: { kind, notLive, attribution, disclaimer, fetchedAt, quotes: { AAPL: { date, close, prevClose, volume } } } */
      quoteUrl: "",
      snapshotUrl: "/data/eod-snapshot.json",
      ethPriceUrl: "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&include_last_updated_at=true",
    },

    /*
      Privyra AI. Empty uses the in-page clerk (FAQ, closes, navigation).
      When set, other questions are POSTed here. Do not put an API key in
      this file or in the URL. Prices and "open …" commands stay local.
      Accepted: https URL, or a path on this site ("/api/chat").
      http is accepted only for localhost and 127.0.0.1.
    */
    aiEndpoint: "",
  };

  window.PRIVYRA_CONFIG = config;
})();
