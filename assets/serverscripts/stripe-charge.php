<?php

	require_once('./stripe/init.php');

	\Stripe\Stripe::setApiKey("sk_test_LsJrCeGJmw0cIMCfJ8hbdXAt");

	$charge = \Stripe\Charge::create([
		"amount" => $_POST["price"],
		"currency" => "usd",
		"source" => $_POST["token"],
		"application_fee" => $_POST["fee"],
		"description" => $_POST["title"]],
		["stripe_account" => $_POST["account"]]
	);

	echo $charge

	// Notify author?

?>