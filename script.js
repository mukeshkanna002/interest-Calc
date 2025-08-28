
async function fetchChennaiMetalPrices() {
  try {
    const goldUrl = 'https://api.allorigins.win/get?url=' + encodeURIComponent('https://www.goodreturns.in/gold-rates/chennai.html');
    const silverUrl = 'https://api.allorigins.win/get?url=' + encodeURIComponent('https://www.goodreturns.in/silver-rates/chennai.html');

    const [goldRes, silverRes] = await Promise.all([fetch(goldUrl), fetch(silverUrl)]);
    const goldData = await goldRes.json();
    const silverData = await silverRes.json();

    const parser = new DOMParser();
    const goldDoc = parser.parseFromString(goldData.contents, "text/html");
    const silverDoc = parser.parseFromString(silverData.contents, "text/html");

    // Extract gold prices
    const goldTable = goldDoc.querySelector("table");
    const goldRows = goldTable?.querySelectorAll("tr");
    let gold24 = "N/A", gold22 = "N/A";

    goldRows?.forEach(row => {
      const text = row.innerText;
      if (text.includes("24K") || text.includes("24 Carat")) {
        gold24 = row.querySelector("td:last-child")?.innerText || gold24;
      }
      if (text.includes("22K") || text.includes("22 Carat")) {
        gold22 = row.querySelector("td:last-child")?.innerText || gold22;
      }
    });

    // Extract silver price
    const silverText = silverDoc.body.innerText;
    const silverMatch = silverText.match(/Silver\s*\/g\s*₹?([\d,]+\.\d+)/i);
    const silver = silverMatch ? `₹${silverMatch[1]}` : "N/A";

    // Update DOM
    document.getElementById("goldPrice").innerText = `24K: ${gold24} | 22K: ${gold22}`;
    document.getElementById("silverPrice").innerText = silver;
    document.getElementById("ratesMeta").innerText = `Updated: ${new Date().toLocaleString()}`;
  } catch (error) {
    console.error("Error fetching prices:", error);
    document.getElementById("goldPrice").innerText = "Error fetching gold price";
    document.getElementById("silverPrice").innerText = "Error fetching silver price";
    document.getElementById("ratesMeta").innerText = "—";
  }
}
document.addEventListener("DOMContentLoaded", fetchChennaiMetalPrices);

// Helpers
// =====================
function pad2(n){return String(n).padStart(2,'0');}

// Auto-format dd/mm/yyyy with backspace-friendly behavior
function setupDateMask(el){
  el.addEventListener("input",(e)=>{
    let v = e.target.value.replace(/[^0-9]/g,"");
    if(v.length>2 && v.length<=4){ v = v.slice(0,2)+"/"+v.slice(2); }
    else if(v.length>4){ v = v.slice(0,2)+"/"+v.slice(2,4)+"/"+v.slice(4,8); }
    e.target.value = v;
  });
  el.addEventListener("keydown",(e)=>{
    if(e.key==="Backspace"){
      const {selectionStart, selectionEnd, value} = el;
      if(selectionStart===selectionEnd && selectionStart>0 && value[selectionStart-1]==="/"){
        // remove the slash first
        el.value = value.slice(0,selectionStart-1)+value.slice(selectionStart);
        el.setSelectionRange(selectionStart-1, selectionStart-1);
        e.preventDefault();
      }
    }
  });
}

function parseDDMMYYYY(str){
  const m = str.match(/^([0-3]\d)\/([0-1]\d)\/(\d{4})$/);
  if(!m) return null;
  const dd = +m[1], mm = +m[2], yy = +m[3];
  const d = new Date(yy, mm-1, dd);
  // validate real date
  if(d.getFullYear()!==yy || d.getMonth()!==mm-1 || d.getDate()!==dd) return null;
  return d;
}

function formatDDMMYYYY(d){
  return pad2(d.getDate())+"/"+pad2(d.getMonth()+1)+"/"+d.getFullYear();
}

// =====================
// Metals — Chennai rates
// =====================
const LS_KEYS = {
  gold: "chen_gold_g",
  silver: "chen_silver_g",
  ts: "chen_last_update"
};

// Refresh once per day at 10:00 (local time)
function scheduleDaily10AM(){
  function msUntilNext10(){
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0, 0);
    if(now >= next){ next.setDate(next.getDate()+1); }
    return next - now;
  }
  setTimeout(()=>{
    fetchChennaiRates();
    // after the first trigger, do it every 24h
    setInterval(fetchChennaiRates, 24*60*60*1000);
  }, msUntilNext10());
}

// Also refresh on load if we are past today's 10:00 and last update was before it
function maybeRefreshAtToday10(){
  const last = localStorage.getItem(LS_KEYS.ts);
  const now = new Date();
  const today10 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0);
  if(!last || (now >= today10 && new Date(last) < today10)){
    fetchChennaiRates();
  }
}

// =====================
// Interest calculator
// =====================
function calcDurationParts(start, end){
  const MS = 24*60*60*1000;
  const days = Math.floor((end - start)/MS);
  if(days < 0) return null;
  let months = Math.floor(days/30);
  let rem = days % 30;

  // rounding rule:
  // >5 & <=17 -> 15 days interest
  // >17       -> add 1 month, 0 days
  if(rem > 5 && rem <= 17){
    rem = 15;
  }else if(rem > 17){
    months += 1;
    rem = 0;
  }
  return {months, days: rem, rawDays: days};
}

function plural(n, w){ return n + " " + w + (n===1 ? "" : "s"); }

function computeInterest(principal, ratePerMonth, parts){
  const monthsFrac = parts.months + parts.days/30;
  return principal * ratePerMonth * monthsFrac;
}

// =====================
// Init
// =====================
window.addEventListener("DOMContentLoaded", () => {
  // Prefill End date with today
  const today = new Date();
  document.getElementById("endDate").value = formatDDMMYYYY(today);

  // Mask inputs
  setupDateMask(document.getElementById("startDate"));
  setupDateMask(document.getElementById("endDate"));

  // Metals
  maybeRefreshAtToday10();
  scheduleDaily10AM();

  // Form submit
  document.getElementById("interestForm").addEventListener("submit", (e)=>{
    e.preventDefault();
    const principal = parseFloat(document.getElementById("principal").value);
    const rate = parseFloat(document.getElementById("rate").value); // monthly
    const sd = parseDDMMYYYY(document.getElementById("startDate").value);
    const ed = parseDDMMYYYY(document.getElementById("endDate").value);

    const resultEl = document.getElementById("result");
    resultEl.hidden = true;
    if(!(principal>0) || !sd || !ed){
      resultEl.innerHTML = "<p>Please enter valid amount and dates (dd/mm/yyyy).</p>";
      resultEl.hidden = false;
      return;
    }
    const parts = calcDurationParts(sd, ed);
    if(!parts){
      resultEl.innerHTML = "<p>End date must be on or after start date.</p>";
      resultEl.hidden = false;
      return;
    }

    const durTxt = `${plural(parts.months,"month")} ${plural(parts.days,"day")}`;
    const interest = computeInterest(principal, rate, parts);
    const total = principal + interest;
    const newTotal = total - (principal * rate); // one month less

    resultEl.innerHTML = [
      `<p><strong>Duration:</strong> ${durTxt} <span class="meta">(${parts.rawDays} days raw)</span></p>`,
      `<p><strong>Interest:</strong> ₹${interest.toFixed(2)}</p>`,
      `<div class="totals">`,
      `<p><strong>Total:</strong> ₹${total.toFixed(2)}</p>`,
      `<p><strong>NEW Total (1 month less):</strong> ₹${newTotal.toFixed(2)}</p>`,
      `</div>`
    ].join("");
    resultEl.hidden = false;
  });
});
