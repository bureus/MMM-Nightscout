Module.register("MMM-Nightscout", {

    // Default module config.
    defaults: {
        baseUrl: null,
        debug: false
    },

    start: function () {
        Log.info("Starting module: " + this.name);

        //Send config to node_helper
        Log.info("Send configs to node_helper..");
        this.sendSocketNotification("CONFIG", this.config);
        this.updateDom();
    },

    getDom: function () {
        Log.info("getDom triggered");
        let wrapper = document.createElement("div");
        if (!this.loaded && !this.failure) {
            wrapper.innerHTML = "<img style='width: 100px' src='https://avatars3.githubusercontent.com/u/7661012?s=280&v=4'></img><span>Connecting...<span>"
            return wrapper;
        }
        if (this.failure) {
            wrapper.innerHTML = "Connection to Nightscout failed. Please review logs";
            wrapper.className = "dimmed light small";
            return wrapper;
        }
        if (this.glucoseData) {
            let div = document.createElement("div");
            let bs = document.createElement("div");
            bs.style = 'display: table;';
            bs.innerHTML = '<span class="bright large light" style="display: table-cell;vertical-align:middle;">'+this.glucoseData.bs+'</span><span class="bright medium light" style="display: table-cell;vertical-align:middle;">'+this.glucoseData.direction+'</span>';
            div.appendChild(bs);
            let delta = document.createElement("div");
            delta.className = "light small dimmed";
            delta.innerHTML = this.glucoseData.delta+" "+(this.glucoseData.unit == "mmol" ? 'mmol/L' : 'mg/dL');
            div.appendChild(delta);
            wrapper.innerHTML = div.outerHTML;
            return wrapper;
        }
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