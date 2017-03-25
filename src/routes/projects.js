
var express = require("express");
var router = express.Router();
ensureLoggedIn = require("connect-ensure-login").ensureLoggedIn();


var User = require("../models/db_user")
var Project = require("../models/db_project")

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


// returns true if user is allowed see the project
function checkProjectVisAuth(req,res,project)
{
	var isLoggedIn = (req.isAuthenticated && req.isAuthenticated())
	if(project.isPublished == false) // check auth
	{
		if(isLoggedIn && req.user.db.user_id == project.creator.user_id)
		{
			return true
		}
		else
		{
			res.status(403).send("You do not have permission to view this project")
			return false
		}
		
	}
	else{
		return true
	}
}

function checkOwnerOnlyAuth(req,res,project)
{
	var isLoggedIn = (req.isAuthenticated && req.isAuthenticated())

	if(isLoggedIn && req.user.db.user_id == project.creator.user_id)
	{
		return true
	}
	else
	{
		res.status(403).send("You do not have permission to do this action")
		return false
	}
		
}

router.get('/:project_id', function(req, res, next)
{
	Project.findOne({project_id:req.params.project_id}).populate("creator").exec(function(error,project)
	{
		if(error || !project)
		{
			res.status(404).send("404 Not Found")
		}
		else
		{
			
			var isLoggedIn = (req.isAuthenticated && req.isAuthenticated())

			if(!checkProjectVisAuth(req,res,project)) return
			
			var hasVoted = false
			if(isLoggedIn)
			{
				hasVoted = project.votes.find(function(vote)
				{
					return vote == req.user.db._id
				})
				console.log(hasVoted)
			}
			
			project.views = project.views + 1
			project.save(function(err)
			{
				if(err)
				{
					console.error(err)
					//res.status(404).send("404 Not Found");
					//return -1;
				}
			})
			
			var isLoggedIn = (req.isAuthenticated && req.isAuthenticated())
			res.render("project", { 
				title: "Vimmy :: " + project.name,
				loggedIn: (req.isAuthenticated && req.isAuthenticated()), 
				user: (isLoggedIn == true ? req.user.db : { }),
				project: project,
				hasNotVoted: !hasVoted,
				isOwner: (isLoggedIn && req.user.db._id == project.creator._id)
			});
		}
	})
});

router.get('/:project_id/code', function(req, res, next)
{
	Project.findOne({project_id:req.params.project_id}).populate("creator").exec(function(error,project)
	{
		if(!checkProjectVisAuth(req,res,project)) return
		
		if(error || !project)
		{
			res.status(404).send("404 Not Found")
		}
		else
		{
			var isLoggedIn = (req.isAuthenticated && req.isAuthenticated())
			


			res.send(project.code);
		}
	})
});

router.get('/:project_id/data', function(req, res, next)
{
	Project.findOne({project_id:req.params.project_id}).populate("creator").exec(function(error,project)
	{
		if(!checkProjectVisAuth(req,res,project)) return
		
		if(error || !project)
		{
			res.status(404).send("404 Not Found")
		}
		else
		{
			var isLoggedIn = (req.isAuthenticated && req.isAuthenticated())
			res.send(project.data)
		}
	})
});

router.get('/:project_id/edit', function(req, res, next)
{
	Project.findOne({project_id:req.params.project_id}).exec(function(error,project)
	{
		
		if(error || !project)
		{
			res.status(404).send("404 Not Found")
		}
		else
		{	

			//if(!checkOwnerOnlyAuth(req,res,project)) return
	
			var isLoggedIn = (req.isAuthenticated && req.isAuthenticated())
			res.render("sandbox", { 
				title: "Vimmy :: " + project.name,
				loggedIn: (req.isAuthenticated && req.isAuthenticated()), 
				user: (isLoggedIn == true ? req.user.db : { }),
				project: project,
				getProject: true,
				postUrl: "/projects/" + req.params.project_id + "/edit/save"
			});
		}
	})
});


router.post('/:project_id/edit/save', function(req, res, next)
{
	Project.findOne({project_id:req.params.project_id}).populate("creator").exec(function(error,project)
	{
		if(!checkOwnerOnlyAuth(req,res,project)) return
		
		project.data = req.body.data || "{ }"
		project.code = req.body.code || "{ }"

		project.updated_at = new Date()
		
		
		// Save project
		project.save(function(err)
		{
			if(err)
			{
				console.error(err)
				res.status(400).send("Could not save project!");
				return -1;
			}
			
			res.send("/projects/" + project.project_id)

				
		}) 

	})
});

router.get('/:project_id/run', function(req, res, next)
{
	Project.findOne({project_id:req.params.project_id}).populate("creator").exec(function(error,project)
	{
		// check if 
		if(project.isPublished == true){ if(!checkProjectVisAuth(req,res,project)) return }
		else { if(!checkOwnerOnlyAuth(req,res,project)){ return }}
		
		if(error || !project)
		{
			res.status(404).send("404 Not Found")
		}
		else
		{	

			var isLoggedIn = (req.isAuthenticated && req.isAuthenticated())
			res.render("sandbox", { 
				title: "Vimmy :: " + project.name,
				loggedIn: (req.isAuthenticated && req.isAuthenticated()), 
				user: (isLoggedIn == true ? req.user.db : { }),
				project: project,
				getProject: true,
				runMode: true,
				isOwner: (req.user.db.user_id == project.creator.user_id ? true : false)
			});
		}
	})
});

router.post('/:project_id/upvote', ensureLoggedIn, function(req, res, next)
{
	Project.findOne({project_id:req.params.project_id}).populate("creator").exec(function(error,project)
	{
		if(!checkProjectVisAuth(req,res,project)) return
	//	if(!checkOwnerOnlyAuth(req,res,project)) return
		
		if(error || !project)
		{
			res.status(404).send("404 Not Found")
		}
	
		if(project)
		{
			var hasVoted = project.votes.find(function(vote)
			{
				return vote == req.user.db._id
			})
			if(!hasVoted)
			{
				// Increase  project owner score if the person upvoting is not the owner
				if(project.creator._id != req.user.db._id)
				{
					User.findOne({user_id: project.creator.user_id}).exec(function(error,user)
						{
							user.score = user.score + 1
					
							// Save user
							user.save(function(err)
							{
								if(err)
								{
									console.error(err)
									res.status(400).send("Could not save project!");
									return -1;
								}
							})
						})
				}
				
				project.num_votes = project.num_votes + 1
				project.votes.push(req.user.db._id)
				project.save(function(err)
				{
					if(err)
					{
						console.error(err)
						res.status(400).send("Could not save project!");
						return -1;
					}
					console.log(project)
					//project.votes.push(req.user.db.user_id)
					
					// send them the new count
				})
			}
			
			// send them the new count
			res.status(200).send()
		}
	})
	
	
});


router.post('/:project_id/delete', function(req, res, next)
{
	// check permissions
	//if(!checkProjectVisAuth(req,res,project)) return
	//if(!checkOwnerOnlyAuth(req,res,project)) return
	
	Project.findOne({project_id:req.params.project_id}).populate("creator").exec(function(err,project)
		{
			if(!checkProjectVisAuth(req,res,project)) return
			if(!checkOwnerOnlyAuth(req,res,project)) return
			
			project.remove(function (err) {
				res.redirect("/create/my-projects")
			});
		})
	
});


router.post('/:project_id/publish', ensureLoggedIn, function(req, res, next)
{

	// check permissions
	Project.findOne({project_id:req.params.project_id}).populate("creator").populate("votes").exec(function(error,project)
	{
		if(!checkProjectVisAuth(req,res,project)) return
		if(!checkOwnerOnlyAuth(req,res,project)) return
		
		if(error || !project)
		{
			res.status(404).send("404 Not Found")
		}
		else
		{
			project.isPublished = true
			project.save(function(err)
			{
				if(err)
				{
					console.error(err)
					res.status(400).send("Could not save project!");
					return -1;
				}
				res.status(200).send();
			})
		}
	})
});

router.post('/:project_id/unpublish', ensureLoggedIn, function(req, res, next)
{
	// check permissions
	Project.findOne({project_id:req.params.project_id}).populate("creator").populate("votes").exec(function(error,project)
	{
		if(!checkProjectVisAuth(req,res,project)) return
		if(!checkOwnerOnlyAuth(req,res,project)) return
		
		if(error || !project)
		{
			res.status(404).send("404 Not Found")
		}
		else
		{
			project.isPublished = false
			project.save(function(err)
			{
				if(err)
				{
					console.error(err)
					res.status(400).send("Could not save project!");
					return -1;
				}
				res.status(200).send();
			})
		}
	})
});

var uuid = require("uuid")

router.post('/:project_id/comments/add', function(req, res, next)
{
	Project.findOne({project_id:req.params.project_id}).populate("creator").populate("comments").exec(function(error,project)
	{
		//if(!checkProjectVisAuth(req,res,project)) return
		//if(!checkOwnerOnlyAuth(req,res,project)) return
		
		if(error || !project)
		{
			res.status(404).send("404 Not Found")
		}
		else
		{
			if(req.body.data != "")
			{
				if(req.body.data.length < 180)
				{
					project.comments.push({
						comment_id: uuid.v4().substring(0,6),
						score: 0,
						comment: req.body.data,
						posted_at: new Date(),
						poster: req.user.db._id
					})
			
					project.save(function(err)
					{
						if(err)
						{
							console.error(err)
							res.status(400).send("Could not save project!");
							return -1;
						}
						res.status(200).send();
					})
				}
				else
				{
					res.status(403).send("Comment must be less than 403 characters")
				}
			}

		}
	})
});

router.post('/:project_id/comments/:comment_id/upvote', function(req, res, next)
{
	var isLoggedIn = (req.isAuthenticated && req.isAuthenticated())
	Project.findOne({project_id: req.params.project_id}).populate({path :"comments.poster"}).exec(function (err, project) {
			if (project && isLoggedIn)
			{
				if(!checkProjectVisAuth(req,res,project)) return
						//if(!checkOwnerOnlyAuth(req,res,project)) return
				
				function check(comment) {
					return comment.comment_id == req.params.comment_id
				}
				var comment = project.comments.findIndex(check)
				
				if(comment != -1)
				{
					project.comments[comment].score = project.comments[comment].score + 1

					project.save(function(err)
					{
						if(err)
						{
							console.error(err)
							res.status(400).send("Could not save project!");
							return -1;
						}
						res.send(project.comments[comment].score.toString());
					})
				}
			}
		}
	);
		

});

router.get('/:project_id/comments', function(req, res, next)
{
	Project.findOne({project_id:req.params.project_id}).populate({path :"comments.poster"}).exec(function(error,project)
	{
		if(!checkProjectVisAuth(req,res,project)) return
		
		if(error || !project)
		{
			res.status(404).send("{}")
			return
		}
		else
		{
			var comments = project.comments
			var sort = req.query.sort
			var amount = parseInt(req.query.amount) || 10
			var from = parseInt(req.query.from) || 0
			console.log(comments,sort,amount)
			var outdata = { }
			
			switch(sort)
			{
				case "recent":
					comments.sort(function(a,b){
						a = new Date(b.created_at);
						b = new Date(a.created_at);
						return a>b ? -1 : a<b ? 1 : 0;
					});
					
					outdata.comments = comments.slice(from,from+amount)
					
					// strip sensitive info
					for(var n in outdata.comments)
					{
						var user = outdata.comments[n].poster
						outdata.comments[n].poster = { }
						outdata.comments[n].poster = 
						{ 
							display_name: user.display_name,
							user_id: user.user_id,
							avatar: user.avatar
						}
					}
					
					
					res.send(JSON.stringify(outdata))
					return
				break;
				
				case "score":
					comments.sort(function(a,b){
						// Turn your strings into dates, and then subtract them
						// to get a value that is either negative, positive, or zero.
						return b.score - a.score
					});
					
					outdata.comments = comments.slice(from,from+amount)
					
					// strip sensitive info
					for(var n in outdata.comments)
					{
						var user = outdata.comments[n].poster
						outdata.comments[n].poster = { }
						outdata.comments[n].poster = 
						{ 
							display_name: user.display_name,
							user_id: user.user_id,
							avatar: user.avatar
						}
					}
					
					
					res.send(JSON.stringify(outdata))
					return
				break
				
				default:
					res.status(404).send("404 Not Found")
				break
			}
		}
	})

	return
});




module.exports = router;