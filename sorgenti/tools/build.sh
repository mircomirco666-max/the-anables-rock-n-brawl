#!/bin/bash
# Costruisce dist/index.html: template + tutti i moduli in un unico script
cd "$(dirname "$0")/.."
./tools/bundle.sh >/dev/null
python3 - << 'PY'
tpl = open('src/template.html').read()
js = open('dist/game.js').read()
js = "'use strict';\n" + js.replace("'use strict';", "")
out = tpl.replace('/*__GAME__*/', js)
open('dist/index.html', 'w').write(out)
# versione autonoma (doppio clic per giocare offline): scheletro completo
full = '<!doctype html>\n<html lang="it">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n</head>\n<body>\n' + out + '\n</body>\n</html>\n'
open('dist/the-anables-rock-n-brawl.html', 'w').write(full)
print('dist/index.html', len(out)//1024, 'KB')
PY
