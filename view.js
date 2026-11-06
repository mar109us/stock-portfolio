import { checkApiKey } from "./api.js";
import { drawSavedTicker, drawTickerOption, drawTickerSearch } from "./tickers.js";
import { data } from "./data.js";

const view = {
   app: document.getElementById("app"),
};

// Only restore focus if the user was in the search box, so background refreshes don't grab it
export function updateView() {
   const wasSearchFocused = document.activeElement.id === "ticker-search";
   view.app.innerHTML = drawView();
   if (data.isApiKeyValid && wasSearchFocused) focusTickerSearch();
}

function drawView() {
   let html = ""
   html += checkApiKey()
   if (data.isApiKeyValid) html += drawTickerSearch(data.ticker.input, drawTickerResults());
   if (data.isApiKeyValid) html += drawSavedTickers();
   return html;
}

function drawTickerResults() {
   let options = "";
   for (const match of data.ticker.matches) {
      options += drawTickerOption(match);
   }
   return options;
}

function drawSavedTickers() {
   let html = "";
   for (const savedTicker of data.savedTickers) {
      // filter keeps the entries with the same symbol; more than one means it's a duplicate
      const sameSymbol = data.savedTickers.filter((other) => other.symbol === savedTicker.symbol);
      html += drawSavedTicker(savedTicker, sameSymbol.length > 1);
   }
   return `<section id="saved-tickers">${html}</section>`;
}

// The input is rebuilt on every redraw, so focus and cursor have to be put back.
function focusTickerSearch() {
   const tickerSearch = document.getElementById("ticker-search");
   tickerSearch.focus();
   tickerSearch.setSelectionRange(tickerSearch.value.length, tickerSearch.value.length);
}
