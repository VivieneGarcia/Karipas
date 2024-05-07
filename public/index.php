<?php 
session_start();

if (isset($_SESSION["user_id"])) {
    
    $mysqli = require "../src/dtbconnect.php";
    
    $sql = "SELECT * FROM users
            WHERE id = {$_SESSION["user_id"]}";
            
    $result = $mysqli->query($sql);
    
    $user = $result->fetch_assoc();
}

include '../variables.php'
?>
<?php
// Include the script to fetch tourist spots
include '../src/touristSpots.php';
?>


<!DOCTYPE html>
<html lang="en">
<head>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@100;400;500;800&family=Poppins:wght@300&display=swap" rel="stylesheet">
    <title>Karipas: Your Batangueno Transport Partner!</title>
    <link rel="stylesheet" href="../css/style.css">
    <link href="https://api.mapbox.com/mapbox-gl-js/v3.0.0/mapbox-gl.css" rel="stylesheet">
    <script src="https://api.mapbox.com/mapbox-gl-js/v3.0.0/mapbox-gl.js"></script>
    <script src="https://code.jquery.com/jquery-3.6.4.min.js"></script>
    <script type="module" src="../js/mapFeature.js"></script>
    
<body>

    <!-- header: logo + links-->
    <header>
        <nav>
            <div class = "logo"> KARIPAS <!--<img src="images/logokari.png">--> </div>
            <div class = "nav-links"> <ul>
                <li> <a href="#home"> HOME </a></li>
                <li> <a href="#about"> ABOUT </a></li>
                <li> <a href="map.php"> MAP </a></li>
                <li id="logInLink"> <a> LOG IN </a></li>
            </ul></div>
        </nav>
    </header>

    <!-- home: ask destination from user-->
    <section>
        <div class = "home" id = "home">

            <!-- log in pop-up: ask log-in details from the user -->
            <div class="form-popup" id="logForm">
                <form action="../src/log-in.php" method = "post" class="form-container" onsubmit = "return logInUser()" >
                    <label for = "head" class = "headlabel"> <b>Log In</b></label><button type = "button" class = "btn cancel" onclick = "closeLogInForm()">x</button><br>
                    
                    <input type = "text" placeholder="Username" name="username" required><br>
        
                    <input type = "password" placeholder="Password" name="password" required> <br>

                    
                    <button type = "submit" class = "btn"> Log in</button> <br><br>

                    <label for ="sign-up">Don't have an account yet?</label><br>
                    <button type = "button" onclick="openSignUpForm()" id="signUpLink"> Sign up </button> <br>
                </form>
            </div>

            <!-- sign up pop-up: ask sign-up details from the user -->
            <div class="form-popup" id="signForm">
                <form action="../src/sign-up.php" method="post" class="form-container" >
                    <label for ="head" class="headlabel"><b>Sign Up</b></label><br>
                    
                    <div class ="sign"> <!-- FOR FIRST NAME-->
                    <label for = "firstName"><b>First Name</b></label>
                    <input type = "text" placeholder="Enter your first name" name="firstname" required><br>
                    </div>

                    <div class ="sign"> <!-- FOR LAST NAME-->
                    <label for = "lastName"><b>Last Name</b></label>
                    <input type = "text" placeholder="Enter last name" id= "firstname" name="lastname" required> <br>
                    </div>
                    
                    <div class ="sign"> <!-- FOR USERNAME -->
                    <label for = "username"><b>Username</b></label>
                    <input type = "text" placeholder="Enter username" id= "lastname" name="username" required> <br>
                    </div>
                    
                    <div class ="sign"> <!-- FOR EMAIL -->
                    <label for = "email"><b>Email</b></label>
                    <input type = "text" placeholder="Enter email" id= "email" name="email" required> <br>
                    </div>

                    <div> <!-- FOR PASSWORD -->
                    <label for = "password"><b>Password</b></label>
                    <input type = "password" placeholder="Enter password" id= "password" name="password" required> <br>
                    </div>

                    <div class ="sign"> <!-- FOR CONFIRMING PASSWORD -->
                    <label for = "password_confirmation"><b>Repeat password</b></label>
                    <input type = "password" placeholder="Enter password" id= "password_confirmation" name="password_confirmation" required> <br>
                    </div>

                    <div> <!-- FOR DISCOUNTED -->
                    <label for = "discounted"><b>Are you a student, PWD or a senior citizen?</b></label>
                    <input type = "checkbox" name="discounted"> <br>
                    </div>

                    <button type = "submit" class = "btn"> Submit</button> <br>

                    <button type = "button" class = "btn cancel" onclick = "closeSignUpForm()">x</button>
                </form>
            </div>

            <?php if (isset($user)): ?>
                <p id="greet" class="greet">Hello <span id="callName"><?= htmlspecialchars($user["first_name"]) ?></span>! Where are you going?</p>
            <?php else: ?>
                <a id="greet" class="greet"> Hi user! Where are you going? </a> <br>
            <?php endif; ?>

            <script src="https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/v5.0.0/mapbox-gl-geocoder.min.js"></script>
            <link rel="stylesheet" href="https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/v5.0.0/mapbox-gl-geocoder.css" type="text/css">
            
            <style>
                #geocoder {
                    font-family: 'VastagoGrotesk';
                    z-index: 1;
                    padding-top: 1%;
                    padding-bottom: 8%;
                    margin: auto;
                    width: 50%;
                }
                .mapboxgl-ctrl-geocoder {
                    min-width: 100%;
                }

                #map-container {
      width: 100%;
      height: 400px;
      display: none; /* Initially hide the map container */
    }
            </style>
            
            <div id="geocoder"></div>
            <div class="key-locations-label">Key Locations!</div>
            <div class ="container">
            
            <div class="tourist-spots">
                        <?php
            foreach ($touristSpots as $spot) {
            $name = urlencode($spot["name"]);
            $decodedName = str_replace('+', ' ', $name);
            $latitude = $spot["latitude"];
            $longitude = $spot["longitude"];
            $imagePath = $spot["image_path"];

            // Structure with image and button name
            $touristSpot = '<div class="tourist-spot">';
            $touristSpot .= '<a href="map.php?name=' . $name . '&latitude=' . $latitude . '&longitude=' . $longitude . '" class="tourist-spot-btn">' . $decodedName . '</a>';
            $touristSpot .= '<img src="' . $imagePath . '" alt="' . $name . '">';
            $touristSpot .= '</div>';

            echo $touristSpot;
            }
            ?>
</div></div>
            <section>
    </div>
</section>
            
<script>
    mapboxgl.accessToken = '<?php echo ($mapboxAccessToken) ?>';
    const geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        bbox: [121.005306,13.749348,121.074228,13.798157]
    });

    geocoder.addTo('#geocoder');
    geocoder.on('result', (event) => {
        const latitude = event.result.center[0];
        const longitude = event.result.center[1];
        const name = event.result.text;
        const url = `map.php?latitude=${latitude}&longitude=${longitude}&name=${encodeURIComponent(name)}`;
        console.log(url);
        window.location.href = url;
        setTimeout(() => {
            const touristSpotButton = document.querySelector('.tourist-spot-btn');
            touristSpotButton.click();
        }, 500);
    });
    
</script>
    
            <div id="geocoder"></div>
            <pre id="result"></pre>
        </div>

        </div>

    </section>
    <script>
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("setDestinationBtn").addEventListener("click", function () {
        setDestination('Bsu Alangilan', 121.07393104563, 13.784084737962);
    });
});
</script>

    <!-- about: insert brief desc + SDG -->
    <section class="folder" id="about">
        <div id="content">
            <div class="tab-container">
                <ul class="tabs">
                    <a src="tabf0-1" class="active">About</a>
                    <a src="tabf0-2">SDGs</a>
                    <a src="tabf0-3">Members</a>
                </ul>
                <div class="tab-content">
                    <div id="tabf0-1">
                        <div class="row">
                            <div class="column left" id="col1Text">
                            Welcome to Karipas, a transformative website
                            dedicated to promoting sustainable public
                            transportation, particularly jeepneys, in Batangas City.<br>
                            Our mission is to serve as a reliable transport assistant,
                            advocating for the increased use of public transit to
                            address environmental concerns such as pollution
                            and traffic congestion. <br><br>


                            At Karipas, we understand that encouraging
                            the public to embrace public transportation is 
                            pivotal for a cleaner and more efficient urban 
                            environment. By actively promoting the use of 
                            jeepneys and other communal transit options,
                            we aim to reduce the environmental impact of 
                            individual car usage, contributing to lower
                            pollution levels and alleviating traffic congestion.
                            Through our user-friendly platform, we provide
                            information, routes, and fares, 
                            making it easier for residents and visitors to 
                            choose eco-friendly transportation alternatives
                            and actively participate in creating a more 
                            sustainable future for Batangas City.


                            </div>
                            <div class="column right" id="col1Img"><img src="../elements/images/tech2.gif"></div>
                        </div>
                    </div>
                
                    <div id="tabf0-2">
                        <div class="row">
                            <div class="column left" id="col1Text">
                            <b>SDG #8: Decent Work and Economic Growth</b> <br>
                            By promoting public transportation,
                            particularly through the utilization of jeepneys,
                            we contribute growth by creating more employment opportunities
                            for jeepney drivers. This not only supports existing
                            drivers but also opens doors for new individuals to
                            enter the workforce, fostering inclusive economic development.<br><br>

                            <b>SDG #9: Industry, Innovation, and Infrastructure</b> <br>
                            Our commitment involves leveraging
                             innovation to enhance public transportation in Batangas,
                             integrating technologies systems to create a more accessible and efficient
                             commuting experience for the community.<br><br>

                             <b>SDG #11:  Sustainable City and Communities</b> <br>
                             our strategic investment in public transportation aims to enhance
                             accessibility, mitigating congestion and reducing emissions from private
                             vehicles, particularly by facilitating navigational guidance for those
                             unfamiliar with optimal routes.<br><br>
                            </div>
                            <div class="column right" id="col1Img"><img src="..elements/images/tech4.gif"></div>
                        </div>
                    </div>

                 <div class="row">
                            <div class="column left" id="col1Text">
                           
                            </div>
                            <div class="column right" id="col1Img"></div>
                        </div>
                <div id="tabf0-3">
                <div class="row">
                            <div class="column left" id="col3Text">
                            <h1 class="big"> #Behind the Web </h1> 

                            <p class="memName"> De Torres, Czynon John </p> <p class="role">BACK END DEVELOPER</p><br>
                                <p class="deets">Github
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="M7 7h8.586L5.293 17.293l1.414 1.414L17 8.414V17h2V5H7v2z"/></svg>     
                                    Gmail
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="M7 7h8.586L5.293 17.293l1.414 1.414L17 8.414V17h2V5H7v2z"/></svg></p><br>
                            <p class="memName"> Delos Santos, Princess Mae </p> <br>
                            <p class="deets">Github
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="M7 7h8.586L5.293 17.293l1.414 1.414L17 8.414V17h2V5H7v2z"/></svg>     
                                    Gmail
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="M7 7h8.586L5.293 17.293l1.414 1.414L17 8.414V17h2V5H7v2z"/></svg></p><br>
                            <p class="memName"> Garcia, Vivene Marie </p> <br>
                            <p class="deets">Github
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="M7 7h8.586L5.293 17.293l1.414 1.414L17 8.414V17h2V5H7v2z"/></svg>     
                                    Gmail
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="M7 7h8.586L5.293 17.293l1.414 1.414L17 8.414V17h2V5H7v2z"/></svg></p><br>
                            <p class="memName"> Panganiban, Rain Lyrra </p> <br>
                            <p class="deets">Github
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="M7 7h8.586L5.293 17.293l1.414 1.414L17 8.414V17h2V5H7v2z"/></svg>     
                                    Gmail
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="M7 7h8.586L5.293 17.293l1.414 1.414L17 8.414V17h2V5H7v2z"/></svg></p><br>
                            <p class="memName"> Ramos, Ma. Francezca </p> <br>
                            <p class="deets">Github
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="M7 7h8.586L5.293 17.293l1.414 1.414L17 8.414V17h2V5H7v2z"/></svg>     
                                    Gmail
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="M7 7h8.586L5.293 17.293l1.414 1.414L17 8.414V17h2V5H7v2z"/></svg></p><br>

                            </div>
                            <div class="column right" id="col1Img"><img src="../elements/images/tech3.gif"></div>
                        </div>
                </div>
            </div>
            </div>
        </div>
    <script src="../js/confirmInfo.js"></script>
    </body>
    </html>
