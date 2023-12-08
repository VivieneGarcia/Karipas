<?php
// Assume this is at the beginning of your PHP file
session_start();

// Check if the user is logged in
if (isset($_SESSION['username'])) {
    $loggedInUser = $_SESSION['username'];
    $saveButtonDisplay = '';
    // Use $loggedInUser to display information about the logged-in user
} else {
    // User is not logged in
    $loggedInUser = null;
    $userID = null;
    $saveButtonDisplay = 'style="display: none;"';
    
}

// Function to logout
function logout() {
    // Unset all session variables
    $_SESSION = array();

    // Destroy the session
    session_destroy();

    // Redirect to the login page or any other page you prefer
    header('Location: map.php');
    exit();
}

// Check if the logout button is clicked
if (isset($_POST['logout'])) {
    logout();
}

?>
<!DOCTYPE html>
<html>
<head>
    <title>Karipas Map</title>
    
    <link rel="stylesheet" href="style.css" />
    <!-- Direction API-->
    <script src="https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-directions/v4.1.0/mapbox-gl-directions.js"></script>
    <link rel="stylesheet" href="https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-directions/v4.1.0/mapbox-gl-directions.css">
    <!-- Mapbox Map-->
    <script src='https://api.tiles.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.js'></script>
    <link href='https://api.tiles.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.css' rel='stylesheet' />
    <!-- Geocoder_Search -->
    <script src="https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/v5.0.0/mapbox-gl-geocoder.min.js"></script>
    <link rel="stylesheet" href="https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/v5.0.0/mapbox-gl-geocoder.css" type="text/css">
    <link rel="stylesheet" href="style.css" />
    <script type="module" src="try.js"></script>

</head>

<nav id='menu'>
    <input type='checkbox' id='responsive-menu' onclick='updatemenu()'><label></label>
    <ul>
      <li><a href='home.html'>KARIPAS</a></li>
      <li><a href='register.php'>Login</a></li> 
      <li><a href='map.php'>Map</a></li>
      <li><A href='jeeps.html'>Jeeps</a><li> <!-- FOR EXRTA LANG TO-->
    </ul>
  </nav> 
<body>

    <section class="layout">
        <div class="sidebar">
        <k>KARIPAS</k>
                <?php
                if ($loggedInUser) {
                    echo "<p>Logged in as: $loggedInUser</p>";
                    echo '<form method="post" id = "loggedInOrNot1">
                    <button type="submit" id="logoutButton" name="logout" style=margin: 0 auto; display: block;">Logout</button>
                    <form method="post" action=""><button type="submit" id="history" name="history" style="margin: 0 auto; display: block;">Check History</button></form>
                  </form>';
                  include 'history.php';
                } else {
                    echo "<p>YOU ARE NOT LOGGED IN.</p>";
                }
                ?>
            
             <button id="setStart">Pin Origin</button>
            <button id="setEnd">Pin Destination</button>
            <button id="final">Search Jeep</button>
            <button id="refresh" onclick="refresh()">Restart</button>
            

            <div id="messages" style="display: none;"><p id="message"></p></div>
            <div id="popupstart"><p></p></div>

            <div id="popAddress-start"><p>Origin Address: <span id="addressText-start"></span></p></div>
            <div id="popAddress-end"><p>Destination Address: <span id="addressText-end"></span></p></div>  

            <k id='jeepsAvailable' style="display: none;">JEEPS AVAILABLE: </k>
            <boom id='reminder' style="display: none;">Use the color guide for reference.</boom>
            <div style="display: none;" class="box-container" id="resultsContainer"></div>
            
    
            <form id="saveGeocodeForm" action="savegeocode.php" method="post">
                <input type="hidden" id="startLatitude" name="startLatitude" value="">
                <input type="hidden" id="startLongitude" name="startLongitude" value="">
                <input type="hidden" id="endLatitude" name="endLatitude" value="">
                <input type="hidden" id="endLongitude" name="endLongitude" value="">
                <input type="hidden" id="originAddress" name="originAddress" value="">
                <input type="hidden" id="destinationAddress" name="destinationAddress" value="">
                <?php
                if ($loggedInUser) {
                    echo ' <button type="submit" name="submit" id="saveGeocodesButton" style="display: none;">Save Pins</button>';
                } else {
                    echo " ";
                }
                ?>
            </form>
        </div>
        <div class="body">
            <div id="map"></div>
            </div>
    </section>
</body>

<script> 

function refresh() {
    window.location.reload(true);
}

function logout() {
    localStorage.setItem('isLoggedIn', 'false');
    localStorage.removeItem('username');
    window.location.reload(); // Refresh the page after logout
}

function showSuccessMessage(message) {
    document.getElementById('successText').textContent = message;
    document.getElementById('successMessage').style.display = 'block';
}

</script>
</html>