var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('cookie-session');

var routes = require('./routes/index');
var users = require('./routes/users');
var posts = require('./routes/posts');
var categories = require('./routes/categories');

var app = express();

app.use(session({
  secret: process.env.SESSION_SECRET,
  signed: true
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// forces SSL
app.use(function(req, res, next) {
  if(!req.secure && process.env.NODE_ENV === 'production') {
    return res.redirect(['https://', req.get('Host'), req.url].join(''));
  }
  next();
});

app.use('/', routes);
app.use('/users', users);
app.use(function(req, res, next){
  if (req.session.userID === undefined) { return res.status(403).end(); }
  next();
});
app.use('/posts', posts);
app.use('/categories', categories);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
      message: err.message,
      error: {}
  });
});

module.exports = app;
