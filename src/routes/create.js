let express = require('express')
let router = express.Router()
let ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn()

let User = require('../models/db_user')
let Project = require('../models/db_project')
let uuid = require('uuid')

// This router is used in app.js as /create/<these routes>

/*
  vm.js.mem and vm.data can be served from both /sandbox & /create
  e.g. /sandbox/vm.js.mem & /create/vmjs.mem

these are required by emscripten to set up initial state of the compiled vm
*/
router.get('*/vm.js.mem', function(req, res) {
  res.sendFile('vm.js.mem', {root: './public'})
})

router.get('*/vm.data', function(req, res) {
  res.sendFile('vm.data', {root: './public'})
})

// GET / -> default route -> send them to the sandbox
router.get('/', ensureLoggedIn, function(req, res) {
  res.render('sandbox', { 
    title: 'Vimmy - Sandbox',
    loggedIn: (req.isAuthenticated && req.isAuthenticated()), 
    user: req.user.db
  })
})

// GET /sandbox
router.get('/sandbox', function(req, res) {
  let isLoggedIn = (req.isAuthenticated && req.isAuthenticated())

  res.render('sandbox', { 
    title: 'Vimmy - Sandbox',
    loggedIn: isLoggedIn, 
    user: (isLoggedIn ? req.user.db : { })
  })
})

// GET /my-projects
// User must be logged in, serves a list of their projects
router.get('/my-projects', ensureLoggedIn, function(req, res) {

  // Get current user data
  User.findOne({ user_id: req.user.db.user_id })
    .populate('projects') // merge their projects
    .exec(function (err, user) 
    {
      // push two arrays of published and private projects to the template
      let regular_projects = user.projects.filter(function(doc){
        return doc.isPublished == false
      })
      
      let published_projects = user.projects.filter(function(doc){
        return doc.isPublished == true
      })

      let isLoggedIn = (req.isAuthenticated && req.isAuthenticated())
      res.render('my-projects', { 
        title: 'Vimmy - My Projects',
        loggedIn: isLoggedIn, 
        user: (isLoggedIn ? req.user.db : { }),
        regular_projects: regular_projects,
        published_projects: published_projects
      })   
    })
})

const valid_categories = [
  'General',
  'Educational',
  'Games'
]

// POST /sandbox/save -> Save a new project as a user
router.post('/sandbox/save', ensureLoggedIn, function(req, res) {
  
  // We need to now validate input

  // Check if they supplied a name
  if(req.body.name) {
    
    // Check if the name only contains letters and is less than 32 chars
    if(!/[^\w\s]/.test(req.body.name) && req.body.name.length < 32) {

      // Check if it uses a valid category
      if(valid_categories.indexOf(req.body.category) != -1) {
       
        // Data variables
        let data = req.body.data || '{ }'

        // Code
        let code = req.body.code || ' '

        // VM version, 1 at the current time
        // this is for future use in case of breaking changes
        let vm_version = 1
        
        // set creator and create project
        let creator = req.user.db.user_id
        let created_at = new Date()

        let project = new Project({
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
        project.save(function(err)  {
          if(err) {
            console.error(err)
            res.status(400).send('Could not save project!')
            return -1
          }

          // find current user data
          User.findOne({user_id: req.user.db.user_id}, function(err,user) {
            // add project to their profile
            user.projects.push(project._id)

            // Save user
            user.save(function(err) {
              if(err) {
                console.error(err)
                res.status(400).send('Could not save project!')
                return -1
              }
              
              // redirect them to the project
              res.send('/projects/' + project.project_id)
            })
          })
        }) 
      }	
      else // bad category
      {
        res.status(400).send('Invalid category')
      }
    }
    else // bad project name
    {
      res.status(400).send('Project name must be alphanumeric and must be less than 32 characters in length')
    }
  }
  else // no name supplied
  {
    res.status(400).send('Invalid name')
  }
})

module.exports = router
