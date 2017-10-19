// jshint asi: true
// jshint esversion: 6
(function() {
"use strict"
const DATA = {}
const G = {}
let RANMAIN = false

const FEED_CSS = `html, body { height: 100%; }
body { background: #eee;
	display: grid;
	grid-template-columns: 20em auto;
	margin: 0;
	max-height: 100vh; }
nav {
	grid-column-start: 1;
	grid-column-end: 2;
	background-color: yellow;
	overflow-y: auto; }
main {
	grid-column-start: 2;
	grid-column-end: 3;
	background-color: red;
	overflow-y: auto; }
#loadline {
	display: none;
	position: fixed;
	top: 0;
	left: 0;
	width: 0;;
	height: 0.25em;
	color: #aa0000;
	transition: width 0.2s ease;
}
.feedlistitem {}
.feedlistitem.active {}
.feedlist {
#infobar {}`

const FEED_HTML = `<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8"/>
	<title>aooo2feed</title>
	<style>${FEED_CSS}</style>
</head>
<body></body>
</html>`

function $(q) { return document.querySelector(q) }

function $$(q) {
	const arr = []
	const results = document.querySelectorAll(q)
	for (let i = 0, len = results.length; i < len; i++) arr.push(results[i])
	return arr }

function average(nums) { return sum(nums) / nums.length }

function sum(nums) {
	let total = 0
	for (let i = 0, len = nums.length; i < len; i++) total += nums[i]
	return total }

class Element {
	constructor(parent, data) {
		this.element = this.element_constructor(data)
		this.element.onclick = () => { this.onclick() }
		parent.appendChild(this.element) }

	hide() { this.element.style.display = "none" }
	show() { this.element.style.display = "initial" }
	onclick() { return true }}

class SearchAdder extends Element {
	element_constructor(parent) {
		const elem = document.createElement("a")
		elem.href = "#"
		elem.text = searchpath() in DATA ?
			"[remove search]" :
			"[track search]"
		elem.style = "font-size: 10pt; margin-left: 1em;"
		return elem }

	onclick() {
		if (searchpath() in DATA) {
			remove_tracked_page(searchpath())
			this.text = "[removed!]" }
		else {
			add_tracked_page(searchpath())
			this.text = "[added!]" }}}

class Loadline extends Element {
	constructor(parent) {
		super(parent)
		this.tickstate = 0 }

	element_constructor() {
		const elem = document.createElement("div")
		elem.id = "loadline"
		return elem }

	tick() {
		switch(this.tickstate) {
			case 0:
				this.tickstate = 10
				break
			case 10:
				this.tickstate = 25
				break
			case 25:
				this.tickstate = 33
				break
			case 33:
				this.tickstate = 50
				break
			default:
				this.tickstate = average([this.tickstate, 100])
				break }
		this.element.style.width = this.tickstate + "%" }

	done() {
		this.tickstate = 100
		this.element.style.width = this.tickstate + "%"
		setTimeout(() => { this.hide() }, 1000) }

	hide() {
		this.element.style.width = "0%"
		this.tickstate = 0
		super.hide() } }

class Infobar extends Element {
	element_constructor() {
		const elem = document.createElement("div")
		elem.id = "infobar"
		return elem }

	info(what) { this.element.text = what } }

class FeedListItem extends Element {
	constructor(parent, data) {
		super(parent)
		this.data = data }

	element_constructor() {
		const elem = document.createElement("div")
		elem.className = "feedlistitem"
		return elem }

	onclick() {
		G.itemlist.load(this.data)
		this.active()
		if (G.feedlist.active_feed) G.feedlist.active_feed.inactive()
		G.feedlist.active_feed = this }

	active() {
		this.elemement.className = "feedlistitem active" }

	inactive() {
		this.elemement.className = "feedlistitem" } }

class FeedList extends Element {
	constructor(parent, feeds) {
		super(parent, feeds)
		this.active_feed = null }

	element_constructor(feeds) {
		const elem = document.createElement("nav")
		elem.id = "feedlist"
		Object.keys(feeds).forEach(feed => {
			new FeedListItem(this.element, feeds[feed])})
		return elem } }

class ItemList extends Element {
	element_constructor() {
		const elem = document.createElement("main")
		elem.id = "itemlist"
		return elem }

	load(items) {
		items.forEach(item => {
			new ItemListItem(this.element, item) })}}

class ItemListItem extends Element {
	constructor(parent, data) {
		super(parent, data)
		this.href = data.href }

	element_constructor(data) {
		const elem = document.createElement("article")
		elem.innerHTML = `<h1>${data.title}</h1>
			<p><span>${data.chapters}</span> <span>${data.author}</span></p>
			<div class="date">${data.date}</div>`
		return elem }

	onclick() { window.open(this.href) }}

function GET(URL, cb) {
	const req = new XMLHttpRequest()
	req.onload = function() { cb(req) }
	req.open("GET", URL)
	req.send() }

function next_page(doc) { return doc.querySelector("a[rel='next']").href }

function searchpath() {
	return window.location.pathname + window.location.search }

function inject_search() {
	const elem = $("#main > h2.heading")
	const a = new SearchAdder(elem) }

function inject_feed() {
	document.open()
	document.write(FEED_HTML)
	document.close()
	G.feedlist = new FeedList(document.body, DATA)
	G.itemlist = new ItemList(document.body) }

function default_inject() {
	const list = $("ul.primary.navigation.actions")
	const a = document.createElement("a")
	a.href = "/aooo2feed"
	a.text = "aooo2feed"
	a.style = "float: left"
	list.appendChild(a) }

function main() {
	if (RANMAIN) return
	else RANMAIN = true
	default_inject()
	const inject_hash = {
		"/aooo2feed": inject_feed,
		"/works/search": inject_search }
	const fn = inject_hash[window.location.pathname]
	if (fn) fn() }

main()})()
