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
      <li><a href='home.html'>Home</a></li>
      <li><a href='register.php'>Login</a></li> 
      <li><a href='map.php'>Map</a></li>
      <li><A href='jeeps.html'>Jeeps</a><li> <!-- FOR EXRTA LANG TO-->
    </ul>
  </nav> 
<body>

    <section class="layout">
        <div class="sidebar"> 
            <h2>Karipas!</h2>
            <div id="loggedInOrNot1">
                <?php
                if ($loggedInUser) {
                    echo "<p>Logged in as: $loggedInUser</p>";
                    echo '<form method="post"><button type="submit" id="logoutButton" name="logout">Logout</button></form>';
                    echo '<button type="submit" id="history" name="history">CheckHistory</button>';
                } else {
                    echo "Not logged in";
                }
                ?>
            </div>
            
            <button id="setStart">Pin Origin</button> 
            <button id="setEnd">Pin Destination</button>
            <button id="final">Search Jeep</button>
            <button id="refresh" onclick = "refresh()">Refresh</button> 
            
            <div id="successMessage" style="display: none;">
                <p id="successText"></p>
            </div>
            <div id="popupstart"><p></p></div>

            <div id="popAddress-start">
                <p>Origin Address: <span id="addressText-start"></span></p>
            </div>
            <div id="popAddress-end">
                <p>Destination Address: <span id="addressText-end"></span></p>
            </div>  

            <p>Closest Route: <span id="closestRoute"></span></p>
            <p style="display: none;">Direction:</p>
            <p style="display: none;">Route: <span id="route"></span></p>
            <p style="display: none;">Distance: <span id="distance"></span></p>
            <p style="display: none;">Total Time: <span id="time"></span></p>


            <form id="saveGeocodeForm" action="savegeocode.php" method="post">
                <input type="hidden" id="startLatitude" name="startLatitude" value="">
                <input type="hidden" id="startLongitude" name="startLongitude" value="">
                <input type="hidden" id="endLatitude" name="endLatitude" value="">
                <input type="hidden" id="endLongitude" name="endLongitude" value="">
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
