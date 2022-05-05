$(function() {

	var code = urlParameter("code")
	if (code) {
		$.post("/assets/serverscripts/stripe-auth.php", { code : code }).then(function(json) {
			console.log(json)
			data = JSON.parse(json)
			if (data.stripe_user_id && currentUser) {
				userData.stripe_id = data.stripe_user_id
				database.collection("users").doc(currentUser.uid).update({
					stripe_id: data.stripe_user_id,
					stripe_token: data.access_token
				}).then(function() {
					toggleDisplay($(".stripe-loading"), false)
					toggleDisplay($(".stripe-success"), true)
				}).catch(function(error) {
					$(".stripe-error-text").text(error || $(".stripe-error-text").text())
					console.log(data)
					toggleDisplay($(".stripe-loading"), false)
					toggleDisplay($(".stripe-error"), true)
				})
			} else {
				console.log(data)
				$(".stripe-error-text").text(data.error_description || $(".stripe-error-text").text())
				toggleDisplay($(".stripe-loading"), false)
				toggleDisplay($(".stripe-error"), true)
			}
		})
	}

})
