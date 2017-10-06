### Adds Bi-weekly events to google calendar

# Get Started
1. Install dependencies
```
$ npm install
```

2. Get OAuth 2.0 token for [Google Calendar API](https://developers.google.com/google-apps/calendar/auth) and save it at `.credentials/client_secret.json`

3. Update `startDate`, `eventLength` and `event` information accordingly

```js
$ node index.js // this will prompt for Google Account authentication, follow the instructions form the CLI
```

## Tips
In case of google authentication is revoked remove local credentials

```
$ rm -rf .credentials/google-calendar-events.json
```
