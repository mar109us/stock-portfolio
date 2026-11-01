const API_URL = "https://finnhub.io/api/v1";

const view = {
   app: document.getElementById("app"),
};

const data = {
   symbols: ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "TSLA", "META", "NFLX"],
};

fetchRandomStockPrice();

async function fetchRandomStockPrice() {
   const randomIndex = Math.floor(Math.random() * data.symbols.length);
   const symbol = data.symbols[randomIndex];
   try {
      const response = await fetch(`${API_URL}/quote?symbol=${symbol}&token=${API_KEY}`);
      if (!response.ok) {
         throw new Error(`Request failed: ${response.status}`);
      }
      const quote = await response.json();
      // Finnhub answers 200 with a price of 0 for a symbol it doesn't recognise
      if (!quote.c) {
         throw new Error(`No price returned for ${symbol}`);
      }
      console.log(`${symbol}: $${quote.c}`);
   } catch (error) {
      console.error("fetchRandomStockPrice failed:", error);
   }
}
