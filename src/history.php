<?php

include_once 'dtbconnect.php';

if (isset($_SESSION['user_id'])) {

    if (isset($_POST['history'])) {

        $userID = $_SESSION['user_id'];

        $sql = "SELECT * FROM geocodes WHERE user_id = ?";
        $stmt = mysqli_prepare($mysqli, $sql);

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
                    echo "<l>=======================================</l>";
                    echo $row['id'];
                    echo "<c>Origin: " . $row['origin_address'] . "</c><br>";
                    echo "<d>Destination: " . $row['destination_address'] . "</d><br>";

                    echo "<td><button class='route-again-btn' data-start-lat='{$row['start_latitude']}' data-start-lng='{$row['start_longitude']}' data-end-lat='{$row['end_latitude']}' data-end-lng='{$row['end_longitude']}'>Route Again</button></td>";
                    
                    echo "</div>";
                }
                echo "<l>=======================================</l>";
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
        window.location.href = '../public/map.php';
    }
</script>

