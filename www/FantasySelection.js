
function loadSelections() {
  var selections = JSON.parse(localStorage.getItem("grantsOscarFantasySelections"));

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

  console.log(selectionsJson)

  localStorage.setItem("grantsOscarFantasySelections", JSON.stringify(selectionsJson));

  $.ajax({
    type: "POST",
    url: "http://localhost:8080/submit",
    data: selectionsJson,
    timeout: 3000,
    success: function() {
      alert("Selections successfully submitted");
    },
    error: function(err) {
      alert("Submission failed");
    }
  });

}
