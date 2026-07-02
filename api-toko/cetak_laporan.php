<?php
// Cegah output apapun sebelum JSON
ob_start();

include "koneksi.php";

header('Content-Type: application/json');

// ── Workaround InfinityFree: getallheaders() tidak tersedia di PHP-CGI ──
function getTokenFromRequest() {
    // Cara 1: getallheaders() (shared hosting kadang tidak support)
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
        foreach ($headers as $key => $value) {
            if (strtolower($key) === 'authorization') {
                return trim(str_replace('Bearer ', '', $value));
            }
        }
    }
    // Cara 2: $_SERVER langsung
    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        return trim(str_replace('Bearer ', '', $_SERVER['HTTP_AUTHORIZATION']));
    }
    if (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        return trim(str_replace('Bearer ', '', $_SERVER['REDIRECT_HTTP_AUTHORIZATION']));
    }
    return '';
}

$token = getTokenFromRequest();

if (empty($token)) {
    ob_clean();
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized. Token tidak ditemukan."]);
    exit;
}

// Ambil semua data barang
$query = "SELECT id, nama_barang, harga FROM barang ORDER BY id ASC";
$hasil = mysqli_query($koneksi, $query);

if (!$hasil) {
    ob_clean();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => mysqli_error($koneksi)]);
    exit;
}

$data  = [];
$total = 0;

while ($baris = mysqli_fetch_assoc($hasil)) {
    $harga  = (int) $baris['harga'];
    $total += $harga;
    $data[] = [
        "id"          => (int) $baris['id'],
        "nama_barang" => $baris['nama_barang'],
        "harga"       => $harga,
    ];
}

$query_agg = "SELECT COUNT(*) as jumlah, AVG(harga) as rata, MAX(harga) as maks, MIN(harga) as mini FROM barang";
$hasil_agg = mysqli_query($koneksi, $query_agg);
$agg       = mysqli_fetch_assoc($hasil_agg);

ob_clean();
echo json_encode([
    "status"       => "success",
    "data"         => $data,
    "agregat"      => [
        "jumlah_barang" => (int)   ($agg['jumlah'] ?? 0),
        "total_aset"    => (int)   $total,
        "rata_harga"    => (float) ($agg['rata']   ?? 0),
        "harga_maks"    => (int)   ($agg['maks']   ?? 0),
        "harga_mini"    => (int)   ($agg['mini']   ?? 0),
    ],
    "dicetak_pada" => date('d F Y, H:i') . ' WIB',
]);
?>
