import { REST, Routes } from 'discord.js';
import { commands } from './commands.js';
import { config } from './config.js';

const rest = new REST({ version: '10' }).setToken(config.discordToken);

if (config.discordGuildId) {
  await rest.put(
    Routes.applicationGuildCommands(config.discordClientId, config.discordGuildId),
    { body: commands }
  );
  console.log(`Registered ${commands.length} guild commands for ${config.discordGuildId}.`);
} else {
  await rest.put(
    Routes.applicationCommands(config.discordClientId),
    { body: commands }
  );
  console.log(`Registered ${commands.length} global commands.`);
}
