<?php
require_once 'config.php';
$data = getData();
?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Архив Медиа</title>
    <style>
        :root { --primary: #6200ea; --bg: #121212; --surface: #1e1e1e; --text: #ffffff; }
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: var(--bg); color: var(--text); padding-bottom: 80px; }
        
        /* Header */
        header { background: var(--surface); padding: 15px; text-align: center; position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 10px rgba(0,0,0,0.5); }
        h1 { margin: 0; font-size: 1.2rem; }

        /* Tabs */
        .tabs { display: flex; justify-content: center; background: var(--surface); padding: 10px; }
        .tab { padding: 8px 16px; border-radius: 20px; margin: 0 5px; cursor: pointer; background: #333; transition: 0.3s; }
        .tab.active { background: var(--primary); color: white; }

        /* Content */
        .container { padding: 15px; max-width: 800px; margin: 0 auto; }
        .section { display: none; }
        .section.active { display: block; }

        /* Audio Player Styles */
        .track-card { background: var(--surface); border-radius: 10px; padding: 15px; margin-bottom: 15px; display: flex; align-items: center; gap: 15px; }
        .track-icon { font-size: 24px; background: #333; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; border-radius: 50%; }
        .track-info { flex: 1; overflow: hidden; }
        .track-name { font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .track-status { font-size: 12px; color: #aaa; }
        audio { width: 100%; margin-top: 10px; height: 40px; }
        
        /* Photo Grid */
        .photo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
        .photo-item { position: relative; aspect-ratio: 1; background: #333; border-radius: 8px; overflow: hidden; cursor: pointer; }
        .photo-item img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
        .photo-item:active img { transform: scale(0.95); }
        .download-btn { position: absolute; bottom: 5px; right: 5px; background: rgba(0,0,0,0.7); color: white; border: none; padding: 5px 10px; border-radius: 4px; font-size: 12px; text-decoration: none; }

        /* Loader */
        .loader { border: 3px solid #333; border-top: 3px solid var(--primary); border-radius: 50%; width: 20px; height: 20px; animation: spin 1s linear infinite; display: none; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

        /* Fixed Player Bar */
        #fixed-player { position: fixed; bottom: 0; left: 0; right: 0; background: #2c2c2c; padding: 10px; display: none; flex-direction: column; align-items: center; border-top: 1px solid #444; z-index: 200; }
        #fixed-player.visible { display: flex; }
        #fp-title { font-size: 12px; margin-bottom: 5px; color: #ccc; }
        #fp-audio { width: 100%; max-width: 600px; }
    </style>
</head>
<body>

<header>
    <h1>Media Archive Beta</h1>
</header>

<div class="tabs">
    <div class="tab active" onclick="switchTab('audio')">Аудио</div>
    <div class="tab" onclick="switchTab('photo')">Фото</div>
</div>

<div class="container">
    <!-- Audio Section -->
    <div id="audio-section" class="section active">
        <h2>Треки</h2>
        <div id="tracks-container">Загрузка...</div>
    </div>

    <!-- Photo Section -->
    <div id="photo-section" class="section">
        <h2>Галерея</h2>
        <div id="photos-container" class="photo-grid">Загрузка...</div>
    </div>
</div>

<!-- Fixed Player -->
<div id="fixed-player">
    <div id="fp-title">Выберите трек</div>
    <audio id="fp-audio" controls></audio>
</div>

<script>
    const tracksData = <?php echo json_encode($data['tracks']); ?>;
    const photosData = <?php echo json_encode($data['photos']); ?>;

    // Переключение вкладок
    function switchTab(tab) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        
        if(tab === 'audio') {
            document.querySelector('.tab:nth-child(1)').classList.add('active');
            document.getElementById('audio-section').classList.add('active');
        } else {
            document.querySelector('.tab:nth-child(2)').classList.add('active');
            document.getElementById('photo-section').classList.add('active');
        }
    }

    // Функция получения данных через прокси
    async function fetchYandexData(publicKey) {
        try {
            const response = await fetch(`api.php?action=get&key=${encodeURIComponent(publicKey)}`);
            const data = await response.json();
            if (data.status === 'success') return data;
            throw new Error(data.error || 'Ошибка API');
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    // Рендер аудио
    async function renderTracks() {
        const container = document.getElementById('tracks-container');
        container.innerHTML = '';

        for (const item of tracksData) {
            const card = document.createElement('div');
            card.className = 'track-card';
            card.innerHTML = `
                <div class="track-icon">🎵</div>
                <div class="track-info">
                    <div class="track-name">Загрузка...</div>
                    <div class="track-status" id="status-${item.id}">Обработка ссылки</div>
                    <div class="loader" id="loader-${item.id}"></div>
                </div>
            `;
            container.appendChild(card);

            // Асинхронная загрузка метаданных
            (async () => {
                const loader = document.getElementById(`loader-${item.id}`);
                const status = document.getElementById(`status-${item.id}`);
                const nameEl = card.querySelector('.track-name');
                
                loader.style.display = 'block';
                
                const data = await fetchYandexData(item.link);
                loader.style.display = 'none';

                if (data && data.url) {
                    nameEl.textContent = data.name || 'Аудиофайл';
                    status.textContent = 'Готово к воспроизведению';
                    
                    // Кнопка Play внутри карточки
                    const playBtn = document.createElement('button');
                    playBtn.textContent = '▶ Слушать';
                    playBtn.style.cssText = "background:#6200ea; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; margin-top:5px;";
                    playBtn.onclick = () => playTrack(data.url, data.name);
                    card.querySelector('.track-info').appendChild(playBtn);

                    // Кнопка скачать
                    const dlBtn = document.createElement('a');
                    dlBtn.textContent = '⬇ Скачать';
                    dlBtn.href = data.url;
                    dlBtn.download = data.name;
                    dlBtn.style.cssText = "margin-left:10px; color:#aaa; text-decoration:none; font-size:12px;";
                    card.querySelector('.track-info').appendChild(dlBtn);

                } else {
                    nameEl.textContent = 'Ошибка';
                    status.textContent = 'Не удалось загрузить (ссылка приватна или неверна)';
                    status.style.color = '#ff5252';
                }
            })();
        }
    }

    // Глобальный плеер
    function playTrack(url, title) {
        const playerBar = document.getElementById('fixed-player');
        const audio = document.getElementById('fp-audio');
        const titleEl = document.getElementById('fp-title');
        
        playerBar.classList.add('visible');
        titleEl.textContent = title;
        audio.src = url;
        audio.play();
    }

    // Рендер фото
    async function renderPhotos() {
        const container = document.getElementById('photos-container');
        container.innerHTML = '';

        for (const item of photosData) {
            const wrapper = document.createElement('div');
            wrapper.className = 'photo-item';
            wrapper.innerHTML = `<div class="loader" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%)"></div>`;
            container.appendChild(wrapper);

            (async () => {
                const data = await fetchYandexData(item.link);
                wrapper.innerHTML = ''; // Убрать лоадер

                if (data && data.url) {
                    const img = document.createElement('img');
                    img.src = data.url;
                    img.loading = "lazy";
                    img.alt = data.name;
                    
                    const link = document.createElement('a');
                    link.href = data.url;
                    link.target = "_blank";
                    link.className = "download-btn";
                    link.textContent = "Открыть";

                    wrapper.appendChild(img);
                    wrapper.appendChild(link);
                    
                    // Клик по фото открывает его
                    wrapper.onclick = (e) => {
                        if(e.target !== link) window.open(data.url, '_blank');
                    };
                } else {
                    wrapper.innerHTML = '<div style="padding:10px; color:red; font-size:12px;">Ошибка загрузки</div>';
                }
            })();
        }
    }

    // Запуск
    renderTracks();
    renderPhotos();
</script>

</body>
</html>