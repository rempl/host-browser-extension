/* eslint-env browser */
/* global chrome, genUID, createIndicator */

var DEBUG = false;
var sessionId = genUID();
var pluginConnected = false;
var remplConnected = false;
var publishers = [];
var debugIndicator = DEBUG ? createIndicator() : null;
var outputChannelId;
var inputChannelId = 'rempl-browser-extension-host:' + genUID();

function updateIndicator() {
    if (debugIndicator) {
        debugIndicator.style.background = [
            'blue',   // once disconnected
            'orange', // pluginConnected but no a page
            'green'   // all connected
        ][pluginConnected + remplConnected];
    }
}

function sendToPlugin(event, data) {
    plugin.postMessage({
        type: event,
        data: data
    });
}

function emitPageEvent(channelId, payload) {
    if (DEBUG) {
        console.log('[rempl][content script] send to page', channelId, payload);
    }

    postMessage({
        channel: channelId,
        payload: payload
    }, '*');
}

function sendToPage(data) {
    emitPageEvent(outputChannelId, data);
}

function handshake() {
    emitPageEvent('rempl-browser-extension-host:connect', {
        input: inputChannelId,
        output: outputChannelId
    });
}

//
// set up transport
//

var plugin = chrome.runtime.connect({
    name: 'rempl:page'
});

plugin.onMessage.addListener(function(packet) {
    if (DEBUG) {
        console.log('[rempl][content script] from plugin', packet.type, packet);
    }

    switch (packet.type) {
        case 'connect':
            if (!pluginConnected && remplConnected) {
                sendToPlugin('page:connect', [sessionId, publishers]);
                sendToPage({
                    type: 'connect'
                });
            }

            pluginConnected = true;
            updateIndicator();

            break;

        case 'disconnect':
            if (pluginConnected && remplConnected) {
                sendToPage({
                    type: 'disconnect'
                });
            }

            pluginConnected = false;
            updateIndicator();
            break;

        case 'getRemoteUI':
        case 'callback':
        case 'data':
            sendToPage(packet);
            break;
    }
});

//
// connect to basis.js devpanel
//

addEventListener('message', function(e) {
    var data = e.data || {};

    switch (data.channel) {
        case 'rempl-browser-extension-publisher:connect':
            onConnect(data.payload || {});
            break;

        case inputChannelId:
            onData(data.payload || {});
            break;
    }
});

function onConnect(payload) {
    if (outputChannelId) {
        return;
    }

    outputChannelId = payload.input;
    remplConnected = true;
    updateIndicator();

    if (!payload.output) {
        handshake();
    }

    if (pluginConnected) {
        sendToPlugin('page:connect', [sessionId, payload.publishers || publishers]);
        sendToPage({
            type: 'connect'
        });
    }
}

function onData(payload) {
    if (DEBUG) {
        console.log('[rempl][content script] page -> plugin', payload);
    }

    switch (payload.type) {
        case 'publishers':
            publishers = payload.data[0];

            if (!pluginConnected) {
                return;
            }

            break;
    }

    plugin.postMessage(payload);
}

handshake();
