let express = require('express');
let router = express.Router();

let User = require('../models/db_user')

// This router is used in app.js as /user/

// GET /<id> -> Show a users profile by id
router.get('/:id', function(req, res) {
  User.findOne({user_id: req.params.id})
    .populate('projects')
    .exec(function(err,user) {
      if(err || !user) res.status(404).send('Not Found')
    
      let isLoggedIn = (req.isAuthenticated && req.isAuthenticated())

      res.render('user',{
        title: 'Vimmy - ' + user.display_name,
        loggedIn: isLoggedIn, 
        user: (!isLoggedIn ? { } : req.user.db),
        render_user: user
      })
    })
})

module.exports = router
