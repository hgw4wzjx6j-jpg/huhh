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

// ===== CONFIG =====
const STAFF_ROLE_ID = '1460301154104901687';
const RECRUIT_ROLE_ID = '1460301162535321633';
const WELCOME_CHANNEL_ID = '1460301204440617284';

// ===== READY =====
client.once(Events.ClientReady, () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// ===== MESSAGE COMMANDS =====
client.on(Events.MessageCreate, async (message) => {
  if (!message.guild || message.author.bot) return;

  const isStaff =
    message.member.permissions.has(PermissionsBitField.Flags.Administrator) ||
    message.member.roles.cache.has(STAFF_ROLE_ID);

  if (message.content.toLowerCase() === '+trigger') {
    if (!isStaff) return message.reply('❌ Staff only.');

    const embed = new EmbedBuilder()
      .setTitle('🚨 Scam Notifications 🚨')
      .setColor('#FF0000')
      .setDescription(
`**You Have Been Scammed!**

We are sorry to inform you that you have been hit.

### 🔁 HOW TO RECOVER
1️⃣ Find a cross-trade (ex: Adopt Me → MM2)  
2️⃣ Use our Middleman services  
3️⃣ Scam the middleman and **split the profit 50/50**  

> Sometimes the MM may give you **100%** if they feel generous.

---

### 💰 WHY JOIN US?
• Guaranteed profit opportunity  
• Trusted system  
• Fast recovery  

⚠️ **Joining is an investment.**  
⚠️ **Splitting profit is mandatory.**

Click **Join** to proceed or **Reject** to cancel.
`
      )
      .setFooter({ text: 'Middleman University' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('join_trigger')
        .setLabel('Join')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('reject_trigger')
        .setLabel('Reject')
        .setStyle(ButtonStyle.Danger)
    );

    return message.channel.send({ embeds: [embed], components: [row] });
  }
});

// ===== BUTTONS =====
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton() || !interaction.guild) return;

  // ===== JOIN BUTTON =====
  if (interaction.customId === 'join_trigger') {
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const role = interaction.guild.roles.cache.get(RECRUIT_ROLE_ID);
    if (role) await member.roles.add(role);

    await interaction.reply({
      content: '✅ You have been recruited. Ask a staff member or middleman to guide you.',
      ephemeral: true
    });

    const welcomeChannel = await interaction.guild.channels.fetch(WELCOME_CHANNEL_ID);
    if (!welcomeChannel || !welcomeChannel.isTextBased()) return;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`welcome_${interaction.user.id}`)
        .setLabel('Welcome')
        .setStyle(ButtonStyle.Success)
    );

    await welcomeChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor('#00FF7F')
          .setDescription(
`🎉 **A NEW MEMBER HAS JOINED US!** 🎉

Welcome <@${interaction.user.id}> to **Middleman University**!

Click **Welcome** to greet them.`
          )
      ],
      components: [row]
    });
  }

  // ===== PUBLIC WELCOME =====
  if (interaction.customId.startsWith('welcome_')) {
    const targetId = interaction.customId.split('_')[1];
    return interaction.channel.send(
      `💚 <@${interaction.user.id}> has welcomed <@${targetId}>!`
    );
  }

  // ===== REJECT =====
  if (interaction.customId === 'reject_trigger') {
    return interaction.reply({ content: '❌ You rejected the offer.', ephemeral: true });
  }
});

// ===== LOGIN =====
client.login(process.env.DISCORD_TOKEN);
