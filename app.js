'use strict';

// can't use import natively yet as V8 doesn't have support for it yet.

//require('dotenv').config(); // loads env vars (don't need in prod)

// built-in requires
const path = require('path');

// main base tech stack requires
const express = require('express');
const app = express();

// socket io requires
const server = require('http').createServer(app);
const io = require('socket.io')(server);

// server.listen(80);

// other base tech stack requires
const favicon = require('serve-favicon');

// for using HTTP DELETE in forms
const bodyParser = require('body-parser');
const methodOverride = require('method-override');

// database requires
const mongoose = require('mongoose'); // already includes mongoDB

// security requires
const helmet = require('helmet');
const sanitizer = require('sanitizer'); // where will I be using sanitizer?
const limiter = require('limiter'); // where will I be using limiter?
// const uuid = require('node-uuid'); // for the nonce, though I may not need it required here...along with other 'requires'; since not using email confirm, no need...

// performance requires
const compression = require('compression'); // where am I using this?

// authentication and its dependency requires
// const bodyParser = require('body-parser');
const flash = require('connect-flash');
const session = require('express-session'); // session data is not saved in the cookie itself, just the session ID. Session data is stored server-side.
const MongoStore = require('connect-mongo')(session); // move store from mem to mongo
const passport = require('passport');


// development requires
//const morgan = require('morgan');


// custom requires
const port = process.env.PORT || 5000;
const routes = require('./app/server/routes');
const config = require('./app/server/config');
// const User = require('./app/server/models/user'); // why is this required?

mongoose.connect(config.dbURI);
mongoose.connection.on('error', () => {
    console.log('Error: Could not connect to MongoDB. Did you forget to run "mongod"?');
});


require('./app/server/controllers/middlewares/passport')(passport); // pass passport for configuration.
require('./app/server/controllers/middlewares/socketio')(io); // pass socketio for config

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, '/app/server/views'));
app.locals.basedir = app.get('views'); // allows for pug includes


//app.listen(5000, () => { console.log("Running on 5000."); });
app.set('port', port);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride((req, res) => {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    // look in urlencoded POST bodies and delete it
    let method = req.body._method
    delete req.body._method
    return method
  }
}));


app.use(compression());
app.use(helmet()); // can set up CSP against XSS attacks. 7/10 of its headers implemented by default.
app.use('/static', express.static(path.join(__dirname,'/static')));
app.use(favicon(path.join(__dirname, '/static/img/favicon.ico')));



// app.use(morgan('dev')); // log every request to console.
app.use(bodyParser.urlencoded({ extended: true }));

// configure the session
const sessionMiddleware = session({
    secret: config.sessionSecret,
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
    resave: false,
    saveUninitialized: false, // no ability for non-authorized; no reason to save.
    cookie: { secure: 'auto' } // didn't specify true as working between dev/prod. auto automatically determines, however if set on https then going to http will not show cookie.
});


app.use(sessionMiddleware);

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());


routes(app, passport); // apparently it doesn't matter if this is before or after the port is set...
/*
app.listen(app.get('port'), () => {
  console.log('Node app is running on port', app.get('port'));
});
*/


// set up socket io: http://stackoverflow.com/questions/13095418/how-to-use-passport-with-express-and-socket-io#24859515
//
// problem is that the session becomes read only, but that should be fine (assuming it doesn't mess with the logout or login features) because the session cookie only stores the ID.
// but I still need to see if there's even a reason for having socket interact with the session.
//

io.use(function(socket, next) {
  sessionMiddleware(socket.request, {}, next);
});




server.listen(app.get('port'), () => {
  console.log('Socket.io is listening on port', app.get('port'));
});


