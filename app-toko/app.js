// ==========================================
// CEK AUTH — Redirect ke login jika belum login
// ==========================================
const token    = localStorage.getItem('token');
const username = localStorage.getItem('username');

if (!token) {
    window.location.href = '/login.html';
}

// ==========================================
// FORMAT RUPIAH
// ==========================================
const formatRupiah = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
});

// ==========================================
// KONFIGURASI API
// ==========================================
const API_URL = '/api-toko';

// Header untuk request JSON (edit, hapus)
function authHeadersJSON() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// Header untuk request FormData (tambah barang dengan file)
function authHeadersFormData() {
    return {
        'Authorization': `Bearer ${token}`
    };
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

    // Preview gambar saat dipilih
    const inputGambar = document.getElementById('gambar');
    if (inputGambar) {
        inputGambar.addEventListener('change', function () {
            const preview = document.getElementById('previewGambar');
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = e => {
                    preview.src = e.target.result;
                    preview.classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            } else {
                preview.classList.add('hidden');
                preview.src = '';
            }
        });
    }
});

// ==========================================
// PENCARIAN — dipanggil onkeyup dari input
// ==========================================
function cariBarang(value) {
    searchQuery = value.trim();
    currentPage = 1; // Reset ke halaman pertama setiap kali pencarian berubah
    ambilDataBarang();
}

// ==========================================
// NAVIGASI HALAMAN — dipanggil tombol Prev/Next
// ==========================================
function gantiHalaman(arah) {
    const halamanBaru = currentPage + arah;
    if (halamanBaru < 1 || halamanBaru > totalHalaman) return;
    currentPage = halamanBaru;
    ambilDataBarang();
}

// ==========================================
// UPDATE UI PAGINATION
// ==========================================
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
// AMBIL DATA BARANG (READ)
// ==========================================
async function ambilDataBarang() {
    const tbody = document.getElementById('tabel-barang');

    try {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="py-8 text-center text-slate-400">
                    <div class="animate-pulse">Mengambil data dari server...</div>
                </td>
            </tr>
        `;

        const url = `${API_URL}/get_barang.php?cari=${encodeURIComponent(searchQuery)}&page=${currentPage}`;
        const response = await fetch(url);

        const contentType = response.headers.get('content-type') || '';
        if (!response.ok || !contentType.includes('application/json')) {
            throw new Error(`Server mengembalikan respons tidak valid (HTTP ${response.status}).`);
        }

        const hasil = await response.json();

        if (hasil.status === 'success') {
            // Simpan total halaman dari respons server
            totalHalaman = hasil.total_halaman || 1;
            updatePaginationUI(hasil.total_data || 0);

            if (hasil.data.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="py-8 text-center text-slate-500 italic">
                            📭 ${searchQuery ? `Tidak ada barang dengan kata kunci "<b>${searchQuery}</b>".` : 'Belum ada barang di etalase. Tambahkan sekarang!'}
                        </td>
                    </tr>
                `;
                return;
            }

            let barisHTML = '';
            hasil.data.forEach((barang, index) => {
                const bgClass = index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30';

                let gambarHTML;
                if (barang.gambar) {
                    gambarHTML = `<img src="${API_URL}/uploads/${barang.gambar}" alt="${barang.nama_barang}" class="w-14 h-14 object-cover rounded-lg border border-slate-200">`;
                } else {
                    gambarHTML = `<div class="w-14 h-14 flex items-center justify-center bg-slate-100 rounded-lg text-slate-300 text-2xl">📦</div>`;
                }

                barisHTML += `
                    <tr id="row-${barang.id}" class="${bgClass} hover:bg-emerald-50 transition-colors duration-200">
                        <td class="py-3 px-6">${gambarHTML}</td>
                        <td class="py-4 px-6 text-sm text-slate-500 font-mono">#${barang.id}</td>
                        <td class="py-4 px-6 font-medium text-slate-800">${barang.nama_barang}</td>
                        <td class="py-4 px-6 text-right font-semibold text-emerald-600">${formatRupiah.format(barang.harga)}</td>
                        <td class="py-4 px-6 text-center">
                            <button 
                                onclick="tampilkanFormEdit(${barang.id}, '${barang.nama_barang}', ${barang.harga})"
                                class="bg-blue-100 text-blue-600 px-3 py-1 rounded-lg text-sm hover:bg-blue-200 transition-all duration-200 mr-1"
                            >✏️ Edit</button>
                            <button 
                                onclick="hapusBarang(${barang.id})"
                                class="bg-red-100 text-red-600 px-3 py-1 rounded-lg text-sm hover:bg-red-200 transition-all duration-200"
                            >🗑️ Hapus</button>
                        </td>
                    </tr>
                `;
            });

            tbody.innerHTML = barisHTML;

        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="py-8 text-center text-red-500">Gagal memuat data: Format respons tidak valid.</td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('Gagal mengambil data:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="py-8 text-center text-red-500">
                    <span class="block font-bold mb-1">⚠️ Koneksi Bermasalah</span>
                    <span class="text-sm">${error.message || 'Gagal terhubung ke server.'}</span>
                </td>
            </tr>
        `;
    }
}

// ==========================================
// TAMPILKAN FORM EDIT INLINE DI TABEL
// ==========================================
function tampilkanFormEdit(id, nama, harga) {
    const editingRow = document.querySelector('tr.sedang-diedit');
    if (editingRow) {
        ambilDataBarang();
        return;
    }

    const row = document.getElementById(`row-${id}`);
    if (!row) return;

    row.classList.add('sedang-diedit', 'bg-blue-50');
    row.innerHTML = `
        <td class="py-3 px-6 text-center text-slate-300 text-2xl">📦</td>
        <td class="py-3 px-6 text-sm text-slate-500 font-mono">#${id}</td>
        <td class="py-3 px-4">
            <input 
                id="edit-nama-${id}"
                type="text" 
                value="${nama}"
                class="w-full border border-blue-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
        </td>
        <td class="py-3 px-4">
            <input 
                id="edit-harga-${id}"
                type="number" 
                value="${harga}"
                min="0"
                class="w-full border border-blue-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
        </td>
        <td class="py-3 px-6 text-center">
            <button 
                onclick="simpanEdit(${id})"
                class="bg-emerald-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-emerald-600 transition-all duration-200 mr-1"
            >💾 Simpan</button>
            <button 
                onclick="batalEdit()"
                class="bg-slate-200 text-slate-600 px-3 py-1 rounded-lg text-sm hover:bg-slate-300 transition-all duration-200"
            >✖ Batal</button>
        </td>
    `;

    document.getElementById(`edit-nama-${id}`).focus();
}

// ==========================================
// BATAL EDIT
// ==========================================
function batalEdit() {
    ambilDataBarang();
}

// ==========================================
// SIMPAN EDIT (UPDATE)
// ==========================================
async function simpanEdit(id) {
    const nama_barang = document.getElementById(`edit-nama-${id}`).value.trim();
    const harga = document.getElementById(`edit-harga-${id}`).value;

    if (!nama_barang) { alert('❌ Nama barang tidak boleh kosong!'); return; }
    if (harga < 0)    { alert('❌ Harga tidak boleh negatif!'); return; }

    try {
        const response = await fetch(`${API_URL}/edit_barang.php`, {
            method: 'POST',
            headers: authHeadersJSON(),
            body: JSON.stringify({ id, nama_barang, harga: parseInt(harga) })
        });

        if (response.status === 401) {
            alert('❌ Sesi habis! Silakan login ulang.');
            logout();
            return;
        }

        const contentType = response.headers.get('content-type') || '';
        if (!response.ok || !contentType.includes('application/json')) {
            throw new Error(`Respons server tidak valid (HTTP ${response.status}).`);
        }

        const hasil = await response.json();

        if (hasil.status === 'success') {
            await ambilDataBarang();
        } else {
            alert(`❌ Gagal: ${hasil.message || 'Terjadi kesalahan'}`);
        }

    } catch (error) {
        console.error('Gagal mengedit barang:', error);
        alert(`❌ ${error.message || 'Gagal terhubung ke server!'}`);
    }
}

// ==========================================
// TAMBAH BARANG (CREATE)
// ==========================================
async function tambahBarang(event) {
    event.preventDefault();

    const nama_barang = document.getElementById('nama_barang').value.trim();
    const harga = document.getElementById('harga').value;
    const inputGambar = document.getElementById('gambar');

    if (!nama_barang || !harga) {
        tampilkanPesan('❌ Semua field harus diisi!', 'error');
        return false;
    }

    if (harga < 0) {
        tampilkanPesan('❌ Harga tidak boleh negatif!', 'error');
        return false;
    }

    try {
        tampilkanPesan('⏳ Menyimpan barang...', 'loading');

        const formData = new FormData();
        formData.append('nama_barang', nama_barang);
        formData.append('harga', harga);
        if (inputGambar.files[0]) {
            formData.append('gambar', inputGambar.files[0]);
        }

        const response = await fetch(`${API_URL}/tambah_barang.php`, {
            method: 'POST',
            headers: authHeadersFormData(),
            body: formData
        });

        if (response.status === 401) {
            tampilkanPesan('❌ Sesi habis! Silakan login ulang.', 'error');
            setTimeout(logout, 1500);
            return false;
        }

        const contentType = response.headers.get('content-type') || '';
        if (!response.ok || !contentType.includes('application/json')) {
            throw new Error(`Respons server tidak valid (HTTP ${response.status}).`);
        }

        const hasil = await response.json();

        if (hasil.status === 'success') {
            tampilkanPesan('✅ Barang berhasil ditambahkan!', 'success');
            document.getElementById('formBarang').reset();

            const preview = document.getElementById('previewGambar');
            if (preview) {
                preview.classList.add('hidden');
                preview.src = '';
            }

            // Reset pencarian & halaman ke awal agar barang baru terlihat
            currentPage = 1;
            searchQuery = '';
            const inputCari = document.getElementById('inputCari');
            if (inputCari) inputCari.value = '';

            setTimeout(() => {
                ambilDataBarang();
                sembunyikanForm();
                tampilkanPesan('', '');
            }, 1000);
        } else {
            tampilkanPesan(`❌ Gagal: ${hasil.message || 'Terjadi kesalahan'}`, 'error');
        }

    } catch (error) {
        console.error('Gagal menambah barang:', error);
        tampilkanPesan(`❌ ${error.message || 'Gagal terhubung ke server!'}`, 'error');
    }

    return false;
}

// ==========================================
// HAPUS BARANG (DELETE)
// ==========================================
async function hapusBarang(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus barang ini?')) return;

    try {
        const response = await fetch(`${API_URL}/hapus_barang.php`, {
            method: 'POST',
            headers: authHeadersJSON(),
            body: JSON.stringify({ id: id })
        });

        if (response.status === 401) {
            alert('❌ Sesi habis! Silakan login ulang.');
            logout();
            return;
        }

        const contentType = response.headers.get('content-type') || '';
        if (!response.ok || !contentType.includes('application/json')) {
            throw new Error(`Respons server tidak valid (HTTP ${response.status}).`);
        }

        const hasil = await response.json();

        if (hasil.status === 'success') {
            // Kalau halaman sekarang jadi kosong setelah hapus, mundur 1 halaman
            if (currentPage > 1) currentPage--;
            ambilDataBarang();
        } else {
            alert(`❌ Gagal menghapus: ${hasil.message || 'Terjadi kesalahan'}`);
        }

    } catch (error) {
        console.error('Gagal menghapus barang:', error);
        alert(`❌ ${error.message || 'Gagal terhubung ke server!'}`);
    }
}

// ==========================================
// UI: TOGGLE FORM TAMBAH
// ==========================================
function tampilkanForm() {
    document.getElementById('formTambah').classList.remove('hidden');
    document.getElementById('btnTambah').classList.add('hidden');
    document.getElementById('nama_barang').focus();
}

function sembunyikanForm() {
    document.getElementById('formTambah').classList.add('hidden');
    document.getElementById('btnTambah').classList.remove('hidden');
}

// ==========================================
// UI: PESAN STATUS
// ==========================================
function tampilkanPesan(pesan, tipe) {
    const pesanStatus = document.getElementById('pesanStatus');
    pesanStatus.textContent = pesan;

    if (tipe === 'success') {
        pesanStatus.className = 'bg-emerald-100 text-emerald-700 p-3 rounded-lg font-medium';
    } else if (tipe === 'error') {
        pesanStatus.className = 'bg-red-100 text-red-700 p-3 rounded-lg font-medium';
    } else if (tipe === 'loading') {
        pesanStatus.className = 'bg-blue-100 text-blue-700 p-3 rounded-lg font-medium animate-pulse';
    } else {
        pesanStatus.className = 'hidden';
    }
}

// ==========================================
// STATUS ONLINE/OFFLINE
// ==========================================
function updateStatus() {
    const statusEl = document.getElementById('status-pwa');
    if (navigator.onLine) {
        statusEl.innerHTML = '✅ Online - Data real-time';
        statusEl.className = 'text-sm text-emerald-600 font-medium';
    } else {
        statusEl.innerHTML = '📱 Offline - Menggunakan data cache';
        statusEl.className = 'text-sm text-orange-600 font-medium';
    }
}

window.addEventListener('online', updateStatus);
window.addEventListener('offline', updateStatus);
updateStatus();

// ==========================================
// SERVICE WORKER REGISTRATION
// ==========================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('✅ SW Terdaftar:', reg.scope))
            .catch(err => console.error('❌ SW Gagal:', err));
    });
}
