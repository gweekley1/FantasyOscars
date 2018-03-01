let HOST = "http://localhost:8080";

function loadSelectionsFromBrowser() {
    var selections = JSON.parse(localStorage.getItem("grantsOscarFantasySelections"));
    setInputsFromJson(selections);
}

function loadSelectionsFromServer() {

    var name = document.getElementById("name");
    var password = document.getElementById("password");
    var userData = {
        name: name.value,
        password: password.value
    };

    $.ajax({
        type: "POST",
        url: HOST + "/load",
        data: userData,
        timeout: 3000,
        success: function(data) {
            console.log(data);
            setInputsFromJson(data);
        },
        error: function(err, msg, code) {
            alert("Load failed: " + code);
        }
    });
}

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

function submitSelections() {
    var elements = document.getElementById("oscarSelections").elements;

    var selectionsJson = {};

    for (var i = 0, element; element = elements[i++];) {
        if (element.type === "radio" && element.checked === true) {
            selectionsJson[element.name] = element.value;
        }
    }

    var name = document.getElementById("name");
    selectionsJson["name"] = name.value;

    localStorage.setItem("grantsOscarFantasySelections", JSON.stringify(selectionsJson));

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
        error: function(err, msg, code) {
            alert("Submission failed: " + code);
        }
    });

}
