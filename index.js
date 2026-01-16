import {
  Client,
  Events,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
  type Message,
  type Interaction
} from 'discord.js';

// ===== CONFIG =====
const MIN_ROLE_ID = '1460301154104901687'; // minimum role or higher for commands
const RECRUIT_ROLE_ID = '1460301162535321633'; // role given on +trigger Join
const WELCOME_CHANNEL_ID = '1460301222446764204'; // channel for welcome announcement

// ===== IN-MEMORY STORAGE =====
const vouchData = new Map<string, number>();

// ===== CLIENT =====
export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

export function startBot() {
  const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
  if (!DISCORD_TOKEN) {
    console.log("Skipping Discord bot login: DISCORD_TOKEN not set");
    return;
  }

  client.once(Events.ClientReady, (c) => {
    console.log(`Logged in as ${c.user.tag}`);
  });

  // ===== MESSAGE COMMANDS =====
  client.on(Events.MessageCreate, async (message: Message) => {
    if (message.author.bot) return;
    if (!message.guild) return;

    const lower = message.content.toLowerCase();
    if (!message.member) return;
    
    const minRole = message.guild.roles.cache.get(MIN_ROLE_ID);
    const hasPermission =
      message.member.permissions.has(PermissionsBitField.Flags.Administrator) ||
      (minRole &&
        message.member.roles.cache.some(
          role => role.position >= minRole.position
        ));

    if (lower === '+cmds') {
      const embed = new EmbedBuilder()
        .setTitle('Bot Commands')
        .setDescription('List of all available commands and their functions:')
        .addFields(
          { name: '+trigger', value: 'Sends the recruitment embed with Join/Reject buttons.' },
          { name: '+fee', value: 'Sends the MM Fee embed with 50% and 100% options.' },
          { name: '+confirm', value: 'Sends a trade confirmation request with Yes/No buttons.' },
          { name: '+vouches @user', value: 'Shows the amount of vouches for a user.' },
          { name: '+setvouches @user <amount>', value: 'Sets the amount of vouches for a user (staff only).' },
          { name: '!ping', value: 'Check if the bot is responsive.' }
        )
        .setColor('#5865F2');
      return message.reply({ embeds: [embed] });
    }

    if (lower === '!ping') return message.reply('Pong!');

    const restricted = ['+trigger', '+fee', '+confirm', '+setvouches'];
    if (restricted.some(cmd => lower.startsWith(cmd)) && !hasPermission) {
      return message.reply('You do not have permission to use this command.');
    }

    if (lower === '+trigger') {
      const embed = new EmbedBuilder()
        .setTitle('Scam Notifications')
        .setDescription(
`🚨 You Have Been Scammed !! 🚨

We are sad to inform you that you have just been hitted.

You can easily recover by joining us!

1️⃣ Find a cross-trade (example: Adopt Me for MM2).
2️⃣ Use our MM server.
3️⃣ Scam with the middleman and they will split 50/50 with you. (If they feel nice they might give the whole hit)

JOIN US ‼️
• If you join you will surely get double your profit!
• This will be a good investment in making money.
BUT the only catch is you have to split 50/50 with the MM - or they might give 100% depending if they feel nice.`
        )
        .setColor('#FF0000')
        .setThumbnail('https://cdn.discordapp.com/attachments/1449650068201279548/13247463342172/image.png');

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('join_scam').setLabel('Join').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('reject_scam').setLabel('Reject').setStyle(ButtonStyle.Danger)
      );

      return message.channel.send({ embeds: [embed], components: [row] });
    }

    if (lower.startsWith('+vouches')) {
      let targetUser = message.mentions.users.first() || message.author;
      const amount = vouchData.get(targetUser.id) || 0;
      return message.reply(`<@${targetUser.id}> currently has **${amount}** vouches!`);
    }
  });

  // ===== BUTTON INTERACTIONS =====
  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'join_scam') {
      try {
        if (!interaction.guild) return;
        const member = await interaction.guild.members.fetch(interaction.user.id);
        const role = interaction.guild.roles.cache.get(RECRUIT_ROLE_ID);
        if (role) await member.roles.add(role);

        await interaction.reply({
          content: `<@${interaction.user.id}> has been recruited, go to https://discord.com/channels/1429006027466211408/1460301222446764204 to learn how to hit, also make sure to read the rules! https://discord.com/channels/1429006027466211408/1460301204440617284`,
          ephemeral: true
        });
      } catch (err) {
        console.error(err);
        if (!interaction.replied) return interaction.reply({ content: 'Failed to join.', ephemeral: true });
      }
    }
  });

  client.login(DISCORD_TOKEN).catch(console.error);
}
