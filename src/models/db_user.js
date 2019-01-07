
let mongoose = require('mongoose')

let user_schema = new mongoose.Schema({
  // passed by auth0 passport
  auth_id: { type: String, required: true },

  user_id: { type: String, required: true, index: { unique: true } },
  email: { type: String, required: true },

  // future plan for changeable display names
  display_name: { type: String, required: true },
  account_created: { type: Date, required: true },
  avatar: { type: String, default: '/img/user-avatar.png'},
  score: { type: Number, required: true},

  // array of projects
  projects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DB_Project'
  }],

  // last lessons they visited eg. "1/2"
  recent_lessons: [{
    type: String
  }]
})

module.exports = mongoose.model('DB_User', user_schema)
