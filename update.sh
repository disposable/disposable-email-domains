#!/bin/bash
git pull -q -f

cd disposable
git pull -q -f
cd ..

updated=0
tmpfile=$(mktemp)
./disposable/.generate --source-map >$tmpfile && updated=1
if [ "$updated" == "0" ]; then
    # no update
    rm "$tmpfile"
    exit
fi

git commit -m "$(printf "Update domains\n\n"; cat $tmpfile)" domains.txt domains.json domains_sha1.json domains_sha1.txt domains_source_map.txt disposable
rm "$tmpfile"
git push -q
