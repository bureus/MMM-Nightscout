# MMM-Nightscout
[Magic Mirror](https://magicmirror.builders/) Module - Keep track of blood glucose levels with ease thru your magic mirror. Display real time blood glucose levels, with trends and warnings. Powered by [Nightscout](http://www.nightscout.info/)

## Prerequisites and requirments
1. You need to have Nightscout enabled CGM 
2. You need to setup your own Nightscout website, please follow this [tutorial](http://www.nightscout.info/wiki/welcome)

## Install
1. Clone repository into ``../modules/`` inside your MagicMirror folder.
2. Run ``npm install`` inside ``../modules/MMM-Nightscout/`` folder
3. Add the module to the MagicMirror config

## Update
1. Run ``git pull`` inside ``../modules/MMM-Nightscout/`` folder.
2. Run ``npm install`` inside ``../modules/MMM-Nightscout/`` folder

## Configuration
```
modules: [
    ...
    {
        module: "MMM-Nightscout",
            position: "top_left",
            config: {
                debug: true, //Optional: set to true if you want debug logs
                baseUrl: 'https://nightscout.azurewebsites.net' //Required: Base url to your Nightscout webapplication. Please make sure to not have any traling /
                colorEnabled: true //Optional: set to true if you want to get colorful bs values. Default is false.
                chartWidth: 350,  //Optional: set chart width in px. Default is 350px.
                chartHours: 4, //Optional: number of hours that chart tracks. Default is 4. 
                renderChart: true  //Optional: set to false if you dont want to get a chart. Default is true.
                extendedHeader: false //Option: set to false if you want to hide server title and last glucose value.
        }
    },
    ...
]
```

## Chart
Nightscout similare chart that has fully configurable dimansions. Support color coding and could track up to 24hrs of data. 

![Nightscout Module](https://github.com/bureus/MMM-Nightscout/blob/master/docs/screenshot-4.PNG)

![Nightscout Module](https://github.com/bureus/MMM-Nightscout/blob/master/docs/screenshot-5.PNG)

## Configs retrived from Nightscout
Supports both mmol/L and mg/dL

mmol/L

![Nightscout Module](https://github.com/bureus/MMM-Nightscout/blob/master/docs/screenshot.PNG)

mg/dL

![Nightscout Module](https://github.com/bureus/MMM-Nightscout/blob/master/docs/screenshot-2.PNG)

## Color theme
Set colorEnabled = true to render blood glucose level based on Nightscout thresholds (critical, warning, normal). Default is false. 

![Nightscout Module](https://github.com/bureus/MMM-Nightscout/blob/master/docs/screenshot-3.PNG)


## Screenshot

![Nightscout Module](https://github.com/bureus/MMM-Nightscout/blob/master/docs/screenshot.PNG)
