let liveRates = { USD: 1, SEK: 11.1, KES: 162, GBP: 0.8, EUR: 0.93 };

async function updateRates() {
  try {
    const resp = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await resp.json();
    if (data && data.result === 'success' && data.rates) {
      liveRates = data.rates;
      console.log('Live FX rates updated');
    }
  } catch (err) {
    console.error('Failed to fetch FX rates:', err.message || err);
  }
}

function getRates() {
  return liveRates;
}

module.exports = { updateRates, getRates };
