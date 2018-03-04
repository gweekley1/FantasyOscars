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

    var cutoffTime = new Date('2018-03-04T22:00:00Z');
    var currentTime = new Date();

    if (currentTime.getTime() <= cutoffTime.getTime()) {
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
    } else {
        res.writeHead(410, {"Content-Type": "text/html"});
        res.end("Missed cutoff time");
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

    var htmlTable = "<table><tr><td></td>"
    for (var i = 0; i < allSelections.length; ++i) {
        var selection = allSelections[i];

        htmlTable += "<td>" + selection.name + "</td>";

    }
    htmlTable += "</tr>";

    for (var category in winners) {
        htmlTable += "<tr> <td> " + categoryNames[category] + "</td>";
        for (var i = 0; i < allSelections.length; ++i) {
            var selection = allSelections[i];
            delete selection.name;

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
    vfx:""
}

var categoryNames = {
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

var nomineeNames = {
    callme: "Call Me By Your Name",
    darkest: "Darkest Hour",
    dunkirk: "Dunkirk",
    getout: "Get Out",
    ladybird: "Lady Bird",
    phantom: "Phantom Thread",
    post: "The Post",
    water: "The Shape of Water",
    three: "Three Billboards Outside of Ebbing, Missouri",
    chalamet: 'Timothée Chalamet, "Call Me by Your Name"',
    daylewis: 'Daniel Day-Lewis, "Phantom Thread"',
    kaluuya: 'Daniel Kaluuya, "Get Out"',
    oldman: 'Gary Oldman, "Darkest Hour"',
    denzel: 'Denzel Washington, "Roman J. Israel, Esq."',
    hawkins: 'Sally Hawkins, "The Shape of Water"',
    mcdormand: 'Frances McDormand, "Three Billboards Outside Ebbing, Missouri"',
    robbie: 'Margot Robbie, "I, Tonya"',
    ronan: 'Saoirse Ronan, "Lady Bird"',
    streep: 'Meryl Streep, "The Post"',
    dafoe: 'Willem Dafoe, "The Florida Project"',
    woody: 'Woody Harrelson, "Three Billboards Outside Ebbing, Missouri"',
    jenkins: 'Richard Jenkins, "The Shape of Water"',
    plummer: 'Christopher Plummer, "All the Money in the World"',
    rockwell: 'Sam Rockwell, "Three Billboards Outside Ebbing, Missouri"',
    blige: 'Mary J. Blige, "Mudbound"',
    janney: 'Allison Janney, "I, Tonya"',
    manville: 'Lesley Manville, "Phantom Thread"',
    metcalf: 'Laurie Metcalf, "Lady Bird"',
    spencer: 'Octavia Spencer, "The Shape of Water"',
    nolan: '"Dunkirk," Christopher Nolan',
    peele: '"Get Out," Jordan Peele',
    gerwig: '"Lady Bird," Greta Gerwig',
    pta: '"Phantom Thread," Paul Thomas Anderson',
    toro: '"The Shape of Water," Guillermo del Toro',
    boss: 'The Boss Baby',
    bread: 'The Breadwinner',
    coco: 'Coco',
    ferdinand: 'Ferdinand',
    vincent: 'Loving Vincent',
    basket: 'Dear Basketball',
    garden: 'Garden Party',
    lou: 'Lou',
    space: 'Negative Space',
    rhymes: 'Revolting Rhymes',
    disaster: 'The Disaster Artist',
    logan: 'Logan',
    molly: "Molly’s Game",
    mudbound: 'Mudbound',
    sick: 'The Big Sick',
    deakins: '"Blade Runner 2049," Roger Deakins',
    delbonnel: '"Darkest Hour," Bruno Delbonnel',
    hoytema: '"Dunkirk," Hoyte van Hoytema',
    morrison: '"Mudbound," Rachel Morrison',
    laustsen: '"The Shape of Water," Dan Laustsen',
    abacus: 'Abacus: Small Enough to Jail',
    faces: 'Faces Places',
    icarus: 'Icarus',
    aleppo: 'Last Men in Aleppo',
    strong: 'Strong Island',
    edith: 'Edith+Eddie',
    heaven: 'Heaven is a Traffic Jam on the 405',
    heroin: 'Heroin(e)',
    knife: 'Knife Skills',
    traffic: 'Traffic Stop',
    dekalb: 'DeKalb Elementary',
    eleven: 'The Eleven O’Clock',
    emmett: 'My Nephew Emmett',
    silent: 'The Silent Child',
    watu: 'Watu Wote/All of Us',
    woman: '"A Fantastic Woman" (Chile)',
    insult: '"The Insult" (Lebanon)',
    loveless: '"Loveless" (Russia)',
    body: '"On Body and Soul (Hungary)',
    square: '"The Square" (Sweden)',
    baby: 'Baby Driver',
    tonya: 'I, Tonya',
    starwars: 'Star Wars: The Last Jedi',
    blade: 'Blade Runner 2049',
    beauty: 'Beauty and the Beast',
    zimmer: 'Dunkirk',
    greenword: '"Phantom Thread," Jonny Greenwood',
    desplat: '"The Shape of Water," Alexandre Desplat',
    williams: '"Star Wars: The Last Jedi," John Williams',
    burwell: '"Three Billboards Outside Ebbing, Missouri," Carter Burwell',
    river: '"Mighty River" from "Mudbound," Mary J. Blige',
    love: '"Mystery of Love" from "Call Me by Your Name," Sufjan Stevens',
    remember: '"Remember Me" from "Coco," Kristen Anderson-Lopez, Robert Lopez',
    stand: '"Stand Up for Something" from "Marshall," Diane Warren, Common',
    this: '"This Is Me" from "The Greatest Showman," Benj Pasek, Justin Paul',
    victoria: 'Victoria and Abdul',
    wonder: 'Wonder',
    guardians: 'Guardians of the Galaxy Vol. 2',
    kong: 'Kong: Skull Island',
    apes: 'War for the Planet of the Apes'
}
