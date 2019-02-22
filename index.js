var express = require("express");
const bodyParser = require("body-parser"),
      fs = require("fs"),
      sha256 = require("sha256");

var app = express();
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json());
app.use(express.static("www"));

/**
 * Submit user selections. Saves the results to __dirname/results/<name>.txt
 */
app.post("/submit", function(req, res){

    var results = req.body;
    results.password = sha256(results.password);
    results["create_date"] = new Date();

    var cutoffTime = new Date('2019-02-25T01:05:00Z');
    var currentTime = new Date();

    // Only accept the submission if the cutoff time hasn't been reached or this
    // submission is an update to the winners
    if (currentTime.getTime() <= cutoffTime.getTime() || results.name === "winners") {
        var file = __dirname + "/results/" + results.name + ".txt";
        // Assert that user is new or has the correct password
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
    } else {
        res.writeHead(410, {"Content-Type": "text/html"});
        res.end("Missed cutoff time");
    }
});


/**
 * Evaluate every user selection and build an HTML table to return as a response
 * See 'functon evaluateResults' for more information on the table and its generation
 */
app.get("/results", function(req, res) {
    var allSelections = [];
    // Build a JSONArray of every user selection
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
 * Validate that the request's username and passord are correct. and if so
 * return their selections as JSON. Otherwise, return an error
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
 * Begin listening on port 8080. Nginx will map 80 to this port
 */
app.listen(8080, function () {
    console.log("Express app listening on 8080");
});


/**
 * Check whether or not the submitted results are for a new user or have the correct password
 *
 * results: JSON of the selections, includes a name and Password
 * file: the path to the saved selection file, which may not exist
 * return: true if this is a new or validated user, false otherwise
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
 * Procedurally generates an HTML table of every user's selections and the winners,
 * indicating which selections were correct and what fraction they got right.
 *
 * allSelections: JSON array of every user's selections
 * returns: the HTML table as a String
 */
function evaluateResults(allSelections) {
    const NUM_CATEGORIES = 24;
    var correctAnswers = new Array(allSelections.length);
    correctAnswers.fill(0);

    // Load the winners, which are stored as a user submission
    var file = __dirname + "/results/winners.txt";
    var winners = JSON.parse(fs.readFileSync(file, "utf-8"));

    delete winners.name;
    delete winners.password;
    delete winners.create_date;

    // Begin building the HTML table
    var htmlTable = "<!DOCTYPE html><html><head><style>table,th,td{border:1px solid black;border-collapse:collapse}</style></head>"
    htmlTable += "<body><table><tr><td></td>";

    // Add the name row
    for (var i = 0; i < allSelections.length; ++i) {
        var selection = allSelections[i];

        htmlTable += "<td>" + selection.name + "</td>";

    }
    htmlTable += "</tr>";

    // Walk through every category, building a row for each of them
    for (var category in winners) {
        htmlTable += "<tr> <td> " + categoryNames[category] + "</td>";
        // Walk through every user's selection in this category
        for (var i = 0; i < allSelections.length; ++i) {
            var selection = allSelections[i];
            delete selection.name;

            // If the user answered correctly, bold the table cell and increment their correctAnswer counter
            if (selection[category] === winners[category]) {
                correctAnswers[i] = 1 + correctAnswers[i];
                htmlTable += "<td> <b>" + nomineeNames[selection[category]] + " </b> </td>";

            } else {
                htmlTable += "<td> " + nomineeNames[selection[category]] + " </td>";
            }

        }
        htmlTable += "</tr>";
    }

    console.log(correctAnswers);
    // Add the Number Correct row
    htmlTable += "<tr><td></td>";
    for (var i = 0; i < correctAnswers.length; ++i) {
        htmlTable += "<td>" + correctAnswers[i] + "/" + NUM_CATEGORIES + "</td>";
    }
    htmlTable += "</tr></table></body>";
    return htmlTable;
}


/**
 *  JSON mapping the parameter names to their full category names
 */
const categoryNames = {
    picture:"Best Picture",
    lactor:"Best Lead Actor",
    lactress:"Best Lead Actress",
    sactor:"Best Supporting Actor",
    sactress:"Best Supporting Actress",
    director:"Best Director",
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

/**
 * JSON mapping the HTML selection values to the names of the Nominee
 */
const nomineeNames = {
    picture0: "Black Panther",
    picture1: "BlacKkKlansman",
    picture2: "Bohemian Rhapsody",
    picture3: "The Favourite",
    picture4: "Green Book",
    picture5: "Roma",
    picture6: "A Star Is Born",
    picture7: "Vice",
    lactor0: 'Christian Bale (Vice)',
    lactor1: 'Bradley Cooper (A Star Is Born)',
    lactor2: "Willem Dafoe (At Eternity's Gate)",
    lactor3: 'Rami Malek (Bohemian Rhapsody)',
    lactor4: 'Viggo Mortensen (Green Book)',
    lactress0: 'Yalitza Aparicio (Roma)',
    lactress1: 'Glenn Close (The Wife)',
    lactress2: 'Olivia Colman (The Favourite)',
    lactress3: 'Lady Gaga (A Star Is Born)',
    lactress4: 'Melissa McCarthy (Can You Ever Forgive Me?)',
    sactor0: 'Mahershala Ali (Green Book)',
    sactor1: 'Adam Driver (BlacKkKlansman)',
    sactor2: 'Sam Elliott (A Star Is Born)',
    sactor3: 'Richard E. Grant (Can You Ever Forgive Me?)',
    sactor4: 'Sam Rockwell (Vice)',
    sactress0: 'Amy Adams (Vice)',
    sactress1: 'Marina de Tavira (Roma)',
    sactress2: 'Regina King (If Beale Street Could Talk)',
    sactress3: 'Emma Stone (The Favourite)',
    sactress4: 'Rachel Weisz (The Favourite)',
    director0: 'Alfonso Cuaron (Roma)',
    director1: 'Yorgos Lanthimos (The Favourite)',
    director2: 'Spike Lee (BlacKkKlansman)',
    director3: 'Adam McKay (Vice)',
    director4: 'Pawel Pawlikowski (Cold War)',
    animated0: 'Incredibles 2',
    animated1: 'Isle of Dogs',
    animated2: 'Mirai',
    animated3: 'Ralph Breaks the Internet',
    animated4: 'Spider-Man: Into the Spider-Verse',
    anshort0: 'Animal Behaviour',
    anshort1: 'Bao',
    anshort2: 'Late Afternoon',
    anshort3: 'One Small Step',
    anshort4: 'Weekends',
    ascreen0: 'A Star Is Born (Eric Roth, Will Fetters & Bradley Cooper)',
    ascreen1: 'The Ballad of Buster Scruggs (Joel Coen & Ethan Coen)',
    ascreen2: "BlacKkKlansman (Charlie Wachtel & David Rabinowitz and Kevin Willmott & Spike Lee)",
    ascreen3: 'If Beale Street Could Talk (Barry Jenkins)',
    ascreen4: 'Can You Ever Forgive Me? (Nicole Holofcener and Jeff Whitty)',
    oscreen0: 'The Favourite (Deborah Davis and Tony McNamara)',
    oscreen1: 'First Reformed (Paul Schrader)',
    oscreen2: 'Green Book (Nick Vallelonga & Brian Hayes Currie & Peter Farrelly)',
    oscreen3: 'Roma (Alfonso Cuaron)',
    oscreen4: 'Vice (Adam McKay)',
    cinem0: 'The Favourite (Robbie Ryan)',
    cinem1: 'Never Look Away (Caleb Deschanel)',
    cinem2: 'Roma (Alfonso Cuaron',
    cinem3: 'A Star Is Born (Matty Libatique)',
    cinem4: 'Cold War (Lukasz Zal)',
    docfeat0: 'Free Solo (Elizabeth Chai Vasarhelyi, Jimmy Chin, Evan Hayes and Shannon Dill)',
    docfeat1: 'Hale County This Morning, This Evening (RaMell Ross, Joslyn Barnes and Su Kim)',
    docfeat2: 'Minding the Gap (Bing Liu and Diane Quon)',
    docfeat3: 'Of Fathers and Sons (Talal Derki, Ansgar Frerich, Eva Kemme and Tobias N. Siebert)',
    docfeat4: 'RBG (Betsy West and Julie Cohen)',
    docshort0: 'Black Sheep (Ed Perkins and Jonathan Chinn)',
    docshort1: 'End Game (Rob Epstein and Jeffrey Friedman)',
    docshort2: 'Lifeboat (Skye Fitzgerald and Bryn Mooser)',
    docshort3: 'A Night at the Garden (Marshall Curry)',
    docshort4: 'Period. End of Sentence. (Rayka Zehtabchi and Melissa Berton)',
    lashort0: 'Detainment (Vincent Lambe and Darren Maho)',
    lashort1: 'Fauve (Jeremy Comte and Maria Gracia Turgeon)',
    lashort2: 'Marguerite (Marianne Farley and Marie-Helene Panisset)',
    lashort3: 'Mother (Rodrigo Sorogoyen and María del Puy Alvarado)',
    lashort4: 'Skin (Guy Nattiv and Jaime Ray Newman)',
    foreign0: 'Capernaum (Lebanon)',
    foreign1: 'Cold War (Poland)',
    foreign2: 'Never Look Away (Germany)',
    foreign3: 'Roma (Mexico)',
    foreign4: 'Shoplifters (Japan)',
    fedit0: 'BlacKkKlansman (Barry Alexander Brown)',
    fedit1: 'Bohemian Rhapsody (John Ottman)',
    fedit2: 'The Favourite (Yorgos Mavropsaridis)',
    fedit3: 'Green Book (Patrick J. Don Vito)',
    fedit4: 'Vice (Hank Corwin)',
    sedit0: 'Black Panther (Benjamin A. Burtt and Steve Boeddeker)',
    sedit1: 'Bohemian Rhapsody (John Warhurst and Nina Hartstone)',
    sedit2: 'First Man (Ai-Ling Lee and Mildred Iatrou Morgan)',
    sedit3: 'A Quiet Place (Ethan Van der Ryn and Erik Aadahl)',
    sedit4: 'Roma (Sergio Diaz and Skip Lievsay)',
    mixing0: 'Black Panther (Steve Boeddeker, Brandon Proctor and Peter Devlin)',
    mixing1: 'Bohemian Rhapsody (Paul Massey, Tim Cavagin and John Casali)',
    mixing2: 'First Man (Jon Taylor, Frank A. Montaño, Ai-Ling Lee and Mary H. Ellis)',
    mixing3: 'Roma (Skip Lievsay, Craig Henighan and Jose Antonio Garcia)',
    mixing4: 'A Star Is Born (Tom Ozanich, Dean Zupancic, Jason Ruder and Steve Morrow)',
    prod0: 'Black Panther (Hannah Beachler and Jay Hart)',
    prod1: 'The Favourite (Fiona Crombie and Alice Felton)',
    prod2: 'First Man (Nathan Crowley and Kathy Lucas)',
    prod3: 'Mary Poppins Returns (John Myhre and Gordon Sim)',
    prod4: 'Roma (Eugenio Caballero and Barbara Enriquez)',
    score0: 'Black Panther (Ludwig Goransson)',
    score1: 'BlacKkKlansman (Terence Blanchard)',
    score2: 'If Beale Street Could Talk (Nicholas Britell)',
    score3: 'Isle of Dogs (Alexandre Desplat)',
    score4: 'Mary Poppins Returns (Marc Shaiman)',
    song0: '"All the Stars" (Black Panther)',
    song1: '"I\'ll Fight" (RBG)',
    song2: '"The Place Where Lost Things Go" (Mary Poppins Returns)',
    song3: '"Shallow" (A Star Is Born)',
    song4: '"When a Cowboy Trades His Spurs for Wings" (The Ballad of Buster Scruggs)',
    hair0: 'Border (Goran Lundstrom and Pamela Goldammer)',
    hair1: 'Mary Queen of Scots (Jenny Shircore, Marc Pilcher and Jessica Brooks)',
    hair2: 'Vice (Greg Cannom, Kate Biscoe and Patricia DeHaney)',
    costume0: 'The Ballad of Buster Scruggs (Mary Zophres)',
    costume1: 'Black Panther (Ruth E. Carter)',
    costume2: 'The Favourite (Sandy Powell)',
    costume3: 'Mary Poppins Returns (Sandy Powell)',
    costume4: 'Mary Queen of Scots (Alexandra Byrne)',
    vfx0: 'Avengers: Infinity War (Dan DeLeeuw, Kelly Port, Russell Earl and Dan Sudick)',
    vfx1: 'Christopher Robin (Christopher Lawrence, Michael Eames, Theo Jones and Chris Corbould)',
    vfx2: 'First Man (Paul Lambert, Ian Hunter, Tristan Myles and J.D. Schwalm)',
    vfx3: 'Ready Player One (Roger Guyett, Grady Cofer, Matthew E. Butler and David Shirk)',
    vfx4: 'Solo: A Star Wars Story (Rob Bredow, Patrick Tubach, Neal Scanlan and Dominic Tuohy)'
}
