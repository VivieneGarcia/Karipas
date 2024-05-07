<?php
session_start();

if (!isset($_SESSION["user_id"])) {
    header("Location: log-in.php");
    exit;
}

$is_invalid = false;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $mysqli = require __DIR__ . "/dtbconnect.php";

    $new_value = $mysqli->real_escape_string($_POST["new_value"]);
    $password = $_POST["password"];
    $field_to_update = $_POST["field_to_update"];

    $user_id = $_SESSION["user_id"];
    $sql = "SELECT * FROM users WHERE id = ?";

    if ($stmt = $mysqli->prepare($sql)) {
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();

        if ($user && password_verify($password, $user["password"])) {
            switch ($field_to_update) {
                case 'username':
                    $update_sql = "UPDATE users SET username = ? WHERE id = ?";
                    break;
                case 'firstname':
                    $update_sql = "UPDATE users SET first_name = ? WHERE id = ?";
                    break;
                case 'lastname':
                    $update_sql = "UPDATE users SET last_name = ? WHERE id = ?";
                    break;
                default:
                    $is_invalid = true;
                    break;
            }

            if (!$is_invalid) {
                if ($update_stmt = $mysqli->prepare($update_sql)) {
                    $update_stmt->bind_param("si", $new_value, $user_id);
                    $update_stmt->execute();
                    header("Location: ../public/viewaccount.php");
                    exit;
                } else {
                    $is_invalid = true;
                }
            }
        } else {
            $is_invalid = true;
            header("Location: ../public/viewaccount.php");
            echo('<script type="text/javascript">showInvalidPopup()</script>');
        }
    } else {
        $is_invalid = true;
    }
}
?>
