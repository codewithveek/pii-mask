export type EntityType = 'Person' | 'Place' | 'Organization';
export type Lexicon = Record<string, EntityType>;

/**
 * Common given names and surnames from West, East, and South Africa.
 * Used to extend compromise's entity recognition for African PII.
 */
export const africanNames: Lexicon = {
  // Yoruba (Nigeria)
  'Adeyemi': 'Person', 'Okafor': 'Person', 'Oluwaseun': 'Person',
  'Adewale': 'Person', 'Onyeka': 'Person', 'Chidinma': 'Person',
  'Emeka': 'Person', 'Ngozi': 'Person', 'Amaka': 'Person',
  // Hausa (Nigeria/Niger)
  'Musa': 'Person', 'Abubakar': 'Person', 'Fatima': 'Person',
  'Usman': 'Person', 'Halima': 'Person', 'Garba': 'Person',
  // Zulu / Xhosa (South Africa)
  'Sibusiso': 'Person', 'Nomvula': 'Person', 'Thabo': 'Person',
  'Zanele': 'Person', 'Sipho': 'Person', 'Lungelo': 'Person',
  // Swahili region (Kenya, Tanzania)
  'Kamau': 'Person', 'Wanjiru': 'Person', 'Odhiambo': 'Person',
  'Otieno': 'Person', 'Achieng': 'Person', 'Njoroge': 'Person',
  // Places
  'Lagos': 'Place', 'Abuja': 'Place', 'Kano': 'Place',
  'Nairobi': 'Place', 'Accra': 'Place', 'Kampala': 'Place',
};

export const africanSurnames: Lexicon = {
  'Okonkwo': 'Person', 'Adeyemi': 'Person', 'Mensah': 'Person',
  'Diallo': 'Person', 'Nkosi': 'Person', 'Mwangi': 'Person',
};
