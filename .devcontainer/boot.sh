#!/bin/bash

set -eo pipefail

function bootcmd() {
  printf "\n"
  toilet -f term -t -F border:metal "$1"
  printf "+ $2\n"
}

MARKER_FILE=".devcontainer/.bootdone"

if [ -f "${MARKER_FILE}" ]; then
  source "${MARKER_FILE}"
fi

# Per-user shared volume (skyltmax-dc template), reachable at the same path as on the host.
if [ -d "/home/$HOSTLOGNAME/shared" ]; then
  ln -sfn "/home/$HOSTLOGNAME/shared" /home/vscode/shared
fi

if [ -d "/home/$HOSTLOGNAME/.config" ]; then
  sudo chown -R vscode:vscode /home/$HOSTLOGNAME/.config
fi

# Commit signing config written by the Coder template on the workspace host (home.sh in
# skyltmax/infra); the key path inside it resolves in-container through the host-home bind.
# Inert when absent — git skips missing [include] paths (the dotfiles .gitconfig carries the include).
if [ -f "/home/$HOSTLOGNAME/.config/git/coder-signing" ]; then
  mkdir -p /home/vscode/.config/git
  cp "/home/$HOSTLOGNAME/.config/git/coder-signing" /home/vscode/.config/git/coder-signing
fi

sudo chown -R vscode:vscode .ruby-lsp
sudo chown -R vscode:vscode /usr/local/bundle

git config --global --add safe.directory $DEVC_WORKSPACE

# npm credentials are written to the workspace host home by the Coder template (skyltmax-dc)
# and reach us through the host-home bind mount. Only needed for publishing here — every
# dependency resolves from the public registry.
if [ -f "/home/$HOSTLOGNAME/.npmrc" ]; then
  cp "/home/$HOSTLOGNAME/.npmrc" "${DEVC_WORKSPACE}/.npmrc"
fi

# The bundle volume outlives the image, so gems built against the previous Ruby have to go.
if [ "${GEMS_ALREADY_RESET_1}" != "true" ]; then
  rm -rf /usr/local/bundle/*
  sudo chown -R vscode:vscode /usr/local/bundle

  GEMS_ALREADY_RESET_1="true"
fi

if [ "${BUNDLE_ALREADY_INSTALLED_2}" != "true" ]; then
  bootcmd "Installing gems" "bundle install"
  bundle install
  BUNDLE_ALREADY_INSTALLED_2="true"
fi

if [ "${CHANGELOG_DISPLAYED_7}" != "true" ]; then
  if [ -f "/var/lib/smdevc/changelog" ]; then
    printf "\n"
    toilet -f term -t -F border:metal "Latest Changes"
    cat /var/lib/smdevc/changelog
  fi

  CHANGELOG_DISPLAYED_7="true"
fi

echo -e "\
  GEMS_ALREADY_RESET_1=${GEMS_ALREADY_RESET_1}\n\
  BUNDLE_ALREADY_INSTALLED_2=${BUNDLE_ALREADY_INSTALLED_2}\n\
  CHANGELOG_DISPLAYED_7=${CHANGELOG_DISPLAYED_7}" > "${MARKER_FILE}"

printf "\n\n\e[38;2;252;163;17m"
toilet -f standard "Config"
printf "\nEnvironment prepared! Get ready to code!\n\n"
printf "\e[0m"
