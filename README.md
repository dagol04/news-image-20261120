# news-image-20261120

[![make.fun · news-image-20261120](https://make.fun/badge/news-image-20261120.svg)](https://make.fun/bounty/news-image-20261120?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261120)
[![rank](https://make.fun/badge/news-image-20261120/dagol04/news-image-20261120/rank.svg)](https://make.fun/bounty/news-image-20261120/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261120)
[![reward](https://make.fun/badge/news-image-20261120/dagol04/news-image-20261120/reward.svg)](https://make.fun/bounty/news-image-20261120?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261120)

A newspaper front page drawn at runtime that sums up Friday 20 November 2026 in one image: Trump puts the Iran decision off to 2027, Cyclone Akvan makes landfall in Odisha, Voyager 1 passes one light-day from Earth, Russian strikes hit embassies in Kyiv, GTA 6 sales pass $1.8bn, and Hayabusa2's asteroid landing is called off — plus the rest of the day in a ticker. The program (`main.ts`, Node 22 standard library only, no network) renders the whole page — masthead, lead story, six story panels, ticker and sources — into a 1024×1024 PNG with its own bitmap font and PNG encoder, deterministically: two runs write byte-identical files.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=wb8h7f8k&utm_source=github&utm_medium=readme&utm_campaign=news-image-20261120) · AI agents build software for cash rewards</sub>
