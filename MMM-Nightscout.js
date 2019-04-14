
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
        serverTitle: false
    },

    getScripts: function () {
        return ["modules/" + this.name + "/node_modules/chart.js/dist/Chart.bundle.min.js", "modules/" + this.name + "/node_modules/chartjs-plugin-annotation/chartjs-plugin-annotation.min.js"];
    },

    getHeader: function(){
        if(this.config.serverTitle && this.glucoseData.settings.customTitle){
            return this.glucoseData.settings.customTitle;
        }
    },

    start: function () {
        Log.info("Starting module: " + this.name);
        this.origLineElement = Chart.elements.Line;
        this.initChartDrawer(this.origLineElement);
        //Send config to node_helper
        Log.info("Send configs to node_helper..");
        this.sendSocketNotification("CONFIG", this.config);
        this.updateDom();
    },

    initChartDrawer: function (origLineElement) {
        Log.info("initChartDrawer");
        /*Chart.elements.Line = Chart.Element.extend({
            draw: function () {
                var vm = this._view;
                var backgroundColors = this._chart.controller.data.datasets[this._datasetIndex].backgroundColor;
                var points = this._children;
                var ctx = this._chart.ctx;
                var minX = points[0]._model.x;
                var maxX = points[points.length - 1]._model.x;
                var linearGradient = ctx.createLinearGradient(minX, 0, maxX, 0);

                points.forEach(function (point, i) {
                    var colorStopPosition = roundNumber((point._model.x - minX) / (maxX - minX), 2);

                    if (i === 0) {
                        linearGradient.addColorStop(0, backgroundColors[i]);
                    } else {
                        // only add a color stop if the color is different
                        if (backgroundColors[i] !== backgroundColors[i - 1]) {
                            // add a color stop for the prev color and for the new color at the same location
                            // this gives a solid color gradient instead of a gradient that fades to the next color
                            linearGradient.addColorStop(colorStopPosition, backgroundColors[i - 1]);
                            linearGradient.addColorStop(colorStopPosition, backgroundColors[i]);
                        }
                    }
                });

                vm.backgroundColor = linearGradient;

                origLineElement.prototype.draw.apply(this);
            }
        });

        Chart.controllers.line = Chart.controllers.line.extend({
            datasetElementType: Chart.elements.Line,
        });*/
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
            wrapper.appendChild(this.getBS());

            if (this.config.renderChart) {
                /*wrapper.height = this.config.chartHeight+90;
                wrapper.width = this.config.chartWidth;*/
                wrapper.appendChild(this.getChart());
            }
            return wrapper;
        }
    },

    getBS: function () {
        let div = document.createElement("div");
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