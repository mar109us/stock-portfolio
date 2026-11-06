export const data = {
   API_KEY: localStorage.finnhub ?? "",
   // A stored key was verified before it was saved, so trust it on load
   isApiKeyValid: Boolean(localStorage.finnhub),
   ticker: { input: "", matches: [] },
   savedTickers: [],
};

