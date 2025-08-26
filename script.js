function autoFormatDate(input) {
  let value = input.value.replace(/[^0-9]/g, ""); // only digits

  if (value.length >= 2 && value.length <= 4) {
    value = value.slice(0, 2) + "/" + value.slice(2);
  } else if (value.length > 4) {
    value = value.slice(0, 2) + "/" + value.slice(2, 4) + "/" + value.slice(4, 8);
  }

  input.value = value.slice(0, 10);
}

function isValidDate(dateString) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) return false;

  const [day, month, year] = dateString.split("/").map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function getTodayDate() {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const year = today.getFullYear();
  return `${day}/${month}/${year}`;
}

function calculateInterest() {
  let start = document.getElementById("start").value;
  let end = document.getElementById("end").value;
  let amount = parseFloat(document.getElementById("amount").value);
  let rate = parseFloat(document.getElementById("rate").value);

  if (!isValidDate(start)) {
    alert("Please enter a valid Start Date (dd/mm/yyyy)");
    return;
  }

  if (!end) {
    end = getTodayDate();
    document.getElementById("end").value = end;
  } else if (!isValidDate(end)) {
    alert("Please enter a valid End Date (dd/mm/yyyy)");
    return;
  }

  if (isNaN(amount) || amount <= 0) {
    alert("Please enter a valid amount");
    return;
  }

  const [d1, m1, y1] = start.split("/").map(Number);
  const [d2, m2, y2] = end.split("/").map(Number);
  const startDate = new Date(y1, m1 - 1, d1);
  const endDate = new Date(y2, m2 - 1, d2);

  if (endDate < startDate) {
    alert("End date must be after Start date");
    return;
  }

  let totalMonths = (y2 - y1) * 12 + (m2 - m1);
  let extraDays = d2 - d1;

  if (extraDays < 0) {
    totalMonths -= 1;
    const prevMonth = new Date(y2, m2 - 1, 0).getDate();
    extraDays += prevMonth;
  }

  let duration = `${totalMonths} month(s) ${extraDays} day(s)`;

  if (extraDays > 17) {
    totalMonths += 1;
  } else if (extraDays > 5) {
    totalMonths += 0.5;
  }

  let interest = amount * (rate / 100) * totalMonths;
  let total = amount + interest;
  let newTotal = total - (amount * (rate / 100)); // one month interest less

  document.getElementById("result").innerHTML = `
    <b>Duration:</b> ${duration}<br>
    <b>Interest @ ${rate}%:</b> ${interest.toFixed(2)}<br>
    <b>Total:</b> ${total.toFixed(2)}<br>
    <div class="result-highlight"><b>NEW Total (1 month less):</b> ${newTotal.toFixed(2)}</div>
  `;
}
