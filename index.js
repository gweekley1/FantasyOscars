var express = require("express");
const bodyParser = require("body-parser"),
      fs = require("fs"),
      sha256 = require("sha256");

var app = express();
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json());
app.use(express.static("www"));

/**
 *
 */
app.post("/submit", function(req, res){

    var results = req.body;
    results.password = sha256(results.password);
    results["create_date"] = new Date();

    var file = __dirname + "/results/" + results.name + ".txt";
    if (checkPassword(results, file)) {

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


/**
 *
 */
app.get("/results", function(req, res) {
    var allSelections = [];
    fs.readdirSync(__dirname + "/results").forEach(function(file) {
        selection = JSON.parse(fs.readFileSync(__dirname + "/results/" + file, "utf-8"));
        delete selection.password;
        delete selection.create_date;

        allSelections.push(selection);
    });

    console.log(JSON.stringify(allSelections));
    res.writeHead(200, {"Content-Type": "text/html"});
    res.end(evaluateResults(allSelections));
});


/**
 *
 */
app.post("/load", function(req, res) {

    var request = req.body;
    request.password = sha256(request.password);

    console.log(request.name + ' requested');

    var file = __dirname + "/results/" + request.name + ".txt";
    if (checkPassword(request, file)) {

        selections = JSON.parse(fs.readFileSync(file, "utf-8"));

        delete selections.name;
        delete selections.password;
        delete selections.create_date;

        res.writeHead(200, {"Content-Type": "application/json"});
        res.end(JSON.stringify(selections));

    } else {
        res.writeHead(401, {"Content-Type": "text/html"});
        res.end("Incorrect password");
    }
});


/**
 *
 */
app.listen(8080, function () {
    console.log("Express app listening on 8080");
});


/**
 *
 */
function checkPassword(results, file) {
    var valid = false;

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

/**
 *
 */
function evaluateResults(allSelections) {
    const NUM_CATEGORIES = 24;
    var correctAnswers = new Array(allSelections.length);
    correctAnswers.fill(0);

    var htmlTable = "<table>"
    for (var category in winners) {
        htmlTable += "<tr> <td> " + categoryNames[category] + "</td>";
        for (var i = 0; i < allSelections.length; ++i) {
            var selection = allSelections[i];
            if (selection[category] === winners[category]) {
                correctAnswers[i] = 1 + correctAnswers[i];
                htmlTable += "<td> <b>" + selection[category] + " </b> </td>";
            } else {
                htmlTable += "<td> " + selection[category] + " </td>";
            }
        }
        htmlTable += "</tr>";
    }
    console.log(correctAnswers);
    htmlTable += "<tr><td></td>";
    for (var i = 0; i < correctAnswers.length; ++i) {
        htmlTable += "<td>" + correctAnswers[i] + "/" + NUM_CATEGORIES + "</td>";
    }
    htmlTable += "</tr></table>";
    return htmlTable;
}

/**
 *
 */
var winners = {
    picture:"",
    lactor:"",
    lactress:"",
    sactor:"",
    sactress:"",
    director:"",
    animated:"",
    anshort:"",
    ascreen:"",
    oscreen:"",
    cinem:"",
    docfeat:"",
    docshort:"",
    lashort:"",
    foreign:"",
    fedit:"",
    sedit:"",
    mixing:"",
    prod:"",
    score:"",
    song:"",
    hair:"",
    costume:"",
    vfx:"",
    name:""
}

var categoryNames = {
    picture:"Best Picture",
    lactor:"Best Lead Actor",
    lactress:"Best Lead Actress",
    sactor:"Best Supporting Actor",
    sactress:"Best Supporting Actress",
    director:"Best Directory",
    animated:"Best Animated Feature",
    anshort:"Best Animated Short",
    ascreen:"Best Adapted Screenplay",
    oscreen:"Best Original Screenplay",
    cinem:"Best Cinematography",
    docfeat:"Best Documentary Feature",
    docshort:"Best Documentary Short",
    lashort:"Best Live-Action Short",
    foreign:"Best Foreign Feature",
    fedit:"Best Editing",
    sedit:"Best Sound Editing",
    mixing:"Best Sound Mixing",
    prod:"Best Production Design",
    score:"Best Original Score",
    song:"Best Original Song",
    hair:"Best Hair and Makeup",
    costume:"Best Costume Design",
    vfx:"Best Visual Effects",
    name:"Name"
}
