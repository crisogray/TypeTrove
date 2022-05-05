<?php
	$ref = strtolower($_SERVER['SERVER_NAME']);
	if ($ref != "localhost:8000" && $ref != "typetrove.com") {
		echo "Error: Unauthorised";
		return;
	}	
	$target_dir = "../images/user/";
	$ref_dir = "/assets/images/user/";
	$exploded = explode(".", $_FILES["file"]["name"]);
	$file_extension = end($exploded);
	$file_name = md5(basename($_FILES["file"]["name"]) . date(DATE_RFC2822)) . "." . $file_extension;
	$target_file = $target_dir . $file_name;
	$imageFileType = strtolower(pathinfo($target_file,PATHINFO_EXTENSION));
    if(getimagesize($_FILES["file"]["tmp_name"]) === false) {
        echo json_encode(array('error' => "Sorry, file is not an image."));
    } else if (file_exists($target_file)) {
		echo json_encode(array('error' => "Sorry, file already exists."));
	} else if ($_FILES["file"]["size"] > 1000000) {
		echo json_encode(array('error' => "Sorry, your file is too large."));
	} else if($imageFileType != "jpg" && $imageFileType != "png" && $imageFileType != "jpeg" && $imageFileType != "gif" ) {
		echo json_encode(array('error' => "Sorry, only JPG, JPEG, PNG & GIF files are allowed."));
	} else if (move_uploaded_file($_FILES["file"]["tmp_name"], $target_file)) {
		chmod($target_file, 0664);
	    echo json_encode(array('url' => $ref_dir . $file_name));
	} else {
	    echo json_encode(array('error' => "Sorry, there was an error uploading your file."));
	}
?>