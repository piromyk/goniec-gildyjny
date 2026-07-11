require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// 5h 34m
const INTERVAL = ((5 * 60) + 34) * 60 * 1000;

// Pierwszy znany spawn
const FIRST_EVENT = new Date(
    "2026-07-11T20:55:00+02:00"
).getTime();

async function sendMessage(text) {

    try {

        const channel =
            await client.channels.fetch(
                process.env.CHANNEL_ID
            );

        await channel.send(
            `<@&${process.env.ROLE_ID}> ${text}`
        );

    } catch (err) {

        console.error(err);

    }
}

function scheduleReminder(offsetMinutes, text) {

    function scheduleNext() {

        let next =
            FIRST_EVENT -
            offsetMinutes * 60 * 1000;

        while (next <= Date.now()) {

            next += INTERVAL;

        }

        const delay =
            next - Date.now();

        console.log(
            `${text} -> ${new Date(next)}`
        );

        setTimeout(async () => {

            await sendMessage(text);

            scheduleNext();

        }, delay);
    }

    scheduleNext();
}

client.once("ready", () => {

    console.log(
        `Zalogowano jako ${client.user.tag}`
    );

    scheduleReminder(
        10,
        "🔔 EVENT Wendigo na Płaskowyżu za 10 minut!"
    );

    scheduleReminder(
        5,
        "⚠️ Wendigo na Płaskowyżu za 5 minut!"
    );

});

client.login(
    process.env.TOKEN
);