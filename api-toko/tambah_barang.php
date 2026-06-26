<?php
// ==========================================
// TANGKAP SEMUA ERROR & KEMBALIKAN SEBAGAI JSON
// ==========================================
ini_set('display_errors', 0);
error_reporting(E_ALL);
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR])) {
        if (!headers_sent()) {
            header('Content-Type: application/json');
        }
        echo json_encode([
            'status' => 'error',
            'message' => '💥 Fatal Error: ' . $error['message'],
            'file' => $error['file'],
            'line' => $error['line']
        ]);
    }
});

// ==========================================
// HEADER CORS
// ==========================================
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ==========================================
// KONEKSI DATABASE
// ==========================================
include 'koneksi.php';

if (!$koneksi) {
    echo json_encode([
        'status'  => 'error',
        'message' => 'Koneksi database gagal: ' . mysqli_connect_error()
    ]);
    exit;
}

// ==========================================
// CEK TOKEN (AUTH)
// ==========================================
require_once 'auth_check.php';
$userLogin = cekToken($koneksi); // exit otomatis kalau token tidak valid

// ==========================================
// AMBIL DATA — pakai $_POST karena FormData (bukan JSON)
// ==========================================
if (!isset($_POST['nama_barang']) || !isset($_POST['harga'])) {
    echo json_encode([
        'status'        => 'error',
        'message'       => 'Data tidak lengkap!',
        'data_diterima' => $_POST
    ]);
    exit;
}

$nama_barang = trim($_POST['nama_barang']);
$harga = intval($_POST['harga']);

if (empty($nama_barang) || $harga <= 0) {
    echo json_encode([
        'status'  => 'error',
        'message' => 'Nama barang tidak boleh kosong dan harga harus > 0!'
    ]);
    exit;
}

// ==========================================
// PROSES UPLOAD GAMBAR (jika ada)
// ==========================================
$nama_file_gambar = null;

if (isset($_FILES['gambar']) && $_FILES['gambar']['error'] === UPLOAD_ERR_OK) {
    $tmpName  = $_FILES['gambar']['tmp_name'];
    $namaAsli = $_FILES['gambar']['name'];
    $ukuran   = $_FILES['gambar']['size'];

    // Validasi ekstensi
    $ekstensiDiizinkan = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    $ekstensi = strtolower(pathinfo($namaAsli, PATHINFO_EXTENSION));

    if (!in_array($ekstensi, $ekstensiDiizinkan)) {
        echo json_encode([
            'status'  => 'error',
            'message' => 'Format gambar tidak didukung! Gunakan JPG, PNG, GIF, atau WEBP.'
        ]);
        exit;
    }

    // Validasi ukuran (maks 2MB)
    if ($ukuran > 2 * 1024 * 1024) {
        echo json_encode([
            'status'  => 'error',
            'message' => 'Ukuran gambar maksimal 2MB!'
        ]);
        exit;
    }

    // Buat direktori uploads jika belum ada
    $direktoriUpload = __DIR__ . '/uploads';
    if (!is_dir($direktoriUpload)) {
        mkdir($direktoriUpload, 0755, true);
    }

    // Buat nama file unik
    $nama_file_gambar = uniqid('barang_') . '.' . $ekstensi;
    $tujuanUpload = $direktoriUpload . '/' . $nama_file_gambar;

    if (!move_uploaded_file($tmpName, $tujuanUpload)) {
        echo json_encode([
            'status'  => 'error',
            'message' => 'Gagal mengupload gambar!'
        ]);
        exit;
    }
}

// ==========================================
// INSERT KE DATABASE (Prepared Statement)
// ==========================================
if ($nama_file_gambar !== null) {
    $stmt = mysqli_prepare($koneksi, "INSERT INTO barang (nama_barang, harga, gambar) VALUES (?, ?, ?)");
    if (!$stmt) {
        echo json_encode([
            'status'  => 'error',
            'message' => 'Prepare gagal: ' . mysqli_error($koneksi)
        ]);
        exit;
    }
    mysqli_stmt_bind_param($stmt, "sis", $nama_barang, $harga, $nama_file_gambar);
} else {
    $stmt = mysqli_prepare($koneksi, "INSERT INTO barang (nama_barang, harga) VALUES (?, ?)");
    if (!$stmt) {
        echo json_encode([
            'status'  => 'error',
            'message' => 'Prepare gagal: ' . mysqli_error($koneksi)
        ]);
        exit;
    }
    mysqli_stmt_bind_param($stmt, "si", $nama_barang, $harga);
}

if (mysqli_stmt_execute($stmt)) {
    echo json_encode([
        'status'  => 'success',
        'message' => 'Barang berhasil ditambahkan!',
        'id'      => mysqli_insert_id($koneksi),
        'gambar'  => $nama_file_gambar
    ]);
} else {
    echo json_encode([
        'status'  => 'error',
        'message' => 'Gagal execute: ' . mysqli_stmt_error($stmt)
    ]);
}

mysqli_stmt_close($stmt);
mysqli_close($koneksi);
?>
