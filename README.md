# Telegram Sotuv Manager Bot

Bu - NodeJS va Telegraf kutubxonasidan foydalanib yozilgan Telegram bot. Bot orqali IT agentlik yoki freelancer mijozlarga o'z xizmatlarini (bot yasash, veb-sayt yasash, SMM) taklif qila oladi, narxlarni ko'rsatadi, va ulardan buyurtmalarni (ism, raqam, xizmat, izoh) to'play oladi. Barcha ma'lumotlar to'g'ridan-to'g'ri administratorga yuboriladi.

## Xususiyatlari
- **Salomlashish & Menyu:** Kirgan mijoz bilan salomlashadi va asosiy menyuni chiqaradi.
- **Xizmatlar & Narxlar:** Interaktiv xizmatlar ro'yxati va ularning narxi; har bir narx yonida buyurtma berish.
- **Buyurtma jarayoni (Wizard Scene):** Mijozdan bosqichma-bosqich so'rovnomani to'ldirib olish.
- **Admin panel:** `/admin` buyrug'i orqali jami foydalanuvchilar va buyurtmalar statistikasini qarab borish.
- **Bazaga aloqa:** Mijozlar va buyurtmalar miqdori `database.json` faylida doimiy xotirada saqlab boriladi.

## Botni o'rnatish

Bot kodini nusha ko'chirib olganingizdan so'ng, quyidagi amallarni bajaring:

### 1️⃣ NodeJS muhitini o'rnatish
Agar kompyuteringizda NodeJS o'rnatilmagan bo'lsa, [Node.js ofitsial saytidan](https://nodejs.org/) yuklab oling va o'rnating.

### 2️⃣ Kutubxonalarni yuklab olish
Loyihaning asosiy papkasida (shu README.md fayli joylashgan joyda) terminal/komandr satrini oching va quyidagi buyruqni bering:
```bash
npm install
```

### 3️⃣ Atrof-muhit (.env) sozlamalari
Papkada `.env.example` degan fayl bo'ladi. Shu fayldan nusxa oling yoki shunchaki nomini `.env` deb o'zgartiring. 

Ichini quyidagicha o'z bot ma'lumotlaringiz bilan to'ldiring:
```env
BOT_TOKEN=123456789:ABCDefgh_Sizning_TokeningizBuYerga
ADMIN_CHAT_ID=123456789  # Siz o'zingizning Telegram user ID'ingizni yozing
```

> **Eslatma:** User ID'ingizni bilish uchun Telegram'da [@userinfobot](https://t.me/userinfobot) kabi botlardan foydalanishingiz mumkin. BOT_TOKEN ni esa [@BotFather](https://t.me/BotFather) dan olasiz.

### 4️⃣ Botni ishga tushirish
Barcha ma'lumotlar tayyor bo'lsa, botni quyidagi buyruq orqali ishga tushirishingiz mumkin:
```bash
npm start
```
Terminalda `🟢 Bot muvaffaqiyatli ishga tushdi!` xabarini ko'rasiz.

## Railway.app ga deploy qilish (Internetga chiqarish)

Botingizni 24/7 ishlaydigan qilish uchun Railway'dan foydalanishingiz mumkin:

1. **GitHub'ga yuklash:** Loyihani GitHub repozitoriyingizga joylang (`.env` va `node_modules` yuklanmasligiga ishonch hosil qiling, `.gitignore` tayyorlab qo'yilgan).
2. **Railway'ga ulanish:** [Railway.app](https://railway.app/) saytiga kiring va GitHub repozitoriyingizni ulang.
3. **Variables (O'zgaruvchilar):** Railway dashboard'da `Variables` bo'limiga o'ting va quyidagi ma'lumotlarni qo'shing:
   - `BOT_TOKEN`: Sizning bot tokeningiz.
   - `ADMIN_CHAT_ID`: Sizning Telegram ID raqamingiz.
4. **Deploy:** Railway avtomatik ravishda botni ishga tushiradi.

> **Muhim:** Hozirgi versiyada foydalanuvchilar statistikasi `database.json` faylida saqlanadi. Railway'da har safar bot qayta yoqilganda bu fayl tozalanib ketishi mumkin. Doimiy saqlash uchun Railway "Volumes" xizmatidan foydalanish yoki ma'lumotlar bazasini (masalan, MongoDB) ulash tavsiya etiladi.
