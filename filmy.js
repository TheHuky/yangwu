// Konfiguracja: Wklej tutaj swoje osobne linki CSV wygenerowane z Google Sheets
const NESKA_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQIN984aBz4cCp0zap9Qq2aytpXzImdBnuKT00jiZsphnWfHyjARCEsPcSY78ecofmBaBTP-rP0N9By/pub?gid=0&single=true&output=csv';
const HUKIROX_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSQ-tgBypzuLu3LKz2n9jeMbmqZOAJaT4jboMiyEMpmL3yNg0eJLqGnL2pNU-6FQratpJAkctYJV0Lm/pub?output=csv';

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

// Pomocnicza funkcja do pobierania i renderowania filmów z konkretnego arkusza
async function zaladujArkuszWideo(sheetUrl, defaultCategory, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';

    try {
        // Cache-buster (&t=...), aby strona zawsze pobierała najnowsze wpisy z tabeli
        const response = await fetch(sheetUrl + '&t=' + new Date().getTime());
        if (!response.ok) throw new Error('Brak odpowiedzi z Google Sheets dla ' + defaultCategory);
        
        const data = await response.text();
        const rows = data.split('\n').slice(1); // Pomijamy nagłówek tabeli
        
        // Mapujemy wiersze na obietnice (Promises), aby przetwarzać wszystkie filmy w arkuszu RÓWNOLEGLE
        const videoPromises = rows.map(async (row) => {
            if (!row.trim()) return null;
            
            // Parsowanie CSV zabezpieczone przed przecinkami w tekście
            const columns = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || row.split(',');
            
            if (columns.length >= 1) {
                const rawLink = columns[0].replace(/^"|"$/g, '').trim();
                
                const category = (columns.length >= 2 && columns[1]) 
                    ? columns[1].replace(/^"|"$/g, '').trim().toLowerCase() 
                    : defaultCategory;
        
                const videoId = wyciagnijIdYouTube(rawLink);
                if (!videoId) return null;

                // Pobieranie tytułu z YouTube startuje równolegle dla każdego filmu
                const title = await pobierzTytulYouTube(videoId);

                const videoLink = `https://www.youtube.com/watch?v=${videoId}`;
                const thumbnailLink = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

                let autoDescription = '';
                if (category === 'lejdineska') {
                    autoDescription = `Kliknij, aby obejrzeć u Neski`;
                } else if (category === 'hukirox') {
                    autoDescription = `Kliknij, aby obejrzeć u Hukiroxa`;
                }

                // Zwracamy gotowy kod HTML kafelka
                return `
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
            }
            return null;
        });

        // Czekamy, aż wszystkie filmy z danego arkusza zbiorą swoje dane
        const videoHtmlArray = await Promise.all(videoPromises);
        
        // Wstrzykujemy wszystkie wygenerowane kafelki na raz (płynny efekt bez skakania strony)
        videoHtmlArray.forEach(html => {
            if (html) container.insertAdjacentHTML('beforeend', html);
        });

    } catch (error) {
        console.error('Błąd podczas ładowania modułu wideo dla ' + defaultCategory + ':', error);
    }
}

// Główna funkcja wywoływana przy ładowaniu strony
async function loadVideosFromSheets() {
    // Używamy Promise.all, aby OBA arkusze (Neska i Hukirox) zaczęły pobierać się dokładnie w tej samej milisekundzie
    await Promise.all([
        zaladujArkuszWideo(NESKA_SHEET_URL, 'lejdineska', 'videos-container-neska'),
        zaladujArkuszWideo(HUKIROX_SHEET_URL, 'hukirox', 'videos-container-hukirox')
    ]);
}

document.addEventListener('DOMContentLoaded', () => {
    loadVideosFromSheets();
});

// Dynamiczne filtrowanie filmów na żywo w pasku wyszukiwania
document.addEventListener('input', (e) => {
    if (e.target.classList.contains('video-search-input')) {
        const query = e.target.value.toLowerCase().trim();
        const tile = e.target.closest('.video-scroller-tile');
        
        if (tile) {
            const cards = tile.querySelectorAll('.video-card');
            cards.forEach(card => {
                const titleText = card.querySelector('.video-title').textContent.toLowerCase();
                if (titleText.includes(query)) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        }
    }
});
