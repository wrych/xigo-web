# Deploying xigo-web

How a commit reaches staging.xigo.ch and xigo.ch (ADR 0004), and the one-time
setup a maintainer does by hand.

## How it works

| Step       | Trigger                                       | What happens                                                                     |
| ---------- | --------------------------------------------- | -------------------------------------------------------------------------------- |
| staging    | push to `main`, CI green, still `main`'s head | `scripts/package.sh` once, upload as `receive <sha>`; staging switches to it     |
| production | **Promote to production** workflow, approved  | `promote <sha>` — production switches to a release already on the server         |
| rollback   | the same workflow with an earlier commit      | production switches back; the server keeps the last five releases plus both live |

**Out of order.** CI runs finish in any order, and a re-run can come hours
late. A run deploys only if `main` still points at its commit
(`scripts/deploy-is-current.sh`), asked once before it queues and again right
before it uploads; staging deploys run one at a time. An older run that finishes
last therefore deploys nothing. Promotion needs no such check: it is started by
hand, one at a time, and names its commit.

On the server, inside the SSH chroot:

```
/xigo-web/bin/deploy            the only command the deploy key may run
/xigo-web/releases/<sha>/       one folder per release: dist/, node_modules/
/xigo-web/state/<target>        the commit each target runs
/xigo-web/lock/                 held while a release is received or promoted
/staging.xigo.ch/current        → ../xigo-web/releases/<sha>
/staging.xigo.ch/app.js         Passenger's startup file; starts current/
/staging.xigo.ch/tmp/restart.txt  touched to restart the app
```

`/xigo.ch` gets the same `current` and `app.js` on the first promotion.

## One-time setup

Run these from your own computer, logging in with the **password**, not the
deploy key. Set the three variables first, to the values of the GitHub
variables `DEPLOY_HOST`, `DEPLOY_PORT` and `DEPLOY_USER`; they are kept out of
this public repository.

1. **Plesk, staging.xigo.ch → Node.js**: Application Mode **production**,
   Application Startup File **app.js**, Node **26.13**. Do not run "NPM
   install" there: every release brings its own dependencies.
2. **Install the deploy script** from a checkout of this repository:

   ```bash
   ssh -p "$DEPLOY_PORT" "$DEPLOY_USER@$DEPLOY_HOST" 'mkdir -p /xigo-web/bin'
   ```

   ```bash
   scp -P "$DEPLOY_PORT" deploy/server/deploy "$DEPLOY_USER@$DEPLOY_HOST":/xigo-web/bin/deploy
   ```

   ```bash
   ssh -p "$DEPLOY_PORT" "$DEPLOY_USER@$DEPLOY_HOST" 'chmod 750 /xigo-web/bin/deploy'
   ```

3. **Restrict the key.** Put this in front of the deploy key's
   `ssh-ed25519 …` line in `/.ssh/authorized_keys`, with one space after it:

   ```
   restrict,command="/bin/bash /xigo-web/bin/deploy"
   ```

   The script is started through `bash`: the hosting kills files started
   directly from the home folder (`Killed`, and ssh exits with 255). The
   chroot has no `cat`, and `vi` may be missing, so this rewrites the line with
   `bash` alone. It finds the deploy key by its public key, replaces any
   options the line already has, and keeps a backup. It refuses to run without
   a valid public key, and restores the backup and fails if the key is not in
   the file:

   ```bash
   ssh -p "$DEPLOY_PORT" "$DEPLOY_USER@$DEPLOY_HOST" "key=$(cut -d' ' -f2 ~/.ssh/xigo-web-deploy.pub)"'; case "$key" in AAAAC3NzaC1lZDI1NTE5*) ;; *) echo "not an ed25519 public key: $key" >&2; exit 1 ;; esac; f=/.ssh/authorized_keys; cp "$f" "$f.bak" || exit 1; found=; while IFS= read -r line || [ -n "$line" ]; do case "$line" in *"ssh-ed25519 $key" | *"ssh-ed25519 $key "*) found=yes; printf "%s\n" "restrict,command=\"/bin/bash /xigo-web/bin/deploy\" ssh-ed25519 ${line#*ssh-ed25519 }" ;; *) printf "%s\n" "$line" ;; esac; done < "$f.bak" > "$f"; if [ -z "$found" ]; then cp "$f.bak" "$f"; echo "the deploy key is not in $f" >&2; exit 1; fi; chmod 600 "$f" && echo "$(< "$f")"'
   ```

4. **Check it.** The first must print nothing and succeed; the second must be
   refused with `deploy: allowed: …`:

   ```bash
   ssh -i ~/.ssh/xigo-web-deploy -p "$DEPLOY_PORT" "$DEPLOY_USER@$DEPLOY_HOST" releases
   ```

   ```bash
   ssh -i ~/.ssh/xigo-web-deploy -p "$DEPLOY_PORT" "$DEPLOY_USER@$DEPLOY_HOST" ls /
   ```

5. **Remove the key from your computer** once the GitHub secrets hold it: what
   the key deploys runs as the user that owns every site in the subscription
   (ADR 0004, Consequences).
6. **Deploy**: merge to `main` (or re-run CI on `main`), then press **Enable Node.js** for staging.xigo.ch in Plesk.

Production is set up the same way for xigo.ch when the new site replaces the
current one. Until then, do not run the promote workflow: it would place the
new site next to the old one.

## When a deploy is refused with "another deploy holds …/lock"

Wait for the other deploy and run yours again. If none is running — a run was
killed hard — remove the lock by hand:

```bash
ssh -p "$DEPLOY_PORT" "$DEPLOY_USER@$DEPLOY_HOST" 'rm -r /xigo-web/lock'
```

## When the deploy script changes

A deploy never installs it. A maintainer repeats step 2 after the change is
merged.
