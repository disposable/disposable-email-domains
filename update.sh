#!/bin/bash
[ -d .venv ] && source .venv/bin/activate
git pull -q -f

cd disposable
git pull -q -f
cd ..

tmpfile=$(mktemp)
./disposable/.generate --dedicated-strict --source-map --dns-verify 2>$tmpfile
git commit -m "$(printf "Update domains\n\n"; cat $tmpfile)" \
    domains.txt domains.json domains_legacy.txt domains_mx.txt domains_mx.json \
    domains_sha1.json domains_sha1.txt domains_source_map.txt \
    domains_strict.json domains_strict.txt domains_strict_sha1.json domains_strict_sha1.txt \
    domains_strict_source_map.txt domains_strict_mx.json domains_strict_mx.txt \
    disposable
rm "$tmpfile"
git push -q
