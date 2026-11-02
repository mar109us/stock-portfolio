const API_URL = "https://finnhub.io/api/v1";

const view = {
   app: document.getElementById("app"),
};

const data = {
   symbols: [],
};

// These elements only exist after the component is drawn, so they're cached here
view.app.innerHTML = drawTickerSearch();
view.tickerSearch = document.getElementById("ticker-search");
view.tickerResults = document.getElementById("ticker-results");

async function fetchStockPrice(symbol) {
   try {
      const response = await fetch(`${API_URL}/quote?symbol=${symbol}&token=${API_KEY}`);
      if (!response.ok) {
         throw new Error(`Request failed: ${response.status}`);
      }
      const quote = await response.json();
      const currentPrice = quote.c;
      // Finnhub answers 200 with a price of 0 for a symbol it doesn't recognise
      if (!currentPrice) {
         throw new Error(`No price returned for ${symbol}`);
      }
      console.log(`${symbol}: $${currentPrice}`);
   } catch (error) {
      console.error("fetchStockPrice failed:", error);
   }
}

function drawTickerSearch() {
   return `
      <input id="ticker-search" type="text" placeholder="Search ticker" autocomplete="off" />
      <select id="ticker-results" size="3" hidden></select>`;
}

function drawTickerOption(symbol) {
   return `<option value="${symbol}">${symbol}</option>`;
}

function updateView() {
   let options = "";
   for (const symbol of data.symbols) {
      options += drawTickerOption(symbol);
   }
   view.tickerResults.innerHTML = options;
   view.tickerResults.hidden = data.symbols.length === 0;
}

function getFirstSymbols(matches) {
   const symbols = [];
   for (let i = 0; i < matches.length && i < 3; i++) {
      symbols.push(matches[i].symbol);
   }
   return symbols;
}

async function searchTickers(query) {
   if (!query) {
      data.symbols = [];
      updateView();
      return;
   }
   try {
      const response = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}&token=${API_KEY}`);
      if (!response.ok) {
         throw new Error(`Request failed: ${response.status}`);
      }
      const searchResponse = await response.json();
      // Responses can arrive out of order, so ignore one for text no longer in the input
      if (query !== view.tickerSearch.value) return;
      data.symbols = getFirstSymbols(searchResponse.result);
      updateView();
   } catch (error) {
      console.error("searchTickers failed:", error);
   }
}

function selectTicker(symbol) {
   view.tickerSearch.value = symbol;
   data.symbols = [];
   updateView();
   fetchStockPrice(symbol);
}

addEventListener("input", (event) => {
   if (event.target.id === "ticker-search") searchTickers(event.target.value);
});

addEventListener("change", (event) => {
   if (event.target.id === "ticker-results") selectTicker(event.target.value);
});

addEventListener("keydown", (event) => {
   if (event.target.id === "ticker-search" && event.key === "Enter" && data.symbols.length === 1) {
      selectTicker(data.symbols[0]);
   }
});
