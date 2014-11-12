
var lifx = require('lifx');
var lx;

var Namer = require('../services/namer.js');

var conn;

var devices = {};

function log(msg)
{
    console.log('[LIFX] ' + msg);
}

module.exports = function(c) {

    conn = c;

    conn.once('accepted', function (cfg) {
    
        lx = lifx.init();

        lx.on('bulbstate', function(b) {
            var id = 'lifx-' + b.addr.toString('hex');
            conn.emit('lightState', { id: id, state: { on: b.on }});
        });

        lx.on('bulb', function(b) {

            var addr = b.addr.toString('hex');

            devices['lifx-' + addr] = {
                name: b.name || 'Un-named',
                addr: addr
            };

            Namer.add(devices);
        });

        lx.on('gateway', function(g) {
            log('Gateway found');
            startListening();
        });
    });
}

function startListening()
{
    log('Ready for commands');

    conn.on('getBridges', function() {
        sendBridgeInfo();
    });

    conn.on('getLights', function () {
        getLights();    
    });
    
    conn.on('setLightState', function (id, values) {
        setLightState(id, values);
    });

    conn.on('getLightState', function (id) {
        getLightState(id);
    });
}

function sendBridgeInfo()
{
    conn.emit('bridgeInfo', { name: 'LIFX' });
}

function getLights()
{
    var lights = [];

    for (device in devices) {
        lights.push({id: device, name: Namer.getName(device)});
    }

    conn.emit('lights', {lights: lights});
}

function setLightState(id, values)
{
    if (!devices.hasOwnProperty(id)) {
        return;
    }

    var addr = devices[id].addr;

    if (values.on) {
        lx.lightsOn(new Buffer(addr, 'hex'));
    } else {
        lx.lightsOff(new Buffer(addr, 'hex'));
    }
}

function getLightState(id)
{
    if (!devices.hasOwnProperty(id)) {
        return;
    }

    var addr = devices[id].addr;

    lx.requestStatus(new Buffer(addr, 'hex'));
}
