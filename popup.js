let body = document.getElementById('body');
let title = document.getElementById('title');
let text = document.getElementById('text');
let icon = document.getElementById('icon');
let switchButton = document.getElementById('switchButton');

getUrl(function (URL, baseURL, websiteName) {
  title.innerText = websiteName;
  getWebsiteMode(baseURL, function (mode) {
    if (mode == "1") {
      text.innerHTML = "First profile is active on <i>"+baseURL+"</i>";
      switchButton.className = "secondaryMode button";
      icon.src = "images/res/cookie-dark-128.png"
    }
    else {
      text.innerHTML = "Second profile is active on <i>"+baseURL+"</i>";
      switchButton.className = "primaryMode button";
      icon.src = "images/res/cookie-light-128.png"
    }
  })
});

switchButton.onclick = function(element) {
  getUrl(function (URL, baseURL, websiteName) {
    getWebsiteMode(baseURL, function (mode) {
      getCookies(URL, function (structuredCookies) {
        setCookieData(baseURL+"/"+mode, structuredCookies, function () {
          let otherMode = "1";
          if (mode == "1") {otherMode = "2";}
          getCookieData(baseURL+"/"+otherMode, function (cookieData) {
            if (cookieData == "") {
              removeCookies(URL, structuredCookies, function () {
                applyChangesAndReload(baseURL, mode);
              });
            }
            else {
              removeCookies(URL, structuredCookies, function () {
                setCookies(URL, cookieData, function () {
                  applyChangesAndReload(baseURL, mode);
                });
              });
            }
          });
        });
      });
    });
  });
};


function applyChangesAndReload(baseURL, mode) {
  if (mode == "1") {
    setWebsiteMode(baseURL, "2", function () {
      //MODE SET TO 2
      chrome.tabs.reload();
      window.close();
    });
  }
  else {
    setWebsiteMode(baseURL, "1", function () {
      //MODE SET TO 1
      chrome.tabs.reload();
      window.close();
    });
  }
}

/*----------*/
function setWebsiteMode(baseURL, mode, callback) {
  let name = baseURL+"/mode";
  setCookieData(name, mode,function () {
    if (callback) {
      callback();
    }
  })
}

function getWebsiteMode(baseURL, callback) {
  let name = baseURL+"/mode";
  getCookieData(name,function (cookieData) {

    if (cookieData == "2") {
      if (callback) {
        callback("2");
      }
    }
    else {
      if (callback) {
        callback("1");
      }
    }
  })
}

function setCookieData(name, value, callback) {
  removeCookieData(name, function (structuredData) {
    if (structuredData == "") {structuredData = name+"<:>"+value;}
    else {structuredData = structuredData + "<;>" + name+"<:>"+value;}

    chrome.storage.sync.set({cookieData: structuredData}, function() {
      if (callback) {
        callback();
      }
    });
  })
}

function removeCookieData(name, callback) {
  getStructuredCookieData(function (structuredData) {
    let newStructuredData = "";
    if (structuredData == undefined) {
      //DO NOTHING
    }
    else {
      let rows = structuredData.split("<;>");
      for (var i in rows) {
        if (rows[i].split("<:>")[0] == name) {
          //DO NOTHING
        }
        else {
          if (newStructuredData == "") {newStructuredData = rows[i];}
          else {newStructuredData = newStructuredData + "<;>" + rows[i];}
        }
      }
    }
    if (callback) {
      callback(newStructuredData);
    }
  })
}

function getCookieData(name, callback) {
  getStructuredCookieData(function (structuredData) {
    if (structuredData == undefined) {
      //DO NOTHING
      if (callback) {
        callback("");
      }
    }
    else {
      let rows = structuredData.split("<;>");
      let found = false;
      for (var i in rows) {
        if (rows[i].split("<:>")[0] == name) {
          found = true;
          if (callback) {
            callback(rows[i].split("<:>")[1]);
          }
        }
      }
      if (!found) {
        if (callback) {
          callback("");
        }
      }
    }
  })
}

function getStructuredCookieData(callback) {
  chrome.storage.sync.get(null, function(data) {
    let structuredData = data.cookieData;
    if (callback) {
      callback(structuredData);
    }
  });
}

function getCookies(domain, callback) {
  chrome.cookies.getAll({"url": domain}, function(cookies) {
    let structuredCookies = "";
    for (var i in cookies) {
      if (structuredCookies == "") {structuredCookies = cookies[i].name.toString() + ":" + cookies[i].value.toString();}
      else {structuredCookies = structuredCookies + ";" + cookies[i].name.toString() + ":" + cookies[i].value.toString();}
    }
    if (callback) {
      callback(structuredCookies);
    }
  });
}

function setCookies(domain, structuredCookies, callback) {
  let structuredCookieData = structuredCookies.split(";");
  for (let i in structuredCookieData) {
    let temp = structuredCookieData[i].split(":");
    let name = temp[0];
    let value = temp[1];
    let expiration = Date.now()+60*60*24*30;
    chrome.cookies.set({"url": domain, "name": name,"value": value,"expirationDate": expiration}, function() {
      //COOKIE VALUE SET
    });
  }
  if (callback) {
    callback();
  }
}

function removeCookies(domain, structuredCookies, callback) {
  let structuredCookieData = structuredCookies.split(";");
  for (let i in structuredCookieData) {
    let temp = structuredCookieData[i].split(":");
    let name = temp[0];
    chrome.cookies.remove({"url": domain, "name": name}, function() {
      //COOKIE REMOVED
    });
  }
  if (callback) {
    callback();
  }
}

function getUrl(callback) {
  chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
    let http = tabs[0].url.toString().split("/")[0];
    let URL = tabs[0].url.toString().split("/")[2].replace(".tr","");
    let baseURL = URL.replace("www.", "");
    URL = http+"//"+URL;
    let temp = baseURL.split(".");

    let index = temp.length-2;
    for (let i in temp) {
      let str = temp[i];
      if (str == "com" || str == "org" || str == "co") {index = i-1;}
    }

    let websiteName = temp[index];
    websiteName = websiteName.substring(0,1).toUpperCase()+websiteName.substring(1,websiteName.length).toLowerCase();
    if (callback) {
      callback(URL, baseURL, websiteName);
    }
  });
}