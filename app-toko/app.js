// ==========================================
// CEK AUTH
// ==========================================
const token    = localStorage.getItem('token');
const username = localStorage.getItem('username');
if (!token) window.location.href = '/login.html';

// ==========================================
// FORMAT RUPIAH
// ==========================================
const formatRupiah = new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0
});

// ==========================================
// KONFIGURASI API
// ==========================================
const API_URL = '/api-toko';

function authHeadersJSON() {
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
}
function authHeadersFormData() {
    return { 'Authorization': `Bearer ${token}` };
}

// ==========================================
// STATE PENCARIAN & PAGINATION
// ==========================================
let currentPage  = 1;
let totalHalaman = 1;
let searchQuery  = '';

// ==========================================
// LOGOUT
// ==========================================
function logout() {
    if (!confirm('Yakin ingin keluar?')) return;
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = '/login.html';
}

// ==========================================
// EVENT LISTENERS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const elUser = document.getElementById('nama-user');
    if (elUser) elUser.textContent = username || 'User';

    ambilDataBarang();
    document.getElementById('btnTambah').addEventListener('click', tampilkanForm);
    document.getElementById('btnBatal').addEventListener('click', sembunyikanForm);
    document.getElementById('formBarang').addEventListener('submit', tambahBarang);

    const inputGambar = document.getElementById('gambar');
    if (inputGambar) {
        inputGambar.addEventListener('change', function () {
            const preview = document.getElementById('previewGambar');
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = e => { preview.src = e.target.result; preview.classList.remove('hidden'); };
                reader.readAsDataURL(file);
            } else {
                preview.classList.add('hidden'); preview.src = '';
            }
        });
    }
});

// ==========================================
// PENCARIAN
// ==========================================
function cariBarang(value) {
    searchQuery = value.trim();
    currentPage = 1;
    ambilDataBarang();
}

// ==========================================
// NAVIGASI HALAMAN
// ==========================================
function gantiHalaman(arah) {
    const halamanBaru = currentPage + arah;
    if (halamanBaru < 1 || halamanBaru > totalHalaman) return;
    currentPage = halamanBaru;
    ambilDataBarang();
}

function updatePaginationUI(total_data) {
    const infoHalaman = document.getElementById('info-halaman');
    const infoTotal   = document.getElementById('info-total');
    const btnPrev     = document.getElementById('btnPrev');
    const btnNext     = document.getElementById('btnNext');
    if (infoHalaman) infoHalaman.textContent = `Halaman ${currentPage} / ${totalHalaman}`;
    if (infoTotal)   infoTotal.textContent   = `${total_data} barang ditemukan`;
    if (btnPrev)     btnPrev.disabled        = currentPage <= 1;
    if (btnNext)     btnNext.disabled        = currentPage >= totalHalaman;
}

// ==========================================
// AMBIL DATA BARANG
// ==========================================
async function ambilDataBarang() {
    const tbody = document.getElementById('tabel-barang');
    try {
        tbody.innerHTML = `
            <tr><td colspan="6" class="py-8 text-center text-slate-400">
                <div class="animate-pulse">Mengambil data dari server...</div>
            </td></tr>`;

        const url      = `${API_URL}/get_barang.php?cari=${encodeURIComponent(searchQuery)}&page=${currentPage}`;
        const response = await fetch(url);
        const ct       = response.headers.get('content-type') || '';
        if (!response.ok || !ct.includes('application/json'))
            throw new Error(`Server error (HTTP ${response.status})`);

        const hasil = await response.json();

        if (hasil.status === 'success') {
            totalHalaman = hasil.total_halaman || 1;
            updatePaginationUI(hasil.total_data || 0);

            if (hasil.data.length === 0) {
                tbody.innerHTML = `
                    <tr><td colspan="6" class="py-8 text-center text-slate-500 italic">
                        📭 ${searchQuery ? `Tidak ada barang "<b>${searchQuery}</b>".` : 'Belum ada barang. Tambahkan sekarang!'}
                    </td></tr>`;
                return;
            }

            let html = '';
            hasil.data.forEach((barang, index) => {
                const bg = index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30';

                // Foto
                const gambarHTML = barang.gambar
                    ? `<img src="${API_URL}/uploads/${barang.gambar}" alt="${barang.nama_barang}" class="w-14 h-14 object-cover rounded-lg border border-slate-200">`
                    : `<div class="w-14 h-14 flex items-center justify-center bg-slate-100 rounded-lg text-slate-300 text-2xl">📦</div>`;

                // ✅ Kolom Lokasi: tampilkan link Google Maps jika ada lat/lng
                const lokasiHTML = (barang.latitude && barang.longitude)
                    ? `<a href="https://maps.google.com/?q=${barang.latitude},${barang.longitude}"
                           target="_blank"
                           class="inline-flex items-center gap-1 text-blue-500 text-xs hover:underline font-medium">
                           📍 Maps
                       </a>
                       <p class="text-xs text-slate-400 mt-0.5">${parseFloat(barang.latitude).toFixed(4)}, ${parseFloat(barang.longitude).toFixed(4)}</p>`
                    : `<span class="text-slate-300 text-xs">—</span>`;

                // QR code kecil via API
                const qrImgHTML = barang.kode_qr
                    ? `<img src="https://api.qrserver.com/v1/create-qr-code/?size=40x40&data=${encodeURIComponent(barang.kode_qr)}"
                            title="${barang.kode_qr}" class="w-8 h-8 rounded" alt="QR">`
                    : '';

                html += `
                    <tr id="row-${barang.id}" class="${bg} hover:bg-emerald-50 transition-colors duration-200">
                        <td class="py-3 px-6">${gambarHTML}</td>
                        <td class="py-4 px-6 text-sm text-slate-500 font-mono">
                            #${barang.id}
                            ${qrImgHTML}
                        </td>
                        <td class="py-4 px-6 font-medium text-slate-800">${barang.nama_barang}</td>
                        <td class="py-4 px-6 text-right font-semibold text-emerald-600">${formatRupiah.format(barang.harga)}</td>
                        <td class="py-4 px-6 text-center">${lokasiHTML}</td>
                        <td class="py-4 px-6 text-center">
                            <button onclick="tampilkanFormEdit(${barang.id}, '${barang.nama_barang.replace(/'/g,"\\'")}', ${barang.harga}, ${barang.latitude || 'null'}, ${barang.longitude || 'null'})"
                                class="bg-blue-100 text-blue-600 px-3 py-1 rounded-lg text-sm hover:bg-blue-200 transition-all duration-200 mr-1">
                                ✏️ Edit
                            </button>
                            <button onclick="hapusBarang(${barang.id})"
                                class="bg-red-100 text-red-600 px-3 py-1 rounded-lg text-sm hover:bg-red-200 transition-all duration-200">
                                🗑️ Hapus
                            </button>
                        </td>
                    </tr>`;
            });
            tbody.innerHTML = html;
        }
    } catch (error) {
        console.error('Gagal mengambil data:', error);
        tbody.innerHTML = `
            <tr><td colspan="6" class="py-8 text-center text-red-500">
                <span class="block font-bold mb-1">⚠️ Koneksi Bermasalah</span>
                <span class="text-sm">${error.message}</span>
            </td></tr>`;
    }
}

// ==========================================
// FORM EDIT INLINE
// ==========================================
function tampilkanFormEdit(id, nama, harga, lat = null, lng = null) {
    const editingRow = document.querySelector('tr.sedang-diedit');
    if (editingRow) { ambilDataBarang(); return; }

    const row = document.getElementById(`row-${id}`);
    if (!row) return;
    row.classList.add('sedang-diedit', 'bg-blue-50');

    const latVal = lat || '';
    const lngVal = lng || '';
    const gpsBtnText = (lat && lng) ? `📍 ${parseFloat(lat).toFixed(4)},${parseFloat(lng).toFixed(4)}` : '📍 Dapatkan GPS';

    row.innerHTML = `
        <td class="py-3 px-6 text-center text-slate-300 text-2xl">📦</td>
        <td class="py-3 px-6 text-sm text-slate-500 font-mono">#${id}</td>
        <td class="py-3 px-4">
            <input id="edit-nama-${id}" type="text" value="${nama}"
                class="w-full border border-blue-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"/>
        </td>
        <td class="py-3 px-4">
            <input id="edit-harga-${id}" type="number" value="${harga}" min="0"
                class="w-full border border-blue-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"/>
        </td>
        <td class="py-3 px-4">
            <input type="hidden" id="edit-lat-${id}"  value="${latVal}">
            <input type="hidden" id="edit-lng-${id}"  value="${lngVal}">
            <button onclick="dapatkanLokasiEdit(${id})" id="btnGpsEdit-${id}"
                class="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-200 transition-all duration-200">
                ${gpsBtnText}
            </button>
        </td>
        <td class="py-3 px-6 text-center">
            <button onclick="simpanEdit(${id})"
                class="bg-emerald-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-emerald-600 mr-1">
                💾 Simpan
            </button>
            <button onclick="batalEdit()"
                class="bg-slate-200 text-slate-600 px-3 py-1 rounded-lg text-sm hover:bg-slate-300">
                ✖ Batal
            </button>
        </td>`;

    document.getElementById(`edit-nama-${id}`).focus();
}

// ✅ GPS untuk form Edit inline
function dapatkanLokasiEdit(id) {
    if (!navigator.geolocation) { alert('❌ GPS tidak didukung browser ini!'); return; }
    const btn = document.getElementById(`btnGpsEdit-${id}`);
    btn.textContent = '⏳ Mencari...';
    btn.disabled = true;
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const lat = pos.coords.latitude.toFixed(8);
            const lng = pos.coords.longitude.toFixed(8);
            document.getElementById(`edit-lat-${id}`).value = lat;
            document.getElementById(`edit-lng-${id}`).value = lng;
            btn.textContent = `📍 ${parseFloat(lat).toFixed(4)},${parseFloat(lng).toFixed(4)}`;
            btn.disabled = false;
            btn.classList.add('bg-emerald-100', 'text-emerald-700');
            btn.classList.remove('bg-blue-100', 'text-blue-700');
        },
        (err) => {
            alert('❌ Gagal GPS: ' + err.message);
            btn.textContent = '📍 Dapatkan GPS';
            btn.disabled = false;
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

function batalEdit() { ambilDataBarang(); }

// ==========================================
// SIMPAN EDIT
// ==========================================
async function simpanEdit(id) {
    const nama_barang = document.getElementById(`edit-nama-${id}`).value.trim();
    const harga       = document.getElementById(`edit-harga-${id}`).value;
    const latEl       = document.getElementById(`edit-lat-${id}`);
    const lngEl       = document.getElementById(`edit-lng-${id}`);
    const latitude    = latEl  && latEl.value  !== '' ? parseFloat(latEl.value)  : null;
    const longitude   = lngEl  && lngEl.value  !== '' ? parseFloat(lngEl.value) : null;

    if (!nama_barang) { alert('❌ Nama barang tidak boleh kosong!'); return; }
    if (harga < 0)    { alert('❌ Harga tidak boleh negatif!'); return; }

    try {
        const response = await fetch(`${API_URL}/edit_barang.php`, {
            method:  'POST',
            headers: authHeadersJSON(),
            body:    JSON.stringify({ id, nama_barang, harga: parseInt(harga), latitude, longitude })
        });
        if (response.status === 401) { alert('❌ Sesi habis!'); logout(); return; }
        const hasil = await response.json();
        if (hasil.status === 'success') { await ambilDataBarang(); }
        else { alert(`❌ Gagal: ${hasil.message}`); }
    } catch (error) {
        alert(`❌ ${error.message}`);
    }
}

// ==========================================
// TAMBAH BARANG
// ==========================================
async function tambahBarang(event) {
    event.preventDefault();

    const nama_barang = document.getElementById('nama_barang').value.trim();
    const harga       = document.getElementById('harga').value;
    const inputGambar = document.getElementById('gambar');
    const latitude    = document.getElementById('latitude').value;
    const longitude   = document.getElementById('longitude').value;
    const kode_qr     = document.getElementById('kode_qr').value;

    if (!nama_barang || !harga) { tampilkanPesan('❌ Semua field wajib diisi!', 'error'); return false; }
    if (harga < 0)              { tampilkanPesan('❌ Harga tidak boleh negatif!', 'error'); return false; }

    try {
        tampilkanPesan('⏳ Menyimpan barang...', 'loading');

        const formData = new FormData();
        formData.append('nama_barang', nama_barang);
        formData.append('harga',       harga);
        if (kode_qr)   formData.append('kode_qr',   kode_qr);
        if (latitude)  formData.append('latitude',  latitude);
        if (longitude) formData.append('longitude', longitude);
        if (inputGambar.files[0]) formData.append('gambar', inputGambar.files[0]);

        const response = await fetch(`${API_URL}/tambah_barang.php`, {
            method:  'POST',
            headers: authHeadersFormData(),
            body:    formData
        });
        if (response.status === 401) { tampilkanPesan('❌ Sesi habis!', 'error'); setTimeout(logout, 1500); return false; }

        const hasil = await response.json();
        if (hasil.status === 'success') {
            tampilkanPesan('✅ Barang berhasil ditambahkan!', 'success');
            document.getElementById('formBarang').reset();
            resetLokasiForm();
            const preview = document.getElementById('previewGambar');
            if (preview) { preview.classList.add('hidden'); preview.src = ''; }

            currentPage = 1; searchQuery = '';
            const inputCari = document.getElementById('inputCari');
            if (inputCari) inputCari.value = '';

            setTimeout(() => { ambilDataBarang(); sembunyikanForm(); tampilkanPesan('', ''); }, 1000);
        } else {
            tampilkanPesan(`❌ Gagal: ${hasil.message}`, 'error');
        }
    } catch (error) {
        tampilkanPesan(`❌ ${error.message}`, 'error');
    }
    return false;
}

// ==========================================
// HAPUS BARANG
// ==========================================
async function hapusBarang(id) {
    if (!confirm('Yakin ingin menghapus barang ini?')) return;
    try {
        const response = await fetch(`${API_URL}/hapus_barang.php`, {
            method: 'POST', headers: authHeadersJSON(), body: JSON.stringify({ id })
        });
        if (response.status === 401) { alert('❌ Sesi habis!'); logout(); return; }
        const hasil = await response.json();
        if (hasil.status === 'success') {
            if (currentPage > 1) currentPage--;
            ambilDataBarang();
        } else {
            alert(`❌ Gagal: ${hasil.message}`);
        }
    } catch (error) {
        alert(`❌ ${error.message}`);
    }
}

// ==========================================
// UI: TOGGLE FORM
// ==========================================
function tampilkanForm() {
    document.getElementById('formTambah').classList.remove('hidden');
    document.getElementById('btnTambah').classList.add('hidden');
    document.getElementById('nama_barang').focus();
}
function sembunyikanForm() {
    document.getElementById('formTambah').classList.add('hidden');
    document.getElementById('btnTambah').classList.remove('hidden');
    resetLokasiForm();
}
function resetLokasiForm() {
    document.getElementById('latitude').value  = '';
    document.getElementById('longitude').value = '';
    document.getElementById('kode_qr').value   = '';
    const btnGps = document.getElementById('btnGps');
    if (btnGps) {
        btnGps.textContent = '📍 Dapatkan Lokasi GPS';
        btnGps.classList.remove('bg-emerald-100','text-emerald-700');
        btnGps.classList.add('bg-blue-100','text-blue-700');
    }
    const lokTxt = document.getElementById('lokasi-text');
    if (lokTxt) lokTxt.textContent = 'Belum ada lokasi';
}

// ==========================================
// ✅ GPS — DAPATKAN LOKASI (Form Tambah)
// ==========================================
function dapatkanLokasi() {
    if (!navigator.geolocation) { alert('❌ Browser tidak mendukung GPS!'); return; }
    const btn    = document.getElementById('btnGps');
    const lokTxt = document.getElementById('lokasi-text');
    btn.textContent = '⏳ Mencari lokasi...';
    btn.disabled    = true;

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const lat = pos.coords.latitude.toFixed(8);
            const lng = pos.coords.longitude.toFixed(8);
            document.getElementById('latitude').value  = lat;
            document.getElementById('longitude').value = lng;
            btn.textContent = `📍 ${parseFloat(lat).toFixed(5)}, ${parseFloat(lng).toFixed(5)}`;
            btn.disabled    = false;
            btn.classList.remove('bg-blue-100','text-blue-700');
            btn.classList.add('bg-emerald-100','text-emerald-700');
            if (lokTxt) {
                lokTxt.innerHTML = `<a href="https://maps.google.com/?q=${lat},${lng}" target="_blank"
                    class="text-blue-500 hover:underline text-xs">🗺️ Lihat di Maps</a>`;
            }
        },
        (err) => {
            alert('❌ Gagal GPS: ' + err.message);
            btn.textContent = '📍 Dapatkan Lokasi GPS';
            btn.disabled    = false;
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

// ==========================================
// ✅ QR SCANNER — State & Instance
// ==========================================
let qrScanner = null;
let qrMode    = 'scan';

// Buka modal QR
function bukaModalQrScan(mode = 'scan') {
    qrMode = mode;
    document.getElementById('modalQr').classList.remove('hidden');
    document.getElementById('qr-reader').innerHTML = '';
    document.getElementById('qr-status').innerHTML = '';
    initMainQrScanner();
}

// Tutup modal QR + stop kamera
async function tutupModalQr() {
    if (qrScanner) {
        try { await qrScanner.stop(); } catch (e) {}
        qrScanner = null;
    }
    document.getElementById('modalQr').classList.add('hidden');
    document.getElementById('qr-reader').innerHTML = '';
    document.getElementById('qr-status').innerHTML = '';
}

// ✅ Init kamera QR Scanner
function initMainQrScanner() {
    tampilQrStatus('loading');
    try {
        qrScanner = new Html5Qrcode('qr-reader');
        qrScanner.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 220, height: 220 } },
            async (decodedText) => {
                // ✅ Berhasil baca QR — cari di database
                try { await qrScanner.stop(); qrScanner = null; } catch (e) {}
                await cariBarangByQr(decodedText);
            },
            () => { /* scan error diabaikan */ }
        ).catch(err => {
            tampilQrStatus('error', { pesan: 'Tidak dapat mengakses kamera. Pastikan izin kamera diaktifkan.' });
        });
    } catch (e) {
        tampilQrStatus('error', { pesan: e.message });
    }
}

// Cari barang berdasarkan kode QR
async function cariBarangByQr(kode) {
    tampilQrStatus('loading');
    try {
        const res   = await fetch(`${API_URL}/get_barang.php?kode_qr=${encodeURIComponent(kode)}`);
        const hasil = await res.json();
        if (hasil.status === 'success' && hasil.data) {
            tampilQrStatus('ditemukan', hasil.data);
        } else {
            tampilQrStatus('tidak_ditemukan', { kode });
        }
    } catch (e) {
        tampilQrStatus('error', { pesan: e.message });
    }
}

// ✅ Tampil 3 status QR: loading | ditemukan | tidak_ditemukan
function tampilQrStatus(status, data = {}) {
    const el = document.getElementById('qr-status');

    if (status === 'loading') {
        el.innerHTML = `
            <div class="text-center py-6 text-slate-400 animate-pulse">
                🔄 Menginisialisasi kamera...
            </div>`;

    } else if (status === 'ditemukan') {
        // ✅ Card Hijau — barang ditemukan
        const mapsLink = (data.latitude && data.longitude)
            ? `<a href="https://maps.google.com/?q=${data.latitude},${data.longitude}" target="_blank"
                   class="text-blue-500 text-xs hover:underline">📍 Lihat Lokasi</a>`
            : '';
        el.innerHTML = `
            <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <p class="font-bold text-emerald-700 mb-3 flex items-center gap-2">
                    <span class="text-xl">✅</span> Barang Ditemukan!
                </p>
                <div class="bg-white rounded-lg p-3 border border-emerald-100 mb-3">
                    <p class="font-semibold text-slate-800 text-base">${data.nama_barang}</p>
                    <p class="text-emerald-600 font-bold text-lg mt-1">${formatRupiah.format(data.harga)}</p>
                    <p class="text-slate-400 text-xs mt-1 font-mono">ID: #${data.id}</p>
                    ${mapsLink}
                </div>
                <button onclick="tutupModalQr()"
                    class="w-full bg-emerald-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-all">
                    ✓ OK, Tutup
                </button>
            </div>`;

    } else if (status === 'tidak_ditemukan') {
        // ✅ Card Kuning — tidak ditemukan + tombol Tambah
        el.innerHTML = `
            <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p class="font-bold text-amber-700 mb-3 flex items-center gap-2">
                    <span class="text-xl">⚠️</span> Barang Tidak Ditemukan
                </p>
                <div class="bg-white rounded-lg p-3 border border-amber-100 mb-3">
                    <p class="text-xs text-slate-500 mb-1">Kode QR yang dipindai:</p>
                    <p class="font-mono text-sm text-slate-700 break-all">${data.kode}</p>
                </div>
                <p class="text-xs text-slate-500 mb-3">QR Code ini belum terdaftar di sistem gudang.</p>
                <div class="flex gap-2">
                    <button onclick="tambahDariQr('${data.kode}')"
                        class="flex-1 bg-amber-500 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-amber-600 transition-all">
                        ➕ Tambah Barang Baru
                    </button>
                    <button onclick="ulangiScan()"
                        class="bg-slate-200 text-slate-600 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-300 transition-all">
                        🔄
                    </button>
                </div>
            </div>`;

    } else if (status === 'error') {
        el.innerHTML = `
            <div class="bg-red-50 border border-red-200 rounded-xl p-4">
                <p class="font-bold text-red-700 mb-2">❌ Error</p>
                <p class="text-sm text-red-600">${data.pesan}</p>
                <button onclick="ulangiScan()"
                    class="mt-3 w-full bg-red-100 text-red-600 py-2 rounded-lg text-sm font-semibold hover:bg-red-200">
                    Coba Lagi
                </button>
            </div>`;
    }
}

// Ulangi scan setelah error / tidak ditemukan
function ulangiScan() {
    document.getElementById('qr-reader').innerHTML = '';
    document.getElementById('qr-status').innerHTML = '';
    initMainQrScanner();
}

// Buka form tambah + pre-fill kode QR
function tambahDariQr(kode) {
    tutupModalQr();
    document.getElementById('kode_qr').value = kode;
    tampilkanForm();
    // Kasih tanda visual bahwa kode QR sudah terisi
    const lokTxt = document.getElementById('lokasi-text');
    if (lokTxt) lokTxt.textContent = `🔖 Kode QR: ${kode}`;
}

// ==========================================
// UI: PESAN STATUS
// ==========================================
function tampilkanPesan(pesan, tipe) {
    const el = document.getElementById('pesanStatus');
    el.textContent = pesan;
    if (tipe === 'success')      el.className = 'bg-emerald-100 text-emerald-700 p-3 rounded-lg font-medium';
    else if (tipe === 'error')   el.className = 'bg-red-100 text-red-700 p-3 rounded-lg font-medium';
    else if (tipe === 'loading') el.className = 'bg-blue-100 text-blue-700 p-3 rounded-lg font-medium animate-pulse';
    else                         el.className = 'hidden';
}

// ==========================================
// STATUS ONLINE/OFFLINE
// ==========================================
function updateStatus() {
    const el = document.getElementById('status-pwa');
    if (navigator.onLine) {
        el.innerHTML  = '✅ Online - Data real-time';
        el.className  = 'text-sm text-emerald-600 font-medium';
    } else {
        el.innerHTML  = '📱 Offline - Menggunakan data cache';
        el.className  = 'text-sm text-orange-600 font-medium';
    }
}
window.addEventListener('online',  updateStatus);
window.addEventListener('offline', updateStatus);
updateStatus();

// ==========================================
// SERVICE WORKER
// ==========================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('✅ SW:', reg.scope))
            .catch(err => console.error('❌ SW:', err));
    });
}
