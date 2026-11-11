# Writes the brand features of The Design Paper: design/<slug>/index.html, one per brand, all from the one template
# below, so a change to the layout is made once. Styles: src/styles/brand.css (on top of design.css).
# The words are his own, taken from the side projects and hardware pages; nothing here is invented.
# Run: python tools/brand-pages.py   then add any new page to vite.config.js and public/sitemap.xml.
from pathlib import Path

YOLK_LOGO = '<span class="yolk-logo" role="img" aria-label="The Yolk logo"><i></i>yolk</span>'
mark = lambda slug, name, ext='svg': f'<img src="/assets/design/brand/{slug}/mark.{ext}" alt="The {name} mark">'
film = lambda name, a, label, cap, tall=False: (name, a, label, cap, tall)

BRANDS = [
    dict(slug='yolk', name='Yolk', line='Your Muse. Within reach.', status='Launched · waitlist open', url='getyolk.tech',
         about='Yolk, a pocket AI device: its brand, website and launch film, designed by Shehroz Sajjad.',
         kinds=['Device', 'Brand', 'Site', 'Film'], ground='#FFCF32', mark=YOLK_LOGO,
         colours=['#FFCF32', '#232720', '#2058A6', '#EFA58B', '#F5F2E9'], type=('Space Grotesk', 'DM Sans'),
         hero=('/assets/design/ui-yolk-hero.webp', 'The top of the Yolk website: the yellow device beside its headline'),
         site=('site-yolk-long', 'The Yolk website, top to bottom'),
         story=['I always wanted a Pokédex. When Meta open-sourced Muse Gadgets, I designed my own device around it: custom hardware, an e-paper screen and a rotary encoder that drives an AI agent.',
                'It calls on my behalf in German, using what I learned building real-time AI. It waits on hold, says it’s an AI and books the table.',
                'I made its brand, its website and its launch film.'],
         taught=None,
         films=[film('yolk-colours', 1.5625, 'Yolk’s site: choosing body and accent colours on a 3D model of the device', 'On the site: pick the colours on a 3D model you can turn.'),
                film('yolk-inside', 1.821, 'Yolk’s site: the enclosure taken apart and put back together in 3D', 'On the site: the enclosure, taken apart.'),
                film('yolk-film', .5625, 'The Yolk launch film', 'The launch film.', True)]),
    dict(slug='npc-filter', name='NPC Filter', line='Keep the weird. Skip the filler.', status='Launched · free in the Chrome Web Store', url='npcfilter.com',
         about='NPC Filter, a filter for AI-written posts: its brand, website and launch film, designed by Shehroz Sajjad.',
         kinds=['Brand', 'Site', 'Film'], ground='#171915', mark=mark('npcfilter', 'NPC Filter'),
         colours=['#D5FA39', '#6E850D', '#FFF0C2', '#171915'], type=('Inter', 'Inter'),
         hero=('/assets/design/ui-npc-hero.webp', 'The top of the NPC Filter website: Keep the weird. Skip the filler.'),
         site=('site-npcfilter-long', 'The NPC Filter website, top to bottom'),
         story=['LinkedIn filled up with AI comments. Someone in my comments asked for a filter for AI-written posts on LinkedIn, X and Reddit, and my agent built it overnight.',
                'Like every idea of mine, it got a name and a brand before it got built. It launched with a film.'],
         taught=None,
         films=[film('npc-film', 1.779, 'The NPC Filter launch film', 'The launch film.')]),
    dict(slug='myclosr', name='myClosr', line='Live coaching during sales calls.', status='Launched · live on Mac and Windows', url='myclosr.com',
         about='myClosr, live coaching during sales calls: its brand and website, designed by Shehroz Sajjad.',
         kinds=['Brand', 'Site', 'Promo'], ground='#0A0A0A', mark=mark('myclosr', 'myClosr'),
         colours=['#0A0A0A', '#F5F5F5', '#8CFF2E'], type=('Inter', 'Inter'),
         hero=('/assets/design/ui-closr-cta.webp', 'A section of the myClosr website'),
         site=('site-myclosr-long', 'The myClosr website, top to bottom'),
         story=['A Mac and Windows app that coaches you while the call is happening and lets you practise afterwards.',
                'I made its brand, its website and its promo.'],
         taught='Where I started learning to sell: ads, SEO and an automated blog.',
         films=[film('myclosr-film', 1.784, 'myClosr coaching during a live sales call', 'The promo: coaching during a live call.')]),
    dict(slug='slaptastic', name='Slaptastic', line='Creator-style ads from one product photo.', status='Live · customers from my own ads', url='getslaptastic.com',
         about='Slaptastic, creator-style video ads from one product photo: its brand and website, designed by Shehroz Sajjad.',
         kinds=['Brand', 'Site'], ground='#1D1D1B', mark=mark('slaptastic', 'Slaptastic'),
         colours=['#DFF721', '#F7448B', '#1D1D1B'], type=('Bebas Neue', 'Outfit'),
         hero=('/assets/shots/slaptastic.webp', 'The top of the Slaptastic website'),
         site=('site-slaptastic-long', 'The Slaptastic website, top to bottom'),
         story=['It makes creator-style video ads and images from one product photo. I ran the ads for it myself and they brought in customers.',
                'I made its brand and its website.'],
         taught='How to bring customers back with n8n flows that send Stripe offers.',
         films=[]),
]

AR = lambda icon: f'<svg class="ar" aria-hidden="true"><use href="#{icon}"/></svg>'
bar = lambda a, b: f'<p class="sp-bar bar-type"><span>{a}</span><span>{b}</span></p>'


def films(b):
    if not b['films']: return ''
    figs = ''.join(f'<figure{" class=tall" if tall else ""} style="--a:{a}" data-reveal><video src="/assets/media/{n}.mp4" poster="/assets/media/{n}-poster.webp" muted loop playsinline preload="none" aria-label="{label}"></video><figcaption>{cap}</figcaption></figure>'
                   for n, a, label, cap, tall in b['films'])
    return f'''
<section class="spread" aria-label="{b['name']} on film">
  <div class="wrap">
    {bar('On film', b['name'])}
    <div class="jrow bfilms c">{figs}</div>
  </div>
</section>'''


def page(b, i):
    nxt = BRANDS[(i + 1) % len(BRANDS)]
    head, text = b['type']
    type_rows = f'<div><dt>Headlines</dt><dd>{head}</dd></div><div><dt>Text</dt><dd>{text}</dd></div>' if head != text else f'<div><dt>Headlines and text</dt><dd>{head}</dd></div>'
    swatches = ''.join(f'<li style="--c:{c}"><span>{c}</span></li>' for c in b['colours'])
    story = ''.join(f'<p{" class=drop" if k == 0 else ""}>{p}</p>' for k, p in enumerate(b['story']))
    coupon = f'<aside class="coupon" data-reveal><span class="kicker">What it taught me</span><p>{b["taught"]}</p></aside>' if b['taught'] else ''
    return f'''<!doctype html>
<html lang="en" data-theme="light" class="pg-design pg-brand" style="--ground:{b['ground']}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="{b['about']}">
<title>{b['name']} · Design · Shehroz Sajjad</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@400&family=JetBrains+Mono:wght@500&family=Instrument+Sans:wdth,wght@75..100,400..700&family=Instrument+Serif:ital@0;1&display=swap">
<link rel="stylesheet" href="/src/styles/site.css">
<link rel="stylesheet" href="/src/styles/ending.css">
<link rel="stylesheet" href="/src/styles/grain.css">
<link rel="stylesheet" href="/src/styles/pages.css">
<link rel="stylesheet" href="/src/styles/menu.css">
<link rel="stylesheet" href="/src/styles/twin.css">
<link rel="stylesheet" href="/src/styles/shell.css">
<link rel="stylesheet" href="/src/styles/design.css">
<link rel="stylesheet" href="/src/styles/brand.css">
</head>
<body>
<!-- written by tools/brand-pages.py: change the template there, not this file -->
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <symbol id="i-ne" viewBox="0 0 16 16"><path d="M4.5 11.5 11.5 4.5M5.5 4.5h6v6"/></symbol>
  <symbol id="i-down" viewBox="0 0 16 16"><path d="M8 3v10M3.5 8.5 8 13l4.5-4.5"/></symbol>
  <symbol id="i-right" viewBox="0 0 16 16"><path d="M3 8h10M8.5 3.5 13 8l-4.5 4.5"/></symbol>
</svg>
<a class="skip-link" href="#h1">Skip to content</a>
<main id="main">

<!--shell:header-->

<section class="bh" aria-labelledby="h1">
  <figure class="bh-img"><img src="{b['hero'][0]}" alt="{b['hero'][1]}" fetchpriority="high"></figure>
  <img class="bh-tear" src="/assets/textures/news-tear.webp" alt="" aria-hidden="true">
  <a class="bh-back bar-type" href="/design#brands">{AR('i-right')} The Design Paper</a>
  <div class="wrap">
    <h1 id="h1" tabindex="-1" class="bh-name"><span>{b['name']}</span></h1>
    <div class="bh-meta">
      <span><i>Feature</i> No. {i + 1:02d} of {len(BRANDS):02d}</span>
      <span class="tags">{''.join(f'<b>{k}</b>' for k in b['kinds'])}</span>
      <span><i>Status</i> {b['status']}</span>
      <a href="https://{b['url']}" target="_blank" rel="noopener">{b['url']} {AR('i-ne')}</a>
    </div>
  </div>
</section>
<section aria-label="The story">
  <div class="wrap bstory">
    <p class="b-line it" data-reveal>“{b['line']}”</p>
    <div class="sp-cols{' one' if sum(map(len, b['story'])) < 260 else ''}" data-reveal>{story}</div>
    {coupon}
  </div>
</section>
<section class="spread" aria-label="The identity">
  <div class="wrap">
    {bar('The identity', 'Mark · colours · type')}
    <div class="bid c">
      <figure class="bid-mark" data-reveal>{b['mark']}</figure>
      <div class="bid-side">
        <ul class="sw" aria-label="{b['name']} colours" data-reveal>{swatches}</ul>
        <dl class="btype" data-reveal>{type_rows}</dl>
        <p class="bid-say" data-reveal="words">{b['line']}</p>
      </div>
    </div>
  </div>
</section>
<section class="spread" aria-label="The site">
  <div class="wrap">
    {bar('The site', b['url'])}
    <div class="bsite c">
      <div class="ss" data-ss data-reveal><div class="ss-bar" aria-hidden="true"><i></i><i></i><i></i><span>{b['url']}</span></div><div class="ss-view" tabindex="0" aria-label="{b['site'][1]}, scroll to look through it"><img src="/assets/design/{b['site'][0]}.webp" alt="{b['site'][1]}" loading="lazy"></div></div>
      <div class="bsite-side">
        <p class="hand-p"><span class="hand">it scrolls: click to take over</span></p>
        <p>The whole page, top to bottom. The real one is a click away.</p>
        <a class="oval" href="https://{b['url']}" target="_blank" rel="noopener">Live site {AR('i-ne')}</a>
      </div>
    </div>
  </div>
</section>{films(b)}
<div class="wrap">
  <a class="bnext" href="/design/{nxt['slug']}" data-bg="{nxt['ground']}"><span><span class="kicker">Next feature</span><b>{nxt['name']}</b></span>{AR('i-right')}</a>
</div>
<a class="callbar" href="https://cal.com/mshehrozsajjad" target="_blank" rel="noopener" aria-label="This paper costs one call. Book it."><span class="callbar-in" aria-hidden="true">{'<span>This paper costs one call</span><b>Book it</b>' * 4}</span></a>

</main>

<!--shell:footer-->
<!--shell:menu-->
<!--shell:twin-->
<script type="module" src="/src/design/mag.js"></script>
<script type="module" src="/src/pages.js"></script>
</body>
</html>
'''


for i, b in enumerate(BRANDS):
    out = Path('design') / b['slug'] / 'index.html'
    out.parent.mkdir(exist_ok=True)
    out.write_text(page(b, i))
    print(out)
