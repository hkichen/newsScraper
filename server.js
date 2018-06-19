// Dependencies
const express = require("express");
const bodyParser = require("body-parser");
const logger = require("morgan");
const mongoose = require("mongoose");
const exphbs = require("express-handlebars");

const Note = require("./models/Note.js");
const Article = require("./models/Article.js");
const request = require("request");
const cheerio = require("cheerio");
mongoose.Promise = Promise;
const app = express();


// Use morgan and body parser
app.use(logger("dev"));
app.use(bodyParser.urlencoded({
	extended: false
}));

//use handlebars
app.engine("handlebars", exphbs({defaultLayout: "main"}));
app.set("view engine", "handlebars");

// Make public a static dir
app.use(express.static("public"));

//Database configuration w/ mongoose
mongoose.connect("mongodb://heroku_tz3dfgll:rjqmctu68501ou7m5ia56n0ve1@ds261460.mlab.com:61460/heroku_tz3dfgll");
var db = mongoose.connection;

// Show any mongoose errors
db.on("error", function(error) {
	console.log("Mongoose Error: ", error);
});

// Once logged in to the db through mongoose, log a success message
db.once("open", function() {
	console.log("Mongoose connection successful.");
});

// Routes
// get main page 
app.get("/", function(req, res) {
  Article.find({}, function(error, data) {
    if (error) {
      console.log(error);
    }
    else {
      res.render("index", {articles: data});
    }
  });
});

app.get("/scrape", function(req, res) {
	// First, we grab the body of the html with request
	request("https://medium.com/topic/technology", function(error, response, html) {
		// Then, we load that into cheerio and save it to $ for a shorthand selector
		var $ = cheerio.load(html);
		$("article h3").each(function(i, element) {
      var result = {};
      console.log(result)
			result.title = $(this).children("a").text();
			result.link = $(this).children("a").attr("href");

      var session = new Article(result);
      //saving session to database
			session.save(function(err, data) {
				// Log any errors
				if (err) {
					console.log(err);
				}
				// Or log the data
				else {
					console.log(data);
				}
			});
		});
  });
  //redirect after done scraping to main page
	res.redirect("/");
});

//get articles from db
app.get("/articles", function(req, res) {
	Article.find({}, function(error, data) {
		if (error) {
			console.log(error);
		}
		else {
			res.json(data);
		}
	});
});

//get article by ID
app.get("/articles/:id", function(req, res) {
	Article.findOne({ "_id": req.params.id })
	.populate("note")
	.then(function(error, data) {
		if (error) {
			console.log(error);
		}
		else {
			res.json(data);
		}
	});
});

// Create a new note or replace an existing note
app.post("/articles/:id", function(req, res) {
  var newNote = new Note(req.body);
  //save not to db
	newNote.save(function(error, data) {
		if (error) {
			console.log(error);
		}
		else {
			// Use the article id to find and update it's note
			Article.findOneAndUpdate({ "_id": req.params.id }, { "note": data._id })
			.then(function(err, data) {
				if (err) {
					console.log(err);
				}
				else {
					res.send(data);
				}
			});
		}
	});
});

// Listen on port 3000
app.listen(process.env.PORT || 3000, function() {
	console.log("App running on port 3000.");
});