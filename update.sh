#!/bin/bash
# Optional local secrets (API keys for gated sources, e.g. DUSTMAIL_API_KEY)
[ -f "$HOME/.disposable-env" ] && . "$HOME/.disposable-env"

# Re-exec if the pull changed this script - bash reads script files
# incrementally, so continuing under a replaced file can skip or garble
# lines (this is how a generated-but-uncommitted domains_forwarding.* got
# stranded once).
old_sum=$(md5sum "$0" 2>/dev/null | cut -d' ' -f1)
git pull -q -f
if [ -n "$old_sum" ] && ! md5sum "$0" | grep -q "$old_sum"; then
    exec bash "$0" "$@"
fi

# Restore the history DB from the orphan "state" branch if it is missing
# locally. The file is intentionally untracked on master.
if [ ! -f history.duckdb ] && git fetch -q --depth=1 origin state 2>/dev/null; then
    git show FETCH_HEAD:history.duckdb > history.duckdb 2>/dev/null || rm -f history.duckdb
fi

cd disposable
git pull -q -f
cd ..

tmpfile=$(mktemp)
(cd disposable && uv sync -qq)
uv --project disposable run ./disposable/.generate --dedicated-strict --source-map --dns-verify 2>$tmpfile || exit 1

# Only commit if domain files actually changed (not just submodule bump)
# source_cache.json (pre-DuckDB retention cache) is migrated on first run;
# its tracked deletion is committed once the migration has happened.
# history.duckdb is excluded: it lives on the orphan "state" branch and is
# pushed separately below so retention data survives runs with no domain
# changes.
if git diff --quiet disposable domains.txt domains.json domains_legacy.txt domains_mx.txt domains_mx.json \
    domains_sha1.json domains_sha1.txt domains_source_map.txt \
    domains_strict.json domains_strict.txt domains_strict_sha1.json domains_strict_sha1.txt \
    domains_strict_source_map.txt domains_strict_mx.json domains_strict_mx.txt \
    domains_forwarding.txt domains_forwarding.json 2>/dev/null; then
    echo "No domain changes to commit"
else
    files="disposable domains.txt domains.json domains_legacy.txt domains_mx.txt domains_mx.json \
        domains_sha1.json domains_sha1.txt domains_source_map.txt \
        domains_strict.json domains_strict.txt domains_strict_sha1.json domains_strict_sha1.txt \
        domains_strict_source_map.txt domains_strict_mx.json domains_strict_mx.txt \
        domains_forwarding.txt domains_forwarding.json"
    # New files may be untracked - stage them so commit-by-path picks them up
    git add -A -- domains_forwarding.txt domains_forwarding.json
    for f in source_cache.json; do
        if [ -f "$f" ] || git ls-files --error-unmatch "$f" >/dev/null 2>&1; then
            git add -A -- "$f"
            files="$files $f"
        fi
    done
    git commit -m "$(printf "Update domains\n\n"; head -n 500 $tmpfile)" $files
fi
rm "$tmpfile"
git push -q

# Push the history DB to the orphan "state" branch via plumbing, without
# touching the worktree. Runs even when no domain files changed.
if [ -f history.duckdb ]; then
    blob=$(git hash-object -w history.duckdb)
    tree=$(printf '100644 blob %s\thistory.duckdb\n' "$blob" | git mktree)
    if git fetch -q --depth=1 origin state 2>/dev/null; then
        parent=$(git rev-parse FETCH_HEAD)
        if [ "$(git rev-parse "FETCH_HEAD^{tree}")" != "$tree" ]; then
            commit=$(git commit-tree "$tree" -p "$parent" -m "Update domain history")
            git push -q origin "$commit:refs/heads/state"
        fi
    else
        commit=$(git commit-tree "$tree" -m "Initialize state branch with domain history")
        git push -q origin "$commit:refs/heads/state"
    fi
fi
