let express = require('express')
let router = express.Router()

let uuid = require('uuid')

let passport = require('passport')

let User = require('../models/db_user.js')

// This router is used in app.js as /auth/<these routes>

// GET /login -> send the login template
router.get('/login', function(req, res)
{
  // render homepage and pop up the login Auth0 lock
  res.render('homepage', {
    title: 'Vimmy - Login', 
    popLock: true
  })
})

// GET /logout -> when GET'd logs them out and redirects them home
router.get('/logout', function(req, res) {
  req.logout() // passport .logout
  res.redirect('/')
})

/*
  GET /callback 
  When a user finishes authentication with Auth0, it sends them back here
  Process Auth0's stuff from our side and redirect them to the homepage
*/
router.get('/callback', 
  passport.authenticate('auth0', { 
    failureRedirect: '/failed',
    scope: 'openid email profile'
  }),

  function(req, res) {

    // check if the user exists
    User.findOne({ auth_id: req.user.id }, 
      function(err, user) {
        if(err){ return console.error(err) }
          
        // if they do exist populate their session with (read-only) db values
        // these will not be updated if modified!
        if(user) {
          req.user.db = user

          // return them to where they came from or the homepage
          res.redirect(req.session.returnTo || '/')
        }
        else // if they dont add them to the database (they're a new user)
        {
          let new_user = new User({ 
            auth_id: req.user.id, // their auth0 id (auth0 populates req.user)
            user_id: uuid.v4().substring(0,6),
            display_name: req.user.nickname,
            account_created: new Date(),
            avatar: '/img/user-avatar.png',
            email: req.user.emails[0].value,
            score: 0
          })
          
          // save and populate read-only values
          new_user.save(function(err,new_user) {
            if(err){ return console.error(err) }
            req.user.db = new_user

            res.redirect(req.session.returnTo || '/') 
          })
        }
      }
    )
  }
)

module.exports = router