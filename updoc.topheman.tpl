<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>boxbox events - API documentation</title>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <link type="text/css" href="http://google-code-prettify.googlecode.com/svn/trunk/src/prettify.css" rel="stylesheet">
    <script type="text/javascript" src="http://google-code-prettify.googlecode.com/svn/trunk/src/prettify.js"></script>
    <style>
body {
  padding: 0;
  margin: 1em 1em 0;
  font-family: Verdana,Geneva,Arial,Helvetica,sans-serif;
  line-height: 1.4em;
}

a {
  color: #900000;
}
a:hover {
  color: black;
}

header {
  margin: 0 0 1em;
}

header a {
  text-decoration: none;
}

header h1 {
  text-align:center;
  margin: 1em 0;
}
header img{
    border : 0px;
}

section {
  padding: .5em 1em;
  margin: 1em;
  border-width: 3px;
  border-style: solid;
  border-color: #900000;
  display : block;
}

h1, h2, h3 {
  margin: 6px 0 .6em;
}

h1 {
  font-size: 1.2em;
}

h2 {
  font-size: 1em;
  margin: .4em 0 .8em;
}

h3 {
  font-size: 0.8em;
}

p {
  margin: .5em 0;
}

ul {
  margin: 0;
}

.description {
  margin: .5em 0;
}

#content {
  margin: 0 auto;
  max-width: 800px;
}

nav {
  padding: .3em;
}

nav.compact {
  line-height: 2em;
  background-color: #e2e3ec;
  display : block;
}

nav ul {
  padding: 2px 7px;
  list-style-type: none;
}

nav.compact ul {
  background-color: transparent;
}

nav.compact ul li {
  font-weight: bold;
}

nav.compact a{
    text-decoration: none;
}

nav.compact a:hover{
    background-color : #900000;
    color : white;
}

.inlineIndexItem {
  padding: .3em .2em;
  background-color: white;
}

footer {
  text-align: center;
  padding: .5em 0;
  color: #858585;
}

footer a:link, footer a:visited {
  color: #5b5c88;
}

code {
  background-color: #eee;
  display: block;
  font-family: monospace;
  white-space: pre;
  margin: .7em;
  padding: .3em .5em;
  color: #1f1f1f;
  overflow:auto;
}

ul.properties {
  list-style-type: none;
  padding: 0 0 0 1em;
}

ul.properties li {
  margin: .3em 0;
}

.property {
  font-weight: bold;
}

.depth0 {
  margin: 1em 0em;
  border-width: 4px;
}

.depth1 {
  margin: 1em 0 1em 1em;
}

.depth2 {
  margin: 1em 0 1em 2em;
}

.depth3 {
  margin: 1em 0 1em 3em;
}

.depth0.header {
  display:none;
}
.warning{
    color:red;
}
    </style>
    <% if (css) { %>
      <link rel="stylesheet" href="<%= css %>"></style>
    <% } %>
  </head>
  <body>
    <div id="content">
      <header>
        <h1>
          <a href="http://topheman.github.com/boxbox/" title="boxbox events - API documentation">
            <img src="http://topheman.github.com/boxbox/boxbox-events.png" alt="boxbox events">
          </a>
        </h2>
        <%= description %>
      </header>
      <nav class="<%= compact_index ? "compact" : ""%>">
        <ul>
          <% _.each(sections, function(s) { %>
            <% if (s.header || s._name) { %>
              <%= compact_index && s._depth === deepest_depth ? "" : "<li>"%>
                <% if (!compact_index || s._depth !== deepest_depth) { %>
                  <% for (var i = shallowest_depth; i < s._depth; i++) {print("- ");} %>
                <% } %>
                <% if (s.header) { %>
                  <a href="#header-<%= s.header.replace(/ /g, '-') %>" class="<% if (compact_index && s._depth === deepest_depth) print("inlineIndexItem") %>"><%= s.header %></a>
                <% } %>
                <% if (!s.header && s._name) { %>
                  <a href="#name-<%= s._module %>-<%= s._name %>" class="<% if (compact_index && s._depth === deepest_depth) print("inlineIndexItem") %>"><%= s._name %></a>
                <% } %>
              <%= compact_index && s._depth === deepest_depth ? "" : "</li>"%>
            <% } %>
          <% }); %>
        </ul>
      </nav>
      <div id="sections">
        <% _.each(sections, function(s) { %>
        
          <section class="depth<%= s._depth %> <%= s.header !== "undefined" ? "header" : "" %>" data-module="<%= s._module %>">
          
            <%= s.header ? '<h1 id="header-' + s.header.replace(/ /g, '-') + '">' + s.header + "</h1>" : "" %>
            
            <% if (s._name) { %>
              <h2 id="name-<%= s._module %>-<%= s._name %>">
                <%= ((s._type === "function" || s._type === "other") && !(s._name === 'Entity' || s._name === 'World' || s._name === 'boxbox') ? "." : "") %><%= s._name %><%= ((s._type === "other" || s._type === "function") && !(s._name === 'Entity' || s._name === 'World' || s._name === 'boxbox') ? "( " + (s._params ? s._params : "") + " )" : "") %>
              </h2>
            <% } %>
            
            <ul class="properties">
              <% _.each(s, function(val, prop) { %>
                <% if (prop !== "header" &&
                       prop !== "description" &&
                       prop !== "_depth" &&
                       prop !== "_module" &&
                       prop !== "_type" &&
                       prop !== "_name" &&
                       prop !== "_params") { %>
                  <li>
                  <%if (val === 'by topheman') { %>
                    <span class="added-by-topheman"><span class="property">added</span> by topheman</span>
                  <% } else if (prop === 'warning') { %>
                    <span class="warning"><span class="property">Warning : </span><%= val %></span>
                  <% } else { %>
                    <span class="property"><%= prop %></span>
                    <span><%= val %></span>
                  <% } %>
                  </li>
                <% } %>
              <% }); %>
            </ul>
            
            <%= s.description ? '<div class="description">' + s.description + "</div>" : "" %>
            
          </section>
        <% }); %>
      </div>
    </div>
    <footer>
      generated by <a href="http://incompl.github.com/updoc/">updoc</a> <%= version %>
    </footer>
    <script>
(function() {
  var codes = document.getElementsByTagName("code")
  for (var i = 0; i < codes.length; i++) {
    codes[i].className = codes[i].className + " prettyprint";
  }
  prettyPrint();
})();
  </script>
  </body>
</html>
