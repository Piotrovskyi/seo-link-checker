# SEO link checker

A Telegram bot designed to handle backlinks, regularly verifying their existence and confirming if they are still 'dofollow'.

## Design
Project consist of three parts
1) Bot itself
2) Cron lambda which send all the links to queue
3) Queue consumer lambda which check link status

## ENV
```
MONGODB_URL=""
BOT_TOKEN="" (can be obtained from telegram botfather)
NODE_ENV=""
OWNER_CHAT_ADDRESS="" (admin chat address)
CHECK_LINK_TIMEOUT=""
```

## Deploy
```
serverless deploy
```
