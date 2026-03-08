const DB_NAME = 'MediaDB';
const DB_VERSION = 1;
const STORE_NAME = 'files';

// 1. Инициализация базы данных
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// 2. Сохранение файла в базу (Blob)
async function saveFile(id, blob, type) {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put({ id, blob, type, savedAt: new Date() });
    return tx.complete;
}

// 3. Получение файла из базы
async function getFile(id) {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    return new Promise((resolve) => {
        const req = tx.objectStore(STORE_NAME).get(id);
        req.onsuccess = () => resolve(req.result);
    });
}

// 4. Список файлов
// ВАЖНО: Для Яндекс.Диска используйте ПРЯМЫЕ ссылки на файлы
// Как получить прямую ссылку:
// 1. Откройте файл на disk.yandex.ru
// 2. Нажмите "Поделиться" → "Скопировать ссылку"
// 3. Используйте сервис для получения прямой ссылки, например:
//    https://yadi.sk/d/<ID_ФАЙЛА> → конвертируйте через api или используйте 
//    форму: https://cloud-api.yandex.net/v1/disk/public/resources?public_key=<URL>&path=/&limit=100
//
// Пример прямой ссылки (замените на свои):
const mediaList = [
    { id: '1', type: 'audio', title: 'Трек 1', url: 'https://downloader.disk.yandex.ru/disk/...ВАША_ПРЯМАЯ_ССЫЛКА...' },
    { id: '2', type: 'image', title: 'Фото 1', url: 'https://downloader.disk.yandex.ru/disk/...ВАША_ПРЯМАЯ_ССЫЛКА...' }
];

// Функция для получения прямой ссылки из публичной ссылки Яндекс.Диска
async function getDirectLink(publicUrl) {
    // Используем прокси для обхода CORS
    const corsProxy = 'https://api.allorigins.win/raw?url=';
    const apiUrl = `https://cloud-api.yandex.net/v1/disk/public/resources?public_key=${encodeURIComponent(publicUrl)}&path=/`;
    
    try {
        const response = await fetch(corsProxy + encodeURIComponent(apiUrl));
        const data = await response.json();
        
        if (data._embedded && data._embedded.items && data._embedded.items.length > 0) {
            return data._embedded.items[0].file; // Прямая ссылка на файл
        }
        throw new Error('Файл не найден');
    } catch (e) {
        console.error('Ошибка получения прямой ссылки:', e);
        throw e;
    }
}

// 5. Отрисовка интерфейса
async function render() {
    const app = document.getElementById('app');
    const status = document.getElementById('status');
    
    // Обновление статуса сети
    status.textContent = navigator.onLine ? 'Статус: Онлайн' : 'Статус: Оффлайн';
    status.style.color = navigator.onLine ? '#0f0' : '#f00';

    app.innerHTML = '';

    for (const item of mediaList) {
        const card = document.createElement('div');
        card.className = 'card';
        
        const title = document.createElement('h3');
        title.textContent = item.title;
        card.appendChild(title);

        const btn = document.createElement('button');
        btn.textContent = 'Загрузить для оффлайн';
        
        // Проверка, есть ли уже в базе
        const cached = await getFile(item.id);
        if (cached) {
            btn.textContent = 'Уже загружено';
            btn.disabled = true;
        }

        btn.onclick = async () => {
            btn.textContent = 'Загрузка...';
            try {
                let directUrl = item.url;
                
                // Если ссылка на папку/диск Яндекс, получаем прямую ссылку
                if (item.url.includes('disk.yandex.ru') || item.url.includes('yadi.sk')) {
                    try {
                        directUrl = await getDirectLink(item.url);
                    } catch (e) {
                        alert('Не удалось получить прямую ссылку. Убедитесь, что файл доступен по публичной ссылке.');
                        btn.textContent = 'Ошибка';
                        return;
                    }
                }
                
                const response = await fetch(directUrl);
                const blob = await response.blob();
                await saveFile(item.id, blob, item.type);
                btn.textContent = 'Уже загружено';
                btn.disabled = true;
                alert('Файл сохранен!');
                render(); // Перерисовать
            } catch (e) {
                console.error('Ошибка загрузки:', e);
                alert('Ошибка загрузки (проверьте интернет и ссылку)');
                btn.textContent = 'Ошибка';
            }
        };

        card.appendChild(btn);

        // Контейнер для медиа
        const mediaContainer = document.createElement('div');
        mediaContainer.id = `media-${item.id}`;
        card.appendChild(mediaContainer);

        // Кнопка воспроизведения/просмотра
        const playBtn = document.createElement('button');
        playBtn.textContent = 'Смотреть/Слушать';
        playBtn.style.marginTop = '10px';
        playBtn.style.background = '#28a745';
        
        playBtn.onclick = async () => {
            const cached = await getFile(item.id);
            let src = item.url; // По умолчанию из сети

            if (cached) {
                src = URL.createObjectURL(cached.blob); // Из базы
            } else if (!navigator.onLine) {
                alert('Нет интернета и файл не загружен!');
                return;
            } else {
                // Если онлайн и нет кэша, пробуем получить прямую ссылку
                if (item.url.includes('disk.yandex.ru') || item.url.includes('yadi.sk')) {
                    try {
                        src = await getDirectLink(item.url);
                    } catch (e) {
                        alert('Не удалось получить ссылку для просмотра');
                        return;
                    }
                }
            }

            mediaContainer.innerHTML = ''; // Очистить старое
            if (item.type === 'audio') {
                const audio = document.createElement('audio');
                audio.controls = true;
                audio.src = src;
                mediaContainer.appendChild(audio);
            } else if (item.type === 'image') {
                const img = document.createElement('img');
                img.src = src;
                mediaContainer.appendChild(img);
            }
        };

        card.appendChild(playBtn);
        app.appendChild(card);
    }
}

// Запуск
window.addEventListener('load', render);
window.addEventListener('online', render);
window.addEventListener('offline', render);