
var express = require("express")
var router = express.Router()
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn();
var fs = require("fs")
var MarkdownIt = require('markdown-it')
var md = new MarkdownIt();
var User = require("../models/db_user")

function loadLessons()
{
	var dirTree = require('directory-tree');
	var lessonfiles = dirTree('./lessons/',[".md"]);
	
	var lessontable = {
		
	}
	
	for(var lessonblock in lessonfiles.children)
	{
		// new lesson group
		lessontable[lessonblock] = {
			name: lessonfiles.children[lessonblock].name,
			lessons: {
				
			}
		}
		
		// load each lesson file with its description and markdown
		for(var i in lessonfiles.children[lessonblock].children)
		{
			
			
			var lesson = lessonfiles.children[lessonblock].children[i]
			
			// load data and desc
			var lesson_markdown = fs.readFileSync(lesson.path,"utf8")
			var lesson_desc = fs.readFileSync(lesson.path.substring(0,lesson.path.length-3) + ".desc","utf8")
			
			
 			lessontable[lessonblock].lessons[i] = {
				title: lesson.name.substring(0,lesson.name.length-3),
				markdown: lesson_markdown,
				desc: lesson_desc,
				link: "/learn/" + (parseInt(lessonblock)+1) + "/" + (parseInt(i)+1)
			}
			
			

		}
	}
	
	return lessontable
}

var lessonsTree = undefined

router.getLessonInfo = function(lesson_string)
{
	var lessonsTree = lessonsTree || loadLessons()
	var lessonids = lesson_string.split("/")
	var lessongroup = parseInt(lessonids[0])
	var lessonid = parseInt(lessonids[1])
	
	var lessongroup = lessonsTree[lessongroup-1]
	if(lessongroup)
	{
		var lesson = lessongroup.lessons[lessonid-1]
		if(lesson)
		{
			return lesson
		}
	}
	
}

router.get("/overview",ensureLoggedIn,function(req,res,next)
{
	lessonsTree = loadLessons()
	console.log(lessonsTree)
	
	var isLoggedIn = (req.isAuthenticated && req.isAuthenticated())
	res.render("learnoverview",
	{
		title: "Vimmy :: Lesson Overview",
		loggedIn: isLoggedIn,
		user: (isLoggedIn ? req.user.db : { }),
		lessonsTree: lessonsTree
	})
})

router.get("/:lessongroup/:lessonid/next", ensureLoggedIn, function(req,res,next)
{
	lessonsTree = loadLessons()
	
	var lessongroup = lessonsTree[req.params.lessongroup-1]
	if(lessongroup)
	{
		var lesson = lessongroup.lessons[req.params.lessonid-1]
		if(lesson)
		{
			var possible_next_sub_lesson = lessongroup.lessons[req.params.lessonid]
			if(possible_next_sub_lesson)
			{
				var lessonpathid = req.params.lessongroup + "/" + (parseInt(req.params.lessonid)+1)
				res.redirect("/learn/"+lessonpathid)
			}
			else
			{
				res.redirect("/learn/overview")
			}
		}
	}
})

router.get("/:lessongroup/:lessonid", ensureLoggedIn, function(req,res,next)
{
	lessonsTree = loadLessons()
	//console.log(lessonsTree)
	var lessongroup = lessonsTree[req.params.lessongroup-1]

	if(lessongroup)
	{
		var lesson = lessongroup.lessons[req.params.lessonid-1]
		if(lesson)
		{
			// remove existing lesson if its been there before
			// eg. 1/1
			
			User.findOne({user_id: req.user.db.user_id}, function(err,user)
				{
					if(user)
					{
						console.log(user)
						var lessonpathid = req.params.lessongroup + "/" + req.params.lessonid
						var index = user.recent_lessons.indexOf(lessonpathid);

						if (index > -1) 
						{
							// remove existing lesson if its been there before
							user.recent_lessons.splice(index, 1);
						}
						
						
						
						user.recent_lessons.push(lessonpathid)
						
						user.save(function(err)
						{
							if(err)
							{
								console.error(err)
								return -1;
							}
						})
					}
				})
			

			var markdown = md.render(lesson.markdown)
			
			var isLoggedIn = (req.isAuthenticated && req.isAuthenticated())
			res.render("lesson",
			{
				title: "Vimmy :: Lesson Overview",
				loggedIn: isLoggedIn,
				user: (isLoggedIn ? req.user.db : { }),
				lessonsTree: lessonsTree,
				markdown: markdown
			})
			
			return 
		}
	}
	
	res.status(404).send("Not Found")
})

module.exports = router