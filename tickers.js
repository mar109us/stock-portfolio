const MAX_TICKER_MATCHES = 3;

export function drawTickerSearch() {
   return `
      <input id="ticker-search" type="text" placeholder="Search ticker" autocomplete="off" />
      <select id="ticker-results" size="${MAX_TICKER_MATCHES}" hidden></select>`;
}

function escapeHtml(text) {
   return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
}

export function drawTickerOption(match) {
   const symbol = escapeHtml(match.symbol);
   const description = escapeHtml(match.description);
   return `<option value="${symbol}">${symbol} - ${description}</option>`;
}

export function getFirstMatches(matches) {
   const firstMatches = [];
   for (let i = 0; i < matches.length && i < MAX_TICKER_MATCHES; i++) {
      firstMatches.push({ symbol: matches[i].symbol, description: matches[i].description });
   }
   return firstMatches;
}
