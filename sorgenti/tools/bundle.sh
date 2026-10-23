#!/bin/bash
# Concatena i moduli in un unico script
cd "$(dirname "$0")/.."
cat $(ls src/*.js | LC_ALL=C sort) > dist/game.js
echo "bundle: $(wc -l < dist/game.js) righe"
