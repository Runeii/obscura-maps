import { CATEGORY_URL, COUNTRY_URL, MAX_PAGES } from '../constants';
import { fetchPage } from 'utils';

async function getPagesArray(country: string, category: string, offset: number) {
  const startUrl = CATEGORY_URL.replace('{country}', country).replace('{category}', category);
  console.log('Transformed', CATEGORY_URL, 'to', startUrl, 'using', country, category);
  const $ = await fetchPage(startUrl);

  const finalPageUrl = $('.pagination .last a').attr('href');

  if (!finalPageUrl) {
    return [];
  }

  const url = new URL('https://www.atlasobscura.com' + finalPageUrl);
  const finalPage = parseInt(url.searchParams.get('page'));

  console.log('Attempting to create array of', finalPage, 'length.', 'Offset:', offset);
  let pages = [...new Array(finalPage).keys()].map(i => i + 1);
  if (offset) {
    pages = pages.slice(offset);
  }
  if (pages.length > MAX_PAGES) {
    pages = pages.slice(0, MAX_PAGES);
  }

  return pages;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const country = url.searchParams.get('country');
    const category = url.searchParams.get('category');
    const offset = url.searchParams.get('offset');

    if (!country || !url) {
      return new Response('Please provide a country (and optional offset)', {
        status: 400,
        headers: { 'content-type': 'text/plain' },
      });
    }

    const pages = await getPagesArray(country, category, Number(offset));

    for await (const page of pages) {
      await env.SCRAPER.fetch(`https://obscura-maps--scraper.workerify.workers.dev/?country=${country}&page=${page}&category=${category}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (pages.length < MAX_PAGES) {
      return new Response(JSON.stringify({ nextOffset: null, status: 200 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    const nextOffset = Number(offset) + MAX_PAGES;
    return new Response(JSON.stringify({ nextOffset, status: 206 }),
      {
        status: 206,
        headers: { 'content-type': 'application/json' },
      }
    );
  }
}
