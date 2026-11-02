import { fetchStockPrice, fetchTickerMatches } from "./api.js";
import { drawTickerOption, drawTickerSearch, getFirstMatches } from "./tickers.js";

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
   const markup = drawTickerSearch();
   assertIncludes(markup, `id="ticker-search"`);
   assertIncludes(markup, `id="ticker-results"`);
});

test("fetchStockPrice logs the current price", async () => {
   const urls = mockFetch({ c: 150 });
   const logCalls = captureConsole("log");
   await fetchStockPrice("AAPL", "APPLE INC");
   assertIncludes(urls[0], `/quote?symbol=AAPL&token=${API_KEY}`);
   assertEqual(logCalls[0][0], "AAPL - APPLE INC: $150");
});

test("fetchStockPrice logs an error when the price is 0", async () => {
   mockFetch({ c: 0 });
   const errorCalls = captureConsole("error");
   await fetchStockPrice("NOPE");
   assertEqual(errorCalls[0][1].message, "No price returned for NOPE");
});

test("fetchStockPrice logs an error when the request fails", async () => {
   mockFetch({}, 500);
   const errorCalls = captureConsole("error");
   await fetchStockPrice("AAPL");
   assertEqual(errorCalls[0][1].message, "Request failed: 500");
});

test("fetchTickerMatches returns the result list and encodes the query", async () => {
   const urls = mockFetch({ result: [{ symbol: "AAPL" }] });
   const matches = await fetchTickerMatches("a b");
   assertEqual(matches, [{ symbol: "AAPL" }]);
   assertIncludes(urls[0], `/search?q=a%20b&token=${API_KEY}`);
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
