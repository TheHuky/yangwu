const fs = require('fs');

const TOKEN = process.env.DISCORD_TOKEN;
// WAŻNE: Tutaj wklej ID kanału #ogłoszenia
const CHANNEL_ID = '1503491827884625990'; 

async function fetchMessages() {
  const response = await fetch(`https://discord.com/api/v10/channels/${CHANNEL_ID}/messages?limit=20`, {
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
    .filter(msg => {
      // 1. Sprawdź czy content w ogóle istnieje
      if (!msg.content) return false;
      
      // 2. Usuń białe znaki i sprawdź czy coś zostało
      const trimmedContent = msg.content.trim();
      if (trimmedContent.length === 0) return false;

      // 3. Opcjonalne: Ignoruj wiadomości bota (jeśli inne boty tam piszą)
      if (msg.author.bot) return false;

      return true;
    })
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

  // Pobieramy 5 najnowszych z tych, które mają tekst
  const finalMessages = formatted.slice(0, 5);

  fs.writeFileSync('announcements.json', JSON.stringify(finalMessages, null, 2));
  console.log(`Zapisano ${finalMessages.length} ogłoszeń.`);
}
