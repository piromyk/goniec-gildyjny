require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// 5h 34m
const INTERVAL = ((5 * 60) + 34) * 60 * 1000;

// Najbliższy znany start Wendigo
const FIRST_EVENT = new Date(
    "2026-07-12T00:51:00+02:00"
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

async function cleanChannel() {

    try {

        const channel =
            await client.channels.fetch(
                process.env.CHANNEL_ID
            );

        let fetched;

        do {

            fetched =
                await channel.messages.fetch({
                    limit: 100
                });

            const botMessages =
                fetched.filter(
                    msg =>
                        msg.author.id ===
                        client.user.id
                );

            for (const [, msg] of botMessages) {

                await msg
                    .delete()
                    .catch(() => {});

            }

        } while (fetched.size >= 100);

        console.log(
            "Kanał wyczyszczony"
        );

    } catch (err) {

        console.error(err);

    }
}

function scheduleReminder(
    offsetMinutes,
    text
) {

    function scheduleNext() {

        let next =
            FIRST_EVENT -
            offsetMinutes *
            60 *
            1000;

        while (
            next <= Date.now()
        ) {

            next += INTERVAL;

        }

        const delay =
            next - Date.now();

        console.log(
            `${text} -> ${new Date(
                next
            ).toLocaleString()}`
        );

        setTimeout(
            async () => {

                await sendMessage(
                    text
                );

                scheduleNext();

            },
            delay
        );
    }

    scheduleNext();
}

function scheduleCleanup() {

    function scheduleNext() {

        // Event trwa około 16 min
        // +15 min po końcu
        // = 31 min po starcie

        let next =
            FIRST_EVENT +
            31 *
            60 *
            1000;

        while (
            next <= Date.now()
        ) {

            next += INTERVAL;

        }

        const delay =
            next - Date.now();

        console.log(
            `Czyszczenie kanału -> ${new Date(
                next
            ).toLocaleString()}`
        );

        setTimeout(
            async () => {

                await cleanChannel();

                scheduleNext();

            },
            delay
        );
    }

    scheduleNext();
}

client.once(
    "ready",
    () => {

        console.log(
            `Zalogowano jako ${client.user.tag}`
        );

        // 10 minut przed

        scheduleReminder(
            10,
            "🔔 EVENT Wendigo na Płaskowyżu za 10 minut!"
        );

        // 5 minut przed

        scheduleReminder(
            5,
            "⚠️ EVENT Wendigo na Płaskowyżu za 5 minut!"
        );

        // START

        scheduleReminder(
            0,
            "⚔️ START WENDIGO!"
        );

        // 5 minut do końca
        // Event trwa 16 minut
        // więc wysyłamy 11 minut po starcie

        scheduleReminder(
            -11,
            "⏳ Do końca Wendigo zostało około 5 minut!"
        );

        // Czyszczenie kanału
        // 15 minut po końcu

        scheduleCleanup();

    }
);

client.login(
    process.env.TOKEN
);