# Atlas Obscura -> Google Maps exporter

This is a small project that exports listings from travel website [Atlas Obscura](https://www.atlasobscura.com) as a Google Maps compatible KML file. This can then be imported in to [Google My Maps](https://www.google.com/maps/d/) to provide a personal Google Map of sites of interest in a country, categorised and with images.

In general this project functioned as a quick refresher in how to write a Cloudflare Worker in the new ESM structure/after a year without doing so.

## Get started

1. Sign up for [Cloudflare Workers](https://workers.dev). The free tier is more than enough for most use cases.
2. Clone this project and install dependencies with `npm install`
3. Run `wrangler login` to login to your Cloudflare account in wrangler
4. Run `wrangler deploy` to publish the API to Cloudflare Workers
5. Make sure to add an AUTH_TOKEN env variable on Cloudflare
6. Visit myworker.com/?country=[COUNTRY OF INTEREST]&authToken=[AUTH TOKEN]
7. The script will begin working and refresh the page intermittently to avoid overrunning the worker CPU time.
8. After a few minutes a KML file will be downloaded
