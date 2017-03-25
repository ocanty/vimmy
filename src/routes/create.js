var express = require('express');
var router = express.Router();
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn();
var User = require("../models/db_user")
var Project = require("../models/db_project")
var uuid = require("uuid")

// memory initializer
router.get("*/vm.js.mem", function(req,res,next)
{
	res.sendFile("vm.js.mem", {root: './public'});
})

// file data
router.get("*/vm.data", function(req,res,next)
{
	res.sendFile("vm.data", {root: './public'});
})


router.get('/', ensureLoggedIn, function(req, res, next)
{
	res.render("sandbox", { 
		title: "Vimmy :: Sandbox",
		loggedIn: (req.isAuthenticated && req.isAuthenticated()), 
		user: req.user.db
	});
});

router.get('/sandbox', function(req, res, next)
{
	var isLoggedIn = (req.isAuthenticated && req.isAuthenticated())
	res.render("sandbox", { 
		title: "Vimmy :: Sandbox",
		loggedIn: isLoggedIn, 
		user: (isLoggedIn ? req.user.db : { })
	});
});

router.get('/my-projects', ensureLoggedIn, function(req, res, next)
{
	User.findOne({ user_id: req.user.db.user_id}).populate('projects').exec(function (err, user) 
	{
		regular_projects = user.projects.filter(function(doc){
			return doc.isPublished == false;
		})
		
		published_projects = user.projects.filter(function(doc){
			return doc.isPublished == true;
		})

		var isLoggedIn = (req.isAuthenticated && req.isAuthenticated())
		res.render("my-projects", { 
			title: "Vimmy :: My Projects",
			loggedIn: isLoggedIn, 
			user: (isLoggedIn ? req.user.db : { }),
			regular_projects: regular_projects,
			published_projects: published_projects
		});
	
    }); // <==

	

});

var valid_categories = {
	"General":true,
	"Educational":true,
	"Games":true
}

// if its the sandbox its a new project
router.post('/sandbox/save', ensureLoggedIn, function(req, res, next)
{
	// validate input
	if(req.body.name)
	{
		console.log("valid name")
		if(!/[^\w\s]/.test(req.body.name) && req.body.name.length < 32)
		{
			console.log("valid name format")
			if(valid_categories[req.body.category])
			{
				console.log("valid category")
				var data = req.body.data || "{ }"
				var code = req.body.code.replace(/\t+/g, "\\\\\t"); || " "
				var vm_version = 1
				
				
				var creator = req.user.db.user_id
				var created_at = new Date()
				console.log("valid category")
				var project = new Project(
				{
					project_id: uuid.v4().substring(0,6),
					name: req.body.name,
					category: req.body.category,
					isPublished: false,
					creator: req.user.db,
					created_at: created_at,
					updated_at: created_at,
					vm_version: vm_version,
					comments: [ ],
					code: code,
					data: data,
					views: 0
				})
				
				// Save project
 				project.save(function(err)
				{
					if(err)
					{
						console.error(err)
						res.status(400).send("Could not save project!");
						return -1;
					}
					
					User.findOne({user_id: req.user.db.user_id}, function(err,user)
						{
								// Add project to creator
								user.projects.push(project._id)
					
								// Save user
								user.save(function(err)
								{
									if(err)
									{
										console.error(err)
										res.status(400).send("Could not save project!");
										return -1;
									}
									
									
									// send them the project
									res.send("/projects/" + project.project_id)
								})
						})
						
				}) 
			}	
			else
			{
				res.status(400).send("Invalid category")
			}
		}
		else
		{
			res.status(400).send("Project name must be alphanumeric and must be less than 32 characters in length")
		}
	}
	else
	{
		res.status(400).send("Invalid name")
	}
});

module.exports = router;
