// assets/js/lookup.js
// Cache object to store loaded JSON files
const cache = {};

// Function to validate a domain name
function isValidDomain(domain) {
    domain = domain.trim();
    const domainRegex = /^(?!:\/\/)([a-zA-Z0-9-_]{1,63}\.)+[a-zA-Z]{2,63}$/;
    return domainRegex.test(domain);
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function showMessage(html, type) {
    const messageDiv = document.getElementById('result');
    messageDiv.innerHTML = html;
    messageDiv.className = 'alert ' + type;
}

// Function to calculate SHA-1 hash
async function calculateSha1(input) {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

// Function to fetch and cache JSON file
async function fetchAndCacheJson(prefix) {
    if (cache[prefix]) {
        return cache[prefix];
    }

    try {
        const response = await fetch(`cache/${prefix}.json?v=${Date.now()}`);
        if (!response.ok) {
            throw new Error(`Failed to load cache/${prefix}.json`);
        }

        const jsonData = await response.json();
        cache[prefix] = jsonData;
        return jsonData;
    } catch (error) {
        return null;
    }
}

// Process a single domain and return a structured result object
async function processDomain(input) {
    const cleanedInput = input.replace(/\s+/g, '').toLowerCase();

    if (!isValidDomain(cleanedInput)) {
        return { valid: false, domain: cleanedInput, error: 'invalid' };
    }

    const sha1Hash = await calculateSha1(cleanedInput);
    const prefix = sha1Hash.slice(0, 2);

    const jsonData = await fetchAndCacheJson(prefix);
    if (!jsonData) {
        return { valid: true, domain: cleanedInput, error: 'load_failed', prefix: prefix };
    }

    const data = jsonData[sha1Hash];
    if (!data) {
        return { valid: true, domain: cleanedInput, listed: false };
    }

    return { valid: true, domain: cleanedInput, listed: true, data: data };
}

function formatSingleDomainMessage(result) {
    if (result.error === 'invalid') {
        return `Domain ${escapeHtml(result.domain)} is not valid.`;
    }
    if (result.error === 'load_failed') {
        return `Could not load JSON file for prefix: ${result.prefix}.`;
    }
    if (!result.listed) {
        return `Domain ${escapeHtml(result.domain)} is not listed.`;
    }

    const data = result.data;

    if (data.whitelist) {
        return `Domain ${escapeHtml(data.domain)} is excluded by <a href="https://github.com/disposable/disposable/blob/master/whitelist.txt" target="_blank">whitelist</a>.`;
    }

    let msg = `<h1>Domain ${data.domain} ${data.strict ? 'is on <a href="https://github.com/disposable/disposable?tab=readme-ov-file#strict-mode" target="_blank">strict mode list</a>' :
             'is listed'}!</h1><p><h2>Sources:</h2><ul>`;
    let has_external = false;
    for (let i = 0; i < data.src.length; i++) {
        const entry = data.src[i],
            external = entry['ext'];
        let url = entry['url'],
            link = url,
            issue_link = null,
            is_github = false;

        if (external) {
            has_external = true;
        }

        if (url.startsWith('https://raw.githubusercontent.com/')) {
            const parts = url.split('/'),
                user = parts[3],
                repo = parts[4],
                branch = parts[5];
            let file = parts.slice(6).join('/');

            if (file.endsWith('/')) {
                file = file.slice(0, -1);
            }

            is_github = true;
            link = `https://github.com/${user}/${repo}/blob/${branch}/${file}`;
            issue_link = `https://github.com/${user}/${repo}/issues/new`;
            url = url.replace('https://raw.githubusercontent.com/', '');
        }
        msg += `<li><a href="${link}" target="_blank" ${is_github ? 'class="github-link"' : ''}>${url}</a>${external && !is_github ? ' (external)' : ''}
            ${issue_link ? ' (false positive? <a href="' + issue_link + '" target="_blank">create issue</a>)' : ''}</li>`;
    }
    msg += '</ul></p>';

    if (!has_external) {
        msg += `<p>This domain was added from the <a href="https://github.com/disposable/disposable-email-domains" target="_blank">official repository</a>.
If you believe this domain is incorrectly listed as disposable, please <a href="https://github.com/disposable/disposable/issues/new?template=non-disposable-domain-listed.md" target="_blank">report it as a false positive</a>.</p>`;
    } else {
        msg += `<p>This domain was sourced from an external provider. As we do not manage external sources, we are unable to handle false-positive reports for these. Please contact the source directly for any inquiries.</p>`;
    }

    return msg;
}

async function lookup(domainInput) {
    const domains = domainInput.split(/[\s,;]+/).filter(d => d.trim() !== '');

    if (domains.length === 0) {
        showMessage('Please enter at least one domain.', 'error');
        return;
    }

    const results = await Promise.all(domains.map(d => processDomain(d)));

    if (domains.length === 1) {
        const result = results[0];
        let type = 'info';
        if (result.error === 'invalid') {
            type = 'error';
        } else if (!result.listed && !result.error) {
            type = 'success';
        } else if (result.listed && result.data && result.data.whitelist) {
            type = 'success';
        }
        showMessage(formatSingleDomainMessage(result), type);
        return;
    }

    // Bulk results aggregation
    const invalid = results.filter(r => r.error === 'invalid');
    const loadFailed = results.filter(r => r.error === 'load_failed');
    const notListed = results.filter(r => r.valid && !r.listed && !r.error);
    const listed = results.filter(r => r.listed && r.data && !r.data.whitelist);
    const whitelisted = results.filter(r => r.listed && r.data && r.data.whitelist);

    let msg = `<h2>Bulk Lookup Results</h2>`;

    msg += `<div class="result-summary">`;
    if (listed.length > 0) {
        msg += `<span class="result-badge badge-listed">Listed: ${listed.length}</span>`;
    }
    if (whitelisted.length > 0) {
        msg += `<span class="result-badge badge-whitelisted">Whitelisted: ${whitelisted.length}</span>`;
    }
    if (notListed.length > 0) {
        msg += `<span class="result-badge badge-notlisted">Not Listed: ${notListed.length}</span>`;
    }
    if (invalid.length > 0) {
        msg += `<span class="result-badge badge-invalid">Invalid: ${invalid.length}</span>`;
    }
    if (loadFailed.length > 0) {
        msg += `<span class="result-badge badge-loadfailed">Load Failed: ${loadFailed.length}</span>`;
    }
    msg += `</div>`;

    if (listed.length > 0) {
        msg += `<div class="result-section"><h3>Listed (${listed.length})</h3><ul>`;
        for (const r of listed) {
            msg += `<li><strong>${escapeHtml(r.data.domain)}</strong>${r.data.strict ? ' (strict)' : ''}</li>`;
        }
        msg += `</ul></div>`;
    }

    if (whitelisted.length > 0) {
        msg += `<div class="result-section"><h3>Whitelisted (${whitelisted.length})</h3><ul>`;
        for (const r of whitelisted) {
            msg += `<li><strong>${escapeHtml(r.data.domain)}</strong> - excluded by <a href="https://github.com/disposable/disposable/blob/master/whitelist.txt" target="_blank">whitelist</a></li>`;
        }
        msg += `</ul></div>`;
    }

    if (notListed.length > 0) {
        msg += `<div class="result-section"><h3>Not Listed (${notListed.length})</h3><ul>`;
        for (const r of notListed) {
            msg += `<li>${escapeHtml(r.domain)}</li>`;
        }
        msg += `</ul></div>`;
    }

    if (invalid.length > 0) {
        msg += `<div class="result-section"><h3>Invalid (${invalid.length})</h3><ul>`;
        for (const r of invalid) {
            msg += `<li>${escapeHtml(r.domain)}</li>`;
        }
        msg += `</ul></div>`;
    }

    if (loadFailed.length > 0) {
        msg += `<div class="result-section"><h3>Load Failed (${loadFailed.length})</h3><ul>`;
        for (const r of loadFailed) {
            msg += `<li>${escapeHtml(r.domain)} (prefix: ${r.prefix})</li>`;
        }
        msg += `</ul></div>`;
    }

    let type = 'info';
    if (listed.length > 0) {
        type = 'error';
    } else if (invalid.length === results.length) {
        type = 'error';
    } else if (whitelisted.length > 0 || notListed.length > 0) {
        type = 'success';
    }

    showMessage(msg, type);
}

document.getElementById('lookup-form').addEventListener('submit', function (event) {
    event.preventDefault();
    const domainInput = document.getElementById('domain').value;
    lookup(domainInput);
});

// check if domain query parameter is given, set as value of input and submit
const domain = new URLSearchParams(window.location.search).get('domain');
if (domain) {
    document.getElementById('domain').value = domain;
    lookup(domain);
}