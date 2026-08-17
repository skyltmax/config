#!/bin/bash

set -eo pipefail

MARKER_FILE=".devcontainer/.bootdone"

if [ -f "${MARKER_FILE}" ]; then
  source "${MARKER_FILE}"
fi

sudo chown -R vscode:vscode .ruby-lsp
sudo chown -R vscode:vscode /usr/local/bundle

git config --global --add safe.directory $DEVC_WORKSPACE

# node_modules outlives the image, so modules built against the previous major have to go.
if [ "${PNPM_ALREADY_RESET_1}" != "true" ]; then
  rm -rf $DEVC_WORKSPACE/node_modules

  PNPM_ALREADY_RESET_1="true"
fi

# The bundle volume outlives the image, so gems built against the previous Ruby have to go.
if [ "${GEMS_ALREADY_RESET_1}" != "true" ]; then
  rm -rf /usr/local/bundle/*
  sudo chown -R vscode:vscode /usr/local/bundle

  GEMS_ALREADY_RESET_1="true"
fi

if [ "${CHANGELOG_DISPLAYED_35}" != "true" ]; then
  if [ -f "/var/lib/smdevc/changelog" ]; then
    printf "\n"
    toilet -f term -t -F border:metal "Latest Changes"
    cat /var/lib/smdevc/changelog
  fi

  CHANGELOG_DISPLAYED_35="true"
fi

echo -e "\
  GEMS_ALREADY_RESET_1=${GEMS_ALREADY_RESET_1}\n\
  PNPM_ALREADY_RESET_1=${PNPM_ALREADY_RESET_1}\n\
  CHANGELOG_DISPLAYED_35=${CHANGELOG_DISPLAYED_35}" > "${MARKER_FILE}"

printf "\n\n\e[38;2;252;163;17m"
toilet -f standard "Config"
printf "\nEnvironment prepared! Get ready to code!\n\n"
printf "\e[0m"
