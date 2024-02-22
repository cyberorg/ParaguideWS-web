/**
 * Check if the current URL contains the query parameter "?source=pwa", 
 * and if not, hide certain elements and fetch weather-related data.
 */
if (-1 === window.location.href.indexOf("?source=pwa")) {
    document.getElementById("addToHomeScreen").style.display = "block";
    document.getElementById("iinfo").style.display = "block";
    document.getElementById("tbrief").style.display = "none";
    document.getElementById("8hours").style.display = "none";
    document.getElementById("windy").style.display = "none";
    document.getElementById("skewtc").style.display = "none";
    document.getElementById("meteogram").style.display = "none";
    document.getElementById("randomlink").style.display = "none";
}
/**
 * Fetches and displays the brief.
 */
fetch("longmet.json")
    .then(response => response.json())
    .then(data => {
        data = data.response[0].phrases.longMET;
        document.getElementById("longMET").textContent = data + " (In C).";
    })
    .catch(error => {
        console.error("Error fetching JSON:", error);
    });
/**
 * Fetches and displays the air quality index (AQI) information.
 */
fetch("aq.json")
    .then(response => response.json())
    .then(data => {
        var aqi = data.response[0].periods[0].aqi;
        var category = data.response[0].periods[0].category;
        document.getElementById("aqi").textContent = aqi;
        document.getElementById("aqic").textContent = category;
    })
    .catch(error => {
        console.error("Error fetching JSON:", error);
    });
/**
 * Fetches data from open-meteo and displays it on the webpage.
 */
fetch("https://api.open-meteo.com/v1/forecast?latitude=32.036973&longitude=76.708624&hourly=cloud_cover,visibility,direct_radiation,uv_index,uv_index_clear_sky&daily=sunrise,sunset,sunshine_duration,precipitation_hours,precipitation_probability_max&timezone=auto&forecast_days=1&models=gfs_seamless")
    .then(response => response.json())
    .then(data => {
        const date = new Date();
        var hour = date.getHours();
        var index = data.hourly.time.findIndex(time => parseInt(time.split("T")[1].split(":")[0]) === hour);
        const weatherForecast = document.getElementById("weatherForecast");

        for (let i = index; i < index + 8; i++) {
            var idx = i % data.hourly.time.length;
            const time = data.hourly.time[idx];
            var cloudCover = Math.round(data.hourly.cloud_cover[idx]);
            var visibility = Math.round(data.hourly.visibility[idx] / 1000);
            var uvIndex = Math.round(data.hourly.uv_index_clear_sky[idx]);
            var radiation = Math.round(data.hourly.direct_radiation[idx]);
            const row = weatherForecast.insertRow();
            row.insertCell(0).textContent = time.split("T")[1];
            row.insertCell(1).textContent = cloudCover;
            row.insertCell(2).textContent = visibility;
            row.insertCell(3).textContent = uvIndex;
            row.insertCell(4).textContent = radiation;
        }

        const sunrise = new Date(data.daily.sunrise[0]);
        sunrise.setMinutes(sunrise.getMinutes() - 30);
        const sunset = new Date(data.daily.sunset[0]);
        sunset.setMinutes(sunset.getMinutes() - 30);
        const sunriseTime = sunrise.toISOString().split("T")[1].substring(0, 5);
        const sunsetTime = sunset.toISOString().split("T")[1].substring(0, 5);
        const dailyForecast = document.getElementById("dailyForecast");
        var sunshineDuration = Math.round(data.daily.sunshine_duration[0] / 3600);
        var precipitationProbability = data.daily.precipitation_probability_max[0];
        dailyForecast.innerHTML = `
            <p>Sunrise: ${sunriseTime}</p>
            <p>Sunset: ${sunsetTime}</p>
            <p>Sunshine Duration: ${sunshineDuration} hours</p>
            <p>Precipitation Probability: ${precipitationProbability}%</p>
        `;
    })
    .catch(error => console.error("Error fetching data:", error));
/**
 * Fetches current weather data and displays it on the webpage.
 */
const apiKey = "";
const stationID = "";
const apiUrl = `https://api.weather.com/v2/pws/observations/current?stationId=${stationID}&format=json&units=m&apiKey=` + apiKey;

let isCelsius = true;

function toggleTemperatureUnit() {
    isCelsius = !isCelsius;
    fetchWeatherData();
}

async function fetchWeatherData() {
    try {
        const response = await fetch(apiUrl);
        var data = await response.json();
        var observation = data.observations[0];
        let temperature = observation.metric.temp;
        let dewpt = observation.metric.dewpt;
        var humidity = observation.humidity;
        let pressure = observation.metric.pressure;

        if (!isCelsius) {
            temperature = (9 * temperature / 5) + 32;
            dewpt = (9 * dewpt / 5) + 32;
            pressure *= 0.02953;
        }

        var cloudBaseHeight = Math.round(125 * (temperature - dewpt) / 2.5);
        if (!isCelsius) {
            cloudBaseHeight = Math.round(3.28084 * cloudBaseHeight);
        }

        document.getElementById("cloudBaseHeight").textContent = cloudBaseHeight + (isCelsius ? " m" : " ft");
        document.getElementById("temperature").textContent = temperature.toFixed(2) + (isCelsius ? " °C" : " °F");
        document.getElementById("humidity").textContent = humidity + "%";
        document.getElementById("pressure").textContent = pressure.toFixed(2) + (isCelsius ? " hPa" : " inHg");
        document.getElementById("dewpt").textContent = dewpt.toFixed(2) + (isCelsius ? " °C" : " °F");
        document.getElementById("otime").textContent = observation.obsTimeLocal + " IST";
    } catch (error) {
        console.error("Error fetching weather data:", error);
    }
}
/**
 * Fetches weather alerts and displays them on the webpage.
 */
function fetchAlerts(url, containerId, sectionId) {
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to fetch");
            }
            return response.text();
        })
        .then(text => {
            const alerts = text.split("--").filter(item => !item.includes('"balloonText": "No warning"'));
            alerts.sort((a, b) => {
                const locations = ["KANGRA", "MANDI", "KULLU", "CHAMBA"];
                return locations.indexOf(getTitle(a)) - locations.indexOf(getTitle(b));
            });
            alerts.forEach(alert => {
                processAlert(alert, containerId);
            });
            if (alerts.length === 0) {
                document.getElementById(sectionId).style.display = "none";
                document.querySelector(".warning-legend").style.display = "none";
            } else {
                document.getElementById(sectionId).style.display = "block";
                document.querySelector(".warning-legend").style.display = "flex";
            }
            const todayAlertsCount = document.getElementById("todayAlerts").children.length;
            const tomorrowAlertsCount = document.getElementById("tomorrowAlerts").children.length;
            if (todayAlertsCount === 0 && tomorrowAlertsCount === 0) {
                document.getElementById("todaySection").style.display = "none";
                document.getElementById("tomorrowSection").style.display = "none";
            } else if (todayAlertsCount === 0) {
                document.getElementById("todaySection").style.display = "none";
            } else if (tomorrowAlertsCount === 0) {
                document.getElementById("tomorrowSection").style.display = "none";
            }
        })
        .catch(error => {
            document.getElementById("todaySection").style.display = "none";
            document.getElementById("tomorrowSection").style.display = "none";
            document.querySelector(".warning-legend").style.display = "none";
            console.error("Error fetching data:", error);
        });
}

function processAlert(alert, containerId) {
    const alertObject = JSON.parse(`{${alert}}`);
    if (!alertObject.balloonText.includes("No warning")) {
        const container = document.createElement("div");
        container.className = "alert-container";
        container.style.backgroundColor = alertObject.color;
        const content = document.createElement("div");
        content.innerHTML = removeTags(alertObject.balloonText);
        container.appendChild(content);
        document.getElementById(containerId).appendChild(container);
    }
}

function removeTags(text) {
    return text.replace(/<\/?br\/?>/g, "");
}

function getTitle(alert) {
    const match = alert.match(/"title":\s*"(.*?)"/);
    return match ? match[1] : "";
}
/**
 * Fetches a random quote and displays it on the webpage.
 */
async function fetchRandomquote() {
    try {
        await fetchRandomURL();
        const response = await fetch("https://randomnessy.000webhostapp.com/");
        var text = await response.text();
        const container = document.getElementById("randomContentContainer");
        container.innerHTML += '<br><h1 style="text-align: center;">and some cookie...</h1>' + text;
    } catch (error) {
        console.error("Error fetching text:", error);
    }
}
/**
 * Fetches the user's location using geolocation API.
 */
function getLocation() {
    navigator.geolocation ? navigator.geolocation.getCurrentPosition(
        function (position) {
            var latitude = position.coords.latitude;
            var windyLink = "https://www.windy.com/" + latitude + "/" + position.coords.longitude;
            document.getElementById("windyLink").href = windyLink;
            var meteoblueLink = "https://www.meteoblue.com/en/weather/week/" + latitude.toFixed(3) + "N" + position.coords.longitude.toFixed(3) + "E";
            document.getElementById("meteoblueLink").href = meteoblueLink;
            var rucSoundingsLink = "https://rucsoundings.noaa.gov/gwt/?data_source=GFS&latest=latest&fcst_len=shortest&airport=" + latitude + "%2C" + position.coords.longitude + "&n_hrs=24&gwt=Interactive&start=latest";
            document.getElementById("rucSoundingsLink").href = rucSoundingsLink;
        },
        function (error) {
            if (error.code === error.PERMISSION_DENIED) {
                alert("Please enable location services to use this feature.");
            } else {
                console.error("Error getting geolocation:", error);
            }
        }
    ) : alert("Geolocation is not supported by this browser.");
}
/**
 * Fetches a random URL and displays it on the webpage.
 */
async function fetchRandomURL() {
    return fetch("https://cyberorg.github.io/xcleague/")
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");
            const links = Array.from(doc.querySelectorAll('a[href^="http"]:not([href^="tel:"])')).map(link => ({
                href: link.href,
                text: link.textContent.trim()
            }));
            const randomLink = links[Math.floor(Math.random() * links.length)];
            const container = document.getElementById("randomContentContainer");
            container.innerHTML = "";
            const anchor = document.createElement("a");
            anchor.href = randomLink.href;
            anchor.textContent = randomLink.text;
            anchor.target = "_blank";
            container.appendChild(anchor);
        })
        .catch(error => console.error("Error fetching page:", error));
}
/**
 * Loads multiple soundings data for display.
 */
async function loadMultiple() {
    try {
        fetch("soundings.json", {
                headers: {
                    "Cache-Control": "no-cache"
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data !== null) {
                    soundings = data;
                    var listcontainer = document.getElementById("listcontainer");
                    listcontainer.innerHTML = "";
                    for (var i = 0; i < soundings.length; i++) {
                        var button = document.createElement("button");
                        var timestamp = new Date(soundings[i].time * 1000);
                        timestamp.setUTCHours(timestamp.getUTCHours() + 5);
                        timestamp.setUTCMinutes(timestamp.getUTCMinutes() + 30);
                        button.innerText = timestamp.getDate() + " - " + timestamp.getHours() + ":" + timestamp.getMinutes();
                        button.onclick = function (index) {
                            return function () {
                                document.querySelectorAll(".btn-spc").forEach(function (btn) {
                                    btn.classList.remove("active");
                                });
                                this.classList.add("active");
                                skewt.plot(soundings[index].lines);
                            };
                        }(i);
                        button.className = "btn btn-default btn-sm btn-spc";
                        listcontainer.appendChild(button);
                    }
                    if (0 < soundings.length) {
                        document.querySelector(".btn-spc").classList.add("active");
                        skewt.plot(soundings[0].lines);
                    }
                }
            })
            .catch(error => {
                console.error("Error fetching data:", error);
                alert("Error fetching data: " + error);
            });
    } catch (error) {
        soundings = [];
        console.log(error);
        alert(error);
    }
}

fetchWeatherData();
fetchAlerts("alert1.txt", "todayAlerts", "todaySection");
fetchAlerts("alert2.txt", "tomorrowAlerts", "tomorrowSection");
getLocation();
var skewt = new SkewT("#skewt");
var soundings = [];
loadMultiple();

window.onload = function () {
    fetchRandomURL();
    fetchRandomquote();
};
/**
 * Event listener for the "Randomness" button.
 */
document.getElementById("randomness").addEventListener("click", async function () {
    event.preventDefault();
    await fetchRandomURL();
    await fetchRandomquote();
});

document.getElementById("addToHomeScreen").addEventListener("click", function () {
    window.scrollTo(0, 0);
    window.AddToHomeScreenInstance = new window.AddToHomeScreen({
        appName: "ParaguideWS",
        appIconUrl: "apple-touch-icon.png",
        assetUrl: "https://cdn.jsdelivr.net/gh/philfung/add-to-homescreen@1.8/dist/assets/img/",
        showErrorMessageForUnsupportedBrowsers: window.AddToHomeScreen.SHOW_ERRMSG_UNSUPPORTED.ALL,
        allowUserToCloseModal: false,
        maxModalDisplayCount: -1
    });
    ret = window.AddToHomeScreenInstance.show();
});

