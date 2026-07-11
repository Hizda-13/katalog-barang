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

$body        = json_decode(file_get_contents('php://input'), true);
$id          = intval($body['id']          ?? 0);
$nama_barang = trim($body['nama_barang']   ?? '');
$harga       = intval($body['harga']       ?? 0);
$latitude    = (isset($body['latitude'])  && $body['latitude']  !== null) ? floatval($body['latitude'])  : null;
$longitude   = (isset($body['longitude']) && $body['longitude'] !== null) ? floatval($body['longitude']) : null;

if (!$id || empty($nama_barang)) {
    ob_clean();
    echo json_encode(["status" => "error", "message" => "ID dan nama barang wajib diisi"]);
    exit;
}

$n   = mysqli_real_escape_string($koneksi, $nama_barang);
$lat = $latitude  !== null ? $latitude  : 'NULL';
$lng = $longitude !== null ? $longitude : 'NULL';

$sql = "UPDATE barang SET nama_barang = '$n', harga = $harga, latitude = $lat, longitude = $lng WHERE id = $id";

ob_clean();
if (mysqli_query($koneksi, $sql)) {
    echo json_encode(["status" => "success", "message" => "Barang berhasil diupdate"]);
} else {
    echo json_encode(["status" => "error", "message" => mysqli_error($koneksi)]);
}
?>
