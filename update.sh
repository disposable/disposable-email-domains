#!/bin/bash
git pull -q -f

cd disposable
git pull -q -f
cd ..

tmpfile=$(mktemp)
./disposable/.generate --source-map --dns-verify 2>$tmpfile
git commit -m "$(printf "Update domains\n\n"; cat $tmpfile)" \
    domains.txt domains.json domains_legacy.txt domains_mx.txt domains_mx.json \
    domains_sha1.json domains_sha1.txt domains_source_map.txt \
    disposable
rm "$tmpfile"
git push -q
