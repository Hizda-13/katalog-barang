<?php
include "koneksi.php";
header('Content-Type: application/json');

// ── Endpoint: Cari barang by kode_qr (untuk QR Scanner) ──
if (isset($_GET['kode_qr'])) {
    $kode  = mysqli_real_escape_string($koneksi, trim($_GET['kode_qr']));
    $query = "SELECT * FROM barang WHERE kode_qr = '$kode' LIMIT 1";
    $hasil = mysqli_query($koneksi, $query);
    if (!$hasil) {
        echo json_encode(["status" => "error", "message" => mysqli_error($koneksi)]);
        exit;
    }
    $barang = mysqli_fetch_assoc($hasil);
    echo json_encode($barang
        ? ["status" => "success",   "data" => $barang]
        : ["status" => "not_found", "data" => null]
    );
    exit;
}

// ── Endpoint: List barang dengan pagination + pencarian ──
$cari     = isset($_GET['cari']) ? trim($_GET['cari']) : '';
$page     = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
$per_page = 5;
$offset   = ($page - 1) * $per_page;
$keyword  = '%' . mysqli_real_escape_string($koneksi, $cari) . '%';

$row_total     = mysqli_fetch_assoc(mysqli_query($koneksi, "SELECT COUNT(*) as t FROM barang WHERE nama_barang LIKE '$keyword'"));
$total_data    = (int) $row_total['t'];
$total_halaman = $total_data > 0 ? (int) ceil($total_data / $per_page) : 1;

$hasil = mysqli_query($koneksi, "SELECT * FROM barang WHERE nama_barang LIKE '$keyword' ORDER BY id DESC LIMIT $per_page OFFSET $offset");
$data  = [];
while ($b = mysqli_fetch_assoc($hasil)) $data[] = $b;

echo json_encode([
    "status"           => "success",
    "message"          => "Berhasil mengambil data",
    "data"             => $data,
    "total_halaman"    => $total_halaman,
    "halaman_sekarang" => $page,
    "total_data"       => $total_data
]);
?>
