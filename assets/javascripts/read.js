var articleData, authorHeader, shortcode, content
var editButton = "<button class=\"button is-link is-outlined\" onclick=\"edit()\">Edit</button>"
var saveButton = "<button class=\"button save-button is-link\" onclick=\"saveEdit()\">Save</button>"
var cancelButton = "<button class=\"button is-link is-outlined\" onclick=\"cancelEdit()\">Cancel</button>"

$(function () {

	userCallback = function () {
		shortcode = window.location.pathname.substr(1).replace("/", "-")//urlParameter("shortcode")
		if (shortcode) {
			shortcode = shortcode.toLowerCase()
			database.collection("articles").doc(shortcode).get().then(function (article) {
				if (article.exists) {
					articleData = article.data()
					document.title = articleData.title + " by " + articleData.name + " - TypeTrove"
					authorHeader = "<nav class=\"level\"><div class=\"level-left\"><p class=\"level-item is-light subtitle is-5\"><a href=\"/" + articleData.username + "\">"
					authorHeader += articleData.name + " - " + date(articleData.timestamp) + "</a></p></div>"
					if (currentUser && currentUser.uid && (articleData.uid == currentUser.uid || articleData.purchased_users[currentUser.uid])) {
						if (articleData.uid == currentUser.uid) {
							authorHeader += "<div class=\"level-right\"><div class=\"level-item\"><div class=\"buttons edit-buttons\">" + editButton + "</div></div>"
						}
						authorHeader += "</nav>"
						database.collection("content").doc(shortcode).get().then(function (content) {
							window.content = content.data().content
							$(".article-content").html(authorHeader + window.content)
						})
					} else {
						authorHeader += "</nav>"
						$(".purchase-modal").load("assets/components/purchase-modal.html", function () {
							var stripe = Stripe('pk_live_pBx7Pd2un2SMdvOMtWpwtzdY')
							var elements = stripe.elements()
							var style = { base: { color: '#282923', fontSize: '16px', lineHeight: '18px' }, invalid: { color: '#FA7C91', iconColor: '#FA7C91' } }
							var card = elements.create('card', { style: style })
							card.mount('#card-element')
							card.addEventListener('change', function (event) {
								$('#card-errors').text(event.error ? event.error.message : "")
							})
							$(".purchase-modal .purchase-button").on("click", function (event) {
								event.preventDefault()
								$(".purchase-modal .purchase-button").toggleClass("is-loading", true)
								stripe.createToken(card).then(function (result) {
									if (result.error) {
										$("#card-errors").text(result.error.message)
									} else {
										handleStripeToken(result.token)
									}
								})
							})
							var button = "<nav class=\"level\"><p class=\"level-item\"><button class=\"button is-large is-link\" onclick=\"initiatePurchase()\">"
							button += "Read This Article - $" + articleData.price + "</button></p></nav>"
							var subtext = "<nav class=\"level\"><p class=\"level-item\"><label class=\"label is-light\">This article has "
							subtext += (articleData.word_count - 100) + " more words.</label></p></nav>"
							$(".article-content").html(authorHeader + articleData.preview + button + subtext)
							$(".purchase-modal .purchase-title-label").text(articleData.title)
							$(".purchase-modal .purchase-subtitle-label").html("Purchase this article for <strong>$" + articleData.price + "</strong>")
						})
					}
				} else {
					window.location = "/404"
				}
			}).catch(function (error) {
				handleError(error)
			})
		} else {
			window.location = "/"
		}

	}

})

function saveEdit() {
	if (articleData) {
		$(".save-button").toggleClass("is-loading", true)
		validateArticle(function (preview, title, wordCount) {
			uploadArticle(preview, articleData.price, title, wordCount, articleData.shortcode, function (_, _) {
				window.content = editor.getContent()
				$(".save-button").toggleClass("is-loading", false)
				cancelEdit()
			}, function (error) {
				handleError(error)
				$(".save-button").toggleClass("is-loading", false)
			})
		}, function (error) {
			handleError(error, "An Issue Needs Addressing")
			$(".save-button").toggleClass("is-loading", false)
		})
	}
}

function cancelEdit() {
	if (window.content) {
		$(".article-content").html(authorHeader + window.content)
		$(".edit-buttons").html(editButton)
	}
}

function edit() {
	var content = window.content
	if (content && articleData) {
		$(".article-content").html(authorHeader + "<div class=\"editor\">" + content + "<div>")
		initialiseEditor()
		$(".edit-buttons").html(saveButton + cancelButton)
	}
}

function handleStripeToken(token) {
	if (articleData && userData) {
		var price = articleData.price * 100, fee = (price * 0.051).toFixed(0)
		console.log(fee)
		$.post("/assets/serverscripts/stripe-charge.php", {
			price: price,
			fee: fee,
			token: token.id,
			account: articleData.stripe_id,
			title: articleData.title
		}, function (data) {
			var json = JSON.parse(data.split("Stripe\\Charge JSON: ")[1])
			if (json && json.status && json.status == "succeeded") {
				database.collection("articles").doc(shortcode).update({
					["purchased_users." + currentUser.uid]: true
				}).then(function () {
					userCallback()
					$(".purchase-modal .purchase-button").toggleClass("is-loading", false)
					hidePurchaseModal()
					ga("send", { hitType: "event", eventCategory: "Article Interaction", eventAction: "Purchase", eventLabel: shortcode })

					// Update article stats + notify author

				}).catch(function (error) {
					$(".purchase-modal .purchase-button").toggleClass("is-loading", false)
					hidePurchaseModal()
					handleError(error)
				})
			} else {
				$(".purchase-modal .purchase-button").toggleClass("is-loading", false)
				hidePurchaseModal()
				handleError("An error occurred when processing payment.") // Stripe JSON Error - Check API Docs
				// Handle Error
			}
		})
	}
}

function initiatePurchase() {
	if (currentUser) {
		showPurchaseModal()
	} else {
		showModal()
	}
}

function showPurchaseModal() {
	$(".purchase-modal").toggleClass("is-active", true)
}

function hidePurchaseModal() {
	$(".purchase-modal").toggleClass("is-active", false)
}

