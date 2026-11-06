import { fetchStockPrice, fetchTickerMatches } from "./api.js";
import { getFirstMatches } from "./tickers.js";
import { data } from "./data.js";
import { updateView, view } from "./view.js";

updateView();

async function searchTickers(query) {
   data.ticker.input = query;
   if (!query) {
      data.ticker.matches = [];
      updateView();
      return;
   }
   try {
      const matches = await fetchTickerMatches(query);
      // Responses can arrive out of order, so ignore one for text no longer in the input
      if (query !== data.ticker.input) return;
      data.ticker.matches = getFirstMatches(matches);
      updateView();
   } catch (error) {
      console.error("searchTickers failed:", error);
   }
}

function selectTicker(match) {
   data.ticker.input = match.symbol;
   data.ticker.matches = [];
   view.tickerSearch.value = match.symbol;
   updateView();
   fetchStockPrice(match.symbol, match.description);
}

addEventListener("input", (event) => {
   if (event.target.id === "ticker-search") searchTickers(event.target.value);
});

addEventListener("change", (event) => {
   if (event.target.id === "ticker-results")
      selectTicker(data.ticker.matches[event.target.selectedIndex]);
});

addEventListener("keydown", (event) => {
   if (
      event.target.id === "ticker-search" &&
      event.key === "Enter" &&
      data.ticker.matches.length === 1
   ) {
      selectTicker(data.ticker.matches[0]);
   }
});

console.log("mew");
