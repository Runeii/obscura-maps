declare const OBSCURA_MAPS: KVNamespace;

type Category = {
  id: string;
  name: string;
};


type Item = {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  country: string;
  coords: [number, number];
};