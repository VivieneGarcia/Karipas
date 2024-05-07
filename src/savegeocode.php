<?php
session_start();

// Connect to database
include_once 'dtbconnect.php';

// Check if the user is logged in
if (isset($_SESSION['user_id'])) {
    // Extract geocodes and user ID from the POST request
    if (isset($_POST['submit'])) {
        $startLatitude = isset($_POST['startLatitude']) ? $_POST['startLatitude'] : null;
        $startLongitude = isset($_POST['startLongitude']) ? $_POST['startLongitude'] : null;
        $endLatitude = isset($_POST['endLatitude']) ? $_POST['endLatitude'] : null;
        $endLongitude = isset($_POST['endLongitude']) ? $_POST['endLongitude'] : null;
        $originAddress = isset($_POST['originAddress']) ? $_POST['originAddress'] : null;
        $destinationAddress = isset($_POST['destinationAddress']) ? $_POST['destinationAddress'] : null;

        if ($startLatitude !== null && $startLongitude !== null && $endLatitude !== null && $endLongitude !== null && $destinationAddress !==null && $originAddress!==null) {
            // Assuming you have the user ID in your session
            $userID = $_SESSION['user_id'];

            // Save geocodes and timestamp to the database
            $sql = "INSERT INTO geocodes (user_id, start_latitude, start_longitude, end_latitude, end_longitude, origin_address, destination_address, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())";
    

            $stmt = mysqli_prepare($mysqli, $sql);

            if ($stmt) {
                mysqli_stmt_bind_param($stmt, "dddddss", $userID, $startLatitude, $startLongitude, $endLatitude, $endLongitude, $originAddress, $destinationAddress);


                mysqli_stmt_execute($stmt);

                if (mysqli_stmt_affected_rows($stmt) > 0) {
                    echo "<script>alert('GEOCODES SUCCESSFULLY STORED'); window.location.href = '../public/map.php';</script>";
                } else {
                    echo "<script>alert('Error saving geocodes'); window.location.href = '../public/map.php';</script>";
                }
                mysqli_stmt_close($stmt);
            } else {
                // Use JavaScript to display a pop-up alert and redirect to map.php
                echo "<script>alert('Error preparing SQL statement: " . mysqli_error($mysqli) . "'); window.location.href = 'map.php';</script>";
            }
        } else {

            echo "<script>alert('Invalid geocodes received'); window.location.href = '../public/map.php';</script>";
        }
    } else {

        echo "<script>alert('No submit data received'); window.location.href = '../public/map.php';</script>";
    }
} else {

    echo "<script>alert('User not logged in'); window.location.href = '../public/map.php';</script>";
}
?>
