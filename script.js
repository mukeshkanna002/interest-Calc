let sheetData = [];

async function fetchSheetData() {
  const sheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTDzzxF-Zgt4FMDU7at14IjFHnAR5mXjUyANdReudFnZzS94S_Pp4Vi2POzW7wEQafaTCH76BoEEWOc/pub?output=csv";
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(sheetUrl)}`;
  const response = await fetch(proxyUrl);
  const csvText = await response.text();

  const rows = csvText.trim().split("\n").map(row => row.split(","));
  const headers = rows[0].map(h => h.trim());
  sheetData = rows.slice(1).map(row => {
    const obj = {};
    row.forEach((cell, i) => obj[headers[i]] = cell.trim());
    return obj;
  });
}

function getGivenDateFromBillNo(billNo) {
  const row = sheetData.find(r => r["Bill no"] === billNo);
  return row ? row["Given date"] : null;
}

function autoFormatDate(input) {
  const originalValue = input.value;
  const originalCursor = input.selectionStart;
  const digits = originalValue.replace(/\D/g, "");
  let formatted = "";
  if (digits.length > 0) formatted += digits.substring(0, 2);
  if (digits.length >= 3) formatted += "/" + digits.substring(2, 4);
  if (digits.length >= 5) formatted += "/" + digits.substring(4, 8);
  let cursor = originalCursor;
  const slashBefore = (originalValue.slice(0, originalCursor).match(/\//g) || []).length;
  const newSlashBefore = (formatted.slice(0, cursor).match(/\//g) || []).length;
  cursor += newSlashBefore - slashBefore;
  input.value = formatted;
  input.setSelectionRange(cursor, cursor);
}

function isValidDate(dateString) {
  if (!/^\d{2}\/\d{2}\/\d{2,4}$/.test(dateString)) return false;
  const [day, month, year] = dateString.split("/").map(Number);
  const fullYear = year < 100 ? 2000 + year : year;
  const date = new Date(fullYear, month - 1, day);
  return (
    date.getFullYear() === fullYear &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function getTodayDate() {
  const t = new Date();
  const d = String(t.getDate()).padStart(2, "0");
  const m = String(t.getMonth() + 1).padStart(2, "0");
  const y = t.getFullYear();
  return `${d}/${m}/${y}`;
}

function parseDDMMYYYY(s) {
  const [d, m, y] = s.split("/").map(Number);
  const fullYear = y < 100 ? 2000 + y : y;
  return new Date(fullYear, m - 1, d);
}

async function calculateInterest() {
  await fetchSheetData();

  const billNo = document.getElementById("sno").value.trim();
  let startStr = document.getElementById("start").value.trim();

  if (billNo) {
    const sheetStartDate = getGivenDateFromBillNo(billNo);
    if (!sheetStartDate || !isValidDate(sheetStartDate)) {
      alert("Invalid or missing Given date for the entered Bill no");
      return;
    }
    startStr = sheetStartDate;
    document.getElementById("start").value = startStr;
  }

  let endStr = document.getElementById("end").value.trim();
  const amount = parseFloat(document.getElementById("amount").value);
  const rate = parseFloat(document.getElementById("rate").value);

  if (!isValidDate(startStr)) {
    alert("Please enter a valid Start Date (dd/mm/yyyy)");
    return;
  }
  if (!endStr) {
    endStr = getTodayDate();
    document.getElementById("end").value = endStr;
  }
  if (!isValidDate(endStr)) {
    alert("Please enter a valid End Date (dd/mm/yyyy)");
    return;
  }
  if (isNaN(amount) || amount <= 0) {
    alert("Please enter a valid amount");
    return;
  }

  const s = parseDDMMYYYY(startStr);
  const e = parseDDMMYYYY(endStr);
  if (e < s) {
    alert("End date must be after Start date");
    return;
  }

  let months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
  let days = e.getDate() - s.getDate();
  if (days < 0) {
    months -= 1;
    const daysInPrevMonth = new Date(e.getFullYear(), e.getMonth(), 0).getDate();
    days += daysInPrevMonth;
  }

  const durationText = `${months} month(s) ${days} day(s)`;
  let totalMonths = months;
  if (days > 17) totalMonths += 1;
  else if (days > 5) totalMonths += 0.5;

  const monthlyRate = rate / 100;
  const interest = amount * monthlyRate;
  const total = amount + amount * monthlyRate * totalMonths;
  let newTotal = total - (amount * monthlyRate);
  if (newTotal < amount) newTotal = amount;

  const fmt = (n) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n);
  document.getElementById("result").innerHTML = `
    <div class="kv"><span>Start</span><strong>${startStr}</strong></div>
    <div class="kv"><span>End</span><strong>${endStr}</strong></div>
    <div class="kv"><span>Duration</span><strong>${durationText}</strong></div>
    <div class="kv"><span>Rate</span><strong>${rate}% <span class="badge">per month</span></strong></div>
    <div class="kv"><span>Principal</span><strong>₹ ${fmt(amount)}</strong></div>
    <div class="kv"><span>Interest</span><strong>₹ ${fmt(interest)}</strong></div>
    <div class="kv total"><span>Total</span><strong>₹ ${fmt(newTotal)}</strong></div>
    <div class="newtotal">NEW Total : ₹ ${fmt(total)}</div>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  const end = document.getElementById("end");
  end.value = getTodayDate();
  document.getElementById("start").addEventListener("input", (e) => autoFormatDate(e.target));
  end.addEventListener("input", (e) => autoFormatDate(e.target));
  document.getElementById("calcBtn").addEventListener("click", calculateInterest);
});s
