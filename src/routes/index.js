let express = require('express')
let router = express.Router()

let User = require('../models/db_user')

// we import learn to get lesson info/the lesson tree
let learn = require('./learn') 

// GET / -> serve the home page
router.get('/', function(req, res, next) {

  // isAuthenticated is added by passport,
  // first check if it exists and then call it to get authentication status
  let isLoggedIn = (req.isAuthenticated && req.isAuthenticated())

  // supply lesson + creation info for the title bar
  if(isLoggedIn)
  {
    // Request the user info using their populated userid
    User.findOne({ user_id: req.user.db.user_id })
      .populate('projects') // join in their projects
      .exec(function (err, user) {
        
        // if a valid user
        // supply recent lessons and projects to the dashboard render
        if(user) {  
          let lesson_info = { }

          // only show the projects they havent published in the home dashboard
          var regular_projects = user.projects.filter(function(doc){
            return doc.isPublished == false
          })
          
          let count = 0

          // for each lesson they have recently touched
          for(let key in user.recent_lessons)
          {
            // fix up into the template format
            if(typeof user.recent_lessons[key] == 'string' && key != '_path')
            {
              lesson_info[key] = learn.getLessonInfo(user.recent_lessons[key]) || undefined
              count = key
            } 
          }

          // console.log(lesson_info)
          res.render('dashboard', { 
            title: 'Vimmy - Dashboard',
            loggedIn: true, 
            user: req.user.db,
            lesson_info: lesson_info,
            lesson_info_largest_n: count,
            creation_info: regular_projects
          })
        }
      }) 
  }
  else // if they arent signed in render the homepage, which encourages them to sign up
  {
    res.render('homepage', { 
      title: 'Vimmy - Home',
      loggedIn: false, 
      user: { }
    })
  }    

  next()
})

module.exports = router
