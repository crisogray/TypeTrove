<?php
	$post = ["client_secret" => "sk_live_obgWy8PYjYjk4i5vGJhYsRQs", "code" => $_POST["code"], "grant_type" => "authorization_code"];
	$ch = curl_init("https://connect.stripe.com/oauth/token");
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch, CURLOPT_POSTFIELDS, $post);
	$response = curl_exec($ch);
	curl_close($ch);
	echo $response;
?>