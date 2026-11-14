/**
 * Photos réelles de Côte d'Ivoire, sous licence libre (Wikimedia Commons).
 * Les licences CC BY / CC BY-SA imposent de citer l'auteur, la licence et la source : le composant <Photo>
 * affiche ce crédit sur chaque image. Les personnes photographiées ne sont pas des bénéficiaires de LanfiaSave.
 */
export type PhotoInfo = {
  src: string;
  alt: string;
  caption: string;
  author: string;
  license: string;
  source: string;
  position?: string;
};

const thumb = (path: string) => {
  const file = path.split("/").pop();
  return `https://upload.wikimedia.org/wikipedia/commons/thumb/${path}/1280px-${file}`;
};
const page = (file: string) => `https://commons.wikimedia.org/wiki/File:${file}`;

export const PHOTOS = {
  marche: {
    src: thumb("d/d4/Le_sourire_du_march%C3%A9_Atmosph%C3%A8re_Abidjannaise_2024.jpg"),
    alt: "Un commerçant souriant derrière son étal de tomates et de légumes dans un marché couvert d'Abidjan",
    caption: "Marché d'Abidjan",
    author: "Litllegenius",
    license: "CC BY-SA 4.0",
    source: page("Le_sourire_du_march%C3%A9_Atmosph%C3%A8re_Abidjannaise_2024.jpg"),
    position: "center 40%",
  },
  karite: {
    src: thumb("d/d6/The_sisterhood_preparing_shea_butter_in_Korhogo%2C_Ivory_Coast.jpg"),
    alt: "Des femmes d'un groupement préparent du beurre de karité dans une cour à Korhogo",
    caption: "Groupement de femmes, beurre de karité — Korhogo",
    author: "Gwendoline Créno",
    license: "CC BY-SA 4.0",
    source: page("The_sisterhood_preparing_shea_butter_in_Korhogo,_Ivory_Coast.jpg"),
    position: "center 60%",
  },
  maraichage: {
    src: thumb("2/2a/Culture_mara%C3%AEch%C3%A8res_au_sein_de_ville_de_Bouak%C3%A9_en_2025.jpg"),
    alt: "Des parcelles de maraîchage verdoyantes cultivées au cœur de la ville de Bouaké",
    caption: "Maraîchage urbain — Bouaké, 2025",
    author: "DessBly2.0",
    license: "CC BY-SA 4.0",
    source: page("Culture_mara%C3%AEch%C3%A8res_au_sein_de_ville_de_Bouak%C3%A9_en_2025.jpg"),
  },
  ecole: {
    src: thumb("3/30/Children_in_a_school_in_C%C3%B4te_d%27Ivoire_-_20090420_-_1.jpg"),
    alt: "Des élèves assis à leurs tables dans une salle de classe en Côte d'Ivoire",
    caption: "Salle de classe",
    author: "Clément Bucco-Lechat",
    license: "CC BY-SA 4.0",
    source: page("Children_in_a_school_in_C%C3%B4te_d%27Ivoire_-_20090420_-_1.jpg"),
  },
  plantation: {
    src: thumb("a/aa/A_woman_works_hard_in_a_platation_in_Ivory_coast.jpg"),
    alt: "Une agricultrice travaille la terre dans un champ de maïs",
    caption: "Agricultrice dans son champ",
    author: "Melchisedek Abaka",
    license: "CC BY-SA 4.0",
    source: page("A_woman_works_hard_in_a_platation_in_Ivory_coast.jpg"),
    position: "center 35%",
  },
  village: {
    src: thumb("9/9e/Le_village_d%27Angorankoi_en_2024_02.jpg"),
    alt: "Une rue du village d'Angorankoi avec ses maisons et sa végétation",
    caption: "Village d'Angorankoi, 2024",
    author: "Dadrik",
    license: "CC BY-SA 4.0",
    source: page("Le_village_d%27Angorankoi_en_2024_02.jpg"),
  },
  mais: {
    src: thumb("a/a4/02_%C3%89pailleurs_de_ma%C3%AFs_03.jpg"),
    alt: "Des jeunes travaillent avec une égreneuse à maïs motorisée",
    caption: "Égrenage du maïs",
    author: "Mouahé",
    license: "CC BY-SA 4.0",
    source: page("02_%C3%89pailleurs_de_ma%C3%AFs_03.jpg"),
  },
} satisfies Record<string, PhotoInfo>;

export type PhotoKey = keyof typeof PHOTOS;
