// assets/js/lookup.js
// Cache object to store loaded JSON files
const cache = {};

// Function to validate a domain name
function isValidDomain(domain) {
    // Remove any spaces
    domain = domain.trim();

    // Regular expression for a valid domain name
    const domainRegex = /^(?!:\/\/)([a-zA-Z0-9-_]{1,63}\.)+[a-zA-Z]{2,63}$/;

    // Test the domain against the regex
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
    // Check if the file is already cached
    if (cache[prefix]) {
        return cache[prefix];
    }

    try {
        const response = await fetch(`cache/${prefix}.json?v=${Date.now()}`);
        if (!response.ok) {
            throw new Error(`Failed to load cache/${prefix}.json`);
        }

        const jsonData = await response.json();
        cache[prefix] = jsonData; // Cache the loaded JSON data
        return jsonData;
    } catch (error) {
        showMessage(error.message, 'error');
        return null;
    }
}
// Function to process the input
async function processDomain(input) {
    // Clean input by removing spaces and converting to lowercase
    const cleanedInput = input.replace(/\s+/g, '').toLowerCase();

    // Validate the cleaned domain
    if (!isValidDomain(cleanedInput)) {
        showMessage(`Domain ${escapeHtml(cleanedInput)} is not valid.`, 'error');
        return null, null;
    }

    // Calculate SHA-1 of the valid, lowercase domain
    const sha1Hash = await calculateSha1(cleanedInput);
    const prefix = sha1Hash.slice(0, 2); // Extract the first 2 characters of the hash

    // Load the corresponding JSON file
    const jsonData = await fetchAndCacheJson(prefix);
    if (!jsonData) {
        showMessage(`Could not load JSON file for prefix: ${prefix}.`, 'error');
        return null, null;
    }

    // Look up the SHA-1 hash in the JSON data
    if (!jsonData[sha1Hash]) {
        showMessage(`Domain ${escapeHtml(cleanedInput)} is not listed.`, 'success');
    }

    return jsonData[sha1Hash];
}

function lookup(domainInput) {
    processDomain(domainInput).then((data) => {
        if (!data) {
            return;
        }

        if (data.whitelist) {
            showMessage(`Domain ${escapeHtml(data.domain)} is excluded by <a href="https://github.com/disposable/disposable/blob/master/whitelist.txt" target="_blank">whitelist</a>.`, 'success');
            return;
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
                // reformat link to github repository page in https://github.com/<user>/<repo>/blob/<branch>/<filepath>
                const parts = url.split('/'),
                    user = parts[3],
                    repo = parts[4],
                    branch = parts[5],
                    file = parts.slice(6).join('/');

                // remove tailing slash in file
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
            // add link to create false-positive issue on main repository
            msg += `<p>This domain was added from the <a href="https://github.com/disposable/disposable-email-domains" target="_blank">official repository</a>.
If you believe this domain is incorrectly listed as disposable, please <a href="https://github.com/disposable/disposable/issues/new?template=non-disposable-domain-listed.md" target="_blank">report it as a false positive</a>.</p>`;
        } else {
            // show message that issue creation for external sources is not possible
            msg += `<p>This domain was sourced from an external provider. As we do not manage external sources, we are unable to handle false-positive reports for these. Please contact the source directly for any inquiries.</p>`;
        }

        showMessage(msg, 'info');
    });
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