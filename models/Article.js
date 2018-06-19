var mongoose = require("mongoose");
var Schema = mongoose.Schema;

// Create article schema
var ArticleSchema = new Schema({
	title: {
		type: String,
		require: true
	},
	link: {
		type: String,
		require: true
	},
	// association to a note by it's id
	note: {
		type: Schema.Types.ObjectId,
		ref: "Note"
	}
});

var Article = mongoose.model("Article", ArticleSchema);

// Export the model
module.exports = Article;