// jshint asi: true
// jshint esversion: 6
(function() {
"use strict"
// GLOBALS
var DATA = {}

const FEED_CSS = `body { background: #eee; }
#loadline {
	display: none;
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	height: 0.25em;
	color: #aa0000
}`

const FEED_HTML = `<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<title>aooo2feed</title>
	<style>${FEED_CSS}</style>
</head>
<body>
	<div id="loadline"></div>
	<section id="sidebar"></section>
	<section id="mainfeed"></section>
</body>
</html>`

// UTILITY FUNCTIONS
function $(q) { return document.querySelector(q) }
function $$(q) { return document.querySelectorAll(q) }

function E(tagname, attrs, text, children) {
	let elem = document.createElement(tagname)
	if (attrs !== null) {
		let keys = Object.keys(attrs)
		keys.forEach(key => { elem[key] = attrs[key] }) }
	if (text) elem.appendChild(document.createTextNode(text))
	if (children) foreach(children, child => { elem.appendChild(child) })
	return elem }

function foreach (arr, fn) {
	for (let i = 0; i < arr.length; i++) fn(arr[i], i, arr) }

function some (arr, fn) {
	for (let i = 0; i < arr.length; i++) if (fn(arr[i], i, arr)) return true
	return false }

function GET(URL, cb) {
	const req = new XMLHttpRequest()
	req.onload = function() { cb(req) }
	req.open("GET", URL)
	req.send() }

function gimme_new(key, cb) {
	function do_stuff(req, isfirst) {
		const doc = parser.parseFromString(req.responseText, "text/html")
		const works = doc.querySelectorAll("ol.work > li.work")
		if (isfirst)
			some(works, (work, i) => {
				const pw = parsework(work)
				sample.push(pw)
				if (i >= 5) return true
				else return false })
		const flag = some(works, (work, i) => {
			const pw = parsework(work)
			if (existing.has(pw.href)) return true
			else {
				const d = Date.now()
				results[pw.href] = {"title": pw.title, id: d+i}
				return false } })
		if (flag || Object.keys(results).length >= 50) cb(results)
		else GET(next_page(doc), req => do_stuff(req, false)) }

	const parser = new DOMParser()
	const existing = new Set(DATA[key].sample)
	const results = {}
	const sample = []
	GET(key, req => do_stuff(req, true)) }

function parsework(work) {
	const a = work.querySelector("h4.heading > a")
	return { "href": a.href, "title": a.innerHTML } }

function next_page(doc) { return doc.querySelector("a[rel='next']").href }

function searchpath() {
	return window.location.pathname + window.location.search }

function show(e) { e.style.display = "" }
function hide(e) { e.style.display = "none" }

// EVENT FUNCTIONS
function add_search_clicked() {
	if (searchpath() in DATA) {
		remove_tracked_page(searchpath())
		this.text = "[removed!]" }
	else {
		add_tracked_page(searchpath())
		this.text = "[added!]"
		periodic_sync() } }

function work_clicked() {
	delete DATA[this.feed].unread[this.href]
	this.remove() }

// ELEMENT GENERATORS
function aggregator_elem() {
	const unread = []
	Object.keys(DATA).forEach(feed => {
		feed2arr(DATA[feed].unread).forEach(item => {
			item.feed = feed
			unread.push(item) }) })
	worksort(unread)
	const elems = [E("h3", null, "Tracked Searches")]
	unread.forEach((work) => {
		elems.push(E("li", null, null,
			[E("a", {
				"href": work.href,
				"target": "_blank",
				"onclick": work_clicked,
				"feed": work.feed },
			work.title)])) })
	return E("div", {"className": "aggregator module odd"}, null, elems) }

// INJECTION FUNCTIONS
function inject_feed() {
	document.open()
	document.write(FEED_HTML)
	document.close() }

function default_inject() {}

function inject_search() {
	let elem = $("#main > h2.heading")
	elem.appendChild(E("a", {
		"href": "#",
		"text": searchpath() in DATA ? "[remove search]" : "[track search]",
		"style": "font-size: 10pt; margin-left: 1em;",
		"onclick": add_search_clicked })) }

function main() {
	let inject_hash = {
		"/aooo2feed": inject_feed,
		"/works/search": inject_search }
	let fn = inject_hash[window.location.pathname]
	if (fn) fn()
	else default_inject() }

if (document.readysState === "complete") main()
else window.addEventListener("load", main)})()
