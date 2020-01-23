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

    var cutoffTime = new Date('2020-02-09T18:45:00Z');
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
    picture0: "Ford v Ferrari",
    picture1: "The Irishman",
    picture2: "Jojo Rabbit",
    picture3: "Joker",
    picture4: "Little Women",
    picture5: "Marriage Story",
    picture6: "Once Upon a Time in Hollywood",
    picture7: "1917",
    picture8: "Parasite",
    lactor0: 'Antonio Banderas, Pain and Glory',
    lactor1: 'Leonardo DiCaprio, Once Upon a Time in Hollywood',
    lactor2: "Adam Driver, Marriage Story",
    lactor3: 'Joaquin Phoenix, Joker',
    lactor4: 'Jonathan Pryce, The Two Popes',
    lactress0: 'Cynthia Erivo, Harriet',
    lactress1: 'Scarlett Johansson, Marriage Story',
    lactress2: 'Saoirse Ronan, Little Women',
    lactress3: 'Charlize Theron, Bombshell',
    lactress4: 'Renée Zellweger, Judy',
    sactor0: 'Tom Hanks, A Beautiful Day in the Neighborhood',
    sactor1: 'Anthony Hopkins, The Two Popes',
    sactor2: 'Al Pacino, The Irishman',
    sactor3: 'Joe Pesci, The Irishman',
    sactor4: 'Brad Pitt, Once Upon a Time in Hollywood',
    sactress0: 'Kathy Bates, Richard Jewell',
    sactress1: 'Laura Dern, Marriage Story',
    sactress2: 'Scarlett Johansson, Jojo Rabbit',
    sactress3: 'Florence Pugh, Little Women',
    sactress4: 'Margot Robbie, Bombshell',
    director0: 'Martin Scorsese, The Irishman',
    director1: 'Todd Phillips, Joker',
    director2: 'Sam Mendes, 1917',
    director3: 'Quentin Tarantino, Once Upon a Time in Hollywood',
    director4: 'Bong Joon-ho, Parasite',
    animated0: 'How to Train Your Dragon: The Hidden World',
    animated1: 'I Lost My Body',
    animated2: 'Klaus',
    animated3: 'Missing Link',
    animated4: 'Toy Story 4',
    anshort0: 'Dcera (Daughter)',
    anshort1: 'Hair Love',
    anshort2: 'Kitbull',
    anshort3: 'Memorable',
    anshort4: 'Sister',
    ascreen0: 'The Irishman',
    ascreen1: 'Jojo Rabbit',
    ascreen2: "Joker",
    ascreen3: 'Little Women',
    ascreen4: 'The Two Popes',
    oscreen0: 'Knives Out',
    oscreen1: 'Marriage Story',
    oscreen2: '1917',
    oscreen3: 'Once Upon a Time in Hollywood',
    oscreen4: 'Parasite',
    cinem0: 'The Irishman',
    cinem1: 'Joker',
    cinem2: 'The Lighthouse',
    cinem3: '1917',
    cinem4: 'Once Upon a Time in Hollywood',
    docfeat0: 'American Factory',
    docfeat1: 'The Cave',
    docfeat2: 'The Edge of Democracy',
    docfeat3: 'For Sama',
    docfeat4: 'Honeyland',
    docshort0: 'In the Absence',
    docshort1: 'Learning to Skateboard in a Warzone (if You\'re a Girl)',
    docshort2: 'Life Overtakes Me',
    docshort3: 'St. Louis Superman',
    docshort4: 'Walk Run Cha-Cha',
    lashort0: 'Brotherhood',
    lashort1: 'Nefta Football Club',
    lashort2: 'The Neighbors\' Window',
    lashort3: 'Saria',
    lashort4: 'A Sister',
    foreign0: 'Corpus Christi (Poland)',
    foreign1: 'Honeyland (North Macedonia)',
    foreign2: 'Les Misérables (France)',
    foreign3: 'Pain and Glory (Spain)',
    foreign4: 'Parasite (South Korea) ',
    fedit0: 'Ford v Ferrari',
    fedit1: 'The Irishman',
    fedit2: 'Jojo Rabbit',
    fedit3: 'Joker',
    fedit4: 'Parasite',
    sedit0: 'Ford v Ferrari',
    sedit1: 'Joker',
    sedit2: '1917',
    sedit3: 'Once Upon a Time in Hollywood',
    sedit4: 'Star Wars: The Rise of Skywalker',
    mixing0: 'Ad Astra',
    mixing1: 'Ford v Ferrari',
    mixing2: 'Joker',
    mixing3: '1917',
    mixing4: 'Once Upon a Time in Hollywood',
    prod0: 'The Irishman',
    prod1: 'Jojo Rabbit',
    prod2: '1917',
    prod3: 'Once Upon a Time in Hollywood',
    prod4: 'Parasite',
    score0: 'Joker',
    score1: 'Little Women',
    score2: 'Marriage Story',
    score3: '1917',
    score4: 'Star Wars: The Rise of Skywalker',
    song0: '"I Can\'t Let You Throw Yourself Away," Toy Story 4',
    song1: '"(I\'m Gonna) Love Me Again," Rocketman',
    song2: '"I\'m Standing With You," Breakthrough',
    song3: '"Into the Unknown," Frozen 2',
    song4: '"Stand Up," Harriet',
    hair0: 'Bombshell',
    hair1: 'Joker',
    hair2: 'Judy',
    hair3: 'Maleficent: Mistress of Evil',
    hair4: '1917',
    costume0: 'Jojo Rabbit',
    costume1: 'Once Upon a Time in Hollywood',
    costume2: 'The Irishman',
    costume3: 'Joker',
    costume4: 'Little Women',
    vfx0: 'Avengers: Endgame',
    vfx1: 'The Irishman',
    vfx2: 'The Lion King',
    vfx3: '1917',
    vfx4: 'Star Wars: The Rise of Skywalker'
}
