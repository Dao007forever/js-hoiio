if (typeof Object.create !== 'function') {
    Object.create = function (o) {    
        var F = function (){};
        F.prototype = o;
        return new F();
    };
}

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
                        this.client.execute(service, use, params, null);
                    };
                }(use);
            }
    },

    createObj : function(service, uses) {
        var obj = {client: hoiio.clientObj};
        this.createFuncs(service, uses, obj);
        return obj;
    }
};

hoiio.clientObj = {
        app_id : '',
        access_token : '',
        base_uri : "https://secure.hoiio.com/open",

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
            document.writeln(hoiio.util.serialize(params));
            req.send(hoiio.util.serialize(params));
        },

        execute: function(service, use, params, callback) {
            var methodUri = this.getMethodURI(service, use);
            this.request(methodUri, params, callback);
        }
};

hoiio.client = function(app_id, access_token) {
    // Create other services constructor
    var i;
    var retCli;
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
            this[serv + 'Obj'] = this.util.createObj(serv, services[serv]);

            if (typeof this[serv] !== 'function') {
                this[serv] = function(service) {
                    // save the name of the service in the scope for
                    // the inner function
                    return function (client) {
                        var obj = Object.create(this[service + 'Obj']);
                        obj.client = client;
                        return obj;
                    };
                }(serv);
            }
        }

    retCli = Object.create(this.clientObj);
    retCli.app_id = app_id;
    retCli.access_token = access_token;

    return retCli;
};