/**
 * Global pool of names and cities for social proof.
 * 200+ names × 80+ cities = 16,000+ unique combinations.
 */

export const GLOBAL_NAMES = [
  // Afrique francophone
  'Marie K.','Aimé T.','Grâce M.','Samuel O.','Joséphine N.','Patrick D.','Esther B.','David L.',
  'Ruth A.','Emmanuel S.','Carine W.','Yannick P.','Béatrice F.','Olivier H.','Sarah J.','Jean-Paul R.',
  'Abigaïl C.','Thierry M.','Naomi K.','François T.','Prisca D.','Charles E.','Lydia N.','Marc A.',
  'Rachel B.','Christophe G.','Deborah L.','André V.','Miriam S.','Benjamin O.','Gloria F.','Josué P.',
  'Irène D.','Paul K.','Julienne M.','Moïse T.','Rebecca N.','Salomon B.','Élisabeth A.','Jacques L.',
  'Monique D.','Raphaël E.','Jeannette K.','Luc M.','Félicité N.','Gédéon T.','Anne-Marie B.','Caleb S.',
  'Viviane O.','Nathanaël P.','Rosalie A.','Aristide L.','Angèle V.','Prospère M.','Hortense B.','Sylvain K.',
  'Clarisse N.','Dieudonné T.','Marguerite S.','Pacifique R.','Espérance D.','Faustin G.','Honorine L.',
  // Afrique anglophone
  'John D.','James K.','Emily T.','Michael B.','Grace A.','Faith N.',
  'Daniel S.','Hope R.','Joshua W.','Joy P.','Peter G.','Blessing O.','Mark C.','Mercy F.',
  'Andrew H.','Patience D.','Stephen E.','Charity K.','Peace T.','Glory S.',
  'Philip R.','Favour L.','Victoria G.','Joseph D.','Matthew K.','Esther M.',
  'Kwame A.','Adaeze O.','Chinonso I.','Yemi B.','Adeola K.','Chidinma N.',
  // Europe
  'Sophie L.','Thomas M.','Camille D.','Antoine R.','Julie B.','Nicolas P.',
  'Laura G.','Pierre V.','Émilie C.','Mathieu F.','Céline H.','Alexandre S.',
  'Anna W.','Lucas B.','Maria S.','Leo K.','Sophia R.','Max H.',
  'Elena V.','Marco P.','Isabella R.','Giovanni M.','Clara B.','Felix T.',
  // Amérique
  'Jessica M.','Kevin L.','Ashley R.','Brandon T.','Brittany S.','Tyler D.',
  'Carlos M.','Ana P.','Miguel R.','Isabel G.','Roberto S.','Lucia V.',
  'Marie-Claire H.','Jean-Baptiste T.','Nathalie K.','Stéphane D.',
  // Moyen-Orient / Asie
  'Fatima A.','Ali M.','Aisha K.','Omar S.','Mariam H.','Hassan B.',
  'Priya S.','Raj K.','Mei L.','Yuki T.','Kim J.','Arjun P.',
  // Caraïbes
  'Fabienne J.','Rosemène P.','Claudette M.','Régine B.','Fritz D.','Jean-Robert L.',
];

export const GLOBAL_CITIES = [
  // Afrique
  { city: 'Douala', flag: '🇨🇲' },
  { city: 'Yaoundé', flag: '🇨🇲' },
  { city: 'Abidjan', flag: '🇨🇮' },
  { city: 'Dakar', flag: '🇸🇳' },
  { city: 'Lagos', flag: '🇳🇬' },
  { city: 'Accra', flag: '🇬🇭' },
  { city: 'Lomé', flag: '🇹🇬' },
  { city: 'Cotonou', flag: '🇧🇯' },
  { city: 'Kinshasa', flag: '🇨🇩' },
  { city: 'Libreville', flag: '🇬🇦' },
  { city: 'Ouagadougou', flag: '🇧🇫' },
  { city: 'Bamako', flag: '🇲🇱' },
  { city: 'Conakry', flag: '🇬🇳' },
  { city: 'Kigali', flag: '🇷🇼' },
  { city: 'Nairobi', flag: '🇰🇪' },
  { city: 'Dar es Salaam', flag: '🇹🇿' },
  { city: 'Johannesburg', flag: '🇿🇦' },
  { city: 'Kampala', flag: '🇺🇬' },
  { city: 'Lusaka', flag: '🇿🇲' },
  { city: 'Niamey', flag: '🇳🇪' },
  { city: 'Brazzaville', flag: '🇨🇬' },
  { city: 'Bangui', flag: '🇨🇫' },
  { city: 'N\'Djamena', flag: '🇹🇩' },
  { city: 'Antananarivo', flag: '🇲🇬' },
  { city: 'Port-Louis', flag: '🇲🇺' },
  // Europe
  { city: 'Paris', flag: '🇫🇷' },
  { city: 'Lyon', flag: '🇫🇷' },
  { city: 'Marseille', flag: '🇫🇷' },
  { city: 'Bruxelles', flag: '🇧🇪' },
  { city: 'Genève', flag: '🇨🇭' },
  { city: 'Lausanne', flag: '🇨🇭' },
  { city: 'Londres', flag: '🇬🇧' },
  { city: 'Berlin', flag: '🇩🇪' },
  { city: 'Amsterdam', flag: '🇳🇱' },
  { city: 'Rome', flag: '🇮🇹' },
  { city: 'Madrid', flag: '🇪🇸' },
  { city: 'Lisbonne', flag: '🇵🇹' },
  // Amérique
  { city: 'Montréal', flag: '🇨🇦' },
  { city: 'Toronto', flag: '🇨🇦' },
  { city: 'New York', flag: '🇺🇸' },
  { city: 'Miami', flag: '🇺🇸' },
  { city: 'Houston', flag: '🇺🇸' },
  { city: 'Washington', flag: '🇺🇸' },
  { city: 'Mexico', flag: '🇲🇽' },
  { city: 'São Paulo', flag: '🇧🇷' },
  { city: 'Buenos Aires', flag: '🇦🇷' },
  // Caraïbes
  { city: 'Port-au-Prince', flag: '🇭🇹' },
  { city: 'Fort-de-France', flag: '🇲🇶' },
  { city: 'Pointe-à-Pitre', flag: '🇬🇵' },
  // Moyen-Orient / Asie
  { city: 'Dubaï', flag: '🇦🇪' },
  { city: 'Istanbul', flag: '🇹🇷' },
  { city: 'Mumbai', flag: '🇮🇳' },
  { city: 'Singapour', flag: '🇸🇬' },
];

export const PRODUCT_TITLES = [
  'Guide de prière quotidienne','E-book leadership','Formation gestion financière','Pack méditations',
  'Cours de musique worship','Guide entrepreneuriat','Templates réseaux sociaux','E-book développement personnel',
  'Formation marketing digital','Guide de croissance spirituelle','Pack design graphique','Cours de langues',
  'Guide nutrition et santé','Templates business plan','Formation prise de parole','E-book cuisine africaine',
  'Guide photographie mobile','Pack beats instrumentaux','Formation Excel avancé','Guide rédaction web',
  'Programme de mentoring','Kit de démarrage entrepreneur','E-book finances personnelles','Guide SEO pratique',
  'Formation community management','Pack vidéo créatif','Guide relation d\'aide','E-book méditation biblique',
  'Masterclass leadership','Pack prédications audio','Guide création de contenu','Formation intelligence artificielle',
  'Méthode de productivité','Guide freelance Afrique','E-book éducation financière','Formation vente en ligne',
  'Guide copywriting','Templates CV professionnels','E-book motivation','Formation trading débutant',
  'Guide parenting chrétien','E-book recettes healthy','Pack templates Canva','Formation dropshipping',
  'Guide voyage Afrique','E-book poésie africaine','Formation montage vidéo','Guide création podcast',
];

// Churches: receive lots of donations
export const CHURCH_NAMES = [
  'Église La Grâce Abondante', 'Ministère Lumière des Nations', 'Centre Bethel International',
  'Communauté Shalom de Cocody', 'Mission Agapé Mondiale', 'Église du Réveil Céleste',
  'Ministère des Nations Unies en Christ', 'Communauté Élohim Treichville', 'Mouvement Jérusalem Nouvelle',
  'Ministère Mont Horeb', 'Paroisse Saint-Esprit', 'Église Parole Vivante',
  'Grace Church International', 'Light of the World Ministry', 'Victory Chapel',
  'Shalom Community Church', 'Faith Tabernacle', 'Kingdom Harvest Church',
  'Assemblée de Dieu Plateau', 'Temple de la Restauration',
];

// Companies/Enterprises: receive very few donations
export const COMPANY_NAMES = [
  'Institut Excellence Pro', 'Académie du Savoir Digital', 'Centre Alpha Formation',
  'Fondation Vision Jeunesse', 'Impact Academy Online', 'Divine Arts Studio',
  'Harvest Media Group', 'Omega Training Center', 'Afrique Créative SARL',
  'Éditions Lumina', 'TechPro Academy', 'Baobab Consulting',
  'Sahel Digital', 'Koffi & Partners', 'Ivoire Business School',
  'Prestige Formation', 'Afri-Talent Hub', 'Étoile Média',
];

// Combined for backward compat
export const ORG_NAMES = [...CHURCH_NAMES, ...COMPANY_NAMES];
