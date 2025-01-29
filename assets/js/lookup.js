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

function showMessage(message, type) {
    const messageDiv = document.getElementById('result');
    messageDiv.innerHTML = message;
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
        showMessage(`Domain ${cleanedInput} is not valid.`, 'error');
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
        showMessage(`Domain ${cleanedInput} is not listed.`, 'success');
    }

    return jsonData[sha1Hash];
}

document.getElementById('lookup-form').addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent form submission

    const domainInput = document.getElementById('domain').value;

    processDomain(domainInput).then((data) => {
        if (!data) {
            return;
        }
        let msg = `<h1>Domain ${data.domain} ${data.strict ? 'is on <a href="https://github.com/disposable/disposable?tab=readme-ov-file#strict-mode" target="_blank">strict mode list</a>' : 'is listed'}!</h1><p><h2>Sources:</h2><ul>`;
        for (let i = 0; i < data.src.length; i++) {
            const entry = data.src[i],
                external = entry['ext'];
            let url = entry['url'],
                link = url,
                is_github = false;

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
                url = url.replace('https://raw.githubusercontent.com/', '');
            }
            msg += `<li><a href="${link}" target="_blank" ${is_github ? 'class="github-link"' : ''}>${url}</a>${external ? ' (external)' : ''}</li>`;
        }
        msg += '</ul></p>';
        showMessage(msg, 'info');
    });
});
