#!/bin/bash
# Find and kill process on port 3000
for pid in $(cat /proc/net/tcp | awk '{print $2":"$4}' | grep ":0BB8" | cut -d: -f3 | sort -u); do
  if [ "$pid" != "00" ]; then
    kill -9 $(printf "%d" 0x$pid) 2>/dev/null
  fi
done
sleep 2
# Start server
node server.js
