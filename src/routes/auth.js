var express = require("express");
var router = express.Router();
var uuid = require("uuid")

var passport = require("passport")

var User = require("../models/db_user.js")

// Render the login template
router.get('/login', function(req, res)
{
	// render homepage with sign in lock
	res.render("homepage", { title: "Vimmy :: The Educational Virtual Machine", popLock: true });
});

// Perform session logout and redirect to homepage
router.get('/logout', function(req, res)
{
	req.logout();
	res.redirect('/');
});

// Perform the final stage of authentication and redirect to '/user'
router.get('/callback', passport.authenticate('auth0', { failureRedirect: '/failed' }),
	function(req, res)
	{
		// check if this user exists
		User.findOne({ auth_id: req.user.id },
			function(error,user)
			{
				if(error){ return console.error(error); }
				
				// if they do populate the session with read-only db values
				if(user)
				{
					req.user.db = user
					res.redirect(req.session.returnTo || '/');
				}
				else // if they dont add them to the database
				{
					var new_user = new User(
					{ 
						auth_id: req.user.id,
						user_id: uuid.v4().substring(0,6),
						display_name: req.user.nickname,
						account_created: new Date(),
						avatar: "/img/user-avatar.png",
						email: req.user.emails[0].value,
						score: 0
					})
					
					new_user.save(function(error,new_user)
					{
						if(error){ return console.error(error); }
						req.user.db = new_user
						res.redirect(req.session.returnTo || '/');
					})
				}
			}
		)
	}
);

module.exports = router