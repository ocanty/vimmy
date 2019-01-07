let express = require('express')
let path = require('path')
let favicon = require('serve-favicon')
let logger = require('morgan')
let cookieParser = require('cookie-parser')
let bodyParser = require('body-parser')
let session = require('express-session')

// first we load enviromental variables from .env
let dotenv = require('dotenv')
dotenv.load()

// next verify every env variable we require was set
const envRequired = ['DATABASE',
  'AUTH0_DOMAIN',
  'AUTH0_CLIENT_ID',
  'AUTH0_CLIENT_SECRET',
  'AUTH0_CALLBACK_URL',
  'PORT',
  'SESSION_SECRET',
  'GOOGLE_TRACKING_ID']

envRequired.every((variable) => {
  if(!process.env[variable]) {
    console.log('Missing enviromental variable:', variable)
    process.exit(-1)
  }
})

// db
let mongoose = require('mongoose')
mongoose.connect(process.env.DATABASE, { useNewUrlParser: true })

var db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'))

db.once('open', function() {
  console.log('Connected to database:', process.env.DATABASE)
})

// express
let app = express()
app.locals.moment = require('moment')

var passport = require('passport');
var Auth0Strategy = require('passport-auth0');
// Configure Passport to use Auth0
var strategy = new Auth0Strategy(
  {
    domain: process.env.AUTH0_DOMAIN,
    clientID: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    callbackURL: process.env.AUTH0_CALLBACK_URL || 'http://localhost:3000/callback'
  },
  function (accessToken, refreshToken, extraParams, profile, done) {
    // accessToken is the token to call Auth0 API (not needed in the most cases)
    // extraParams.id_token has the JSON Web Token
    // profile has all the information from the user
    return done(null, profile);
  }
);

passport.use(strategy);

app.use(passport.initialize());
app.use(passport.session());


passport.use(strategy)

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: {}
}))

// you can use this section to keep a smaller payload
passport.serializeUser(function(user, done) {
  done(null, user)
})

passport.deserializeUser(function(user, done) {
  done(null, user)
})

// express middleware
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')

app.use(logger('dev'));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())

app.use(favicon(__dirname + '/public/favicon.png'))
app.use(express.static(path.join(__dirname, 'public')))

// Routing
var index = require('./routes/index')
var user = require('./routes/user')
var auth = require('./routes/auth')

var projects = require('./routes/projects')
var learn = require('./routes/learn')
var create = require('./routes/create')
var discover = require('./routes/discover')

app.use('/', index)
app.use('/', auth)
app.use('/projects', projects)
app.use('/create', create)
app.use('/learn',learn)
app.use('/discover', discover)
app.use('/users', user)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found')
  err.status = 404
  next(err)
})

Error.stackTraceLimit = Infinity

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error   = req.app.get('env') === 'development' ? err : {}
  
  // render the error page
  res.status(err.status || 500)
  res.render('error')

  next()
})

app.listen(process.env.PORT)

module.exports = app
