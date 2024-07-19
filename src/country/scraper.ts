import { CATEGORY_URL } from '../constants';
import { fetchPage } from 'utils';

const saveToKV = async (items: Item[], db: KVNamespace) => {
  const existingKeys = await db.list();
  const existingIds = new Set(existingKeys.keys.map(key => key.name));

  for (const item of items) {
    if (!existingIds.has(item.id)) {
      await db.put(item.id, JSON.stringify(item));
    } else {
      console.log('Skipping existing');
    }
  }
}

export async function scrapeItems(country: string, category: string, page: string) {
  const startUrl = `${CATEGORY_URL.replace('{country}', country).replace('{category}', category)}?page=${page}`;
  const $ = await fetchPage(startUrl);

  console.log(`Page ${page}: ${$('.geo-places .Card').length} cards found`)
  const items = $('.geo-places .Card').map((i, element) => {
    const title = $(element).find('.Card__heading').text().trim();
    const description = $(element).find('.Card__content').text().trim();
    const image = $(element).find('.Card__img').attr('data-src');
    const link = 'https://www.atlasobscura.com' + $(element).attr('href');

    const lat = $(element).attr('data-lat');
    const lng = $(element).attr('data-lng');

    const id = `${country}--${link.split('/').pop()}`;

    const value: Item = {
      id,
      category,
      title,
      description,
      image,
      country,
      coords: [parseFloat(lat), parseFloat(lng)] as [number, number],
    };

    return value;
  }).toArray();

  console.log(items.map(item => item.title));
  return items;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const country = url.searchParams.get('country');
    const page = url.searchParams.get('page');
    const category = url.searchParams.get('category');

    const items = await scrapeItems(country, category, page);

    console.log(`Scraped page ${page}. Found ${items.length} items. Starting to save.`)

    await saveToKV(items, env.OBSCURA_MAPS);

    return new Response(`Saved ${country} ${page} to database!`, {
      status: 200,
      headers: { 'content-type': 'text/plain' },
    });
  }
}