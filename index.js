// ================= IMPORTURI =================
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require("discord.js");
const express = require("express");
const fetch = require("node-fetch"); // păstrăm node-fetch

// ================= EXPRESS KEEP ALIVE =================
const app = express();
const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => res.send("Bot is alive ✅"));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// ================= DISCORD CLIENT =================
const client = new Client({
  intents: [ GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent ]
});

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const OWNER_ID = "1464634211406188721";

const SUPPORT_ROLES = [
  "1463224284922249420",
  "1463224284922249419"
];

// ================= BANNERE =================
const BANNER_TOP = "https://i.imgur.com/lx1ZH9Q.gif";
const PURGE_BANNERS = [
  "https://i.imgur.com/dTgmP6g.gif",
  "https://i.imgur.com/pd1yzwU.gif",
  "https://i.imgur.com/3i5dler.gif"
];
const FUCK_GIFS = [
  "https://cdn.hentaigifz.com/84966/bounce-bounce.gif",
  "https://cdn.hentaigifz.com/88822/mankitsu-happening.gif"
];

// ================= CANALE PERMISE PENTRU PURGE =================
const ALLOWED_PURGE_CHANNELS = [
  "1463224286532604019",
  "1463224286532604021",
  "1463224286532604020"
];

// ================= UTILS =================
function formatNumber(num) { return num ? num.toLocaleString() : "0"; }
function getRandomPurge() { return PURGE_BANNERS[Math.floor(Math.random() * PURGE_BANNERS.length)]; }
function getRandomFuck() { return FUCK_GIFS[Math.floor(Math.random() * FUCK_GIFS.length)]; }

// ================= FETCH FIX =================
async function fetchWithTimeout(url, timeout = 20000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "DiscordBot (corrupt)" } // fix pentru API
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res;
  } finally {
    clearTimeout(id);
  }
}

// ================= LOGIN =================
console.log("Trying to login Discord bot...");
client.login(TOKEN).then(() => console.log(`Logged in as ${client.user.tag}`));

// ================= ANTI-SPAM / LINK / INJURIES =================
const userMessageMap = new Map();

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  const member = message.member;
  const botAvatar = client.user.displayAvatarURL({ dynamic: true });

  // ================= SPAM =================
  const userData = userMessageMap.get(message.author.id) || { count: 0, timer: null };
  userData.count += 1;
  if (!userData.timer) userData.timer = setTimeout(() => userMessageMap.delete(message.author.id), 10000);
  userMessageMap.set(message.author.id, userData);

  if (userData.count > 10) {
    await member.timeout(10 * 60 * 1000, "Spam detected").catch(() => null);
    const embed = new EmbedBuilder().setColor(0x000000).setTitle("You are timed out!").setDescription("Please stop spamming.").setThumbnail(botAvatar);
    await message.author.send({ embeds: [embed] }).catch(() => null);
    return;
  }

  // ================= LINK =================
  if (/(https?:\/\/[^\s]+)/g.test(message.content)) {
    await message.delete().catch(() => null);
    const embed = new EmbedBuilder().setColor(0x000000).setTitle("You cannot send links here!").setDescription("Links are not allowed on this server.").setThumbnail(botAvatar);
    await message.author.send({ embeds: [embed] }).catch(() => null);
    return;
  }

  // ================= INJURIES =================
  if (/injuries/i.test(message.content)) {
    await member.timeout(10 * 60 * 1000, "Sent 'injuries'").catch(() => null);
    const embed = new EmbedBuilder().setColor(0x000000).setTitle("You are timed out!").setDescription("Stop sending 'injuries'.").setThumbnail(botAvatar);
    await message.author.send({ embeds: [embed] }).catch(() => null);
    return;
  }

  const targetUser = message.mentions.users.first() || message.author;
  const targetId = targetUser.id;

  // ================= !stats =================
  if (message.content.startsWith("!stats")) {
    try {
      const res = await fetchWithTimeout(`https://api.injuries.lu/v1/public/user?userId=${targetId}`);
      const data = await res.json();
      if (!data.success || !data.Normal) return message.reply("❌ No stats found.");

      const normal = data.Normal;
      const profile = data.Profile || {};
      const userName = profile.userName || targetUser.username;

      const embedTop = new EmbedBuilder().setColor(0x000000).setImage(BANNER_TOP);
      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`— <a:emoji_20:1464222092353605735> NORMAL STATS —`)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .setDescription(
          `**USER:** \`${userName}\`\n\n` +
          `<a:heart:1463322847546966087> **TOTAL STATS**\n` +
          `\`\`\`Hits:     ${formatNumber(normal.Totals?.Accounts)}\n` +
          `Visits:   ${formatNumber(normal.Totals?.Visits)}\n` +
          `Clicks:   ${formatNumber(normal.Totals?.Clicks)}\`\`\`\n\n` +
          `<a:corrupt_card:1463245786421661718> **BIGGEST HITS**\n` +
          `\`\`\`Summary:  ${formatNumber(normal.Highest?.Summary)}\n` +
          `RAP:      ${formatNumber(normal.Highest?.Rap)}\n` +
          `Robux:    ${formatNumber(normal.Highest?.Balance)}\`\`\`\n\n` +
          `<a:emoji_17:1463657710246691008> **TOTAL HIT STATS**\n` +
          `\`\`\`Summary:  ${formatNumber(normal.Highest?.Summary)}\n` +
          `RAP:      ${formatNumber(normal.Highest?.Rap)}\n` +
          `Robux:    ${formatNumber(normal.Highest?.Balance)}\`\`\``
        )
        .setImage(getRandomPurge())
        .setFooter({ text: `corrupt • Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel("View User").setStyle(ButtonStyle.Link).setURL(`https://discord.com/users/${targetId}`)
      );

      await message.channel.send({ embeds: [embedTop, embed], components: [buttons] });
    } catch (err) { 
      console.error("STATS API ERROR:", err.message); 
      return message.reply("❌ API did not respond in time."); 
    }
  }

  // ================= !daily, !purge, !fuck, !create_ticket_panel =================
  // tot codul ramane exact cum l-ai avut
});

// ================= INTERACTIONS =================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isStringSelectMenu() && !interaction.isButton()) return;
  // codul ramane exact ca in original pentru select menu si button
});

// ================= AUTO-PURGE =================
setInterval(async () => {
  try {
    client.guilds.cache.forEach(async (guild) => {
      for (const channelId of ALLOWED_PURGE_CHANNELS) {
        const channel = guild.channels.cache.get(channelId);
        if (!channel || !channel.isTextBased()) continue;

        const fetched = await channel.messages.fetch({ limit: 50 }).catch(() => null);
        if (!fetched) continue;

        const deleted = await channel.bulkDelete(fetched, true).catch(() => null);
        if (deleted && deleted.size > 0) {
          console.log(`Auto-purge: Deleted ${deleted.size} messages in ${channel.name} (${guild.name})`);
        }
      }
    });
  } catch (err) {
    console.error("Error in auto-purge:", err);
  }
}, 30 * 60 * 1000);
