const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);

const index = require('./routes/index');
const auth = require('./routes/auth');
const profiles = require('./routes/profiles');

const app = express();

// -- database

mongoose.connect('mongodb://localhost/de-linkedin', {
  keepAlive: true,
  reconnectTries: Number.MAX_VALUE
});

// view engine setup
app.use(expressLayouts);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('layout', 'layouts/main');

// -- middlewares

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// -- session
app.use(session({
  store: new MongoStore({
    mongooseConnection: mongoose.connection,
    ttl: 24 * 60 * 60 // 1 day
  }),
  secret: 'foobar',
  resave: true,
  saveUninitialized: true,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000
  }
}));
// user serà usable per tota la layout
app.use((req, res, next) => {
  app.locals.user = req.session.currentUser;
  next();
});

// routes
app.use('/', index);
app.use('/auth', auth);
app.use('/profiles', profiles);

// error handler
app.use(function (req, res, next) {
  res.status(404);
  const data = {
    title: '404 Not Found'
  };
  res.render('not-found', data);
});

app.use(function (err, req, res, next) {
  console.error('ERROR', req.method, req.path, err);
  if (!res.headersSent) {
    const data = {
      title: '500 Ouch'
    };
    res.status(500);
    res.render('error', data);
  }
});

module.exports = app;
