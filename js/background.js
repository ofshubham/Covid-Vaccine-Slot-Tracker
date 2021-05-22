var INTERVAL = null;
DISTRICT_ENDPOINT =
  "https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict";
// curl -X GET "https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/findByDistrict?district_id=512&date=31-03-2021" -H "accept: application/json" -H "Accept-Language: hi_IN"'

PINCODE_ENDPOINT =
  "https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByPin";
//   curl -X GET "https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByPin?pincode=110001&date=31-03-2021" -H "accept: application/json" -H "Accept-Language: hi_IN"


function setBadge(text){
  chrome.browserAction.setBadgeText({text: text.toString()});
}

function clearBadge(){
  chrome.browserAction.setBadgeText({text: ''});
}

function filterCenters(centers, data){
  result = []
  centers.forEach(center => {
    obj = {};
    sessionArray = [];
    center.sessions.forEach(s => {
      if((s.available_capacity > +data.minSlots - 1) && (+s.min_age_limit == +data.age || +data.age === 0) && (+data.vaccine === 0 || data.vaccine.toUpperCase() === s.vaccine.toUpperCase()) && (+data.dose === 0 || (+data.dose === 1 && s.available_capacity_dose1 > 0) || (+data.dose === 2 && s.available_capacity_dose2 > 0))){
        sessionArray.push(s);
      }
    })
    if(sessionArray.length > 0){
      obj.name = center.name;
      obj.pincode = center.pincode;
      obj.sessions = sessionArray;
      result.push(obj);
    }
  });
  return result;
}

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
        centersData = filterCenters(objects.centers, data);
        chrome.storage.local.set({ availableCenters: centersData}, () => {
          if(centersData && centersData.length > 0){
            sound.play();
          }
          setBadge(centersData.length);
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
    case "clearBadge":
      clearBadge();
      break;
  }
  return true;
});
