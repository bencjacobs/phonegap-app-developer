(function() {

/*---------------------------------------------------
    Globals
---------------------------------------------------*/

var config = {};

/*---------------------------------------------------
    General
---------------------------------------------------*/

$().ready(function() {
    // Add events
    $('#login-form').submit(buildSubmit);
    $('a[target="_system"]').on('click', function(e) {
        e.preventDefault();
        window.open($(this).attr('href'), '_system');
    });

    // Issue #27
    // When input box is selected, the soft-keyboard is shown
    // but the input box focus is in the incorrect position.
    $('#address').on('touchstart', function() {
        $('#address').focus();
    });

    // On input selection, backup the current address.
    $('#address').on('focus', function() {
        $('#address').attr('currentValue', getAddressField());
    });

    // On input de-selection, restore backup if there is no content.
    $('#address').on('blur', function() {
        var $address = $('#address'),
            whitespaceRegex = /^\s*$/;

        if (whitespaceRegex.test(getAddressField())) {
            $address.val($address.attr('currentValue'));
        }
        $address.attr('currentValue', '');
    });

    // Work around CSS browser issues.
    supportBrowserQuirks();
});

$(document).on('deviceready', function() {
    // Add slight delay to allow DOM rendering to finish.
    // Avoids flicker on slower devices.
    setTimeout(function() {
        // allow the screen to dim when returning from the served app
        window.plugins.insomnia.allowSleepAgain();

        // start hockey app
        hockeyapp.start(function() {
            alert('hockey app started successfully') ;
            hockeyapp.checkForUpdate(function() {
                hockeyapp.feedback(function() {
                    //hockeyapp.forceCrash();
                }, function() {
                    alert('feedback err');
                });
            }, function() {
                alert('failed to get update');
            });
        }, function() {
        }, '11ef30004b8e4984af1e2fc5fa802429');

        navigator.splashscreen.hide();
        $('.footer').removeClass('faded');

        // Load configuration
        window.phonegap.app.config.load(function(data) {
            // store the config data
            config = data;

            // load server address
            if (config.address) {
                $('#address').val(config.address);
            }

            setTimeout( function() {
                $('.alert').removeClass('alert');
                $('.visor').removeClass('pulse');
                $('.visor label').html('Hi!');
                $('.visor .eye').removeClass('faded');
            }, 1750);

            setTimeout( openBot, 2750);
            setTimeout( function() {
                $('.visor .eye').addClass('hidden');
            }, 3350 );
        });
    }, 350);
});

/*---------------------------------------------------
    UI - General
---------------------------------------------------*/

function openBot() {
    $('.monitor form').removeClass('hidden');
    setTimeout( function() {
        $('.panel.top').addClass('open');
        $('.visor').addClass('fade-out');
        $('.monitor form').removeClass('faded');
        setTimeout( function() {
            $('.visor').addClass('hidden');
        }, 550);
    }, 50);
}

function closeBot() {
    $('.visor').removeClass('hidden');
    setTimeout( function() {
        $('.panel.top').removeClass('open');
        $('.visor').removeClass('fade-out');
        $('.monitor form').addClass('faded');
        setTimeout( function() {
            $('.monitor form').addClass('hidden');
        }, 550);
    }, 50);
}

// Note that the bot needs to be closed to be able to view this
function updateMessage( msg ) {
    $('.visor').removeClass('pulse');
    $('.visor label').html( msg.toUpperCase() );
}

function errorMessage( msg ) {
    updateMessage( msg );
    $('.visor').removeClass('pulse');
    $('.monitor').addClass('alert');
}

function pulsingMessage( msg ) {
    updateMessage( msg );
    $('.visor').addClass('pulse');
}

/*---------------------------------------------------
    UI - Form
---------------------------------------------------*/

function buildSubmit() {
    closeBot();
    updateMessage('');
    setTimeout(function() {
        pulsingMessage( 'Connecting...' );
        onBuildSubmitSuccess();
    }, 500);

    return false;
}

function onBuildSubmitSuccess() {
    updateMessage( 'Downloading...' );

    // update config data
    config.URL = document.URL;
    config.address = getAddressField();

    window.phonegap.app.config.save(config, function() {
        // don't allow the screen to dim when serving an app
        window.plugins.insomnia.keepAwake();

        setTimeout( function() {
            window.phonegap.app.downloadZip({
                address: getAddress(),
                onProgress: function(data) {
                    if(data.status === 2) {
                        updateMessage('Extracting...');
                    }else if(data.status === 3) {
                        updateMessage('Success!');
                    }
                },
                onDownloadError: function(e) {
                    onBuildSubmitError('Download Error!');
                    var errorString = 'Unable to download archive from the server.\n\n';
                    if(e)
                    {
                        // fix for wp8 since it returns an object as opposed to just an int
                        if(e.code) e = e.code;

                        if(e === 1)
                        {
                            errorString += 'Please enter a valid url to connect to.';
                        }
                        else if(e === 2)
                        {
                            errorString += 'Unable to properly connect to the server.';
                        }
                        else if(e === 3)
                        {
                            errorString += 'Unable to properly unzip the archive.';
                        }
                    }

                    setTimeout(function() {
                        navigator.notification.alert(
                            errorString,
                            function() {}
                        );
                    }, 4000);
                }
            });
        }, 1000 );
    });
}

function onBuildSubmitError(message) {
    errorMessage('Error!');
    setTimeout(function() {
        message = message || 'Timed out!';
        errorMessage(message);
    }, 1500);

    setTimeout(function() {
        $('.monitor').removeClass('alert');
        updateMessage('');
        openBot();
    }, 3500);
}

function getAddressField() {
    var $address = $('#address'),
        address = $address.val() || $address.attr('placeholder');

    return address;
}

function getAddress(path) {
    var address = getAddressField();

    // default to http:// when no protocol exists
    address = (address.match(/^(.*:\/\/)/)) ? address : 'http://' + address;

    // append an optional path
    if (path) {
        address += '/' + path;

        // replace double forward slashes with a single forward-slash
        // except after the protocol (://)
        address = address.replace(/([^:])\/\//g, '$1/');
    }

    return address;
}

/*---------------------------------------------------
    Browser - Quirks
---------------------------------------------------*/

function supportBrowserQuirks() {
    // Issue #51
    // Windows Phone 8 does not support border-image
    if (/IEMobile\/10/.test(window.navigator.userAgent)) {
        var element = document.createElement('style');
        element.setAttribute('type', 'text/css');
        element.innerHTML = [
            '#bot .monitor .cover {',
            '   background-image: url(img/frame.png);',
            '   background-size: 270px 220px;',
            '   background-repeat: no-repeat;',
            '   border: none;',
            '}'
        ].join('\n');
        document.body.appendChild(element);
    }
}

})();
