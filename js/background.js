var INTERVAL = null;
DISTRICT_ENDPOINT =
  "https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict";
// curl -X GET "https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/findByDistrict?district_id=512&date=31-03-2021" -H "accept: application/json" -H "Accept-Language: hi_IN"'

PINCODE_ENDPOINT =
  "https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByPin";
//   curl -X GET "https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByPin?pincode=110001&date=31-03-2021" -H "accept: application/json" -H "Accept-Language: hi_IN"

function startFetching(data) {
  var date = new Date();
  var day = date.getDate();
  var month = date.getMonth() + 1;
  var year = date.getFullYear();
  date =
    (day < 10 ? "0" + day : day) +
    "-" +
    (month < 10 ? "0" + month : month) +
    "-" +
    year;
  data.date = date;
  fetchAvailableCenters(data);
  INTERVAL = setInterval(fetchAvailableCenters, +data.interval, data);
}

function fetchAvailableCenters(data) {
  var sound = new Audio();
  sound.src = "../sound/ding.wav";
  var searchType = data.searchType;
  var pincode = data.pincode;
  var district_id = data.district_id;
  var date = data.date;
  var url = "";
  //pincode
  if (searchType === "pincode") {
    url = PINCODE_ENDPOINT + "?pincode=" + pincode + "&date=" + date;
  }
  //district
  if (searchType === "district") {
    url = DISTRICT_ENDPOINT + "?district_id=" + district_id + "&date=" + date;
  }

  if (url) {
    $.ajax({
      url: url,
      success: function (objects) {
        chrome.storage.local.set({ availableCenters: objects.centers }, () => {
          sound.play();
          chrome.runtime.sendMessage("renderData");
        });
      },
      error: function (jqXHR, exception) {
        console.log(exception, jqXHR);
      },
    });
  }
}

function initiateFetching() {
  chrome.storage.local.get("data", function (res) {
    startFetching(res.data);
  });
}

function resetInterval() {
  clearInterval(INTERVAL);
}

chrome.runtime.onMessage.addListener((response, sender, sendResponse) => {
  switch (response) {
    case "fetch":
      initiateFetching();
      break;
    case "reset":
      resetInterval();
      break;
  }
  return true;
});
