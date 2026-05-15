import fs from 'fs';

const TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = 'TUTAJ_TWÓJ_IDENTYFIKATOR_KANAŁU'; // Podmień na swój ID kanału

async function fetchMessages() {
  try {
    const response = await fetch(`https://discord.com/api/v10/channels/${CHANNEL_ID}/messages?limit=30`, {
      headers: {
        'Authorization': `Bot ${TOKEN}`
      }
    });
    
    if (!response.ok) {
      console.error('Błąd pobierania wiadomości:', response.status);
      return;
    }

    const messages = await response.json();
    
    // Wyrażenie regularne sprawdzające, czy w tekście jest choć jedna litera lub cyfra
    const hasTextRegex = /[\p{L}\p{N}]/u;

    const formatted = messages
      .filter(msg => {
        // 1. Odrzuć wiadomości od innych botów
        if (msg.author.bot) return false;

        // 2. Sprawdź czy pole tekstowe w ogóle istnieje
        if (!msg.content) return false;

        // 3. SPRAWDZENIE TEKSTU: Przepuść tylko jeśli zawiera litery lub cyfry
        if (!hasTextRegex.test(msg.content)) return false;

        return true;
      })
      .map(msg => {
        const date = new Date(msg.timestamp);
        const dateString = date.toLocaleDateString('pl-PL') + ', ' + date.toLocaleTimeString('pl-PL', {hour: '2-digit', minute:'2-digit'});
        
        return {
          id: msg.id,
          author: msg.author.username,
          content: msg.content.trim(),
          date: dateString
        };
      });

    // Bierzemy maksymalnie 5 najnowszych, prawdziwych ogłoszeń tekstowych
    const finalMessages = formatted.slice(0, 5);

    // Zapisujemy plik całkowicie od nowa (dzięki temu usunięte posty znikają z bazy)
    fs.writeFileSync('announcements.json', JSON.stringify(finalMessages, null, 2));
    console.log(`Pomyślnie zapisano ${finalMessages.length} ogłoszeń z tekstem.`);
  } catch (error) {
    console.error('Wystąpił błąd podczas przetwarzania:', error);
  }
}

fetchMessages();
