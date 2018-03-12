//const HOST = "http://52.42.59.227";
const HOST = "http://localhost:8080";

const STORAGE_KEY = "grantsOscarFantasySelections";

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
        for (var i = 0, input; input = inputs[i++];) {
            if (input.value === selections[category]) {
                input.checked = true;
            }
        }
    }

    var name = document.getElementById("name");
    if (typeof selections.name !== "undefined") {
        name.value = selections.name;
    }
}

/**
 * Build JSON out of every input and submit it to the Host to be saved
 */
function submitSelections() {
    var elements = document.getElementById("oscarSelections").elements;

    var selectionsJson = {};

    for (var i = 0, element; element = elements[i++];) {
        if (element.type === "radio" && element.checked === true) {
            selectionsJson[element.name] = element.value;
        } else if (element.type === "radio" && selectionsJson[element.name] === undefined) {
            selectionsJson[element.name] = " ";
        }
    }

    var name = document.getElementById("name");
    selectionsJson["name"] = name.value;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(selectionsJson));

    var password = document.getElementById("password");
    selectionsJson["password"] = password.value;

    console.log(selectionsJson)

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
