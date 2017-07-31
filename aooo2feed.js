// jshint asi: true
// jshint esversion: 6
function main() {
"use strict"

var DATA = {}

function $(q) { return document.querySelector(q) }
function $$(q) { return document.querySelectorAll(q) }

function foreach (arr, fn) {
	for (let i = 0; i < arr.length; i++) fn(arr[i], i, arr)
}

function some (arr, fn) {
	for (let i = 0; i < arr.length; i++) {
		if (fn(arr[i], i, arr)) return true
	}
	return false
}

function feed2arr (feed) {
	return Object.keys(feed).map(key => {
		return ({
			"href": key,
			"title": feed[key].title,
			"id": feed[key].id })
	})
}

function worksort (arr) {
	return arr.sort((a,b) => { return a.id < b.d ? -1 : 1 })
}

function GET(URL, cb) {
	const req = new XMLHttpRequest()
	req.onload = function() { cb(req) }
	req.open("GET", URL)
	req.send()
}

function E(tagname, attrs, text, children) {
	let elem = document.createElement(tagname)
	if (attrs !== null) {
		let keys = Object.keys(attrs)
		keys.forEach(key => { elem[key] = attrs[key] })
	}
	if (text) elem.appendChild(document.createTextNode(text))
	if (children) foreach(children, child => { elem.appendChild(child) })
	return elem
}

function parsework(work) {
	const a = work.querySelector("h4.heading > a")
	return { "href": a.href, "title": a.innerHTML }
}

function add_tracked_page(what) {
	if (!(what in DATA)) {
		DATA[what] = {
			"lastsync": Date.now(),
			"sample": [],
			"unread": {},
		}
	}
}

function remove_tracked_page(what) { delete DATA[what] }

function periodic_sync() {
	const keys = Object.keys(DATA)
	keys.forEach(key => {
		if (Date.now() - DATA[key].lastsync < 1000*60*60*20) return
		gimme_new(key, function (results, sample) {
			Object.keys(results).forEach(item => {
				DATA[key].unread[item] = results[item]
			})
			DATA[key].lastsync = Date.now()
			DATA[key].sample = sample
		})
	})
}

function next_page(doc) {
	return doc.querySelector("a[rel='next']").href
}

function gimme_new(key, cb) {
	function do_stuff(req, isfirst) {
		const doc = parser.parseFromString(req.responseText, "text/html")
		const works = doc.querySelectorAll("ol.work > li.work")
		if (isfirst)
			some(works, (work, i) => {
				const pw = parsework(work)
				sample.push(pw)
				if (i >= 5) return true
				else return false
			})
		const flag = some(works, (work, i) => {
			const pw = parsework(work)
			if (existing.has(pw.href)) return true
			else {
				const d = Date.now()
				results[pw.href] = {"title": pw.title, id: d+i}
				return false
			}
		})
		if (flag || Object.keys(results).length >= 50) cb(results)
		else GET(next_page(doc), req => do_stuff(req, false))
	}

	const parser = new DOMParser()
	const existing = new Set(DATA[key].sample)
	const results = {}
	const sample = []
	GET(key, req => do_stuff(req, true))
}

function save() {
	window.localStorage.setItem("aooo2feed", JSON.stringify(DATA))
}

function searchpath() { return window.location.pathname + window.location.search }

function main() {
	inject()
}

function add_search_clicked() {
	if (searchpath() in DATA) {
		remove_tracked_page(searchpath())
		this.text = "[removed!]"
	} else {
		add_tracked_page(searchpath())
		this.text = "[added!]"
		periodic_sync()
	}
}

function work_clicked() {
	delete DATA[this.feed].unread[this.href]
	this.remove()
}

function inject() {
	let inject_hash = { "/": inject_index, "/works/search": inject_search }
	let fn = inject_hash[window.location.pathname]
	if (fn) {
		const item = window.localStorage.getItem("aooo2feed")
		DATA = item ? JSON.parse(item) : {}
		window.addEventListener("beforeunload", save)
		periodic_sync()
		fn()
	}
}

function inject_index() {
	let elem = $("#main > .splash")
	elem.appendChild(aggregator_elem())
}

function inject_search() {
	let elem = $("#main > h2.heading")
	elem.appendChild(E("a", {
		"href": "#",
		"text": searchpath() in DATA ? "[remove search]" : "[track search]",
		"style": "font-size: 10pt; margin-left: 1em;",
		"onclick": add_search_clicked,
	}))
}

function aggregator_elem() {
	const unread = []
	Object.keys(DATA).forEach(feed => {
		feed2arr(DATA[feed].unread).forEach(item => {
			item.feed = feed
			unread.push(item)
		})
	})
	worksort(unread)
	const elems = [E("h3", null, "Tracked Searches")]
	unread.forEach((work) => {
		elems.push(E("li", null, null,
			[E("a", {
				"href": work.href,
				"target": "_blank",
				"onclick": work_clicked,
				"feed": work.feed
			},
			work.title)]))
	})
	return E("div", {"className": "aggregator module odd"}, null, elems)
}

main()

}

window.addEventListener("load", main)
