export type EntityType = 'Person' | 'Place' | 'Organization';
export type Lexicon = Record<string, EntityType>;

/**
 * Common given names and surnames from East Asia (China, Japan, Korea).
 */
export const eastAsianNames: Lexicon = {
  // Chinese
  'Wei': 'Person', 'Jing': 'Person', 'Li': 'Person',
  'Xiao': 'Person', 'Ming': 'Person', 'Hua': 'Person',
  // Japanese
  'Yuki': 'Person', 'Hiro': 'Person', 'Sakura': 'Person',
  'Takeshi': 'Person', 'Naomi': 'Person', 'Kenji': 'Person',
  // Korean
  'Jisoo': 'Person', 'Minho': 'Person', 'Soyeon': 'Person',
  'Jungkook': 'Person', 'Eunji': 'Person', 'Hyunjin': 'Person',
  // Places
  'Beijing': 'Place', 'Shanghai': 'Place', 'Tokyo': 'Place',
  'Osaka': 'Place', 'Seoul': 'Place', 'Busan': 'Place',
  'Shenzhen': 'Place', 'Guangzhou': 'Place', 'Kyoto': 'Place',
};

export const eastAsianSurnames: Lexicon = {
  'Wang': 'Person', 'Zhang': 'Person', 'Chen': 'Person',
  'Tanaka': 'Person', 'Suzuki': 'Person', 'Yamamoto': 'Person',
  'Kim': 'Person', 'Lee': 'Person', 'Park': 'Person',
};
