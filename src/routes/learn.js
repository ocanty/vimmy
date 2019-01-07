
let express = require('express')
let router = express.Router()
let ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn()
let fs = require('fs')
let MarkdownIt = require('markdown-it')
let md = new MarkdownIt()
let User = require('../models/db_user')

/*
  Crawl the lessons folder looking for each lesson in a group
  as *.md and *.desc.

  Builds a tree of markdown and desc 
*/
function loadLessons() {
  let dirTree = require('directory-tree')

  // get a directory tree of the lessons folder
  let lessonfiles = dirTree('./lessons/',{extensions:/\.md/})
  
  // our return tree
  let lessontable = {
    
  }
  
  // for each directory inside lessons (i.e each category e.g. 1 - The Language)
  for(let lessonblock in lessonfiles.children) {
    // new lesson group (e.g. 1 - The Language)
    lessontable[lessonblock] = {
      name: lessonfiles.children[lessonblock].name,
      lessons: { }
    }
    
    // load each lesson file with its description and markdown
    // (e.g. 1.1 - The Virtual Machine)
    for(let i in lessonfiles.children[lessonblock].children) {
      let lesson = lessonfiles.children[lessonblock].children[i]
      
      // load data and desc
      let lesson_markdown = fs.readFileSync(lesson.path,'utf8')

      // desc is filename with .md stripped and + .desc
      let lesson_desc = fs.readFileSync(lesson.path.substring(0,lesson.path.length-3) + '.desc','utf8')
      
      lessontable[lessonblock].lessons[i] = {
        title: lesson.name.substring(0,lesson.name.length-3), // strip .md
        markdown: lesson_markdown, // markdown
        desc: lesson_desc, // description

        // link to lesson, i.e /learn/1/1
        // group 1, lesson 1
        link: '/learn/' + (parseInt(lessonblock)+1) + '/' + (parseInt(i)+1) 
      }
      
      

    }
  }
  
  return lessontable
}

let lessonsTree = loadLessons()

// Gets the lesson at '/learn/x/y'
// where x is the lesson group, and y is the lesson number
// note: lesson and group numbers start from 1!
router.getLessonInfo = function(lesson_string) {
  let lessonsTree = lessonsTree || loadLessons()
  let lesson_ids = lesson_string.split('/')
  let lesson_group_id = parseInt(lesson_ids[0])
  let lesson_id = parseInt(lesson_ids[1])
  
  // get lesson group and account for starting from 1
  let lesson_group = lessonsTree[lesson_group_id-1]

  if(lesson_group) {
    let lesson = lesson_group.lessons[lesson_id-1]

    if(lesson) {
      return lesson
    }
  }

  return undefined
  
}

// GET /overview - Render overview of all lessons and lesson groups
router.get('/overview',ensureLoggedIn,function(req, res)
{
  lessonsTree = loadLessons()

  let isLoggedIn = (req.isAuthenticated && req.isAuthenticated())

  res.render('learnoverview', {
    title: 'Vimmy -  Lesson Overview',
    loggedIn: isLoggedIn,
    user: (isLoggedIn ? req.user.db : { }),
    lessonsTree: lessonsTree
  })
})

// GET /<lesson_group>/<lesson_id>/next -> Returns the next lesson in the group or returns to overview
// if the user asks for the next lesson, check if there is one in the current group or else redirect them to the overview
// TODO: fix existence of var checking, lesson sanity checking
router.get('/:lesson_group/:lesson_id/next', ensureLoggedIn, function(req, res)
{
  let lessonsTree = lessonsTree || loadLessons()
  let lesson_group = lessonsTree[req.params.lesson_group-1]
  
  if(lesson_group) { // if in valid lesson group

    // get the lesson they're at
    let lesson = lesson_group.lessons[req.params.lesson_id-1]

    if(lesson) // if it exists
    {
      // get the next possible lesson (note the lack of a -1), check if it exists
      if(lesson_group.lessons[req.params.lesson_id])
      {
        // calculate the path based off the two ids, and redirect
        let lessonpathid = req.params.lesson_group + '/' + (parseInt(req.params.lesson_id)+1)
        res.redirect('/learn/'+lessonpathid)
      }
      else // not a valid lesson (they reached the end of the group, redirect back to overview)
      {
        res.redirect('/learn/overview')
      }
    }
  }
})

// GET /<lesson_group>/<lesson_id> -> Renders lesson in group at id
// TODO: lesson sanity checking
router.get('/:lesson_group/:lesson_id', ensureLoggedIn, function(req, res)
{
  let lessonsTree = lessonsTree || loadLessons()

  let lessongroup = lessonsTree[req.params.lesson_group-1]

  if(lessongroup) {

    let lesson = lessongroup.lessons[req.params.lesson_id-1]

    // if lesson exists
    if(lesson) {      

      // add the lesson to the recent lessons list of the user
      User.findOne({user_id: req.user.db.user_id}, function(err,user)
      {
        if(err){ 
          console.log(err)
          return
        }

        if(user) {
          let lessonpath_id = req.params.lesson_group + '/' + req.params.lesson_id
          let index = user.recent_lessons.indexOf(lessonpath_id)

          if (index > -1) 
          {
            // remove existing lesson if its been there before
            user.recent_lessons.splice(index, 1)
          }
          
          
          
          user.recent_lessons.push(lessonpath_id)
          
          // save back to their profile
          user.save(function(err) {
            if(err) {
              console.error(err)
              return -1
            }
          })
        }
      })
      
      // convert the lesson to html
      let markdown = md.render(lesson.markdown)
      
      let isLoggedIn = (req.isAuthenticated && req.isAuthenticated())

      res.render('lesson', {
        title: 'Vimmy - ' + lesson.name,
        loggedIn: isLoggedIn,
        user: (isLoggedIn ? req.user.db : { }),
        lessonsTree: lessonsTree,
        markdown: markdown
      })
      
      return 
    }
  }
  
  res.status(404).send('Not Found')
})

module.exports = router