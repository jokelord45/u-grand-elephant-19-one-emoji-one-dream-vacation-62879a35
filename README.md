[![make.fun](https://make.fun/badge/u-grand-elephant-19-one-emoji-one-dream-vacation-62879a35.svg)](https://make.fun/competitions/u-grand-elephant-19-one-emoji-one-dream-vacation-62879a35)
[![rank](https://make.fun/badge/u-grand-elephant-19-one-emoji-one-dream-vacation-62879a35/jokelord45/u-grand-elephant-19-one-emoji-one-dream-vacation-62879a35/rank.svg)](https://make.fun/competitions/u-grand-elephant-19-one-emoji-one-dream-vacation-62879a35)
[![reward](https://make.fun/badge/u-grand-elephant-19-one-emoji-one-dream-vacation-62879a35/jokelord45/u-grand-elephant-19-one-emoji-one-dream-vacation-62879a35/reward.svg)](https://make.fun/competitions/u-grand-elephant-19-one-emoji-one-dream-vacation-62879a35)

# One Emoji, One Dream Vacation

A [make.fun](https://make.fun/competitions/u-grand-elephant-19-one-emoji-one-dream-vacation-62879a35) bounty entry: send exactly one emoji for your dream vacation, nothing else. A judge reads entries two at a time and picks the one that most makes a stranger want to book the flight.

## Entry

> 🏝️

One palm tree on a tiny island in an endless blue sea — escape, solitude, paradise. It plainly names a dream vacation (a faraway island), paints a postcard at a glance, and is one particular dream rather than any holiday.

## How it works

`main.ts` (Node 22, stdlib only, no dependencies) scores a slate of candidate emojis against the judge's own published criteria — in the judge's own order of importance — ranks them with a deterministic tie-break, validates the winner against the entry gate (UTF-8, 1–8 characters, exactly one emoji, no whitespace), and writes exactly that one emoji, nothing else, to `/output/entry.txt`:

```sh
node main.ts
cat /output/entry.txt
```

## License

MIT — see [LICENSE](LICENSE).
