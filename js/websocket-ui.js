/*
 * Integrates Veles Websocket client with website's UI (and jQuery).
 * 
 * Copyright (C) 2019 The Veles Core developers
 * Author: Altcoin Baggins
 *
 * This program is free software: you can redistribute it and/or 
 * modify it under the terms of the GNU General Public License 
 * as published by the Free Software Foundation, either version 3 
 * of the License, or (at your option) any later version.
 */

// Global variable grouping information and methods related to
// Veles blockchain.
var velesChain = {
    // Holds the current state, updated from events
    'state': {},

    // Utility functions related to chain data
    'algoNameFromVersionHex': function(hash, length = 10) {
        while(hash.charAt(2) === '0')
            hash = hash.substr(2);   
        
        return hash.substr(0, length);
    },

    'algoNameFromVersionHex': function(versionHex) {
        if (versionHex.substr(4,2) == '01')
            return "scrypt";

        if (versionHex.substr(4,2) == '02')
            return "nist5";

        if (versionHex.substr(4,2) == '03')
            return "lyra2z";

        if (versionHex.substr(4,2) == '04')
            return "x11";

        if (versionHex.substr(4,2) == '05')
            return "x16r";

        return "sha256d";
    },

    'formatNumber': function(number, to_fixed = false, html_format = true) {
        if (number == 0 || number == null)
            return '0';

        if (to_fixed)
            number = Number(number).toFixed(to_fixed);
        else
            number = String(number);

        if (html_format) {
            if (String(number).indexOf('.')) {
                return '<b>' + number.replace('.', '</b>.');
            } else {
                return '<b>' + number + '</b>';
            }
        }
    },

    'formatHashrate': function(value, inputUnits = 1) {
        if (inputUnits != 1)
            value *= inputUnits;

        if (value == null || value == 0)
            return 0;

        if (value >= 1000000000000000)
            return this.formatNumber(value / 1000000000000000, 2) + ' <b>P</b>H/s';

        if (value >= 1000000000000)
            return this.formatNumber(value / 1000000000000, 2) + ' <b>T</b>H/s';

        if (value >= 1000000000)
            return this.formatNumber(value / 1000000000, 2) + ' <b>G</b>H/s';

        if (value >= 1000000)
            return this.formatNumber(value / 1000000, 2) + ' <b>M</b>H/s';

        if (value >= 1000)
            return this.formatNumber(value / 1000, 2) + ' <b>k</b>H/s';

        return this.formatNumber(value, 2) + ' H/s';
    },
    
    'shortenBlockHash': function(hash, length = 10) {
        while(hash.charAt(2) === '0')
            hash = hash.substr(2);   
        
        return hash.substr(0, length);
    },
}


/* Register event handlers with the WS client */
velesSocketClient.handleEvent = function(e) {
    // Automagically update all fields named as entity property, 
    // Edit: Now using data-id, deprecating magical classnames
    // for example <span class="chain-tip-height"></span>
    // todo: recursive objects / arrays crawl
    if (e.name == 'state_changed') {
        // look for elements by deta-entity-id
        // $('[data-entity-id="' + e['entity-id'] + '"][data-attribute="' + key + '"]').text(e['new-state'][key]+'X');
        // format items
        $('[data-entity-id="' + e['entity-id'] + '"]').each(function(){
            attribute = $(this).attr('data-attribute');

            if (!attribute || !e['new-state'].hasOwnProperty(attribute)) {
                console.log('Invalid data-entity-id: "' + e['entity-id'] + '"" has no attribute "' + attribute + '"');
                ev = e;
                return;
            }
            var value = e['new-state'][attribute];

            // Format the value
            if ($(this).attr('data-multiplier'))
                value *= $(this).attr('data-multiplier');

            if ($(this).attr('data-format') == 'coin_amount') {
                $(this).html(velesChain.formatNumber(value, 8));

            } else if ($(this).attr('data-format') == 'hashrate') {
                 $(this).html(velesChain.formatHashrate(value));

            } else if ($(this).attr('data-format') == 'number') {
                 $(this).html(velesChain.formatNumber(
                    value, 
                    $(this).attr('data-fixed-decimals') ? $(this).attr('data-fixed-decimals') : false
                    ));

            } else {
                $(this).text(value);
            }

            // Set title if required
            var title, match_var = null;

            if (title = $(this).attr('data-title'))
                if (match_var = title.match(/{(.*?)}/))
                    $(this).attr('title', title.replace(match_var[0], e['new-state'][match_var[1]]));
        })

        // compatibility for old-style using classnames
        for (var key in e['new-state']) {
            $('.' + e['entity-id'].replace('.', '-') + '-' + key).text(e['new-state'][key]);

            // Format hashrate though
            if (key.indexOf('hashrate') != -1)
                $('.' + e['entity-id'].replace('.', '-') + '-' + key + '-human').html(velesChain.formatHashrate(e['new-state'][key]));
        }

        // If we're on block explorer page, trigger it's status update
        // function ASAP when new block is found
        try {
            update_stats();
        } catch {
            // noop
        }
        // Save the last state
        velesChain.state[e['entity-id']] = e['new-state'];
        // Update tooltips if open
        velesFooterPanel.updateTooltip(e['entity-id'].replace('.', '-'));
    }
};
velesSocketClient.handleConnect = function() {
    $('.websocket-offline').hide();
    $('.websocket-online').show();
    $('.websocket-offline-animate').hide("fast");
    $('.websocket-online-animate').show("fast");

    /* example of direct query, not needed, all gets handled by events 
    velesSocketClient.get_cmd_result('node', 'masternodelist', {}, function(d) { 
        $('.masternode-list-enabled-length').text(d); 
    }, 'value=ENABLED|count'); */
};
velesSocketClient.handleDisconnect = function() {
    $('.websocket-online').hide();
    $('.websocket-offline').show();  
    $('.websocket-online-animate').hide("fast");
    $('.websocket-offline-animate').show("fast");  
    $('.footer-tooltip').hide();
};

