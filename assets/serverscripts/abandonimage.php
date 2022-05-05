<?php
	$ref = strtolower($_SERVER['SERVER_NAME']);
	if ($ref != "localhost:8000" && $ref != "typetrove.com") {
		echo "Error: Unauthorised";
		return;
	}
	unlink($_POST["src"]);
?>