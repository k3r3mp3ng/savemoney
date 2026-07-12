// ==================== APP STATE ====================
const APP = {
    googleSheetUrl: localStorage.getItem('gsUrl') || '',
    transactions: JSON.parse(localStorage.getItem('txData') || '[]'),
    goals: JSON.parse(localStorage.getItem('goalData') || '[]'),
    currentPage: 'dashboard',
};

// Default sample data if empty
function initSampleData() {
    if (APP.transactions.length === 0) {
        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth();
        APP.transactions = [
            { id: 'tx1', date: `${y}-${String(m+1).padStart(2,'0')}-05`, type: 'Income', category: 'Gaji', amount: 8000000, desc: 'Gaji bulanan' },
            { id: 'tx2', date: `${y}-${String(m+1).padStart(2,'0')}-08`, type: 'Expense', category: 'Makanan', amount: 450000, desc: 'Makan siang & ngopi' },
            { id: 'tx3', date: `${y}-${String(m+1).padStart(2,'0')}-10`, type: 'Expense', category: 'Transport', amount: 300000, desc: 'Bensin & parkir' },
            { id: 'tx4', date: `${y}-${String(m+1).padStart(2,'0')}-12`, type: 'Expense', category: 'Tagihan', amount: 1200000, desc: 'Listrik & internet' },
            { id: 'tx5', date: `${y}-${String(m+1).padStart(2,'0')}-15`, type: 'Expense', category: 'Belanja', amount: 750000, desc: 'Belanja bulanan' },
            { id: 'tx6', date: `${y}-${String(m-1).padStart(2,'0')}-28`, type: 'Income', category: 'Freelance', amount: 2500000, desc: 'Project sampingan' },
        ];
        saveLocal();
    }
    if (APP.goals.length === 0) {
        const nextYear = new Date().getFullYear() + 1;
        APP.goals = [
            { id: 'g1', name: 'Liburan Bali', target: 15000000, current: 4500000, deadline: `${nextYear}-06-30`, icon: '🏖️' },
            { id: 'g2', name: 'Dana Darurat', target: 20000000, current: 8000000, deadline: `${nextYear}-12-31`, icon: '🛡️' },
        ];
        saveLocal();
    }
}

function saveLocal() {
    localStorage.setItem('txData', JSON.stringify(APP.transactions));
    localStorage.setItem('goalData', JSON.stringify(APP.goals));
}

function generateId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
}

// ==================== NAVIGATION ====================
function navigateTo(page) {
    APP.currentPage = page;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.sidebar nav a').forEach(a => a.classList.remove('active'));
    const pageEl = document.getElementById('page-' + page);
    if (pageEl) pageEl.classList.add('active');
    const navLink = document.querySelector(`.sidebar nav a[data-page="${page}"]`);
    if (navLink) navLink.classList.add('active');
    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('sidebarOverlay').classList.remove('show');
    }
    // Refresh page content
    if (page === 'dashboard') refreshDashboard();
    if (page === 'transactions') { populateFilterMonths(); renderTransactions(); }
    if (page === 'goals') renderGoals();
    if (page === 'settings') updateSettingsUI();
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const isOpen = sidebar.classList.contains('open');
    if (isOpen) {
        sidebar.classList.remove('open');
        overlay.classList.remove('show');
    } else {
        sidebar.classList.add('open');
        overlay.classList.add('show');
    }
}

// ==================== TOAST ====================
function showToast(msg, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 2800);
}

// ==================== CONFETTI ====================
function triggerConfetti() {
    const colors = ['#f43f5e', '#f59e0b', '#10b981', '#6366f1', '#ec4899', '#14b8a6', '#f97316', '#8b5cf6'];
    for (let i = 0; i < 60; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left = Math.random() * 100 + '%';
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
        piece.style.animationDuration = (2 + Math.random() * 3) + 's';
        piece.style.animationDelay = Math.random() * 0.8 + 's';
        piece.style.width = (8 + Math.random() * 14) + 'px';
        piece.style.height = (8 + Math.random() * 14) + 'px';
        document.body.appendChild(piece);
        setTimeout(() => piece.remove(), 3500);
    }
}

// ==================== FORMAT HELPERS ====================
function formatRupiah(num) {
    if (num === undefined || num === null) return 'Rp 0';
    const n = Math.round(Number(num));
    return 'Rp ' + n.toLocaleString('id-ID');
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${parseInt(parts[2])} ${months[parseInt(parts[1])-1]} ${parts[0]}`;
}

function getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
}

// ==================== DASHBOARD ====================
function refreshDashboard() {
    const currentMonth = getCurrentMonth();
    const monthTx = APP.transactions.filter(t => t.date.startsWith(currentMonth));
    const totalIncome = monthTx.filter(t => t.type === 'Income').reduce((s, t) => s + Number(t.amount), 0);
    const totalExpense = monthTx.filter(t => t.type === 'Expense').reduce((s, t) => s + Number(t.amount), 0);
    const allIncome = APP.transactions.filter(t => t.type === 'Income').reduce((s, t) => s + Number(t.amount), 0);
    const allExpense = APP.transactions.filter(t => t.type === 'Expense').reduce((s, t) => s + Number(t.amount), 0);
    const balance = allIncome - allExpense;

    document.getElementById('dashBalance').textContent = formatRupiah(balance);
    document.getElementById('dashIncome').textContent = formatRupiah(totalIncome);
    document.getElementById('dashExpense').textContent = formatRupiah(totalExpense);

    // Holiday goal progress (first goal or holiday-related)
    const holidayGoal = APP.goals.find(g => g.name.toLowerCase().includes('libur') || g.name.toLowerCase().includes('holiday') || g.icon === '🏖️') || APP.goals[0];
    if (holidayGoal) {
        const pct = Math.min(100, Math.round((holidayGoal.current / holidayGoal.target) * 100));
        document.getElementById('dashGoalProgress').textContent = pct + '%';
        document.getElementById('dashGoalSub').textContent = `${formatRupiah(holidayGoal.current)} / ${formatRupiah(holidayGoal.target)} - ${holidayGoal.name}`;
    } else {
        document.getElementById('dashGoalProgress').textContent = '0%';
        document.getElementById('dashGoalSub').textContent = 'Belum ada target';
    }
    // Render chart
    renderChart();
}

function renderChart() {
    const container = document.getElementById('chartContainer');
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
    }
    const data = months.map(m => {
        const tx = APP.transactions.filter(t => t.date.startsWith(m));
        return {
            month: m,
            income: tx.filter(t => t.type === 'Income').reduce((s, t) => s + Number(t.amount), 0),
            expense: tx.filter(t => t.type === 'Expense').reduce((s, t) => s + Number(t.amount), 0),
        };
    });
    const maxVal = Math.max(1, ...data.map(d => Math.max(d.income, d.expense)));
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    container.innerHTML = data.map(d => {
        const mIndex = parseInt(d.month.split('-')[1]) - 1;
        const incomeH = (d.income / maxVal) * 140;
        const expenseH = (d.expense / maxVal) * 140;
        return `
        <div style="flex:1;text-align:center;display:flex;flex-direction:column;align-items:center;gap:4px;">
            <div style="display:flex;gap:4px;align-items:flex-end;height:150px;">
                <div title="Pemasukan: ${formatRupiah(d.income)}" style="width:22px;height:${Math.max(2,incomeH)}px;background:linear-gradient(180deg,#10b981,#059669);border-radius:6px 6px 0 0;transition:height 0.5s ease;min-height:2px;"></div>
                <div title="Pengeluaran: ${formatRupiah(d.expense)}" style="width:22px;height:${Math.max(2,expenseH)}px;background:linear-gradient(180deg,#f43f5e,#e11d48);border-radius:6px 6px 0 0;transition:height 0.5s ease;min-height:2px;"></div>
            </div>
            <span style="font-size:0.7rem;color:#64748b;font-weight:600;">${monthLabels[mIndex]}</span>
        </div>`;
    }).join('');
    // Legend
    container.insertAdjacentHTML('beforeend', `
        <div style="display:flex;gap:16px;align-items:center;margin-left:12px;font-size:0.78rem;">
            <span>🟢 Pemasukan</span><span>🔴 Pengeluaran</span>
        </div>`);
}

// ==================== TRANSACTIONS ====================
function populateFilterMonths() {
    const monthsSet = new Set();
    APP.transactions.forEach(t => { if (t.date && t.date.length >= 7) monthsSet.add(t.date.substring(0, 7)); });
    const select = document.getElementById('filterMonth');
    const currentVal = select.value;
    select.innerHTML = '<option value="all">Semua Bulan</option>';
    [...monthsSet].sort().reverse().forEach(m => {
        const [y, mo] = m.split('-');
        const label = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][parseInt(mo)-1] + ' ' + y;
        select.innerHTML += `<option value="${m}">${label}</option>`;
    });
    select.value = currentVal;
}

function renderTransactions() {
    const filterMonth = document.getElementById('filterMonth').value;
    const filterType = document.getElementById('filterType').value;
    let filtered = [...APP.transactions];
    if (filterMonth !== 'all') filtered = filtered.filter(t => t.date.startsWith(filterMonth));
    if (filterType !== 'all') filtered = filtered.filter(t => t.type === filterType);
    filtered.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

    const tbody = document.getElementById('txTableBody');
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><div class="empty-icon">📭</div>Tidak ada transaksi</td></tr>';
        return;
    }
    tbody.innerHTML = filtered.map(t => `
        <tr>
            <td>${formatDate(t.date)}</td>
            <td><span class="badge ${t.type==='Income'?'badge-income':'badge-expense'}">${t.type==='Income'?'💰 Masuk':'💸 Keluar'}</span></td>
            <td>${t.category}</td>
            <td>${t.desc || '-'}</td>
            <td class="${t.type==='Income'?'amount-income':'amount-expense'}">${t.type==='Income'?'+':'-'} ${formatRupiah(t.amount)}</td>
            <td><button class="btn btn-danger btn-xs" onclick="deleteTransaction('${t.id}')">🗑️ Hapus</button></td>
        </tr>
    `).join('');
}

function addTransaction() {
    const date = document.getElementById('txDate').value;
    const type = document.getElementById('txType').value;
    const category = document.getElementById('txCategory').value;
    const amount = parseFloat(document.getElementById('txAmount').value);
    const desc = document.getElementById('txDesc').value.trim();

    if (!date) return showToast('⚠️ Pilih tanggal dulu ya!', 'error');
    if (!amount || amount <= 0) return showToast('⚠️ Masukkan jumlah yang valid!', 'error');

    let finalCategory = category;
    if (type === 'Income' && !['Gaji', 'Freelance', 'Bonus'].includes(category)) finalCategory = 'Gaji';
    if (type === 'Expense' && ['Gaji', 'Freelance', 'Bonus'].includes(category)) finalCategory = 'Lainnya';

    const tx = {
        id: generateId(),
        date,
        type,
        category: finalCategory,
        amount,
        desc: desc || (type === 'Income' ? 'Pemasukan' : 'Pengeluaran'),
    };
    APP.transactions.push(tx);
    saveLocal();
    syncToSheets();
    document.getElementById('txAmount').value = '';
    document.getElementById('txDesc').value = '';
    populateFilterMonths();
    renderTransactions();
    refreshDashboard();
    showToast('✅ Transaksi berhasil disimpan!');
}

function deleteTransaction(id) {
    if (!confirm('Yakin hapus transaksi ini?')) return;
    APP.transactions = APP.transactions.filter(t => t.id !== id);
    saveLocal();
    syncToSheets();
    populateFilterMonths();
    renderTransactions();
    refreshDashboard();
    showToast('🗑️ Transaksi dihapus!');
}

// ==================== GOALS ====================
function renderGoals() {
    const grid = document.getElementById('goalsGrid');
    if (APP.goals.length === 0) {
        grid.innerHTML = '<p style="color:#94a3b8;grid-column:1/-1;">Belum ada target tabungan. Yuk buat satu! 🚀</p>';
        return;
    }
    grid.innerHTML = APP.goals.map(g => {
        const pct = Math.min(100, Math.round((g.current / g.target) * 100));
        let barClass = '';
        if (pct >= 100) barClass = 'complete';
        else if (pct >= 70) barClass = 'near-complete';
        const remaining = Math.max(0, g.target - g.current);
        return `
        <div class="goal-card">
            <div class="goal-header">
                <div class="goal-title">${g.icon} ${g.name}</div>
                <div class="goal-deadline">📅 ${formatDate(g.deadline)}</div>
            </div>
            <div class="progress-bar-wrap">
                <div class="progress-bar-fill ${barClass}" style="width:${pct}%;"></div>
            </div>
            <div class="goal-amounts">
                <span>${formatRupiah(g.current)}</span>
                <span class="goal-percentage">${pct}%</span>
                <span>${formatRupiah(g.target)}</span>
            </div>
            <p style="font-size:0.8rem;color:#64748b;margin-top:4px;">Sisa: ${formatRupiah(remaining)}</p>
            <div class="goal-actions">
                <input type="number" id="addAmount_${g.id}" placeholder="Tambah dana (Rp)" min="0">
                <button class="btn btn-primary btn-sm" onclick="addGoalFunds('${g.id}')">➕ Tambah</button>
                <button class="btn btn-danger btn-xs" onclick="deleteGoal('${g.id}')">🗑️</button>
            </div>
        </div>`;
    }).join('');
}

function addGoal() {
    const name = document.getElementById('goalName').value.trim();
    const target = parseFloat(document.getElementById('goalTarget').value);
    const deadline = document.getElementById('goalDeadline').value;
    const icon = document.getElementById('goalIcon').value;
    if (!name) return showToast('⚠️ Isi nama target!', 'error');
    if (!target || target <= 0) return showToast('⚠️ Masukkan target jumlah!', 'error');
    if (!deadline) return showToast('⚠️ Pilih deadline!', 'error');
    const goal = { id: generateId(), name, target, current: 0, deadline, icon };
    APP.goals.push(goal);
    saveLocal();
    syncToSheets();
    document.getElementById('goalName').value = '';
    document.getElementById('goalTarget').value = '';
    document.getElementById('goalDeadline').value = '';
    renderGoals();
    refreshDashboard();
    showToast('🎯 Target tabungan dibuat!');
}

function addGoalFunds(goalId) {
    const input = document.getElementById('addAmount_' + goalId);
    const amount = parseFloat(input?.value);
    if (!amount || amount <= 0) return showToast('⚠️ Masukkan jumlah dana!', 'error');
    const goal = APP.goals.find(g => g.id === goalId);
    if (!goal) return;
    const wasIncomplete = goal.current < goal.target;
    goal.current += amount;
    input.value = '';
    saveLocal();
    syncToSheets();
    renderGoals();
    refreshDashboard();
    if (wasIncomplete && goal.current >= goal.target) {
        showToast('🎉🎉 Target TERCAPAI! Selamat! 🎉🎉');
        triggerConfetti();
    } else {
        showToast(`✅ Dana ditambahkan ke "${goal.name}"!`);
    }
}

function deleteGoal(goalId) {
    if (!confirm('Yakin hapus target ini?')) return;
    APP.goals = APP.goals.filter(g => g.id !== goalId);
    saveLocal();
    syncToSheets();
    renderGoals();
    refreshDashboard();
    showToast('🗑️ Target dihapus!');
}

// ==================== GOOGLE SHEETS SYNC ====================
async function syncToSheets() {
    const url = APP.googleSheetUrl;
    if (!url) return;
    try {
        const payload = {
            action: 'syncAll',
            transactions: JSON.stringify(APP.transactions),
            goals: JSON.stringify(APP.goals),
        };
        await fetch(url, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(payload).toString(),
        });
        console.log('📤 Data synced to Google Sheets');
    } catch (e) {
        console.warn('⚠️ Sync failed:', e.message);
    }
}

async function syncFromSheets() {
    const url = APP.googleSheetUrl;
    if (!url) return showToast('⚠️ Masukkan Google Sheets URL dulu di Pengaturan!', 'error');
    showToast('🔄 Menarik data dari Google Sheets...', 'success');
    try {
        const resp = await fetch(url + '?action=getAll', { method: 'GET' });
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const data = await resp.json();
        if (data.transactions) APP.transactions = data.transactions;
        if (data.goals) APP.goals = data.goals;
        saveLocal();
        populateFilterMonths();
        renderTransactions();
        renderGoals();
        refreshDashboard();
        updateSettingsUI();
        showToast('✅ Data berhasil disinkronisasi dari Google Sheets!');
    } catch (e) {
        console.error('Sync error:', e);
        showToast('❌ Gagal sinkronisasi. Cek URL dan koneksi internet.', 'error');
    }
}

async function testConnection() {
    const url = APP.googleSheetUrl;
    if (!url) return false;
    try {
        const resp = await fetch(url + '?action=ping', { method: 'GET' });
        const data = await resp.json();
        return data.status === 'ok';
    } catch (e) {
        return false;
    }
}

// ==================== SETTINGS ====================
function updateSettingsUI() {
    document.getElementById('gsUrl').value = APP.googleSheetUrl;
    const statusEl = document.getElementById('connStatus');
    if (APP.googleSheetUrl) {
        statusEl.innerHTML = '<span class="status-dot on"></span> URL tersimpan (tes koneksi dengan tombol)';
        testConnection().then(ok => {
            statusEl.innerHTML = ok
                ? '<span class="status-dot on"></span> Terhubung ke Google Sheets ✅'
                : '<span class="status-dot off"></span> URL ada tapi tidak terhubung ❌';
        });
    } else {
        statusEl.innerHTML = '<span class="status-dot off"></span> Belum terhubung';
    }
}

function saveSettings() {
    const url = document.getElementById('gsUrl').value.trim();
    APP.googleSheetUrl = url;
    localStorage.setItem('gsUrl', url);
    updateSettingsUI();
    if (url) {
        showToast('🔗 URL disimpan! Menguji koneksi...', 'success');
        testConnection().then(ok => {
            updateSettingsUI();
            if (ok) {
                showToast('✅ Koneksi ke Google Sheets BERHASIL!', 'success');
                syncToSheets();
            } else {
                showToast('⚠️ URL tersimpan tapi koneksi gagal. Cek deployment.', 'error');
            }
        });
    } else {
        showToast('💾 URL dikosongkan. Data disimpan lokal.', 'success');
    }
}

function exportToCSV() {
    let csv = 'Tanggal,Tipe,Kategori,Deskripsi,Jumlah\n';
    APP.transactions.sort((a,b) => b.date.localeCompare(a.date)).forEach(t => {
        csv += `${t.date},${t.type},${t.category},"${t.desc||''}",${t.type==='Income'?'':'-'}${t.amount}\n`;
    });
    csv += '\n\nTarget Tabungan\nNama,Target,Terkumpul,Deadline,Ikon\n';
    APP.goals.forEach(g => {
        csv += `"${g.name}",${g.target},${g.current},${g.deadline},${g.icon}\n`;
    });
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'finansialku_export_' + new Date().toISOString().slice(0,10) + '.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('📥 Data diexport ke CSV!');
}

// ==================== INIT ====================
function init() {
    APP.googleSheetUrl = localStorage.getItem('gsUrl') || '';
    const txData = localStorage.getItem('txData');
    const goalData = localStorage.getItem('goalData');
    if (txData) APP.transactions = JSON.parse(txData);
    if (goalData) APP.goals = JSON.parse(goalData);
    if (!txData && !goalData) initSampleData();
    else if (!txData && goalData) initSampleData();
    saveLocal();

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('txDate').value = today;
    if (document.getElementById('goalDeadline')) {
        const nextYear = new Date().getFullYear() + 1;
        document.getElementById('goalDeadline').value = `${nextYear}-12-31`;
    }

    populateFilterMonths();
    renderTransactions();
    renderGoals();
    refreshDashboard();
    updateSettingsUI();

    if (APP.googleSheetUrl) {
        syncFromSheets().catch(() => {});
    }

    console.log('🚀 FinansialKu siap!');
    console.log('📊 Transaksi:', APP.transactions.length, 'item');
    console.log('🎯 Goals:', APP.goals.length, 'target');
    console.log('🔗 Sheets:', APP.googleSheetUrl ? 'Configured' : 'Local only');
}

document.addEventListener('DOMContentLoaded', init);

window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('sidebarOverlay').classList.remove('show');
    }
});

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
            case '1': e.preventDefault(); navigateTo('dashboard'); break;
            case '2': e.preventDefault(); navigateTo('transactions'); break;
            case '3': e.preventDefault(); navigateTo('goals'); break;
            case '4': e.preventDefault(); navigateTo('settings'); break;
        }
    }
});