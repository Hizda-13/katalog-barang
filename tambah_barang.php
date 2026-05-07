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
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ==========================================
// KONEKSI DATABASE
// ==========================================
include 'koneksi.php';

// ✅ Pakai $koneksi sesuai koneksi.php kamu
if (!$koneksi) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Koneksi database gagal: ' . mysqli_connect_error()
    ]);
    exit;
}

// ==========================================
// PROSES DATA
// ==========================================
$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if ($data === null) {
    echo json_encode([
        'status' => 'error',
        'message' => 'JSON tidak valid atau body kosong!',
        'raw_input' => $rawInput
    ]);
    exit;
}

if (!isset($data['nama_barang']) || !isset($data['harga'])) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Data tidak lengkap!',
        'data_diterima' => $data
    ]);
    exit;
}

$nama_barang = trim($data['nama_barang']);
$harga = intval($data['harga']);

if (empty($nama_barang) || $harga <= 0) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Nama barang tidak boleh kosong dan harga harus > 0!'
    ]);
    exit;
}

// ==========================================
// INSERT KE DATABASE
// ==========================================
$stmt = mysqli_prepare($koneksi, "INSERT INTO barang (nama_barang, harga) VALUES (?, ?)");

if (!$stmt) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Prepare gagal: ' . mysqli_error($koneksi)
    ]);
    exit;
}

mysqli_stmt_bind_param($stmt, "si", $nama_barang, $harga);

if (mysqli_stmt_execute($stmt)) {
    echo json_encode([
        'status' => 'success',
        'message' => 'Barang berhasil ditambahkan!',
        'id' => mysqli_insert_id($koneksi)
    ]);
} else {
    echo json_encode([
        'status' => 'error',
        'message' => 'Gagal execute: ' . mysqli_stmt_error($stmt)
    ]);
}

mysqli_stmt_close($stmt);
mysqli_close($koneksi);
?>