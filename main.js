import { fetchStockPrice, fetchTickerMatches } from "./api.js";
import { drawTickerOption, drawTickerSearch, getFirstMatches } from "./tickers.js";

const view = {
   app: document.getElementById("app"),
};

const data = {
   matches: [],
};

// These elements only exist after the component is drawn, so they're cached here.
view.app.innerHTML = drawTickerSearch();
view.tickerSearch = document.getElementById("ticker-search");
view.tickerResults = document.getElementById("ticker-results");

function updateView() {
   let options = "";
   for (const match of data.matches) {
      options += drawTickerOption(match);
   }
   view.tickerResults.innerHTML = options;
   view.tickerResults.hidden = data.matches.length === 0;
}

async function searchTickers(query) {
   if (!query) {
      data.matches = [];
      updateView();
      return;
   }
   try {
      const matches = await fetchTickerMatches(query);
      // Responses can arrive out of order, so ignore one for text no longer in the input
      if (query !== view.tickerSearch.value) return;
      data.matches = getFirstMatches(matches);
      updateView();
   } catch (error) {
      console.error("searchTickers failed:", error);
   }
}

function selectTicker(match) {
   view.tickerSearch.value = match.symbol;
   data.matches = [];
   updateView();
   fetchStockPrice(match.symbol, match.description);
}

addEventListener("input", (event) => {
   if (event.target.id === "ticker-search") searchTickers(event.target.value);
});

addEventListener("change", (event) => {
   if (event.target.id === "ticker-results") selectTicker(data.matches[event.target.selectedIndex]);
});

addEventListener("keydown", (event) => {
   if (event.target.id === "ticker-search" && event.key === "Enter" && data.matches.length === 1) {
      selectTicker(data.matches[0]);
   }
});
