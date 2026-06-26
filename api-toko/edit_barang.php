<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'koneksi.php';

$input = json_decode(file_get_contents("php://input"), true);

if (!isset($input['id']) || !isset($input['nama_barang']) || !isset($input['harga'])) {
    echo json_encode(["status" => "error", "message" => "Data tidak lengkap!"]);
    exit();
}

$id          = mysqli_real_escape_string($koneksi, $input['id']);
$nama_barang = mysqli_real_escape_string($koneksi, $input['nama_barang']);
$harga       = (int) $input['harga'];

if (empty($nama_barang)) {
    echo json_encode(["status" => "error", "message" => "Nama barang tidak boleh kosong!"]);
    exit();
}

if ($harga < 0) {
    echo json_encode(["status" => "error", "message" => "Harga tidak boleh negatif!"]);
    exit();
}

$query = "UPDATE barang SET nama_barang='$nama_barang', harga=$harga WHERE id=$id";
$result = mysqli_query($koneksi, $query);

if ($result && mysqli_affected_rows($koneksi) > 0) {
    echo json_encode(["status" => "success", "message" => "Barang berhasil diupdate!"]);
} else if ($result) {
    echo json_encode(["status" => "error", "message" => "Tidak ada perubahan data."]);
} else {
    echo json_encode(["status" => "error", "message" => "Gagal mengupdate: " . mysqli_error($koneksi)]);
}

mysqli_close($koneksi);
?>
