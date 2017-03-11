
var mongoose = require("mongoose")

var comment_schema = new mongoose.Schema({
	comment_id: {type:String, required: true},
	score: { type: Number, default: 0 },
	comment:  { type: String, required: true },
	posted_at: { type: Date, required: true } ,
	poster:  { type: mongoose.Schema.Types.ObjectId, required: true, ref: "DB_User" }
});

var project_schema = new mongoose.Schema(
{
	project_id: {type:String, unique: true, index: { unique: true } },
	name: { type:String, required: true },
	category: { type:String, required: true, default: 0},
	isPublished: { type:Boolean, required: true, default: true},
	
	creator: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "DB_User"},
	created_at: { type: Date, required: true },
	updated_at: { type: Date, required: true },
	
	vm_version: { type:Number, required: true },
	code: { type:String, required: true},
	data: { type:String, required: true },
	// we do this to make sorting easier later rather than having to access votes.length, i.e mongoose does not support check params of an array for its sorting methods
	num_votes: { type:Number, default: 0 },
	votes: 
	[
		{ type: mongoose.Schema.Types.ObjectId, required: true, ref: "DB_User"}
	],
	
	views: { type: Number, default: 0 },
	
	comments: [comment_schema]
})

module.exports = mongoose.model("DB_Project",project_schema)