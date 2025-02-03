---
layout: default
title: Lookup a domain
description: "To check if a domain is listed on the disposable email list, please use the lookup form below."
show_downloads: false
---

<form id="lookup-form">
  <label for="entry">Enter a domain name:</label>
  <input type="text" id="domain" name="domain" required>
  <button type="submit">Lookup</button>
</form>

<div id="result" class="alert"></div>

<script src="{{ '/assets/js/lookup.js' | relative_url }}"></script>
