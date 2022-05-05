$(function() {

	userCallback = function() {
		shortcode = window.location.pathname.substr(1).replace("/", "")
		if (shortcode) {
			shortcode = shortcode.toLowerCase()
			if (userData && userData.shortcode == shortcode) {
				window.location = "/me"
			}
			database.collection("users").where("shortcode", "==", shortcode).limit(1).get().then(function(snapshot) {
				var user = snapshot.docs[0]
				if (user) {
					var uData = user.data()
					var name = uData.name, username = uData.username
					document.title = name + " - TypeTrove"
					$(".name-text").text(name)
					$(".username-text").text(username)
					$(".account-content").css("display", "block")
					queryArticles("uid", user.id, function(html) {
						$(".published-articles").html(html)
					}, function (error) {
						handleError(error)
					})
				} else {
					window.location = "/404"
				}
			}).catch(function(error) {
				handleError(error)
			})
		} else {
			window.location = "/"
		}
	}

})