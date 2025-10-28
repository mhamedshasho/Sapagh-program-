const tbody = document.getElementById("tbody");
const sumEl = document.getElementById("sum");
const lastSavedEl = document.getElementById("lastSaved");
const STORAGE_KEY = "payments_data";

function addRow(data = {}) {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input type="checkbox" class="row-check"></td>
    <td contenteditable="true">${data.date || new Date().toISOString().slice(0,10)}</td>
    <td contenteditable="true">${data.school || ""}</td>
    <td contenteditable="true">${data.desc || ""}</td>
    <td contenteditable="true">${data.type || "دخل"}</td>
    <td contenteditable="true">${data.amount || 0}</td>
    <td contenteditable="true">${data.status || "معلق"}</td>
    <td contenteditable="true">${data.note || ""}</td>
  `;
  tbody.appendChild(tr);
  updateSum();
  updateSummary();
}

function deleteSelected() {
  document.querySelectorAll(".row-check:checked").forEach(ch => ch.closest("tr").remove());
  updateSum();
  updateSummary();
  saveData();
}

function toggleAll(master) {
  document.querySelectorAll(".row-check").forEach(ch => ch.checked = master.checked);
}

function updateSum() {
  let total = 0;
  tbody.querySelectorAll("tr").forEach(tr => {
    const amount = parseFloat(tr.cells[5].textContent) || 0;
    const type = tr.cells[4].textContent.trim();
    total += (type === "مصروف") ? -amount : amount;
  });
  sumEl.textContent = total.toFixed(2);
}

function updateSummary() {
  const rows = tbody.querySelectorAll("tr");
  document.getElementById("count").textContent = rows.length;
  let income = 0, expense = 0;
  rows.forEach(tr => {
    const type = tr.cells[4].textContent.trim();
    if (type === "دخل") income++;
    if (type === "مصروف") expense++;
  });
  document.getElementById("incomeCount").textContent = income;
  document.getElementById("expenseCount").textContent = expense;
}

function saveData() {
  const rows = [...tbody.querySelectorAll("tr")].map(tr => ({
    date: tr.cells[1].textContent,
    school: tr.cells[2].textContent,
    desc: tr.cells[3].textContent,
    type: tr.cells[4].textContent,
    amount: tr.cells[5].textContent,
    status: tr.cells[6].textContent,
    note: tr.cells[7].textContent
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  lastSavedEl.textContent = new Date().toLocaleString();
}

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    JSON.parse(raw).forEach(r => addRow(r));
  } else {
    addRow();
  }
}

function clearAll() {
  if (confirm("هل أنت متأكد من تفريغ جميع البيانات؟")) {
    tbody.innerHTML = "";
    updateSum();
    updateSummary();
    localStorage.removeItem(STORAGE_KEY);
    lastSavedEl.textContent = "تم التفريغ";
  }
}

function saveAsImage() {
  html2canvas(document.body).then(canvas => {
    const link = document.createElement("a");
    link.download = "دفتر_الدفعات.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  });
}

function exportToCSV() {
  const rows = [["التاريخ","المعهد/المدرسة","الوصف","النوع","المبلغ","الحالة","ملاحظات"]];
  tbody.querySelectorAll("tr").forEach(tr => {
    const row = [];
    for (let i = 1; i < tr.cells.length; i++) {
      row.push(tr.cells[i].textContent.replace(/,/g, "،"));
    }
    rows.push(row);
  });
  const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
  const link = document.createElement("a");
  link.href = encodeURI(csvContent);
  link.download = "دفتر_الدفعات.csv";
  link.click();
}

function printPDF() {
  window.print();
}

function searchTable() {
  const filter = document.getElementById("searchBox").value.toLowerCase();
  tbody.querySelectorAll("tr").forEach(tr => {
    const text = tr.textContent.toLowerCase();
    tr.style.display = text.includes(filter) ? "" : "none";
  });
}

loadData();
