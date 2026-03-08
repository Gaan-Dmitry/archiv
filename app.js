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

// 4. Список файлов ( MOCK DATA - замени ссылки на свои с Яндекс.Диска )
const mediaList = [
    { id: '1', type: 'audio', title: 'Трек 1', url: 'https://disk.yandex.ru/d/cCooKS2Id0KMDA' },
    { id: '2', type: 'image', title: 'Фото 1', url: 'https://via.placeholder.com/300' }
];

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
                const response = await fetch(item.url);
                const blob = await response.blob();
                await saveFile(item.id, blob, item.type);
                btn.textContent = 'Уже загружено';
                btn.disabled = true;
                alert('Файл сохранен!');
                render(); // Перерисовать
            } catch (e) {
                alert('Ошибка загрузки (проверьте интернет)');
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