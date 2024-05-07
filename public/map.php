<?php
// Assume this is at the beginning of your PHP file
session_start();

// Check if the user is logged in
if (isset($_SESSION['user_id'])) {
    $loggedInUser = $_SESSION['user_id'];
    $mysqli = require "../src/dtbconnect.php";
    
    $sql = "SELECT * FROM users
            WHERE id = {$_SESSION["user_id"]}";
            
    $result = $mysqli->query($sql);
    
    $user = $result->fetch_assoc();
    $loggedInUserName = $user["username"];
    $userID = $user["id"];
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
<?php
// Access data from URL query string
$name = isset($_GET['name']) ? $_GET['name'] : "";
$longitude = isset($_GET['longitude']) ? $_GET['longitude'] : "";
$latitude = isset($_GET['latitude']) ? $_GET['latitude'] : "";

// Generate HTML content with dynamic data
$html = "";
$html .= '<div id="longtitude" data-target-longtitude="' . $longitude . '"></div>';
$html .= '<div id="latitude" data-target-latitude="' . $latitude . '"></div>';
$html .= '<div id="name" data-target-name="' . $name . '"></div>';

echo $html;
?>
<!DOCTYPE html>
<html>
<head>
    <title>Karipas Map</title>
    
    <link rel="stylesheet" href="../css/style.css" />
    <!-- Direction API-->
    <script src="https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-directions/v4.1.0/mapbox-gl-directions.js"></script>
    <link rel="stylesheet" href="https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-directions/v4.1.0/mapbox-gl-directions.css">
    <!-- Mapbox Map-->
    <script src='https://api.tiles.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.js'></script>
    <link href='https://api.tiles.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.css' rel='stylesheet' />
    <!-- Geocoder_Search -->
    <script src="https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/v5.0.0/mapbox-gl-geocoder.min.js"></script>
    <link rel="stylesheet" href="https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/v5.0.0/mapbox-gl-geocoder.css" type="text/css">
    <link rel="stylesheet" href="../css/mapstyles.css" />
    <script type="module" src="../js/mapFeature.js"></script>
</head>
<body>
    <header>
        <nav>
            <div class = "logo"> KARIPAS </div>
            <div class = "nav-links"> <ul>
                <li> <a href="index.php"> HOME </a></li>
                <li> <a href="map.php"> MAP </a></li>
                <li> <a href="jeeps.html"> JEEPS </a></li>
            </ul></div>
        </nav>
    </header>

    <section class="layout">
        <div class="sidebar">
                <?php
                if ($loggedInUser) {
                    echo "<p>Logged in as: $loggedInUserName</p>";
                    echo '<form method="post" id = "loggedInOrNot1">
                    <button type="submit" id="logoutButton" name="logout" style=margin: 0 auto; display: block;">Logout</button>
                    <form method="post" action=""><button type="submit" id="history" name="history" style="margin: 0 auto; display: block;">Check History</button></form>
                  </form>';
                  include '../src/history.php';
                } else {
                    echo "<p>You are not logged in</p>";
                }
                ?>
            <button id="setStart">Pin Origin</button>
            <button id="setEnd">Pin Destination</button>
            <button id="final">Search Jeep</button>
            <button id="refresh" onclick="refresh()">Restart</button>
            <div  id="OriginDestinationContainer">
            <div id="popAddress-start" style="display: none;"><p>Origin: <span id="addressText-start"></span></p></div>
            <div id="popAddress-end" style="display: none;"><p>Destination: <span id="addressText-end"></span></p></div>
            </div>  
            <div id="noJeepFound" style="display: none;">(✖﹏✖) ERROR. We couldn't find any jeepneys on your route. Try again? </div>

            <k id='jeepsAvailable' style="display: none;">JEEPS AVAILABLE: </k>
            
            <boom id='reminder' style="display: none;">Use the color guide for reference.</boom>
            <div style="display: none;" class="box-container" id="resultsContainer"></div>
            
    
            <form id="saveGeocodeForm" action="../src/savegeocode.php" method="post">
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
const targetName = document.getElementById("name").dataset.targetName;
const longitude = document.getElementById("longtitude").dataset.targetLongtitude;
const latitude = document.getElementById("latitude").dataset.targetLatitude;

function refresh() {
    document.getElementById(`OriginDestinationContainer`).style.display = "none";
    window.location.href = "map.php";

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