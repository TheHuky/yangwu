const fs = require('fs');

const TOKEN = process.env.DISCORD_TOKEN;
// WAŻNE: Tutaj wklej ID kanału #ogłoszenia
const CHANNEL_ID = 'TUTAJ_WPISZ_ID_KANALU'; 

async function fetchMessages() {
  // Pobieramy 5 ostatnich wiadomości z kanału
  const response = await fetch(`https://discord.com/api/v10/channels/${CHANNEL_ID}/messages?limit=5`, {
    headers: {
      'Authorization': `Bot ${TOKEN}`
    }
  });
  
  if (!response.ok) {
    console.error('Błąd pobierania wiadomości:', response.status);
    return;
  }

  const messages = await response.json();
  
  const formatted = messages.map(msg => {
    // Formatujemy datę na polski standard (np. "05.05.2026, 14:15")
    const date = new Date(msg.timestamp);
    const dateString = date.toLocaleDateString('pl-PL') + ', ' + date.toLocaleTimeString('pl-PL', {hour: '2-digit', minute:'2-digit'});
    
    // Filtrujemy tylko to, co nas interesuje
    return {
      id: msg.id,
      author: msg.author.username,
      content: msg.content,
      date: dateString
    };
  });

  // Zapisujemy wiadomości do pliku announcements.json
  fs.writeFileSync('announcements.json', JSON.stringify(formatted, null, 2));
  console.log('Zapisano ogłoszenia!');
}

fetchMessages();
