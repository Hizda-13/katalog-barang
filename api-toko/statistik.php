<?php
include "koneksi.php";

header('Content-Type: application/json');

$query = "SELECT nama_barang, harga FROM barang ORDER BY harga DESC LIMIT 5";
$hasil = mysqli_query($koneksi, $query);

if (!$hasil) {
    echo json_encode(["status" => "error", "message" => mysqli_error($koneksi)]);
    exit;
}

$labels = [];
$values = [];

while ($baris = mysqli_fetch_assoc($hasil)) {
    $labels[] = $baris['nama_barang'];
    $values[] = (int) $baris['harga'];
}

$query_stats = "SELECT COUNT(*) as total, AVG(harga) as rata, MAX(harga) as maks, MIN(harga) as mini FROM barang";
$hasil_stats = mysqli_query($koneksi, $query_stats);
$stats       = mysqli_fetch_assoc($hasil_stats);

$response = [
    "status" => "success",
    "labels" => $labels,
    "values" => $values,
    "stats"  => [
        "total" => (int)   ($stats['total'] ?? 0),
        "rata"  => (float) ($stats['rata']  ?? 0),
        "maks"  => (int)   ($stats['maks']  ?? 0),
        "mini"  => (int)   ($stats['mini']  ?? 0),
    ]
];

echo json_encode($response);
?>