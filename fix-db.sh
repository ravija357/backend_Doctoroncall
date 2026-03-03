#!/bin/bash

# Permanent fix for MongoDB permission issues
echo "🔧 Reclaiming MongoDB directory ownership..."
sudo chown -R $(whoami) /opt/homebrew/var/mongodb

echo "🔧 Removing any stale lock files and clearing port 3001..."
sudo rm -f /tmp/mongodb-27017.sock
rm -f /opt/homebrew/var/mongodb/mongod.lock
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

echo "🚀 Restarting MongoDB service..."
brew services restart mongodb-community

echo "✅ MongoDB should now be running correctly."
