#!/bin/bash
# Launch TripleThink Docker container with persistent Claude Code authorization

docker run -it \
  -v "$(pwd):/app" \
  -v ~/.claude:/root/.claude \
  -v ~/.claude.json:/root/.claude.json \
  -p 3000:3000 \
  -p 8080:8080 \
  triplethink-dev
