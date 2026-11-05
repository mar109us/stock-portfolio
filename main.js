import { fetchStockPrice, fetchTickerMatches } from "./api.js";
import { getFirstMatches } from "./tickers.js";
import { data } from "./data.js";
import { updateView } from "./view.js";

updateView();

async function searchTickers(query) {
   data.temporary.ticker.input = query;
   if (!query) {
      data.temporary.ticker.matches = [];
      updateView();
      return;
   }
   try {
      const matches = await fetchTickerMatches(query);
      // Responses can arrive out of order, so ignore one for text no longer in the input
      if (query !== data.temporary.ticker.input) return;
      data.temporary.ticker.matches = getFirstMatches(matches);
      updateView();
   } catch (error) {
      console.error("searchTickers failed:", error);
   }
}

function selectTicker(match) {
   data.temporary.ticker.input = match.symbol;
   data.temporary.ticker.matches = [];
   updateView();
   fetchStockPrice(match.symbol, match.description);
}

addEventListener("input", (event) => {
   if (event.target.id === "ticker-search") searchTickers(event.target.value);
});

addEventListener("change", (event) => {
   if (event.target.id === "ticker-results") selectTicker(data.temporary.ticker.matches[event.target.selectedIndex]);
});

addEventListener("keydown", (event) => {
   if (event.target.id === "ticker-search" && event.key === "Enter" && data.temporary.ticker.matches.length === 1) {
      selectTicker(data.temporary.ticker.matches[0]);
   }
});
