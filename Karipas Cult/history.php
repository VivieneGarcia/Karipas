<?php

include_once 'db_connect.php';

if (isset($_SESSION['userID'])) {

    if (isset($_POST['history'])) {

        $userID = $_SESSION['userID'];

        $sql = "SELECT * FROM geocodes WHERE user_id = ?";
        $stmt = mysqli_prepare($conn, $sql);

        if ($stmt) {
            mysqli_stmt_bind_param($stmt, "d", $userID);
            mysqli_stmt_execute($stmt);
            $result = mysqli_stmt_get_result($stmt);

            if ($result) {

                echo "<h2>Geocodes History</h2>";
                echo "<button class='back-button' onclick='goBack()'>Go Back</button>";
                echo "<div id='history-container'>";
                
                while ($row = mysqli_fetch_assoc($result)) {
                    echo "<div class='history-entry'>";
                    echo "<c>Origin: " . $row['origin_address'] . "</c><br>";
                    echo "<c>Destination: " . $row['destination_address'] . "</c><br>";

                    // Button to re-route to this location
                    echo "<td><button class='route-again-btn' data-start-lat='{$row['start_latitude']}' data-start-lng='{$row['start_longitude']}' data-end-lat='{$row['end_latitude']}' data-end-lng='{$row['end_longitude']}'>Route Again</button></td>";
                    
                    echo "</div>";
                }

                echo "</div>";
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

<script>
    function goBack() {
        // Replace 'your_regular_page.php' with the actual page URL
        window.location.href = 'map.php';
    }
</script>

