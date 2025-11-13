// عناصر DOM
const tbody = document.querySelector('#dataTable tbody');
const totalEl = document.getElementById('totalValue');
const searchInput = document.getElementById('search');
const btnAdd = document.getElementById('btn-add');
const btnSave = document.getElementById('btn-save');
const btnImage = document.getElementById('btn-image');

// تحميل البيانات من التخزين المحلي
let payments = JSON.parse(localStorage.getItem('payments_mobile')) || [];

/* --- مساعدات --- */

// تنسيق الأرقام للعرض (اللافتراضي يستخدم لغة عربية عند الإمكان)
function formatNumber(v) {
  const n = Number(v) || 0;
  // نستخدم locale 'ar-EG' لعرض الأرقام بشكل مألوف في العربية، يمكن تغييره
  return n.toLocaleString('ar-EG', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

// تحويل نص المبلغ إلى قيمة رقمية صالحة (إزالة الفواصل، أحرف غير رقمية)
function parseAmount(text) {
  const cleaned = String(text).replace(/[,٬\s\u202F]/g, '').replace(/[^\d.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function saveData() {
  localStorage.setItem('payments_mobile', JSON.stringify(payments));
}

/* --- عرض الجدول --- */
let renderTimeout = null;
function render(filter = '') {
  // منع إعادة الاستدعاء المتكرر عند عمليات سريعة
  if (renderTimeout) clearTimeout(renderTimeout);
  renderTimeout = setTimeout(() => {
    tbody.innerHTML = '';
    let total = 0;

    payments.forEach((row, i) => {
      // ضمان وجود أربعة عناصر
      const name = row[0] ?? '';
      const amountRaw = row[1] ?? '0';
      const date = row[2] ?? today();
      const note = row[3] ?? '';

      const searchable = `${name} ${amountRaw} ${note}`.toLowerCase();
      if (filter && !searchable.includes(filter.toLowerCase())) return;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${i + 1}</td>
        <td contenteditable="true" data-col="name">${escapeHtml(name)}</td>
        <td contenteditable="true" data-col="amount">${formatNumber(amountRaw)}</td>
        <td contenteditable="true" data-col="date">${escapeHtml(date)}</td>
        <td contenteditable="true" data-col="note">${escapeHtml(note)}</td>
        <td>
          <button class="action-btn del">حذف</button>
          <button class="action-btn edit">تعديل</button>
        </td>
      `;

      // وظائف التحرير لكل خلية
      const nameCell = tr.querySelector('td[data-col="name"]');
      const amountCell = tr.querySelector('td[data-col="amount"]');
      const dateCell = tr.querySelector('td[data-col="date"]');
      const noteCell = tr.querySelector('td[data-col="note"]');

      // الاسم
      nameCell.addEventListener('input', e => {
        payments[i][0] = e.target.innerText.trim();
        saveData();
      });

      // المبلغ: نحاول إبقاء تنسيق العرض قابلاً للتحرير
      amountCell.addEventListener('input', e => {
        // لا نعيد تنسيق العرض فوراً لكن نخزن النسخة الخام
        const raw = parseAmount(e.target.innerText);
        payments[i][1] = raw;
        saveData();
      });

      // عند فقدان التركيز نعطي الخلية عرضاً منسقاً
      amountCell.addEventListener('blur', e => {
        const raw = parseAmount(e.target.innerText);
        payments[i][1] = raw;
        e.target.innerText = formatNumber(raw);
        saveData();
        // إعادة حساب وإظهار المجموع
        updateTotal();
      });

      // التاريخ
      dateCell.addEventListener('input', e => {
        payments[i][2] = e.target.innerText.trim();
        saveData();
      });

      // الملاحظة
      noteCell.addEventListener('input', e => {
        payments[i][3] = e.target.innerText.trim();
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

      // زر التعديل يركّز على الاسم
      tr.querySelector('.edit').onclick = () => {
        nameCell.focus();
      };

      tbody.appendChild(tr);
      total += parseAmount(amountRaw);
    });

    totalEl.innerText = formatNumber(total);
  }, 60);
}

/* --- حساب المجموع بشكل مباشر (للمطالب المتكررة) --- */
function updateTotal() {
  const sum = payments.reduce((acc, r) => acc + parseAmount(r[1]), 0);
  totalEl.innerText = formatNumber(sum);
}

/* --- إضافة دفعة جديدة --- */
btnAdd.addEventListener('click', () => {
  payments.push(['', 0, today(), '']);
  saveData();
  render(searchInput.value);
  // نضع التركيز على آخر صف بعد التحديث
  setTimeout(() => {
    const lastRow = tbody.querySelector('tr:last-child td[data-col="name"]');
    if (lastRow) lastRow.focus();
  }, 120);
});

/* --- حفظ يدوي --- */
btnSave.addEventListener('click', () => {
  saveData();
  alert('تم حفظ البيانات محليًا');
});

/* --- حفظ كصورة --- */
btnImage.addEventListener('click', () => {
  const el = document.getElementById('table-wrap');
  html2canvas(el, { scale: 2 }).then(canvas => {
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'دفتر-الدفعات.png';
    a.click();
  }).catch(() => alert('حدث خطأ أثناء إنشاء الصورة'));
});

/* --- البحث (مع تأخير بسيط) --- */
let searchTimer = null;
searchInput.addEventListener('input', e => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => render(e.target.value.trim()), 150);
});

/* --- أمان بسيط للاحتراز من إدراج HTML ضار داخل الخلايا --- */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/* --- حفظ تلقائي قبل إغلاق الصفحة --- */
window.addEventListener('beforeunload', () => saveData());

/* --- تشغيل أولي --- */
// تأكد من أن كل صفوف الدفع لديها الشكل الصحيح
payments = payments.map(r => [
  r[0] ?? '',
  typeof r[1] === 'number' ? r[1] : parseAmount(r[1]),
  r[2] ?? today(),
  r[3] ?? ''
]);

render();
updateTotal();
