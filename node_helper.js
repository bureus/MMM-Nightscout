const NodeHelper = require("node_helper");
const request = require("request-promise");

var debugMe = false;

module.exports = NodeHelper.create({
  start: function() {
    log("Starting helper: " + this.name);
    this.started = false;
  },
  // --------------------------------------- Schedule a stands update
  scheduleUpdate: function(lastDate) {
    let self = this;
    this.updatetimer = setInterval(function() {
      // This timer is saved in uitimer so that we can cancel it
      self.update();
    }, 60000);
  },
  // --------------------------------------- Get Nightscout server configs
  getServerConfig: async function() {
    let self = this;
    return new Promise(resolve => {
      if (self.config.baseUrl) {
        let options = {
          method: "GET",
          uri: this.config.baseUrl + "/api/v1/status",
          headers: {
            Accept: "application/json"
          }
        };

        request(options)
          .then(function(body) {
            let config = JSON.parse(body);
            debug(
              "getServerConfig: data retrived, units is" +
                config.settings.units +
                ", status is: " +
                config.status
            );
            resolve(config);
          })
          .catch(function(error) {
            log(
              "getServerConfig: failed when trying to retrive data: " + error
            );
            reject();
          });
      } else {
        log("getServerConfig: Missing configed base url");
        self.sendSocketNotification(
          "SERVICE_FAILURE",
          "getServerConfig: Missing configed base url"
        );
        reject();
      }
    });
  },
  // --------------------------------------- Get glucose data from Nightscout
  getGlucoseData: async function() {
    let self = this;
    return new Promise(resolve => {
      if (self.config.baseUrl) {
        let options = {
          method: "GET",
          uri:
            this.config.baseUrl +
            "/api/v1/entries.json?count=" +
            this.config.chartHours * 12
        };

        request(options)
          .then(function(body) {
            let glucoseData = JSON.parse(body);
            debug("getGlucoseData: data retrived");
            resolve(glucoseData);
          })
          .catch(function(error) {
            log("getGlucoseData: failed when trying to retrive data: " + error);
            reject();
          });
      } else {
        log("Missing configed base url");
        self.sendSocketNotification(
          "SERVICE_FAILURE",
          "Missing configed base url"
        );
        reject();
      }
    });
  },
  // --------------------------------------- Init
  update: async function() {
    let self = this;
    if (self.config.baseUrl && self.config.server.settings.units) {
      clearInterval(this.updatetimer); // Clear the timer so that we can set it again
      self.glucoseData = await self.getGlucoseData();
      let dto = generateDto(
        self.glucoseData,
        self.config.server.settings.units,
        self.config.server.settings.thresholds,
        self.config.server.settings
      );
      debug(JSON.stringify(dto));
      debug("bs value is: " + dto.bs + " " + dto.unit);
      self.sendSocketNotification("GLUCOSE", dto); // Send glucose data to presentation layer
      self.scheduleUpdate(dto.date);
    } else {
      debug("update: missing needed configs");
    }
  },
  // --------------------------------------- Init
  init: async function() {
    let self = this;
    if (self.started && self.config.baseUrl) {
      self.config.server = await self.getServerConfig();
      await self.update();
    }
  },
  // --------------------------------------- Handle notifications
  socketNotificationReceived: async function(notification, payload) {
    const self = this;
    log("socketNotificationReceived");
    if (notification === "CONFIG") {
      log("CONFIG event received");
      this.config = payload;
      this.debugMe = this.config.debug;
      this.started = true;
      self.init();
    }
  }
});

//Utils
function convertSvgToMmol(sgv) {
  debug("Converting " + sgv + " mg/dL to mmol/L");
  return (Math.round((sgv / 18) * 10) / 10).toFixed(1);
}

function directionToUnicode(direction) {
  switch (direction) {
    case "NONE":
      return "⇼";
    case "DoubleUp":
      return "⇈";
    case "SingleUp":
      return "↑";
    case "FortyFiveUp":
      return "↗";
    case "Flat":
      return "→";
    case "FortyFiveDown":
      return "↘";
    case "SingleDown":
      return "↓";
    case "DoubleDown":
      return "⇊";
    case "RATE OUT OF RANGE":
      return "⇕";
    default:
      return "-";
  }
}

function generateDto(data, unit, thresholds, settings) {
  debug(JSON.stringify(data));
  return {
    bs: unit == "mmol" ? convertSvgToMmol(data[0].sgv) : data[0].sgv,
    delta:
      unit == "mmol"
        ? convertSvgToMmol(data[0].sgv - data[1].sgv)
        : data[0].sgv - data[1].sgv,
    unit: unit,
    date: data[0].date,
    trend: data[0].trend,
    direction: directionToUnicode(data[0].direction),
    fontColor: getFontColor(data[0].sgv, thresholds),
    data: getCharDataSet(data, unit == "mmol", thresholds),
    settings: settings
  };
}

//
function getFontColor(sgv, thresholds, isChart) {
  if (sgv >= thresholds.bgHigh || sgv <= thresholds.bgLow) {
    return isChart ? "rgb(255, 0, 0)" : "#FF3333";
  }
  if (sgv <= thresholds.bgTargetTop && sgv >= thresholds.bgTargetBottom) {
    return isChart ? "rgb(76, 255, 0)" : "#33FF33";
  }
  return isChart ? "rgb(255, 255, 0)" : "#FFFF33";
}

function getCharDataSet(data, convert, thresholds) {
  debug(
    "getCharDataSet: data set length: " +
      data.length +
      ", convertSvgToMmol:" +
      convert
  );
  let colorSet = [];
  let dataSet = [];
  for (let i = 0; i < data.length; i++) {
    dataSet.push({
      t: data[i].date,
      y: convert ? convertSvgToMmol(data[i].sgv) : data[i].sgv
    });
    colorSet.push(getFontColor(data[i].sgv, thresholds, true));
  }
  return { dataSet: dataSet, colorSet: colorSet };
}

// --------------------------------------- At beginning of log entries
function logStart() {
  return new Date(Date.now()).toLocaleTimeString() + " MMM-Nightscout: ";
}

// --------------------------------------- Logging
function log(msg) {
  console.log(logStart() + msg);
}
// --------------------------------------- Debugging
function debug(msg) {
  if (debugMe) log(msg);
}
