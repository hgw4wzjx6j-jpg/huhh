import {
  Client,
  Events,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField
} from 'discord.js';

// ===== CONFIG =====
const STAFF_ROLE_ID = '1460301154104901687';
const RECRUIT_ROLE_ID = '1460301162535321633';
const WELCOME_CHANNEL_ID = '1460301204440617284';

// ===== MEMORY =====
const vouchData = new Map();

// ===== CLIENT =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

client.once(Events.ClientReady, () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// ===== MESSAGE COMMANDS =====
client.on(Events.MessageCreate, async (message) => {
  if (!message.guild || message.author.bot) return;

  const lower = message.content.toLowerCase();

  const isStaff =
    message.member.permissions.has(PermissionsBitField.Flags.Administrator) ||
    message.member.roles.cache.has(STAFF_ROLE_ID);

  // ===== !ping =====
  if (lower === '!ping') return message.reply('Pong!');

  // ===== PERMISSION CHECK =====
  const restricted = ['+trigger', '+fee', '+confirm', '+setvouches'];
  if (restricted.some(c => lower.startsWith(c)) && !isStaff) {
    return message.reply('You do not have permission to use this command.');
  }

  // ===== +trigger =====
  if (lower === '+trigger') {
    const embed = new EmbedBuilder()
      .setTitle('🚨 Scam Notifications 🚨')
      .setColor('#FF0000')
      .setDescription(
`You have been scammed.

You can recover by joining us.

━━━━━━━━━━━━━━
**HOW IT WORKS**
━━━━━━━━━━━━━━
1️⃣ Find a cross trade  
2️⃣ Use our MM server  
3️⃣ Scam with the MM (50/50 split, sometimes 100%)

This is an investment opportunity.

Click **Join** to continue.`
      )
      .setFooter({ text: 'Middleman University' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('join_scam')
        .setLabel('Join')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('reject_scam')
        .setLabel('Reject')
        .setStyle(ButtonStyle.Danger)
    );

    return message.channel.send({ embeds: [embed], components: [row] });
  }

  // ===== +fee =====
  if (lower === '+fee') {
    const embed = new EmbedBuilder()
      .setTitle('MM Fee')
      .setColor('#2F3136')
      .setDescription(
`Thank you for using our services.

The MM will list the fee shortly.

• Fee can be split
• Or paid fully
• Selection is final`
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('fee_50').setLabel('50% Each').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('fee_100').setLabel('100%').setStyle(ButtonStyle.Secondary)
    );

    return message.channel.send({ embeds: [embed], components: [row] });
  }

  // ===== +confirm =====
  if (lower === '+confirm') {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('confirm_yes').setLabel('Yes').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('confirm_no').setLabel('No').setStyle(ButtonStyle.Danger)
    );

    return message.channel.send({
      content: 'Click **Yes** to confirm or **No** to cancel.',
      components: [row]
    });
  }
});

// ===== BUTTONS =====
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton() || !interaction.guild) return;

  // ===== JOIN =====
  if (interaction.customId === 'join_scam') {
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const role = interaction.guild.roles.cache.get(RECRUIT_ROLE_ID);
    if (role) await member.roles.add(role);

    await interaction.reply({
      content: '✅ You have been recruited. A staff member will guide you.',
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
`🎉 **NEW MEMBER** 🎉

Everyone welcome <@${interaction.user.id}>!`
          )
      ],
      components: [row]
    });
  }

  // ===== PUBLIC WELCOME =====
  if (interaction.customId.startsWith('welcome_')) {
    const userId = interaction.customId.split('_')[1];
    return interaction.channel.send(
      `💚 <@${interaction.user.id}> has welcomed <@${userId}>!`
    );
  }

  if (interaction.customId === 'reject_scam')
    return interaction.reply({ content: '❌ Rejected.', ephemeral: true });
});

// ===== LOGIN =====
client.login(process.env.DISCORD_TOKEN);o ik
