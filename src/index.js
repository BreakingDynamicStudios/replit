const { Client, Collection, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { logger } = require('./utils/logger');
const config = require('../config');
const express = require('express');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers
    ]
});

client.commands = new Collection();

// Command handler
const commandsPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(commandsPath);

for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(folderPath, file);
        const command = require(filePath);
        client.commands.set(command.data.name, command);
    }
}

// Event handler
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

// Error handling
process.on('unhandledRejection', error => {
    logger.error('Unhandled promise rejection:', error);
});

// Login to Discord
client.login(process.env.TOKEN || config.token);

// Keep alive server
const app = express();

// Health check endpoint
app.get('/', (req, res) => {
    res.send({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        botStatus: client.isReady() ? 'online' : 'connecting'
    });
});

// Status endpoint
app.get('/status', (req, res) => {
    res.send({
        status: 'online',
        guildCount: client.guilds.cache.size,
        ping: client.ws.ping
    });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Keep-alive server is running on port ${PORT}`);
});