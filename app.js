const BASE_URL = "https://api.exchangerate-api.com/v4/latest/";

const form = document.getElementById("converter-form");
const amountInput = document.getElementById("amount");
const fromSelect = document.getElementById("from-currency");
const toSelect = document.getElementById("to-currency");
const fromFlag = document.getElementById("from-flag");
const toFlag = document.getElementById("to-flag");
const result = document.getElementById("result");
const convertButton = document.getElementById("convert-button");
const rateButton = document.getElementById("rate-button");
const swapButton = document.getElementById("swap-currencies");

function populateCurrencies() {
  const currencies = Object.keys(countryList).sort();

  for (const currency of currencies) {
    const fromOption = new Option(currency, currency);
    const toOption = new Option(currency, currency);
    fromSelect.add(fromOption);
    toSelect.add(toOption);
  }

  fromSelect.value = "USD";
  toSelect.value = "INR";
  updateFlag(fromSelect, fromFlag);
  updateFlag(toSelect, toFlag);
}

function updateFlag(select, image) {
  const countryCode = countryList[select.value];
  image.src = `https://flagsapi.com/${countryCode}/shiny/64.png`;
  image.alt = `${select.value} flag`;
}

function showResult(message, type = "primary") {
  result.className = `alert alert-${type} result-panel mb-4`;
  result.textContent = message;
}

function setLoading(isLoading) {
  convertButton.disabled = isLoading;
  rateButton.disabled = isLoading;
  swapButton.disabled = isLoading;

  const label = convertButton.querySelector(".button-label");
  label.textContent = isLoading ? "Getting exchange rate..." : "Convert currency";
}

async function getRate(fromCurrency, toCurrency) {
  const response = await fetch(`${BASE_URL}${encodeURIComponent(fromCurrency)}`);
  if (!response.ok) {
    throw new Error(`Exchange rate service returned ${response.status}.`);
  }

  const data = await response.json();
  const rate = data.rates && data.rates[toCurrency];
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error(`No exchange rate is available for ${toCurrency}.`);
  }

  return rate;
}

async function runRateAction(action) {
  const fromCurrency = fromSelect.value;
  const toCurrency = toSelect.value;

  setLoading(true);
  showResult("Fetching the latest available exchange rate...", "info");

  try {
    const rate = await getRate(fromCurrency, toCurrency);
    showResult(action(rate, fromCurrency, toCurrency), "success");
  } catch (error) {
    showResult(`Unable to retrieve the exchange rate. ${error.message}`, "danger");
  } finally {
    setLoading(false);
  }
}

fromSelect.addEventListener("change", () => updateFlag(fromSelect, fromFlag));
toSelect.addEventListener("change", () => updateFlag(toSelect, toFlag));

swapButton.addEventListener("click", () => {
  const previousFrom = fromSelect.value;
  fromSelect.value = toSelect.value;
  toSelect.value = previousFrom;
  updateFlag(fromSelect, fromFlag);
  updateFlag(toSelect, toFlag);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const amount = Number(amountInput.value);
  if (!Number.isFinite(amount) || amount <= 0) {
    amountInput.setCustomValidity("Enter an amount greater than zero.");
    amountInput.reportValidity();
    return;
  }
  amountInput.setCustomValidity("");

  runRateAction((rate, fromCurrency, toCurrency) => {
    const convertedAmount = new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 2,
    }).format(amount * rate);
    return `${amount} ${fromCurrency} = ${convertedAmount} ${toCurrency}`;
  });
});

rateButton.addEventListener("click", () => {
  runRateAction((rate, fromCurrency, toCurrency) => {
    const formattedRate = new Intl.NumberFormat(undefined, {
      maximumSignificantDigits: 8,
    }).format(rate);
    return `1 ${fromCurrency} = ${formattedRate} ${toCurrency}`;
  });
});

amountInput.addEventListener("input", () => amountInput.setCustomValidity(""));

populateCurrencies();
