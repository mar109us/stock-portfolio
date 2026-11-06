const MAX_TICKER_MATCHES = 3;

export function drawTickerSearch(input, options) {
   return `
      <div class="column">
         <input id="ticker-search" type="text" placeholder="Search ticker" autocomplete="off" value="${escapeHtml(input)}" />
         <select id="ticker-results" size="${MAX_TICKER_MATCHES}" ${options ? "" : "hidden"}>${options}</select>
      </div>`;
}

function escapeHtml(text) {
   return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
}

export function drawTickerOption(match) {
   const symbol = escapeHtml(match.symbol);
   const description = escapeHtml(match.description);
   return `<option value="${symbol}">${symbol} - ${description}</option>`;
}

export function drawSavedTicker(savedTicker, isDuplicate, index) {
   const symbol = escapeHtml(savedTicker.symbol);
   const description = escapeHtml(savedTicker.description);
   // ?? only falls back when price is null or undefined, so a real price always shows
   const price = savedTicker.price ?? "…";
   const duplicateLabel = isDuplicate ? " (duplicate)" : "";
   return `<p>${symbol} - ${description}: $${price}${duplicateLabel} <button class="delete-ticker" data-index="${index}">Delete</button></p>`;
}

export function getFirstMatches(matches) {
   const firstMatches = [];
   for (let i = 0; i < matches.length && i < MAX_TICKER_MATCHES; i++) {
      firstMatches.push({ symbol: matches[i].symbol, description: matches[i].description });
   }
   return firstMatches;
}
