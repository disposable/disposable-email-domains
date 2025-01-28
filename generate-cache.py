#!/usr/bin/python3
import hashlib
import json
import os
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')

def create_cache():
    """Create a hash-based cache of domains and their sources.

    The cache is stored in a 'cache' directory with one file per
    2-character prefix of the domain hash.

    Each file contains a JSON object with the domain hash as keys
    and the domain and its source as values.
    """
    domain_cache = {}

    if not os.path.exists('cache'):
        os.makedirs('cache')

    try:
        # Split domains hash based on first 2 hex characters
        with open('domains.txt') as f:
            for domain in f:
                domain = domain.strip()
                if domain.startswith('#') or domain == '':
                    continue
                domain_hash = hashlib.sha1(domain.encode('utf8')).hexdigest()

                hash_prefix = domain_hash[:2]
                if hash_prefix not in domain_cache:
                    domain_cache[hash_prefix] = {}

                domain_cache[hash_prefix][domain_hash] = {
                    'domain': domain
                }

        with open('domains_source_map.txt', 'r') as f:
            for line in f:
                line = line.strip()
                if line.startswith('#') or line == '' or ':' not in line:
                    continue

                source, domain = line.rsplit(':', 1)
                domain_hash = hashlib.sha1(domain.encode('utf8')).hexdigest()

                hash_prefix = domain_hash[:2]
                if domain_hash not in domain_cache.get(hash_prefix, {}):
                    continue

                if 'source' in domain_cache[hash_prefix][domain_hash]:
                    domain_cache[hash_prefix][domain_hash]['source'].append(source)
                else:
                    domain_cache[hash_prefix][domain_hash]['source'] = [source]

        for hash_prefix, domain_data in domain_cache.items():
            with open('cache/' + hash_prefix + '.json', 'w') as f:
                json.dump(domain_data, f)

    except Exception as e:
        logging.error(e)

if __name__ == '__main__':
    create_cache()
