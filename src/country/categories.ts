import { COUNTRY_URL } from '../constants';
import { fetchPage } from 'utils';

const saveToKV = async (categories: Category[], country: string, db: KVNamespace) => {
  await db.put(`CATEGORIES_${country}`, JSON.stringify(categories));
}

async function scrapeCategories(country: string) {
  const startUrl = COUNTRY_URL.replace('{country}', country);
  const $ = await fetchPage(startUrl);

  const categories: Category[] = $('#map .aon-pill-badge-component').map((i, element) => {
    const id = $(element).attr('href').split('/').pop();
    const name = $(element).find('.aon-pill-badge-text-with-count').text().trim();

    return {
      id,
      name
    }
  }).toArray();

  return categories;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const country = url.searchParams.get('country');

    const categories = await scrapeCategories(country);

    await saveToKV(categories, country, env.OBSCURA_MAPS);

    return new Response(`Saved ${categories.length} ${country} categories to database!`, {
      status: 200,
      headers: { 'content-type': 'text/plain' },
    });
  }
}