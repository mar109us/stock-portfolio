import { data } from "./data.js";

const API_URL = "https://finnhub.io/api/v1";

export function checkApiKey() {
   if (!data.isApiKeyValid) return drawApiKeyNotFound();
   return "";
}

function drawApiKeyNotFound() {
   return /*html*/ `
      <p>No API key found get a free key at
      <a href="https://finnhub.io/register">finnhub.io</a></p>
      <form id="api-form">
         <input id="api-input" type="text" placeholder="Enter you API key" autocomplete="off" />
         <button type="submit">Save key</button>
      </form>
      <p>Your key will be safely stored on your own device</p>
      `;
}

// Finnhub answers 401 for a bad key, so any successful request proves the key works
export async function verifyApiKey(key) {
   try {
      const response = await fetch(`${API_URL}/quote?symbol=AAPL&token=${encodeURIComponent(key)}`);
      return response.ok;
   } catch (error) {
      console.error("verifyApiKey failed:", error);
      return false;
   }
}

export async function fetchStockPrice(symbol) {
   try {
      const response = await fetch(
         `${API_URL}/quote?symbol=${encodeURIComponent(symbol)}&token=${data.API_KEY}`,
      );
      if (!response.ok) {
         throw new Error(`Request failed: ${response.status}`);
      }
      const quote = await response.json();
      const currentPrice = quote.c;
      // Finnhub answers 200 with a price of 0 for a symbol it doesn't recognise
      if (!currentPrice) {
         throw new Error(`No price returned for ${symbol}`);
      }
      return currentPrice;
   } catch (error) {
      console.error("fetchStockPrice failed:", error);
      return null;
   }
}

export async function fetchTickerMatches(query) {
   const response = await fetch(
      `${API_URL}/search?q=${encodeURIComponent(query)}&token=${data.API_KEY}`,
   );
   if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
   }
   const searchResponse = await response.json();
   return searchResponse.result;
}
