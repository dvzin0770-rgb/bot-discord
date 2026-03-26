const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Bot is alive'));
app.listen(PORT, () => console.log(`✅ Web server rodando na porta ${PORT}`));

const {
  Client, GatewayIntentBits, SlashCommandBuilder, PermissionFlagsBits,
  REST, Routes, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ChannelType, PermissionsBitField, EmbedBuilder, ModalBuilder,
  TextInputBuilder, TextInputStyle
} = require('discord.js');

const token    = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;

if (!token || !clientId) { console.error('❌ Missing env vars'); process.exit(1); }

const PREFIX = '!';

// ── Warn storage ─────────────────────────────────────────────────────────────
const warnData = new Map();
function getWarns(guildId, userId) { ... }
function addWarn(guildId, userId)  { ... }

const RARE_FRUITS = ['dragon', 'leopard', 'dough'];

// ── Client (GuildMembers toggled off until you enable it in Dev Portal) ───────
const GUILD_MEMBERS_ENABLED = false;
const client = new Client({ intents: [Guilds, GuildMessages, MessageContent, ...(GUILD_MEMBERS_ENABLED ? [GuildMembers] : [])] });

// ── Slash commands: ban, kick, timeout, clear, ticket, recrutamento ───────────
// ── Stock system: fetchStockData, buildStockEmbed, sendOrUpdateStock ──────────
//    └ Rare fruit alert (Dragon / Leopard / Dough → @everyone ping)
// ── Log system: getOrCreateLogChannel, sendLog, buildLog ─────────────────────
// ── Ticket panel builder, Recruitment panel builder ───────────────────────────

// ── Events ────────────────────────────────────────────────────────────────────
// messageCreate  → !ping, !ticket, !recrutamento, !stock, !warn
// interactionCreate → slash commands + buttons (ticket/recruit) + modal submit
// guildMemberAdd / guildMemberRemove → logs (active when GUILD_MEMBERS_ENABLED = true)

client.login(token);
