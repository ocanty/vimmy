let express = require('express');
let router = express.Router();

let Project = require('../models/db_project')

// This router is used in app.js as /discover

// GET / -> serve the discover search dashboard
router.get('/',function(req,res) {
  let isLoggedIn = (req.isAuthenticated && req.isAuthenticated())

  res.render('discover', {
    title: 'Vimmy - Discover',
    loggedIn: isLoggedIn, 
    user: (!isLoggedIn ? { } : req.user.db),
  })
})

// GET /projects -> search parameters passed in query
router.get('/projects', function(req, res) {
  
  // if they supplied a category use that or search every category
  let category = req.query.category || 'All'

  // sort by their requested sort or by score
  let sort = req.query.sort || 'score'

  // give them how many they want or 10
  let amount = req.query.amount || 10 

  // start from their page or 0
  let from = req.query.from || 0
  
  // only search published projects
  let find_params = { isPublished: true }

  // set up mongoose search 
  let sort_param = { }
  if(category != 'All') { find_params.category = category }
  if(sort == 'recent')  { sort_param = { created_at: -1 }}
  if(sort == 'score')   { sort_param = { num_votes: -1 }}
  if(sort == 'views')   { sort_param = { views: -1 }}
  
  // now find their project
  Project.find(find_params)
    .sort(sort_param)
    .limit(100)
    .exec(function(err, projects) {
      if(err || !projects) {
        console.log(err)
        res.status(404).send('{}')
        return
      }

      let out = { }
      out.projects = projects.slice(from,from+amount)
      res.send(JSON.stringify(out))
    })
})

module.exports = router