var express = require("express");
const bodyParser = require("body-parser"),
      fs = require("fs"),
      sha256 = require("sha256");

var app = express();
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json());
app.use(express.static("www"));

app.post("/submit", function(req, res){

    var results = req.body;
    results.password = sha256(results.password);
    results["create_date"] = new Date();

    var file = __dirname + "/results/" + results.name + ".txt";
    if (checkPassword(results)) {

        fs.writeFile(file, JSON.stringify(results), function(err){
          if (err) {
            console.log("Failed to save " + results.name + ".txt");
          } else {
            console.log("Saved " + results.name + ".txt successfully");
          }
        });

        res.writeHead(200, {"Content-Type": "text/html"});
        res.end("Thank you, come again");

    } else {
        res.writeHead(401, {"Content-Type": "text/html"});
        res.end("Incorrect password");
    }
});

app.get("/results", function(req, res) {
    var results = "";
    fs.readdirSync(__dirname + "/results").forEach(function(file) {
        result = JSON.parse(fs.readFileSync(__dirname + "/results/" + file, "utf-8"));
        delete result.password;

        results += JSON.stringify(result) + "</br></br>";
    });

    console.log(results);
    res.writeHead(200, {"Content-Type": "text/html"});
    res.end(results);
});

app.listen(8080, function () {

    console.log("Express app listening on 8080");

});

/**
 *
 */
function checkPassword(results) {
    var valid = false;
    var file = __dirname + "/results/" + results.name + ".txt";

    if(fs.existsSync(file)) {
        console.log(results.name + ".txt already exists");

        var content = fs.readFileSync(file, "utf-8");
        content = JSON.parse(content);
        console.log("   Stored password is " + content.password);
        console.log("Submitted password is " + results.password);
        valid = results.password === content.password;

    } else {
        valid = true;
    }

    return valid;
}
