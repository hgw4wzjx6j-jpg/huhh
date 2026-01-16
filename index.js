import {
  Client,
  GatewayIntentBits,
  Events,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField
} from 'discord.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

/* ===== CONFIG (FINAL) ===== */
const STAFF_ROLE_ID = '1460301154104901687';
const RECRUIT_ROLE_ID = '1460301162535321633';
const WELCOME_CHANNEL_ID = '1460301204440617284';

/* ===== READY ===== */
client.once(Events.ClientReady, () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

/* ===== MESSAGE COMMANDS ===== */
client.on(Events.MessageCreate, async (message) => {
  if (!message.guild || message.author.bot) return;

  const isStaff =
    message.member.permissions.has(PermissionsBitField.Flags.Administrator) ||
    message.member.roles.cache.has(STAFF_ROLE_ID);

  /* ===== +trigger ===== */
  if (message.content === '+trigger') {
    if (!isStaff) return;

    const embed = new EmbedBuilder()
      .setTitle('🚨 SCAM NOTIFICATIONS 🚨')
      .setColor('#FF0000')
      .setThumbnail(message.guild.iconURL({ dynamic: true }))
      .setDescription(
`**You Have Been Scammed.**

We regret to inform you that you have just been hit.

━━━━━━━━━━━━━━━━━━
### 💰 HOW TO RECOVER
━━━━━━━━━━━━━━━━━━
1️⃣ Find a cross-trade (e.g. Adopt Me → MM2)  
2️⃣ Use **Middleman University**  
3️⃣ Scam with the middleman and split **50 / 50**

> Sometimes the MM may give **100%** if they feel generous.

━━━━━━━━━━━━━━━━━━
### ❗ IMPORTANT
━━━━━━━━━━━━━━━━━━
• This is an **investment**
• Splitting profit is **mandatory**
• Failure to comply = blacklist

Click **Join** to proceed.
`
      )
      .setFooter({ text: 'Middleman University • Official System' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('join')
        .setLabel('Join')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('reject')
        .setLabel('Reject')
        .setStyle(ButtonStyle.Danger)
    );

    return message.channel.send({ embeds: [embed], components: [row] });
  }
});

/* ===== BUTTONS ===== */
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton() || !interaction.guild) return;

  /* ===== JOIN ===== */
  if (interaction.customId === 'join') {
    const member = await interaction.guild.members.fetch(interaction.user.id);

    const role = interaction.guild.roles.cache.get(RECRUIT_ROLE_ID);
    if (role) await member.roles.add(role);

    await interaction.reply({
      content: '✅ You have been recruited. Ask a staff or middleman to guide you.',
      ephemeral: true
    });

    const channel = await interaction.guild.channels.fetch(WELCOME_CHANNEL_ID);
    if (!channel || !channel.isTextBased()) return;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`welcome_${interaction.user.id}`)
        .setLabel('Welcome')
        .setStyle(ButtonStyle.Success)
    );

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor('#00FF7F')
          .setDescription(
`🎉 **NEW RECRUIT JOINED** 🎉

Everyone welcome <@${interaction.user.id}> to **Middleman University**!
`
          )
      ],
      components: [row]
    });
  }

  /* ===== PUBLIC WELCOME ===== */
  if (interaction.customId.startsWith('welcome_')) {
    const target = interaction.customId.split('_')[1];
    return interaction.channel.send(
      `💚 <@${interaction.user.id}> has welcomed <@${target}>!`
    );
  }

  /* ===== REJECT ===== */
  if (interaction.customId === 'reject') {
    return interaction.reply({ content: '❌ You rejected the offer.', ephemeral: true });
  }
});

/* ===== LOGIN ===== */
client.login(process.env.DISCORD_TOKEN);
