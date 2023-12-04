<?php
// Include database connection
include_once 'db_connect.php';

// Check if the delete form is submitted
if (isset($_POST['submit'])) {
  var_dump($_POST);
    // Get email and password from the form
    $email = isset($_POST['email']) ? $_POST['email'] : '';
    $password = isset($_POST['password']) ? $_POST['password'] : '';

    // Check if the email and password are provided
    if (!empty($email) && !empty($password)) {
        // Check if the provided email matches a user in the database
        $checkUserSQL = "SELECT id, password FROM users WHERE email = ?";
        $stmtCheckUser = mysqli_prepare($conn, $checkUserSQL);

        if ($stmtCheckUser) {
            mysqli_stmt_bind_param($stmtCheckUser, "s", $email);
            mysqli_stmt_execute($stmtCheckUser);
            mysqli_stmt_store_result($stmtCheckUser);

            // If a matching user is found, verify the password and proceed with deletion
            if (mysqli_stmt_num_rows($stmtCheckUser) > 0) {
                mysqli_stmt_bind_result($stmtCheckUser, $userID, $hashedPassword);
                mysqli_stmt_fetch($stmtCheckUser);
                mysqli_stmt_close($stmtCheckUser);

                // Verify password
                if (password_verify($password, $hashedPassword)) {
                    // Start a transaction to ensure data consistency
                    mysqli_begin_transaction($conn);

                    // Delete user's history
                    $deleteHistorySQL = "DELETE FROM geocodes WHERE user_id = ?";
                    $stmtHistory = mysqli_prepare($conn, $deleteHistorySQL);

                    if ($stmtHistory) {
                        mysqli_stmt_bind_param($stmtHistory, "d", $userID);
                        mysqli_stmt_execute($stmtHistory);
                        mysqli_stmt_close($stmtHistory);
                    } else {
                      $message = "Error preparing history deletion SQL statement: " . mysqli_error($conn);
                      header('Location: register.php?message='.urlencode($message));
                        mysqli_rollback($conn);
                    }

                    // Delete the user
                    $deleteUserSQL = "DELETE FROM users WHERE id = ?";
                    $stmtUser = mysqli_prepare($conn, $deleteUserSQL);

                    if ($stmtUser) {
                        mysqli_stmt_bind_param($stmtUser, "d", $userID);
                        mysqli_stmt_execute($stmtUser);
                        mysqli_stmt_close($stmtUser);

                        // Commit the transaction after successful deletion
                        mysqli_commit($conn);

                        // Redirect or display a success message as needed
                        $message = "Account deleted successfully.";
                        header('Location: register.php?message='.urlencode($message));
                    } else {
                      $message = "Error preparing user deletion SQL statement: " . mysqli_error($conn);
                      header('Location: register.php?message='.urlencode($message));
                        mysqli_rollback($conn);
                    }
                } else {
                  $message = "Invalid password.";
                  header('Location: register.php?message='.urlencode($message));
                }
            } else {
              $message = "Invalid email.";
              header('Location: register.php?message='.urlencode($message));
            }
        } else {
          $message ="Error preparing user check SQL statement: " . mysqli_error($conn);
          header('Location: register.php?message='.urlencode($message));
        }
    } else {
      $message ="Email and password are required.";
      header('Location: register.php?message='.urlencode($message));
    }
}
?>
