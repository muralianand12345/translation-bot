"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = __importDefault(require("discord.js"));
const logger_1 = require("./utils/logger");
const config_1 = require("./utils/config");
const command_logger_1 = __importDefault(require("./utils/command_logger"));
const locales_1 = require("./core/locales");
const createClient = () => {
    const client = new discord_js_1.default.Client({ intents: [discord_js_1.default.GatewayIntentBits.Guilds, discord_js_1.default.GatewayIntentBits.GuildMessages] });
    client.logger = new logger_1.Logger();
    client.cmdLogger = new command_logger_1.default();
    client.commands = new discord_js_1.default.Collection();
    client.cooldowns = new discord_js_1.default.Collection();
    client.config = (0, config_1.loadConfig)(client);
    client.localizationManager = locales_1.LocalizationManager.getInstance();
    return client;
};
const client = createClient();
exports.default = client;
