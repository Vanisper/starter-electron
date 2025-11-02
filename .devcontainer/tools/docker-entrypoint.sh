#!/usr/bin/env bash
set -e

if [ -f "/usr/local/share/desktop-init.sh" ]; then
    echo "初始化VNC..."
    /usr/local/share/desktop-init.sh || true
fi

exec "$@"
