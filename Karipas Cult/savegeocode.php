<?php
session_start();

// Connect to database
include_once 'db_connect.php';

// Check if the user is logged in
if (isset($_SESSION['userID'])) {
    // Extract geocodes and user ID from the POST request
    if (isset($_POST['submit'])) {
        $startLatitude = isset($_POST['startLatitude']) ? $_POST['startLatitude'] : null;
        $startLongitude = isset($_POST['startLongitude']) ? $_POST['startLongitude'] : null;
        $endLatitude = isset($_POST['endLatitude']) ? $_POST['endLatitude'] : null;
        $endLongitude = isset($_POST['endLongitude']) ? $_POST['endLongitude'] : null;

        // Validate inputs (you can add more specific validation as needed)
        if ($startLatitude !== null && $startLongitude !== null && $endLatitude !== null && $endLongitude !== null) {
            // Assuming you have the user ID in your session
            $userID = $_SESSION['userID'];

            // Save geocodes and timestamp to the database
            $sql = "INSERT INTO geocodes (user_id, start_latitude, start_longitude, end_latitude, end_longitude, timestamp)
                    VALUES (?, ?, ?, ?, ?, NOW())";
            $stmt = mysqli_prepare($conn, $sql);

            if ($stmt) {
                mysqli_stmt_bind_param($stmt, "ddddd", $userID, $startLatitude, $startLongitude, $endLatitude, $endLongitude);
                mysqli_stmt_execute($stmt);

                if (mysqli_stmt_affected_rows($stmt) > 0) {
                    // Use JavaScript to display a pop-up alert and redirect to map.php
                    echo "<script>alert('GEOCODES SUCCESSFULLY STORED'); window.location.href = 'map.php';</script>";
                } else {
                    // Use JavaScript to display a pop-up alert and redirect to map.php
                    echo "<script>alert('Error saving geocodes'); window.location.href = 'map.php';</script>";
                }
                mysqli_stmt_close($stmt);
            } else {
                // Use JavaScript to display a pop-up alert and redirect to map.php
                echo "<script>alert('Error preparing SQL statement: " . mysqli_error($conn) . "'); window.location.href = 'map.php';</script>";
            }
        } else {
            // Use JavaScript to display a pop-up alert and redirect to map.php
            echo "<script>alert('Invalid geocodes received'); window.location.href = 'map.php';</script>";
        }
    } else {
        // Use JavaScript to display a pop-up alert and redirect to map.php
        echo "<script>alert('No submit data received'); window.location.href = 'map.php';</script>";
    }
} else {
    // Use JavaScript to display a pop-up alert and redirect to map.php
    echo "<script>alert('User not logged in'); window.location.href = 'map.php';</script>";
}
?>
