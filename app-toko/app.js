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
// Gunakan path absolut ke folder API di root hosting
const API_URL = '/api-toko';

// ==========================================
// AMBIL DATA BARANG (READ)
// ==========================================
async function ambilDataBarang() {
    const tbody = document.getElementById('tabel-barang');

    try {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="py-8 text-center text-slate-400">
                    <div class="animate-pulse">Mengambil data dari server...</div>
                </td>
            </tr>
        `;

        const response = await fetch(`${API_URL}/get_barang.php`);
        const hasil = await response.json();

        if (hasil.status === 'success') {
            if (hasil.data.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="4" class="py-8 text-center text-slate-500 italic">
                            📭 Belum ada barang di etalase. Tambahkan sekarang!
                        </td>
                    </tr>
                `;
                return;
            }

            let barisHTML = '';
            hasil.data.forEach((barang, index) => {

                const bgClass = index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30';
                barisHTML += `
                    <tr class="${bgClass} hover:bg-emerald-50 transition-colors duration-200">
                        <td class="py-4 px-6 text-sm text-slate-500 font-mono">#${barang.id}</td>
                        <td class="py-4 px-6 font-medium text-slate-800">${barang.nama_barang}</td>
                        <td class="py-4 px-6 text-right font-semibold text-emerald-600">${formatRupiah.format(barang.harga)}</td>
                        <td class="py-4 px-6 text-center flex gap-2 justify-center">
                            <button 
                                onclick="editBarang(${barang.id}, '${barang.nama_barang.replace(/'/g, "&#39;")}', ${barang.harga})"
                                class="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-lg text-sm hover:bg-yellow-200 transition-all duration-200"
                            >
                                ✏️ Edit
                            </button>
                            <button 
                                onclick="hapusBarang(${barang.id})"
                                class="bg-red-100 text-red-600 px-3 py-1 rounded-lg text-sm hover:bg-red-200 transition-all duration-200"
                            >
                                🗑️ Hapus
                            </button>
                        </td>
                    </tr>
                `;
            });
// ==========================================
// UPDATE BARANG (UPDATE)
// ==========================================
async function editBarang(id, nama_barang, harga) {
    // Prompt sederhana, bisa diganti dengan modal/form custom
    const namaBaru = prompt('Edit Nama Barang:', nama_barang);
    if (namaBaru === null) return; // Batal
    const hargaBaru = prompt('Edit Harga Barang:', harga);
    if (hargaBaru === null) return;
    if (namaBaru.trim() === '' || hargaBaru.trim() === '' || isNaN(hargaBaru) || hargaBaru < 0) {
        alert('Input tidak valid!');
        return;
    }
    try {
        const response = await fetch(`${API_URL}/update_barang.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: id,
                nama_barang: namaBaru.trim(),
                harga: parseInt(hargaBaru)
            })
        });
        const hasil = await response.json();
        if (hasil.status === 'success') {
            alert('✅ Barang berhasil diupdate!');
            ambilDataBarang();
        } else {
            alert(`❌ Gagal update: ${hasil.message || 'Terjadi kesalahan'}`);
        }
    } catch (error) {
        console.error('Gagal update barang:', error);
        alert('❌ Gagal terhubung ke server!');
    }
}
// Agar bisa dipanggil dari HTML (onclick)
window.editBarang = editBarang;

            tbody.innerHTML = barisHTML;
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="py-8 text-center text-red-500">Gagal memuat data: Format respons tidak valid.</td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('Gagal mengambil data:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="py-8 text-center text-red-500">
                    <span class="block font-bold mb-1">⚠️ Koneksi Terputus</span>
                    <span class="text-sm">Gagal terhubung ke server. Periksa koneksi internet atau coba lagi nanti.</span>
                </td>
            </tr>
        `;
    }
}

// ==========================================
// TAMBAH BARANG (CREATE)
// ==========================================
async function tambahBarang(event) {
    event.preventDefault(); // Mencegah form reload halaman

    const nama_barang = document.getElementById('nama_barang').value.trim();
    const harga = document.getElementById('harga').value;
    const pesanStatus = document.getElementById('pesanStatus');

    // Validasi input
    if (!nama_barang || !harga) {
        tampilkanPesan('❌ Semua field harus diisi!', 'error');
        return false;
    }

    if (harga < 0) {
        tampilkanPesan('❌ Harga tidak boleh negatif!', 'error');
        return false;
    }

    try {
        // Tampilkan loading
        tampilkanPesan('⏳ Menyimpan barang...', 'loading');

        const response = await fetch(`${API_URL}/tambah_barang.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nama_barang: nama_barang,
                harga: parseInt(harga)
            })
        });

        const hasil = await response.json();

        if (hasil.status === 'success') {
            tampilkanPesan('✅ Barang berhasil ditambahkan!', 'success');

            // Reset form
            document.getElementById('formBarang').reset();

            // Refresh tabel
            setTimeout(() => {
                ambilDataBarang();
                sembunyikanForm();
                tampilkanPesan('', ''); // Clear pesan
            }, 1000);

        } else {
            tampilkanPesan(`❌ Gagal: ${hasil.message || 'Terjadi kesalahan'}`, 'error');
        }

    } catch (error) {
        console.error('Gagal menambah barang:', error);
        tampilkanPesan('❌ Gagal terhubung ke server!', 'error');
    }

    return false; // Pastikan tidak ada submit form default
}

// ==========================================
// HAPUS BARANG (DELETE)
// ==========================================
async function hapusBarang(id) {
    // Konfirmasi sebelum hapus
    if (!confirm('Apakah Anda yakin ingin menghapus barang ini?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/hapus_barang.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: id })
        });

        const hasil = await response.json();

        if (hasil.status === 'success') {
            alert('✅ Barang berhasil dihapus!');
            ambilDataBarang(); // Refresh tabel
        } else {
            alert(`❌ Gagal menghapus: ${hasil.message || 'Terjadi kesalahan'}`);
        }

    } catch (error) {
        console.error('Gagal menghapus barang:', error);
        alert('❌ Gagal terhubung ke server!');
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
    pesanStatus.classList.remove('hidden');

    // Style berdasarkan tipe
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
// EVENT LISTENERS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Load data
    ambilDataBarang();

    // Tombol Tambah
    document.getElementById('btnTambah').addEventListener('click', tampilkanForm);

    // Tombol Batal
    document.getElementById('btnBatal').addEventListener('click', sembunyikanForm);

    // Submit Form
    document.getElementById('formBarang').addEventListener('submit', tambahBarang);
});

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
            .then(registration => {
                console.log('✅ Service Worker Berhasil Didaftarkan!', registration.scope);
            })
            .catch(err => {
                console.error('❌ Service Worker Gagal:', err);
            });
    });
}
