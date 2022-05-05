var signingOut = false
var stripeSignedInButton = "<a href=\"https:\/\/dashboard.stripe.com\" class=\"button sign-out is-link\" target=\"_blank\">Visit Your Stripe Dashboard</a>"

$(function() {

	userCallback = function() {
		if (currentUser && userData) {
			var name = userData.name, username = userData.username
			$(".name-text").text(name)
			$(".username-text").text(username)
			var stripeButton
			if (userData.stripe_id) {
				stripeButton = stripeSignedInButton
			} else {
				var url = "https://connect.stripe.com/oauth/authorize?response_type=code&client_id=ca_ELfkV0N7lK1QYrDbo9pMJYMBj0I7ZoB7&scope=read_write"
				stripeButton = "<a href=\"" + url + "\" target=\"_blank\" class=\"level-item\"><img class=\"stripe-connect\" src=\"assets/images/stripe-connect.png\"></a>"
				listenForStripe()
			}
			$(".stripe-button").html(stripeButton)
			$(".account-content").css("display", "block")
			var articleQueries = {".published-articles" : ["uid", currentUser.uid], ".purchased-articles" : ["purchased_users." + currentUser.uid, true]}
			Object.keys(articleQueries).forEach(function(key) {
				queryArticles(articleQueries[key][0], articleQueries[key][1], function(html) {
					$(key).html(html)
				}, function(error) {
					handleError(error)
				})
			})
		} else if (!currentUser && !signingOut) {
			$(".account-content").css("display", "none")
			showModal()
		}
	}

})

function signOut() {
	signingOut = true
	firebase.auth().signOut().then(function() {
		window.location = "/"
	})
}

function listenForStripe() {
	var listener = database.collection("users").doc(currentUser.uid).onSnapshot(function(doc) {
		var data = doc.data()
		if (data.stripe_id) {
			$(".stripe-button").html(stripeSignedInButton)
			listener()
		}
	}, function(error) {
		handleError(error)
	})
}