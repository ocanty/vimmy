var express = require('express');
var router = express.Router();
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn();

var Project = require("../models/db_project")

router.get("/",function(req,res,next)
{
	var isLoggedIn = (req.isAuthenticated && req.isAuthenticated())
	res.render("discover",
	{
		title: "Vimmy :: Discover",
		loggedIn: isLoggedIn, 
		user: (!isLoggedIn ? { } : req.user.db),
	})
})

router.get('/projects', function(req, res, next)
{
	var category = req.query.category || "All"
	var sort = req.query.sort || "score"
	var amount = req.query.amount || 10 
	var from = req.query.from || 0
	
	var find_params = { isPublished: true }
	var sort_param = { }
	if(category != "All"){ find_params.category = category }
	if(sort == "recent") { sort_param = { created_at: -1 }}
	if(sort == "score") { sort_param = { num_votes: -1 }}
	if(sort == "views") { sort_param = { views: -1 }}
	
	var outdata = { }
	
	Project.find(find_params).sort(sort_param).limit(100).exec(function(err, projects) 
	{
		if(err || !projects)
		{
			console.log(err)
			res.status(404).send("{}")
			return
		}
		else
		{
			outdata.projects = projects.slice(from,from+amount)
			
			res.send(JSON.stringify(outdata))
		}
	});
	
	// Project.find().populate({path :"comments.poster"}).exec(function(error,project)
	// {
		// if(!checkProjectVisAuth(req,res,project)) return
		
		// if(error || !project)
		// {
			// res.status(404).send("{}")
			// return
		// }
		// else
		// {
			// var comments = project.comments
			// var sort = req.query.sort
			// var amount = parseInt(req.query.amount) || 10
			// var from = parseInt(req.query.from) || 0
			// console.log(comments,sort,amount)
			// var outdata = { }
			
			// switch(sort)
			// {
				// case "recent":
					// comments.sort(function(a,b){
						// a = new Date(b.created_at);
						// b = new Date(a.created_at);
						// return a>b ? -1 : a<b ? 1 : 0;
					// });
					
					// outdata.comments = comments.slice(from,from+amount)
					
					//strip sensitive info
					// for(var n in outdata.comments)
					// {
						// var user = outdata.comments[n].poster
						// outdata.comments[n].poster = { }
						// outdata.comments[n].poster = 
						// { 
							// display_name: user.display_name,
							// user_id: user.user_id,
							// avatar: user.avatar
						// }
					// }
					
					
					// res.send(JSON.stringify(outdata))
					// return
				// break;
				
				// case "score":
					// comments.sort(function(a,b){
						//Turn your strings into dates, and then subtract them
						//to get a value that is either negative, positive, or zero.
						// return b.score - a.score
					// });
					
					// outdata.comments = comments.slice(from,from+amount)
					
					//strip sensitive info
					// for(var n in outdata.comments)
					// {
						// var user = outdata.comments[n].poster
						// outdata.comments[n].poster = { }
						// outdata.comments[n].poster = 
						// { 
							// display_name: user.display_name,
							// user_id: user.user_id,
							// avatar: user.avatar
						// }
					// }
					
					
					// res.send(JSON.stringify(outdata))
					// return
				// break
				
				// default:
					// res.status(404).send("404 Not Found")
				// break
			// }
		// }
	// })

	return
});

module.exports = router