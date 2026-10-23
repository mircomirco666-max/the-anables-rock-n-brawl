# THE ANABLES: ROCK 'N' BRAWL

Beat 'em up arcade a scorrimento laterale con i sei membri dei The Anables.
Il gioco gira nel browser, senza installazioni e senza dipendenze esterne.

**Versione 4.3:** Mike è la chitarra solista e Danny la ritmica: Mike suona note singole distorte, Danny accordi. Le corde ora sono sintetizzate come corde pizzicate vere (Karplus-Strong). I tormentoni dei musicisti: Arrigo "1, 2, 6, 9!", Mike "CAGATI ADDOSSO!", Danny "ORA MOLLAMI!" (quando lo afferrano), Troy "COSÌ NON ANDAVA BENE".

**Versione 4.2:** mosse e suoni diversi per ogni musicista.
- Ogni musicista ha combo, colpo pesante, attacco in corsa e in volo propri, legati allo strumento (vedi "Le mosse dei musicisti").
- Ogni colpo suona lo strumento di chi lo dà, intonato sull'accordo del brano che sta suonando: la combo diventa un riff. Anche salto, colpo subito, speciale e KO hanno il suono del personaggio.
- La scheda dei personaggi (menu CAST) mostra le mosse e il suono di ognuno.

**Versione 4.1:** corretto il nemico che rimbalzava all'infinito senza morire. I colpi a raffica (due giocatori, nuvole, fiamme) congelavano il bersaglio a mezz'aria a ogni colpo; ora chi è in aria non si congela, dopo due rilanci cade comunque e chi sta morendo in aria non si può più colpire.

La prova di grafica fotografica (versione 5) è stata accantonata: i file sono in `src_v5/`, `v5_extra/` e `photo_src/`, e non entrano nel gioco.

**Versione 4:** più umorismo becero, nemici con nome e manie, potenziamenti da ritrovare, il furgone del tour e un combattimento più ricco.

**Versione 3:** il gioco è completo, con 10 livelli, 10 boss e un finale.
- Pixel più fini: il mondo resta 384×224 come il CP System, ma ogni unità è disegnata con 2×2 pixel (risoluzione interna 768×448).
- Musica senza scatti.
- Tocchi horror da cartone animato, disattivabili.
- 13 armi pazze.
- Lo stile richiama i picchiaduro Capcom come Cadillacs and Dinosaurs, ma nessuno sprite, nome o logo è copiato.

## Come si avvia

- **Online:** apri il link dell'artifact. Funziona su computer e telefono.
- **Offline:** apri `dist/the-anables-rock-n-brawl.html` con un doppio clic. È un file unico che contiene tutto.
- **Ricostruire dai sorgenti:** `./tools/build.sh` (serve `python3`). Genera:
  - `dist/index.html`, il contenuto dell'artifact;
  - `dist/the-anables-rock-n-brawl.html`, la versione autonoma.

## Comandi

| Azione | Tastiera | Gamepad | Touch |
|---|---|---|---|
| Muoversi (anche in profondità) | Frecce o WASD | Levetta o croce | Joystick a sinistra |
| Attacco (combo, da 3 a 6 colpi secondo il musicista) | J / Z | X / Quadrato | COLPO |
| Salto | K / X / Spazio | A / Croce | SALTO |
| Attacco pesante | L / C | Y / Triangolo | FORTE |
| Speciale | I / V, oppure attacco + salto insieme | B / Cerchio | SPEC |
| Pausa | Invio / Esc | Start | II |

- **Corsa:** doppio tocco in avanti. Corsa + attacco = carica.
- **Presa:** cammina contro un nemico.
  - Attacco = ginocchiata.
  - Direzione + attacco = lancio. Il nemico lanciato travolge gli altri.
- **Colpo in volo:** salta e poi attacca. Se salti mentre corri diventa un calcio volante più forte.
- **Colpo a terra:** attacco vicino a un nemico steso (al massimo due calci per caduta).
- **Nemici scagliati:** dopo un colpo forte il nemico vola, travolge quelli che incontra ("STRIKE!") e rimbalza sul bordo dello schermo.
- **Presi da un nemico:** lo speciale ti libera subito.
- **Speciale:** tasto speciale, oppure attacco e salto premuti insieme (entro 2 frame).
  - Con la barra blu piena è gratis.
  - Senza barra costa il 10% della salute, ma solo se la mossa colpisce.
  - Durante la mossa sei invulnerabile.
- **Colpo di squadra:** due giocatori vicini premono lo speciale quasi insieme.
- **Rianimazione:** un compagno senza vite resta a terra per 10 secondi. Avvicinati e premi attacco più volte.
- **Fino a 4 giocatori:** tastiera + gamepad + touch.
  - Due giocatori sulla stessa tastiera: nella selezione premi il tasto 2.
  - Chrome gestisce al massimo 4 gamepad; l'architettura è pronta per 6 giocatori.
- **Compagno CPU:** si attiva in Opzioni e accompagna chi gioca da solo.

## Le mosse dei musicisti

| Musicista | Combo (tasto attacco) | Attacco pesante | In corsa | In volo | Suono dei colpi |
|---|---|---|---|---|---|
| Arrigo (voce) | 4 colpi con microfono e asta | Microfono roteato sul cavo: giro completo, colpisce davanti e dietro | Asta come una lancia | "Pogo" sull'asta piantata sotto di sé; in corsa calcio a due piedi | Urla intonate ("HA!", "HEY!", "YEAH!"), larsen |
| Mike (chitarra solista) | 3 colpi pesanti: spallata, manicata, chitarra spaccata a terra con onda d'urto | Mulinello: il braccio gira sulle corde e parte un'onda d'urto | Carica a testa bassa, non si ferma ai colpi leggeri | Chitarra calata dall'alto; in corsa tuffo col corpo della chitarra | Assolo: note singole distorte che salgono, nota tirata col vibrato sul finale, picchiata con la leva sul mulinello |
| Danny (chitarra ritmica) | 5 colpi rapidi: due pugni, manico, ginocchiata, giravolta | Duck walk: avanza saltellando e scalcia due volte | Scivolata in ginocchio, fa cadere chi incontra | Doppio calcio; in corsa spaccata volante | Accordi a sei corde con pennate alternate giù e su, pennata stoppata sulla ginocchiata, accordo lasciato suonare sul finale |
| Mario (basso) | 4 colpi lunghissimi: manico, paletta, spazzata, giro completo | Slap & pop: schiaffo sulle corde e corda tirata | Sgambetto col basso a filo del pavimento | Elicottero col basso; in corsa tuffo a manico teso | Note di basso, slap e pop |
| Troy (batteria) | 6 colpi a raffica alternando le bacchette, piatto finale | Calcio di cassa: scaglia lontano | Rullata in corsa: tre colpi | Doppio colpo dall'alto | Rullante, tom accordati, cassa e piatti |
| Marvin (piano) | 4 colpi: pugno, tastierata, glissando a tre colpi, accordo finale | Sforzando: la tastiera puntata in avanti fa partire un'onda sonora | Glissando in corsa: due colpi | Gomitata in picchiata | Accordi di piano, glissando, organo |

Le note seguono l'accordo del brano in quel momento (`Audio2.harmony()`): la radice viene dagli accordi scritti nel brano, maggiore o minore da quello che suona davvero. Le mosse sono dati in `src/06b_movesets.js`, i suoni in `src/08c_charsfx.js`.

## Armi da raccogliere

Mettiti sopra l'arma e premi attacco. Attacco la usa, attacco pesante la lancia. Se finisci a terra la perdi e resta sul pavimento. Gli usi rimasti sono nell'HUD.
Le armi che sparano, finiti i colpi, restano in mano scariche: il colpo successivo le lancia. Anche alcuni nemici raccolgono le armi da terra e le usano contro di te.

| Arma | Usi | Come funziona |
|---|---|---|
| Tubo | 12 | Due colpi a catena, il secondo atterra |
| Mazza chiodata | 10 | Come il tubo, più forte |
| Fenicottero di plastica | 14 | Portata lunghissima, spinge lontano, squittisce |
| Pesce surgelato | 16 | Tre colpi rapidi, stordisce a lungo |
| Ascia-basso | 8 | Colpo pesante dall'alto che manda avanti un'onda d'urto |
| Motosega-chitarra | 40 | Tieni premuto attacco: taglia di continuo |
| Sparacoriandoli | 8 | Raffica che attraversa fino a 3 nemici |
| Bazooka-trombone | 5 | Spara una nota che esplode |
| Laser-theremin | 6 | Raggio su tutta la corsia |
| Lacca lanciafiamme | 6 | Getto di fiamme a corto raggio |
| Pistola ad acqua santa | 18 | Getto d'acqua; contro i non morti fa molto più male |
| Pila di dischi | 6 | Vinili lanciati in orizzontale |
| Grancassa-bomba | 3 | Mira il nemico più vicino davanti ed esplode |

## Potenziamenti

Si accumulano fino al livello 3 e si vedono come icone colorate sotto il ritratto, un puntino per livello.

| Potenziamento | Effetto per livello |
|---|---|
| Peperoncino bruciaculo | +15% di danno |
| Scarpe puzzolenti | +8% di velocità |
| Mutande di ghisa | -12% di danni subiti |
| Pancia da birra | +15 di salute massima |
| Pedale fuzz | la barra dello speciale si carica il 35% più in fretta |
| Cavo jack lungo | colpi più lunghi |

- **Dove si trovano:** in ogni livello ce ne sono tre. Uno è nascosto in un muro crepato da sfondare ("SFONDAMI!"), uno è a terra e uno è dentro un oggetto da rompere.
- **Quando muori:** volano via e restano a terra per 10 secondi, lampeggiando prima di sparire. Puoi riprenderli, ma anche i compagni possono prenderseli.
- **Fagioli alla diavola:** dopo un attimo una scoreggia tossica stende chi ti sta vicino.
- **Barili esplosivi:** rompili vicino ai nemici.

## In viaggio col furgone

Dopo i livelli 3, 6 e 9 la band viaggia nel furgone del tour, come nella sezione in auto dei picchiaduro Capcom.
- Su e giù sterzi, avanti acceleri, indietro freni, attacco sperona.
- Investi motociclisti e zombi ed eviti coni, bidoni e gomme.
- Il furgone ha la sua barra della vita. Se arriva intero, ogni punto di vita rimasto vale un bonus.

## La tournée

Ogni livello ha cinque zone di ondate, un miniboss, il proprio fondale disegnato a codice, i propri nemici e la propria musica. Il boss ha una seconda fase sotto metà salute e chiama rinforzi.

| N. | Livello | Genere | Nemici | Miniboss | Boss |
|---|---|---|---|---|---|
| 1 | Notte al Neon | Disco | pattinatori, buttafuori, lanciadischi | Buttafuori Capo | Duca Glitter |
| 2 | Pogo Selvaggio | Punk | punk, punk con catena, lanciabottiglie, punk borchiato | Gorilla del Pogo | Re Pogo |
| 3 | Bass Drop | Elettronica | raver, DJ robot, buttafuori techno, raver al neon | Subwoofer Umano | Professor Drop |
| 4 | Block Party | Hip hop | b-boy, graffitari, guardie del corpo, b-boy d'oro | Beatboxer | MC Boombox |
| 5 | Notte dei Metallari Morti | Heavy metal | metallari, roadie, fan zombie, cadaveri del black | Roadie Mostruoso | Lord Feedback |
| 6 | Fantasmi all'Opera | Classica e opera | violinisti, tenori, maschere, scheletri | Il Primo Violino | Maestro Fortissimo e la Diva (in coppia) |
| 7 | Il West dei Dannati | Country | cowboy, pistoleri, mandriani, cowboy dannati | Il Becchino | Sceriffo Twang |
| 8 | Talenti Mostruosi | Pop | ballerini, paparazzi, sicurezza, manichini vivi | Il Giudice | I Perfetti (tre insieme) |
| 9 | Swing dei Vampiri | Jazz e swing | zoot, trombettisti, portieri, ombre | Il Croupier | Conte Swing |
| 10 | Il Covo Finale | Rock'n'roll | élite di tutti i livelli | Gorilla del Pogo e Becchino | Gli Anables Malvagi, i sei doppi oscuri della band in tre ondate |

- Battuto il decimo boss arrivano il finale e i titoli di coda.
- I livelli superati si sbloccano. Alla partita successiva si può scegliere da dove partire.
- **Agguati:** in alcune ondate un nemico piomba dall'alto.

### Cosa sanno fare i nemici

Balzi con onda d'urto, trottole, cariche, prese, lazo che tira a sé, raffiche, ventagli di proiettili, nuvole tossiche e sparizioni alle spalle.

Ogni nemico ha anche un nome proprio, che compare nella barra quando lo colpisci (TETANO, ARMADIO, FAGIOLONE...). Alcuni hanno un altro colore, altri sono "ciccioni" più grossi e resistenti. Parlano con i fumetti e hanno le loro manie:
- **sputano:** punk, cowboy, zombi, trombettisti;
- **ruttano** una nuvola tossica: lanciabottiglie, roadie, tenori;
- **scoreggiano:** buttafuori, mandriani, ciccioni;
- **scappano** quando sono messi male: pattinatori, ballerini, paparazzi;
- **ti rubano il cibo da terra:** zombi, raver, croupier;
- **raccolgono le armi:** punk con catena, metallari, guardie del corpo.

- **Non morti:** a volte si rialzano.
- **Scheletri e manichini:** si rompono in pezzi invece di sanguinare.
- **Ombre:** svaniscono in fumo.

### Cosa sanno fare i boss

Ogni boss usa la propria combinazione di queste mosse:
- colonne di luce o di fuoco annunciate a terra;
- oggetti che piovono dall'alto (lampadari, barili);
- onde d'urto, anche ad anello;
- bombe e dinamite, pipistrelli;
- teletrasporto alle spalle, prosciugamento della vita.

I doppi oscuri usano gli stessi speciali dei musicisti, in rosso.

## Horror e accessibilità

- **Sangue:** a ogni colpo, con macchie a terra. Verde per gli zombi, nessuno per scheletri e manichini.
- **Decorazioni dei fondali:** ragnatele, teschi, occhi nel buio, gocce, pipistrelli.
- **Opzione SANGUE = NO:** niente schizzi; restano le scintille.
- **Opzione FLASH RIDOTTI = SÌ:** attenua lampi, stroboscopi, laser e fulmini.

## Battute

- **Chi parla:** musicisti, nemici e boss, con frasi grezze e parolacce.
  - I musicisti parlano quando iniziano, colpiscono, vengono colpiti, mangiano, raccolgono armi e potenziamenti, muoiono e tornano.
  - I nemici parlano quando entrano, provocano e muoiono.
  - I boss hanno una frase d'ingresso, una per la seconda fase e una per la sconfitta.
- **Opzione BATTUTE = PULITE:** toglie le parolacce.
- **Limiti:** niente insulti a categorie di persone. Le battute dei musicisti restano legate a ruolo, strumento e vita da band.

## Audio

- **Brani:** 27 originali (compreso quello del furgone), scritti per il gioco: tema, selezione, un brano per livello e uno per boss, finale e jingle. Ogni brano richiama il genere del livello con strumenti, tempo e ritmo, non con melodie esistenti.
- **Strumenti:** sintetizzati una volta come campioni.
- **Riproduzione:** i brani vengono pre-renderizzati in un OfflineAudioContext e suonati in loop come buffer, separati dal ciclo di gioco. Per questo la musica non va più a scatti.
- **Effetti:** 56, generati dal vivo.
- Nessuna registrazione esterna.

## Struttura del codice (`src/`)

| File | Contenuto |
|---|---|
| `00_config.js` | Risoluzione, scala, parametri di gioco e difficoltà |
| `01_utils.js` | Matematica, colori, rasterizzatore ad alta risoluzione, salvataggi sicuri |
| `02_font.js` | Font bitmap 5×7 originale |
| `03_heads.js` | Teste generate da parametri: acconciature, barbe, occhiali, volti horror |
| `04_sprites.js` | Marionetta a giunture, costumi, strumenti, armi e oggetti, cache dei frame |
| `04b_atlasload.js` | Supporto (inattivo) per la grafica fotografica accantonata |
| `05_cast.js` | **Il cast**: aspetto, statistiche, speciali |
| `05b_lines.js` | **Le battute** della band, le personalità dei nemici (nomi, frasi, manie) e le frasi dei boss |
| `06_anims.js` | Pose chiave per famiglia di strumento; **le 13 armi** come dati |
| `06b_movesets.js` | **Le mosse di ogni musicista**: pose e dati dei colpi |
| `07_input.js` | Tastiera, gamepad, touch |
| `08_audio.js` | Motore audio, effetti, brani del livello 1 e dei menu |
| `08b_songs.js` | Brani dei livelli 2–10, dei boss e del finale |
| `08c_charsfx.js` | **I suoni di ogni musicista**, intonati sull'accordo del brano |
| `09_world.js` | Colpi, sangue, telecamera, lampi |
| `10_actor.js`, `11_player.js` | Attore base e giocatore |
| `12_enemies.js` | Motore dei nemici e nemici del livello 1 |
| `12b_roster.js` | **Nemici dei livelli 2–10** (dati) |
| `13_objects.js` | Proiettili, pericoli, oggetti distruttibili, bonus, armi da raccogliere |
| `13b_powerups.js` | Potenziamenti, fagioli, muro crepato, barile esplosivo, sputo, varianti di colore dei nemici |
| `14_boss.js` | Duca Glitter |
| `14b_bosses.js` | **Boss dei livelli 2–10 e doppi oscuri** (una classe guidata dai dati) |
| `15_levels.js` | Kit dei fondali e strada del livello 1 |
| `15a_level.js` | **I 10 livelli come dati** e la classe `Level` |
| `15b_backgrounds.js`, `15c_backgrounds2.js` | Fondali dei livelli 2–10 |
| `16_ui.js`, `17_game.js` | HUD e scene |
| `17b_van.js` | In viaggio col furgone |
| `18_cpu.js` | Compagno CPU |

## Come si aggiunge qualcosa

- **Nemico:** una voce in `ENEMY_DEFS` (vedi `12b_roster.js`). Contiene:
  - nome, livello di potenza (`tier`), aspetto, salute, velocità;
  - comportamento: `leapChance`, `spinChance`, `blink`;
  - attacchi con frame data e hitbox;
  - `undead`, `revive`, `blood`, ricompense.
  
  L'aspetto si definisce con una testa in `ENEMY_HEAD_SPECS` e un costume in `ENEMY_LOOKS`.
- **Boss:** una voce con `cls: 'BossX'` e un blocco `boss`, che contiene:
  - le mosse, con peso e filtri `close`/`far`/`p2`/`cd`;
  - i richiami di scagnozzi;
  - il testo della seconda fase.
- **Arma:** una voce in `WEAPONS` (`06_anims.js`).
- **Livello:** una voce in `LEVELS` (`15a_level.js`) e un tema in `BG_THEMES`.

## Test (cartella `tools/`)

| Comando | Cosa fa |
|---|---|
| `LV=3 CHARS=0,3 QUIET=1 node tools/sim.js 700` | La CPU gioca un livello intero a velocità accelerata |
| `node tools/mech.js` | Prese, lanci, corsa, salto, combo, colpo di squadra, KO e rianimazione |
| `node tools/moveset.js` | Le mosse di ogni musicista: combo fino al colpo finale, pesante, corsa, volo, suoni |
| `node tools/charsfx.js [out.wav]` | Volume di ogni suono dei musicisti rispetto al colpo generico; con un nome di file scrive un WAV dimostrativo |
| `node tools/juggle.js` | Colpi a raffica su un nemico in aria: deve cadere e morire, mai restare sospeso |
| `node tools/features.js` | Potenziamenti persi e ripresi, fagioli, calcio volante, colpo a terra, nemici scagliati, rimbalzo, liberarsi con lo speciale, barile, muro, manie dei nemici, battute |
| `node tools/van.js 6` | Una corsa col furgone guidata dal pilota automatico |
| `node tools/flow.js` | Tutta la tournée: 10 livelli, 3 viaggi in furgone, finale, titoli |
| `node tools/weapons.js` | Tutte le 13 armi, la caduta e il lancio dell'arma, lo speciale con attacco + salto |
| `node tools/bosses.js` | Introduzione e combattimento di ogni boss (screenshot) |
| `node tools/audiotest.js` | Ogni brano e ogni effetto: niente silenzi, niente NaN, volumi equilibrati |
| `node tools/pano.js 5 out.png` | Panorama completo del fondale di un livello |
| `node tools/perf.js 10` | Tempo per frame nell'ondata peggiore (4 giocatori, 14 nemici) |
| `node tools/scenes.js` | Screenshot di menu, opzioni, tournée, finale, crediti |

## Segnaposto da sostituire quando arrivano le informazioni

- **Arrigo:** i capelli sono neri; la barba è rimasta brizzolata.
- **Violin bass di Mario:** colori generici, perché non ho una foto dello strumento.
- **Battute dei personaggi:** legate solo a ruolo, strumento e vita da band. Se volete frasi vostre, o tormentoni interni della band, si sostituiscono in `05b_lines.js`.
- **Alleati:** Ray e Benedict sono candidati, gli altri due sono da definire. Non sono ancora nel gioco.

Vedi `THIRD_PARTY.md` per le risorse esterne: non ce ne sono.
