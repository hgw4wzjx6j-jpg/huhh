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
const WELCOME_CHANNEL_ID = '1460301207267709019';

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
  if (!message.guild || !message.member) return;

  const lower = message.content.toLowerCase();

  // ===== STAFF CHECK =====
  const isStaff =
    message.member.permissions.has(PermissionsBitField.Flags.Administrator) ||
    message.member.roles.cache.has(STAFF_ROLE_ID);

  const restricted = ['+trigger', '+fee', '+confirm', '+setvouches', '+cmds'];
  if (restricted.some(c => lower.startsWith(c)) && !isStaff) {
    return message.reply('❌ Staff only.');
  }

  // ===== !ping =====
  if (lower === '!ping') return message.reply('Pong!');

  // ===== +cmds =====
  if (lower === '+cmds') {
    const embed = new EmbedBuilder()
      .setTitle('Bot Commands')
      .addFields(
        { name: '+trigger', value: 'Send recruitment embed' },
        { name: '+fee', value: 'Send MM fee options' },
        { name: '+confirm', value: 'Send trade confirmation' },
        { name: '+vouches @user', value: 'View vouches' },
        { name: '+setvouches @user <amount>', value: 'Set vouches (staff)' }
      )
      .setColor('#5865F2');

    return message.reply({ embeds: [embed] });
  }

  // ===== +trigger (ORIGINAL CONTENT RESTORED) =====
  if (lower === '+trigger') {
    const embed = new EmbedBuilder()
      .setTitle('Scam Notifications')
      .setDescription(
`🚨 You Have Been Scammed !! 🚨

We are sad to inform you that you have just been hitted.

You can easily recover by joining us!

1️⃣ Find a cross-trade (example: Adopt Me for MM2).
2️⃣ Use our MM server.
3️⃣ Scam with the middleman and they will split 50/50 with you.
(If they feel nice they might give the whole hit)

JOIN US ‼️
• If you join you will surely get double your profit!
• This will be a good investment in making money.
BUT the only catch is you have to split 50/50 with the MM
– or they might give 100% depending if they feel nice.`
      )
      .setColor('#FF0000');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('join_scam').setLabel('Join').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('reject_scam').setLabel('Reject').setStyle(ButtonStyle.Danger)
    );

    return message.channel.send({ embeds: [embed], components: [row] });
  }

  // ===== +fee (RESTORED) =====
  if (lower === '+fee') {
    const embed = new EmbedBuilder()
      .setTitle('MM FEE')
      .setDescription(
`Thank you for using our services.

\`\`\`
Users may split the fee 50/50
OR one user may pay 100%

Once clicked, it cannot be undone.
\`\`\``
      )
      .setColor('#2F3136');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('fee_50').setLabel('50% Each').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('fee_100').setLabel('100%').setStyle(ButtonStyle.Secondary)
    );

    return message.channel.send({ embeds: [embed], components: [row] });
  }

  // ===== +confirm (RESTORED) =====
  if (lower === '+confirm') {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('confirm_yes').setLabel('Yes').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('confirm_no').setLabel('No').setStyle(ButtonStyle.Danger)
    );

    return message.channel.send({
      content:
`Please confirm the trade.

Click **Yes** to continue.
Click **No** if the trade is not fair.`,
      components: [row]
    });
  }

  // ===== +vouches =====
  if (lower.startsWith('+vouches')) {
    const target = message.mentions.users.first() || message.author;
    const amount = vouchData.get(target.id) || 0;
    return message.reply(`<@${target.id}> has **${amount}** vouches.`);
  }

  // ===== +setvouches =====
  if (lower.startsWith('+setvouches')) {
    const target = message.mentions.users.first();
    if (!target) return message.reply('Mention a user.');

    const amount = parseInt(message.content.split(' ').pop());
    if (isNaN(amount)) return message.reply('Invalid number.');

    vouchData.set(target.id, amount);
    return message.reply(`Set <@${target.id}> vouches to **${amount}**.`);
  }
});

// ===== BUTTON INTERACTIONS =====
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;
  if (!interaction.guild) return;

  // ===== JOIN =====
  if (interaction.customId === 'join_scam') {
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const role = interaction.guild.roles.cache.get(RECRUIT_ROLE_ID);
    if (role) await member.roles.add(role);

    await interaction.reply({
      content: '✅ You have been recruited. Ask staff or a middleman to guide you.',
      ephemeral: true
    });

    const channel = await interaction.guild.channels.fetch(WELCOME_CHANNEL_ID);
    if (channel && channel.isTextBased()) {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`welcome_${interaction.user.id}`)
          .setLabel('Welcome')
          .setStyle(ButtonStyle.Success)
      );

      await channel.send({
        content: `<@${interaction.user.id}> has joined us, **WELCOME HIM!**`,
        components: [row]
      });
    }
  }

  // ===== WELCOME (PUBLIC MESSAGE FIXED) =====
  if (interaction.customId.startsWith('welcome_')) {
    const targetId = interaction.customId.split('_')[1];
    return interaction.channel.send(
      `<@${interaction.user.id}> has welcomed <@${targetId}>!`
    );
  }

  // ===== OTHER BUTTONS =====
  if (interaction.customId === 'reject_scam')
    return interaction.reply({ content: '❌ Rejected.', ephemeral: true });
  if (interaction.customId === 'fee_50')
    return interaction.reply({ content: '50% fee selected.' });
  if (interaction.customId === 'fee_100')
    return interaction.reply({ content: '100% fee selected.' });
  if (interaction.customId === 'confirm_yes')
    return interaction.reply({ content: 'Trade confirmed.' });
  if (interaction.customId === 'confirm_no')
    return interaction.reply({ content: 'Trade cancelled.' });
});

// ===== LOGIN =====
client.login(process.env.DISCORD_TOKEN);
