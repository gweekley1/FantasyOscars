var express = require("express");
const bodyParser = require("body-parser"),
      fs = require("fs");

var app = express();
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json());
app.use(express.static("www"));

app.post("/submit", function(req, res){

    var file = __dirname + "/results/" + req.body.name + ".txt";
    fs.writeFile(file, JSON.stringify(req.body), function(err){
      if (err) {
        console.log("Failed to save " + req.body.name + ".txt");
      } else {
        console.log("Saved " + req.body.name + ".txt successfully");
      }
    });

    res.writeHead(200, {"Content-Type": "text/html"});
    res.end("Thank you, come again");
});

app.get("/results", function(req, res) {
    fs.readdir(__dirname + "/results", function(err, files) {
        if (err) {
            console.log(err);
        } else {
            files.forEach(function((file) {
                fs.readFile(__dirname + "/results/" + file, function(err, content) {
                    if (err) {
                        console.log(err);
                    } else {
                        
                    }
                })
            });
        }
    });
});

app.listen(8080, function () {

    console.log("Express app listening on 8080");

});
