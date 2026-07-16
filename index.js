require("dotenv").config();

const fs = require("fs");

const {
    Client,
    GatewayIntentBits,
    PermissionsBitField
} = require("discord.js");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// 5h 37m
const INTERVAL = ((5 * 60) + 37) * 60 * 1000;

let timers = [];

function loadConfig() {
    return JSON.parse(
        fs.readFileSync(
            "./config.json",
            "utf8"
        )
    );
}

function saveConfig(config) {
    fs.writeFileSync(
        "./config.json",
        JSON.stringify(
            config,
            null,
            2
        )
    );
}

function getFirstEvent() {
    return new Date(
        loadConfig().nextEvent
    ).getTime();
}

async function sendMessage(text) {

    try {

        const channel =
            await client.channels.fetch(
                process.env.CHANNEL_ID
            );

        console.log(
            `[${new Date().toLocaleString("pl-PL")}] PRÓBA WYSŁANIA: ${text}`
        );

        const msg =
            await channel.send(
                `<@&${process.env.ROLE_ID}> ${text}`
            );

        console.log(
            `[${new Date().toLocaleString("pl-PL")}] WYSŁANO OK | ID: ${msg.id}`
        );

    } catch (err) {

        console.error(
            `[${new Date().toLocaleString("pl-PL")}] BŁĄD WYSYŁANIA: ${text}`
        );

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
                    .catch(err => {
                        console.error(
                            "Błąd usuwania wiadomości:",
                            err
                        );
                    });

            }

        } while (fetched.size >= 100);

        console.log(
            `[${new Date().toLocaleString("pl-PL")}] Kanał wyczyszczony`
        );

    } catch (err) {

        console.error(err);

    }
}

function clearAllTimers() {

    for (const timer of timers) {
        clearTimeout(timer);
    }

    timers = [];
}

function scheduleReminder(
    offsetMinutes,
    text
) {

    function scheduleNext() {

        let next =
            getFirstEvent() -
            offsetMinutes *
            60 *
            1000;

        while (
            next <= Date.now()
        ) {
            next += INTERVAL;
        }

        console.log(
            `${text} -> ${new Date(next).toLocaleString(
                "pl-PL",
                {
                    timeZone: "Europe/Zurich",
                    hour12: false
                }
            )}`
        );

        const timer =
            setTimeout(
                async () => {

                    console.log(
                        `[${new Date().toLocaleString("pl-PL")}] TIMER URUCHOMIONY: ${text}`
                    );

                    await sendMessage(
                        text
                    );

                    scheduleNext();

                },
                next - Date.now()
            );

        timers.push(timer);
    }

    scheduleNext();
}

function scheduleCleanup() {

    function scheduleNext() {

        let next =
            getFirstEvent() +
            31 *
            60 *
            1000;

        while (
            next <= Date.now()
        ) {
            next += INTERVAL;
        }

        console.log(
            `Czyszczenie kanału -> ${new Date(next).toLocaleString(
                "pl-PL",
                {
                    timeZone: "Europe/Zurich",
                    hour12: false
                }
            )}`
        );

        const timer =
            setTimeout(
                async () => {

                    console.log(
                        `[${new Date().toLocaleString("pl-PL")}] START CZYSZCZENIA KANAŁU`
                    );

                    await cleanChannel();

                    scheduleNext();

                },
                next - Date.now()
            );

        timers.push(timer);
    }

    scheduleNext();
}

function startSchedules() {

    clearAllTimers();

    scheduleReminder(
        10,
        "🔔 EVENT Wendigo na Płaskowyżu za około 10 minut!"
    );

    scheduleReminder(
        5,
        "⚠️ EVENT Wendigo na Płaskowyżu za około 5 minut!"
    );

    scheduleReminder(
        0,
        "⚔️ START WENDIGO!"
    );

    scheduleReminder(
        -7,
        "🚨 OSTATNI DZWONEK! Jeżeli jeszcze nie jesteś na Wendigo, to ostatni moment żeby zdążyć!"
    );

    scheduleReminder(
        -11,
        "⏳ Do końca Wendigo zostało około 5 minut!"
    );

    scheduleCleanup();
}

client.once(
    "ready",
    () => {

        console.log(
            `Zalogowano jako ${client.user.tag}`
        );

        startSchedules();

    }
);

client.on(
    "messageCreate",
    async message => {

        if (message.author.bot) {
            return;
        }

        if (
            message.content === "!next"
        ) {

            let next =
                getFirstEvent();

            while (
                next <= Date.now()
            ) {
                next += INTERVAL;
            }

            return message.reply(
                `Następny Wendigo: ${new Date(
                    next
                ).toLocaleString(
                    "pl-PL",
                    {
                        timeZone:
                            "Europe/Zurich",
                        hour12: false
                    }
                )}`
            );
        }

        if (
            message.content.startsWith(
                "!wendigo "
            )
        ) {

            if (
                !message.member.permissions.has(
                    PermissionsBitField.Flags.Administrator
                )
            ) {

                return message.reply(
                    "Brak uprawnień."
                );
            }

            const time =
                message.content
                    .split(" ")[1];

            const match =
                /^(\d{1,2}):(\d{2})$/
                    .exec(time);

            if (!match) {

                return message.reply(
                    "Użyj: !wendigo HH:MM"
                );
            }

            const now =
                new Date();

            const year =
                now.getFullYear();

            const month =
                String(
                    now.getMonth() + 1
                ).padStart(
                    2,
                    "0"
                );

            const day =
                String(
                    now.getDate()
                ).padStart(
                    2,
                    "0"
                );

            const newDate =
                `${year}-${month}-${day}T${match[1]}:${match[2]}:00+02:00`;

            saveConfig({
                nextEvent:
                    newDate
            });

            startSchedules();

            return message.reply(
                `✅ Nowy spawn ustawiony na ${time}`
            );
        }

    }
);

client.login(
    process.env.TOKEN
);
