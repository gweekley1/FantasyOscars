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

    // The server in AWS runs in UTC
    var cutoffTime = new Date(Date.parse('2021-04-25T18:45:00-0500'));
    var currentTime = new Date();

    // Only accept the submission if the cutoff time hasn't been reached or this
    // submission is an update to the winners
    if (currentTime.getTime() <= cutoffTime.getTime() || results.name === "winners") {
        
        if (!results.name) {
            res.writeHead(410, {"Content-Type": "text/html"});
            res.end("You need a name ya dingus");
        }
    
        
        var file = __dirname + "/results/" + results.name + ".txt";
        // Assert that user is new or has the correct password
        if (checkPassword(results, file)) {

            fs.writeFile(file, JSON.stringify(results), function(err){
              if (err) {
                console.log("Failed to save " + results.name + ".txt");
                console.log(err);
                res.writeHead(500, {"Content-Type": "text/html"});
                res.end("Error saving results: " + err);
              } else {
                console.log("Saved " + results.name + ".txt successfully");
                res.writeHead(200, {"Content-Type": "text/html"});
                res.end("Thank you, come again");
              }
            });

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
 * See 'function evaluateResults' for more information on the table and its generation
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
 * Validate that the request's username and password are correct. and if so
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
    const NUM_CATEGORIES = 23;
    var correctAnswers = new Array(allSelections.length);
    correctAnswers.fill(0);

    // Load the winners, which are stored as a user submission
    var file = __dirname + "/results/winners.txt";
    var winners = JSON.parse(fs.readFileSync(file, "utf-8"));

    delete winners.name;
    delete winners.password;
    delete winners.create_date;

    // Begin building the HTML table
    var htmlTable = "<!DOCTYPE html><html><head title='Fantasy Oscars Results'><style>" +
        "table,th,td {border:1px solid black;border-collapse:collapse} " +
        "table>tbody>tr:nth-child(odd)> td:nth-child(odd) {background-color:#FFFFFF} " +
        "table>tbody>tr:nth-child(odd)> td:nth-child(even){background-color:#EEEEEE} " +
        "table>tbody>tr:nth-child(even)>td:nth-child(odd) {background-color:#e3eeff} " +
        "table>tbody>tr:nth-child(even)>td:nth-child(even){background-color:#d3dded}" +
        "td {padding: 3px 9px 3px 6px} " +
        "</style></head>"
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

            console.log(selection[category]);

            const displayName = (selection[category] !== ' ' ? nomineeNames[selection[category]] : '');
            // If the user answered correctly, bold the table cell and increment their correctAnswer counter
            if (displayName !== '' && selection[category] === winners[category]) {
                correctAnswers[i] = 1 + correctAnswers[i];
                htmlTable += "<td> <b>" + displayName + " </b> </td>";
            } else {
                htmlTable += "<td> " + displayName + " </td>";
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
    director:"Best Director",
    lactor:"Best Lead Actor",
    lactress:"Best Lead Actress",
    sactor:"Best Supporting Actor",
    sactress:"Best Supporting Actress",
    oscreen:"Best Original Screenplay",
    ascreen:"Best Adapted Screenplay",
    animated:"Best Animated Feature",
    foreign:"Best International Feature",
    docfeat:"Best Documentary Feature",
    docshort:"Best Documentary Short",
    lashort:"Best Live-Action Short",
    anshort:"Best Animated Short",
    score:"Best Original Score",
    song:"Best Original Song",
    sedit:"Best Sound",
    prod:"Best Production Design",
    cinem:"Best Cinematography",
    hair:"Best Hair and Makeup",
    costume:"Best Costume Design",
    fedit:"Best Editing",
    vfx:"Best Visual Effects",
    name:"Name"
}

/**
 * JSON mapping the HTML selection values to the names of the Nominee
 */
const nomineeNames = {
    picture0: "The Father",
    picture1: "Judas and the Black Messiah",
    picture2: "Mank",
    picture3: "Minari",
    picture4: "Nomadland",
    picture5: "Promising Young Woman",
    picture6: "Sound of Metal",
    picture7: "The Trial of the Chicago 7",
    lactor0: 'Riz Ahmed, Sound of Metal',
    lactor1: 'Chadwick Boseman, Ma Rainey\'s Black Bottom',
    lactor2: "Anthony Hopkins, The Father",
    lactor3: 'Gary Oldman, Mank',
    lactor4: 'Steven Yeun, Minari',
    lactress0: 'Viola Davis, Ma Rainey\'s Black Bottom',
    lactress1: 'Andra Day, The United States vs Billie Holiday',
    lactress2: 'Vanessa Kirby, Pieces of a Woman',
    lactress3: 'Frances McDormand, Nomadland',
    lactress4: 'Carey Mulligan, Promising Young Woman',
    sactor0: 'Sacha Baron Cohen, The Trial of the Chicago 7',
    sactor1: 'Daniel Kaluuya, Judas and the Black Messiah',
    sactor2: 'Leslie Odom, Jr, One Night in Miami',
    sactor3: 'Paul Raci, Sound of Metal',
    sactor4: 'Lakeith Stanfield, Judas and the Black Messiah',
    sactress0: 'Maria Bakalova, Borat Subsequent Moviefilm',
    sactress1: 'Glenn Close, Hillbilly Elegy',
    sactress2: 'Olivia Colman, The Father',
    sactress3: 'Amanda Seyfried, Mank',
    sactress4: 'Youn Yuh-Jung, Minari',
    director0: 'Thomas Vinterberg, Another Round',
    director1: 'Emerald Fennell, Promising Young Woman',
    director2: 'David Fincher, Mank',
    director3: 'Lee Isaac Chung, Minari',
    director4: 'Chloé Zhao, Nomadland',
    animated0: 'Onward',
    animated1: 'Over the Moon',
    animated2: 'A Shaun the Sheep Movie: Farmageddon',
    animated3: 'Soul',
    animated4: 'Wolfwalkers',
    anshort0: 'Burrow',
    anshort1: 'Genius Loci',
    anshort2: 'If Anything Happens I Love You',
    anshort3: 'Opera',
    anshort4: 'Yes-People',
    ascreen0: 'Borat Subsequent Moviefilm',
    ascreen1: 'The Father',
    ascreen2: "Nomadland",
    ascreen3: 'One Night in Miami',
    ascreen4: 'The White Tiger',
    oscreen0: 'Judas and the Black Messiah',
    oscreen1: 'Minari',
    oscreen2: 'Promising Young Woman',
    oscreen3: 'Sound of Metal',
    oscreen4: 'The Trial of the Chicago 7',
    cinem0: 'Judas and the Black Messiah',
    cinem1: 'Mank',
    cinem2: 'News of the World',
    cinem3: 'Nomadland',
    cinem4: 'The Trial of the Chicago 7',
    docfeat0: 'Collective',
    docfeat1: 'Crip Camp',
    docfeat2: 'The Mole Agent',
    docfeat3: 'My Octopus Teacher',
    docfeat4: 'Time',
    docshort0: 'Colette',
    docshort1: 'A Concerto Is a Conversation',
    docshort2: 'Do Not Split',
    docshort3: 'Hunger Ward',
    docshort4: 'A Love Song for Latasha',
    lashort0: 'Feeling Through',
    lashort1: 'The Letter Room',
    lashort2: 'The Present',
    lashort3: 'Two Distant Strangers',
    lashort4: 'White Eye',
    foreign0: 'Another Round (Denmark)',
    foreign1: 'Better Days (Hong Kong)',
    foreign2: 'Collective (Romania)',
    foreign3: 'The Man Who Sold His Skin (Tunisia)',
    foreign4: 'Quo Vadis, Aida? (Bosnia and Herzegovina)',
    fedit0: 'The Father',
    fedit1: 'Nomadland',
    fedit2: 'Promising Young Woman',
    fedit3: 'Sound of Metal',
    fedit4: 'The Trial of the Chicago 7',
    sedit0: 'Greyhound',
    sedit1: 'Mank',
    sedit2: 'News of the World',
    sedit3: 'Sound of Metal',
    sedit4: 'Soul',
    prod0: 'The Father',
    prod1: 'Ma Rainey\'s Black Bottom',
    prod2: 'Mank',
    prod3: 'News of the World',
    prod4: 'Tenet',
    score0: 'Da 5 Bloods',
    score1: 'Mank',
    score2: 'Minari',
    score3: 'News of the World',
    score4: 'Soul',
    song0: '"Husavik", Eurovision Song Contest: The Story of Fire Saga',
    song1: '"Fight For You", Judas and the Black Messiah',
    song2: '"Io Sì (Seen)", The Life Ahead',
    song3: '"Speak Now", One Night in Miami',
    song4: '"Hear My Voice", The Trial of the Chicago 7',
    hair0: 'Emma',
    hair1: 'Hillbilly Elegy',
    hair2: 'Ma Rainey\'s Black Bottom',
    hair3: 'Mank',
    hair4: 'Pinocchio',
    costume0: 'Emma',
    costume1: 'Mank',
    costume2: 'Ma Rainey\'s Black Bottom',
    costume3: 'Mulan',
    costume4: 'Pinocchio',
    vfx0: 'Love and Monsters',
    vfx1: 'The Midnight Sky',
    vfx2: 'Mulan',
    vfx3: 'The One and Only Ivan',
    vfx4: 'Tenet'
}
