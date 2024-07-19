import { load } from 'cheerio';

export const fetchPage = async (url) => {
  try {
    const response = await fetch(url);
    const text = await response.text();
    return load(text);
  } catch (error) {
    console.error(`Error fetching page: ${url}`, error);
    return null;
  }
}


export const getCategories = async (country, env): Promise<Category[]> => {
  let categories = await env.OBSCURA_MAPS.get(`CATEGORIES_${country}`, 'json');
  if (!categories || categories.length === 0) {
    await env.CATEGORIES.fetch(`http://obscura-maps--categories.workerify.workers.dev/?country=${country}`);
    categories = await env.OBSCURA_MAPS.get(`CATEGORIES_${country}`, 'json');
  }
  return categories;
}