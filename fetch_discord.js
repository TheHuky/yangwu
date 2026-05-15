const fs = require('fs');

const TOKEN = process.env.DISCORD_TOKEN;
// WAŻNE: Tutaj wklej ID kanału #ogłoszenia
const CHANNEL_ID = '1503491827884625990'; 

async function loadDiscordAnnouncements() {
    const container = document.querySelector('.announcements-grid');
    if (!container) return;
    
    try {
        // ZMIANA: Dodajemy cache: 'no-store', aby przeglądarka nigdy nie trzymała starych ogłoszeń w pamięci
        const response = await fetch('announcements.json?' + new Date().getTime(), { cache: 'no-store' }); 
        
        if(!response.ok) {
            container.innerHTML = '<p style="text-align:center; color:#555; margin-top:20px;">Brak aktualnych ogłoszeń z Discorda.</p>';
            return;
        }

        const messages = await response.json();
        if (messages.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#555; margin-top:20px;">Brak aktualnych ogłoszeń z Discorda.</p>';
            return;
        }

        container.innerHTML = ''; // Czyścimy stare wpisy

        messages.forEach(msg => {
            const isLejdi = msg.author.toLowerCase().includes('neska');
            const themeClass = isLejdi ? 'announce-lejdi' : 'announce-hukiro';
            const avatarImg = isLejdi ? 'avatarneska.png' : 'avatarhukirox.png';
            const authorName = isLejdi ? 'LejdiNeska' : 'Hukirox';

            const cardHTML = `
                <div class="announcement-card ${themeClass}">
                    <div class="announcement-header">
                        <div class="announcement-author">
                            <img src="${avatarImg}" class="announcement-avatar">
                            <div class="announcement-meta">
                                <h4>${authorName}</h4>
                                <span>${msg.date}</span>
                            </div>
                        </div>
                        <div class="announcement-discord-badge"><i class="fa-brands fa-discord"></i> #ogłoszenia</div>
                    </div>
                    <div class="announcement-content">${msg.content}</div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', cardHTML);
        });
    } catch (error) {
        console.error('Błąd podczas ładowania ogłoszeń:', error);
        container.innerHTML = '<p style="text-align:center; color:#ff0055; margin-top:20px;">Nie udało się połączyć z bazą ogłoszeń.</p>';
    }
}
