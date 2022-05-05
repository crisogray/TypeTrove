var currentTabIsJoin = false, currentUser, userData, callback, userCallback
firebase.initializeApp({
	apiKey: "AIzaSyDEj02toitLzEce3gdUYwIlvSf1-yCNIlw",
	authDomain: "typetrove.firebaseapp.com",
	databaseURL: "https://typetrove.firebaseio.com",
	projectId: "typetrove",
	storageBucket: "typetrove.appspot.com",
	messagingSenderId: "1055701436490"
})
var database = firebase.firestore()
database.settings({ timestampsInSnapshots: true })

window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
gtag('js', new Date());
gtag('config', 'UA-106314448-2');

$(function () {
	$(".auth-modal").load("/assets/components/auth-modal.html")
	$(".error-modal").load("/assets/components/error-modal.html")

	firebase.auth().onAuthStateChanged(function (user) {
		currentUser = user
		if (user && !userData) {
			database.collection("users").doc(user.uid).get().then(function (doc) {
				if (doc.exists) {
					userData = doc.data()
					loadUserData()
				}
			}).catch(function (error) {
				handleError(error)
			})
		} else if (!user) {
			$(".navbar-end").load("/assets/components/auth-buttons.html")
			if (userCallback) {
				userCallback()
			}
		}
	})

	$("body").on("click", ".join, .sign-in, .tab-join, .tab-sign-in", function (e) {
		toggleTabs($(e.currentTarget).data("is-join"))
		clearModal()
		showModal()
	})

	$(".auth-modal").on("blur", "input", function (e) {
		validateElement($(e.currentTarget))
	})

	$(".navbar-burger").on("click", function (e) {
		$(".navbar-burger, .navbar-menu.main-menu").toggleClass("is-active")
	})

})

function toggleModalHelp(error) {
	$(".auth-submit").toggleClass("is-loading", false)
	$(".auth-modal .general-help").text(error || null)
}

function authenticate() {
	if (validate()) {
		$(".auth-submit").toggleClass("is-loading", true)
		var email = $(".email-input").val(), password = $(".password-input").val()
		if (currentTabIsJoin) {
			database.collection("users").where("shortcode", "==", $(".username-input").val().toLowerCase()).limit(1).get().then(function (snapshot) {
				var exists = snapshot.docs.length
				updateField($(".auth-modal .username-input"), !exists, "Sorry, this username is already being used.", false)
				$(".auth-submit").toggleClass("is-loading", !exists)
				if (!exists) {
					firebase.auth().createUserWithEmailAndPassword(email, password).then(function (user) {
						userData = {
							name: $(".name-input").val(),
							username: $(".username-input").val(),
							shortcode: $(".username-input").val().toLowerCase(),
							email: email,
						}
						loadUserData()
						database.collection("users").doc(user.user.uid).set(userData).then(function () {
							toggleModalHelp()
							hideModal()
						}).catch(function (error) {
							toggleModalHelp(error.message)
						})
						ga("send", { hitType: "event", eventCategory: "Authentication", eventAction: "Create Account", eventLabel: userData.username })
					}).catch(function (error) {
						toggleModalHelp(error.message)
					})
				}
			})
		} else {
			firebase.auth().signInWithEmailAndPassword(email, password).then(function () {
				toggleModalHelp()
				hideModal()
				ga("send", { hitType: "event", eventCategory: "Authentication", eventAction: "Sign In", eventLabel: email })
			}).catch(function (error) {
				toggleModalHelp(error.message)
			})
		}
	}
}

function loadUserData() {
	if (userCallback) {
		userCallback()
	}
	var buttons = "<div class=\"navbar-item end-item\"><div class=\"buttons auth-buttons\">"
	if (document.title != "Write - TypeTrove") {
		buttons += "<a class=\"button is-link\" href=\"/write.html\">Write an Article</a>"
	}
	if (document.title != "My Account - TypeTrove") {
		buttons += "<a class=\"button is-link is-outlined\" href=\"/me.html\">" + userData.name + "</a>"
	}
	buttons += "</div></div>"
	$(".navbar-end").html(buttons)
}

function validate() {
	var valid = true
	$(".auth-modal input.input").each(function (i, element) {
		if (currentTabIsJoin || i > 1) {
			valid = valid && validateElement($(element))
		}
	})
	return valid
}

function validateElement(element) {
	var regexps = {
		"name": /^(?=.{1,20}$)([A-Za-z0-9]{1,}([\.,] |[-']| ))*[A-Za-z0-9]+$/,
		"username": /^[a-zA-Z0-9_]{3,20}$/,
		"email": /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,})$/,
		"password": /^.{6,100}$/
	}
	var errors = {
		"name": "Please enter a valid name under 20 characters.",
		"username": "Usernames must be between 3 and 20 characters and may only contain letters, numbers and underscores.",
		"email": "Please enter a valid email.",
		"password": "Your password must contain at least 6 characters."
	}
	var type = element.attr("name")
	if (type != "password") {
		element.val(element.val().trim())
	} else if (!currentTabIsJoin) {
		return true
	}
	var matches = regexps[type].test(element.val())
	updateField(element, matches, element.val() == "" ? "Please enter a" + (type == "email" ? "n" : "") + " " + type + "." : errors[type], false)
	return matches
}

function updateField(element, matches, error, clear) {
	element.val(clear ? null : element.val())
	element.toggleClass("is-danger", !matches)
	element.closest(".field").children(".help").toggleClass("is-danger", !matches)
	element.closest(".field").children(".help").text(clear || matches ? null : error)
}

function clearModal() {
	$(".auth-modal input").each(function (_, element) {
		updateField($(element), true, null, true)
	})
}

function toggleTabs(targetTabIsJoin) {
	if (targetTabIsJoin != currentTabIsJoin) {
		currentTabIsJoin = targetTabIsJoin
		clearModal()
		$(".tab-join, .tab-sign-in").toggleClass("is-active")
		toggleDisplay(".name-field, .username-field, .agreement", targetTabIsJoin)
		$(".auth-submit").text(targetTabIsJoin ? "Join" : "Sign In")
	}
}


function toggleDisplay(element, show) {
	$(element).css("display", show ? "block" : "none")
}

function showModal() {
	callback = null
	$(".auth-modal").toggleClass("is-active", true)
}

function hideModal() {
	toggleTabs(false)
	$(".auth-modal").toggleClass("is-active", false)
}

function urlParameter(key) {
	var vars = window.location.search.substring(1).split("&")
	for (var i = 0; i < vars.length; i++) {
		var keyVal = vars[i].split("=")
		if (keyVal[0] == key) {
			return keyVal[1]
		}
	}
}

function queryArticles(key, value, callback, errorCallback) {
	database.collection("articles").where(key, "==", value).get().then(function (querySnapshot) {
		var articlesHtml = ""
		querySnapshot.forEach(function (article) {
			var articleData = article.data()
			var href = "/" + articleData.shortcode.replace("-", "/")
			articlesHtml += "<a href=\"" + href + "\"><h3 class=\"title article-title\">" + articleData.title + "</h3><p class=\"subtitle is-5 is-light\">"
			articlesHtml += articleData.name + " - " + date(articleData.timestamp) + " - $" + articleData.price + "</p></a>"
		})
		callback(articlesHtml == "" ? "<p class=\"subtitle is-6 is-light\">No articles</p>" : articlesHtml)
	}).catch(function (error) {
		errorCallback(error)
	})
}

function date(timestamp) {
	var date = new Date(timestamp)
	var month = date.getMonth() + 1
	if (month < 10) {
		month = "0" + month
	}
	return date.getDate() + '/' + month + '/' + date.getFullYear()
}

function validateArticle(callback, errorCallback) {
	var html = $.parseHTML($.trim(editor.getContent()).replace(/\>[ ]+\</g, '><'))
	var previewLimit = 100, minimumWords = 250
	var preview = "", title = "", wordCount = 0
	$.each(html, function (i, element) {
		var e = $(element).clone(), continuePreview = wordCount < previewLimit
		if (e.is("p")) {
			wordCount += e.text().trim().split(/\s+/).length
		} else if (e.is("h3") && title == "") {
			title = e.text()
		}
		if (continuePreview) {
			if (wordCount > previewLimit && e.is("p")) {
				e.text(e.text().split(/\s+/).slice(0, wordCount - previewLimit).join(" ") + "...")
			}
			if (e[0].outerHTML) {
				preview += e[0].outerHTML
			}
		}
	})
	if (wordCount >= minimumWords && title && $(".editor").find(".defaultValue").length == 0) {
		callback(preview, title, wordCount)
	} if (!title) {
		errorCallback("Your article must have a title.")
	} else if (wordCount < minimumWords) {
		errorCallback("Your article is below the minimum word count of " + minimumWords + ".")
	} else if ($(".editor").find(".defaultValue").length > 0) {
		errorCallback("Your article contains placeholder text, you must remove it before your article can be published.")
	}
}

function uploadArticle(preview, price, title, wordCount, existingShortcode, callback, errorCallback) {
	if (preview != "" && price && title && wordCount && currentUser && userData) {
		$(".price-confirm").toggleClass("is-loading", true)
		var shortcode = existingShortcode || (userData.username + "-" + title.toLowerCase().trim()
			.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-_]/g, '').replace(/^(.{64}[^\s]*).*/, "$1"))
		var article = database.collection("articles").doc(shortcode), timestamp = new Date().getTime()
		article.get().then(function (doc) {
			if (doc.exists && !existingShortcode) {
				shortcode += "-" + timestamp
				article = database.collection("articles").doc(shortcode)
			}
			article.set({
				preview: preview,
				price: price,
				uid: currentUser.uid,
				name: userData.name,
				username: userData.username,
				timestamp: timestamp,
				title: title,
				word_count: wordCount,
				shortcode: shortcode,
				stripe_id: userData.stripe_id,
				purchased_users: {},
			}).then(function () {
				database.collection("content").doc(article.id).set({
					content: editor.getContent(),
					uid: currentUser.uid
				}).then(function () {
					link = "https://typetrove.com/" + shortcode.replace("-", "/")
					callback(link, shortcode)
				}).catch(errorCallback)
			}).catch(errorCallback)
		}).catch(errorCallback)
	} else {
		errorCallback()
	}
}

function initialiseEditor() {
	editor = new Dante.Editor({
		el: ".editor",
		upload_url: "/assets/serverscripts/saveimage.php",
		upload_callback: function (jsonString) {
			var json = JSON.parse(jsonString)
			if (json.error) {
				alert(json.error)
				return ""
			}
			return json.url
		},
		image_delete_callback: function (json) {
			if (json.src.length > 0) {
				$.post("/assets/serverscripts/abandonimage.php", { src: json.src.replace("/assets", "..") })
			}
		},
		base_widgets: ["uploader", "embed"],
		body_placeholder: "Type away...",
		oembed_url: "http://noembed.com/embed?url=",
		default_loading_placeholder: "/assets/images/media-loading-placeholder.png"
	})
	editor.start()
}

function handleError(error, title) {
	$(".error-modal .error-title").text(title || "There was a problem")
	$(".error-modal .error-text").html(error || "An Unknown Error Occured.")
	$(".error-modal").toggleClass("is-active", true)
}

function closeError() {
	$(".error-modal").toggleClass("is-active", false)
}


