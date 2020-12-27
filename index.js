const express = require('express');
const mongoose = require('mongoose');
const Telegraf = require('telegraf');
const fs = require('fs');
const ytdl = require('ytdl-core');
const mongodb = require('mongodb');
const readline = require('readline');

const app = express();
const PORT = 8000;

app.get('/', (req, res) => {
  res.send('Hello. I changed this text sda');
});
const config = require(`${__dirname}/config.json`);
const uri = 'mongodb://localhost:27017';
const dbName = 'test';

mongoose
  .connect(config.DB_URL, {
    useMongoClient: true
  })
  .then(() => console.log('MongoDB connected'))
  .catch(() => console.log('ERROR'));
  var outplaced = require(`${__dirname}/logger.js`);
  var logger = outplaced.logger;

// Files

// Global Vars
var DOWN_URL = 'https://www.youtube.com/watch?v=';

// Bot setup
const bot = new Telegraf(config.token);
logger.log(
  'info',
  'Bot is running;; TOKEN: ' + config.token
);
bot.start((ctx) => {
  ctx.reply(
    "Hey there!\nI'm sending Youtube videos to you!"
  );
});
bot.help((ctx) =>
  ctx.reply(
    'Send me a link and I will send you the vid :) \n cmds: \n \n /video {videoID}'
  )
);

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
      const videoURL = DOWN_URL + video_id;
      console.log(video_id);
      let info = await ytdl.getInfo(video_id);
      let format = ytdl.chooseFormat(info.formats, { quality: 'lowest' });
      console.log('Format found!', format);
      const video = ytdl(videoURL, { quality: 'lowest' });
      video.once('response', () => {
        starttime = Date.now();
        mongodb.MongoClient.connect(
          uri,
          function (error, client) {
            const db = client.db(dbName);

            var bucket = new mongodb.GridFSBucket(db);
            video.pipe(bucket.openUploadStream(video_id)).on('finish', () => {
              mongodb.MongoClient.connect(
                uri, function (error, client) {
        
                  const db = client.db(dbName);
        
                  var bucket = new mongodb.GridFSBucket(db);
                  let vi = bucket.openDownloadStreamByName(video_id);
                  ctx.replyWithVideo({
                    source: vi
                  });
                }
              );
            });
          }
        );
        ctx.reply('Download Started');
      });
      video.on('progress', (chunkLength, downloaded, total) => {
        const percent = downloaded / total;
        const downloadedMinutes = (Date.now() - starttime) / 1000 / 60;
        const estimatedDownloadTime = (downloadedMinutes / percent) - downloadedMinutes;
        readline.cursorTo(process.stdout, 0);
        process.stdout.write(`${(percent * 100).toFixed(2)}% downloaded `);
        process.stdout.write(`(${(downloaded / 1024 / 1024).toFixed(2)}MB of ${(total / 1024 / 1024).toFixed(2)}MB)\n`);
        process.stdout.write(`running for: ${downloadedMinutes.toFixed(2)}minutes`);
        process.stdout.write(`, estimated time left: ${estimatedDownloadTime.toFixed(2)}minutes `);
        readline.moveCursor(process.stdout, 0, -1);
      });
      video.on('end', () => {
        process.stdout.write('\n\n');
      });
    } else {
      ctx.reply('Is not url');
    }
  } catch (error) {
    console.log(error + 'Error');
  }
});

bot.startPolling();

app.listen(PORT, () =>
  console.log(`My server is running on port ${PORT}`)
);
