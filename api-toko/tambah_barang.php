<?php
ob_start();
include "koneksi.php";
header('Content-Type: application/json');

function getToken() {
    if (function_exists('getallheaders')) {
        foreach (getallheaders() as $k => $v)
            if (strtolower($k) === 'authorization') return trim(str_replace('Bearer ', '', $v));
    }
    foreach (['HTTP_AUTHORIZATION', 'REDIRECT_HTTP_AUTHORIZATION'] as $key)
        if (isset($_SERVER[$key])) return trim(str_replace('Bearer ', '', $_SERVER[$key]));
    return '';
}

if (empty(getToken())) {
    ob_clean(); http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized"]);
    exit;
}

$nama_barang = trim($_POST['nama_barang'] ?? '');
$harga       = intval($_POST['harga']     ?? 0);
$kode_qr     = trim($_POST['kode_qr']    ?? '');
$latitude    = (isset($_POST['latitude'])  && $_POST['latitude']  !== '') ? floatval($_POST['latitude'])  : null;
$longitude   = (isset($_POST['longitude']) && $_POST['longitude'] !== '') ? floatval($_POST['longitude']) : null;

if (empty($nama_barang)) {
    ob_clean();
    echo json_encode(["status" => "error", "message" => "Nama barang tidak boleh kosong"]);
    exit;
}

// Auto-generate kode_qr jika tidak dikirim
if (empty($kode_qr)) {
    $kode_qr = 'QR-' . strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 10));
}

// Handle upload gambar
$gambar = null;
if (isset($_FILES['gambar']) && $_FILES['gambar']['error'] === 0) {
    $ext     = strtolower(pathinfo($_FILES['gambar']['name'], PATHINFO_EXTENSION));
    $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    if (in_array($ext, $allowed) && $_FILES['gambar']['size'] <= 2 * 1024 * 1024) {
        $nama_file  = uniqid() . '.' . $ext;
        $upload_dir = __DIR__ . '/uploads/';
        if (!is_dir($upload_dir)) mkdir($upload_dir, 0755, true);
        move_uploaded_file($_FILES['gambar']['tmp_name'], $upload_dir . $nama_file);
        $gambar = $nama_file;
    }
}

$n   = mysqli_real_escape_string($koneksi, $nama_barang);
$q   = mysqli_real_escape_string($koneksi, $kode_qr);
$g   = $gambar ? "'" . mysqli_real_escape_string($koneksi, $gambar) . "'" : 'NULL';
$lat = $latitude  !== null ? $latitude  : 'NULL';
$lng = $longitude !== null ? $longitude : 'NULL';

$sql = "INSERT INTO barang (nama_barang, harga, gambar, kode_qr, latitude, longitude)
        VALUES ('$n', $harga, $g, '$q', $lat, $lng)";

ob_clean();
if (mysqli_query($koneksi, $sql)) {
    echo json_encode([
        "status"  => "success",
        "message" => "Barang berhasil ditambahkan",
        "kode_qr" => $kode_qr
    ]);
} else {
    echo json_encode(["status" => "error", "message" => mysqli_error($koneksi)]);
}
?>
