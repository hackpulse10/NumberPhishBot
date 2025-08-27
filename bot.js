const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

// Bot tokenini shu yerga yozing
const token = "7073645826:AAFlFBzQXmPraHKIQK2xKYD_OTjBl0Xi3l8";

// Admin ID
const ADMIN_ID = 6340507558;

const bot = new TelegramBot(token, { polling: true });

const infoPath = path.join(__dirname, "info.json");

// Fayl mavjud bo'lmasa bo'sh massiv ochib qo'yamiz
if (!fs.existsSync(infoPath)) {
    fs.writeFileSync(infoPath, JSON.stringify([], null, 2));
}

// Bosqichlarni saqlash
let steps = {};

// /start komandasi
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    let users = JSON.parse(fs.readFileSync(infoPath));

    // Foydalanuvchi oldin ro'yxatdan o'tganmi?
    if (users.find(u => u.id === chatId)) {
        return bot.sendMessage(chatId, "✅ Siz allaqachon ro‘yxatdan o'tgansiz!");
    }

    steps[chatId] = { step: 1, data: {} };
    bot.sendMessage(chatId, "Ismingizni kiriting (faqat harflar):");
});

// Oddiy xabarlarni ushlash
bot.on("message", (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!steps[chatId]) return;

    let userStep = steps[chatId];

    // Ism
    if (userStep.step === 1) {
        if (!/^[A-Za-z\u0400-\u04FF\s]+$/.test(text)) {
            return bot.sendMessage(chatId, "❌ Ism faqat harflardan iborat bo‘lishi kerak. Qaytadan kiriting:");
        }
        userStep.data.ism = text;
        userStep.step = 2;
        bot.sendMessage(chatId, "Familiyangizni kiriting (faqat harflar):");
    }
    // Familiya
    else if (userStep.step === 2) {
        if (!/^[A-Za-z\u0400-\u04FF\s]+$/.test(text)) {
            return bot.sendMessage(chatId, "❌ Familiya faqat harflardan iborat bo‘lishi kerak. Qaytadan kiriting:");
        }
        userStep.data.familiya = text;
        userStep.step = 3;

        bot.sendMessage(chatId, "📱 Telefon raqamingizni jo‘nating:", {
            reply_markup: {
                keyboard: [
                    [{ text: "📲 Raqamni yuborish", request_contact: true }]
                ],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        });
    }
});

// Kontaktni olish
bot.on("contact", (msg) => {
    const chatId = msg.chat.id;
    if (!steps[chatId] || steps[chatId].step !== 3) return;

    let userStep = steps[chatId];
    let contact = msg.contact;

    userStep.data.telefon = contact.phone_number;
    userStep.data.id = chatId;
    userStep.data.username = msg.from.username || "mavjud emas";
    userStep.data.first_name = msg.from.first_name || "mavjud emas";
    userStep.data.last_name = msg.from.last_name || "mavjud emas";

    // Faylga yozish
    let users = JSON.parse(fs.readFileSync(infoPath));
    users.push(userStep.data);
    fs.writeFileSync(infoPath, JSON.stringify(users, null, 2));

    bot.sendMessage(chatId, `🎉 Xush kelibsiz, ${userStep.data.ism}!`);

    // Bosqichni tozalash
    delete steps[chatId];
});

// Admin panel
bot.onText(/\/admin/, (msg) => {
    const chatId = msg.chat.id;
    if (chatId !== ADMIN_ID) return;

    bot.sendMessage(chatId, "Admin panel:", {
        reply_markup: {
            keyboard: [
                ["📋 Users"],
            ],
            resize_keyboard: true
        }
    });
});

// Admin users tugmasi
bot.on("message", (msg) => {
    const chatId = msg.chat.id;
    if (chatId !== ADMIN_ID) return;

    if (msg.text === "📋 Users") {
        bot.sendDocument(chatId, infoPath);
    }
});
