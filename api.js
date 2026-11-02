const API_URL = "https://finnhub.io/api/v1";

export async function fetchStockPrice(symbol, description) {
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
      console.log(`${symbol} - ${description}: $${currentPrice}`);
   } catch (error) {
      console.error("fetchStockPrice failed:", error);
   }
}

export async function fetchTickerMatches(query) {
   const response = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}&token=${API_KEY}`);
   if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
   }
   const searchResponse = await response.json();
   return searchResponse.result;
}
