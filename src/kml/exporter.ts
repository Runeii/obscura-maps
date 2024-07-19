import { getCategories } from "utils";

// Function to escape special characters
function escapeXML(str) {
  return str.replace(/[<>&'"]/g, function (char) {
    switch (char) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case '\'':
        return '&apos;';
      case '"':
        return '&quot;';
    }
  });
}

const createPlacemarks = (items: Item[], categoryIndex: number) => items.map(item => `
  <Placemark>
    <name>${escapeXML(item.title)}</name>
    <description><![CDATA[<img src="${item.image}" height="200" width="auto" /><br><br>${escapeXML(item.description)}]]></description>
    <styleUrl>#icon-category-${categoryIndex}</styleUrl>
    <ExtendedData>
      <Data name="gx_media_links">
        <value><![CDATA[${item.image}]]></value>
      </Data>
    </ExtendedData>
    <Point>
      <coordinates>${item.coords[1]},${item.coords[0]},0</coordinates>
    </Point>
  </Placemark>
`).join('');

// An array of 12 hexes (without a #) of distinct saturated colours
const colours = ['FF0000', 'FFA500', '7FFF00', '00FF00', '00FF7F', '00FFFF', '007FFF', '0000FF', '7F00FF', 'FF00FF', 'FF007F', 'FF7F00'];

function createKML(items: { [key: string]: Item[] }, categoriesMap: { [key: string]: string }) {
  const placemarks = Object.entries(items).map(([category, items], index) => `
    <Folder>
      <name>${escapeXML(categoriesMap[category])}</name>
      ${createPlacemarks(items, index)}
    </Folder>
  `).join('');

  const styles = Object.entries(categoriesMap).map(([category], index) => `
    <Style id="icon-category-${index}">
      <IconStyle>
        <color>${colours[index]}</color>
        <scale>1</scale>
        <Icon>
          <href>https://www.gstatic.com/mapspro/images/stock/503-wht-blank_maps.png</href>
        </Icon>
        <hotSpot x="32" xunits="pixels" y="64" yunits="insetPixels"/>
      </IconStyle>
      <LabelStyle>
        <scale>0</scale>
      </LabelStyle>
    </Style>
  `).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
          <kml xmlns="http://www.opengis.net/kml/2.2">
            <Document>
              ${styles}
              ${placemarks}
            </Document>
          </kml>`;
}

const handleRequest = async (request, env) => {
  const url = new URL(request.url);
  const country = url.searchParams.get('country');

  const { OBSCURA_MAPS } = env;
  let categories = await getCategories(country, env);
  const categoriesMap = Object.fromEntries(categories.map(category => [category.id, category.name]));

  const keys = await OBSCURA_MAPS.list();

  const global = url.searchParams.get('global') === 'true';

  const items: Item[] = await Promise.all(keys.keys.map(key => {
    if (key.name.includes('CATEGORIES_')) {
      return null;
    }
    if (!global && !key.name.includes(`${country}--`)) {
      return null;
    }
    return OBSCURA_MAPS.get(key.name, 'json');
  })).then(items => items.filter(item => item !== null));

  const itemsByCategory = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  // merge ruins and churches
  if (itemsByCategory['sacred-spaces']) {
    itemsByCategory['ruins'] = itemsByCategory['ruins'].concat(itemsByCategory['sacred-spaces']);
    categoriesMap['ruins'] = 'Ruins & Churches';
    delete itemsByCategory['sacred-spaces'];
  }

  // merge homes and architecture
  if (itemsByCategory['homes']) {
    itemsByCategory['architecture'] = itemsByCategory['architecture'].concat(itemsByCategory['homes']);
    categoriesMap['architecture'] = 'Architecture & Homes';
    delete itemsByCategory['homes'];
  }

  // merge statues and history
  if (itemsByCategory['statues']) {
    itemsByCategory['history'] = itemsByCategory['history'].concat(itemsByCategory['statues']);
    categoriesMap['history'] = 'History & Statues';
    delete itemsByCategory['statues'];
  }
  const kml = createKML(itemsByCategory, categoriesMap);

  return new Response(kml, {
    headers: {
      'Content-Type': 'application/vnd.google-earth.kml+xml',
      'Content-Disposition': 'attachment; filename="map.kml"'
    }
  });
}

export default {
  fetch: handleRequest
}
