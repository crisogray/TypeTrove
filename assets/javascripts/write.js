var wantsToPublish = false, hasSetButton = false, preview = "", title, wordCount = 0, price, link

$(function() {
	
	$(".publish-modal").load("assets/components/publish-modal.html")
	initialiseEditor()

	userCallback = function() {
		if (!hasSetButton) {
			hasSetButton = true
			$(".button.publish").on("click", function(event) {
				if (currentUser) {
					publish()
				} else {
					showModal()
					wantsToPublish = true
				}
			})
		}
		if (currentUser && wantsToPublish) {
			wantsToPublish = false
			publish()
		}
	}

})

function publish() {
	validateArticle(function(p, t, wC) {
		var listener = database.collection("users").doc(currentUser.uid).onSnapshot(function(doc) {
			var data = doc.data()
			if (data.stripe_id) {
				hideStripeModal()
				listener()
				preview = p
				title = t
				wordCount = wC
				$(".publish-modal").toggleClass("is-active", true)
			} else {
				$(".stripe-modal").load("assets/components/stripe-modal.html")
				showStripeModal()
			}
		}, function(error) {
			handleError(error)
		})
	}, function(error) {
		handleError(error, "An Issue Needs Addressing")
	})
}

function hidePublishModal() {
	$(".publish-modal").toggleClass("is-active", false)
}

function hideStripeModal() {
	$(".stripe-modal").toggleClass("is-active", false)
}

function showStripeModal() {
	$(".stripe-modal").toggleClass("is-active", true)
}

function validatePrice() {
	var element = $(".price-input")
	var float = parseFloat(element.val())
	if (float && float <= 100 && float >= 1) {
		updateField(element, true, "", false)
		return float.toFixed(2)
	}
	updateField(element, false, float ? "The price must be between $1 and $100." : "Please enter a price.", false)
}

function backToPrice() {
	toggleDisplay(".publish-confirm", false)
	toggleDisplay(".publish-price", true)
}

function submitPrice() {
	price = validatePrice()
	if (preview != "" && price && title) {
		$(".publish-confirm-text").html("Are you sure you want to publish your article?<br>It will have a price of <strong>$" + price + "</strong>.")
		toggleDisplay(".publish-price", false)
		toggleDisplay(".publish-confirm", true)
	}
}

function confirmSubmit() {
	if (preview != "" && price && title && wordCount && currentUser && userData) {
		$(".price-confirm").toggleClass("is-loading", true)
		uploadArticle(preview, price, title, wordCount, null, function(l, shortcode) {
			window.link = l
			$(".price-confirm").toggleClass("is-loading", false)
			$(".link-box").val(l)
			$(".publish-success .tweet-button").attr("href", "https://twitter.com/intent/tweet?text=I just published an article on TypeTrove!" + "&url=" + l)
			toggleDisplay(".publish-confirm", false)
			toggleDisplay(".publish-success", true)
			ga("send", {hitType: "event", eventCategory: "Article Interaction", eventAction: "Publish", eventLabel: shortcode})
		}, function(error) {
			$(".publish-modal").toggleClass("is-active", false)
			handleError(error)
		})
	} else {
		$(".publish-modal").toggleClass("is-active", false)
		handleError()
	}
}

function copyLink() {
	if (window.link) {
		var linkBox = document.getElementById("link-box")
		linkBox.select()
		document.execCommand("copy")
	}
}

function completePublish() {
	if (window.link) {
		hidePublishModal()
		window.location = window.link
	}
}


