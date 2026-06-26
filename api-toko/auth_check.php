<?php
// Helper: cek Authorization header dan validasi token ke database
// Di-include oleh tambah_barang.php, hapus_barang.php, edit_barang.php

function ambilAuthHeader() {
    // Cara 1: getallheaders() — tidak selalu tersedia di semua server
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
        if (isset($headers['Authorization'])) return $headers['Authorization'];
        if (isset($headers['authorization'])) return $headers['authorization'];
    }

    // Cara 2: dari $_SERVER (selalu tersedia)
    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        return $_SERVER['HTTP_AUTHORIZATION'];
    }

    // Cara 3: REDIRECT_HTTP_AUTHORIZATION (untuk beberapa konfigurasi PHP-CGI)
    if (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        return $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    }

    return '';
}

function cekToken($koneksi) {
    $authHeader = ambilAuthHeader();

    // Format wajib: "Bearer <token>"
    if (empty($authHeader) || stripos($authHeader, 'Bearer ') !== 0) {
        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "Akses Ditolak! Token tidak ditemukan."]);
        exit();
    }

    $token = substr($authHeader, 7); // Ambil setelah "Bearer "
    $token = mysqli_real_escape_string($koneksi, trim($token));

    if (empty($token)) {
        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "Akses Ditolak! Token kosong."]);
        exit();
    }

    // Cek token di database
    $query = "SELECT id, username FROM users WHERE token = '$token' LIMIT 1";
    $result = mysqli_query($koneksi, $query);

    if (!$result || mysqli_num_rows($result) === 0) {
        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "Akses Ditolak! Token tidak valid."]);
        exit();
    }

    return mysqli_fetch_assoc($result);
}
?>