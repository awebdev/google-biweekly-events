'use strict';

const fs = require('fs');
const _ = require('lodash');
const readline = require('readline');
const google = require('googleapis');
const googleAuth = require('google-auth-library');
const moment = require('moment');
const defaultDateFormat = 'YYYY-MM-DDTHH:mm:SSZ';

let startDate = moment('2017-10-05T08:00:00-05:00', defaultDateFormat);
let eventLength = 6;

// If modifying these scopes, delete your previously saved credentials
// at .credentials/google-calendar-events.json
const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const TOKEN_DIR = '.credentials/';
const TOKEN_PATH = TOKEN_DIR + 'google-calendar-events.json';

// Load client secrets from a local file.
fs.readFile('.credentials/client_secret.json', function processClientSecrets(err, content) {
  if (err) {
    console.log('Error loading client secret file: ' + err);
    return;
  }
  // Authorize a client with the loaded credentials, then call the
  // Google Calendar API.
  authorize(JSON.parse(content), listEvents);
  authorize(JSON.parse(content), createEvents);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  let clientSecret = credentials.installed.client_secret;
  let clientId = credentials.installed.client_id;
  let redirectUrl = credentials.installed.redirect_uris[0];
  let auth = new googleAuth();
  let oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    }
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
  let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}

/**
 * Lists the next 10 events on the user's primary calendar.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listEvents(auth) {
  var calendar = google.calendar('v3');
  calendar.events.list({
    auth: auth,
    calendarId: 'primary',
    timeMin: (new Date()).toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime'
  }, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }

    var events = response.items;

    if (events.length == 0) {
      return console.log('No upcoming events found.');
    }

    console.log('Upcoming 10 events:');
    for (var i = 0; i < events.length; i++) {
      var event = events[i];
      var start = event.start.dateTime || event.start.date;
      console.log('%s - %s', start, event.summary);
    }
  });
}

function createEvents(auth) {
  var event = {
    'summary': 'Event Name',
    // 'location': '...',
    // 'description': '...',
    'start': {
      'dateTime': startDate.format(defaultDateFormat),
      'timeZone': 'America/Chicago'
    },
    'end': {
      'dateTime': startDate.format(defaultDateFormat),
      'timeZone': 'America/Chicago'
    },
    // 'recurrence': [
    //   "RRULE:FREQ=DAILY;COUNT=1"
    // ],
    // 'attendees': [{'email': '*****@gmail.com'}],
    'reminders': {
      'useDefault': false,
      'overrides': [{
          'method': 'popup',
          'minutes': 12 * 60
        },
        {
          'method': 'popup',
          'minutes': 10
        }
      ]
    }
  };

  // create initial event
  createEvent(auth, event);

  for (let index = 0; index < eventLength; index++) {
    startDate = startDate.add(14, 'day');

    event.start.dateTime = startDate.format(defaultDateFormat);
    event.end.dateTime = startDate.format(defaultDateFormat);

    createEvent(auth, event);
  }
}

function createEvent(auth, event) {
  var calendar = google.calendar('v3');

  calendar.events.insert({
    auth: auth,
    calendarId: 'primary',
    resource: event
  }, function(err, event) {
    if (err) {
      console.log('There was an error contacting the Calendar service: ' + err);
      return;
    }
    console.log(`Event created for ${event.start.dateTime}: ${event.htmlLink}`);
  });
}
