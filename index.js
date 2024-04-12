require("dotenv").config();

const line = require("@line/bot-sdk");
const express = require("express");

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
});

const app = express();

// open ai
const OpenAI = require("openai");
const openai = new OpenAI();

app.post("/callback", line.middleware(config), (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// LINE event handler
async function handleEvent(event) {
  if (event.type !== "message" || event.message.type !== "text") {   
    return Promise.resolve(null);
  }

  /* openAI */
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      {
        role: "user",
        content: event.message.text,
      },
    ],
  });
  /* openAI */

  // create an echoing text message
  const choices = response.choices.[0];
  const echo = {
    type: "text",
    text: choices.message.content || "喵喵～無法回答",
  };

  // use reply API
  return client.replyMessage({
    replyToken: event.replyToken,
    messages: [echo],
  });
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App is running on ${port}`);
});