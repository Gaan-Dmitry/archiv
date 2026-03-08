<?php
/**
 * API для управления архивом аудио и фото
 * 
 * Использование:
 * - GET /api.php?action=list - получить список всех треков и фото
 * - POST /api.php?action=add_audio - добавить аудио трек
 * - POST /api.php?action=add_photo - добавить фото
 * - POST /api.php?action=delete_audio&id=ID - удалить аудио
 * - POST /api.php?action=delete_photo&id=ID - удалить фото
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Обработка preflight запросов
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Файл для хранения данных
$dataFile = __DIR__ . '/data.json';

// Инициализация файла данных, если не существует
if (!file_exists($dataFile)) {
    $initialData = [
        'audio' => [
            ['id' => 1, 'name' => 'Демо трек 1', 'key' => 'https://yadi.sk/d/demo1'],
            ['id' => 2, 'name' => 'Демо трек 2', 'key' => 'https://yadi.sk/d/demo2']
        ],
        'photos' => [
            ['id' => 1, 'name' => 'Демо фото 1', 'key' => 'https://yadi.sk/d/demo-photo1'],
            ['id' => 2, 'name' => 'Демо фото 2', 'key' => 'https://yadi.sk/d/demo-photo2']
        ]
    ];
    file_put_contents($dataFile, json_encode($initialData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

// Загрузка данных
function loadData($dataFile) {
    $json = file_get_contents($dataFile);
    return json_decode($json, true);
}

// Сохранение данных
function saveData($dataFile, $data) {
    file_put_contents($dataFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

// Получение действия
$action = isset($_GET['action']) ? $_GET['action'] : '';

try {
    switch ($action) {
        case 'list':
            // Получить список всех данных
            $data = loadData($dataFile);
            echo json_encode([
                'success' => true,
                'data' => $data
            ]);
            break;

        case 'add_audio':
            // Добавить аудио трек
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                throw new Exception('Метод не разрешён');
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input) {
                $input = $_POST;
            }
            
            if (empty($input['name']) || empty($input['key'])) {
                throw new Exception('Необходимо указать название и ключ');
            }
            
            $data = loadData($dataFile);
            $newId = count($data['audio']) > 0 ? max(array_column($data['audio'], 'id')) + 1 : 1;
            
            $data['audio'][] = [
                'id' => $newId,
                'name' => htmlspecialchars($input['name']),
                'key' => htmlspecialchars($input['key'])
            ];
            
            saveData($dataFile, $data);
            
            echo json_encode([
                'success' => true,
                'message' => 'Аудио трек добавлен',
                'id' => $newId
            ]);
            break;

        case 'add_photo':
            // Добавить фото
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                throw new Exception('Метод не разрешён');
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input) {
                $input = $_POST;
            }
            
            if (empty($input['name']) || empty($input['key'])) {
                throw new Exception('Необходимо указать название и ключ');
            }
            
            $data = loadData($dataFile);
            $newId = count($data['photos']) > 0 ? max(array_column($data['photos'], 'id')) + 1 : 1;
            
            $data['photos'][] = [
                'id' => $newId,
                'name' => htmlspecialchars($input['name']),
                'key' => htmlspecialchars($input['key'])
            ];
            
            saveData($dataFile, $data);
            
            echo json_encode([
                'success' => true,
                'message' => 'Фото добавлено',
                'id' => $newId
            ]);
            break;

        case 'delete_audio':
            // Удалить аудио трек
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                throw new Exception('Метод не разрешён');
            }
            
            $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
            if ($id <= 0) {
                throw new Exception('Неверный ID');
            }
            
            $data = loadData($dataFile);
            $data['audio'] = array_values(array_filter($data['audio'], function($track) use ($id) {
                return $track['id'] !== $id;
            }));
            
            saveData($dataFile, $data);
            
            echo json_encode([
                'success' => true,
                'message' => 'Аудио трек удалён'
            ]);
            break;

        case 'delete_photo':
            // Удалить фото
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                throw new Exception('Метод не разрешён');
            }
            
            $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
            if ($id <= 0) {
                throw new Exception('Неверный ID');
            }
            
            $data = loadData($dataFile);
            $data['photos'] = array_values(array_filter($data['photos'], function($photo) use ($id) {
                return $photo['id'] !== $id;
            }));
            
            saveData($dataFile, $data);
            
            echo json_encode([
                'success' => true,
                'message' => 'Фото удалено'
            ]);
            break;

        default:
            echo json_encode([
                'success' => false,
                'message' => 'Неизвестное действие. Доступные: list, add_audio, add_photo, delete_audio, delete_photo'
            ]);
            break;
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
