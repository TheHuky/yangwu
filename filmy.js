// Wklej tutaj wygenerowany link CSV z Google Sheets
const FILMY_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSQ-tgBypzuLu3LKz2n9jeMbmqZOAJaT4jboMiyEMpmL3yNg0eJLqGnL2pNU-6FQratpJAkctYJV0Lm/pub?gid=0&single=true&output=csv';

// Funkcja, która wyciąga ID filmu z dowolnego linku YouTube
function wyciagnijIdYouTube(url) {
    // Jeśli ktoś przez przypadek wpisał samo ID (11 znaków bez ukośników)
    if (url.length === 11 && !url.includes('/')) return url;
    
    // Wyciąganie ID z pełnych linków (np. watch?v=, youtu.be/)
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : null;
}

async function loadVideosFromSheets() {
    try {
        // Dodajemy datę do linku, żeby ominąć cache (zawsze pobierze najnowszą wersję!)
        const response = await fetch(FILMY_SHEET_URL + '&t=' + new Date().getTime());
        if (!response.ok) throw new Error('Brak odpowiedzi z Google Sheets');
        
        const data = await response.text();
        const rows = data.split('\n').slice(1); // Pomijamy nagłówki
        
        const containerNeska = document.getElementById('videos-container-neska');
        const containerHukirox = document.getElementById('videos-container-hukirox');
        
        if (containerNeska) containerNeska.innerHTML = '';
        if (containerHukirox) containerHukirox.innerHTML = '';

        rows.forEach(row => {
            if (!row.trim()) return;

            const columns = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || row.split(',');
            
            if (columns.length >= 3) {
                const title = columns[0].replace(/^"|"$/g, '').trim();
                const rawLink = columns[1].replace(/^"|"$/g, '').trim();
                const category = columns[2].replace(/^"|"$/g, '').trim().toLowerCase();

                // Wyciągamy ID i generujemy poprawne linki
                const videoId = wyciagnijIdYouTube(rawLink);
                if (!videoId) return; // Jeśli link jest błędny, pomija ten wiersz

                const videoLink = `https://www.youtube.com/watch?v=${videoId}`;
                const thumbnailLink = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

                // Automatyczny opis
                let autoDescription = '';
                if (category === 'lejdineska') {
                    autoDescription = `Oglądaj najnowszy film od LejdiNeska! Kliknij, aby przejść do serwisu YouTube i zobaczyć cały materiał.`;
                } else if (category === 'hukirox') {
                    autoDescription = `Sprawdź najnowsze wideo na kanale Hukirox! Kliknij w kafelek, aby odpalić materiał bezpośrednio na YouTube.`;
                }

                // Szablon HTML kafelka
                const videoHtml = `
                    <a href="${videoLink}" target="_blank" class="video-card">
                        <div class="video-thumbnail-wrapper">
                            <img src="${thumbnailLink}" alt="${title}" class="video-thumbnail" loading="lazy">
                            <i class="fa-brands fa-youtube play-icon"></i>
                        </div>
                        <div class="video-info">
                            <h3 class="video-title">${title}</h3>
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
        });
    } catch (error) {
        console.error('Błąd podczas ładowania filmów:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadVideosFromSheets();
});
