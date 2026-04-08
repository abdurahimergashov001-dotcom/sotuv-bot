require('dotenv').config();
const { Telegraf, session, Scenes, Markup } = require('telegraf');
const fs = require('fs');
const path = require('path');

// Atrof-muhit o'zgaruvchilari
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

if (!BOT_TOKEN) {
    console.error("BOT_TOKEN ko'rsatilmagan! .env faylida bot tokenini kiriting. Bot ishga tushmaydi.");
    process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// Ma'lumotlarni saqlash uchun fayl (database.json)
const DATA_FILE = path.join(__dirname, 'database.json');

// Agar database fayl bo'lmasa, uni yaratamiz
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ users: [], ordersCount: 0 }));
}

// Holatni o'qib olish (Fayldan)
function getDb() {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
}

// Holatni saqlash (Faylga)
function saveDb(db) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

// Foydalanuvchini ro'yxatga qo'shish
function addUser(userId) {
    const db = getDb();
    if (!db.users.includes(userId)) {
        db.users.push(userId);
        saveDb(db);
    }
}

// Buyurtmalarni sanash
function incrementOrderCount() {
    const db = getDb();
    db.ordersCount += 1;
    saveDb(db);
}

// ==========================================
// SCENES (Buyurtma berish jarayoni - Wizard)
// ==========================================

const orderScene = new Scenes.WizardScene(
    'ORDER_SCENE',
    // 1-qadam: Ismni so'rash
    (ctx) => {
        ctx.reply("Iltimos, ismingizni kiriting:", Markup.removeKeyboard());
        ctx.wizard.state.order = {};
        return ctx.wizard.next();
    },
    // 2-qadam: Telefon raqamni so'rash
    (ctx) => {
        if (!ctx.message || !ctx.message.text) {
            ctx.reply("Iltimos, ismingizni so'zlar bilan (matn) kiriting.");
            return;
        }
        ctx.wizard.state.order.name = ctx.message.text;
        ctx.reply("Rahmat! Endi telefon raqamingizni kiriting (masalan: +998901234567):");
        return ctx.wizard.next();
    },
    // 3-qadam: Qaysi xizmat kerakligini so'rash
    (ctx) => {
        if (!ctx.message || !ctx.message.text) {
            ctx.reply("Iltimos, raqamingizni matn ko'rinishida kiriting.");
            return;
        }
        ctx.wizard.state.order.phone = ctx.message.text;
        
        ctx.reply("Sizga qaysi xizmatimiz kerak?", Markup.keyboard([
            ['Telegram bot yasash', 'Veb-sayt yasash'],
            ['SMM xizmati', 'Boshqasi']
        ]).oneTime().resize());
        
        return ctx.wizard.next();
    },
    // 4-qadam: Qo'shimcha izohni so'rash
    (ctx) => {
        if (!ctx.message || !ctx.message.text) {
            ctx.reply("Iltimos, xizmat turini tanlang yoki nomini yozing.");
            return;
        }
        ctx.wizard.state.order.service = ctx.message.text;
        
        ctx.reply("Oxirgi savol: Qo'shimcha izoh yoki talablaringiz bormi? (Yo'q bo'lsa 'Yoq' deb yozing)", Markup.removeKeyboard());
        return ctx.wizard.next();
    },
    // 5-qadam: Yakunlash va adminga xabar yuborish
    async (ctx) => {
        if (!ctx.message || !ctx.message.text) {
            ctx.reply("Iltimos, matn ko'rinishida kiriting.");
            return;
        }
        ctx.wizard.state.order.notes = ctx.message.text;
        
        const { name, phone, service, notes } = ctx.wizard.state.order;
        
        // Mijozga javob
        await ctx.reply("✅ Buyurtmangiz qabul qilindi! Tez orada aloqaga chiqamiz.", getMainMenu());
        
        // Adminga xabar
        if (ADMIN_CHAT_ID) {
            const adminMsg = `🟢 <b>YANGI BUYURTMA</b> 🟢\n\n` +
                             `👤 <b>Ism:</b> ${name}\n` +
                             `📞 <b>Telefon:</b> ${phone}\n` +
                             `💼 <b>Xizmat:</b> ${service}\n` +
                             `📝 <b>Izoh:</b> ${notes}\n` +
                             `⏱ <b>Vaqt:</b> ${new Date().toLocaleString('uz-UZ')}\n` +
                             `🔗 <b>Username:</b> @${ctx.from.username || "Mavjud emas"}`;
                             
            try {
                await bot.telegram.sendMessage(ADMIN_CHAT_ID, adminMsg, { parse_mode: 'HTML' });
            } catch (err) {
                console.error("Adminga xabar yuborishda xatolik:", err.message);
            }
        }
        
        // Buyurtmalar sonini yangilash
        incrementOrderCount();
        
        return ctx.scene.leave();
    }
);

// Jami scenelarni ro'yxatga olish
const stage = new Scenes.Stage([orderScene]);
bot.use(session());
bot.use(stage.middleware());

// ==========================================
// ASOSIY MENYU TUGMALARI
// ==========================================

function getMainMenu() {
    return Markup.keyboard([
        ['📋 Xizmatlarimiz', '💸 Narxlar'],
        ['🛒 Buyurtma berish', '📞 Bog\'lanish'],
        ['❓ Savollar']
    ]).resize();
}

// ==========================================
// BOT XABARLARI VA BUYRUQLARI
// ==========================================

// SALOMLASHISH (/start buyrug'i)
bot.start((ctx) => {
    // Foydalanuvchini bazaga qo'shamiz
    addUser(ctx.from.id);
    
    const msg = `Assalomu alaykum, <b>${ctx.from.first_name || "Mijoz"}</b>! 👋\n` +
                `Bizning IT xizmatlar botimizga xush kelibsiz.\n\n` +
                `Quyidagi menyu orqali kerakli bo'limni tanlang:`;
                
    ctx.reply(msg, { parse_mode: 'HTML', ...getMainMenu() });
});

// ADMIN UCHUN STATISTIKA (/admin buyrug'i)
bot.command('admin', (ctx) => {
    if (!ADMIN_CHAT_ID) {
        return ctx.reply("Admin ID konfigratsiya qilinmagan.");
    }
    
    // Admin chatini tekshiramiz
    if (String(ctx.from.id) === String(ADMIN_CHAT_ID)) {
        const db = getDb();
        const statMsg = `📊 <b>BOT STATISTIKASI</b>\n\n` +
                        `👥 Jami foydalanuvchilar (Start bosganlar): <b>${db.users.length}</b> ta\n` +
                        `🛒 Jami buyurtmalar: <b>${db.ordersCount}</b> ta\n`;
        ctx.reply(statMsg, { parse_mode: 'HTML' });
    } else {
        ctx.reply("Keçirasiz, sizda admin huquqlari yo'q.");
    }
});

// MENYU: XIZMATLARIMIZ
bot.hears('📋 Xizmatlarimiz', (ctx) => {
    const msg = `💻 <b>Bizning xizmatlarimiz:</b>\n\n` +
                `🤖 <b>Telegram bot yasash</b>\n` +
                `— <i>"Sizning biznesingiz uchun bot yasab beramiz"</i>\n\n` +
                `🌐 <b>Veb-sayt yasash</b>\n` +
                `— <i>"Zamonaviy veb-sayt yasab beramiz"</i>\n\n` +
                `📱 <b>SMM xizmati</b>\n` +
                `— <i>"Ijtimoiy tarmoqlarni boshqaramiz"</i>\n\n` +
                `Buyurtma berish uchun "💸 Narxlar" yoki "🛒 Buyurtma berish" bo'limiga o'ting.`;
                
    ctx.reply(msg, { parse_mode: 'HTML' });
});

// MENYU: NARXLAR
bot.hears('💸 Narxlar', (ctx) => {
    const msg = `💰 <b>Xizmatlarimiz narxi:</b>\n\n` +
                `🤖 <b>Telegram bot:</b> 200 dollardan\n` +
                `🌐 <b>Veb-sayt:</b> 300 dollardan\n` +
                `📱 <b>SMM xizmati:</b> oyiga 150 dollar\n\n` +
                `<i>Yuqoridagi narxlar boshlang'ich bo'lib, loyiha murakkabligiga qarab o'zgarishi mumkin.</i>\n`;
                
    const inlineKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('Bot buyurtma berish', 'order_bot')],
        [Markup.button.callback('Veb-sayt buyurtma berish', 'order_web')],
        [Markup.button.callback('SMM buyurtma berish', 'order_smm')]
    ]);
    
    ctx.reply(msg, { parse_mode: 'HTML', ...inlineKeyboard });
});

// Narxlar ichidagi inline buttonlar uchun actionlar (sahna ulanadi)
bot.action(['order_bot', 'order_web', 'order_smm'], (ctx) => {
    ctx.answerCbQuery();
    ctx.scene.enter('ORDER_SCENE');
});

// MENYU: BOG'LANISH
bot.hears('📞 Bog\'lanish', (ctx) => {
    const msg = `📞 <b>Biz bilan bog'lanish:</b>\n\n` +
                `✈️ <b>Telegram:</b> @abdurahimergashovv\n` +
                `☎️ <b>Telefon:</b> +998997063940\n` +
                `🕒 <b>Ish vaqti:</b> 09:00 — 18:00\n`;
                
    ctx.reply(msg, { parse_mode: 'HTML' });
});

// MENYU: SAVOLLAR
bot.hears('❓ Savollar', (ctx) => {
    const msg = `❓ <b>Ko'p beriladigan savollar:</b>\n\n` +
                `<b>Qancha vaqtda tayyor bo'ladi?</b>\n` +
                `— 3 kundan 14 kungacha\n\n` +
                `<b>To'lov qanday?</b>\n` +
                `— Yarmi oldindan, yarmi keyin\n\n` +
                `<b>Kafolat bormi?</b>\n` +
                `— Ha, 30 kun bepul tuzatamiz\n`;
                
    ctx.reply(msg, { parse_mode: 'HTML' });
});

// BUYURTMA BERISH tugmasi
bot.hears('🛒 Buyurtma berish', (ctx) => {
    ctx.scene.enter('ORDER_SCENE');
});

// Noto'g'ri xabar kelsa yoki boshqa matnlarga reaksiya
bot.on('text', (ctx) => {
    // Agar odam sahnaning ichida bo'lmasa javob berish
    if(!ctx.session || !ctx.session.__scenes || !ctx.session.__scenes.current) {
        ctx.reply("Iltimos, menyudan kerakli tugmani tanlang 👇", getMainMenu());
    }
});

// Botni xatoliklarini tutib olish
bot.catch((err, ctx) => {
    console.error(`Botda xatolik yuzaga keldi:`, err);
});

// Botni ishga tushirish
console.log("Bot ishga tushirilmoqda. Iltimos kuting...");
bot.launch().then(() => {
    console.log("🟢 Bot muvaffaqiyatli ishga tushdi!");
}).catch((err) => {
    console.error("🔴 Botni ishga tushirishda xatolik:", err);
});

// Dastur to'xtatilganda jarayonlarni silliq o'chirish (Graceful stop)
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
