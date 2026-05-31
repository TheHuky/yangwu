// Konfiguracja: Wklej tutaj swój link CSV wygenerowany z Google Sheets
const FILMY_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSQ-tgBypzuLu3LKz2n9jeMbmqZOAJaT4jboMiyEMpmL3yNg0eJLqGnL2pNU-6FQratpJAkctYJV0Lm/pub?gid=0&single=true&output=csv';

// Funkcja wyciągająca ID filmu z dowolnego linku YouTube
function wyciagnijIdYouTube(url) {
    if (url.length === 11 && !url.includes('/')) return url;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : null;
}

// Bezpieczne pobieranie tytułu bezpośrednio z YouTube bez problemów z CORS
async function pobierzTytulYouTube(videoId) {
    try {
        const url = `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`;
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            return data.title || "Nowy materiał wideo!";
        }
    } catch (error) {
        console.error("Nie udało się pobrać tytułu dla filmu: " + videoId, error);
    }
    return "Nowy film na kanale!"; // Tytuł rezerwowy
}

async function loadVideosFromSheets() {
    try {
        // Cache-buster (&t=...), aby strona zawsze pobierała najnowsze wpisy z tabeli
        const response = await fetch(FILMY_SHEET_URL + '&t=' + new Date().getTime());
        if (!response.ok) throw new Error('Brak odpowiedzi z Google Sheets');
        
        const data = await response.text();
        const rows = data.split('\n').slice(1); // Pomijamy nagłówek tabeli
        
        const containerNeska = document.getElementById('videos-container-neska');
        const containerHukirox = document.getElementById('videos-container-hukirox');
        
        if (containerNeska) containerNeska.innerHTML = '';
        if (containerHukirox) containerHukirox.innerHTML = '';

        // Używamy pętli for...of dla prawidłowego oczekiwania na tytuły (await)
        for (const row of rows) {
            if (!row.trim()) continue;

            // Parsowanie CSV zabezpieczone przed przecinkami w tekście
            const columns = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || row.split(',');
            
            if (columns.length >= 2) {
                const rawLink = columns[0].replace(/^"|"$/g, '').trim();
                const category = columns[1].replace(/^"|"$/g, '').trim().toLowerCase();

                const videoId = wyciagnijIdYouTube(rawLink);
                if (!videoId) continue; // Pomija wiersz, jeśli link jest nieprawidłowy

                // Automatyczne pobranie prawdziwego tytułu z YouTube
                const title = await pobierzTytulYouTube(videoId);

                const videoLink = `https://www.youtube.com/watch?v=${videoId}`;
                const thumbnailLink = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`; // Zoptymalizowany, mniejszy rozmiar miniatury

                // Automatyczny krótki podopis pod tytułem
                let autoDescription = '';
                if (category === 'lejdineska') {
                    autoDescription = `Kliknij, aby obejrzeć u Neski`;
                } else if (category === 'hukirox') {
                    autoDescription = `Kliknij, aby obejrzeć u Hukiroxa`;
                }

                // Kompaktowy szablon poziomego kafelka
                const videoHtml = `
                    <a href="${videoLink}" target="_blank" class="video-card">
                        <div class="video-thumbnail-wrapper">
                            <img src="${thumbnailLink}" alt="${title}" class="video-thumbnail" loading="lazy">
                            <i class="fa-brands fa-youtube play-icon"></i>
                        </div>
                        <div class="video-info">
                            <h4 class="video-title">${title}</h4>
                            <p class="video-description">${autoDescription}</p>
                        </div>
                    </a>
                `;

                if (category === 'lejdineska' && containerNeska) {
                    containerNeska.insertAdjacentHTML('beforeend', videoHtml);
                } else if (category === 'hukirox' && containerHukirox) {
                    containerHukirox.insertAdjacentHTML('beforeend', videoHtml);
                }
            }
        }
    } catch (error) {
        console.error('Błąd podczas ładowania modułu wideo:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadVideosFromSheets();
});
