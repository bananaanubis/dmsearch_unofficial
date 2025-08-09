<?php
try {
    if (getenv('RAILWAY_ENVIRONMENT')) {
        $db_host = getenv('MYSQLHOST');
        $db_port = getenv('MYSQLPORT');
        $db_name = getenv('MYSQLDATABASE');
        $db_user = getenv('MYSQLUSER');
        $db_pass = getenv('MYSQLPASSWORD');
    } else {
        $db_host = '127.0.0.1';
        $db_port = 3306;
        $db_name = 'dmsearch'; // あなたのローカルDB名
        $db_user = 'root';
        $db_pass = '';
    }
    $dsn = "mysql:host={$db_host};port={$db_port};dbname={$db_name};charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    $pdo = new PDO($dsn, $db_user, $db_pass, $options);
} catch (PDOException $e) {
    // APIの場合はJSONでエラーを返すなどの処理も可能
    http_response_code(500);
    die("DATABASE CONNECTION FAILED: " . $e->getMessage());
}
?>
