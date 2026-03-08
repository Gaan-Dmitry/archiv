<?php
// config.php
session_start();

$dataFile = 'data.json';

// Инициализация файла данных, если нет
if (!file_exists($dataFile)) {
    $initialData = ['tracks' => [], 'photos' => []];
    file_put_contents($dataFile, json_encode($initialData, JSON_PRETTY_PRINT));
}

function getData() {
    global $dataFile;
    return json_decode(file_get_contents($dataFile), true);
}

function saveData($data) {
    global $dataFile;
    file_put_contents($dataFile, json_encode($data, JSON_PRETTY_PRINT));
}

// Простая защита админки (пароль: admin123)
function checkAdmin() {
    if (!isset($_SESSION['is_admin']) || $_SESSION['is_admin'] !== true) {
        header('Location: admin.php?error=auth');
        exit;
    }
}
?>