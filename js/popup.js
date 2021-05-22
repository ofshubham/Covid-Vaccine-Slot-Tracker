
function clearData() {
  // chrome.storage.local.set({ data: {} });
  chrome.storage.local.remove('data');
  chrome.storage.local.remove('availableCenters');
  $('#availableCenters').html('');
}

function resetForm() {
  $(`input[name="searchType"][value="district"]`).prop("checked", true);
  $(`input[name="doseNumber"][value="0"]`).prop("checked", true);
  $('#pincode').val('');
  $("#interval").val('30000');
  $("#district").val('582');
  $("#age").val('0');
  $("#vaccine").val('0');
  $('#minSlots').val('1');

}

$(document).on('click', 'body *', ()=>{
  chrome.runtime.sendMessage('clearBadge');
})

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
      var vaccine = $("#vaccine").val();
      var dose = $("input[name=doseNumber]:checked").val();
      var minSlots = $('#minSlots').val();
      data = {
        searchType: searchTypeVal,
        interval: interval,
        pincode: pincode,
        district_id: district,
        age: age,
        vaccine: vaccine,
        dose: dose,
        minSlots: minSlots
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

function createCenterTable(center) {
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
      html += `<tr>
                <td>${s.vaccine}</td>
                <td>${s.date}</td>
                <td>${s.available_capacity_dose1}</td>
                <td>${s.available_capacity_dose2}</td>
                <td>${s.min_age_limit}</td>
               </tr>`;
  });
    html += `   </tbody>
            </table>`;
    return html;
}

function renderDataUtil(centers) {
  html = "";
  centers.forEach((c) => {
    result = createCenterTable(c);
    if (result) {
      html += result;
    }
  });
  $("#availableCenters").html(html);
}

function renderData() {
  chrome.storage.local.get("data", (res1) => {
    if (res1.data) {
      disableEnable("submitBtn", "reset");
      if (res1.data.searchType === "pincode") {
        $(`input[name="searchType"][value="pincode"]`).prop("checked", true);
        disableEnable("district", "pincode");
      } else {
        $(`input[name="searchType"][value="district"]`).prop("checked", true);
        disableEnable("pincode", "district");
      }

      if (res1.data.dose === '1') {
        $(`input[name='doseNumber'][value="1"]`).prop("checked", true);
      } else if(res1.data.dose == '2'){
        $(`input[name='doseNumber'][value="2"]`).prop("checked", true);
      }else{
        $(`input[name='doseNumber'][value="0"]`).prop("checked", true);
      }
      $("#vaccine").val(res1.data.vaccine);
      $("#minSlots").val(res1.data.minSlots);
      $("#interval").val(res1.data.interval);
      $("#pincode").val(res1.data.pincode);
      $("#district").val(res1.data.district_id);
      $("#age").val(res1.data.age);
    }else{
      resetForm();
    }
    chrome.storage.local.get("availableCenters", (res) => {
      if (res.availableCenters && res.availableCenters.length > 0) {
        renderDataUtil(res.availableCenters);
      }else{
        if(typeof res.availableCenters === 'undefined'){
          $("#availableCenters").html(``);  
        }else{
          $("#availableCenters").html(`<p>No Slot Available</p>`);
        }
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
chrome.runtime.sendMessage('clearBadge');
