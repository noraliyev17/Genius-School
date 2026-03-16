require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const courses = require("./courses");
const saveToGoogleSheets = require("./sheets");
const fs = require("fs");
const path = require("path");
const { validateName } = require("./validation");

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

console.log("✅ Bot ishga tushdi...");

const userState = {};

// =======================
// 🔹 ASOSIY MENU
// =======================
function mainMenu(chatId, username) {
  bot.sendMessage(
    chatId,
    `Salom 👋🏻 ${username ? "@" + username : ""}!\n\nGenius School botiga xush kelibsiz.`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "📚 Kurslar", callback_data: "courses" }],
          [{ text: "📞 Aloqa", callback_data: "contact" }],
          [{ text: "📝 Ro‘yxatdan o‘tish", callback_data: "register" }]
        ]
      }
    }
  );
}

// =======================
// 🔹 /start
// =======================
bot.onText(/\/start/, (msg) => {
  mainMenu(msg.chat.id, msg.from.username);
});

// =======================
// 🔹 CALLBACK HANDLER
// =======================
bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;
  const data = query.data;

  try {

    // 📝 RO‘YXATDAN O‘TISH
    if (data === "register") {
      userState[chatId] = { step: "name" };
      return bot.sendMessage(chatId, "📝 Ism va familiyangizni kiriting:");
    }

    // 📚 KURSLAR
    if (data === "courses") {
      const courseList = courses.map(course =>
        `📌 ${course.name}
⏱ ${course.duration}
💬: <a href="https://t.me/Rushana_Teacher">Aloqa</a>
📞 ${course.nomer}`
      ).join("\n\n");

      return bot.editMessageText(
        `📚 Bizning kurslar:\n\n${courseList}`,
        {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔙 Orqaga", callback_data: "back" }]
            ]
          }
        }
      );
    }

    // 📞 ALOQA
    if (data === "contact") {
      const photoPath = path.join(__dirname, "images", "gen.jpg");

      if (!fs.existsSync(photoPath)) {
        return bot.sendMessage(chatId, "❌ Rasm topilmadi!");
      }

      return bot.sendPhoto(chatId, photoPath, {
        caption: `📄 Telegram: @rushanateacher
📞 Telefon: +998-97-411-22-54
🏢 Manzil: Toshkent, Chinoz shahar`,
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 Orqaga", callback_data: "back" }]
          ]
        }
      });
    }

    // 🔙 ORQAGA
    if (data === "back") {
      return mainMenu(chatId);
    }

  } catch (error) {
    console.log("❌ Callback error:", error.message);
    bot.sendMessage(chatId, "❌ Xatolik yuz berdi.");
  }
});

// =======================
// 🔹 MESSAGE HANDLER
// =======================
bot.on("message", async (msg) => {

  const chatId = msg.chat.id;

  if (!userState[chatId]) return;

  try {

    // 1️⃣ ISM
    if (userState[chatId].step === "name") {

      if (!validateName(msg.text)) {
        return bot.sendMessage(chatId, "❌ Ism noto‘g‘ri. Qayta kiriting:");
      }

      userState[chatId].name = msg.text;
      userState[chatId].step = "phone";

      return bot.sendMessage(chatId, "📱 Telefon raqamingizni yuboring:", {
        reply_markup: {
          keyboard: [
            [
              {
                text: "📱 Raqamni yuborish",
                request_contact: true
              }
            ]
          ],
          resize_keyboard: true,
          one_time_keyboard: true
        }
      });
    }

    // 2️⃣ CONTACT ORQALI TELEFON
    if (userState[chatId].step === "phone" && msg.contact) {

      const phone = msg.contact.phone_number;

      await saveToGoogleSheets(
        userState[chatId].name,
        phone,
        msg.from.username || ""
      );

      delete userState[chatId];

      return bot.sendMessage(chatId, "✅ Ro‘yxatdan muvaffaqiyatli o‘tdingiz!", {
        reply_markup: {
          remove_keyboard: true,
          inline_keyboard: [
            [{ text: "🏠 Asosiy menu", callback_data: "back" }]
          ]
        }
      });
    }

  } catch (error) {
    console.log("❌ Message error:", error.message);
    bot.sendMessage(chatId, "❌ Saqlashda xatolik yuz berdi.");
  }

});