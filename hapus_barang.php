<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include 'koneksi.php';

// ✅ Pakai $koneksi sesuai koneksi.php
if (!$koneksi) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Koneksi database gagal: ' . mysqli_connect_error()
    ]);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['id'])) {
    echo json_encode([
        'status' => 'error',
        'message' => 'ID barang tidak ditemukan!'
    ]);
    exit;
}

$id = intval($data['id']);

// ✅ Pakai procedural mysqli
$stmt = mysqli_prepare($koneksi, "DELETE FROM barang WHERE id = ?");

if (!$stmt) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Prepare gagal: ' . mysqli_error($koneksi)
    ]);
    exit;
}

mysqli_stmt_bind_param($stmt, "i", $id);

if (mysqli_stmt_execute($stmt)) {
    echo json_encode([
        'status' => 'success',
        'message' => 'Barang berhasil dihapus!'
    ]);
} else {
    echo json_encode([
        'status' => 'error',
        'message' => 'Gagal menghapus: ' . mysqli_stmt_error($stmt)
    ]);
}

mysqli_stmt_close($stmt);
mysqli_close($koneksi);
?>