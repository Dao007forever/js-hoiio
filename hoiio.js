var hoiio = {};

hoiio.util = {
    serialize : function(obj, prefix) {
        var p;
        var str = [];
        for (p in obj)
            if (obj.hasOwnProperty(p)) {
                var k = prefix ? prefix + "[" + p + "]" : p, v = obj[p];
                str.push(typeof v == "object" ?
                         serialize(v, k) :
                         encodeURIComponent(k) + "=" + encodeURIComponent(v));
            }
        return str.join("&");
    },

    createFuncs : function(service, uses, obj) {
        var use;
        for (use in uses)
            if (uses.hasOwnProperty(use)) {
                obj[use] = function(use) {
                    return function(params, callback) {
                        obj.client.execute(service, use, params, null);
                    };
                }(use);
            }
    },

    createObj : function(client, service, uses) {
        var obj = {client: client};
        this.createFuncs(service, uses, obj);
        return obj;
    }
};

hoiio.client = function(app_id, access_token) {
    // Create other services constructor
    var i;
    var serv;
    var services = {
        account : {
            getBalance       : "get_balance",
            getInfo          : "get_info"
        },
        number  : {
            getCountries     : "get_countries",
            getChoices       : "get_choices",
            getRates         : "get_rates",
            subscribe        : "subscribe",
            updateForwarding : "update_forwarding",
            getActive        : "get_active"
        },
        sms     : {
            send             : "send",
            sendBulk         : "bulk_send",
            getHistory       : "get_history",
            getRate          : "get_rate",
            getStatus        : "query_status"
        },
        voice   : {
            call             : "call",
            conference       : "conference",
            hangUp           : "hangup",
            getHistory       : "get_history",
            getRate          : "get_rate",
            getStatus        : "query_status"
        },
        fax     : {
            send             : "send",
            getHistory       : "get_history",
            getRate          : "get_rate",
            getStatus        : "query_status"
            },

        ivr     : {            
            dial             : "start/dial",
            play             : "middle/play",
            gather           : "middle/gather",
            record           : "middle/record",
            transfer         : "end/transfer",
            hangUp           : "end/hangup"
        }
    };

    for (serv in services)
        if (services.hasOwnProperty(serv)) {
            this[serv] = function (service, uses) {
                return function (client) {
                    return this.util.createObj(client, service, uses);
                };
            }(serv, services[serv]);
        }

    return {
        app_id : app_id,
        access_token : access_token,
        base_uri : "https://secure.hoiio.com/open",
        hoiio : this,

        getMethodURI : function() {
            var str = Array.prototype.slice.call(arguments);
            str.unshift(this.base_uri);
            document.writeln(str);
            return str.join("/");
        },

        request: function(uri, params, callback) {
            var req = new XMLHttpRequest();

            params.app_id = this.app_id;
            params.access_token = this.access_token;

            req.open('POST', uri, true);
            req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

            if (callback) {
                req.onreadystatechange = callback(req);
            }

            document.writeln(uri);
            document.writeln(this.hoiio.util.serialize(params));
            req.send(this.hoiio.util.serialize(params));
        },

        execute: function(service, use, params, callback) {
            var methodUri = this.getMethodURI(service, use);
            this.request(methodUri, params, callback);
        }
    };
};