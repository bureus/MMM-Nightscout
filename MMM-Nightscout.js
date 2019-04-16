Module.register("MMM-Nightscout", {

    // Default module config.
    defaults: {
        baseUrl: null,
        debug: false,
        colorEnabled: false,
        chartWidth: 350,
        chartHeight: 850,
        chartHours: 4,
        renderChart: true,
        extendedHeader: true
    },

    getScripts: function () {
        return ["modules/" + this.name + "/node_modules/chart.js/dist/Chart.bundle.min.js", "modules/" + this.name + "/node_modules/chartjs-plugin-annotation/chartjs-plugin-annotation.min.js"];
    },

    start: function () {
        Log.info("Starting module: " + this.name);
        this.origLineElement = Chart.elements.Line;
        //Send config to node_helper
        Log.info("Send configs to node_helper..");
        this.sendSocketNotification("CONFIG", this.config);
        this.updateDom();
    },

    getDom: function () {
        Log.info("getDom triggered");
        let wrapper = document.createElement("div");
        if (!this.loaded && !this.failure) {
            wrapper.innerHTML = "<img style='width: 100px' src='https://avatars3.githubusercontent.com/u/7661012?s=280&v=4'></img>"
            return wrapper;
        }
        if (this.failure) {
            wrapper.innerHTML = "Connection to Nightscout failed. Please review logs";
            wrapper.className = "dimmed light small";
            return wrapper;
        }
        if (this.glucoseData) {
            let head = document.createElement("div");
            head.appendChild(this.getBS());
            if(this.config.extendedHeader && this.glucoseData.settings.customTitle){
                head.appendChild(this.getCustomTitle());
            }
            wrapper.appendChild(head);
            if (this.config.renderChart) {
                wrapper.appendChild(this.getChart());
            }
            return wrapper;
        }
    },

    getCustomTitle: function(){
        let updatedTime = new Date(this.glucoseData.date);
        let customTitle = document.createElement("div");
        customTitle.style = "float: left;clear: none; padding-left: 10px;"
        customTitle.innerHTML = "<span class='normal medium dimmed' style='display:block;'>"+this.glucoseData.settings.customTitle+"</span><span class='light small dimmed' style='display:block;'>"+updatedTime.toLocaleString()+"</span>";
        return customTitle;
    },

    getBS: function () {
        let div = document.createElement("div");
        div.style = "float: left;clear: none;";
        let bs = document.createElement("div");
        bs.style = 'display: table;';
        let bsStyle = this.config.colorEnabled ? "display: table-cell;vertical-align:middle; color:" + this.glucoseData.fontColor + ";" : "display: table-cell;vertical-align:middle;";
        bs.innerHTML = '<span class="bright large light" style="' + bsStyle + '">' + this.glucoseData.bs + '</span><span class="bright medium light" style="display: table-cell;vertical-align:middle;">' + this.glucoseData.direction + '</span>';
        div.appendChild(bs);
        let delta = document.createElement("div");
        delta.className = "light small dimmed";
        delta.innerHTML = this.glucoseData.delta + " " + (this.glucoseData.unit == "mmol" ? 'mmol/L' : 'mg/dL');
        div.appendChild(delta);
        return div;
    },

    getChart: function () {
        let chartWrapper = document.createElement("div");
        chartWrapper.style = 'position: relative; display: inline-block; width:' + this.config.chartWidth + 'px;height:' + this.config.chartHeight + 'px';
        let chartElement = document.createElement("canvas");
        chartElement.style = 'width:' + this.config.chartWidth + 'px;height:' + this.config.chartHeight + 'px'
        let chartConfig = {
            type: 'line',
            data: {
                datasets: [{
                    //backgroundColor: this.glucoseData.data.colorSet,
                    pointBackgroundColor: this.glucoseData.data.colorSet,
                    pointRadius: 2,
                    borderColor: chartColors.white,
                    data: this.glucoseData.data.dataSet,
                    type: 'line',
                    fill: true,
                    showLine: false
                }]
            },
            options: {
                title: {
                    display: false
                },
                annotation: {
                    annotations: [{
                        borderDash: [3],
                        type: 'line',
                        mode: 'horizontal',
                        scaleID: 'y-axis-0',
                        value: this.glucoseData.unit == "mmol" ? 3: 60,
                        borderColor: 'rgba(242, 241, 239, 0.5)',
                        borderWidth: 1,
                        label: {
                            enabled: false,
                        }
                    },
                    {
                        borderDash: [3],
                        type: 'line',
                        mode: 'horizontal',
                        scaleID: 'y-axis-0',
                        value: this.glucoseData.unit == "mmol" ? 14 : 260,
                        borderColor: 'rgba(242, 241, 239, 0.5)',
                        borderWidth: 1,
                        label: {
                            enabled: false,
                        }
                    },
                    {
                        borderDash: [10],
                        type: 'line',
                        mode: 'horizontal',
                        scaleID: 'y-axis-0',
                        value: this.glucoseData.unit == "mmol" ? 4.2 : 80,
                        borderColor: 'rgba(242, 241, 239, 0.5)',
                        borderWidth: 1,
                        label: {
                            enabled: false,
                        }
                    },
                    {
                        borderDash: [10],
                        type: 'line',
                        mode: 'horizontal',
                        scaleID: 'y-axis-0',
                        value: this.glucoseData.unit == "mmol" ? 10 : 170,
                        borderColor: 'rgba(242, 241, 239, 0.5)',
                        borderWidth: 1,
                        label: {
                            enabled: false,
                        }
                    }]
                },
                legend: {
                    display: false,
                },
                scales: {
                    xAxes: [{
                        type: 'time',
                        time: {
                            parser: 'HH:mm',
                            unit: 'minute',
                            unitStepSize: 30,
                            displayFormats: {
                                'minute': this.glucoseData.settings.timeFormat == 24 ? 'HH:mm' : 'hh:mm A' 
                            }
                        },
                        scaleLabel: {
                            display: false
                        },
                        distribution: 'series',
                        ticks: {
                            source: 'data',
                            autoSkip: true
                        },
                        data: this.glucoseData.data,
                        gridLines: {
                            offsetGridLines: true
                        }
                    }],
                    yAxes: [{
                        typ: 'logarithmic',
                        ticks: {
                            beginAtZero: true,
                            max: this.glucoseData.unit == "mmol" ? 18 : 400,
                            min: this.glucoseData.unit == "mmol" ? 2 : 30
                        },
                        display: true,
                        scaleLabel: {
                            display: true,
                            labelString: this.glucoseData.unit == "mmol" ? 'mmol/L' : 'mg/dL'
                        }
                    }]
                }
            }
        }
        this.chart = new Chart(chartElement.getContext("2d"), chartConfig);
        chartWrapper.appendChild(chartElement);
        return chartWrapper;
    },

    // --------------------------------------- Handle socketnotifications
    socketNotificationReceived: function (notification, payload) {
        Log.info("socketNotificationReceived: " + notification + ", payload: " + payload);
        if (notification === "GLUCOSE") {
            this.loaded = true;
            this.failure = undefined;
            this.glucoseData = payload;
            this.updateDom();
        }
        else if (notification == "SERVICE_FAILURE") {
            this.loaded = true;
            this.failure = payload;
            if (payload) {
                Log.info("Service failure: " + this.failure.resp.StatusCode + ':' + this.failure.resp.Message);
                this.updateDom();
            }
        }
    },
    notificationReceived: function (notification, payload, sender) {
        if (notification == "DOM_OBJECTS_CREATED") {
            this.domObjectCreated = true;
        }
    }
});

//Utilities
var chartColors = {
    red: 'rgb(255, 99, 132)',
    yellow: 'rgb(255, 205, 86)',
    green: 'rgb(75, 192, 192)',
    white: 'rgba(255,255,255, 0.9)'
};

var roundNumber = function (num, scale) {
    var number = Math.round(num * Math.pow(10, scale)) / Math.pow(10, scale);
    if (num - number > 0) {
        return (number + Math.floor(2 * Math.round((num - number) * Math.pow(10, (scale + 1))) / 10) / Math.pow(10, scale));
    } else {
        return number;
    }
};