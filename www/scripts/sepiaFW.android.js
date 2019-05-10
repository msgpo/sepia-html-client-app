//Interface for Android-Only functions

function sepiaFW_build_android(){
    var Android = {};

    //Collection of apps and their packages
    Android.musicApps = {
        "system": {name: "System", package: ""},
        "select": {name: "Select", package: ""},
        "spotify": {name: "Spotify", package: "com.spotify.music"},
        "youtube": {name: "YouTube", package: "com.google.android.youtube"},
        "apple_music": {name: "Apple Music", package: "com.apple.android.music"},
        "amazon_music": {name: "Amazon Music", package: "com.amazon.mp3"},
        "soundcloud": {name: "SoundCloud", package: "com.soundcloud.android"},
        "deezer": {name: "Deezer", package: "deezer.android.app"},
        "vlc_media_player": {name: "VLC", package: "org.videolan.vlc"}
    }
    var defaultMusicApp = "System";

    Android.setDefaultMusicApp = function(appTag){
        if (Android.musicApps[appTag]){
            defaultMusicApp = appTag;
            SepiaFW.data.set('androidDefaultMusicApp', appTag);
            SepiaFW.debug.info("Android default music app is set to " + appTag);
        }else{
            SepiaFW.debug.error("Android app-name not found in list: " + appTag);
        }
    }
    Android.getDefaultMusicApp = function(){
        return defaultMusicApp;
    }
    Android.getDefaultMusicAppPackage = function(){
        var app = Android.musicApps[defaultMusicApp];
        if (app){
            return app.package;
        }else{
            return "";
        }
    }

    //Get music app selector
    Android.getMusicAppSelector = function(){
        var selector = document.getElementById('sepiaFW-menu-select-music-app') || document.createElement('select');
        selector.id = 'sepiaFW-menu-select-music-app';
        $(selector).find('option').remove();
        //fill
        Object.keys(Android.musicApps).forEach(function(appTag){
            var option = document.createElement('option');
            option.value = appTag;
            option.innerHTML = Android.musicApps[appTag].name;
            selector.appendChild(option);
            if (appTag == defaultMusicApp){
                option.selected = true;
            }
        });
        //add button listener
        $(selector).off().on('change', function() {
            Android.setDefaultMusicApp($('#sepiaFW-menu-select-music-app').val());
        });
        return selector;
    }
    
    //Broadcast a MEDIA_BUTTON event
    Android.broadcastMediaButtonIntent = function(action, code){
        //Android intent broadcast to stop all media
        Android.intentBroadcast({
            action: "android.intent.action.MEDIA_BUTTON",
            extras: {
                "android.intent.extra.KEY_EVENT": JSON.stringify({
                    "action": action, 
                    "code": code
                })
            }
        });
        /*
        0: KeyEvent.ACTION_DOWN
        1: KeyEvent.ACTION_UP
        85: KEYCODE_MEDIA_PLAY_PAUSE
        */
    }

    //Music search via Android Intent
    Android.startMusicSearchActivity = function(controlData, allowSpecificService){
        //Android Intent music search
        if (SepiaFW.ui.isAndroid && controlData){
            var intentAction = "android.media.action.MEDIA_PLAY_FROM_SEARCH";
            var extraKeyFocus = "android.intent.extra.focus";
            var extraFocusValArtist = "vnd.android.cursor.item/artist";     //MediaStore.Audio.Artists.ENTRY_CONTENT_TYPE
            var extraFocusValGenre = "vnd.android.cursor.item/genre";       //MediaStore.Audio.Genres.ENTRY_CONTENT_TYPE
            var extraFocusValTitle = "vnd.android.cursor.item/audio";       //title
            var extraFocusValPlaylist = "vnd.android.cursor.item/playlist"; //MediaStore.Audio.Playlists.ENTRY_CONTENT_TYPE
            var extraFocusValAlbum = "vnd.android.cursor.item/album";       //MediaStore.Audio.Albums.ENTRY_CONTENT_TYPE
            var extraFocusValUnstructured = "vnd.android.cursor.item/*";    //unstructured
            var extraFocusValAny = "vnd.android.cursor.item/*";             //any
            var extraKeyArtist = "android.intent.extra.artist";
            var extraKeyGenre = "android.intent.extra.genre";
            var extraKeyAlbum = "android.intent.extra.album";
            var extraKeyTitle = "android.intent.extra.title";
            var extraKeyPlaylist = "android.intent.extra.playlist";
            var extraKeyQuery = "query";                                    //SearchManager.QUERY
            //Common
            var data = {
                action: intentAction,
                extras: {}
            };
            //Focus: Playlist
            if (controlData.playlist){
                data.extras[extraKeyFocus] = extraFocusValPlaylist;
                data.extras[extraKeyPlaylist] = controlData.playlist;
                data.extras[extraKeyQuery] = controlData.playlist;
                if (controlData.artist) data.extras[extraKeyArtist] = controlData.artist;
                if (controlData.album)  data.extras[extraKeyAlbum] = controlData.album;
                if (controlData.song)   data.extras[extraKeyTitle] = controlData.song;
                if (controlData.genre)  data.extras[extraKeyGenre] = controlData.genre;
            //Focus: Song (with Album)
            }else if (controlData.song && controlData.album){
                data.extras[extraKeyFocus] = extraFocusValTitle;
                data.extras[extraKeyTitle] = controlData.song;
                data.extras[extraKeyAlbum] = controlData.album;
                data.extras[extraKeyQuery] = controlData.album + " " + controlData.song;
                if (controlData.artist) data.extras[extraKeyArtist] = controlData.artist;
                if (controlData.genre)  data.extras[extraKeyGenre] = controlData.genre;
            //Focus: Song (with Artist)
            }else if (controlData.song && controlData.artist){
                data.extras[extraKeyFocus] = extraFocusValTitle;
                data.extras[extraKeyTitle] = controlData.song;
                data.extras[extraKeyArtist] = controlData.artist;
                data.extras[extraKeyQuery] = controlData.artist + " " + controlData.song;
                if (controlData.genre)  data.extras[extraKeyGenre] = controlData.genre;
            //Focus: Album
            }else if (controlData.album){
                data.extras[extraKeyFocus] = extraFocusValAlbum;
                data.extras[extraKeyAlbum] = controlData.album;
                if (controlData.artist){
                    data.extras[extraKeyArtist] = controlData.artist;
                    data.extras[extraKeyQuery] = controlData.artist + " " + controlData.album;
                }else{
                    data.extras[extraKeyQuery] = controlData.album;
                }
            //Focus: Artist
            }else if (controlData.artist){
                data.extras[extraKeyFocus] = extraFocusValArtist;
                data.extras[extraKeyArtist] = controlData.artist;
                data.extras[extraKeyQuery] = controlData.artist;
                if (controlData.genre)  data.extras[extraKeyGenre] = controlData.genre;
            //Focus: Genre
            }else if (controlData.genre){
                data.extras[extraKeyFocus] = extraFocusValGenre;
                data.extras[extraKeyGenre] = controlData.genre;
                data.extras[extraKeyQuery] = controlData.genre;
            //Focus: unstructured search (this also applies if we have only a song given)
            }else if (controlData.search){
                data.extras[extraKeyFocus] = extraFocusValUnstructured;
                data.extras[extraKeyQuery] = controlData.search;
            //Focus: play anything
            }else{
                data.extras[extraKeyFocus] = extraFocusValAny;
                data.extras[extraKeyQuery] = "";
            }

            //Add a specific service via package?
            if (allowSpecificService && controlData.service){
                var app = Android.musicApps[controlData.service];
                if (app){
                    data.package = app.package;
                }
            }else{
                var defaultApp = Android.getDefaultMusicApp();
                if (defaultApp && defaultApp.name == "select"){
                    data.chooser = "Select App";
                }else if (defaultApp.package){
                    data.package = defaultApp.package;
                }
            }

            //Call activity
            Android.intentActivity(data);

            //TODO: we don't know if the action succeeds :-( so we cannot send a message if it fails

        }else{
            SepiaFW.debug.error("Android music search - Missing support or data!");
        }
    }

    //Android Intent access
    Android.intentActivity = function(data, successCallback, errorCallback){
        if (data.action && ("plugins" in window) && window.plugins.intentShim){
            //TODO: what about safety here? Should we do a whitelist?
            var dataObj = {
                action: data.action
            }
            if (data.extras) dataObj.extras = data.extras;
            if (data.url) dataObj.url = data.url;
            if (data.package) dataObj.package = data.package;
            if (data.chooser) dataObj.chooser = data.chooser;       //chooser: "Select application to share"
            window.plugins.intentShim.startActivity(dataObj, function(intent){
                SepiaFW.debug.log("Sent Android Activity-Intent '" + data.action);
                if (successCallback) successCallback(intent);
            }, function(info){
                androidIntentFail(data, info, errorCallback)
            });
        }
    }
    Android.intentBroadcast = function(data, successCallback, errorCallback){
        if (data.action && ("plugins" in window) && window.plugins.intentShim){
            //TODO: what about safety here? Should we do a whitelist?
            var dataObj = {
                action: data.action
            }
            if (data.extras) dataObj.extras = data.extras;
            if (data.url) dataObj.url = data.url;
            window.plugins.intentShim.sendBroadcast(dataObj, function(intent){
                SepiaFW.debug.log("Sent Android Broadcast-Intent '" + data.action);
                if (successCallback) successCallback(intent);
            }, function(info){
                androidIntentFail(data, info, errorCallback)
            });
        }
    }
    function androidIntentFail(data, info, errorCallback){
        var infoString = "undefined";
        if (info && typeof info == "object"){
            infoString = JSON.stringify(info);
        }else if (info && typeof info == "string"){
            infoString = info;
        }
        var msg = "Tried to call Android Intent '" + data.action + "' and failed with msg: " + infoString;
        SepiaFW.debug.error(msg);
        SepiaFW.ui.showInfo(msg);
        if (errorCallback) errorCallback(info);
    }

    return Android;
}