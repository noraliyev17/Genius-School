const { google } = require("googleapis");
const keys = require("./credentials.json");
const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: privateKey
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets"]
});

const spreadsheetId = "1hzi0uwSzfO-3wUv7mgoCMLhPQazGo6Xt6WNPSrQW2FE";

async function saveToGoogleSheets(name, phone, username) {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "A:D", // faqat ustunlar
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [
          [new Date().toLocaleString(), name, phone,"@"+ username || "No username"]
        ]
      }
    });

    console.log("Ma'lumot muvaffaqiyatli yozildi ✅");
  } catch (err) {
    console.error("Xatolik yuz berdi:", err.message);
  }
}

module.exports = saveToGoogleSheets;
