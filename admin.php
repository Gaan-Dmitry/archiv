<?php
// admin.php
require_once 'config.php';

// Обработка входа
if (isset($_POST['password'])) {
    if ($_POST['password'] === 'admin123') { // ПАРОЛЬ АДМИНА
        $_SESSION['is_admin'] = true;
    } else {
        $error = "Неверный пароль";
    }
}

// Проверка прав
$isAdmin = isset($_SESSION['is_admin']) && $_SESSION['is_admin'];

// Добавление контента
if ($isAdmin && isset($_POST['add_link'])) {
    $data = getData();
    $link = trim($_POST['yandex_link']);
    $type = $_POST['content_type']; // 'track' или 'photo'
    
    if (!empty($link)) {
        $data[$type . 's'][] = [
            'id' => time(),
            'link' => $link,
            'added_at' => date('Y-m-d H:i:s')
        ];
        saveData($data);
        $success = "Ссылка добавлена!";
    }
}

// Удаление
if ($isAdmin && isset($_GET['delete'])) {
    $data = getData();
    $type = $_GET['type'] . 's';
    $id = (int)$_GET['delete'];
    $data[$type] = array_filter($data[$type], function($item) use ($id) {
        return $item['id'] !== $id;
    });
    saveData($data);
    header("Location: admin.php");
    exit;
}
?>

<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Админ-панель</title>
    <style>
        body { font-family: sans-serif; max-width: 800px; margin: 20px auto; padding: 20px; background: #f4f4f9; }
        .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); margin-bottom: 20px; }
        input, select, button { width: 100%; padding: 10px; margin: 5px 0; box-sizing: border-box; }
        button { background: #007bff; color: white; border: none; cursor: pointer; }
        button:hover { background: #0056b3; }
        .item-list { list-style: none; padding: 0; }
        .item-list li { background: #fff; border-bottom: 1px solid #eee; padding: 10px; display: flex; justify-content: space-between; align-items: center; }
        .delete-btn { background: #dc3545; width: auto; padding: 5px 10px; font-size: 12px; }
        .login-form { max-width: 400px; margin: 50px auto; }
    </style>
</head>
<body>

<h1>Управление архивом</h1>
<a href="index.php" style="display:inline-block; margin-bottom:10px;">→ Перейти на сайт</a>

<?php if (!$isAdmin): ?>
    <div class="card login-form">
        <h3>Вход для админа</h3>
        <?php if(isset($error)) echo "<p style='color:red'>$error</p>"; ?>
        <form method="POST">
            <input type="password" name="password" placeholder="Пароль (admin123)" required>
            <button type="submit">Войти</button>
        </form>
    </div>
<?php else: ?>
    
    <div class="card">
        <h3>Добавить контент</h3>
        <?php if(isset($success)) echo "<p style='color:green'>$success</p>"; ?>
        <form method="POST">
            <label>Тип контента:</label>
            <select name="content_type">
                <option value="track">Аудио трек</option>
                <option value="photo">Фотография</option>
            </select>
            
            <label>Ссылка на Яндекс.Диск (публичная):</label>
            <input type="text" name="yandex_link" placeholder="https://disk.yandex.ru/d/..." required>
            <small>Можно ссылку на отдельный файл или на папку.</small>
            
            <button type="submit" name="add_link">Добавить</button>
        </form>
    </div>

    <div class="card">
        <h3>Список треков</h3>
        <ul class="item-list">
            <?php foreach (getData()['tracks'] as $item): ?>
                <li>
                    <span><?php echo htmlspecialchars($item['link']); ?></span>
                    <a href="?delete=<?php echo $item['id']; ?>&type=track" class="delete-btn">Удалить</a>
                </li>
            <?php endforeach; ?>
        </ul>
    </div>

    <div class="card">
        <h3>Список фото</h3>
        <ul class="item-list">
            <?php foreach (getData()['photos'] as $item): ?>
                <li>
                    <span><?php echo htmlspecialchars($item['link']); ?></span>
                    <a href="?delete=<?php echo $item['id']; ?>&type=photo" class="delete-btn">Удалить</a>
                </li>
            <?php endforeach; ?>
        </ul>
    </div>
    
    <form method="POST" action="" style="margin-top:20px;">
        <!-- Кнопка выхода через разрушение сессии в реальном проекте, здесь просто редирект для примера -->
        <button type="button" onclick="alert('Для выхода закройте вкладку или очистите куки')">Выйти</button>
    </form>
<?php endif; ?>

</body>
</html>