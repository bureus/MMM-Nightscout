const NodeHelper = require('node_helper');
const request = require('request-promise');

var debugMe = true;

module.exports = NodeHelper.create({
    start: function () {
        log('Starting helper: ' + this.name);
        this.started = false;
    },
    // --------------------------------------- Schedule a stands update
    scheduleUpdate: function (lastDate) {
        let self = this;
        //let refreshRate = new Date(Date.now()) - new Date(lastDate).setMinutes(5);
        //debug("Updating in: "+ refreshRate)
        this.updatetimer = setInterval(function () { // This timer is saved in uitimer so that we can cancel it
            self.update();
        }, 60000);
    },
    // --------------------------------------- Get Nightscout server configs
    getServerConfig: async function(){
        let self = this;
        return new Promise(resolve => {
            if(self.config.baseUrl){
                let options = {
                    method: 'GET',
                    uri: this.config.baseUrl+'api/v1/profile'
                };

                request(options)
                .then(function(body){
                    let config = JSON.parse(body);
                    debug('getServerConfig: data retrived, units is'+config[0].units);
                    resolve(config[0].units);
                })
                .catch(function(error){
                    log('getServerConfig: failed when trying to retrive data: '+error);
                    reject()
                });

            }else{
                log('getServerConfig: Missing configed base url');
                self.sendSocketNotification('SERVICE_FAILURE', 'getServerConfig: Missing configed base url');
                reject();
            }  

        });
    },
    // --------------------------------------- Get glucose data from Nightscout
    getGlucoseData: async function(){
        let self = this;
        return new Promise(resolve => {
            if(self.config.baseUrl){
                let options = {
                    method: 'GET',
                    uri: this.config.baseUrl+'/api/v1/entries.json?count=3'
                };

                request(options)
                .then(function(body){
                    let glucoseData = JSON.parse(body);
                    debug('getGlucoseData: data retrived');
                    resolve(glucoseData);
                })
                .catch(function(error){
                    log('getGlucoseData: failed when trying to retrive data: '+error);
                    reject()
                });

            }else{
                log('Missing configed base url');
                self.sendSocketNotification('SERVICE_FAILURE', 'Missing configed base url');
                reject();
            }  

        });
    },
    // --------------------------------------- Init
    update: async function(){
        let self = this;
        if(self.config.baseUrl && self.config.units){
            clearInterval(this.updatetimer); // Clear the timer so that we can set it again
            self.glucoseData = await self.getGlucoseData();
            let dto = generateDto(self.glucoseData, self.config.units);
            debug(JSON.stringify(dto));
            debug('bs value is: '+dto.bs+' '+dto.unit);
            self.sendSocketNotification("GLUCOSE", dto); // Send glucose data to presentation layer
            self.scheduleUpdate(dto.date);
        }
        else{
            debug('update: missing needed configs');
        }
    },
    // --------------------------------------- Init
    init: async function(){
        let self = this;
        if(self.started && self.config.baseUrl){
            self.config.units = await self.getServerConfig();
            await self.update();
        }
    },
    // --------------------------------------- Handle notifications
    socketNotificationReceived: async function (notification, payload) {
        const self = this;
        log("socketNotificationReceived")
        if (notification === "CONFIG") {
            log("CONFIG event received")
            this.config = payload;
            this.started = true;
            self.init();
        };
    }
});

//Utils
function convertSvgToMmol(sgv){
    debug('Converting '+sgv+' mg/dL to mmol/L');
    return (Math.round((sgv / 18) * 10) / 10).toFixed(1); 
}

function directionToUnicode(direction){
    switch(direction) {
        case 'NONE':
          return '⇼'
        case 'DoubleUp':
          return '⇈'
        case 'SingleUp':
          return '↑'
        case 'FortyFiveUp':
          return '↗'
        case 'Flat':
          return '→'
        case 'FortyFiveDown':
          return '↘'
        case 'SingleDown':
          return '↓'
        case 'DoubleDown':
          return '⇊'
        case 'RATE OUT OF RANGE':
          return '⇕'
        default:
         return '-';
      }

}

function generateDto(data, unit){
    debug(JSON.stringify(data));
    return {
        bs: unit == 'mmol' ? convertSvgToMmol(data[0].sgv) : data[0].sgv,
        delta: unit == 'mmol' ? convertSvgToMmol((data[0].sgv-data[1].sgv)) : data[0].sgv-data[1].sgv,
        unit: unit,
        date: data[0].date,
        trend: data[0].trend,
        direction: directionToUnicode(data[0].direction)
    }
    
}

// --------------------------------------- At beginning of log entries
function logStart() {
    return (new Date(Date.now())).toLocaleTimeString() + " MMM-Nightscout: ";
}

// --------------------------------------- Logging
function log(msg) {
    console.log(logStart() + msg);
}
// --------------------------------------- Debugging
function debug(msg) {
    if (debugMe) log(msg);
}