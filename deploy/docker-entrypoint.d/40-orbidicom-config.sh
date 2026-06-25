#!/bin/sh
# Regenerate the runtime config (and optional DICOMweb reverse proxy) from
# environment variables before nginx starts. Runs as uid 101 via the base
# image's /docker-entrypoint.d mechanism, so one image serves any PACS.
set -eu

HTML_DIR="${ORBIDICOM_HTML_DIR:-/usr/share/nginx/html}"
PACS_URL="${ORBIDICOM_PACS_URL:-}"
STUDY_UID="${ORBIDICOM_STUDY_UID:-}"
PACS_UPSTREAM="${ORBIDICOM_PACS_UPSTREAM:-}"

# Strip characters that would break out of the JS string literals below. The
# values are operator-supplied (Helm), so this is belt-and-braces, not a trust
# boundary.
sanitize() {
    printf '%s' "$1" | tr -d '"\\\n\r'
}
PACS_URL="$(sanitize "$PACS_URL")"
STUDY_UID="$(sanitize "$STUDY_UID")"

# 1) Runtime app config (consumed by config.ts → window.__ORBIDICOM_CONFIG__).
cat > "${HTML_DIR}/config.js" <<EOF
window.__ORBIDICOM_CONFIG__ = {
  pacsUrl: "${PACS_URL}",
  studyUid: "${STUDY_UID}",
};
EOF
echo "orbidicom: wrote config.js (pacsUrl='${PACS_URL}', studyUid='${STUDY_UID}')"

# 2) Optional same-origin DICOMweb reverse proxy → keeps the PACS in-cluster and
#    sidesteps browser CORS. Only emitted when an upstream is provided.
CONF_DIR="/etc/nginx/orbidicom.d"
mkdir -p "$CONF_DIR"
rm -f "${CONF_DIR}/pacs.conf"
if [ -n "$PACS_UPSTREAM" ]; then
    UP="${PACS_UPSTREAM%/}"
    cat > "${CONF_DIR}/pacs.conf" <<EOF
location /dicom-web/ {
    proxy_pass ${UP}/;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_read_timeout 300s;
    client_max_body_size 0;
}
EOF
    echo "orbidicom: enabled /dicom-web reverse proxy -> ${UP}/"
fi
