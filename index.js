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

// mongodb.MongoClient.connect(uri, function(error, client) {

//   const db = client.db(dbName);

//   var bucket = new mongodb.GridFSBucket(db);

//   fs.createReadStream(`${__dirname}/cache/video.mp4`).
//     pipe(bucket.openUploadStream('video.mp4')).
//     on('error', function(error) {
//         console.log('error!');
//     }).
//     on('finish', function() {
//       console.log('done! upload');
//     });
//     bucket.openDownloadStreamByName('video.mp4').
//     pipe(fs.createWriteStream(`${__dirname}/cache/video2.mp4`)).
//   on('error', function(error) {
//     console.log('error!');
//   }).
//   on('finish', function() {
//     console.log('done! download');
//   });
// });

mongoose
  .connect(config.DB_URL, {
    useMongoClient: true
  })
  .then(() => console.log('MongoDB connected'))
  .catch(() => console.log('ERROR'));
// Other Files
// Init winston logger (logger.js)
var outplaced = require(`${__dirname}/logger.js`);
var logger = outplaced.logger;

// Files

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
bot.start((ctx) => {
  ctx.reply(
    "Hey there!\nI'm sending Youtube videos to you!"
  );
  // const url = 'https://www.youtube.com/watch?v=pahO5XjnfLA';
  
  // const video = ytdl(url, { quality: 'highest' });
  // let starttime;
  // video.pipe(fs.createWriteStream(`${__dirname}/cache/video.mp4`));
  // video.once('response', () => {
  //   starttime = Date.now();
  // });
  // video.on('progress', (chunkLength, downloaded, total) => {
  //   const percent = downloaded / total;
  //   const downloadedMinutes = (Date.now() - starttime) / 1000 / 60;
  //   const estimatedDownloadTime = (downloadedMinutes / percent) - downloadedMinutes;
  //   readline.cursorTo(process.stdout, 0);
  //   process.stdout.write(`${(percent * 100).toFixed(2)}% downloaded `);
  //   process.stdout.write(`(${(downloaded / 1024 / 1024).toFixed(2)}MB of ${(total / 1024 / 1024).toFixed(2)}MB)\n`);
  //   process.stdout.write(`running for: ${downloadedMinutes.toFixed(2)}minutes`);
  //   process.stdout.write(`, estimated time left: ${estimatedDownloadTime.toFixed(2)}minutes `);
  //   readline.moveCursor(process.stdout, 0, -1);
  // });
  // video.on('end', () => {
  //   process.stdout.write('\n\n');
  // });
});
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
     
      // function mapInfo (item) {
      //   'use strict'
      //   return {
      //     itag: item.format_id,
      //     filetype: item.ext,
      //     format_note: item.format_note,
      //     format: item.format,
      //     resolution:
      //       item.resolution ||
      //       (item.width ? item.width + 'x' + item.height : 'audio only')
      //   }
      // }
      
      // ytdl.getInfo(videoURL, function getInfo (err, info) {
      //   'use strict'
      //   if (err) {
      //     throw err
      //   }
      //   var formats = { id: info.id, formats: info.formats.map(mapInfo) }
      //   console.log(formats)
      // })
      
      // video.on('info',  function (info) {
      //   infor = info;
      //   console.log(infor.size);
      //   videosize = infor.size / 100000;
      //   if (TeleMaxData) {
      //     ctx.reply('Download Started');
      //     mongodb.MongoClient.connect(
      //       uri,
      //       function (error, client) {
      //         const db = client.db(dbName);

      //         var bucket = new mongodb.GridFSBucket(db);
      //         video.pipe(bucket.openUploadStream(video_id));
      //       }
      //     );

      //     // Status of Download
      //     var pos = 0;

      //     // let msgInfo =  await ctx.reply('0.0%');
      //     // console.log(msgInfo);
      //     video.on('data', function data(chunk) {
      //       pos += chunk.length;
      //       if (infor.size) {
      //         let percent = (
      //           (pos / infor.size) *
      //           100
      //         ).toFixed(2);
      //         // ctx.telegram.editMessageText(
      //         //   msgInfo.chat.id,
      //         //   msgInfo.message_id,
      //         //   msgInfo.message_id,
      //         //   `${percent}%`
      //         // );
      //         process.stdout.cursorTo(0);
      //         process.stdout.clearLine(1);
      //         process.stdout.write(percent + '%');
      //       }
      //     });

      //     video.on('end',  function () {
      //       logger.log('info', 'Download completed');
      //       try{
      //       ctx.reply(
      //         'Download has been started. \n🎞 : ' +
      //           infor.title +
      //           '\n📥 : ' +
      //           videosize * 0.001 +
      //           ' KB\n\n\nPlease wait ...'
      //       );
      //       logger.log(
      //         'info',
      //         `Video gets Send! - This might take a few Seconds! \n Title: ${infor.title}, Size: ${videosize}`
      //       );
      //        mongodb.MongoClient.connect(
      //         uri, function (error, client) {

      //           const db = client.db(dbName);

      //           var bucket = new mongodb.GridFSBucket(db);
      //           let vi = bucket.openDownloadStreamByName(video_id);
      //           ctx.replyWithVideo({
      //             source: vi
      //           });
      //         }
      //       );
      //     }catch(error){
      //       console.log(error + "===================");
      //     }
      //     });
      //   } else {
      //     ctx.reply(
      //       `The Video is ${videosize}mb. The maximum size for sending videos from Telegram is ${TeleMaxData}mb.`
      //     );
      //     logger.log(
      //       'info',
      //       `The Video size is to big! (${videosize}mb)`
      //     );
      //   }
      // });
    } else {
      ctx.reply('Is not url');
    }
  } catch (error) {
    console.log(error + 'Shakhzod');
  }
});

app.listen(PORT, () =>
  console.log(`My server is running on port ${PORT}`)
);
