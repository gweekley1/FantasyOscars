var express = require("express");
var favicon = require('serve-favicon');
const bodyParser = require("body-parser"),
      fs = require("fs"),
      sha256 = require("sha256");

var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("www"));
app.use(favicon(__dirname + '/www/favicon.ico'));
app.get('/', (_, res)=> res.sendFile(__dirname + '/www/index.html'));

/**
 * Submit user selections. Saves the results to __dirname/results/<name>.txt
 */
app.post("/submit", function(req, res){

    var results = req.body;
    results.password = sha256(results.password);
    results.create_date = new Date();

    // The server in AWS runs in UTC
    var cutoffTime = new Date(Date.parse('2023-03-12T18:45:00-0500'));
    var currentTime = new Date();

    // Only accept the submission if the cutoff time hasn't been reached or this
    // submission is an update to the winners
    if (currentTime.getTime() <= cutoffTime.getTime() || results.name === "winners") {
        
        if (!results.name) {
            res.writeHead(410, {"Content-Type": "text/html"});
            res.end("You need a name ya dingus");
            return;
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
    fs.readdirSync(__dirname + "/results").forEach(file => {
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
    var htmlTable = "<!DOCTYPE html><html><meta charset=\"utf-8\"><head title='Fantasy Oscars Results'>" +
        "<style>" +
        "table,th,td {border:1px solid black;border-collapse:collapse} " +
        "table>tbody>tr:nth-child(odd)> td:nth-child(odd) {background-color:#FFFFFF} " +
        "table>tbody>tr:nth-child(odd)> td:nth-child(even){background-color:#EEEEEE} " +
        "table>tbody>tr:nth-child(even)>td:nth-child(odd) {background-color:#e3eeff} " +
        "table>tbody>tr:nth-child(even)>td:nth-child(even){background-color:#d3dded}" +
        "td {padding: 3px 9px 3px 6px} " +
        "tbody tr > :first-child { position: sticky; z-index:1; left:0; border:1px solid black}" +
        "</style>" +
        "<link rel=\"icon\" type=\"image/x-icon\" href=\"favicon.ico\">" +
        "<title>2023 Fantasy Oscars Selection</title>" + 
        "</head>";
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
    prod:"Best Production Design",
    costume:"Best Costume Design",
    cinem:"Best Cinematography",
    fedit:"Best Editing",
    hair:"Best Hair and Makeup",
    sedit:"Best Sound",
    vfx:"Best Visual Effects",
    score:"Best Original Score",
    song:"Best Original Song",
    docfeat:"Best Documentary Feature",
    foreign:"Best International Feature",
    docshort:"Best Documentary Short",
    anshort:"Best Animated Short",
    lashort:"Best Live-Action Short"
};

/**
 * JSON mapping the HTML selection values to the names of the Nominee
 */
 var nomineeNames = {
    picture0: "All Quiet on the Western Front",
    picture1: "Avatar: The Way of Water",
    picture2: "The Banshees of Inisherin",
    picture3: "Elvis",
    picture4: "Everything Everywhere All at Once",
    picture5: "The Fabelmans",
    picture6: "Tár",
    picture7: "Top Gun: Maverick",
    picture8: "Triangle of Sadness",
    picture9: "Women Talking",
    
    director0: 'Martin McDonagh, The Banshees of Inisherin',
    director1: 'Daniel Kwan and Daniel Scheinert, Everything Everywhere All at Once',
    director2: 'Steven Spielberg, The Fabelmans',
    director3: 'Todd Field, Tár',
    director4: 'Ruben Östlund, Triangle of Sadness',

    lactor0: 'Austin Butler, Elvis',
    lactor1: 'Colin Farrell, The Banshees of Inisherin',
    lactor2: "Brendan Fraser, The Whale",
    lactor3: 'Paul Mescal, Aftersun',
    lactor4: 'Bill Nighy, Living',
    
    lactress0: 'Cate Blanchett, Tár',
    lactress1: 'Ana de Armas, Blonde',
    lactress2: 'Andrea Riseborough, To Leslie',
    lactress3: 'Michelle Williams, The Fabelmans',
    lactress4: 'Michelle Yeoh, Everything Everywhere All at Once',
    
    sactor0: 'Brendan Gleeson, The Banshees of Inisherin',
    sactor1: 'Brian Tyree Henry, Causeway',
    sactor2: 'Judd Hirsch, The Fabelmans',
    sactor3: 'Barry Keoghan, The Banshees of Inisherin',
    sactor4: 'Ke Huy Quan, Everything Everywhere All at Once',
    
    sactress0: 'Angela Bassett, Black Panther: Wakanda Forever',
    sactress1: 'Hong Chau, The Whale',
    sactress2: 'Kerry Condon, The Banshees of Inisherin',
    sactress3: 'Jamie Lee Curtis, Everything Everywhere All at Once',
    sactress4: 'Stephanie Hsu, Everything Everywhere All at Once',

    oscreen0: 'The Banshees of Inisherin',
    oscreen1: 'Everything Everywhere All at Once',
    oscreen2: 'The Fabelmans',
    oscreen3: 'Tár',
    oscreen4: 'Triangle of Sadness',

    ascreen0: 'All Quiet on the Western Front',
    ascreen1: 'Glass Onion: A Knives Our Mystery',
    ascreen2: "Living",
    ascreen3: 'Top Gun: Maverick',
    ascreen4: 'Women Talking',

    animated0: "Guillermo del Toro's Pinocchio",
    animated1: 'Marcel the Shell with Shoes On',
    animated2: 'Puss in Boots: The Last Wish',
    animated3: 'The Sea Beast',
    animated4: 'Turning Red',

    foreign0: 'All Quiet on the Western Front (Germany)',
    foreign1: 'Argentina, 1985 (Argentina)',
    foreign2: 'Close (Belgium)',
    foreign3: 'EO (Poland)',
    foreign4: 'The Quiet Girl (Ireland)',
    
    docfeat0: 'All that Breathes',
    docfeat1: 'All the Beauty and the Bloodshed',
    docfeat2: 'Fire of Love',
    docfeat3: 'A House of Splinters',
    docfeat4: 'Navalny',
    
    docshort0: 'The Elephant Whisperers',
    docshort1: 'Haulout',
    docshort2: 'How Do You Measure a Year?',
    docshort3: 'The Martha Mitchell Effect',
    docshort4: 'Stranger at the Gate',
    
    lashort0: 'An Irish Goodbye',
    lashort1: 'Ivalu',
    lashort2: 'Le pupille',
    lashort3: 'Night Ride',
    lashort4: 'The Red Suitcase',

    anshort0: 'The Boy, the Mole, the Fox and the Horse',
    anshort1: 'The Flying Sailor',
    anshort2: 'Ice Merchants',
    anshort3: 'My Year of Dicks',
    anshort4: 'An Ostritch Told Me the World Is Fake',
    
    score0: 'All Quiet on the Western Front',
    score1: 'Babylon',
    score2: 'The Banshees of Inisherin',
    score3: 'Everything Everywhere All at Once',
    score4: 'The Fabelmans',
    
    song0: 'Applause - Diane Warren (Tell It Like a Woman)',
    song1: 'Hold My Hand - Lady Gaga and BloodPop (Top Gun: Maverick)',
    song2: 'Lift Me Up - Tems, Rihanna, Ryan Coogler, and Ludwig Göransson (Black Panther: Wakanda Forever)',
    song3: 'Naatu Naatu - M. M. Keeravani (RRR)',
    song4: 'This Is a Life - Ryan Lott, David Byrne, and Mitski (Everything Everywhere All at Once)',

    sedit0: 'All Quiet on the Western Front',
    sedit1: 'Avatar: The Way of Water',
    sedit2: 'The Batman',
    sedit3: 'Elvis',
    sedit4: 'Top Gun: Maverick',

    prod0: 'All Quiet on the Western Front',
    prod1: 'Avatar: The Way of Water',
    prod2: 'Babylon',
    prod3: 'Elvis',
    prod4: 'The Fabelmans',

    cinem0: 'All Quiet on the Western Front',
    cinem1: 'Bardo, False Chronicle of a Handful of Truths',
    cinem2: 'Elvis',
    cinem3: 'Empire of Light',
    cinem4: 'Tár',

    hair0: 'All Quiet on the Western Front',
    hair1: 'The Batman',
    hair2: 'Black Panther: Wakanda Forever',
    hair3: 'Elvis',
    hair4: 'The Whale',

    costume0: 'Babylon',
    costume1: 'Black Panther: Wakanda Forever',
    costume2: 'Elvis',
    costume3: 'Everything Everywhere All at Once',
    costume4: 'Mrs. Harris Goes to Paris',

    fedit0: 'The Banshees of Inisherin',
    fedit1: 'Elvis',
    fedit2: 'Everything Everywhere All at Once',
    fedit3: 'Tár',
    fedit4: 'Top Gun: Maverick',

    vfx0: 'All Quiet on the Western Front',
    vfx1: 'Avatar: The Way of Water',
    vfx2: 'The Batman',
    vfx3: 'Black Panther: Wakanda Forever',
    vfx4: 'Top Gun: Maverick',

};
