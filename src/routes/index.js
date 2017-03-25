var express = require('express');
var router = express.Router();
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn();

var User = require("../models/db_user")
var learn = require("./learn")

/* GET home page. */
router.get('/', function(req, res, next) {
	
	var isLoggedIn = (req.isAuthenticated && req.isAuthenticated())
	// console.log(req.user)
	// console.log(req.isAuthenticated())
	

	
	// supply lesson + creation info for the title bar
	if(isLoggedIn)
	{
		var lesson_info = undefined
		var creation_info = undefined
		var c = 0
		User.findOne({ user_id: req.user.db.user_id}).populate('projects').exec(function (err, user) 
		{
			// supply recent lessons and projects for the dashboard 
			if(user)
			{
				creation_info = {}
				lesson_info = { }
				var regular_projects = user.projects.filter(function(doc){
					return doc.isPublished == false;
				})
				
				for(var n in user.recent_lessons)
				{
					if(typeof user.recent_lessons[n] == "string" && n != "_path")
					{
						lesson_info[n] = learn.getLessonInfo(user.recent_lessons[n]) || undefined
						c = n
					}
				}
				
				console.log(lesson_info)
				res.render("dashboard", { 
					title: (!isLoggedIn ? "Vimmy :: The Educational Virtual Machine" : "Vimmy :: Dashboard"),
					loggedIn: isLoggedIn, 
					user: (!isLoggedIn ? { } : req.user.db),
					lesson_info: lesson_info,
					lesson_info_largest_n: c,
					creation_info: regular_projects
				});
			}

		}); // <==

		
	}
	else// if they arent signed in render the homepage
	{
		res.render("homepage", { 
			title: (!isLoggedIn ? "Vimmy :: The Educational Virtual Machine" : "Vimmy :: Dashboard"),
			loggedIn: isLoggedIn, 
			user: (!isLoggedIn ? { } : req.user.db)
		});
	}
});

module.exports = router;
