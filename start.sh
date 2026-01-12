#!/bin/sh

# Start the API server in the background
cd /app/api && npm start &

# Start the GUI server in the background
npm install -g serve
serve -s /app/gui -l 8080
