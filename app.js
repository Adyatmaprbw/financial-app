/* ============================================================
   APP STATE
   ============================================================ */
var APP = {
  currentPage: 'dashboard',
  currentMonth: null,
  txnTypeFilter: 'all',
  txnType: 'expense',
  reportTab: 'overview',
  trendChart: null,
  categories: [],
  accounts: []
};

var MONTHS_ID = ['','Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

/* ============================================================
   UTILITIES
   ============================================================ */
function fmt(n) { return 'Rp ' + Math.abs(Number(n)||0).toLocaleString('id-ID'); }
function currentMonthStr() { var d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); }
function todayStr() { var d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function monthLabel(m) { if(!m)return''; var p=m.split('-'); return MONTHS_ID[parseInt(p[1])]+' '+p[0]; }
function shortMonth(m) { if(!m)return''; return MONTHS_ID[parseInt(m.split('-')[1])].substring(0,3); }
function dateLabel(s) {
  var d=new Date(s+'T00:00:00');
  var days=['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  return days[d.getDay()]+', '+d.getDate()+' '+MONTHS_ID[d.getMonth()+1];
}
function getAccountName(id) {
  var a = APP.accounts.find(function(x){return x.ID===id});
  return a ? a.Name : id;
}

/* ============================================================
   CURRENCY INPUT
   ============================================================ */
function initCurrencyInputs() {
  document.querySelectorAll('.currency-input').forEach(function(el) {
    if (el.dataset.initCurrency) return;
    el.dataset.initCurrency = '1';
    el.addEventListener('focus', function() {
      var raw = el.dataset.raw || '';
      el.value = raw;
    });
    el.addEventListener('input', function() {
      var raw = el.value.replace(/\D/g,'');
      el.dataset.raw = raw;
    });
    el.addEventListener('blur', function() {
      var raw = el.dataset.raw || '';
      if (!raw) { el.value = ''; return; }
      el.value = 'Rp ' + parseInt(raw).toLocaleString('id-ID');
    });
  });
}
function getRawValue(el) {
  var raw = el.dataset.raw || el.value.replace(/\D/g,'');
  return parseInt(raw,10) || 0;
}
function setCurrencyValue(id, num) {
  var el = document.getElementById(id);
  if (!el) return;
  var n = Number(num) || 0;
  el.dataset.raw = n > 0 ? String(n) : '';
  el.value = n > 0 ? 'Rp ' + n.toLocaleString('id-ID') : '';
}

/* ============================================================
   TOAST
   ============================================================ */
function showToast(msg, type) {
  type = type || 'success';
  var icons = {
    success:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>',
    error:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    warning:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>',
    info:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
  };
  var el = document.createElement('div');
  el.className = 'toast toast-'+type;
  el.innerHTML = (icons[type]||'') + '<span>'+msg+'</span>';
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(function(){el.style.transition='all .3s';el.style.opacity='0';el.style.transform='translateY(-8px)'},2500);
  setTimeout(function(){el.remove()},3000);
}

/* ============================================================
   MODALS
   ============================================================ */
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
var _confirmCb = null;
function showConfirm(title, text, cb) {
  document.getElementById('dialogTitle').textContent = title;
  document.getElementById('dialogText').textContent = text;
  _confirmCb = cb;
  document.getElementById('confirmDialog').classList.add('open');
}
function closeDialog() { document.getElementById('confirmDialog').classList.remove('open'); _confirmCb = null; }
function confirmAction() { closeDialog(); if (_confirmCb) _confirmCb(); }

/* ============================================================
   NAVIGATION
   ============================================================ */
function navigateTo(page) {
  APP.currentPage = page;
  document.querySelectorAll('.page').forEach(function(p){p.classList.remove('active')});
  document.querySelectorAll('.nav-item').forEach(function(n){n.classList.remove('active')});
  var map = {dashboard:{el:'pageDashboard',nav:0},transactions:{el:'pageTransactions',nav:1},budget:{el:'pageBudget',nav:-1},savinggoals:{el:'pageSavingGoals',nav:-1},reports:{el:'pageReports',nav:2},accounts:{el:'pageAccounts',nav:3}};
  var cfg = map[page]; if(!cfg) return;
  document.getElementById(cfg.el).classList.add('active');
  var navItems = document.querySelectorAll('.nav-item');
  if (cfg.nav >= 0 && navItems[cfg.nav]) navItems[cfg.nav].classList.add('active');
  document.getElementById('appWrapper').scrollTo(0,0);
  if (page==='dashboard') loadDashboard();
  else if (page==='transactions') loadTransactions();
  else if (page==='budget') loadBudgets();
  else if (page==='savinggoals') loadSavingGoals();
  else if (page==='reports') initReportPage();
  else if (page==='accounts') loadAccounts();
}

function changeMonth(delta) {
  var p=APP.currentMonth.split('-');
  var d=new Date(parseInt(p[0]),parseInt(p[1])-1+delta,1);
  APP.currentMonth = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
  loadDashboard();
}

function refreshCurrentPage() {
  navigateTo(APP.currentPage);
}

/* ============================================================
   DASHBOARD
   ============================================================ */
async function loadDashboard() {
  document.getElementById('dashSkeleton').style.display='block';
  document.getElementById('dashContent').style.display='none';
  try {
    var data = await api('getDashboard', {month: APP.currentMonth});
    APP.accounts = data.accounts || [];
    renderDashboard(data);
    document.getElementById('dashSkeleton').style.display='none';
    document.getElementById('dashContent').style.display='block';
  } catch(e) {
    showToast('Gagal memuat dashboard: '+e.message,'error');
    document.getElementById('dashSkeleton').style.display='none';
    document.getElementById('dashContent').style.display='block';
  }
}

function renderDashboard(d) {
  document.getElementById('dashMonth').textContent = monthLabel(d.month);
  document.getElementById('heroBalance').textContent = fmt(d.totalBalance);
  document.getElementById('heroAsset').textContent = fmt(d.totalAsset);
  document.getElementById('sumIncome').textContent = fmt(d.income);
  document.getElementById('sumExpense').textContent = fmt(d.expense);
  document.getElementById('sumPiutang').textContent = fmt(d.debtSummary ? d.debtSummary.totalPiutang : 0);
  document.getElementById('sumCashflow').textContent = fmt(d.cashflow);
  renderDonut(d.categoryBreakdown);
  renderTrendChart(d.trend);
  renderRecentTxns(d.recentTransactions);
  renderDashGoals(d.savingGoals);
}

function renderDonut(cats) {
  var svg=document.getElementById('donutChart');
  var legend=document.getElementById('donutLegend');
  svg.innerHTML=''; legend.innerHTML='';
  if(!cats||!cats.length){document.getElementById('donutEmpty').style.display='block';document.getElementById('donutWrap').style.display='none';return}
  document.getElementById('donutEmpty').style.display='none';
  document.getElementById('donutWrap').style.display='flex';
  var total=cats.reduce(function(s,c){return s+c.amount},0);
  var angle=-90,cx=60,cy=60,r=42,ir=26;
  cats.forEach(function(cat){
    var pct=cat.amount/total,sweep=pct*360;
    if(sweep<1)return;
    var s=angle*Math.PI/180,e=(angle+sweep)*Math.PI/180,la=sweep>180?1:0;
    var path='M'+(cx+r*Math.cos(s))+','+(cy+r*Math.sin(s))+' A'+r+','+r+' 0 '+la+' 1 '+(cx+r*Math.cos(e))+','+(cy+r*Math.sin(e))+' L'+(cx+ir*Math.cos(e))+','+(cy+ir*Math.sin(e))+' A'+ir+','+ir+' 0 '+la+' 0 '+(cx+ir*Math.cos(s))+','+(cy+ir*Math.sin(s))+' Z';
    var el=document.createElementNS('http://www.w3.org/2000/svg','path');
    el.setAttribute('d',path);el.setAttribute('fill',cat.color);el.setAttribute('opacity','0.9');
    svg.appendChild(el);angle+=sweep;
    legend.innerHTML+='<div class="legend-item"><div class="legend-dot" style="background:'+cat.color+'"></div><span class="legend-name">'+cat.name+'</span><span class="legend-pct">'+Math.round(pct*100)+'%</span></div>';
  });
}

function renderTrendChart(trend) {
  if(APP.trendChart)APP.trendChart.destroy();
  var canvas=document.getElementById('trendChart');
  if(!canvas||!trend||!trend.length)return;
  APP.trendChart = new Chart(canvas,{
    type:'bar',
    data:{labels:trend.map(function(t){return shortMonth(t.month)}),datasets:[
      {label:'Income',data:trend.map(function(t){return t.income}),backgroundColor:'rgba(16,185,129,0.7)',borderRadius:6,barPercentage:0.4},
      {label:'Expense',data:trend.map(function(t){return t.expense}),backgroundColor:'rgba(239,68,68,0.7)',borderRadius:6,barPercentage:0.4}
    ]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:true,position:'bottom',labels:{boxWidth:12,font:{family:'Plus Jakarta Sans',size:12}}}},scales:{x:{grid:{display:false}},y:{grid:{color:'#F1F5F9'},ticks:{callback:function(v){return 'Rp '+(v/1e6).toFixed(1)+'jt'}}}}}
  });
}

function renderRecentTxns(txns) {
  var el=document.getElementById('recentTxnList');
  if(!txns||!txns.length){el.innerHTML='<div class="empty-state" style="padding:20px"><p style="font-size:13px;color:var(--text-secondary)">Belum ada transaksi bulan ini</p></div>';return}
  el.innerHTML = txns.map(function(t){
    var isIncome=t.type==='income';
    var bg=(t.color||'#6B7280')+'18';
    return '<div class="txn-item" onclick="editTransaction(\''+t.id+'\')"><div class="txn-icon" style="background:'+bg+'"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="'+(t.color||'#6B7280')+'" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/>'+(isIncome?'<polyline points="8 12 12 8 16 12"/>':'<polyline points="8 12 12 16 16 12"/>')+'</svg></div><div class="txn-info"><div class="txn-cat">'+t.category+'</div><div class="txn-sub">'+(t.subcategory||t.note||'')+'</div></div><div class="txn-right"><div class="txn-amount '+(isIncome?'income':'expense')+'">'+(isIncome?'+':'-')+fmt(t.amount)+'</div><div class="txn-account">'+getAccountName(t.account)+'</div></div></div>';
  }).join('');
}

function renderDashGoals(goals) {
  var el=document.getElementById('dashGoals');
  if(!goals||!goals.length){el.innerHTML='<div class="card" style="padding:16px;text-align:center"><p style="font-size:13px;color:var(--text-secondary)">Belum ada target tabungan</p></div>';return}
  el.innerHTML='<div class="card" style="padding:12px 16px">'+goals.slice(0,3).map(function(g){
    var pct=Math.min(Math.round((Number(g.CurrentAmount)/Math.max(Number(g.TargetAmount),1))*100),100);
    var color=g.Status==='completed'?'var(--success)':'var(--primary)';
    return '<div style="padding:10px 0;border-bottom:1px solid var(--divider)"><div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="font-size:13px;font-weight:600;color:var(--navy)">'+g.Name+'</span><span style="font-size:13px;font-weight:700;color:'+color+'">'+pct+'%</span></div><div class="progress-bar"><div class="progress-fill" style="width:'+pct+'%;background:'+color+'"></div></div><div style="font-size:11px;color:var(--text-secondary);margin-top:4px">'+fmt(g.CurrentAmount)+' / '+fmt(g.TargetAmount)+'</div></div>';
  }).join('')+'</div>';
}

/* ============================================================
   TRANSACTIONS
   ============================================================ */
async function loadTransactions() {
  var month=document.getElementById('txnMonthFilter').value;
  var search=document.getElementById('txnSearch').value;
  var params={type:APP.txnTypeFilter};
  if(month)params.month=month;
  if(search)params.search=search;
  try {
    var txns = await api('getTransactions',params,false);
    renderTransactionList(Array.isArray(txns)?txns:[]);
  } catch(e) { showToast('Gagal memuat: '+e.message,'error'); }
}

function filterTransactions(){loadTransactions()}
function setTxnTypeFilter(el,type){
  APP.txnTypeFilter=type;
  document.querySelectorAll('#pageTransactions .chip').forEach(function(c){c.classList.remove('active')});
  el.classList.add('active');
  loadTransactions();
}

function renderTransactionList(txns) {
  var el=document.getElementById('txnList');
  if(!txns.length){
    el.innerHTML='<div class="empty-state"><h3>Belum ada transaksi</h3><p>Catat pemasukan atau pengeluaran pertamamu</p><button class="btn btn-primary btn-sm" onclick="openTransactionModal()">Tambah Transaksi</button></div>';
    return;
  }
  var groups={};
  txns.forEach(function(t){var d=(t.Date||'').substring(0,10);if(!groups[d])groups[d]=[];groups[d].push(t)});
  el.innerHTML=Object.keys(groups).sort(function(a,b){return b.localeCompare(a)}).map(function(date){
    return '<div class="txn-date-group"><div class="txn-date-label">'+dateLabel(date)+'</div><div class="card" style="padding:4px 16px">'+
      groups[date].map(function(t){
        var isIncome=t.Type==='income',isTransfer=t.Type==='transfer_in'||t.Type==='transfer_out';
        var amtClass=isIncome?'income':(isTransfer?'transfer':'expense');
        var prefix=isIncome?'+':(isTransfer?'↕':'-');
        return '<div class="txn-item" onclick="editTransaction(\''+t.ID+'\')"><div class="txn-icon" style="background:'+(isIncome?'var(--success-light)':(isTransfer?'var(--primary-light)':'var(--danger-light)'))+'"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="'+(isIncome?'var(--success)':(isTransfer?'var(--primary)':'var(--danger)'))+'" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/>'+(isIncome?'<polyline points="8 12 12 8 16 12"/>':'<polyline points="8 12 12 16 16 12"/>')+'</svg></div><div class="txn-info"><div class="txn-cat">'+t.Category+'</div><div class="txn-sub">'+(t.Subcategory||t.Note||'')+'</div></div><div class="txn-right"><div class="txn-amount '+amtClass+'">'+prefix+fmt(t.Amount)+'</div><div class="txn-account">'+getAccountName(t.Account)+'</div></div></div>';
      }).join('')+'</div></div>';
  }).join('');
}

/* ============================================================
   TRANSACTION MODAL
   ============================================================ */
function openTransactionModal(editData) {
  document.getElementById('txnEditId').value='';
  document.getElementById('txnModalTitle').textContent='Tambah Transaksi';
  document.getElementById('txnDate').value=todayStr();
  setCurrencyValue('txnAmount',0);
  setCurrencyValue('txnAdminFee',0);
  document.getElementById('txnSubcategory').value='';
  document.getElementById('txnNote').value='';
  document.getElementById('btnDeleteTxn').style.display='none';
  document.getElementById('btnSplitTxn').style.display='none';
  setTxnType('expense');
  populateFormDropdowns();
  if(editData){
    document.getElementById('txnEditId').value=editData.ID;
    document.getElementById('txnModalTitle').textContent='Edit Transaksi';
    document.getElementById('txnDate').value=(editData.Date||'').substring(0,10);
    setCurrencyValue('txnAmount',editData.Amount);
    setCurrencyValue('txnAdminFee',editData.AdminFee||0);
    document.getElementById('txnSubcategory').value=editData.Subcategory||'';
    document.getElementById('txnNote').value=editData.Note||'';
    document.getElementById('btnDeleteTxn').style.display='flex';
    document.getElementById('btnSplitTxn').style.display='flex';
    setTxnType(editData.Type||'expense');
    setTimeout(function(){
      document.getElementById('txnCategory').value=editData.Category;
      document.getElementById('txnAccount').value=editData.Account;
    },100);
  }
  openModal('modalTransaction');
}

function setTxnType(type){
  APP.txnType=type;
  document.getElementById('chipExpense').classList.toggle('active',type==='expense');
  document.getElementById('chipIncome').classList.toggle('active',type==='income');
  populateCategoryDropdown(type);
}

async function populateFormDropdowns() {
  try {
    var accounts = await api('getAccounts',{},true);
    APP.accounts = accounts||[];
    var sel=document.getElementById('txnAccount');
    sel.innerHTML='<option value="">Pilih akun</option>';
    accounts.forEach(function(a){sel.innerHTML+='<option value="'+a.ID+'">'+a.Name+'</option>'});
  } catch(e){}
  populateCategoryDropdown(APP.txnType);
}

async function populateCategoryDropdown(type) {
  try {
    var cats = await api('getCategories',{type:type},true);
    APP.categories=cats||[];
    var sel=document.getElementById('txnCategory');
    sel.innerHTML='<option value="">Pilih kategori</option>';
    cats.forEach(function(c){sel.innerHTML+='<option value="'+c.Name+'">'+c.Name+'</option>'});
  } catch(e){}
}

async function saveTransaction() {
  var editId=document.getElementById('txnEditId').value;
  var data={
    Date:document.getElementById('txnDate').value,
    Type:APP.txnType,
    Category:document.getElementById('txnCategory').value,
    Subcategory:document.getElementById('txnSubcategory').value,
    Amount:getRawValue(document.getElementById('txnAmount')),
    AdminFee:getRawValue(document.getElementById('txnAdminFee')),
    Account:document.getElementById('txnAccount').value,
    Note:document.getElementById('txnNote').value
  };
  if(!data.Amount||data.Amount<=0)return showToast('Nominal harus lebih dari 0','warning');
  if(!data.Category)return showToast('Kategori wajib diisi','warning');
  if(!data.Account)return showToast('Akun wajib diisi','warning');
  var btn=document.getElementById('btnSaveTxn');
  btn.disabled=true;btn.textContent='Menyimpan...';
  try {
    data.id=editId;
    var action=editId?'updateTransaction':'addTransaction';
    var r=await api(action,data);
    showToast(r.message||'Berhasil!');
    closeModal('modalTransaction');
    refreshCurrentPage();
  } catch(e){showToast(e.message,'error')}
  btn.disabled=false;btn.textContent='Simpan';
}

async function editTransaction(id) {
  try {
    var txns=await api('getTransactions',{},false);
    var t=txns.find(function(x){return x.ID===id});
    if(t)openTransactionModal(t);
  } catch(e){}
}

function deleteTransactionFromModal() {
  var id=document.getElementById('txnEditId').value;
  if(!id)return;
  showConfirm('Hapus Transaksi','Transaksi yang dihapus tidak dapat dikembalikan.',async function(){
    try {
      var r=await api('deleteTransaction',{id:id});
      showToast(r.message||'Berhasil dihapus!');
      closeModal('modalTransaction');
      refreshCurrentPage();
    } catch(e){showToast(e.message,'error')}
  });
}

/* ============================================================
   BUDGET
   ============================================================ */
async function loadBudgets() {
  var month=document.getElementById('budgetMonth').value||currentMonthStr();
  try {
    var budgets=await api('getBudgets',{month:month},true);
    renderBudgetList(budgets||[]);
  } catch(e){showToast('Gagal memuat budget','error')}
}

function renderBudgetList(budgets) {
  var el=document.getElementById('budgetList');
  if(!budgets.length){el.innerHTML='<div class="empty-state"><h3>Belum ada budget</h3><p>Atur anggaran per kategori</p><button class="btn btn-primary btn-sm" onclick="openBudgetModal()">Tambah Budget</button></div>';return}
  el.innerHTML='<div class="card">'+budgets.map(function(b){
    var limit=Number(b.LimitAmount)||1,used=Number(b.UsedAmount)||0;
    var pct=Math.min(Math.round((used/limit)*100),150),barPct=Math.min(pct,100);
    var color=pct<=70?'var(--success)':pct<=90?'var(--warning)':pct<=100?'var(--danger)':'#991B1B';
    return '<div class="budget-item" onclick="deleteBudgetConfirm(\''+b.ID+'\')"><div class="budget-header"><div class="budget-cat"><div class="budget-cat-dot" style="background:'+color+'"></div><div class="budget-cat-name">'+b.Category+'</div></div><span class="budget-pct" style="color:'+color+'">'+pct+'%</span></div><div class="progress-bar"><div class="progress-fill" style="width:'+barPct+'%;background:'+color+'"></div></div><div class="budget-detail"><span>'+fmt(used)+' / '+fmt(limit)+'</span></div></div>';
  }).join('')+'</div>';
}

async function openBudgetModal() {
  document.getElementById('budgetMonthInput').value=document.getElementById('budgetMonth').value||currentMonthStr();
  setCurrencyValue('budgetLimit',0);
  try {
    var cats=await api('getCategories',{type:'expense'},true);
    var sel=document.getElementById('budgetCategory');
    sel.innerHTML='<option value="">Pilih kategori</option>';
    cats.forEach(function(c){sel.innerHTML+='<option value="'+c.Name+'">'+c.Name+'</option>'});
  } catch(e){}
  openModal('modalBudget');
}

async function saveBudget() {
  var data={Month:document.getElementById('budgetMonthInput').value,Category:document.getElementById('budgetCategory').value,LimitAmount:getRawValue(document.getElementById('budgetLimit'))};
  if(!data.Category)return showToast('Kategori wajib dipilih','warning');
  if(!data.LimitAmount)return showToast('Limit harus lebih dari 0','warning');
  try{var r=await api('addBudget',data);showToast('Budget ditambahkan!');closeModal('modalBudget');loadBudgets()}catch(e){showToast(e.message,'error')}
}

function deleteBudgetConfirm(id){
  showConfirm('Hapus Budget','Budget akan dihapus permanen.',async function(){
    try{await api('deleteBudget',{id:id});showToast('Budget dihapus!');loadBudgets()}catch(e){showToast(e.message,'error')}
  });
}

/* ============================================================
   SAVING GOALS
   ============================================================ */
async function loadSavingGoals() {
  try {
    var goals=await api('getSavingGoals',{},true);
    renderGoalList(goals||[]);
  } catch(e){showToast('Gagal memuat saving goals','error')}
}

function renderGoalList(goals) {
  var el=document.getElementById('goalList');
  if(!goals.length){el.innerHTML='<div class="empty-state"><h3>Belum ada target tabungan</h3><p>Buat target untuk mulai menabung!</p><button class="btn btn-primary btn-sm" onclick="openGoalModal()">Tambah Target</button></div>';return}
  el.innerHTML='<div class="card" style="padding:8px 20px">'+goals.map(function(g){
    var pct=Math.min(Math.round((Number(g.CurrentAmount)/Math.max(Number(g.TargetAmount),1))*100),100);
    var color=g.Status==='completed'?'var(--success)':'var(--primary)';
    var dl=g.Deadline?new Date(g.Deadline+'T00:00:00'):null;
    var days=dl?Math.max(0,Math.ceil((dl-new Date())/86400000)):0;
    return '<div class="goal-item"><div class="goal-header"><div class="goal-name">'+g.Name+'</div><div class="goal-pct" style="color:'+color+'">'+pct+'%</div></div><div class="progress-bar"><div class="progress-fill" style="width:'+pct+'%;background:'+color+'"></div></div><div style="display:flex;justify-content:space-between;margin-top:6px"><span style="font-size:12px;color:var(--text-secondary)">'+fmt(g.CurrentAmount)+' / '+fmt(g.TargetAmount)+'</span>'+(dl&&g.Status!=='completed'?'<span style="font-size:12px;color:var(--text-secondary)">'+days+' hari lagi</span>':'')+'</div><div style="display:flex;gap:8px;margin-top:10px"><button class="btn btn-secondary btn-sm" style="flex:1" onclick="openContribModal(\''+g.ID+'\')">Tambah</button><button class="btn-icon" style="width:36px;height:36px" onclick="deleteGoalConfirm(\''+g.ID+'\')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button></div></div>';
  }).join('')+'</div>';
}

function openGoalModal(editData) {
  document.getElementById('goalEditId').value='';
  document.getElementById('goalModalTitle').textContent='Tambah Target Tabungan';
  document.getElementById('goalName').value='';
  setCurrencyValue('goalTarget',0);
  setCurrencyValue('goalCurrent',0);
  document.getElementById('goalDeadline').value='';
  if(editData){document.getElementById('goalEditId').value=editData.ID;document.getElementById('goalModalTitle').textContent='Edit Target';document.getElementById('goalName').value=editData.Name;setCurrencyValue('goalTarget',editData.TargetAmount);setCurrencyValue('goalCurrent',editData.CurrentAmount);document.getElementById('goalDeadline').value=editData.Deadline?editData.Deadline.substring(0,10):''}
  openModal('modalGoal');
}

async function saveGoal() {
  var editId=document.getElementById('goalEditId').value;
  var data={id:editId,Name:document.getElementById('goalName').value,TargetAmount:getRawValue(document.getElementById('goalTarget')),CurrentAmount:getRawValue(document.getElementById('goalCurrent')),Deadline:document.getElementById('goalDeadline').value};
  if(!data.Name)return showToast('Nama target wajib diisi','warning');
  if(!data.TargetAmount)return showToast('Target harus lebih dari 0','warning');
  var action=editId?'updateSavingGoal':'addSavingGoal';
  try{var r=await api(action,data);showToast(r.message||'Berhasil!');closeModal('modalGoal');loadSavingGoals()}catch(e){showToast(e.message,'error')}
}

async function openContribModal(goalId) {
  document.getElementById('contribGoalId').value=goalId;
  document.getElementById('contribDate').value=todayStr();
  setCurrencyValue('contribAmount',0);
  document.getElementById('contribNote').value='';
  try {
    var accounts=await api('getAccounts',{},true);
    var sel=document.getElementById('contribAccount');
    sel.innerHTML='<option value="">Pilih akun (opsional)</option>';
    accounts.forEach(function(a){sel.innerHTML+='<option value="'+a.ID+'">'+a.Name+'</option>'});
  } catch(e){}
  openModal('modalContrib');
}

async function saveContribution() {
  var id=document.getElementById('contribGoalId').value;
  var amount=getRawValue(document.getElementById('contribAmount'));
  var account=document.getElementById('contribAccount').value;
  var note=document.getElementById('contribNote').value;
  var date=document.getElementById('contribDate').value;
  if(!amount)return showToast('Jumlah harus lebih dari 0','warning');
  try {
    await api('addContribution',{id:id,amount:amount});
    if(account){await api('addTransaction',{Date:date,Type:'expense',Category:'Saving Goals',Subcategory:'Kontribusi tabungan',Amount:amount,AdminFee:0,Account:account,Note:note||'Kontribusi saving goal'})}
    showToast('Kontribusi berhasil ditambahkan!');
    closeModal('modalContrib');
    refreshCurrentPage();
  } catch(e){showToast(e.message,'error')}
}

function deleteGoalConfirm(id){showConfirm('Hapus Target','Target yang dihapus tidak dapat dikembalikan.',async function(){try{await api('deleteSavingGoal',{id:id});showToast('Target dihapus!');loadSavingGoals()}catch(e){showToast(e.message,'error')}})}

/* ============================================================
   REPORT
   ============================================================ */
function initReportPage() {
  var now=new Date();
  document.getElementById('reportStart').value=now.getFullYear()+'-01';
  document.getElementById('reportEnd').value=currentMonthStr();
  loadReport();
}
function setReportTab(el,tab){APP.reportTab=tab;document.querySelectorAll('#reportTabs .tab-item').forEach(function(t){t.classList.remove('active')});el.classList.add('active');loadReport()}

async function loadReport() {
  var start=document.getElementById('reportStart').value;
  var end=document.getElementById('reportEnd').value;
  try {
    var data=await api('getReport',{startDate:start?start+'-01':null,endDate:end?end+'-28':null});
    renderReport(data);
  } catch(e){showToast('Gagal memuat laporan','error')}
}

var _reportCharts={};
function renderReport(data) {
  var el=document.getElementById('reportContent');
  Object.values(_reportCharts).forEach(function(c){c.destroy()});_reportCharts={};
  var tab=APP.reportTab;
  if(tab==='overview'){
    el.innerHTML='<div class="report-summary"><div class="report-card"><div class="report-card-label">Total Income</div><div class="report-card-value" style="color:var(--success)">'+fmt(data.totalIncome)+'</div></div><div class="report-card"><div class="report-card-label">Total Expense</div><div class="report-card-value" style="color:var(--danger)">'+fmt(data.totalExpense)+'</div></div><div class="report-card"><div class="report-card-label">Cashflow</div><div class="report-card-value" style="color:var(--primary)">'+fmt(data.cashflow)+'</div></div><div class="report-card"><div class="report-card-label">Saving Rate</div><div class="report-card-value">'+data.savingRate+'%</div></div></div><div class="card"><div style="font-size:16px;font-weight:600;color:var(--navy);margin-bottom:12px">Income vs Expense</div><div class="chart-container"><canvas id="rptBarChart"></canvas></div></div>';
    setTimeout(function(){if(!data.trend||!data.trend.length)return;_reportCharts.bar=new Chart(document.getElementById('rptBarChart'),{type:'bar',data:{labels:data.trend.map(function(t){return shortMonth(t.month)}),datasets:[{label:'Income',data:data.trend.map(function(t){return t.income}),backgroundColor:'rgba(16,185,129,0.75)',borderRadius:6,barPercentage:0.5},{label:'Expense',data:data.trend.map(function(t){return t.expense}),backgroundColor:'rgba(239,68,68,0.75)',borderRadius:6,barPercentage:0.5}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:true,position:'bottom',labels:{boxWidth:12}}},scales:{x:{grid:{display:false}},y:{ticks:{callback:function(v){return 'Rp '+(v/1e6).toFixed(1)+'jt'}}}}}})},100);
  } else if(tab==='category'){
    var html='<div class="card" style="margin-bottom:12px"><div style="font-size:16px;font-weight:600;color:var(--navy);margin-bottom:12px">Pengeluaran</div>';
    if(data.expenseByCategory&&data.expenseByCategory.length){var tot=data.expenseByCategory.reduce(function(s,c){return s+c.amount},0);data.expenseByCategory.forEach(function(c){var p=Math.round((c.amount/tot)*100);html+='<div class="budget-item"><div class="budget-header"><div class="budget-cat"><div class="budget-cat-dot" style="background:'+c.color+'"></div><div class="budget-cat-name">'+c.name+'</div></div><span class="budget-pct">'+p+'%</span></div><div class="progress-bar"><div class="progress-fill" style="width:'+p+'%;background:'+c.color+'"></div></div><div class="budget-detail"><span>'+fmt(c.amount)+'</span></div></div>'})}else html+='<p style="font-size:13px;color:var(--text-secondary);text-align:center;padding:16px">Belum ada data</p>';
    html+='</div>';
    html+='<div class="card"><div style="font-size:16px;font-weight:600;color:var(--navy);margin-bottom:12px">Pemasukan</div>';
    if(data.incomeByCategory&&data.incomeByCategory.length){var tot2=data.incomeByCategory.reduce(function(s,c){return s+c.amount},0);data.incomeByCategory.forEach(function(c){var p=Math.round((c.amount/tot2)*100);html+='<div class="budget-item"><div class="budget-header"><div class="budget-cat"><div class="budget-cat-dot" style="background:'+c.color+'"></div><div class="budget-cat-name">'+c.name+'</div></div><span class="budget-pct">'+p+'%</span></div><div class="progress-bar"><div class="progress-fill" style="width:'+p+'%;background:'+c.color+'"></div></div><div class="budget-detail"><span>'+fmt(c.amount)+'</span></div></div>'})}else html+='<p style="font-size:13px;color:var(--text-secondary);text-align:center;padding:16px">Belum ada data</p>';
    html+='</div>';
    el.innerHTML=html;
  } else {
    el.innerHTML='<div class="card"><div style="font-size:16px;font-weight:600;color:var(--navy);margin-bottom:12px">Tren Cashflow</div><div class="chart-container" style="height:240px"><canvas id="rptTrendChart"></canvas></div></div>';
    setTimeout(function(){if(!data.trend||!data.trend.length)return;_reportCharts.trend=new Chart(document.getElementById('rptTrendChart'),{type:'line',data:{labels:data.trend.map(function(t){return shortMonth(t.month)}),datasets:[{label:'Cashflow',data:data.trend.map(function(t){return t.cashflow}),borderColor:'var(--primary)',backgroundColor:'rgba(37,99,235,0.1)',fill:true,tension:0.4,pointRadius:4,pointBackgroundColor:'var(--primary)',borderWidth:2.5}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{display:false}},y:{ticks:{callback:function(v){return 'Rp '+(v/1e6).toFixed(1)+'jt'}}}}}})},100);
  }
}

/* ============================================================
   ACCOUNTS
   ============================================================ */
async function loadAccounts() {
  try {
    var accounts=await api('getAccounts',{},true);
    APP.accounts=accounts||[];
    renderAccountList(accounts);
  } catch(e){showToast('Gagal memuat akun','error')}
}

function renderAccountList(accounts) {
  var el=document.getElementById('accountList');
  var total=accounts.reduce(function(s,a){return s+Number(a.CurrentBalance)},0);
  var icons={cash:'💵',bank:'🏦',ewallet:'📱',investment:'📈'};
  var html='<div class="card" style="margin-bottom:16px;text-align:center"><div style="font-size:12px;color:var(--text-secondary);margin-bottom:4px">Total Saldo</div><div style="font-size:22px;font-weight:700;color:var(--navy)">'+fmt(total)+'</div></div>';
  html+=accounts.map(function(a){return '<div class="account-item"><div class="account-icon" style="background:'+(a.Color||'#2563EB')+'"><span style="font-size:20px">'+(icons[a.Type]||'💰')+'</span></div><div class="account-info"><div class="account-name">'+a.Name+'</div><div class="account-type">'+a.Type+'</div></div><div style="text-align:right"><div class="account-balance">'+fmt(a.CurrentBalance)+'</div><div style="display:flex;gap:4px;justify-content:flex-end;margin-top:4px"><button class="btn-icon" style="width:28px;height:28px" onclick="event.stopPropagation();openCorrectBalanceModal(\''+a.ID+'\',\''+a.Name+'\','+Number(a.CurrentBalance)+')" title="Koreksi Saldo"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button><button class="btn-icon" style="width:28px;height:28px" onclick="event.stopPropagation();deleteAccountConfirm(\''+a.ID+'\')" title="Hapus"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button></div></div></div>'}).join('');
  html+='<div style="margin-top:24px"><div style="font-size:16px;font-weight:600;color:var(--navy);margin-bottom:12px">Kelola</div>'+
    ['Transfer Antar Akun|openTransferModal()|M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3','Hutang & Piutang|openDebtListModal()|M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 7a4 4 0 100 0','Kelola Kategori|openCategoryListModal()|M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01','Budget|navigateTo("budget")|M2 3h20v18H2z M2 9h20','Saving Goals|navigateTo("savinggoals")|M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z'].map(function(s){
      var p=s.split('|');return '<div class="card" style="display:flex;align-items:center;gap:12px;cursor:pointer;margin-bottom:8px" onclick="'+p[1]+'"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><path d="'+p[2]+'"/></svg><span style="font-size:15px;font-weight:600;color:var(--navy)">'+p[0]+'</span></div>';
    }).join('')+'</div>';
  el.innerHTML=html;
}

async function openAccountModal() {
  document.getElementById('accName').value='';
  document.getElementById('accType').value='cash';
  setCurrencyValue('accBalance',0);
  document.getElementById('accColor').value='#2563EB';
  openModal('modalAccount');
}
async function saveAccount(){
  var data={Name:document.getElementById('accName').value,Type:document.getElementById('accType').value,InitialBalance:getRawValue(document.getElementById('accBalance')),Color:document.getElementById('accColor').value};
  if(!data.Name)return showToast('Nama akun wajib diisi','warning');
  try{await api('addAccount',data);showToast('Akun ditambahkan!');closeModal('modalAccount');loadAccounts()}catch(e){showToast(e.message,'error')}
}
function deleteAccountConfirm(id){showConfirm('Hapus Akun','Akun yang dihapus tidak dapat dikembalikan.',async function(){try{await api('deleteAccount',{id:id});showToast('Akun dihapus!');loadAccounts()}catch(e){showToast(e.message,'error')}})}

/* ============================================================
   TRANSFER
   ============================================================ */
async function openTransferModal() {
  setCurrencyValue('transferAmount',0);
  setCurrencyValue('transferAdminFee',0);
  document.getElementById('transferDate').value=todayStr();
  document.getElementById('transferNote').value='';
  try {
    var accounts=await api('getAccounts',{},true);
    ['transferFrom','transferTo'].forEach(function(id){
      var sel=document.getElementById(id);
      sel.innerHTML='<option value="">Pilih akun</option>';
      accounts.forEach(function(a){sel.innerHTML+='<option value="'+a.ID+'">'+a.Name+'</option>'});
    });
  } catch(e){}
  openModal('modalTransfer');
}
async function saveTransfer(){
  var data={fromAccount:document.getElementById('transferFrom').value,toAccount:document.getElementById('transferTo').value,Amount:getRawValue(document.getElementById('transferAmount')),AdminFee:getRawValue(document.getElementById('transferAdminFee')),Date:document.getElementById('transferDate').value,Note:document.getElementById('transferNote').value};
  if(!data.fromAccount)return showToast('Pilih akun asal','warning');
  if(!data.toAccount)return showToast('Pilih akun tujuan','warning');
  if(data.fromAccount===data.toAccount)return showToast('Akun asal dan tujuan harus berbeda','warning');
  if(!data.Amount)return showToast('Nominal harus lebih dari 0','warning');
  try{var r=await api('transferAccounts',data);showToast(r.message||'Transfer berhasil!');closeModal('modalTransfer');refreshCurrentPage()}catch(e){showToast(e.message,'error')}
}

/* ============================================================
   CATEGORIES
   ============================================================ */
var catTypeSelected='expense';
function setCatType(type){catTypeSelected=type;document.getElementById('catChipExpense').classList.toggle('active',type==='expense');document.getElementById('catChipIncome').classList.toggle('active',type==='income')}

function openCategoryModal(editData) {
  document.getElementById('catEditId').value='';document.getElementById('catModalTitle').textContent='Tambah Kategori';document.getElementById('catName').value='';document.getElementById('catColor').value='#6B7280';setCatType('expense');
  if(editData){document.getElementById('catEditId').value=editData.ID;document.getElementById('catModalTitle').textContent='Edit Kategori';document.getElementById('catName').value=editData.Name;document.getElementById('catColor').value=editData.Color||'#6B7280';setCatType(editData.Type||'expense')}
  openModal('modalCategory');
}
async function saveCategory(){
  var editId=document.getElementById('catEditId').value;
  var data={id:editId,Name:document.getElementById('catName').value,Type:catTypeSelected,Color:document.getElementById('catColor').value};
  if(!data.Name)return showToast('Nama kategori wajib diisi','warning');
  var action=editId?'updateCategory':'addCategory';
  try{await api(action,data);showToast('Berhasil!');closeModal('modalCategory');openCategoryListModal()}catch(e){showToast(e.message,'error')}
}
async function openCategoryListModal(){
  try {
    var cats=await api('getCategories',{},true);
    var el=document.getElementById('categoryListContent');
    if(!cats||!cats.length){el.innerHTML='<p style="text-align:center;font-size:13px;color:var(--text-secondary)">Belum ada kategori</p>';openModal('modalCategoryList');return}
    var html='';
    ['expense','income'].forEach(function(type){
      var filtered=cats.filter(function(c){return c.Type===type});
      if(!filtered.length)return;
      html+='<div style="font-size:12px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.5px;margin:12px 0 8px">'+(type==='expense'?'Pengeluaran':'Pemasukan')+'</div>';
      filtered.forEach(function(c){html+='<div class="cat-item"><div style="width:32px;height:32px;border-radius:50%;background:'+(c.Color||'#6B7280')+';flex-shrink:0"></div><div style="flex:1;font-size:14px;font-weight:600;color:var(--navy);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+c.Name+'</div><div style="display:flex;gap:4px"><button class="btn-icon" style="width:36px;height:36px" onclick="closeModal(\'modalCategoryList\');openCategoryModal({ID:\''+c.ID+'\',Name:\''+c.Name+'\',Type:\''+c.Type+'\',Color:\''+c.Color+'\'})"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button><button class="btn-icon" style="width:36px;height:36px" onclick="deleteCategoryConfirm(\''+c.ID+'\')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button></div></div>'});
    });
    el.innerHTML=html;
    openModal('modalCategoryList');
  } catch(e){showToast(e.message,'error')}
}
function deleteCategoryConfirm(id){showConfirm('Hapus Kategori','Kategori yang dihapus tidak dapat dikembalikan.',async function(){try{await api('deleteCategory',{id:id});showToast('Berhasil dihapus!');openCategoryListModal()}catch(e){showToast(e.message,'error')}})}

/* ============================================================
   DEBTS
   ============================================================ */
async function openDebtListModal(){
  try {
    var debts=await api('getDebts',{},true);
    var el=document.getElementById('debtListContent');
    if(!debts||!debts.length){el.innerHTML='<p style="text-align:center;font-size:13px;color:var(--text-secondary);padding:16px">Belum ada hutang/piutang</p>';openModal('modalDebtList');return}
    var html='';
    ['piutang','hutang'].forEach(function(type){
      var filtered=debts.filter(function(d){return d.Type===type&&d.Status==='active'});
      if(!filtered.length)return;
      html+='<div style="font-size:12px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;margin:12px 0 8px">'+(type==='hutang'?'Hutang (Aku berhutang)':'Piutang (Mereka berhutang)')+'</div>';
      filtered.forEach(function(d){
        var rem=Number(d.Remaining)||0,tot=Number(d.Amount)||1,pct=Math.round(((tot-rem)/tot)*100);
        var color=type==='hutang'?'var(--danger)':'var(--success)';
        html+='<div style="padding:12px 0;border-bottom:1px solid var(--divider)"><div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size:14px;font-weight:600;color:var(--navy)">'+d.Person+'</span><span style="font-size:14px;font-weight:700;color:'+color+'">'+fmt(rem)+'</span></div><div class="progress-bar" style="margin-bottom:6px"><div class="progress-fill" style="width:'+pct+'%;background:'+color+'"></div></div><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-size:11px;color:var(--text-secondary)">'+(d.Note||'')+' · Terbayar '+pct+'%</span><div style="display:flex;gap:4px"><button class="btn btn-secondary btn-sm" style="padding:6px 12px;min-height:32px;font-size:12px" onclick="openPayDebtModal(\''+d.ID+'\','+rem+')">Bayar</button><button class="btn-icon" style="width:32px;height:32px" onclick="deleteDebtConfirm(\''+d.ID+'\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/></svg></button></div></div></div>';
      });
    });
    var paid=debts.filter(function(d){return d.Status==='paid'});
    if(paid.length)html+='<div style="font-size:12px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;margin:16px 0 8px">Lunas ('+paid.length+')</div>'+paid.map(function(d){return '<div style="padding:8px 0;border-bottom:1px solid var(--divider);opacity:0.5;font-size:13px">'+d.Person+' — '+fmt(d.Amount)+'</div>'}).join('');
    el.innerHTML=html;
    openModal('modalDebtList');
  } catch(e){showToast(e.message,'error')}
}

function openDebtModal(type){document.getElementById('debtType').value=type;document.getElementById('debtModalTitle').textContent=type==='hutang'?'Tambah Hutang':'Tambah Piutang';document.getElementById('debtPerson').value='';setCurrencyValue('debtAmount',0);document.getElementById('debtDueDate').value='';document.getElementById('debtNote').value='';openModal('modalDebt')}
async function saveDebt(){
  var data={Type:document.getElementById('debtType').value,Person:document.getElementById('debtPerson').value,Amount:getRawValue(document.getElementById('debtAmount')),DueDate:document.getElementById('debtDueDate').value,Note:document.getElementById('debtNote').value};
  if(!data.Person)return showToast('Nama orang wajib diisi','warning');
  if(!data.Amount)return showToast('Jumlah harus lebih dari 0','warning');
  try{var r=await api('addDebt',data);showToast(r.message||'Berhasil!');closeModal('modalDebt');openDebtListModal()}catch(e){showToast(e.message,'error')}
}

function openPayDebtModal(id,remaining){document.getElementById('payDebtId').value=id;setCurrencyValue('payDebtAmount',remaining);closeModal('modalDebtList');openModal('modalPayDebt')}
async function submitPayDebt(){
  var id=document.getElementById('payDebtId').value,amount=getRawValue(document.getElementById('payDebtAmount'));
  if(!amount)return showToast('Jumlah harus lebih dari 0','warning');
  try{var r=await api('payDebt',{id:id,amount:amount});showToast(r.message||'Berhasil!');closeModal('modalPayDebt');openDebtListModal()}catch(e){showToast(e.message,'error')}
}
function deleteDebtConfirm(id){showConfirm('Hapus Data','Data ini akan dihapus permanen.',async function(){try{await api('deleteDebt',{id:id});showToast('Berhasil dihapus!');openDebtListModal()}catch(e){showToast(e.message,'error')}})}

/* ============================================================
   SPLIT
   ============================================================ */
function openSplitFromModal(){
  var txnId=document.getElementById('txnEditId').value;if(!txnId)return;
  document.getElementById('splitTxnId').value=txnId;
  document.getElementById('splitEntries').innerHTML=splitEntryHTML();
  closeModal('modalTransaction');openModal('modalSplit');
}
function splitEntryHTML(){return '<div class="split-entry" style="display:flex;gap:8px;margin-bottom:10px"><input type="text" class="form-input" placeholder="Nama" style="flex:1;height:44px;min-width:0"><input type="text" class="form-input" placeholder="Rp 0" inputmode="numeric" style="flex:1;height:44px;min-width:0" oninput="formatSplitAmt(this)" onblur="blurSplitAmt(this)" onfocus="focusSplitAmt(this)"></div>'}
function addSplitEntry(){document.getElementById('splitEntries').insertAdjacentHTML('beforeend',splitEntryHTML())}
function focusSplitAmt(el){el.value=el.dataset.raw||''}
function blurSplitAmt(el){var r=el.value.replace(/\D/g,'');el.dataset.raw=r;el.value=r?'Rp '+parseInt(r).toLocaleString('id-ID'):''}
function formatSplitAmt(el){el.dataset.raw=el.value.replace(/\D/g,'')}
async function saveSplit(){
  var txnId=document.getElementById('splitTxnId').value;
  var splits=[];
  document.querySelectorAll('#splitEntries .split-entry').forEach(function(e){
    var inputs=e.querySelectorAll('input');
    var person=inputs[0].value.trim(),amount=parseInt(inputs[1].dataset.raw||'0',10)||0;
    if(person&&amount>0)splits.push({person:person,amount:amount});
  });
  if(!splits.length)return showToast('Tambahkan minimal 1 orang','warning');
  try{var r=await api('splitTransaction',{txnId:txnId,splits:splits});showToast(r.message||'Split berhasil!');closeModal('modalSplit');refreshCurrentPage()}catch(e){showToast(e.message,'error')}
}

/* ============================================================
   BALANCE CORRECTION
   ============================================================ */
function openCorrectBalanceModal(accId,accName,cur){
  document.getElementById('correctAccId').value=accId;
  document.getElementById('correctAccName').textContent=accName+' — Saldo saat ini: '+fmt(cur);
  setCurrencyValue('correctBalance',cur);
  openModal('modalCorrectBalance');
}
async function submitCorrectBalance(){
  var id=document.getElementById('correctAccId').value;
  var el=document.getElementById('correctBalance');
  var raw=el.dataset.raw!==undefined?el.dataset.raw:el.value.replace(/\D/g,'');
  var balance=parseInt(raw,10)||0;
  try{var r=await api('correctBalance',{id:id,balance:balance});showToast(r.message||'Saldo dikoreksi!');closeModal('modalCorrectBalance');loadAccounts()}catch(e){showToast(e.message,'error')}
}

/* ============================================================
   EXPORT
   ============================================================ */
async function exportCSV(){
  try {
    var month=document.getElementById('txnMonthFilter').value;
    var r=await api('exportCSV',month?{month:month}:{});
    if(!r.csv)return showToast('Tidak ada data','warning');
    var blob=new Blob([r.csv],{type:'text/csv;charset=utf-8;'});
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a');a.href=url;a.download='transaksi_'+(month||'all')+'.csv';a.click();
    URL.revokeObjectURL(url);
    showToast('File CSV berhasil didownload!');
  } catch(e){showToast(e.message,'error')}
}

/* ============================================================
   MODALS HTML
   ============================================================ */
document.getElementById('modalsContainer').innerHTML = `
<div class="modal-overlay" id="modalTransaction">
  <div class="modal-sheet">
    <div class="modal-handle"></div>
    <div class="modal-header">
      <div class="modal-title" id="txnModalTitle">Tambah Transaksi</div>
      <button class="btn-icon" onclick="closeModal('modalTransaction')"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
    </div>
    <input type="hidden" id="txnEditId">
    <div class="chip-group" style="margin-bottom:20px">
      <button class="chip active" id="chipExpense" onclick="setTxnType('expense')">Expense</button>
      <button class="chip" id="chipIncome" onclick="setTxnType('income')">Income</button>
    </div>
    <div class="form-group"><label class="form-label">Tanggal</label><input type="date" class="form-input" id="txnDate"></div>
    <div class="form-group"><label class="form-label">Kategori</label><select class="form-input" id="txnCategory"></select></div>
    <div class="form-group"><label class="form-label">Sub Kategori</label><input type="text" class="form-input" id="txnSubcategory" placeholder="Opsional"></div>
    <div class="form-group"><label class="form-label">Nominal</label><input type="text" class="form-input currency-input" id="txnAmount" placeholder="Rp 0" inputmode="numeric"></div>
    <div class="form-group"><label class="form-label">Biaya Admin (opsional)</label><input type="text" class="form-input currency-input" id="txnAdminFee" placeholder="Rp 0" inputmode="numeric"></div>
    <div class="form-group"><label class="form-label">Akun</label><select class="form-input" id="txnAccount"></select></div>
    <div class="form-group"><label class="form-label">Catatan (opsional)</label><textarea class="form-input" id="txnNote" rows="2" placeholder="Opsional"></textarea></div>
    <button class="btn btn-primary btn-block" id="btnSaveTxn" onclick="saveTransaction()">Simpan</button>
    <button class="btn btn-secondary btn-block" id="btnSplitTxn" onclick="openSplitFromModal()" style="display:none;margin-top:8px">Split Transaksi</button>
    <button class="btn btn-danger btn-block" id="btnDeleteTxn" onclick="deleteTransactionFromModal()" style="display:none;margin-top:8px">Hapus Transaksi</button>
  </div>
</div>
<div class="modal-overlay" id="modalBudget"><div class="modal-sheet"><div class="modal-handle"></div><div class="modal-header"><div class="modal-title">Tambah Budget</div><button class="btn-icon" onclick="closeModal('modalBudget')"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>
<div class="form-group"><label class="form-label">Bulan</label><input type="month" class="form-input" id="budgetMonthInput"></div>
<div class="form-group"><label class="form-label">Kategori</label><select class="form-input" id="budgetCategory"></select></div>
<div class="form-group"><label class="form-label">Limit</label><input type="text" class="form-input currency-input" id="budgetLimit" placeholder="Rp 0" inputmode="numeric"></div>
<button class="btn btn-primary btn-block" onclick="saveBudget()">Simpan</button></div></div>
<div class="modal-overlay" id="modalGoal"><div class="modal-sheet"><div class="modal-handle"></div><div class="modal-header"><div class="modal-title" id="goalModalTitle">Tambah Target</div><button class="btn-icon" onclick="closeModal('modalGoal')"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>
<input type="hidden" id="goalEditId">
<div class="form-group"><label class="form-label">Nama Target</label><input type="text" class="form-input" id="goalName" placeholder="Contoh: Laptop Baru"></div>
<div class="form-group"><label class="form-label">Target</label><input type="text" class="form-input currency-input" id="goalTarget" placeholder="Rp 0" inputmode="numeric"></div>
<div class="form-group"><label class="form-label">Terkumpul</label><input type="text" class="form-input currency-input" id="goalCurrent" placeholder="Rp 0" inputmode="numeric"></div>
<div class="form-group"><label class="form-label">Deadline</label><input type="date" class="form-input" id="goalDeadline"></div>
<button class="btn btn-primary btn-block" onclick="saveGoal()">Simpan</button></div></div>
<div class="modal-overlay" id="modalContrib"><div class="modal-sheet"><div class="modal-handle"></div><div class="modal-header"><div class="modal-title">Tambah Kontribusi</div><button class="btn-icon" onclick="closeModal('modalContrib')"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>
<input type="hidden" id="contribGoalId">
<div class="form-group"><label class="form-label">Tanggal</label><input type="date" class="form-input" id="contribDate"></div>
<div class="form-group"><label class="form-label">Jumlah</label><input type="text" class="form-input currency-input" id="contribAmount" placeholder="Rp 0" inputmode="numeric"></div>
<div class="form-group"><label class="form-label">Dari Akun</label><select class="form-input" id="contribAccount"><option value="">Pilih akun (opsional)</option></select></div>
<div class="form-group"><label class="form-label">Catatan</label><input type="text" class="form-input" id="contribNote" placeholder="Opsional"></div>
<button class="btn btn-primary btn-block" onclick="saveContribution()">Simpan</button></div></div>
<div class="modal-overlay" id="modalAccount"><div class="modal-sheet"><div class="modal-handle"></div><div class="modal-header"><div class="modal-title">Tambah Akun</div><button class="btn-icon" onclick="closeModal('modalAccount')"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>
<div class="form-group"><label class="form-label">Nama Akun</label><input type="text" class="form-input" id="accName" placeholder="Contoh: BCA"></div>
<div class="form-group"><label class="form-label">Tipe</label><select class="form-input" id="accType"><option value="cash">Cash</option><option value="bank">Bank</option><option value="ewallet">E-Wallet</option><option value="investment">Investasi</option></select></div>
<div class="form-group"><label class="form-label">Saldo Awal</label><input type="text" class="form-input currency-input" id="accBalance" placeholder="Rp 0" inputmode="numeric"></div>
<div class="form-group"><label class="form-label">Warna</label><input type="color" class="form-input" id="accColor" value="#2563EB" style="height:52px;padding:8px"></div>
<button class="btn btn-primary btn-block" onclick="saveAccount()">Simpan</button></div></div>
<div class="modal-overlay" id="modalTransfer"><div class="modal-sheet"><div class="modal-handle"></div><div class="modal-header"><div class="modal-title">Transfer Antar Akun</div><button class="btn-icon" onclick="closeModal('modalTransfer')"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>
<div class="form-group"><label class="form-label">Dari Akun</label><select class="form-input" id="transferFrom"></select></div>
<div class="form-group"><label class="form-label">Ke Akun</label><select class="form-input" id="transferTo"></select></div>
<div class="form-group"><label class="form-label">Nominal</label><input type="text" class="form-input currency-input" id="transferAmount" placeholder="Rp 0" inputmode="numeric"></div>
<div class="form-group"><label class="form-label">Biaya Admin (opsional)</label><input type="text" class="form-input currency-input" id="transferAdminFee" placeholder="Rp 0" inputmode="numeric"></div>
<div class="form-group"><label class="form-label">Tanggal</label><input type="date" class="form-input" id="transferDate"></div>
<div class="form-group"><label class="form-label">Catatan</label><input type="text" class="form-input" id="transferNote" placeholder="Opsional"></div>
<button class="btn btn-primary btn-block" onclick="saveTransfer()">Transfer</button></div></div>
<div class="modal-overlay" id="modalCategory"><div class="modal-sheet"><div class="modal-handle"></div><div class="modal-header"><div class="modal-title" id="catModalTitle">Tambah Kategori</div><button class="btn-icon" onclick="closeModal('modalCategory')"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>
<input type="hidden" id="catEditId">
<div class="chip-group" style="margin-bottom:16px"><button class="chip active" id="catChipExpense" onclick="setCatType('expense')">Expense</button><button class="chip" id="catChipIncome" onclick="setCatType('income')">Income</button></div>
<div class="form-group"><label class="form-label">Nama</label><input type="text" class="form-input" id="catName" placeholder="Contoh: Makan"></div>
<div class="form-group"><label class="form-label">Warna</label><input type="color" class="form-input" id="catColor" value="#6B7280" style="height:52px;padding:8px"></div>
<button class="btn btn-primary btn-block" onclick="saveCategory()">Simpan</button></div></div>
<div class="modal-overlay" id="modalCategoryList"><div class="modal-sheet"><div class="modal-handle"></div><div class="modal-header"><div class="modal-title">Kelola Kategori</div><button class="btn-icon" onclick="closeModal('modalCategoryList')"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>
<button class="btn btn-secondary btn-block btn-sm" onclick="closeModal('modalCategoryList');openCategoryModal()" style="margin-bottom:16px">+ Tambah Kategori</button>
<div id="categoryListContent"></div></div></div>
<div class="modal-overlay" id="modalDebtList"><div class="modal-sheet"><div class="modal-handle"></div><div class="modal-header"><div class="modal-title">Hutang & Piutang</div><button class="btn-icon" onclick="closeModal('modalDebtList')"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>
<div style="display:flex;gap:8px;margin-bottom:16px"><button class="btn btn-secondary btn-sm" style="flex:1" onclick="closeModal('modalDebtList');openDebtModal('hutang')">+ Hutang</button><button class="btn btn-secondary btn-sm" style="flex:1" onclick="closeModal('modalDebtList');openDebtModal('piutang')">+ Piutang</button></div>
<div id="debtListContent"></div></div></div>
<div class="modal-overlay" id="modalDebt"><div class="modal-sheet"><div class="modal-handle"></div><div class="modal-header"><div class="modal-title" id="debtModalTitle">Tambah Hutang</div><button class="btn-icon" onclick="closeModal('modalDebt')"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>
<input type="hidden" id="debtType" value="hutang">
<div class="form-group"><label class="form-label">Nama Orang</label><input type="text" class="form-input" id="debtPerson" placeholder="Contoh: Andi"></div>
<div class="form-group"><label class="form-label">Jumlah</label><input type="text" class="form-input currency-input" id="debtAmount" placeholder="Rp 0" inputmode="numeric"></div>
<div class="form-group"><label class="form-label">Jatuh Tempo</label><input type="date" class="form-input" id="debtDueDate"></div>
<div class="form-group"><label class="form-label">Catatan</label><input type="text" class="form-input" id="debtNote" placeholder="Opsional"></div>
<button class="btn btn-primary btn-block" onclick="saveDebt()">Simpan</button></div></div>
<div class="modal-overlay" id="modalPayDebt"><div class="modal-sheet"><div class="modal-handle"></div><div class="modal-header"><div class="modal-title">Bayar / Terima</div><button class="btn-icon" onclick="closeModal('modalPayDebt')"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>
<input type="hidden" id="payDebtId">
<div class="form-group"><label class="form-label">Jumlah Dibayar</label><input type="text" class="form-input currency-input" id="payDebtAmount" placeholder="Rp 0" inputmode="numeric"></div>
<button class="btn btn-primary btn-block" onclick="submitPayDebt()">Bayar</button></div></div>
<div class="modal-overlay" id="modalSplit"><div class="modal-sheet"><div class="modal-handle"></div><div class="modal-header"><div class="modal-title">Split Transaksi</div><button class="btn-icon" onclick="closeModal('modalSplit')"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>
<input type="hidden" id="splitTxnId">
<p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px">Tambahkan orang yang ikut patungan. Otomatis dicatat sebagai piutang.</p>
<div id="splitEntries"></div>
<button class="btn btn-ghost btn-sm" onclick="addSplitEntry()" style="margin-bottom:16px">+ Tambah orang</button>
<button class="btn btn-primary btn-block" onclick="saveSplit()">Simpan Split</button></div></div>
<div class="modal-overlay" id="modalCorrectBalance"><div class="modal-sheet"><div class="modal-handle"></div><div class="modal-header"><div class="modal-title">Koreksi Saldo</div><button class="btn-icon" onclick="closeModal('modalCorrectBalance')"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>
<input type="hidden" id="correctAccId">
<p class="form-label" id="correctAccName" style="margin-bottom:16px;font-size:13px;color:var(--text-secondary)"></p>
<div class="form-group"><label class="form-label">Saldo Sebenarnya</label><input type="text" class="form-input currency-input" id="correctBalance" placeholder="Rp 0" inputmode="numeric"></div>
<button class="btn btn-primary btn-block" onclick="submitCorrectBalance()">Koreksi</button></div></div>
<div class="dialog-overlay" id="confirmDialog"><div class="dialog"><div class="dialog-title" id="dialogTitle">Konfirmasi</div><div class="dialog-text" id="dialogText"></div><div class="dialog-actions"><button class="btn btn-ghost btn-sm" onclick="closeDialog()">Batal</button><button class="btn btn-danger btn-sm" onclick="confirmAction()">Hapus</button></div></div></div>
`;

// Close modal on overlay click
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('open');
});

/* ============================================================
   INIT
   ============================================================ */
async function initApp() {
  APP.currentMonth = currentMonthStr();
  document.getElementById('txnMonthFilter').value = APP.currentMonth;
  document.getElementById('budgetMonth').value = APP.currentMonth;
  initCurrencyInputs();
  await loadDashboard();
}

window.addEventListener('DOMContentLoaded', function() {
  if (!initAPI()) return;
  initApp();
});
