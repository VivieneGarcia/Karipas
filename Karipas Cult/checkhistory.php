<?php
// Start the session
session_start();

// Check if the user is logged in
if (isset($_SESSION['userID'])) {
    // Connect to the database (replace with your database connection code)
    include_once 'db_connect.php';

    // Get user ID from the session
    $userID = $_SESSION['userID'];

    // Fetch user's geocodes history from the database
    $sql = "SELECT start_latitude, start_longitude, end_latitude, end_longitude, timestamp
            FROM geocodes
            WHERE user_id = ?
            ORDER BY timestamp DESC";
    $stmt = mysqli_prepare($conn, $sql);

    if ($stmt) {
        mysqli_stmt_bind_param($stmt, "d", $userID);
        mysqli_stmt_execute($stmt);
        mysqli_stmt_bind_result($stmt, $startLatitude, $startLongitude, $endLatitude, $endLongitude, $timestamp);

        // Display user's geocodes history
        while (mysqli_stmt_fetch($stmt)) {
            echo "<p>Start: ($startLatitude, $startLongitude)</p>";
            echo "<p>End: ($endLatitude, $endLongitude)</p>";
            echo "<p>Timestamp: $timestamp</p>";
            echo "<hr>";
        }

        mysqli_stmt_close($stmt);
    } else {
        echo "Error preparing SQL statement: " . mysqli_error($conn);
    }

    // Close the database connection (replace with your database connection closing code)
    mysqli_close($conn);
} else {
    // Redirect to the login page if the user is not logged in
    header("Location: login.php");
    exit();
}
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>User History</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
        }

        p {
            margin: 5px 0;
        }

        hr {
            margin: 10px 0;
        }
    </style>
</head>

<body>
    <h2>User Geocodes History</h2>
    <div id="userHistory">
        <!-- Geocodes history will be displayed here dynamically -->
    </div>
</body>

</html>
