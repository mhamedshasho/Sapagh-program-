// مساعدة للوصول للعناصر مع تحذير
function $id(id){
  const el = document.getElementById(id);
  if(!el) console.warn('عنصر مفقود في DOM:', id);
  return el;
}

// البيانات والمراجع
let payments = JSON.parse(localStorage.getItem('payments_v2')) || [];

const tbody = $id('dataTable')?.querySelector('tbody');
const totalEl = $id('totalValue');
const searchInput = $id('search');
const btnAdd = $id('btn-add');
const btnSave = $id('btn-save');
const btnImage = $id('btn-image');
const btnThank = $id('btn-thank');

// عناصر المودال
const thankModal = $id('thankModal');
const modalBackdrop = $id('modalBackdrop');
const modalClose = $id('modalClose');
const teacherImage = $id('teacherImage');
const thankText = $id('thankText');

if(!tbody || !totalEl) console.error('أجزاء الجدول الأساسية غير موجودة — تحقق من HTML.');

// تنسيقات ومساعدة
function formatNumber(v){
  const n = parseFloat(v) || 0;
  return n.toLocaleString('en-US');
}
function today(){
  const d = new Date();
  return d.toISOString().slice(0,10);
}
function saveData(){
  localStorage.setItem('payments_v2', JSON.stringify(payments));
}

// العرض
function render(filter = ''){
  if(!tbody) return;
  tbody.innerHTML = '';
  let total = 0;
  payments.forEach((row, i) => {
    const [name = '', amount = '0', date = '', note = ''] = row;
    const text = `${name} ${amount} ${note}`.toLowerCase();
    if(filter && !text.includes(filter.toLowerCase())) return;

    const tr = document.createElement('tr');

    const tdIndex = document.createElement('td'); tdIndex.innerText = i+1; tr.appendChild(tdIndex);

    const tdName = document.createElement('td'); tdName.innerText = name; tdName.contentEditable = true;
    tdName.addEventListener('input', e=> { payments[i][0]=e.target.innerText; saveData(); });
    tr.appendChild(tdName);

    const tdAmount = document.createElement('td'); tdAmount.innerText = formatNumber(amount);
    tdAmount.contentEditable = true;
    tdAmount.addEventListener('input', e=> {
      const raw = e.target.innerText.replace(/[^\d\.\-]/g,'') || '0';
      payments[i][1] = raw;
      saveData();
      render(filter);
    });
    tr.appendChild(tdAmount);

    const tdDate = document.createElement('td'); tdDate.innerText = date || today();
    tdDate.contentEditable = true;
    tdDate.addEventListener('input', e=> { payments[i][2]=e.target.innerText; saveData(); });
    tr.appendChild(tdDate);

    const tdNote = document.createElement('td'); tdNote.innerText = note;
    tdNote.contentEditable = true;
    tdNote.addEventListener('input', e=> { payments[i][3]=e.target.innerText; saveData(); });
    tr.appendChild(tdNote);

    const tdActions = document.createElement('td');
    const btnDel = document.createElement('button'); btnDel.className='action-btn del'; btnDel.innerText='حذف';
    btnDel.onclick = ()=> { if(confirm('هل تريد حذف هذه الدفعة؟')) { payments.splice(i,1); saveData(); render(filter); } };
    tdActions.appendChild(btnDel);

    const btnEdit = document.createElement('button'); btnEdit.className='action-btn edit'; btnEdit.innerText='تعديل';
    btnEdit.onclick = ()=> { const rows = tbody.querySelectorAll('tr'); if(rows[i]) rows[i].children[1].focus(); };
    tdActions.appendChild(btnEdit);

    tr.appendChild(tdActions);
    tbody.appendChild(tr);

    total += parseFloat(payments[i][1] || 0);
  });

  if(totalEl) totalEl.innerText = formatNumber(total.toFixed(2));
}

// أحداث الأزرار
btnAdd?.addEventListener('click', ()=>{
  payments.push(['', '0', today(), '']);
  saveData(); render(searchInput?.value || '');
  setTimeout(()=> {
    const rows = tbody?.querySelectorAll('tr');
    if(rows && rows.length) rows[rows.length-1].children[1].focus();
  },50);
});

btnSave?.addEventListener('click', ()=>{
  saveData();
  alert('تم حفظ البيانات محليًا');
});

btnImage?.addEventListener('click', ()=>{
  const el = $id('table-wrap');
  if(!el){ alert('لا يمكن أخذ صورة: عنصر الجدول غير موجود'); return; }
  html2canvas(el, {scale:2, useCORS:true}).then(canvas=>{
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'دفتر-الدفعات.png';
    a.click();
  }).catch(err=>{
    console.error('خطأ في html2canvas:', err);
    alert('فشل حفظ الصورة. افتح الكونسل لتفاصيل الخطأ.');
  });
});

// زر الشكر ونافذته
btnThank?.addEventListener('click', () => {
  if(!thankModal) return;
  thankModal.classList.remove('hidden');
  thankModal.setAttribute('aria-hidden', 'false');
});

// إغلاق المودال
modalBackdrop?.addEventListener('click', closeThankModal);
modalClose?.addEventListener('click', closeThankModal);
document.addEventListener('keydown', (e) => { if(e.key === 'Escape') closeThankModal(); });

function closeThankModal(){
  if(!thankModal) return;
  thankModal.classList.add('hidden');
  thankModal.setAttribute('aria-hidden', 'true');
}

// بحث مباشر
searchInput?.addEventListener('input', (e)=> render(e.target.value));

// عرض أولي
render();
