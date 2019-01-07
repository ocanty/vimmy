
let express = require('express')
let router = express.Router()
let uuid = require('uuid')
let ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn()

let User = require('../models/db_user')
let Project = require('../models/db_project')

/*
  vm.js.mem and vm.data can be served from /projects
  e.g. /sandbox/vm.js.mem & /create/vmjs.mem

  these are required by emscripten to set up initial state of the compiled vm
*/
router.get('*/vm.js.mem', function(req, res) {
  res.sendFile('vm.js.mem', {root: './public'})
})

router.get('*/vm.js', function(req, res) {
  res.sendFile('vm.js', {root: './public'})
})

/*
  Check if a user is allowed to see a project

  Returns true if they are
  Returns false and sends a 403 if they aren't

  checkViewPermission
*/
function checkViewPermission(req,res,project) {
  let isLoggedIn = (req.isAuthenticated && req.isAuthenticated())

  // if the project is not publicly viewable
  if(project.isPublished == false) {

    // allow them if they're the own  r
    if(isLoggedIn && req.user.db.user_id == project.creator.user_id) {
      return true
    }
    else {
      // no permissions: disallow them
      res.status(403).send('You do not have permission to view this project')
      return false
    }
  }
  else {
    // the project is publically available -> everyone can see it
    return true
  }
}

/*
  Returns true if the user (in req) is the owner of project

  Returns false and sends a 403 if the user is not the owner
*/
function checkOwnerViewPermission(req,res,project) {
  let isLoggedIn = (req.isAuthenticated && req.isAuthenticated())

  // Are they the owner?
  if(isLoggedIn && req.user.db.user_id == project.creator.user_id) {
    return true
  }
  else { 
    // they're not, send a 403
    res.status(403).send('You do not have permission to do this action')
    return false
  }    
}

// Verifies if project/database request happened successfully
function checkValidProject(res,err,project) {
  if(!project) {
    res.status(404).send('404 Not Found')
    return false
  }

  if(err) {
    res.status(500).send('500 Internal Server Error')
    return false
  }

  return true
}

// GET /<project_id> - Returns the project view
router.get('/:project_id', function(req, res) {

  // Find project with id
  Project.findOne({ project_id: req.params.project_id })
    .populate('creator') // merge owner
    .exec(function(err,project) {

      if(!checkValidProject(res,err,project)) return
      // send them a 403 if they cant view this project
      if(!checkViewPermission(req, res, project)) return

      let isLoggedIn = (req.isAuthenticated && req.isAuthenticated())
      
      // check if they have voted so we can hide the +1 button in the future
      let hasVoted = false

      if(isLoggedIn) {
        hasVoted = project.votes.find(function(vote) {
          return vote == req.user.db._id
        })
      }
      
      // increment views and save status
      project.views = project.views + 1
      project.save(function(err) {
        if(err) {
          console.error(err)
        }
      })
      
      // send them the project page
      res.render('project', { 
        title:        'Vimmy - ' + project.name,
        loggedIn:     isLoggedIn, 
        user:         (isLoggedIn == true ? req.user.db : { }),
        project:      project,
        hasNotVoted:  !hasVoted,
        isOwner:      (isLoggedIn && req.user.db._id == project.creator._id)
      })
    })
})

// GET /<project_id>/code - returns the assembly code as base64
router.get('/:project_id/code', function(req, res) {

  Project.findOne({ project_id: req.params.project_id })
    .populate('creator')
    .exec(function(err, project) {
      if(!checkValidProject(res,err,project)) return
      if(!checkViewPermission(req, res, project)) return

      // send code as base64 to preserve tabs and spaces which
      // res.send seems to love to strip
      res.send(new Buffer(project.code).toString('base64'))
    })
})

// GET /<project_id>/data - Returns data block (defined variables for assembly)
router.get('/:project_id/data', function(req, res) {
  Project.findOne({ project_id: req.params.project_id })
    .populate('creator')
    .exec(function(err,project) {
      if(!checkValidProject(res,err,project)) return
      if(!checkViewPermission(req, res, project)) return
      
      // send them the project data block straight from the db
      res.send(project.data)
    })
})

// GET /<project_id>/edit - Serve the sandbox to edit their project
router.get('/:project_id/edit', function(req, res) {
  Project.findOne({ project_id: req.params.project_id })
    .populate('creator')
    .exec(function(err, project) {
      if(!checkValidProject(res,err,project)) return
      if(!checkOwnerViewPermission(req, res, project)) return
  
      let isLoggedIn = (req.isAuthenticated && req.isAuthenticated())

      res.render('sandbox', { 
        title: 'Vimmy -  ' + project.name,
        loggedIn: isLoggedIn, 
        user: (isLoggedIn == true ? req.user.db : { }),
        project: project,
        getProject: true,
        postUrl: '/projects/' + req.params.project_id + '/edit/save'
      })
    })
})

// POST /<project_id>/fork - Copy an existing project to your own profile
router.post('/:project_id/fork', function(req, res) {
  // Find the existing project
  Project.findOne({ project_id: req.params.project_id })
    .populate('creator')
    .exec(function(err, project) {

      if(!checkValidProject(res,err,project)) return
      if(!checkViewPermission(req,res, project)) return
      
      // if the user is signed in
      if(req.user.hasOwnProperty('db')) {
        let vm_version = 1
            
        // create duplicate with new id 
        let created_at = new Date()
        let new_project = new Project({
          project_id:   uuid.v4().substring(0,6),
          name:         project.name,
          category:     project.category,
          isPublished:  false,
          creator:      req.user.db,
          created_at:   created_at,
          updated_at:   created_at,
          vm_version:   vm_version,
          comments:     [ ],
          code:         project.code,
          data:         project.data,
          views:        0
        })
            
        // Save project
        new_project.save(function(err) {
          if(err) {
            console.error(err)
            res.status(400).send('Could not save project!')
            return -1
          }
          
          // find current logged in user
          User.findOne({user_id: req.user.db.user_id}, function(err,user){
            // Add project to creator
            user.projects.push(new_project._id)
          
            // Save user
            user.save(function(err) {
              if(err) {
                console.error(err)
                res.status(400).send('Could not save project!')
                return -1
              }
              
              // send them the project
              res.send('/projects/' + project.project_id)
            })
          })
        }) 
      }
    })
})


// POST /<project_id>/edit/save - Update the code/data of an existing project
router.post('/:project_id/edit/save', function(req, res) {
  Project.findOne({ project_id: req.params.project_id })
    .populate('creator')
    .exec(function(error,project) {
      if(!checkValidProject(res,err,project)) return
      if(!checkOwnerViewPermission(req,res,project)) return

      // set data and code 
      project.data = req.body.data || '{ }'
      project.code = req.body.code || '{ }'

      project.updated_at = new Date()
      
      
      // Save project
      project.save(function(err) {
        if(err) {
          console.error(err)
          res.status(400).send('Could not save project!')
          return -1
        }
        
        // redirect them to project
        res.send('/projects/' + project.project_id)
      }) 
    })
})

// GET /<project_id>/run - Render the sandbox with their project loaded
router.get('/:project_id/run', function(req, res) {
  Project.findOne({ project_id:req.params.project_id })
    .populate('creator')
    .exec(function(error,project) {
      if(!checkValidProject(res,err,project)) return

      // if the project is not publicly available, check if they have permission to see it
      if(project.isPublished == false) { 
        if(!checkOwnerViewPermission(req,res,project)) return
      }
      
      let isLoggedIn = (req.isAuthenticated && req.isAuthenticated())
      res.render('sandbox', { 
        title: 'Vimmy -  ' + project.name,
        loggedIn: isLoggedIn, 
        user: (isLoggedIn == true ? req.user.db : { }),
        project: project,
        getProject: true,
        runMode: true,
        isOwner: (req.user.db.user_id == project.creator.user_id ? true : false)
      })
    
    })
})

// POST /<project_id>/upvote - Upvote a project
router.post('/:project_id/upvote', ensureLoggedIn, function(req, res) {
  Project.findOne({ project_id: req.params.project_id })
    .populate('creator')
    .exec(function(err,project) {
      if(!checkValidProject(res,err,project)) return
      if(!checkViewPermission(req,res,project)) return

      // check if they have voted or not before
      let hasVoted = project.votes.find(function(vote) {
        return vote == req.user.db._id
      })
      
      if(!hasVoted) {
        // Increase project owners score if the person upvoting is not themselves
        if(project.creator._id != req.user.db._id) {
          User.findOne({ user_id: project.creator.user_id })
            .exec(function(err,user) {
              if(err) {
                console.error(err)
                return
              }

              if(!usr) return

              user.score = user.score + 1
          
              // Save user
              user.save(function(err) {
                if(err) {
                  console.error(err)
                  res.status(400).send('Could not save project!')
                  return
                }
              })
            })
        }
        
        project.num_votes = project.num_votes + 1
        project.votes.push(req.user.db._id)
        project.save(function(err) {
          if(err) {
            console.error(err)
            res.status(400).send('Could not save project!')
            return -1
          }

        })
      }
      
      // send them the new count (it doesnt matter if it succeeded or not, just lie)
      res.status(200).send(project.votes + 1)
    })
})

// POST /<project_id>/delete - Delete project
router.post('/:project_id/delete', function(req, res)
{
  Project.findOne({ project_id: req.params.project_id })
    .populate('creator')
    .exec(function(err,project) {
      if(!checkValidProject(res,err,project)) return
      if(!checkViewPermission(req,res,project)) return
      if(!checkOwnerViewPermission(req,res,project)) return
      
      project.remove(function (err) {
        res.redirect('/create/my-projects')
      })
    })
})

// POST /<project_id>/publish - Publish project
router.post('/:project_id/publish', ensureLoggedIn, function(req, res) {

  Project.findOne({ project_id: req.params.project_id })
  .populate('creator')
  .populate('votes')
  .exec(function(err,project) {
    if(!checkValidProject(res,err,project)) return
    if(!checkOwnerViewPermission(req,res,project)) return
    
      // Set published flag
      project.isPublished = true
      project.save(function(err) {
        if(err) {
          console.error(err)
          res.status(400).send('Could not save project!')
          return
        }

        res.status(200).send()
      })
    })
})

// POST /<project_id>/unpublish - Unublish project
router.post('/:project_id/unpublish', ensureLoggedIn, function(req, res) {

  Project.findOne({ project_id: req.params.project_id })
  .populate('creator')
  .populate('votes')
  .exec(function(err,project) {
    if(!checkValidProject(res,err,project)) return
    if(!checkOwnerViewPermission(req,res,project)) return
    
      // Set published flag
      project.isPublished = false
      project.save(function(err) {
        if(err) {
          console.error(err)
          res.status(400).send('Could not save project!')
          return
        }

        res.status(200).send()
      })
    })
})

// POST /<project_id>/comments/add - Add comment
router.post('/:project_id/comments/add', function(req, res)
{
  Project.findOne({ project_id: req.params.project_id })
  .populate('creator')
  .populate('comments')
  .exec(function(error,project) {
    // check if they are allowed comment
    if(!checkValidProject(res,err,project)) return
    if(!checkViewPermission(req,res,project)) return
    //if(!checkOwnerViewPermission(req,res,project)) return
    
    // sanitize comment
    if(req.body.data != '') {
      if(req.body.data.length < 180) {
        project.comments.push({
          comment_id:   uuid.v4().substring(0,6),
          score:        0,
          comment:      req.body.data,
          posted_at:    new Date(),
          poster:       req.user.db._id
        })
    
        project.save(function(err) {
          if(err) {
            console.error(err)
            res.status(400).send('Could not save project!')
            return
          }

          res.status(200).send()
        })
      }
      else
      {
        res.status(403).send('Comment must be less than 180 characters')
      }
    }
    })
})

// POST /<project_id>/comments/<comment_id>/upvote - Upvote a comment
router.post('/:project_id/comments/:comment_id/upvote', function(req, res) {
  let isLoggedIn = (req.isAuthenticated && req.isAuthenticated())

  Project.findOne({ project_id: req.params.project_id })
    .populate({ path : 'comments.poster' })
    .exec(function (err, project) {
      if(!checkValidProject(res,err,project)) {
        return
      }

      if (project && isLoggedIn) {
        // comment score upvote
        if(!checkViewPermission(req,res,project)) return
            //if(!checkOwnerViewPermission(req,res,project)) return
        
        function check(comment) {
          return comment.comment_id == req.params.comment_id
        }
        let comment = project.comments.findIndex(check)
        
        if(comment != -1)
        {
          project.comments[comment].score = project.comments[comment].score + 1

          project.save(function(err)
          {
            if(err)
            {
              console.error(err)
              res.status(400).send('Could not upvote comment!')
              return -1
            }
            res.send(project.comments[comment].score.toString())
          })
        }
      }
    }
  )
    

})

// GET /<project_id>/comments - Get comments for a project (as JSON)
// arguments:
//   amount - amount requested
//   from - what page
//   query - 'recent', 'score'
router.get('/:project_id/comments', function(req, res) {
  Project.findOne({ project_id: req.params.project_id })
    // populate with poster ids
    .populate({ path :'comments.poster' })
    .exec(function(error,project) {

      if(!checkViewPermission(req,res,project)) return
      
      if(error || !project) {
        res.status(404).send('{}')
        return
      }
      else {
        let comments = project.comments
        let sort     = req.query.sort
        let amount   = parseInt(req.query.amount) || 10
        let from     = parseInt(req.query.from) || 0

        // console.log(comments,sort,amount)
        let outdata = { }
        
        switch(sort) {
        case 'recent':
          // sort comments by date created
          comments.sort(function(a,b) {
            a = new Date(b.created_at)
            b = new Date(a.created_at)
            return a>b ? -1 : a<b ? 1 : 0
          })
            
          break
          
        case 'score':
          // sort by vote hiscore
          comments.sort(function(a,b){
            // Turn your strings into dates, and then subtract them
            // to get a value that is either negative, positive, or zero.
            return b.score - a.score
          })
          
          break
          
        default:
          res.status(404).send('404 Not Found')
          return
        }

        // strip sensitive info, only giving display names, user ids & avatars
        for(let n in outdata.comments) {
          let user = outdata.comments[n].poster
          outdata.comments[n].poster = { }
          outdata.comments[n].poster = { 
            display_name: user.display_name,
            user_id: user.user_id,
            avatar: user.avatar
          }
        }

        // pagify
        outdata.comments = comments.slice(from,from+amount)
        res.send(JSON.stringify(outdata))
      }
    })

  return
})

module.exports = router