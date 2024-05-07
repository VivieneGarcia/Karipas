<?php 
session_start();
echo '<script>var sessionId = "' . session_id() . '";</script>';
echo $_SESSION["user_id"];
?>

<script src="../js/confirmInfo.js"></script>

<?php
header("Location: ../public/index.php");
?>
