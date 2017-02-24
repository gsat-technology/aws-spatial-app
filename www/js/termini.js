

/* -- Setup -- */
var devMode = false;
var isMobile = false;

//check if user is using mobile device
if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
  isMobile = true;
}

//modal to explain what the site is about - only show on first view
if (!devMode && !localStorage.getItem('introduction')) {
  $('#instructionsModal').modal();
  localStorage.setItem('introduction', 'true');
}

//AWS
var identityPoolId = '{COGNITO_IDENTITY_POOL_ID}';
var region = '{AWS_REGION}';
url = '{API_GATEWAY_ENDPOINT}';

AWS.config.region = region;
var apigClient = null;
var stsExpire = null;


/* ---- Google/Cognito Sign In ----*/

var gUser = null;

//customise the google sign in button
function renderButton() {
  gapi.signin2.render('google-signin', {
    'scope': 'profile email',
    'width': 50,
    'height': 50,
    'longtitle': true,
    'theme': 'light',
    'onsuccess': onSignIn,
    'onfailure': onSignInFailure
  });
}

function onSignInFailure(error) {
  //console.log(error);
}


function onSignIn(googleUser) {
  console.log(googleUser);

  //toggle visibility of signin/out buttons
  $('#google-signin').addClass("google-button-hidden");
  $('#google-signout').removeClass("google-button-hidden");

  gUser = googleUser;

  initAWS();
}

function initAWS() {
  // Add the Google access token to the Cognito credentials login map.
  AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: identityPoolId,
    region: 'ap-southeast-2',
    Logins: {
       'accounts.google.com': gUser.getAuthResponse().id_token
    }
  });

  console.log(AWS.config.credentials);

  // Obtain AWS credentials
  AWS.config.credentials.get(function(){

    stsExpire = AWS.config.credentials.expireTime;

    var identityId = AWS.config.credentials.identityId;
    var accessKeyId = AWS.config.credentials.accessKeyId;
    var secretAccessKey = AWS.config.credentials.secretAccessKey;
    var sessionToken = AWS.config.credentials.sessionToken;

    apigClient = apigClientFactory.newClient({
     accessKey: accessKeyId,
     secretKey: secretAccessKey,
     sessionToken: sessionToken,
     region: region
    });
  });
}

function signOut() {

  $('#google-signout').addClass("google-button-hidden")
  $('#google-signin').removeClass("google-button-hidden")

  var auth2 = gapi.auth2.getAuthInstance();
  auth2.signOut().then(function () {
    //console.log('User signed out.');
    gUser = null;
    //AWS.config.credentials = null;
    apigClient = null;

    //clear anything on the map
    //programatically click the clear button
    $('#clear-control').click();
  });
}



/* ---- Google Maps ----*/

function initMap() {

  //position maps elements depending on viewer type
  var drawingToolsPosition;
  var customButtonsPosition;
  var showZoomControl;

  if (isMobile) {
    //mobile
    drawingToolsPosition = google.maps.ControlPosition.TOP_RIGHT;
    customButtonsPosition = google.maps.ControlPosition.TOP_RIGHT;
    showZoomControl = false;
  }
  else {
    //desktop
    drawingToolsPosition = google.maps.ControlPosition.TOP_CENTER;
    customButtonsPosition = google.maps.ControlPosition.TOP_CENTER;
    showZoomControl = true;
  }

  //create map
  var map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 10.0, lng: 73.0},
    zoom: 3,
    zoomControl: showZoomControl,
    streetViewControl: false,
    mapTypeControlOptions: {
      style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
      position: google.maps.ControlPosition.LEFT_BOTTOM
    }
  });


  function ClearControl(controlDiv, map) {

    // Set CSS for the control border.
    var controlUI = document.createElement('div');
    controlUI.id = 'clear-control';
    controlUI.style.backgroundColor = '#fff';
    controlUI.style.border = '2px solid #fff';
    controlUI.style.borderRadius = '3px';
    controlUI.style.boxShadow = '0 0.01px 4px rgba(0,0,0,.3)';
    controlUI.style.cursor = 'pointer';
    controlUI.style.marginBottom = '5px';
    controlUI.style.marginRight = '5px';
    controlUI.style.marginLeft = '5px';
    controlUI.style.marginTop = '5px';
    controlUI.style.textAlign = 'center';
    controlUI.title = 'Click to recenter the map';
    controlDiv.appendChild(controlUI);

    // Set CSS for the control interior.
    var controlText = document.createElement('div');
    controlText.style.color = 'rgb(146,146,146)';
    controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
    controlText.style.fontSize = '12px';
    controlText.style.lineHeight = '20px';
    controlText.style.paddingLeft = '5px';
    controlText.style.paddingRight = '5px';
    controlText.innerHTML = 'clear';
    controlUI.appendChild(controlText);

    //click event for clear.
    controlUI.addEventListener('click', function() {
      for (var i=0; i < markers.length; i++) {
        markers[i].setMap(null);
      }

      while(overlays[0])
      {
        overlays.pop().setMap(null);
      }
    });
  }

  var clearControlDiv = document.createElement('div');
  var clearControl = new ClearControl(clearControlDiv, map);
  clearControlDiv.index = 1;
  map.controls[customButtonsPosition].push(clearControlDiv);

  function InfoControl(controlDiv, map) {

    // Set CSS for the control border.
    var controlUI = document.createElement('div');
    controlUI.style.backgroundColor = '#fff';
    controlUI.style.border = '2px solid #fff';
    controlUI.style.borderRadius = '3px';
    controlUI.style.boxShadow = '0 0.01px 4px rgba(0,0,0,.3)';
    controlUI.style.cursor = 'pointer';
    controlUI.style.marginBottom = '5px';
    controlUI.style.marginTop = '5px';
    controlUI.style.textAlign = 'center';
    controlUI.title = 'info';
    controlDiv.appendChild(controlUI);

    // Set CSS for the control interior.
    var controlText = document.createElement('div');
    controlText.style.color = 'rgb(146,146,146)';
    controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
    controlText.style.fontSize = '12px';
    controlText.style.lineHeight = '20px';
    controlText.style.paddingLeft = '5px';
    controlText.style.paddingRight = '5px';
    controlText.innerHTML = 'info';
    controlUI.appendChild(controlText);

    //click event for clear.
    controlUI.addEventListener('click', function() {
      $('#instructionsModal').modal();
    });
  }

  var infoControlDiv = document.createElement('div');
  var infoControl = new InfoControl(infoControlDiv, map);
  infoControlDiv.index = 1;
  map.controls[customButtonsPosition].push(infoControlDiv);

  //keep reference to map markers, overlays
  var markers = [];
  var overlays = [];

  var drawingManager = new google.maps.drawing.DrawingManager({
    drawingMode: null,
    drawingControl: true,
    drawingControlOptions: {
      position:drawingToolsPosition,
      drawingModes: ['circle', 'polygon', 'rectangle']
    },
    markerOptions: {icon: 'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png'},
    rectangleOptions: {
      fillColor: '#e8fdff',
      fillOpacity: 0.3,
      strokeWeight: 1,
      clickable: false,
      editable: false,
      zIndex: 1
    },
    circleOptions: {
      fillColor: '#e8fdff',
      fillOpacity: 0.3,
      strokeWeight: 1,
      clickable: false,
      editable: false,
      zIndex: 1
    },
    polygonOptions: {
      fillColor: '#e8fdff',
      fillOpacity: 0.3,
      strokeWeight: 1,
      clickable: false,
      editable: false,
      zIndex: 1
    }
  });

  drawingManager.setMap(map);google.maps.event.addListener(drawingManager, 'overlaycomplete', function(event) {

    //shameless workaround to handle selections that span international dateline
    //returns true for bail-out and false for okay
    function hemisphere_check(shapetype, lngs) {

      //only need to process for polygon and rectangle
      if (shapetype == 'polygon' || shapetype == 'rectangle') {

        //first test is: are all longs in same hemisphere?
        east = [];
        west = [];

        for (var i=0; i < lngs.length; i++) {
          if(lngs[i] > 0) {
            west.push(lngs[i]);
          }
          else if(lngs[i] < 0) {
            east.push(lngs[i]);
          }
        }

        //all are in east or all are in west
        if (east.length > 0 && west.length > 0) {
          //at least one long is in different hemisphere

          //second test is: if some longs are in different
          //hemispheres, then are they closer to pm or intl date line?
          //near prime meridian
          near_pm = []

          for (var i=0; i < lngs.length; i++) {
            if (lngs[i] > -90 && lngs[i] < 90) {
              near_pm.push(lngs[i]);
            }
          }

          if (lngs.length == near_pm.length) {
            //all longitudes are closer to pm than intl date line (this is okay)
            return true;
          }
          else {
            return false;
          }
        }
        else {
          //all longs are in same hemisphere - this is okay
          return true;
        }
      }
    }

    if (gUser || devMode) {
      //user has signed into google

      //if supplied cogntio session token is expired, then APIG responds with 403
      // issue here is that it will not have a 'access-control-allow-origin' header
      // and the browser will throw error. Because this involves CORS, it can't
      // be caught in javascript so we need to try and not do a request where
      // token is expired by calling initAWS() again.

      if (Date.parse(stsExpire) <= Date.now() ) {
        initAWS();
      }

      var shapeType = event.type;
      var paramType = '';
      var paramValue = '';

      if (shapeType == 'rectangle') {

        var bounds = event.overlay.bounds;
        if (hemisphere_check(shapeType, [bounds.b.b, bounds.b.f])) {

          overlays.push(event.overlay);

          paramValue = [bounds.f.f, bounds.b.b, bounds.f.b, bounds.b.f].join();
          paramType = 'boundingBox';
        }
        else {
          //bail out of this query and remove the overlay
          event.overlay.setMap(null);
        }
      }
      else if (shapeType == 'circle') {
        var rad = (event.overlay.radius / 100000);
        overlays.push(event.overlay);

        paramType = 'circle';
        paramValue = [event.overlay.center.lat(), event.overlay.center.lng(), rad].join();
      }
      else if (shapeType == 'polygon') {
        var points = event.overlay.getPath().getArray();

        var latlngs = [];
        var lngs = [];

        for (var i=0; i < points.length; i++) {
          latlngs.push(points[i].lat() + ' ' + points[i].lng());
          lngs.push(points[i].lng());
        }

        if (hemisphere_check(shapeType, lngs)) {

          //keep reference to overlay
          overlays.push(event.overlay);

          //close off the end of the polygon with the first point
          //to fully enclose the shell
          latlngs.push(points[0].lat() + ' ' + points[0].lng())

          paramValue = latlngs.join()
          paramType = 'polygon';
        }
        else {
          event.overlay.setMap(null);
        }
      }

      //call ajaxRequestTermini (callback processes markers)
      ajaxRequestTermini(paramType, paramValue, function(result) {


        var marker, i
        var termini = result.termini;

        for( i = 0; i < result.count; i++ ) {

          latlngset = new google.maps.LatLng(termini[i]['latitude'], termini[i]['longitude']);

          var marker = new google.maps.Marker({
            map: map,
            title: termini[i]['id'].toString(),
            position: latlngset
          });

          //keep track of marker (so can delete later)
          markers.push(marker);

          var content = "<h4>" + termini[i]['name'] +  "</h4>" +
                        "<p>" + termini[i]['city'] + ", " + termini[i]['country'] + "</p>" +
                        "<p>type: " + termini[i]['type'] + "</p>";

          var infowindow = new google.maps.InfoWindow();

          google.maps.event.addListener(marker,'click', (function(marker,content,infowindow){
            return function() {
              infowindow.setContent(content);
              infowindow.open(map,marker);
            };
          })(marker,content,infowindow));
        }
      });

    } //if google_profile
    else {
      event.overlay.setMap(null);
      $('#signinNotificationModal').modal();
    }

    //set back to grabber tool each time
    drawingManager.setDrawingMode(null);
  });
} //initMap() included drawing events


/* -- Ajaxey stuff --*/
function ajaxRequestTermini(paramType, paramValue, cb) {

  var params = {};
  var body = {};

  var q_params;

  if (paramType == 'boundingBox') {
    q_params = {boundingBox: paramValue}
  }
  else if (paramType == 'circle') {
    q_params = {circle: paramValue}
  }
  else if (paramType == 'polygon') {
    q_params = {polygon: paramValue}
  }

  var additionalParams = {
    queryParams: q_params
  }

  apigClient.terminiGet(params, body, additionalParams)
    .then(function(result){
      //it appears that we catch 2xx codes here
      //callback with response data
      if (!("termini" in result.data) ) {
          //discard - not the response we need
      }
      else {
        //all good
        cb(result.data);
      }
    }).catch( function(result){
      //it appears that we catch 4xx and 5xx codes here
      if (result.status == 403) {
        //403 possibly caused by cognito token expiry
        //let's just sign out the user for now
        signOut();
        $('#signedoutNotificationModal').modal();
      }
  });
}
