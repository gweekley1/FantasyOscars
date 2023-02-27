const HOST = "https://oscars.grant-coolsite.net";
//const HOST = "http://localhost:8080";

const STORAGE_KEY = "grantsFantasyOscarsSelections";

/**
 * Pull the saved selection JSON from localStorage and set the radio inputs accordingly
 */
function loadSelectionsFromBrowser() {
    var selections = JSON.parse(localStorage.getItem(STORAGE_KEY));
    setInputsFromJson(selections);
}

/**
 * Get the user's selections from the Host and set the radio inputs accordingly
 */
function loadSelectionsFromServer() {

    var name = document.getElementById("name");
    var password = document.getElementById("password");
    var userData = {
        name: name.value,
        password: password.value
    };

    // This Ajax submits the username and password to be evaluated serverside
    $.ajax({
        type: "POST",
        url: HOST + "/load",
        data: userData,
        timeout: 3000,
        success: function(data) {
            console.log(data);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            setInputsFromJson(data);
        },
        error: function(err) {
            alert("Load failed: " + err.responseText);
        }
    });
}

/**
 * Select the radio button inputs based on provided JSON.
 * The selections JSON parameter must have keys matching the input names
 * and values matching that name's corresponding radio button values
 */
function setInputsFromJson(selections) {

    for (var category in selections) {
        var inputs = document.getElementsByName(category);
        [...inputs].forEach(input => {
            if (input.value === selections[category]) {
                input.checked = true;
            }
        });
    }

    var name = document.getElementById("name");
    if (selections && typeof selections.name !== "undefined") {
        name.value = selections.name;
    }
}

/**
 * Build JSON out of every input and submit it to the Host to be saved
 */
function submitSelections() {
    var elements = document.getElementById("oscarSelections").elements;

    var selectionsJson = {};

    [...elements].forEach(element => {
        if (element.type === "radio" && element.checked === true) {
            selectionsJson[element.name] = element.value;
        } else if (element.type === "radio" && selectionsJson[element.name] === undefined) {
            selectionsJson[element.name] = " ";
        }
    });

    var name = document.getElementById("name");
    selectionsJson.name = name.value;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(selectionsJson));

    var password = document.getElementById("password");
    selectionsJson.password = password.value;

    console.log(selectionsJson);

    $.ajax({
        type: "POST",
        url: HOST + "/submit",
        data: selectionsJson,
        timeout: 3000,
        success: function() {
            alert("Selections successfully submitted");
        },
        error: function(err) {
            alert("Submission failed: " + err.responseText);
        }
    });

}

function buildPage()
{
    var categoryNames = {
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
        lactress2: 'Andrea Riseborough, To leslie',
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

    var parentForm = document.getElementById('oscarSelections');

    Object.keys(categoryNames).forEach(category =>
    {
        // create selection group
        var categorySelection = document.createElement("div");
        categorySelection.className = "category";
        var categoryName = document.createElement("div");
        categoryName.innerText = ' ' + categoryNames[category] + ' ';
        categorySelection.appendChild(categoryName);

        // populate with options
        Object.keys(nomineeNames).forEach(nominee => 
        {
            if (nominee.startsWith(category))
            {
                var categoryOption = document.createElement("input");
                categoryOption.type = "radio";
                categoryOption.setAttribute("name", category);
                categoryOption.setAttribute("value", nominee);
                categoryOption.setAttribute("id", nominee);
                categoryOptionLabel = document.createElement("label");
                categoryOptionLabel.setAttribute("for", nominee);
                categoryOptionLabel.innerText = nomineeNames[nominee];

                categorySelection.appendChild(categoryOption);
                categorySelection.appendChild(categoryOptionLabel);
                categorySelection.appendChild(document.createElement("br"));
            }
        });

        parentForm.appendChild(categorySelection);
    });
}
