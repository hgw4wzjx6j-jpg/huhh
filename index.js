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
const MIN_ROLE_ID = '1460301154104901687';
const RECRUIT_ROLE_ID = '1460301162535321633';
const WELCOME_CHANNEL_ID = '1460301222446764204';
const WELCOME_LINK = 'https://discord.com/channels/@me/1460301222446764204';

// ===== IN-MEMORY STORAGE =====
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
  if (message.author.bot) return;
  if (!message.guild) return;
  if (!message.member) return;

  const lower = message.content.toLowerCase();

  // ===== PERMISSION CHECK =====
  const minRole = message.guild.roles.cache.get(MIN_ROLE_ID);
  const hasPermission =
    message.member.permissions.has(PermissionsBitField.Flags.Administrator) ||
    (minRole &&
      message.member.roles.cache.some(r => r.position >= minRole.position));

  // ===== !ping =====
  if (lower === '!ping') return message.reply('Pong!');

  // ===== PERMISSION GATE =====
  const restricted = ['+trigger', '+fee', '+confirm', '+setvouches'];
  if (restricted.some(cmd => lower.startsWith(cmd)) && !hasPermission) {
    return message.reply('❌ You do not have permission to use this command.');
  }

  // ===== +trigger =====
  if (lower === '+trigger') {
    const embed = new EmbedBuilder()
      .setTitle('Scam Notifications')
      .setDescription('Click **Join** to get started.')
      .setColor('Red');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('join_scam').setLabel('Join').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('reject_scam').setLabel('Reject').setStyle(ButtonStyle.Danger)
    );

    return message.channel.send({ embeds: [embed], components: [row] });
  }
});

// ===== BUTTON INTERACTIONS =====
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;
  if (!interaction.guild) return;

  // ===== JOIN BUTTON =====
  if (interaction.customId === 'join_scam') {
    const member = await interaction.guild.members.fetch(interaction.user.id);

    const role = interaction.guild.roles.cache.get(RECRUIT_ROLE_ID);
    if (role) await member.roles.add(role);

    await interaction.reply({
      content: `✅ You have been recruited! Ask a staff or middleman to guide you.`,
      ephemeral: true
    });

    const welcomeChannel = await interaction.guild.channels.fetch(WELCOME_CHANNEL_ID);
    if (welcomeChannel && welcomeChannel.isTextBased()) {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`welcome_${interaction.user.id}`)
          .setLabel('Welcome')
          .setStyle(ButtonStyle.Success)
      );

      await welcomeChannel.send({
        content: `<@${interaction.user.id}> has joined us, **WELCOME HIM!**\n👉 ${WELCOME_LINK}`,
        components: [row]
      });
    }
  }

  // ===== WELCOME BUTTON =====
  if (interaction.customId.startsWith('welcome_')) {
    const targetId = interaction.customId.split('_')[1];
    return interaction.reply({
      content: `<@${interaction.user.id}> has welcomed <@${targetId}>!`,
      ephemeral: true
    });
  }

  if (interaction.customId === 'reject_scam')
    return interaction.reply({ content: '❌ Rejected.', ephemeral: true });
});

// ===== LOGIN =====
client.login(process.env.DISCORD_TOKEN);
