<div class="page-intro">
  <p>For more informations, please check the <a href="https://github.com/disposable/disposable" target="_blank">main repository</a>.</p>
  <p class="page-note">If your domain is listed and it is not a domain used for temporary emails, please open <a href="https://github.com/disposable/disposable/issues" target="_blank">an issue</a> in the main repository.</p>
</div>

## Lookup a domain

<div class="lookup-container">
  <form id="lookup-form">
    <label for="domain">Enter one or more domain names</label>
    <p class="form-hint">Separate by spaces, commas, semicolons, or newlines</p>
    <textarea id="domain" name="domain" rows="6" placeholder="example.com, mailinator.com, tempmail.net" required></textarea>
    <button type="submit" class="btn-primary">Lookup</button>
  </form>

  <div id="result" class="alert"></div>
</div>

<script src="{{ '/assets/js/lookup.js' | relative_url }}"></script>

---

## Available Lists

<div class="resource-grid">
  <div class="resource-card">
    <h3>Generic Lists</h3>
    <p>All domains in the list.</p>
    <div class="resource-links">
      <a href="https://disposable.github.io/disposable-email-domains/domains.txt" class="resource-link">TXT</a>
      <a href="https://disposable.github.io/disposable-email-domains/domains.json" class="resource-link">JSON</a>
    </div>
  </div>

  <div class="resource-card">
    <h3>Validated DNS</h3>
    <p>Domains with a valid MX / A record.</p>
    <div class="resource-links">
      <a href="https://disposable.github.io/disposable-email-domains/domains_mx.txt" class="resource-link">TXT</a>
      <a href="https://disposable.github.io/disposable-email-domains/domains_mx.json" class="resource-link">JSON</a>
    </div>
  </div>

  <div class="resource-card">
    <h3>SHA1 Hashes</h3>
    <p>SHA1-hashed domain list.</p>
    <div class="resource-links">
      <a href="https://disposable.github.io/disposable-email-domains/domains_sha1.txt" class="resource-link">TXT</a>
      <a href="https://disposable.github.io/disposable-email-domains/domains_sha1.json" class="resource-link">JSON</a>
    </div>
  </div>
</div>

<div class="last-update">
  <img src="https://img.shields.io/github/last-commit/disposable/disposable-email-domains?label=Last%20update" alt="Last update">
</div>
