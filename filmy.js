// Wklej tutaj wygenerowany link CSV z Google Sheets
const FILMY_SHEET_URL = 'TWÓJ_LINK_DO_PLIKU_CSV_TUTAJ';

// Funkcja wyciągająca ID filmu z linku
function wyciagnijIdYouTube(url) {
    if (url.length === 11 && !url.includes('/')) return url;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : null;
}

// Funkcja pobierająca tytuł bezpośrednio z serwerów YouTube (oEmbed)
async function pobierzTytulYouTube(videoId) {
    try {
        const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
        if (response.ok) {
            const data = await response.json();
            return data.title; // Zwraca oryginalny tytuł filmu z YT
        }
    } catch (error) {
        console.error("Błąd pobierania tytułu dla ID " + videoId, error);
    }
    return "Nowy materiał wideo!"; // Tytuł awaryjny, gdyby YT nie odpowiedział
}

async function loadVideosFromSheets() {
    try {
        const response = await fetch(FILMY_SHEET_URL + '&t=' + new Date().getTime());
        if (!response.ok) throw new Error('Brak odpowiedzi z Google Sheets');
        
        const data = await response.text();
        const rows = data.split('\n').slice(1); // Pomijamy nagłówki
        
        const containerNeska = document.getElementById('videos-container-neska');
        const containerHukirox = document.getElementById('videos-container-hukirox');
        
        if (containerNeska) containerNeska.innerHTML = '';
        if (containerHukirox) containerHukirox.innerHTML = '';

        // Używamy pętli for...of, aby móc użyć 'await' przy pobieraniu tytułów
        for (const row of rows) {
            if (!row.trim()) continue;

            const columns = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || row.split(',');
            
            if (columns.length >= 2) {
                const rawLink = columns[0].replace(/^"|"$/g, '').trim();
                const category = columns[1].replace(/^"|"$/g, '').trim().toLowerCase();

                const videoId = wyciagnijIdYouTube(rawLink);
                if (!videoId) continue;

                // AUTOMATYCZNE POBIERANIE TYTUŁU Z YT
                const title = await pobierzTytulYouTube(videoId);

                const videoLink = `https://www.youtube.com/watch?v=${videoId}`;
                const thumbnailLink = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`; // 'mqdefault' daje mniejszy, zoptymalizowany plik

                // Automatyczny opis
                let autoDescription = '';
                if (category === 'lejdineska') {
                    autoDescription = `Kliknij, aby obejrzeć u LejdiNeski!`;
                } else if (category === 'hukirox') {
                    autoDescription = `Kliknij, aby obejrzeć u Hukiroxa!`;
                }

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
        console.error('Błąd podczas ładowania filmów:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadVideosFromSheets();
});
