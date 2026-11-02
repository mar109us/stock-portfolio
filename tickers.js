export function drawTickerSearch() {
   return `
      <input id="ticker-search" type="text" placeholder="Search ticker" autocomplete="off" />
      <select id="ticker-results" size="3" hidden></select>`;
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
   for (let i = 0; i < matches.length && i < 3; i++) {
      firstMatches.push({ symbol: matches[i].symbol, description: matches[i].description });
   }
   return firstMatches;
}
