import { drawTickerOption, drawTickerSearch } from "./tickers.js";
import { data } from "./data.js";

export const view = {
   app: document.getElementById("app"),
};

// These elements only exist after the component is drawn, so they're cached here.
view.app.innerHTML = drawTickerSearch();
view.tickerSearch = document.getElementById("ticker-search");
view.tickerResults = document.getElementById("ticker-results");

export function updateView() {
   drawTickerResults();
}

function drawTickerResults() {
   let options = "";
   for (const match of data.ticker.matches) {
      options += drawTickerOption(match);
   }
   view.tickerResults.innerHTML = options;
   view.tickerResults.hidden = data.ticker.matches.length === 0;
}
