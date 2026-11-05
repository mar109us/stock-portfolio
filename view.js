import { drawTickerOption, drawTickerSearch } from "./tickers.js";
import { data } from "./data.js";

const view = {
   app: document.getElementById("app"),
};

// These elements only exist after the component is drawn, so they're cached here.
view.app.innerHTML = drawTickerSearch();
view.tickerSearch = document.getElementById("ticker-search");
view.tickerResults = document.getElementById("ticker-results");

export function updateView() {
   drawTickerInput();
   drawTickerResults();
}

function drawTickerInput() {
   view.tickerSearch.value = data.temporary.ticker.input;
}

function drawTickerResults() {
   let options = "";
   for (const match of data.temporary.ticker.matches) {
      options += drawTickerOption(match);
   }
   view.tickerResults.innerHTML = options;
   view.tickerResults.hidden = data.temporary.ticker.matches.length === 0;
}
