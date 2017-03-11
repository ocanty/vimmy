
var mongoose = require("mongoose")

var user_schema = new mongoose.Schema(
{
	auth_id: { type: String, required: true },
	user_id: { type: String, required: true, index: { unique: true } },
	email: { type: String, required: true },
	display_name: { type: String, required: true },
	account_created: { type: Date, required: true },
	avatar: { type: String, default: "/img/user-avatar.png"},
	score: { type: Number, required: true},
	projects: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "DB_Project"
		}
	],
	
	recent_lessons: [
		{
			type: String
		}
	]
})

module.exports = mongoose.model("DB_User",user_schema)