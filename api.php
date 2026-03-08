<?php
// api.php
header('Content-Type: application/json');
require_once 'config.php';

$action = $_GET['action'] ?? '';
$publicKey = $_GET['key'] ?? '';

if (!$publicKey) {
    http_response_code(400);
    echo json_encode(['error' => 'Нет ключа']);
    exit;
}

// Извлекаем чистый ключ из полной ссылки, если прислали ссылку
if (strpos($publicKey, 'disk.yandex') !== false) {
    $parts = explode('/', parse_url($publicKey, PHP_URL_PATH));
    $publicKey = end($parts);
}

$yandexUrl = "https://cloud-api.yandex.net/v1/disk/public/resources?public_key=" . urlencode($publicKey);

// Инициализируем cURL для запроса к Яндексу (обход CORS)
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $yandexUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true); // Важно для редиректов Яндекса
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200 && $response) {
    $data = json_decode($response, true);
    
    // Если это папка, возвращаем список файлов внутри
    if (isset($data['_embedded']['items'])) {
        $items = [];
        foreach ($data['_embedded']['items'] as $item) {
            if ($item['type'] === 'file') {
                $items[] = [
                    'name' => $item['name'],
                    'url' => $item['file'], // Прямая ссылка
                    'type' => strpos($item['mime_type'], 'image') !== false ? 'image' : 'audio'
                ];
            }
        }
        echo json_encode(['status' => 'success', 'type' => 'folder', 'items' => $items]);
    } 
    // Если это одиночный файл
    elseif (isset($data['file'])) {
        $type = strpos($data['mime_type'], 'image') !== false ? 'image' : 'audio';
        echo json_encode([
            'status' => 'success', 
            'type' => 'file', 
            'name' => $data['name'],
            'url' => $data['file'],
            'media_type' => $type
        ]);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Файл не найден или ссылка некорректна']);
    }
} else {
    http_response_code($httpCode);
    echo json_encode(['error' => 'Ошибка API Яндекс.Диска', 'details' => $response]);
}
?>