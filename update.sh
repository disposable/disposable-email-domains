#!/bin/bash
cd disposable
git pull >/dev/null
cd ..

tmpfile=$(mktemp)
updated=0
./disposable/.generate >$tmpfile && updated=1
if [ "$updated" == "0" ]; then
    # no update
    exit
fi

git commit -m "$(printf "Update domains\n\n"; cat $tmpfile)" domains.txt domains.json domains_sha1.json domains_sha1.txt
git push

