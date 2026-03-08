export type EntityType = 'Person' | 'Place' | 'Organization';
export type Lexicon = Record<string, EntityType>;

/**
 * Common given names and surnames from South Asia (India, Pakistan, Bangladesh, Sri Lanka).
 */
export const southAsianNames: Lexicon = {
  // India
  'Priya': 'Person', 'Rahul': 'Person', 'Ananya': 'Person',
  'Vikram': 'Person', 'Deepika': 'Person', 'Arjun': 'Person',
  'Sneha': 'Person', 'Rohit': 'Person', 'Kavitha': 'Person',
  // Pakistan
  'Ayesha': 'Person', 'Bilal': 'Person', 'Zara': 'Person',
  'Hassan': 'Person', 'Fatima': 'Person', 'Omar': 'Person',
  // Bangladesh
  'Taslima': 'Person', 'Rahim': 'Person', 'Nasreen': 'Person',
  // Sri Lanka
  'Chaminda': 'Person', 'Dilshan': 'Person', 'Kumari': 'Person',
  // Places
  'Mumbai': 'Place', 'Delhi': 'Place', 'Bangalore': 'Place',
  'Karachi': 'Place', 'Lahore': 'Place', 'Dhaka': 'Place',
  'Colombo': 'Place', 'Chennai': 'Place', 'Hyderabad': 'Place',
};

export const southAsianSurnames: Lexicon = {
  'Sharma': 'Person', 'Patel': 'Person', 'Singh': 'Person',
  'Kumar': 'Person', 'Gupta': 'Person', 'Khan': 'Person',
  'Ahmed': 'Person', 'Nair': 'Person', 'Reddy': 'Person',
};
