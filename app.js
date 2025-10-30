// عناصر DOM
const tbody = document.querySelector('#dataTable tbody');
const totalEl = document.getElementById('totalValue');
const searchInput = document.getElementById('search');
const btnAdd = document.getElementById('btn-add');
const btnSave = document.getElementById('btn-save');
const btnImage = document.getElementById('btn-image');

// تحميل البيانات من التخزين المحلي
let payments = JSON.parse(localStorage.getItem('payments_mobile')) || [];

// تنسيق الأرقام
function formatNumber(v) {
  const n = parseFloat(v) || 0;
  return n.toLocaleString('en-US');
}

// تاريخ اليوم
function today() {
  return new Date().toISOString().slice(0, 10);
}

// حفظ البيانات
function saveData() {
  localStorage.setItem('payments_mobile', JSON.stringify(payments));
}

// عرض البيانات في الجدول
function render(filter = '') {
  tbody.innerHTML = '';
  let total = 0;

  payments.forEach((row, i) => {
    const [name, amount, date, note] = row;
    const text = `${name} ${amount} ${note}`.toLowerCase();
    if (filter && !text.includes(filter.toLowerCase())) return;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td contenteditable="true">${name}</td>
      <td contenteditable="true">${formatNumber(amount)}</td>
      <td contenteditable="true">${date || today()}</td>
      <td contenteditable="true">${note}</td>
      <td>
        <button class="action-btn del">حذف</button>
        <button class="action-btn edit">تعديل</button>
      </td>
    `;

    const tds = tr.querySelectorAll('td');

    // تعديل الاسم
    tds[1].addEventListener('input', e => {
      payments[i][0] = e.target.innerText;
      saveData();
    });

    // تعديل المبلغ
    tds[2].addEventListener('input', e => {
      const raw = e.target.innerText.replace(/[^\d.]/g, '') || '0';
      payments[i][1] = raw;
      saveData();
      render(filter);
    });

    // تعديل التاريخ
    tds[3].addEventListener('input', e => {
      payments[i][2] = e.target.innerText;
      saveData();
    });

    // تعديل الملاحظات
    tds[4].addEventListener('input', e => {
      payments[i][3] = e.target.innerText;
      saveData();
    });

    // زر الحذف
    tr.querySelector('.del').onclick = () => {
      if (confirm('هل تريد حذف هذه الدفعة؟')) {
        payments.splice(i, 1);
        saveData();
        render(filter);
      }
    };

    // زر التعديل (يركز على الاسم)
    tr.querySelector('.edit').onclick = () => {
      tds[1].focus();
    };

    tbody.appendChild(tr);
    total += parseFloat(amount || 0);
  });

  totalEl.innerText = formatNumber(total.toFixed(2));
}

// إضافة دفعة جديدة
btnAdd.addEventListener('click', () => {
  payments.push(['', '0', today(), '']);
  saveData();
  render(searchInput.value);
});

// حفظ يدوي
btnSave.addEventListener('click', () => {
  saveData();
  alert('تم حفظ البيانات محليًا');
});

// حفظ كصورة
btnImage.addEventListener('click', () => {
  const el = document.getElementById('table-wrap');
  html2canvas(el, { scale: 2 }).then(canvas => {
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'دفتر-الدفعات.png';
    a.click();
  });
});

// البحث
searchInput.addEventListener('input', e => render(e.target.value));

// تشغيل أولي
render();
