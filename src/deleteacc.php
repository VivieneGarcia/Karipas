<?php
session_start();

if (!isset($_SESSION["user_id"])) {
    header("Location: log-in.php");
    exit;
}

$is_invalid = false;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $mysqli = require __DIR__ . "/dtbconnect.php";

    $password = $_POST["password"];
    $user_id = $_SESSION["user_id"];

    $sql = "SELECT * FROM users WHERE id = ?";

    if ($stmt = $mysqli->prepare($sql)) {
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();

        if ($user && password_verify($password, $user["password_hash"])) {

            $delete_sql = "DELETE FROM users WHERE id = ?";
            if ($delete_stmt = $mysqli->prepare($delete_sql)) {
                $delete_stmt->bind_param("i", $user_id);
                $delete_stmt->execute();


                session_unset();
                session_destroy();

                echo "Account deleted successfully.";
                header("Location:homepage.php");
                exit;
            } else {
                $is_invalid = true;
                echo "Error deleting account: " . $mysqli->error;
            }
        } else {
            $is_invalid = true;
            echo "Invalid password";
        }
    } else {
        $is_invalid = true;
        echo "Database error: " . $mysqli->error;
    }
}
?>
