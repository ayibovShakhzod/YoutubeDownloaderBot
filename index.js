const Telegraf = require('telegraf');
const fs = require('fs');
const youtubedl = require('youtube-dl');
const express = require('express');

const app = express();
const PORT = 8000;

app.get('/', (req, res) => {
  res.send('Hello. I changed this text sda');
});

// Other Files
// Init winston logger (logger.js)
var outplaced = require(`${__dirname}/logger.js`);
var logger = outplaced.logger;

// Files
const config = require(`${__dirname}/config.json`);

// Global Vars
var DOWN_URL = 'https://www.youtube.com/watch?v=';
var infor;
var TeleMaxData = 10000; // 50mb || This mighth change in Future!
var videosize;

// Bot setup
const bot = new Telegraf(config.token);
logger.log(
  'info',
  'Bot is running;; TOKEN: ' + config.token
);
bot.start((ctx) =>
  ctx.reply(
    "Hey there!\nI'm sending Youtube videos to you!"
  )
);
bot.help((ctx) =>
  ctx.reply(
    'Send me a link and I will send you the vid :) \n cmds: \n \n /video {videoID}'
  )
);
bot.startPolling();

// Catch all errors from bot
bot.catch(function (err) {
  logger.log('info', err);
});


bot.on('text', async (ctx) => {
  try {
    console.log(ctx.message);
    if (ctx.message.entities[0].type === 'url') {
      let input = ctx.message.text;
      let video_id = '';
      input = input
        .replace(/(>|<)/gi, '')
        .split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
      if (input[2] !== undefined) {
        video_id = input[2].split(/[^0-9a-z_\-]/i);
        video_id = video_id[0];
      } else {
        video_id = input;
      }
      //   var video_id = input.split('v=')[1];
      //   var ampersandPosition = video_id.indexOf('&');
      //   if (ampersandPosition != -1) {
      //     video_id = video_id.substring(0, ampersandPosition);
      //   }

      const videoURL = DOWN_URL + video_id;
      console.log(video_id);

      const video = youtubedl(
        videoURL,
        // Optional arguments passed to youtube-dl.
        ['--format=18'],
        // Additional options can be given for calling `child_process.execFile()`.
        { cwd: __dirname }
      );
      video.on('info', function (info) {
        infor = info;
        videosize = infor.size / 1000000;

        if (videosize < TeleMaxData) {
          ctx.reply('Download Started');
          video.pipe(
            fs.createWriteStream(
              `${__dirname}/cache/${video_id}.mp4`
            )
          );

          // Status of Download
          var pos = 0;
          video.on('data', function data(chunk) {
            pos += chunk.length;
            if (infor.size) {
              let percent = (
                (pos / infor.size) *
                100
              ).toFixed(2);
              process.stdout.cursorTo(0);
              process.stdout.clearLine(1);
              process.stdout.write(percent + '%');
            }
          });

          video.on('end', async function () {
            logger.log('info', 'Download completed');
            try {
              // ctx.reply(`Download completed!\nVideo gets Send! - This might take a few Seconds! \n \n Title: \n ${infor.title}. It's ${videosize}mb big.`);
              ctx.reply(
                'Download has been started. \n🎞 : ' +
                  infor.title +
                  '\n📥 : ' +
                  videosize * 0.001 +
                  ' KB\n\n\nPlease wait ...'
              );
              logger.log(
                'info',
                `Video gets Send! - This might take a few Seconds! \n Title: ${infor.title}, Size: ${videosize}`
              );
              await ctx.replyWithVideo({
                source: fs.createReadStream(
                  `${__dirname}/cache/${video_id}.mp4`
                )
              });
            } catch (err) {
              logger.log('info', 'Error: sendVideo');
              ctx.reply('Error: sendVideo');
            }
          });
        } else {
          ctx.reply(
            `The Video is ${videosize}mb. The maximum size for sending videos from Telegram is ${TeleMaxData}mb.`
          );
          logger.log(
            'info',
            `The Video size is to big! (${videosize}mb)`
          );
        }
      });
    } else {
      ctx.reply('Is not url');
    }
  } catch (error) {}
});

bot.command('/video', async (ctx) => {
  try {
    let userID = ctx.from['id'];

    let input = ctx.message['text'];
    let subText = input.split(' ');
    let subSplit;
    let videoURL;

    logger.log(
      'info',
      `-----------NEW_DOWNLOAD_BY_${userID}-----------`
    );

    if (subText[1].includes('https://youtu.be/')) {
      subSplit = subText.split('.be/');
      videoURL = DOWN_URL + subSplit[1];
    } else {
      videoURL = DOWN_URL + subText[1];
    }
    logger.log('info', `Youtube video URL: ${videoURL}`);

    // Remove previous video from cache!
    if (fs.existsSync(`${__dirname}/cache/${userID}.mp4`)) {
      fs.unlink(
        `${__dirname}/cache/${userID}.mp4`,
        (err) => {
          if (err) logger.log('info', err);
          logger.log(
            'info',
            `${__dirname}/cache/${userID}.mp4 was deleted`
          );
        }
      );
    }

    // Download video
    var video = youtubedl(
      videoURL,
      // Optional arguments passed to youtube-dl.
      ['--format=18'],
      // Additional options can be given for calling `child_process.execFile()`.
      { cwd: __dirname }
    );

    // Will be called when the download starts.
    video.on('info', function (info) {
      infor = info;
      videosize = infor.size / 1000000;

      if (videosize < TeleMaxData) {
        ctx.reply('Download Started');
        video.pipe(
          fs.createWriteStream(
            `${__dirname}/cache/${userID}.mp4`
          )
        );

        // Status of Download
        var pos = 0;
        ctx.sendText(`${percent}%`);
        video.on('data', function data(chunk) {
          pos += chunk.length;
          if (infor.size) {
            let percent = (
              (pos / infor.size) *
              100
            ).toFixed(2);
            process.stdout.cursorTo(0);
            process.stdout.clearLine(1);
            process.stdout.write(percent + '%');
            telegram.editMessageText(
              ctx.chat.id,
              messageId,
              inlineMessageId,
              text,
              [extra]
            );
          }
        });

        video.on('end', async function () {
          logger.log('info', 'Download completed');
          try {
            // ctx.reply(`Download completed!\nVideo gets Send! - This might take a few Seconds! \n \n Title: \n ${infor.title}. It's ${videosize}mb big.`);
            ctx.reply(
              'Download has been started. \n🎞 : ' +
                infor.title +
                '\n📥 : ' +
                videosize * 0.001 +
                ' KB\n\n\nPlease wait ...'
            );
            logger.log(
              'info',
              `Video gets Send! - This might take a few Seconds! \n Title: ${infor.title}, Size: ${videosize}`
            );
            await ctx.replyWithVideo({
              source: fs.createReadStream(
                `${__dirname}/cache/${userID}.mp4`
              )
            });
          } catch (err) {
            logger.log('info', 'Error: sendVideo');
            ctx.reply('Error: sendVideo');
          }
        });
      } else {
        ctx.reply(
          `The Video is ${videosize}mb. The maximum size for sending videos from Telegram is ${TeleMaxData}mb.`
        );
        logger.log(
          'info',
          `The Video size is to big! (${videosize}mb)`
        );
      }
    });
  } catch (err) {
    ctx.reply('ERROR');
    logger.log('info', 'error');
  }
});
app.listen(PORT, () =>
  console.log(`My server is running on port ${PORT}`)
);
