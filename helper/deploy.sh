#!/usr/bin/env bash

env=.env

function get_env() {
    set -a # automatically export all variables
    # shellcheck disable=SC1090
    source "${env}"
    set +a
}

get_env
yarn netlify deploy --prod --dir lib --site "${SITE_ID}"
