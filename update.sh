#!/bin/bash
# Optional local secrets (API keys for gated sources, e.g. DUSTMAIL_API_KEY)
[ -f "$HOME/.disposable-env" ] && . "$HOME/.disposable-env"

git pull -q -f

cd disposable
git pull -q -f
cd ..

tmpfile=$(mktemp)
(cd disposable && uv sync -qq)
uv --project disposable run ./disposable/.generate --dedicated-strict --source-map --dns-verify 2>$tmpfile || exit 1

# Only commit if domain files actually changed (not just submodule bump)
# source_cache.json timestamps change every run, so it is excluded from the
# change check but committed alongside whenever domain files change.
if git diff --quiet domains.txt domains.json domains_legacy.txt domains_mx.txt domains_mx.json \
    domains_sha1.json domains_sha1.txt domains_source_map.txt \
    domains_strict.json domains_strict.txt domains_strict_sha1.json domains_strict_sha1.txt \
    domains_strict_source_map.txt domains_strict_mx.json domains_strict_mx.txt 2>/dev/null; then
    echo "No domain changes to commit"
else
    [ -f source_cache.json ] && git add source_cache.json
    git commit -m "$(printf "Update domains\n\n"; head -n 500 $tmpfile)" \
        domains.txt domains.json domains_legacy.txt domains_mx.txt domains_mx.json \
        domains_sha1.json domains_sha1.txt domains_source_map.txt \
        domains_strict.json domains_strict.txt domains_strict_sha1.json domains_strict_sha1.txt \
        domains_strict_source_map.txt domains_strict_mx.json domains_strict_mx.txt \
        source_cache.json
fi
rm "$tmpfile"
git push -q
