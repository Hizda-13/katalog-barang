<?php
include "koneksi.php";

$cari     = isset($_GET['cari']) ? trim($_GET['cari']) : '';
$page     = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
$per_page = 5;
$offset   = ($page - 1) * $per_page;

$keyword = '%' . mysqli_real_escape_string($koneksi, $cari) . '%';

// Hitung total data untuk menentukan jumlah halaman
$query_total  = "SELECT COUNT(*) as total FROM barang WHERE nama_barang LIKE '$keyword'";
$hasil_total  = mysqli_query($koneksi, $query_total);
$row_total    = mysqli_fetch_assoc($hasil_total);
$total_data   = (int) $row_total['total'];
$total_halaman = $total_data > 0 ? (int) ceil($total_data / $per_page) : 1;

// Ambil data sesuai halaman dan kata kunci
$query = "SELECT * FROM barang WHERE nama_barang LIKE '$keyword' ORDER BY id DESC LIMIT $per_page OFFSET $offset";
$hasil = mysqli_query($koneksi, $query);

$data_barang = [];
while ($baris = mysqli_fetch_assoc($hasil)) {
    $data_barang[] = $baris;
}

$response = [
    "status"           => "success",
    "message"          => "Berhasil mengambil data",
    "data"             => $data_barang,
    "total_halaman"    => $total_halaman,
    "halaman_sekarang" => $page,
    "total_data"       => $total_data
];

header('Content-Type: application/json');
echo json_encode($response);
?>
