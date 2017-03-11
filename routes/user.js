var express = require('express');
var router = express.Router();

var User = require("../models/db_user")

/* GET users listing. */
router.get('/:id', function(req, res, next) {
	
	User.findOne({user_id: req.params.id}).populate("projects").exec(function(err,user)
		{
			if(err || !user) res.status(404).send("Not Found")
		
			var isLoggedIn = (req.isAuthenticated && req.isAuthenticated())
			res.render("user",{
				
				title: "Vimmy :: " + user.display_name,
				loggedIn: isLoggedIn, 
				user: (!isLoggedIn ? { } : req.user.db),
				render_user:user})
		
	})
});

module.exports = router;
