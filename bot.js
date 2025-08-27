const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

const token = '7073645826:AAGYrJ4kSUWMoXfBFsMdnF8fa5bo4azW9eo'; // Bot token
const ownerId = 6340507558;
let adminList = [ownerId];
let state = {};

const bot = new TelegramBot(token);
const app = express();

const url = 'https://your-app.onrender.com'; // ⚠️ Render dagi domeningizni yozing
const port = process.env.PORT || 3000;

// Webhook sozlash
bot.setWebHook(`${url}/bot${token}`);
app.use(express.json());
app.post(`/bot${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const firstName = msg.from.first_name || 'Foydalanuvchi';

  const keyboard = [[{ text: "⏳ Ro'yxatdan o'tish", request_contact: true }]];
  if (userId === ownerId) keyboard.push([{ text: "📋 Admin panel" }]);

  bot.sendMessage(chatId, `👋 *Assalomu alaykum hurmatli ${firstName}!*  

Quyidagi *"⏳ Ro'yxatdan o'tish"* tugmasini bosib, telefon raqamingizni yuboring.`, {
    parse_mode: 'Markdown',
    reply_markup: {
      keyboard,
      resize_keyboard: true,
      one_time_keyboard: true
    }
  });
});

// Kontakt yuborilganda
bot.on('contact', (msg) => {
  const contact = msg.contact;
  const senderId = msg.from.id;
  const chatId = msg.chat.id;
  const senderName = msg.from.first_name || 'Noma’lum';
  const contactName = contact.first_name || 'Noma’lum';
  const phoneNumber = contact.phone_number || 'Noma’lum';

  const text = `📥 *Yangi foydalanuvchi ma'lumoti:*

🧑 Ismi: [${senderName}](tg://user?id=${senderId})
🔢 Telegram ID: \`${senderId}\`
🌐 Profil: [Telegram havola](tg://user?id=${senderId})
📱 Telefon raqami: ${phoneNumber}
👤 Kontakt nomi: ${contactName}`;

  adminList.forEach(adminId => {
    if (adminId !== senderId) {
      if (senderId !== ownerId || adminId === ownerId) {
        bot.sendMessage(adminId, text, { parse_mode: 'Markdown' });
      }
    }
  });

  bot.sendMessage(chatId, `✅ Sizning raqamingiz muvaffaqiyatli qabul qilindi!`);
});

// Boshqa xabarlar (Admin panel)
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;

  if (userId !== ownerId) return;

  if (text === '📋 Admin panel') {
    bot.sendMessage(chatId, "⚙️ Admin panel:", {
      reply_markup: {
        keyboard: [
          [{ text: "✳️ Admin qo‘shish" }],
          [{ text: "🗑 Admin o‘chirish" }],
          [{ text: "📄 Adminlar ro'yxati" }],
          [{ text: "🔙 Ortga" }]
        ],
        resize_keyboard: true,
        one_time_keyboard: true
      }
    });
  }
  else if (text === '✳️ Admin qo‘shish') {
    state[userId] = 'add_admin';
    bot.sendMessage(chatId, "🆔 Yangi adminning Telegram ID sini kiriting:");
  }
  else if (text === '🗑 Admin o‘chirish') {
    state[userId] = 'remove_admin';
    bot.sendMessage(chatId, "❌ O‘chiriladigan adminning Telegram ID sini kiriting:");
  }
  else if (text === '📄 Adminlar ro\'yxati') {
    let listText = `📋 *Hozirgi adminlar ro'yxati:*\n\n`;
    adminList.forEach((id, i) => {
      const marker = id === ownerId ? '👑 Asosiy admin' : `#${i}`;
      listText += `👤 [${id}](tg://user?id=${id}) — ${marker}\n`;
    });
    bot.sendMessage(chatId, listText, { parse_mode: 'Markdown' });
  }
  else if (state[userId] === 'add_admin') {
    const newId = parseInt(text);
    if (!adminList.includes(newId)) {
      adminList.push(newId);
      bot.sendMessage(chatId, `✅ Admin qo‘shildi: \`${newId}\``, { parse_mode: 'Markdown' });
    } else {
      bot.sendMessage(chatId, `⚠️ Bu ID allaqachon admin.`);
    }
    state[userId] = null;
  }
  else if (state[userId] === 'remove_admin') {
    const remId = parseInt(text);
    if (adminList.includes(remId) && remId !== ownerId) {
      adminList = adminList.filter(id => id !== remId);
      bot.sendMessage(chatId, `🗑 Admin o‘chirildi: \`${remId}\``, { parse_mode: 'Markdown' });
    } else {
      bot.sendMessage(chatId, `❌ Bu ID topilmadi yoki bu siz (asosiy admin).`);
    }
    state[userId] = null;
  }
});

// Express server
app.listen(port, () => {
  console.log(`🚀 Server ${port}-portda ishlamoqda...`);
});
