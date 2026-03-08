// Основное приложение для архива аудио и фото

// Хранилище данных (в реальном проекте использовать localStorage или сервер)
let audioTracks = [];
let photos = [];

// DOM элементы
const navAudio = document.getElementById('nav-audio');
const navPhoto = document.getElementById('nav-photo');
const navAdmin = document.getElementById('nav-admin');
const audioSection = document.getElementById('audio-section');
const photoSection = document.getElementById('photo-section');
const adminSection = document.getElementById('admin-section');
const audioList = document.getElementById('audio-list');
const photoList = document.getElementById('photo-list');
const adminAudioList = document.getElementById('admin-audio-list');
const adminPhotoList = document.getElementById('admin-photo-list');
const mainAudio = document.getElementById('main-audio');
const nowPlaying = document.getElementById('now-playing');
const addAudioForm = document.getElementById('add-audio-form');
const addPhotoForm = document.getElementById('add-photo-form');

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupNavigation();
    setupForms();
    renderAll();
    registerServiceWorker();
});

// Загрузка данных из localStorage
function loadData() {
    const savedAudio = localStorage.getItem('audioTracks');
    const savedPhotos = localStorage.getItem('photos');
    
    if (savedAudio) {
        audioTracks = JSON.parse(savedAudio);
    } else {
        // Демо данные
        audioTracks = [
            { id: 1, name: 'Демо трек 1', key: 'https://yadi.sk/d/demo1' },
            { id: 2, name: 'Демо трек 2', key: 'https://yadi.sk/d/demo2' }
        ];
        saveData();
    }
    
    if (savedPhotos) {
        photos = JSON.parse(savedPhotos);
    } else {
        // Демо данные для фото
        photos = [
            { id: 1, name: 'Демо фото 1', key: 'https://yadi.sk/d/demo-photo1' },
            { id: 2, name: 'Демо фото 2', key: 'https://yadi.sk/d/demo-photo2' }
        ];
        saveData();
    }
}

// Сохранение данных в localStorage
function saveData() {
    localStorage.setItem('audioTracks', JSON.stringify(audioTracks));
    localStorage.setItem('photos', JSON.stringify(photos));
}

// Настройка навигации
function setupNavigation() {
    navAudio.addEventListener('click', () => switchSection('audio'));
    navPhoto.addEventListener('click', () => switchSection('photo'));
    navAdmin.addEventListener('click', () => switchSection('admin'));
}

// Переключение секций
function switchSection(section) {
    // Убираем активный класс со всех кнопок и секций
    navAudio.classList.remove('active');
    navPhoto.classList.remove('active');
    navAdmin.classList.remove('active');
    audioSection.classList.remove('active');
    photoSection.classList.remove('active');
    adminSection.classList.remove('active');
    
    // Добавляем активный класс нужной секции
    if (section === 'audio') {
        navAudio.classList.add('active');
        audioSection.classList.add('active');
    } else if (section === 'photo') {
        navPhoto.classList.add('active');
        photoSection.classList.add('active');
    } else if (section === 'admin') {
        navAdmin.classList.add('active');
        adminSection.classList.add('active');
    }
}

// Настройка форм
function setupForms() {
    addAudioForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('audio-name').value.trim();
        const key = document.getElementById('audio-key').value.trim();
        
        if (name && key) {
            addAudioTrack(name, key);
            addAudioForm.reset();
        }
    });
    
    addPhotoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('photo-name').value.trim();
        const key = document.getElementById('photo-key').value.trim();
        
        if (name && key) {
            addPhoto(name, key);
            addPhotoForm.reset();
        }
    });
}

// Добавление аудио трека
function addAudioTrack(name, key) {
    const newTrack = {
        id: Date.now(),
        name: name,
        key: key
    };
    audioTracks.push(newTrack);
    saveData();
    renderAll();
    alert('Аудио трек добавлен!');
}

// Добавление фото
function addPhoto(name, key) {
    const newPhoto = {
        id: Date.now(),
        name: name,
        key: key
    };
    photos.push(newPhoto);
    saveData();
    renderAll();
    alert('Фото добавлено!');
}

// Удаление аудио трека
function deleteAudioTrack(id) {
    if (confirm('Вы уверены, что хотите удалить этот трек?')) {
        audioTracks = audioTracks.filter(track => track.id !== id);
        saveData();
        renderAll();
    }
}

// Удаление фото
function deletePhoto(id) {
    if (confirm('Вы уверены, что хотите удалить это фото?')) {
        photos = photos.filter(photo => photo.id !== id);
        saveData();
        renderAll();
    }
}

// Получение прямой ссылки на файл через Яндекс.Диск API
async function getDirectLink(publicKey) {
    try {
        const response = await fetch(
            `https://cloud-api.yandex.net/v1/disk/public/resources?public_key=${encodeURIComponent(publicKey)}`
        );
        
        if (!response.ok) {
            throw new Error('Ошибка API Яндекс.Диска');
        }
        
        const data = await response.json();
        return data.file || null;
    } catch (error) {
        console.error('Ошибка получения прямой ссылки:', error);
        return null;
    }
}

// Рендеринг всех списков
function renderAll() {
    renderAudioList();
    renderPhotoList();
    renderAdminLists();
}

// Рендеринг списка аудио
async function renderAudioList() {
    audioList.innerHTML = '';
    
    for (const track of audioTracks) {
        const item = document.createElement('div');
        item.className = 'media-item';
        
        const directLink = await getDirectLink(track.key);
        
        item.innerHTML = `
            <h3>${track.name}</h3>
            ${directLink ? `
                <audio controls preload="metadata">
                    <source src="${directLink}" type="audio/mpeg">
                    Ваш браузер не поддерживает аудиоэлемент.
                </audio>
            ` : '<p>⚠️ Не удалось загрузить превью</p>'}
            <div class="actions">
                ${directLink ? `
                    <button class="btn-play" onclick="playTrack('${directLink}', '${track.name}')">▶️ Play</button>
                    <button class="btn-download" onclick="downloadFile('${directLink}', '${track.name}.mp3')">⬇️ Скачать</button>
                    <button class="btn-cache" onclick="cacheFile('${directLink}', '${track.name}')">💾 В кэш</button>
                ` : ''}
            </div>
        `;
        
        audioList.appendChild(item);
    }
}

// Рендеринг списка фото (заглушка)
async function renderPhotoList() {
    photoList.innerHTML = '';
    
    for (const photo of photos) {
        const item = document.createElement('div');
        item.className = 'media-item';
        
        // Для фото пока заглушка (бета-версия)
        item.innerHTML = `
            <div class="photo-placeholder">📷</div>
            <h3>${photo.name}</h3>
            <p class="beta-notice" style="font-size: 12px; margin-bottom: 10px;">Бета: фото отображается как заглушка</p>
            <div class="actions">
                <button class="btn-download" onclick="openYandexLink('${photo.key}')">🔗 Открыть в Яндекс.Диске</button>
            </div>
        `;
        
        photoList.appendChild(item);
    }
}

// Рендеринг админ-панели
function renderAdminLists() {
    adminAudioList.innerHTML = '<h3>Аудио треки</h3>';
    adminPhotoList.innerHTML = '<h3>Фотографии</h3>';
    
    audioTracks.forEach(track => {
        const item = document.createElement('div');
        item.className = 'admin-item';
        item.innerHTML = `
            <div class="item-info">
                <div class="item-name">${track.name}</div>
                <div class="item-key">${track.key}</div>
            </div>
            <button class="btn-delete" onclick="deleteAudioTrack(${track.id})">Удалить</button>
        `;
        adminAudioList.appendChild(item);
    });
    
    photos.forEach(photo => {
        const item = document.createElement('div');
        item.className = 'admin-item';
        item.innerHTML = `
            <div class="item-info">
                <div class="item-name">${photo.name}</div>
                <div class="item-key">${photo.key}</div>
            </div>
            <button class="btn-delete" onclick="deletePhoto(${photo.id})">Удалить</button>
        `;
        adminPhotoList.appendChild(item);
    });
}

// Воспроизведение трека в главном плеере
function playTrack(url, name) {
    mainAudio.src = url;
    nowPlaying.textContent = '🎵 Сейчас играет: ' + name;
    mainAudio.play();
}

// Скачивание файла
function downloadFile(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Кэширование файла (Service Worker)
async function cacheFile(url, name) {
    if ('serviceWorker' in navigator) {
        try {
            const cache = await caches.open('audio-cache-v1');
            const response = await fetch(url);
            await cache.put(url, response);
            alert(`Файл "${name}" добавлен в кэш!`);
        } catch (error) {
            console.error('Ошибка кэширования:', error);
            alert('Не удалось добавить в кэш: ' + error.message);
        }
    } else {
        alert('Service Worker не поддерживается вашим браузером');
    }
}

// Открытие ссылки на Яндекс.Диск
function openYandexLink(key) {
    window.open(key, '_blank');
}

// Регистрация Service Worker для офлайн-работы и кэширования
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('Service Worker зарегистрирован:', registration.scope);
            })
            .catch(error => {
                console.log('Ошибка регистрации Service Worker:', error);
            });
    }
}

// Глобальные функции для доступа из HTML
window.playTrack = playTrack;
window.downloadFile = downloadFile;
window.cacheFile = cacheFile;
window.openYandexLink = openYandexLink;
window.deleteAudioTrack = deleteAudioTrack;
window.deletePhoto = deletePhoto;