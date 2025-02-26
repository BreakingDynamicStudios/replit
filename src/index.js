const { Client, Collection, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { logger } = require('./utils/logger');
const config = require('../config');
const express = require('express');
const os = require('os');

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

// Keep alive server configuration
const app = express();

// Simple keep-alive endpoint for UptimeRobot
app.get('/', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send("I am alive!");
});

// Status endpoint with detailed info
app.get('/status', (req, res) => {
    const memoryUsage = process.memoryUsage();
    const systemMemory = {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem()
    };

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send({
        status: client.isReady() ? 'online' : 'connecting',
        uptime: {
            seconds: process.uptime(),
            formatted: formatUptime(process.uptime())
        },
        bot: {
            status: client.isReady() ? 'online' : 'connecting',
            guildCount: client.guilds.cache.size,
            ping: client.ws.ping,
            commandCount: client.commands.size
        },
        system: {
            memory: {
                process: {
                    heapUsed: formatBytes(memoryUsage.heapUsed),
                    heapTotal: formatBytes(memoryUsage.heapTotal),
                    rss: formatBytes(memoryUsage.rss)
                },
                system: {
                    total: formatBytes(systemMemory.total),
                    free: formatBytes(systemMemory.free),
                    used: formatBytes(systemMemory.used)
                }
            },
            platform: process.platform,
            nodeVersion: process.version,
            cpuUsage: process.cpuUsage()
        },
        lastChecked: new Date().toISOString()
    });
});

// Add new route to show Replit URL info
app.get('/url-info', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send({
        message: "Your Replit URL for UptimeRobot is:",
        url: process.env.REPLIT_DOMAINS,
        note: "Use this URL when setting up UptimeRobot to keep your bot alive.",
        environment: {
            replit_domains: process.env.REPLIT_DOMAINS,
            repl_id: process.env.REPL_ID
        }
    });
});

// Use consistent port for Replit with fallback
const PORT = process.env.PORT || 8081;
const server = app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Keep-alive server is running on port ${PORT}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use. Please stop other running instances.`);
        process.exit(1);
    } else {
        logger.error('Server error:', err);
    }
});

function formatBytes(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round((bytes / Math.pow(1024, i))) + ' ' + sizes[i];
}

function formatUptime(uptime) {
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}