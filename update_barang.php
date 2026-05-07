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

if (!isset($data['id'], $data['nama_barang'], $data['harga'])) {
    echo json_encode([
        'status' => 'error',
        'message' => 'ID, nama_barang, dan harga harus diisi!'
    ]);
    exit;
}

$id = intval($data['id']);
$nama_barang = $data['nama_barang'];
$harga = intval($data['harga']);

$stmt = mysqli_prepare($koneksi, "UPDATE barang SET nama_barang = ?, harga = ? WHERE id = ?");
if (!$stmt) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Prepare gagal: ' . mysqli_error($koneksi)
    ]);
    exit;
}
mysqli_stmt_bind_param($stmt, "sii", $nama_barang, $harga, $id);

if (mysqli_stmt_execute($stmt)) {
    echo json_encode([
        'status' => 'success',
        'message' => 'Barang berhasil diupdate!'
    ]);
} else {
    echo json_encode([
        'status' => 'error',
        'message' => 'Gagal update: ' . mysqli_stmt_error($stmt)
    ]);
}
mysqli_stmt_close($stmt);
?>
