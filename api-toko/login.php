<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["status" => "error", "message" => "Method tidak diizinkan!"]);
    exit();
}

require_once 'koneksi.php';

$input = json_decode(file_get_contents("php://input"), true);

if (!isset($input['username']) || !isset($input['password'])) {
    echo json_encode(["status" => "error", "message" => "Username dan password wajib diisi!"]);
    exit();
}

$username = mysqli_real_escape_string($koneksi, trim($input['username']));
$password = md5(trim($input['password'])); // password di-hash MD5

// Cari user dengan username + password MD5 yang cocok
$query  = "SELECT * FROM users WHERE username = '$username' AND password = '$password' LIMIT 1";
$result = mysqli_query($koneksi, $query);

if (!$result || mysqli_num_rows($result) === 0) {
    echo json_encode(["status" => "error", "message" => "Username atau password salah!"]);
    exit();
}

$user = mysqli_fetch_assoc($result);

// Generate token unik
$token = bin2hex(random_bytes(32));

// Simpan token ke database
$updateQuery = "UPDATE users SET token = '$token' WHERE id = {$user['id']}";
mysqli_query($koneksi, $updateQuery);

echo json_encode([
    "status"   => "success",
    "message"  => "Login berhasil!",
    "token"    => $token,
    "username" => $user['username']
]);

mysqli_close($koneksi);
?>
