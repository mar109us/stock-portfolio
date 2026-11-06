import { fetchStockPrice, fetchTickerMatches } from "./api.js";
import { drawSavedTicker, drawTickerOption, drawTickerSearch, getFirstMatches } from "./tickers.js";
import { data } from "./data.js";

const tests = [];

function test(name, callback) {
   tests.push({ name, callback });
}

// JSON.stringify lets one check compare strings, numbers and arrays
function assertEqual(actual, expected) {
   const actualText = JSON.stringify(actual);
   const expectedText = JSON.stringify(expected);
   if (actualText !== expectedText) {
      throw new Error(`Expected ${expectedText}, got ${actualText}`);
   }
}

function assertIncludes(text, part) {
   if (!text.includes(part)) {
      throw new Error(`Expected "${text}" to include "${part}"`);
   }
}

// Swaps in a fake fetch so tests never call Finnhub, and returns the URLs it was called with
function mockFetch(body, status = 200) {
   const urls = [];
   window.fetch = async (url) => {
      urls.push(url);
      return new Response(JSON.stringify(body), { status });
   };
   return urls;
}

// Swaps a console method for one that stores its arguments instead of printing them
function captureConsole(method) {
   const calls = [];
   console[method] = (...args) => calls.push(args);
   return calls;
}

test("getFirstMatches returns at most 3 matches", () => {
   const matches = [
      { symbol: "A", description: "ALPHA" },
      { symbol: "B", description: "BETA" },
      { symbol: "C", description: "GAMMA" },
      { symbol: "D", description: "DELTA" },
   ];
   assertEqual(getFirstMatches(matches), matches.slice(0, 3));
});

test("getFirstMatches returns all matches when there are fewer than 3", () => {
   const matches = [{ symbol: "A", description: "ALPHA" }];
   assertEqual(getFirstMatches(matches), matches);
});

test("getFirstMatches returns an empty array for no matches", () => {
   assertEqual(getFirstMatches([]), []);
});

test("drawTickerOption uses the symbol as value and shows the description", () => {
   const match = { symbol: "AAPL", description: "APPLE INC" };
   assertEqual(drawTickerOption(match), `<option value="AAPL">AAPL - APPLE INC</option>`);
});

test("drawTickerOption escapes special characters", () => {
   const match = { symbol: "A\"B", description: "AT&T <b>" };
   assertEqual(drawTickerOption(match), `<option value="A&quot;B">A&quot;B - AT&amp;T &lt;b></option>`);
});

test("drawTickerSearch includes the ids main.js looks up", () => {
   const markup = drawTickerSearch("", "");
   assertIncludes(markup, `id="ticker-search"`);
   assertIncludes(markup, `id="ticker-results"`);
});

test("drawSavedTicker shows symbol, description and price", () => {
   const savedTicker = { symbol: "AAPL", description: "APPLE INC", price: 150 };
   assertEqual(
      drawSavedTicker(savedTicker, false, 0),
      `<p>AAPL - APPLE INC: $150 <button class="delete-ticker" data-index="0">Delete</button></p>`,
   );
});

test("drawSavedTicker marks duplicates", () => {
   const savedTicker = { symbol: "AAPL", description: "APPLE INC", price: 150 };
   assertEqual(
      drawSavedTicker(savedTicker, true, 0),
      `<p>AAPL - APPLE INC: $150 (duplicate) <button class="delete-ticker" data-index="0">Delete</button></p>`,
   );
});

test("drawSavedTicker shows a placeholder while the price is null", () => {
   const savedTicker = { symbol: "AAPL", description: "APPLE INC", price: null };
   assertEqual(
      drawSavedTicker(savedTicker, false, 0),
      `<p>AAPL - APPLE INC: $… <button class="delete-ticker" data-index="0">Delete</button></p>`,
   );
});

test("drawSavedTicker escapes special characters", () => {
   const savedTicker = { symbol: "A<B", description: "AT&T", price: 1 };
   assertEqual(
      drawSavedTicker(savedTicker, false, 0),
      `<p>A&lt;B - AT&amp;T: $1 <button class="delete-ticker" data-index="0">Delete</button></p>`,
   );
});

test("drawSavedTicker puts the index on the delete button", () => {
   const savedTicker = { symbol: "AAPL", description: "APPLE INC", price: 150 };
   assertEqual(drawSavedTicker(savedTicker, false, 3).includes(`data-index="3"`), true);
});

test("fetchStockPrice returns the current price", async () => {
   const urls = mockFetch({ c: 150 });
   const price = await fetchStockPrice("AAPL");
   assertIncludes(urls[0], `/quote?symbol=AAPL&token=${data.API_KEY}`);
   assertEqual(price, 150);
});

test("fetchStockPrice returns null and logs an error when the price is 0", async () => {
   mockFetch({ c: 0 });
   const errorCalls = captureConsole("error");
   assertEqual(await fetchStockPrice("NOPE"), null);
   assertEqual(errorCalls[0][1].message, "No price returned for NOPE");
});

test("fetchStockPrice returns null and logs an error when the request fails", async () => {
   mockFetch({}, 500);
   const errorCalls = captureConsole("error");
   assertEqual(await fetchStockPrice("AAPL"), null);
   assertEqual(errorCalls[0][1].message, "Request failed: 500");
});

// Saves and restores the real key, because a 401 removes it from localStorage
test("fetchStockPrice marks the key invalid on 401", async () => {
   const storedKey = localStorage.getItem("finnhub");
   const wasApiKeyValid = data.isApiKeyValid;
   mockFetch({}, 401);
   captureConsole("error");
   const price = await fetchStockPrice("AAPL");
   const isValidAfter = data.isApiKeyValid;
   const storedKeyAfter = localStorage.getItem("finnhub");
   data.isApiKeyValid = wasApiKeyValid;
   if (storedKey !== null) localStorage.setItem("finnhub", storedKey);
   assertEqual(price, null);
   assertEqual(isValidAfter, false);
   assertEqual(storedKeyAfter, null);
});

test("fetchTickerMatches returns the result list and encodes the query", async () => {
   const urls = mockFetch({ result: [{ symbol: "AAPL" }] });
   const matches = await fetchTickerMatches("a b");
   assertEqual(matches, [{ symbol: "AAPL" }]);
   assertIncludes(urls[0], `/search?q=a%20b&token=${data.API_KEY}`);
});

test("fetchTickerMatches throws when the request fails", async () => {
   mockFetch({}, 429);
   let thrownError;
   try {
      await fetchTickerMatches("a");
   } catch (error) {
      thrownError = error;
   }
   assertEqual(thrownError?.message, "Request failed: 429");
});

async function runTests() {
   const realFetch = window.fetch;
   const realLog = console.log;
   const realError = console.error;
   const results = [];
   // One at a time with await, because each test swaps the global fetch and console
   for (const testCase of tests) {
      let failure = null;
      try {
         await testCase.callback();
      } catch (error) {
         failure = error;
      }
      window.fetch = realFetch;
      console.log = realLog;
      console.error = realError;
      if (failure) console.error(`Test failed: ${testCase.name}`, failure);
      results.push({ test: testCase.name, result: failure ? "FAILED" : "OK" });
   }
   drawResults(results);
}

function drawResults(results) {
   // filter keeps only the rows where the callback returns true
   const failedResults = results.filter((result) => result.result === "FAILED");
   const passedCount = results.length - failedResults.length;
   const status = failedResults.length === 0 ? "OK" : "failed";
   // groupCollapsed starts a section that stays closed until you click its label
   console.groupCollapsed(`Test ${status} (${passedCount}/${results.length})`);
   console.table(results);
   console.groupEnd();
   if (failedResults.length > 0) console.table(failedResults);
}

runTests();
