<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Geocodes History</title>
    <style>
        table {
            border-collapse: collapse;
            width: 100%;
        }

        th, td {
            border: 1px solid black;
            padding: 8px;
            text-align: left;
        }
    </style>
</head>
<body>

<?php
// Start the session (if not already started)
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// Include the database connection file
include_once 'db_connect.php';

// Check if the user is logged in
if (isset($_SESSION['userID'])) {
    // Check if the "history" button is clicked
    if (isset($_POST['history'])) {
        // Get the user ID from the session
        $userID = $_SESSION['userID'];

        // Fetch geocodes history for the user from the database
        $sql = "SELECT * FROM geocodes WHERE user_id = ?";
        $stmt = mysqli_prepare($conn, $sql);

        if ($stmt) {
            mysqli_stmt_bind_param($stmt, "d", $userID);
            mysqli_stmt_execute($stmt);
            $result = mysqli_stmt_get_result($stmt);

            if ($result) {
                // Display the geocodes history
                echo "<h2>Geocodes History</h2>";
                echo "<table border='1'>";
                echo "<tr><th>Start Latitude</th><th>Start Longitude</th><th>End Latitude</th><th>End Longitude</th><th>Timestamp</th><th>Action</th></tr>";

                while ($row = mysqli_fetch_assoc($result)) {
                    echo "<tr>";
                    echo "<td>" . $row['start_latitude'] . "</td>";
                    echo "<td>" . $row['start_longitude'] . "</td>";
                    echo "<td>" . $row['end_latitude'] . "</td>";
                    echo "<td>" . $row['end_longitude'] . "</td>";
                    echo "<td>" . $row['timestamp'] . "</td>";
                    
                    // Button to route the coordinates again
                    echo "<td><button class='route-again-btn' data-start-lat='{$row['start_latitude']}' data-start-lng='{$row['start_longitude']}' data-end-lat='{$row['end_latitude']}' data-end-lng='{$row['end_longitude']}'>Route Again</button></td>";
                    
                    echo "</tr>";
                }

                echo "</table>";
            } else {
                echo "Error fetching geocodes history: " . mysqli_error($conn);
            }

            mysqli_stmt_close($stmt);
        } else {
            echo "Error preparing SQL statement: " . mysqli_error($conn);
        }
    }
} else {
    echo "User not logged in";
}

// Close the database connection
mysqli_close($conn);
?>

<!-- Correct the nested form tag -->
<form method="post" action="">
    <button type="submit" id="history" name="history" style="margin: 0 auto; display: block;">Check History</button>
</form>
<script src="try.js"></script>
<script>
    
    document.addEventListener('DOMContentLoaded', function () {
    const routeAgainButtons = document.querySelectorAll('.route-again-btn');

    routeAgainButtons.forEach(button => {
        button.addEventListener('click', function () {
            const startLat = this.dataset.startLat;
            const startLng = this.dataset.startLng;
            const endLat = this.dataset.endLat;
            const endLng = this.dataset.endLng;

            // Call the JavaScript function to handle routing with these coordinates
            routeAgain(startLat, startLng, endLat, endLng);
        });
    });

    async function routeAgain(startLat, startLng, endLat, endLng) {
        const startPinCoordinates = combineCoordinates(startLat, startLng);
        const endPinCoordinates = combineCoordinates(endLat, endLng);

        console.log('Combined Coordinates:', startPinCoordinates, endPinCoordinates);
        const startResult = await getGeocodeResult(startPinCoordinates);
        const endResult = await getGeocodeResult(endPinCoordinates);

        const startuserPin = {
            lat: startResult.geometry.coordinates[1],
            lng: startResult.geometry.coordinates[0],
        };

        const enduserPin = {
            lat: endResult.geometry.coordinates[1],
            lng: endResult.geometry.coordinates[0],
        };

        console.log("GEOCODED USER PIN:", startuserPin, enduserPin);

        // Call the function from try.js
        await compareAndDrawtheLines(startuserPin, enduserPin);
    }

    function combineCoordinates(lat, lng) {
        return [parseFloat(lng), parseFloat(lat)]; // Combine latitude and longitude
    }
});
</script>

</body>
</html>
