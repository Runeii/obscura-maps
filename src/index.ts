import { getCategories } from "utils";

const getHTML = (content = '', nextUrl: string) => `
<!DOCTYPE html>
<html>
  <head>
    <title>Atlas Obscura -> Google Maps exporter</title>
    <script type="text/javascript">
      document.addEventListener('DOMContentLoaded', function() {
        console.log('Starting timer');
        window.setTimeout(function() {
          console.log('Timer fired');
          window.location.href = "${nextUrl}";
        }, 500);
      });
    </script>
  </head>
  <body>
    ${content}
  </body>
</html>
`


export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const country = url.searchParams.get('country');
    const isExporting = url.searchParams.get('isExporting');
    const authToken = url.searchParams.get('authToken');

    if (url.href.includes('favicon.ico')) {
      return new Response('', {
        status: 200,
        headers: { 'content-type': 'image/jpeg' },
      });
    }

    if (isExporting) {
      const result = await env.EXPORTER.fetch(`https://obscura-maps--exporter.workerify.workers.dev/?country=${country}&isExporting=true`);
      return result;
    }

    const currentCategoryIndex = Number(url.searchParams.get('currentCategoryIndex') || 0);
    const currentOffset = url.searchParams.get('currentOffset') || 0;

    const categories = await getCategories(country, env);
    console.log(`Found ${categories.length} categories for ${country}`);

    let currentCategory: Category = categories[currentCategoryIndex];

    console.log('Category', currentCategoryIndex, 'is', currentCategory.id);
    console.log(`Processing: ${country}, category ${currentCategory.name}, from #${currentOffset}`);
    const response: Response = await env.DISPATCHER.fetch(`http://obscura-maps--dispatcher.workerify.workers.dev/?country=${country}&category=${currentCategory.id}&offset=${currentOffset}`);
    const result: { nextOffset: number, status: number } = await response.json();

    const nextOffset = result.status === 200 ? 0 : result.nextOffset;
    let nextUrl = new URL(request.url);
    nextUrl.searchParams.set('currentCategoryIndex', `${result.status === 200 ? currentCategoryIndex + 1 : currentCategoryIndex}`);
    nextUrl.searchParams.set('country', country);
    nextUrl.searchParams.set('currentOffset', `${nextOffset}`);

    if (result.status === 200 && currentCategoryIndex === categories.length - 1) {
      console.log('Exporting...');
      url.searchParams.set('isExporting', 'true');

      return new Response(getHTML(`Exporting....`, url.href), {
        status: 200,
        headers: { 'content-type': 'text/html' },
      });
    }

    return new Response(getHTML(`Processing: ${country} -> ${currentCategory.name} -> entry #${nextOffset}`, nextUrl.href), {
      status: 200,
      headers: { 'content-type': 'text/html' },
    });
  }
}