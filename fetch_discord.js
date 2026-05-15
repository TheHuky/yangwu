const fs = require('fs');

const TOKEN = process.env.DISCORD_TOKEN;
// WAŻNE: Tutaj wklej ID kanału #ogłoszenia
const CHANNEL_ID = '1503491827884625990'; 

async function fetchMessages() {
  const response = await fetch(`https://discord.com/api/v10/channels/${CHANNEL_ID}/messages?limit=10`, {
    headers: {
      'Authorization': `Bot ${TOKEN}`
    }
  });
  
  if (!response.ok) {
    console.error('Błąd pobierania wiadomości:', response.status);
    return;
  }

  const messages = await response.json();
  
  const formatted = messages
    // FILTR: Zostawia tylko wiadomości, które mają jakąś treść tekstową
    .filter(msg => msg.content && msg.content.trim() !== '')
    .map(msg => {
      const date = new Date(msg.timestamp);
      const dateString = date.toLocaleDateString('pl-PL') + ', ' + date.toLocaleTimeString('pl-PL', {hour: '2-digit', minute:'2-digit'});
      
      return {
        id: msg.id,
        author: msg.author.username,
        content: msg.content,
        date: dateString
      };
    });

  // Pobieramy tylko 5 ostatnich (po przefiltrowaniu pustych)
  const finalMessages = formatted.slice(0, 5);

  fs.writeFileSync('announcements.json', JSON.stringify(finalMessages, null, 2));
  console.log('Zapisano ogłoszenia (bez pustych wpisów)!');
}
