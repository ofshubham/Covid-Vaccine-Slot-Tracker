
function clearData() {
  // chrome.storage.local.set({ data: {} });
  chrome.storage.local.remove('data');
  chrome.storage.local.remove('availableCenters');
  $('#availableCenters').html('');
}

function resetForm() {
  $(`input[name="searchType"][value='pincode']`).attr("checked", "checked");
  $('#pincode').val('');
  $("#interval").val('30000');
  $("#district").val('582');
  $("#age").val('0');
}

$(function () {
  //form submit
  $("#appForm").on("submit", (event) => {
    event.preventDefault();
    var searchTypeVal = $("input[name=searchType]:checked").val();
    var isValid = false;
    var pincode = $("#pincode").val();
    if (searchTypeVal === "pincode") {
      isValid = isPincodeValid(pincode);
    } else {
      isValid = true;
    }

    if (isValid) {
      $("#pincodeError").text("");
      disableEnable("submitBtn", "reset");
      var age = $("#age").val();
      var interval = $("#interval").val();
      var district = $("#district").val();
      data = {
        searchType: searchTypeVal,
        interval: interval,
        pincode: pincode,
        district_id: district,
        age: age,
      };

      chrome.storage.local.set({ data });
      chrome.storage.local.set({ availableCenters: [] });
      chrome.runtime.sendMessage("fetch");
      $("#availableCenters").text("Fetching...");
    } else {
      $("#pincodeError").text("Invalid Pincode");
    }
  });

  $("#reset").on("click", () => {
    console.log("reset");
    clearData();
    resetForm();
    disableEnable("reset", "submitBtn");
    chrome.runtime.sendMessage("reset");
  });

  // Toggle between pincode and district
  $('input[type="radio"][name="searchType"]').on("change", function () {
    var searchTypeVal = $("input[name=searchType]:checked").val();
    if (searchTypeVal === "pincode") {
      disableEnable("district", "pincode");
    }
    if (searchTypeVal === "district") {
      disableEnable("pincode", "district");
    }
  });
});


function isPincodeValid(pincode) {
  var regexp = /^[1-9][0-9]{5}/;
  if (!pincode.match(/^[1-9][0-9]{5}$/g)) {
    return false;
  }
  return true;
}

function disableEnable(toBeDisabled, toBeEnabled) {
  $("#" + toBeDisabled).attr("disabled", true);
  $("#" + toBeEnabled).attr("disabled", false);
}

function createCenterTable(center, data) {
  availaibilityInCenter = false;
  var html = `<table class="table border-class">
        <caption><strong>${center.name} - ${center.pincode} (<a href="https://selfregistration.cowin.gov.in/">Book</a>)</strong></caption>
        <thead>
            <tr>
                <th scope="col">Vaccine</th>
                <th scope="col">Date</th>
                <th scope="col">Slot Dose 1</th>
                <th scope="col">Slot Dose 2</th>
                <th scope="col">Age</th>
            </tr>
        </thead>
        <tbody>`;
  center.sessions.forEach((s) => {
    if (
      s.available_capacity > 0 &&
      (+s.min_age_limit == +data.age || +data.age === 0)
    ) {
      availaibilityInCenter = true;
      html += `<tr>
                <td>${s.vaccine}</td>
                <td>${s.date}</td>
                <td>${s.available_capacity_dose1}</td>
                <td>${s.available_capacity_dose2}</td>
                <td>${s.min_age_limit}</td>
               </tr>`;
    }
  });
  if (availaibilityInCenter) {
    html += `   </tbody>
            </table>`;
    return html;
  }
  return null;
}

function renderDataUtil(centers, data) {
  html = "";
  console.log(data);
  centers.forEach((c) => {
    result = createCenterTable(c, data);
    if (result) {
      html += result;
    }
  });
  if (!html) {
    html = `<p>No Slot Available</p>`;
  }
  $("#availableCenters").html(html);
}

function renderData() {
  chrome.storage.local.get("data", (res1) => {
    console.log(res1);
    if (res1.data) {
      disableEnable("submitBtn", "reset");
      if (res1.data.searchType === "pincode") {
        $(`input[name="searchType"][value='pincode']`).attr(
          "checked",
          "checked"
        );
        disableEnable("district", "pincode");
      } else {
        $(`input[name="searchType"][value='district']`).attr(
          "checked",
          "checked"
        );
        disableEnable("pincode", "district");
      }

      $("#interval").val(res1.data.interval);
      $("#pincode").val(res1.data.pincode);
      $("#district").val(res1.data.district_id);
      $("#age").val(res1.data.age);
    }else{
      console.log('in reset form');
      resetForm();
    }
    chrome.storage.local.get("availableCenters", (res) => {
      if (res.availableCenters && res.availableCenters.length > 0) {
        renderDataUtil(res.availableCenters, res1.data);
      }else{
        $("#availableCenters").html('');
      }
    });
  });
}

chrome.runtime.onMessage.addListener((response, sender, sendResponse) => {
  switch (response) {
    case "renderData":
      renderData();
  }
});

renderData();
