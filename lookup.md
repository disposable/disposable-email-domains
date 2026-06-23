---
layout: default
title: Lookup a domain
description: "To check if a domain is listed on the disposable email list, please use the lookup form below."
show_downloads: false
---

<div class="lookup-container">
  <form id="lookup-form">
    <label for="domain">Enter one or more domain names</label>
    <p class="form-hint">Separate by spaces, commas, semicolons, or newlines</p>
    <textarea id="domain" name="domain" rows="6" placeholder="example.com, mailinator.com, tempmail.net" required></textarea>
    <button type="submit" class="btn-primary">Lookup</button>
  </form>

  <div id="result" class="alert"></div>
</div>

<script src="https://unpkg.com/tldjs@2.3.1/tld.js"></script>
<script src="{{ '/assets/js/lookup.js' | relative_url }}"></script>
