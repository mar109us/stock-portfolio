import { fetchStockPrice, fetchTickerMatches, verifyApiKey } from "./api.js";
import { getFirstMatches } from "./tickers.js";
import { data } from "./data.js";
import { updateView } from "./view.js";

// Finnhub's free tier allows 60 calls/min; 2s per symbol keeps refreshes at 30/min, leaving room for search
const MIN_REFRESH_DELAY = 30000;
const REFRESH_DELAY_PER_SYMBOL = 2000;

loadSavedTickers();
updateView();

function loadSavedTickers() {
   // A corrupted value in localStorage makes JSON.parse throw, so log it and start with an empty list
   try {
      data.savedTickers = JSON.parse(localStorage.savedTickers ?? "[]");
   } catch (error) {
      console.error("loadSavedTickers failed:", error);
   }
}

// Only store the key once Finnhub accepts it, so a typo never ends up in localStorage
async function saveApiKey(key) {
   const trimmedKey = key.trim();
   if (!trimmedKey) return;
   if (!(await verifyApiKey(trimmedKey))) return;
   localStorage.setItem("finnhub", trimmedKey);
   data.API_KEY = trimmedKey;
   data.isApiKeyValid = true;
   updateView();
}

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

async function selectTicker(match) {
   data.ticker.input = "";
   data.ticker.matches = [];
   saveTicker(match);
   updateView();
   await updateSymbolPrice(match.symbol);
   storeSavedTickers();
   updateView();
}

// Inserted after the last entry with the same symbol, so duplicates stay next to each other
function saveTicker(match) {
   const savedTicker = { symbol: match.symbol, description: match.description, price: null };
   // findLastIndex searches from the end and returns -1 when nothing matches
   const lastIndex = data.savedTickers.findLastIndex((other) => other.symbol === match.symbol);
   if (lastIndex === -1) data.savedTickers.push(savedTicker);
   // splice(index, 0, item) inserts item at index without removing anything
   else data.savedTickers.splice(lastIndex + 1, 0, savedTicker);
   storeSavedTickers();
}

function storeSavedTickers() {
   localStorage.setItem("savedTickers", JSON.stringify(data.savedTickers));
}

// splice(index, 1) removes one item at index
function deleteTicker(index) {
   data.savedTickers.splice(index, 1);
   storeSavedTickers();
   updateView();
}

// One fetch per symbol updates all its duplicates; a failed fetch keeps the old price
async function updateSymbolPrice(symbol) {
   const price = await fetchStockPrice(symbol);
   if (price === null) return;
   for (const savedTicker of data.savedTickers) {
      if (savedTicker.symbol === symbol) savedTicker.price = price;
   }
}

async function refreshSavedTickers() {
   for (const symbol of getUniqueSymbols()) {
      await updateSymbolPrice(symbol);
   }
   storeSavedTickers();
   updateView();
}

// A Set keeps only one copy of each value
function getUniqueSymbols() {
   const symbols = new Set();
   for (const savedTicker of data.savedTickers) {
      symbols.add(savedTicker.symbol);
   }
   return symbols;
}

function getRefreshDelay() {
   return Math.max(MIN_REFRESH_DELAY, REFRESH_DELAY_PER_SYMBOL * getUniqueSymbols().size);
}

// setTimeout instead of setInterval: the delay is recalculated each round, and the
// next round only starts after the awaited fetches finish, so slow requests never overlap
function scheduleRefresh() {
   setTimeout(async () => {
      if (data.isApiKeyValid && data.savedTickers.length > 0) await refreshSavedTickers();
      scheduleRefresh();
   }, getRefreshDelay());
}

addEventListener("input", (event) => {
   if (event.target.id === "ticker-search") searchTickers(event.target.value);
});

// dataset.index is a string, so Number() turns it back into an array index
addEventListener("click", (event) => {
   if (event.target.classList.contains("delete-ticker"))
      deleteTicker(Number(event.target.dataset.index));
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

// Without preventDefault the browser reloads the page on submit
addEventListener("submit", (event) => {
   if (event.target.id !== "api-form") return;
   event.preventDefault();
   saveApiKey(event.target.elements["api-input"].value);
});

scheduleRefresh();

