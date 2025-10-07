"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = __importDefault(require("discord.js"));
;
const manager_1 = require("./locales/manager");
class DiscordResponse {
    constructor(client) {
        this.success = (message) => {
            return new discord_js_1.default.EmbedBuilder()
                .setColor('#43b581')
                .setDescription(`✓ ${message}`)
                .setFooter({ text: this.client.user?.username || 'Music Bot', iconURL: this.client.user?.displayAvatarURL() });
        };
        this.error = (message, locale = 'en', contact_dev = false) => {
            return new discord_js_1.default.EmbedBuilder()
                .setColor('#f04747')
                .setDescription(`❌ ${message}`)
                .setFooter({ text: contact_dev ? this.localizationManager.translate('responses.errors.contact_dev', locale) : this.client.user?.username || 'Music Bot', iconURL: this.client.user?.displayAvatarURL() });
        };
        this.info = (message) => {
            return new discord_js_1.default.EmbedBuilder()
                .setColor('#5865f2')
                .setDescription(`ℹ️ ${message}`)
                .setFooter({ text: this.client.user?.username || 'Music Bot', iconURL: this.client.user?.displayAvatarURL() });
        };
        this.warning = (message) => {
            return new discord_js_1.default.EmbedBuilder()
                .setColor('#faa61a')
                .setDescription(`⚠️ ${message}`)
                .setFooter({ text: this.client.user?.username || 'Music Bot', iconURL: this.client.user?.displayAvatarURL() });
        };
        this.getSupportButton = (locale = 'en') => {
            return new discord_js_1.default.ActionRowBuilder().addComponents(new discord_js_1.default.ButtonBuilder().setLabel(this.localizationManager.translate('responses.buttons.support_server', locale)).setStyle(discord_js_1.default.ButtonStyle.Link).setURL('https://discord.gg/XzE9hSbsNb').setEmoji('🔧'));
        };
        this.client = client;
        this.localizationManager = manager_1.LocalizationManager.getInstance();
    }
}
exports.default = DiscordResponse;
