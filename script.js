// Auto-format dd/mm/yyyy input with backspace fix
function setupDateInput(id) {
  const input = document.getElementById(id);
  input.addEventListener("input", (e) => {
    let value = e.target.value.replace(/[^0-9]/g, "");

    if (value.length > 2 && value.length <= 4) {
      value = value.slice(0,2) + "/" + value.slice(2);
    } else if (value.length > 4) {
      value = value.slice(0,2) + "/" + value.slice(2,4) + "/" + value.slice(4,8);
    }
    e.target.value = value;
  });

  // Handle backspace correctly
  input.addEventListener("keydown", (e) => {
    if (e.key === "Backspace") {
      let val = input.value;
      if (val.endsWith("/")) {
        input.value = val.slice(0, -1);
        e.preventDefault();
      }
    }
  });
}

function parseDate(str) {
  const [dd, mm, yyyy] = str.split("/").map(Number);
  return new Date(yyyy, mm - 1, dd);
}

// Chennai Gold & Silver API fetch
async function fetchChennaiRates() {
  try {
    const url = `https://metals-api.com/api/latest?access_key=YOUR_API_KEY&base=INR&symbols=XAU,XAG`;
    const res = await fetch(url);
    const json = await res.json();
    const rates = json.rates || {};

    const goldPerOz = rates["XAU"];
    const silverPerOz = rates["XAG"];

    const goldPerGram = goldPerOz ? (goldPerOz / 31.1035).toFixed(2) : "N/A";
    const silverPerGram = silverPerOz ? (silverPerOz / 31.1035).toFixed(2) : "N/A";

    document.getElementById("goldPrice").textContent = "Gold (Chennai): ₹" + goldPerGram + " / gram";
    document.getElementById("silverPrice").textContent = "Silver (Chennai): ₹" + silverPerGram + " / gram";
  } catch (err) {
    document.getElementById("goldPrice").textContent = "Gold (Chennai): Error loading";
    document.getElementById("silverPrice").textContent = "Silver (Chennai): Error loading";
  }
}

// Interest calculation
document.getElementById("calculateBtn").addEventListener("click", () => {
  const principal = parseFloat(document.getElementById("principal").value);
  const rate = parseFloat(document.getElementById("rate").value);
  const startDate = parseDate(document.getElementById("startDate").value);
  const endDate = parseDate(document.getElementById("endDate").value);

  if (isNaN(principal) || !startDate || !endDate) {
    document.getElementById("result").textContent = "Please enter valid inputs.";
    return;
  }

  const diffTime = Math.abs(endDate - startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const months = diffDays / 30;

  const interest = principal * rate * months;
  const total = principal + interest;
  const newTotal = total - (principal * rate); // one month less interest

  document.getElementById("result").innerHTML = `
    Duration: ${diffDays} days (${months.toFixed(2)} months)<br>
    Interest: ₹${interest.toFixed(2)}<br>
    Total: ₹${total.toFixed(2)}<br>
    New Total (1 month less): ₹${newTotal.toFixed(2)}
  `;
});

// Prefill today's date in End Date
window.onload = () => {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();
  document.getElementById("endDate").value = dd + "/" + mm + "/" + yyyy;

  setupDateInput("startDate");
  setupDateInput("endDate");
  fetchChennaiRates();
};
