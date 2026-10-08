#!/usr/bin/python3
import hashlib
import json
import os
import logging
import sys
import urllib.request
sys.path.append('./disposable/')
sys.path.append('./disposable/src')
from disposable import disposableHostGenerator
from disposablehosts.preprocessing.mailservices import _split_hosts

MAILSERVICES_URL = "https://raw.githubusercontent.com/disposable/static-disposable-lists/master/mailservices.json"

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')


def load_mailservices():
    """Load the mail services catalog for provider attribution.

    Returns:
        Tuple of (svc_by_domain, svc_meta, whitelist_domains, grey_domains)
        where svc_by_domain maps each catalog host to its service name and
        svc_meta holds per-service type/verification/remark for display.
    """
    svc_by_domain = {}
    svc_meta = {}
    whitelist = set()
    grey = set()
    try:
        with urllib.request.urlopen(MAILSERVICES_URL, timeout=30) as res:
            catalog = json.load(res)
    except Exception as e:
        logging.warning("Failed to load mailservices.json: %s", e)
        return svc_by_domain, svc_meta, whitelist, grey

    whitelist, grey = _split_hosts(catalog)
    for name, svc in catalog.items():
        if not isinstance(svc, dict):
            continue
        svc_meta[name] = {
            'name': name,
            'type': svc.get('type'),
            'verification': svc.get('signup_verification') or [],
            'remark': svc.get('remark') or '',
        }
        for host in svc.get('hosts', []):
            if isinstance(host, str):
                svc_by_domain[host.lower()] = name
    return svc_by_domain, svc_meta, whitelist, grey


def create_cache():
    """Create a hash-based cache of domains and their sources.

    The cache is stored in a 'cache' directory with one file per
    2-character prefix of the domain hash.

    Each file contains a JSON object with the domain hash as keys
    and the domain and its source as values.
    """

    external_sources = []
    for source in disposableHostGenerator.sources:
        if source.get('external'):
            external_sources.append(source['src'])

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
                    'domain': domain,
                    'strict': False,
                    'src': []
                }

        # Add domains from grey/strict list
        with open('disposable/greylist.txt') as f:
            for domain in f:
                domain = domain.strip()
                if domain.startswith('#') or domain == '':
                    continue
                domain_hash = hashlib.sha1(domain.encode('utf8')).hexdigest()

                hash_prefix = domain_hash[:2]
                if hash_prefix not in domain_cache:
                    domain_cache[hash_prefix] = {}

                domain_cache[hash_prefix][domain_hash] = {
                    'domain': domain,
                    'strict': True,
                    'src': [
                        {
                            'url': 'https://raw.githubusercontent.com/disposable/disposable/master/greylist.txt',
                            'ext': False
                        }
                    ]
                }

        # Add domains from the generated strict list. It includes
        # greylist.txt plus the mailservices.json grey tier (freemail and
        # forwarding providers with anonymous signup), which greylist.txt
        # alone does not cover.
        if os.path.exists('domains_strict.txt'):
            with open('domains_strict.txt') as f:
                for domain in f:
                    domain = domain.strip()
                    if domain.startswith('#') or domain == '':
                        continue
                    domain_hash = hashlib.sha1(domain.encode('utf8')).hexdigest()

                    hash_prefix = domain_hash[:2]
                    if hash_prefix not in domain_cache:
                        domain_cache[hash_prefix] = {}
                    if domain_hash in domain_cache[hash_prefix]:
                        continue

                    domain_cache[hash_prefix][domain_hash] = {
                        'domain': domain,
                        'strict': True,
                        'src': []
                    }

        # Add domains from grey/whitelist list
        with open('disposable/whitelist.txt') as f:
            for domain in f:
                domain = domain.strip()
                if domain.startswith('#') or domain == '':
                    continue
                domain_hash = hashlib.sha1(domain.encode('utf8')).hexdigest()

                hash_prefix = domain_hash[:2]
                if hash_prefix not in domain_cache:
                    domain_cache[hash_prefix] = {}

                domain_cache[hash_prefix][domain_hash] = {
                    'domain': domain,
                    'whitelist': True,
                    'src': [
                        {
                            'url': 'https://raw.githubusercontent.com/disposable/disposable/master/whitelist.txt',
                            'ext': False
                        }
                    ]
                }

        # Mail services catalog: provider attribution plus entries for
        # catalog hosts not covered by the files above (mailservices-
        # whitelisted domains are absent from every list file).
        svc_by_domain, svc_meta, whitelist_ms, grey_ms = load_mailservices()
        for domain in whitelist_ms | grey_ms:
            domain_hash = hashlib.sha1(domain.encode('utf8')).hexdigest()
            hash_prefix = domain_hash[:2]
            if hash_prefix not in domain_cache:
                domain_cache[hash_prefix] = {}
            if domain_hash not in domain_cache[hash_prefix]:
                if domain in grey_ms:
                    domain_cache[hash_prefix][domain_hash] = {
                        'domain': domain,
                        'strict': True,
                        'src': [{'url': MAILSERVICES_URL, 'ext': False}]
                    }
                else:
                    domain_cache[hash_prefix][domain_hash] = {
                        'domain': domain,
                        'whitelist': True,
                        'src': [{'url': MAILSERVICES_URL, 'ext': False}]
                    }

        for domain_data in domain_cache.values():
            for entry in domain_data.values():
                svc_name = svc_by_domain.get(entry['domain'])
                if svc_name:
                    entry['svc'] = svc_meta[svc_name]

        for source_map in ('domains_source_map.txt', 'domains_strict_source_map.txt'):
            if not os.path.exists(source_map):
                continue
            with open(source_map, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line.startswith('#') or line == '' or ':' not in line:
                        continue

                    source_url, domain = line.rsplit(':', 1)
                    domain_hash = hashlib.sha1(domain.encode('utf8')).hexdigest()

                    hash_prefix = domain_hash[:2]
                    if domain_hash not in domain_cache.get(hash_prefix, {}):
                        continue

                    entry = domain_cache[hash_prefix][domain_hash]
                    if source_url in {s['url'] for s in entry['src']}:
                        continue  # domains.txt and domains_strict.txt share sources

                    entry['src'].append({
                        'url': source_url,
                        'ext': source_url in external_sources
                    })

        for hash_prefix, domain_data in domain_cache.items():
            with open('cache/' + hash_prefix + '.json', 'w') as f:
                json.dump(domain_data, f)

    except Exception as e:
        logging.error(e)


if __name__ == '__main__':
    create_cache()
