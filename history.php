<?php
session_start();

// Connect to the database
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
                echo "<tr><th>Start Latitude</th><th>Start Longitude</th><th>End Latitude</th><th>End Longitude</th><th>Timestamp</th></tr>";

                while ($row = mysqli_fetch_assoc($result)) {
                    echo "<tr>";
                    echo "<td>" . $row['start_latitude'] . "</td>";
                    echo "<td>" . $row['start_longitude'] . "</td>";
                    echo "<td>" . $row['end_latitude'] . "</td>";
                    echo "<td>" . $row['end_longitude'] . "</td>";
                    echo "<td>" . $row['timestamp'] . "</td>";
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
?>
