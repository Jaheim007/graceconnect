// Official SiteViral service taxonomy — single source of truth.
// Powers provider onboarding, Explore filters, specialties, service suggestions,
// customer-friendly service-mode language, and search aliases.
//
// Levels:
//   1. WorkspaceType — the top-level provider workspace (maps to siteviral_type).
//   2. Specialty — what kind of provider the user is (multi-select).
//   3. Suggested service — starter offer templates (multi-select).
//
// Church is intentionally NOT a workspace type here — it has its own onboarding.
// Events is not a top-level workspace type — it is a capability of other types.

import type { SiteviralType } from '@/types/database';

export type WorkspaceTypeKey =
  | 'digital'
  | 'artisans'
  | 'beauty'
  | 'sport'
  | 'tutors'
  | 'music'
  | 'influencers'
  | 'other';

export interface Bilingual { fr: string; en: string }

export interface SpecialtyGroup {
  key: string;
  label: Bilingual;
  specialties: { key: string; label: Bilingual; aliases?: string[] }[];
  suggestedServices: { key: string; label: Bilingual }[];
}

export interface ServiceModeOption {
  key: string;
  label: Bilingual;
}

export interface WorkspaceTypeDef {
  key: WorkspaceTypeKey;
  siteviral_type: SiteviralType;
  emoji: string;
  gradient: string;
  label: Bilingual;
  tagline: Bilingual;
  /** Wording for the name field in step 4. */
  nameFieldLabel: Bilingual;
  /** Whether to offer the "I work under my own name" toggle. */
  offersPersonalNameMode: boolean;
  /** Whether to ask for a city/service area. */
  needsLocation: boolean;
  /** "What kind of X are you?" title for step 2. */
  specialtiesPrompt: Bilingual;
  groups: SpecialtyGroup[];
  serviceModes: ServiceModeOption[];
  /** Customer-friendly action verb for services created here. */
  customerAction: 'book' | 'quote' | 'message' | 'buy';
}

// ---------- Helper builders ----------
const g = (
  key: string,
  labelFr: string,
  labelEn: string,
  specialties: [string, string, string, string[]?][],
  services: [string, string, string][],
): SpecialtyGroup => ({
  key,
  label: { fr: labelFr, en: labelEn },
  specialties: specialties.map(([k, fr, en, aliases]) => ({
    key: k, label: { fr, en }, ...(aliases ? { aliases } : {}),
  })),
  suggestedServices: services.map(([k, fr, en]) => ({ key: k, label: { fr, en } })),
});

const mode = (key: string, fr: string, en: string): ServiceModeOption => ({ key, label: { fr, en } });

// ---------- ARTISANS & HOME SERVICES ----------
const ARTISANS: WorkspaceTypeDef = {
  key: 'artisans',
  siteviral_type: 'artisans_home_services',
  emoji: '🛠️',
  gradient: 'from-amber-500 via-orange-500 to-red-500',
  label: { fr: 'Artisans & Services à domicile', en: 'Artisans & Home Services' },
  tagline: { fr: 'Plomberie, électricité, ménage, réparations…', en: 'Plumbing, electrical, cleaning, repairs…' },
  nameFieldLabel: { fr: 'Nom professionnel ou de l’entreprise', en: 'Business or professional name' },
  offersPersonalNameMode: true,
  needsLocation: true,
  specialtiesPrompt: { fr: 'Quel type d’artisan êtes-vous ?', en: 'What type of artisan are you?' },
  customerAction: 'quote',
  groups: [
    g('plumbing', 'Plomberie', 'Plumbing',
      [
        ['plumber', 'Plombier', 'Plumber'],
        ['pipe_installer', 'Installateur de tuyauterie', 'Pipe installer'],
        ['drain_specialist', 'Spécialiste canalisations', 'Drain specialist'],
        ['tank_installer', 'Installateur de citernes', 'Water-tank installer'],
        ['bath_fixture_installer', 'Installateur sanitaire', 'Bathroom fixture installer'],
        ['water_pump_tech', 'Technicien pompe à eau', 'Water-pump technician'],
      ],
      [
        ['fix_leak', 'Réparer une fuite', 'Repair leaking pipes'],
        ['unblock_drain', 'Déboucher canalisations', 'Unblock drains'],
        ['install_sink_toilet', 'Installer éviers et toilettes', 'Install sinks and toilets'],
        ['install_tank', 'Installer une citerne', 'Install water tanks'],
        ['repair_pump', 'Réparer pompe à eau', 'Repair water pumps'],
        ['plumbing_inspection', 'Inspection plomberie', 'Plumbing inspection'],
      ],
    ),
    g('electrical', 'Électricité & installations techniques', 'Electrical & technical installation',
      [
        ['electrician', 'Électricien', 'Electrician'],
        ['wiring_tech', 'Technicien câblage', 'Wiring technician'],
        ['generator_tech', 'Technicien groupe électrogène', 'Generator technician'],
        ['solar_installer', 'Installateur solaire', 'Solar installer'],
        ['inverter_tech', 'Technicien onduleur', 'Inverter technician'],
        ['cctv_installer', 'Installateur vidéosurveillance', 'CCTV installer'],
        ['network_installer', 'Installateur réseau/internet', 'Internet/network installer'],
      ],
      [
        ['fix_electric', 'Réparer une panne électrique', 'Repair electrical faults'],
        ['install_lights', 'Installer lumières et prises', 'Install lights and sockets'],
        ['home_wiring', 'Câblage maison', 'Home wiring'],
        ['ceiling_fan', 'Installer un ventilateur', 'Install ceiling fans'],
        ['solar_inverter', 'Installer solaire/onduleur', 'Install solar/inverter systems'],
        ['generator_service', 'Entretien/réparation groupe', 'Generator repair/service'],
        ['cctv_install', 'Installation vidéosurveillance', 'CCTV installation'],
        ['network_setup', 'Configuration réseau', 'Network setup'],
      ],
    ),
    g('building', 'Construction & finitions', 'Building & finishing',
      [
        ['mason', 'Maçon', 'Mason'],
        ['carpenter', 'Menuisier', 'Carpenter'],
        ['furniture_maker', 'Fabricant de meubles', 'Furniture maker'],
        ['cabinet_maker', 'Ébéniste', 'Cabinet maker'],
        ['painter', 'Peintre', 'Painter'],
        ['tiler', 'Carreleur', 'Tiler'],
        ['welder', 'Soudeur', 'Welder'],
        ['roofer', 'Couvreur', 'Roofer'],
        ['glass_installer', 'Vitrier', 'Glass installer'],
        ['aluminum_fabricator', 'Aluminier', 'Aluminum fabricator'],
        ['plasterer', 'Plâtrier', 'Plasterer'],
        ['wallpaper_installer', 'Poseur de papier peint', 'Wallpaper installer'],
      ],
      [
        ['build_walls', 'Construire ou réparer des murs', 'Build or repair walls'],
        ['painting', 'Peinture intérieure/extérieure', 'Interior/exterior painting'],
        ['tile_install', 'Pose de carrelage', 'Tile installation'],
        ['custom_furniture', 'Meubles sur mesure', 'Custom furniture'],
        ['cabinet_install', 'Installation de placards', 'Cabinet installation'],
        ['welding', 'Soudure et métallerie', 'Welding and metal work'],
        ['roof_repair', 'Réparation toiture', 'Roofing repair'],
        ['door_window', 'Pose portes/fenêtres', 'Door/window installation'],
      ],
    ),
    g('appliance_repair', 'Réparation d’appareils', 'Appliance & equipment repair',
      [
        ['ac_tech', 'Technicien climatisation', 'Air-conditioner technician'],
        ['fridge_tech', 'Technicien réfrigérateur', 'Refrigerator technician'],
        ['washer_tech', 'Technicien machine à laver', 'Washing-machine technician'],
        ['tv_repair', 'Réparateur TV', 'Television repair technician'],
        ['phone_repair', 'Réparateur téléphone', 'Phone repair technician'],
        ['computer_repair', 'Réparateur ordinateur', 'Computer repair technician'],
        ['appliance_tech', 'Technicien électroménager', 'General appliance technician'],
      ],
      [
        ['diagnose', 'Diagnostic', 'Diagnose equipment'],
        ['repair_appliance', 'Réparation d’appareil', 'Repair appliance'],
        ['install_ac', 'Installer climatisation', 'Install air conditioner'],
        ['service_fridge', 'Entretien réfrigérateur', 'Service refrigerator'],
        ['replace_part', 'Remplacer un composant', 'Replace damaged component'],
      ],
    ),
    g('cleaning', 'Ménage & aide à domicile', 'Cleaning & household help',
      [
        ['home_cleaner', 'Agent de ménage', 'Home cleaner', ['maid', 'housekeeper', 'domestic worker', 'ménagère', 'femme de ménage']],
        ['housekeeper', 'Gouvernant(e)', 'Housekeeper'],
        ['domestic_help', 'Aide à domicile', 'Domestic help'],
        ['office_cleaner', 'Agent d’entretien bureaux', 'Office cleaner'],
        ['laundry', 'Blanchisserie', 'Laundry provider'],
        ['carpet_cleaner', 'Nettoyeur de tapis', 'Carpet cleaner'],
        ['deep_cleaning', 'Grand ménage', 'Deep-cleaning provider'],
        ['move_cleaning', 'Ménage entrée/sortie', 'Move-in/move-out cleaner'],
      ],
      [
        ['regular_clean', 'Ménage régulier', 'Regular home cleaning'],
        ['deep_clean', 'Grand ménage ponctuel', 'One-time deep cleaning'],
        ['office_clean', 'Nettoyage bureaux', 'Office cleaning'],
        ['laundry_service', 'Lessive et repassage', 'Laundry and ironing'],
        ['carpet_sofa', 'Nettoyage tapis et canapés', 'Carpet and sofa cleaning'],
        ['post_construction', 'Nettoyage post-chantier', 'Post-construction cleaning'],
        ['move_clean', 'Ménage entrée/sortie', 'Move-in/move-out cleaning'],
      ],
    ),
    g('property', 'Extérieur & propriété', 'Property & outdoor services',
      [
        ['gardener', 'Jardinier', 'Gardener'],
        ['landscaper', 'Paysagiste', 'Landscaper'],
        ['pest_control', 'Dératiseur / anti-nuisibles', 'Pest-control specialist'],
        ['pool_maintenance', 'Entretien piscine', 'Pool-maintenance provider'],
        ['waste_removal', 'Enlèvement de déchets', 'Waste-removal provider'],
        ['mover', 'Déménageur', 'Moving provider'],
        ['locksmith', 'Serrurier', 'Locksmith'],
        ['handyman', 'Bricoleur polyvalent', 'Handyman'],
        ['upholsterer', 'Tapissier', 'Upholsterer'],
      ],
      [
        ['garden_maint', 'Entretien de jardin', 'Garden maintenance'],
        ['landscaping', 'Aménagement paysager', 'Landscaping'],
        ['pest_treat', 'Traitement anti-nuisibles', 'Pest treatment'],
        ['moving_help', 'Aide au déménagement', 'Moving assistance'],
        ['upholstery', 'Réparation de mobilier', 'Furniture repair/upholstery'],
        ['lock_replace', 'Remplacement de serrure', 'Lock replacement'],
        ['general_repair', 'Petites réparations', 'General home repairs'],
      ],
    ),
  ],
  serviceModes: [
    mode('customer_place', 'Chez le client', 'At the customer’s home or property'),
    mode('my_workshop', 'À mon atelier', 'At my workshop'),
    mode('both', 'Les deux', 'Both'),
  ],
};

// ---------- BEAUTY ----------
const BEAUTY: WorkspaceTypeDef = {
  key: 'beauty',
  siteviral_type: 'beauty',
  emoji: '💅',
  gradient: 'from-pink-500 via-rose-500 to-orange-400',
  label: { fr: 'Beauté & Soins personnels', en: 'Beauty & Personal Care' },
  tagline: { fr: 'Coiffure, maquillage, ongles, soins…', en: 'Hair, makeup, nails, skincare…' },
  nameFieldLabel: { fr: 'Nom du salon ou nom professionnel', en: 'Salon or professional name' },
  offersPersonalNameMode: true,
  needsLocation: true,
  specialtiesPrompt: { fr: 'Quel type de professionnel(le) de la beauté êtes-vous ?', en: 'What kind of beauty professional are you?' },
  customerAction: 'book',
  groups: [
    g('hair', 'Cheveux', 'Hair',
      [
        ['hairstylist', 'Coiffeur / coiffeuse', 'Hairstylist'],
        ['braider', 'Tresseuse', 'Hair braider'],
        ['natural_hair', 'Spécialiste cheveux naturels', 'Natural-hair specialist'],
        ['loctician', 'Locticien(ne)', 'Loctician'],
        ['wig_maker', 'Fabricant de perruques', 'Wig maker'],
        ['wig_installer', 'Poseur de perruques', 'Wig installer'],
        ['hair_color', 'Coloriste', 'Hair-color specialist'],
        ['hair_treatment', 'Spécialiste soin capillaire', 'Hair-treatment specialist'],
      ],
      [
        ['braids', 'Tresses', 'Braids'],
        ['loc_install', 'Pose de locks', 'Loc installation'],
        ['loc_retwist', 'Retwist locks', 'Loc retwist'],
        ['wig_install', 'Pose de perruque', 'Wig installation'],
        ['hair_coloring', 'Coloration', 'Hair coloring'],
        ['natural_hair_treatment', 'Soin cheveux naturels', 'Natural-hair treatment'],
        ['wash_style', 'Shampoing et coiffage', 'Hair washing and styling'],
        ['bridal_hair', 'Coiffure mariée', 'Bridal hairstyling'],
      ],
    ),
    g('barber', 'Coiffure homme', 'Barbering',
      [
        ['barber', 'Barbier', 'Barber'],
        ['mobile_barber', 'Barbier mobile', 'Mobile barber'],
        ['kids_barber', 'Barbier enfants', 'Children’s barber'],
        ['beard_specialist', 'Spécialiste barbe', 'Beard specialist'],
      ],
      [
        ['mens_cut', 'Coupe homme', 'Men’s haircut'],
        ['kids_cut', 'Coupe enfant', 'Children’s haircut'],
        ['beard_trim', 'Taille de barbe', 'Beard trim'],
        ['line_up', 'Contour / hairline', 'Hairline shaping'],
        ['cut_beard_pack', 'Coupe + barbe', 'Haircut and beard package'],
        ['home_cut', 'Coupe à domicile', 'Home-service haircut'],
      ],
    ),
    g('makeup', 'Maquillage & beauté mariée', 'Makeup & bridal beauty',
      [
        ['mua', 'Maquilleur(se)', 'Makeup artist'],
        ['bridal_mua', 'Maquilleur(se) mariée', 'Bridal makeup artist'],
        ['photo_mua', 'Maquilleur(se) photoshoot', 'Photoshoot makeup artist'],
        ['event_mua', 'Maquilleur(se) événement', 'Event makeup artist'],
      ],
      [
        ['everyday_makeup', 'Maquillage jour', 'Everyday makeup'],
        ['event_makeup', 'Maquillage événement', 'Event makeup'],
        ['bridal_makeup', 'Maquillage mariée', 'Bridal makeup'],
        ['bridesmaid_pack', 'Pack demoiselles d’honneur', 'Bridesmaid package'],
        ['photo_makeup', 'Maquillage photoshoot', 'Photoshoot makeup'],
        ['makeup_lesson', 'Cours de maquillage', 'Makeup lesson'],
      ],
    ),
    g('nails', 'Ongles, cils & sourcils', 'Nails, lashes & brows',
      [
        ['nail_tech', 'Prothésiste ongulaire', 'Nail technician'],
        ['manicurist', 'Manucure', 'Manicurist'],
        ['pedicurist', 'Pédicure', 'Pedicurist'],
        ['lash_tech', 'Technicienne cils', 'Lash technician'],
        ['brow_specialist', 'Spécialiste sourcils', 'Brow specialist'],
      ],
      [
        ['manicure', 'Manucure', 'Manicure'],
        ['pedicure', 'Pédicure', 'Pedicure'],
        ['gel_nails', 'Ongles en gel', 'Gel nails'],
        ['acrylic_nails', 'Ongles en acrylique', 'Acrylic nails'],
        ['lash_install', 'Pose de cils', 'Lash installation'],
        ['lash_refill', 'Remplissage cils', 'Lash refill'],
        ['brow_shape', 'Restructuration sourcils', 'Brow shaping'],
        ['brow_tint', 'Teinture sourcils', 'Brow tinting'],
      ],
    ),
    g('skincare', 'Soins de la peau & bien-être', 'Skincare & wellness',
      [
        ['esthetician', 'Esthéticien(ne)', 'Esthetician'],
        ['facial_specialist', 'Spécialiste soins visage', 'Facial specialist'],
        ['skincare_consultant', 'Conseiller(ère) beauté', 'Skincare consultant'],
        ['massage_therapist', 'Masseur(se)', 'Massage therapist'],
        ['spa_provider', 'Prestataire spa', 'Spa provider'],
      ],
      [
        ['facial', 'Soin du visage', 'Facial treatment'],
        ['skincare_consult', 'Consultation peau', 'Skincare consultation'],
        ['body_treatment', 'Soin corps', 'Body treatment'],
        ['massage', 'Séance de massage', 'Massage session'],
        ['spa_pack', 'Pack spa', 'Spa package'],
      ],
    ),
  ],
  serviceModes: [
    mode('salon', 'À mon salon/studio', 'At my salon/studio'),
    mode('customer_home', 'À domicile', 'At the customer’s home'),
    mode('both', 'Les deux', 'Both'),
  ],
};

// ---------- SPORT & COACHING ----------
const SPORT: WorkspaceTypeDef = {
  key: 'sport',
  siteviral_type: 'sport',
  emoji: '🏋️',
  gradient: 'from-lime-500 via-emerald-500 to-teal-600',
  label: { fr: 'Sport & Coaching', en: 'Sport & Coaching' },
  tagline: { fr: 'Fitness, coaching personnel et professionnel', en: 'Fitness, personal & professional coaching' },
  nameFieldLabel: { fr: 'Nom professionnel ou de l’activité', en: 'Business or professional name' },
  offersPersonalNameMode: true,
  needsLocation: true,
  specialtiesPrompt: { fr: 'Quel type de coach êtes-vous ?', en: 'What kind of coach are you?' },
  customerAction: 'book',
  groups: [
    g('fitness', 'Sport & fitness', 'Sports & fitness',
      [
        ['pt', 'Coach sportif personnel', 'Personal trainer'],
        ['fitness_coach', 'Coach fitness', 'Fitness coach'],
        ['football_coach', 'Coach football', 'Football coach'],
        ['basketball_coach', 'Coach basketball', 'Basketball coach'],
        ['tennis_coach', 'Coach tennis', 'Tennis coach'],
        ['swim_coach', 'Coach natation', 'Swimming coach'],
        ['boxing_coach', 'Coach boxe', 'Boxing coach'],
        ['martial_arts', 'Instructeur arts martiaux', 'Martial-arts instructor'],
        ['athletics_coach', 'Coach athlétisme', 'Athletics coach'],
        ['running_coach', 'Coach course à pied', 'Running coach'],
        ['yoga', 'Prof de yoga', 'Yoga instructor'],
        ['dance_fitness', 'Prof danse-fitness', 'Dance-fitness instructor'],
        ['strength_coach', 'Coach musculation', 'Strength coach'],
        ['kids_sport', 'Coach sport enfants', 'Children’s sports coach'],
      ],
      [
        ['pt_session', 'Séance de coaching perso', 'Personal training session'],
        ['group_class', 'Cours collectif', 'Group fitness class'],
        ['football_training', 'Entraînement football', 'Football training'],
        ['swim_lesson', 'Cours de natation', 'Swimming lesson'],
        ['boxing_lesson', 'Cours de boxe', 'Boxing lesson'],
        ['running_program', 'Programme running', 'Running program'],
        ['month_pack', 'Pack mensuel', 'Monthly training package'],
        ['online_fitness', 'Coaching fitness en ligne', 'Online fitness coaching'],
      ],
    ),
    g('coaching', 'Coaching personnel & professionnel', 'Personal & professional coaching',
      [
        ['career', 'Coach carrière', 'Career coach'],
        ['business', 'Coach business', 'Business coach'],
        ['life', 'Coach de vie', 'Life coach'],
        ['leadership', 'Coach leadership', 'Leadership coach'],
        ['public_speaking', 'Coach prise de parole', 'Public-speaking coach'],
        ['productivity', 'Coach productivité', 'Productivity coach'],
        ['interview', 'Coach entretien', 'Interview coach'],
        ['confidence', 'Coach confiance en soi', 'Confidence coach'],
        ['entrepreneurship', 'Coach entrepreneuriat', 'Entrepreneurship coach'],
        ['relationship', 'Coach relation', 'Relationship coach'],
        ['wellness', 'Coach bien-être', 'Wellness coach'],
      ],
      [
        ['intro_session', 'Séance découverte', 'Introductory coaching session'],
        ['career_session', 'Séance planification carrière', 'Career-planning session'],
        ['interview_prep', 'Préparation entretien', 'Interview preparation'],
        ['biz_strategy', 'Séance stratégie business', 'Business strategy session'],
        ['speaking_training', 'Formation prise de parole', 'Public-speaking training'],
        ['four_pack', 'Pack 4 séances', 'Four-session coaching package'],
        ['month_program', 'Programme mensuel', 'Monthly coaching program'],
      ],
    ),
  ],
  serviceModes: [
    mode('in_person', 'En personne', 'In person'),
    mode('online', 'En ligne', 'Online'),
    mode('both', 'Les deux', 'Both'),
  ],
};

// ---------- TUTORS & TEACHERS ----------
const TUTORS: WorkspaceTypeDef = {
  key: 'tutors',
  siteviral_type: 'tutors_home_teachers',
  emoji: '🎓',
  gradient: 'from-sky-500 via-blue-500 to-indigo-500',
  label: { fr: 'Tuteurs & Professeurs', en: 'Tutors & Teachers' },
  tagline: { fr: 'Soutien scolaire, langues, compétences pro…', en: 'Academic, languages, pro skills…' },
  nameFieldLabel: { fr: 'Nom de l’activité de tutorat ou nom professionnel', en: 'Tutoring business or professional name' },
  offersPersonalNameMode: true,
  needsLocation: true,
  specialtiesPrompt: { fr: 'Quelles matières enseignez-vous ?', en: 'What do you teach?' },
  customerAction: 'book',
  groups: [
    g('academic', 'Scolaire', 'Academic',
      [
        ['math', 'Tuteur maths', 'Mathematics tutor'],
        ['english_ac', 'Tuteur anglais', 'English tutor'],
        ['french_ac', 'Tuteur français', 'French tutor'],
        ['science', 'Tuteur sciences', 'Science tutor'],
        ['physics', 'Tuteur physique', 'Physics tutor'],
        ['chemistry', 'Tuteur chimie', 'Chemistry tutor'],
        ['biology', 'Tuteur biologie', 'Biology tutor'],
        ['history', 'Tuteur histoire', 'History tutor'],
        ['geography', 'Tuteur géographie', 'Geography tutor'],
        ['economics', 'Tuteur économie', 'Economics tutor'],
        ['accounting', 'Tuteur comptabilité', 'Accounting tutor'],
      ],
      [
        ['individual', 'Cours individuel', 'Individual lesson'],
        ['group', 'Cours en groupe', 'Group lesson'],
        ['online_lesson', 'Cours en ligne', 'Online lesson'],
        ['home_lesson', 'Cours à domicile', 'Home lesson'],
        ['exam_pack', 'Pack préparation examen', 'Exam-preparation package'],
        ['month_pack', 'Pack mensuel', 'Monthly tutoring package'],
      ],
    ),
    g('languages', 'Langues', 'Languages',
      [
        ['english_lang', 'Prof d’anglais', 'English-language teacher'],
        ['french_lang', 'Prof de français', 'French-language teacher'],
        ['spanish', 'Prof d’espagnol', 'Spanish teacher'],
        ['arabic', 'Prof d’arabe', 'Arabic teacher'],
        ['local_lang', 'Prof de langue locale', 'Local-language teacher'],
        ['literacy', 'Tuteur lecture', 'Reading and literacy tutor'],
      ],
      [
        ['individual', 'Cours individuel', 'Individual lesson'],
        ['group', 'Cours en groupe', 'Group lesson'],
        ['online_lesson', 'Cours en ligne', 'Online lesson'],
      ],
    ),
    g('study_support', 'Accompagnement scolaire', 'Study support',
      [
        ['exam_prep', 'Prépa examens', 'Exam-preparation tutor'],
        ['uni_entry', 'Prépa entrée université', 'University-entry tutor'],
        ['homework', 'Soutien aux devoirs', 'Homework-support tutor'],
        ['study_skills', 'Coach méthodes de travail', 'Study-skills coach'],
        ['adult_learning', 'Formation adultes', 'Adult-learning tutor'],
      ],
      [
        ['individual', 'Cours individuel', 'Individual lesson'],
        ['exam_pack', 'Pack préparation examen', 'Exam-preparation package'],
      ],
    ),
    g('tech_pro', 'Tech & compétences pro', 'Technology & professional skills',
      [
        ['coding', 'Tuteur code', 'Coding tutor'],
        ['webdev', 'Prof développement web', 'Web-development teacher'],
        ['graphic', 'Prof design graphique', 'Graphic-design teacher'],
        ['data', 'Tuteur analyse de données', 'Data-analysis tutor'],
        ['office', 'Formateur Microsoft Office', 'Microsoft Office trainer'],
        ['digimarket', 'Prof marketing digital', 'Digital-marketing teacher'],
        ['business_teacher', 'Prof business', 'Business teacher'],
        ['entrepreneur_teacher', 'Prof entrepreneuriat', 'Entrepreneurship teacher'],
      ],
      [
        ['individual', 'Cours individuel', 'Individual lesson'],
        ['online_lesson', 'Cours en ligne', 'Online lesson'],
        ['month_pack', 'Pack mensuel', 'Monthly tutoring package'],
      ],
    ),
    g('creative', 'Créatif & pratique', 'Creative & practical',
      [
        ['art', 'Prof d’art', 'Art teacher'],
        ['photo', 'Prof de photo', 'Photography teacher'],
        ['sewing', 'Prof de couture', 'Sewing teacher'],
        ['cooking', 'Prof de cuisine', 'Cooking teacher'],
        ['music_teach', 'Prof de musique', 'Music teacher'],
        ['vocational', 'Formateur pro', 'Vocational-skills instructor'],
      ],
      [
        ['individual', 'Cours individuel', 'Individual lesson'],
        ['group', 'Cours en groupe', 'Group lesson'],
        ['home_lesson', 'Cours à domicile', 'Home lesson'],
      ],
    ),
  ],
  serviceModes: [
    mode('student_home', 'Chez l’élève', 'At the student’s home'),
    mode('my_place', 'Chez moi', 'At my location'),
    mode('online', 'En ligne', 'Online'),
    mode('any', 'Toutes ces options', 'Any of these'),
  ],
};

// ---------- MUSIC ----------
const MUSIC: WorkspaceTypeDef = {
  key: 'music',
  siteviral_type: 'instrumentists',
  emoji: '🎼',
  gradient: 'from-indigo-500 via-blue-600 to-slate-700',
  label: { fr: 'Musiciens & Instrumentistes', en: 'Musicians & Instrumentalists' },
  tagline: { fr: 'Chanteurs, instrumentistes, production…', en: 'Singers, instrumentalists, production…' },
  nameFieldLabel: { fr: 'Nom d’artiste, de scène ou d’activité', en: 'Artist, stage or business name' },
  offersPersonalNameMode: true,
  needsLocation: true,
  specialtiesPrompt: { fr: 'Quel type de musicien êtes-vous ?', en: 'What kind of musician are you?' },
  customerAction: 'quote',
  groups: [
    g('performers', 'Interprètes', 'Performers',
      [
        ['singer', 'Chanteur(se)', 'Singer'],
        ['backup', 'Choriste', 'Backup vocalist'],
        ['rapper', 'Rappeur', 'Rapper'],
        ['choir_singer', 'Chanteur de chorale', 'Choir singer'],
        ['worship', 'Chanteur worship', 'Worship singer'],
        ['live_performer', 'Artiste live', 'Live performer'],
        ['mc', 'MC / animateur événement', 'MC/event host'],
        ['live_band', 'Groupe live', 'Live band'],
        ['dj', 'DJ', 'DJ'],
      ],
      [
        ['wedding_perf', 'Prestation mariage', 'Live wedding performance'],
        ['church_perf', 'Prestation église', 'Church performance'],
        ['dj_event', 'Pack DJ événement', 'DJ event package'],
      ],
    ),
    g('instrumentalists', 'Instrumentistes', 'Instrumentalists',
      [
        ['guitarist', 'Guitariste', 'Guitarist'],
        ['bass', 'Bassiste', 'Bass guitarist'],
        ['pianist', 'Pianiste', 'Pianist'],
        ['keyboard', 'Claviériste', 'Keyboardist'],
        ['drummer', 'Batteur', 'Drummer'],
        ['violinist', 'Violoniste', 'Violinist'],
        ['sax', 'Saxophoniste', 'Saxophonist'],
        ['trumpet', 'Trompettiste', 'Trumpeter'],
        ['percussion', 'Percussionniste', 'Percussionist'],
        ['flutist', 'Flûtiste', 'Flutist'],
        ['traditional', 'Instrumentiste traditionnel', 'Traditional instrumentalist'],
      ],
      [
        ['custom_instrumental', 'Instrumental sur mesure', 'Custom instrumental'],
        ['recording', 'Session studio', 'Recording session'],
      ],
    ),
    g('production', 'Création & production musicale', 'Music creation & production',
      [
        ['producer', 'Producteur musical', 'Music producer'],
        ['beatmaker', 'Beatmaker', 'Beat maker'],
        ['composer', 'Compositeur', 'Composer'],
        ['songwriter', 'Auteur-compositeur', 'Songwriter'],
        ['arranger', 'Arrangeur', 'Music arranger'],
        ['recording_eng', 'Ingénieur du son studio', 'Recording engineer'],
        ['mix_eng', 'Ingénieur mixage', 'Mixing engineer'],
        ['master_eng', 'Ingénieur mastering', 'Mastering engineer'],
        ['live_eng', 'Ingénieur son live', 'Live sound engineer'],
      ],
      [
        ['mix_master', 'Mixage et mastering', 'Mixing and mastering'],
        ['songwriting', 'Composition de chanson', 'Songwriting'],
        ['recording', 'Session studio', 'Recording session'],
      ],
    ),
    g('music_teachers', 'Professeurs de musique', 'Music teachers',
      [
        ['piano_teacher', 'Prof de piano', 'Piano teacher'],
        ['guitar_teacher', 'Prof de guitare', 'Guitar teacher'],
        ['drum_teacher', 'Prof de batterie', 'Drum teacher'],
        ['vocal_coach', 'Coach vocal', 'Vocal coach'],
        ['theory', 'Prof de solfège', 'Music-theory teacher'],
        ['choir_trainer', 'Chef de chorale', 'Choir trainer'],
      ],
      [
        ['instrument_lesson', 'Cours d’instrument', 'Instrument lesson'],
      ],
    ),
  ],
  serviceModes: [
    mode('event_place', 'Sur le lieu de l’événement', 'At the event/customer location'),
    mode('my_studio', 'À mon studio', 'At my studio'),
    mode('online', 'En ligne / à distance', 'Online/remote delivery'),
    mode('multiple', 'Plusieurs options', 'Multiple options'),
  ],
};

// ---------- INFLUENCERS ----------
const INFLUENCERS: WorkspaceTypeDef = {
  key: 'influencers',
  siteviral_type: 'influencers',
  emoji: '📣',
  gradient: 'from-yellow-500 via-orange-500 to-pink-500',
  label: { fr: 'Influenceurs & Créateurs de contenu', en: 'Influencers & Content Creators' },
  tagline: { fr: 'Partenariats, UGC, campagnes…', en: 'Partnerships, UGC, campaigns…' },
  nameFieldLabel: { fr: 'Nom de créateur ou d’agence', en: 'Creator or agency name' },
  offersPersonalNameMode: true,
  needsLocation: false,
  specialtiesPrompt: { fr: 'Quel type de créateur êtes-vous ?', en: 'What kind of creator are you?' },
  customerAction: 'quote',
  groups: [
    g('creator_types', 'Type de créateur', 'Creator type',
      [
        ['social_influencer', 'Influenceur réseaux sociaux', 'Social-media influencer'],
        ['content_creator', 'Créateur de contenu', 'Content creator'],
        ['ugc', 'Créateur UGC', 'UGC creator'],
        ['blogger', 'Blogueur', 'Blogger'],
        ['podcaster', 'Podcasteur', 'Podcaster'],
        ['youtuber', 'YouTubeur', 'YouTuber'],
        ['livestreamer', 'Créateur live', 'Livestream creator'],
        ['brand_ambassador', 'Ambassadeur de marque', 'Brand ambassador'],
        ['affiliate', 'Promoteur affilié', 'Affiliate promoter'],
        ['event_host', 'Animateur d’événement', 'Event host'],
      ],
      [
        ['sponsored_post', 'Post sponsorisé', 'Sponsored post'],
        ['sponsored_video', 'Vidéo sponsorisée', 'Sponsored video'],
        ['review', 'Test produit', 'Product review'],
        ['unboxing', 'Vidéo unboxing', 'Unboxing video'],
        ['story_promo', 'Promotion en story', 'Story promotion'],
        ['brand_mention', 'Mention de marque', 'Brand mention'],
        ['live_promo', 'Promotion en live', 'Livestream promotion'],
        ['event_coverage', 'Couverture d’événement', 'Event coverage'],
        ['event_appearance', 'Apparition événement', 'Event appearance'],
        ['ugc_content', 'Contenu UGC', 'User-generated content'],
        ['ambassador_campaign', 'Campagne ambassadeur', 'Brand-ambassador campaign'],
        ['affiliate_campaign', 'Campagne d’affiliation', 'Affiliate campaign'],
        ['shoutout', 'Shoutout', 'Shoutout'],
        ['multi_pack', 'Pack multi-posts', 'Multi-post campaign package'],
      ],
    ),
    g('niches', 'Niches / audience', 'Audience niches',
      [
        ['beauty_niche', 'Beauté', 'Beauty'],
        ['fashion', 'Mode', 'Fashion'],
        ['food', 'Food', 'Food'],
        ['travel', 'Voyage', 'Travel'],
        ['tech', 'Tech', 'Technology'],
        ['gaming', 'Gaming', 'Gaming'],
        ['finance', 'Finance', 'Finance'],
        ['education_niche', 'Éducation', 'Education'],
        ['parenting', 'Parentalité', 'Parenting'],
        ['faith', 'Foi', 'Faith'],
        ['entertainment', 'Divertissement', 'Entertainment'],
        ['music_niche', 'Musique', 'Music'],
        ['sports_niche', 'Sport', 'Sports'],
        ['fitness_niche', 'Fitness', 'Fitness'],
        ['business_niche', 'Business', 'Business'],
        ['lifestyle', 'Lifestyle', 'Lifestyle'],
        ['local', 'Communauté locale', 'Local community'],
      ],
      [],
    ),
  ],
  serviceModes: [
    mode('remote', 'Campagne en ligne', 'Online/remote campaign'),
    mode('in_person', 'Événement / présence physique', 'In-person event/appearance'),
    mode('both', 'Les deux', 'Both'),
  ],
};

// ---------- DIGITAL PRODUCTS ----------
const DIGITAL: WorkspaceTypeDef = {
  key: 'digital',
  siteviral_type: 'digital_products',
  emoji: '🛒',
  gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
  label: { fr: 'Produits digitaux', en: 'Digital Products' },
  tagline: { fr: 'Ebooks, formations, templates…', en: 'Ebooks, courses, templates…' },
  nameFieldLabel: { fr: 'Nom de votre boutique', en: 'Store name' },
  offersPersonalNameMode: false,
  needsLocation: false,
  specialtiesPrompt: { fr: '', en: '' },
  customerAction: 'buy',
  groups: [], // handled by the dedicated /create-org flow
  serviceModes: [],
};

// ---------- OTHER SERVICES ----------
const OTHER: WorkspaceTypeDef = {
  key: 'other',
  siteviral_type: 'services',
  emoji: '💼',
  gradient: 'from-slate-700 via-slate-800 to-slate-900',
  label: { fr: 'Autres services', en: 'Other Services' },
  tagline: { fr: 'Photo, vidéo, dev, marketing, admin…', en: 'Photo, video, dev, marketing, admin…' },
  nameFieldLabel: { fr: 'Nom professionnel ou de l’entreprise', en: 'Business or professional name' },
  offersPersonalNameMode: true,
  needsLocation: true,
  specialtiesPrompt: { fr: 'Quel service proposez-vous ?', en: 'What service do you offer?' },
  customerAction: 'quote',
  groups: [
    g('other_professions', 'Professions suggérées', 'Suggested professions',
      [
        ['photographer', 'Photographe', 'Photographer'],
        ['videographer', 'Vidéaste', 'Videographer'],
        ['graphic_designer', 'Graphiste', 'Graphic designer'],
        ['web_dev', 'Développeur web', 'Web developer'],
        ['app_dev', 'Développeur d’applications', 'App developer'],
        ['sm_manager', 'Community manager', 'Social-media manager'],
        ['digital_marketer', 'Marketeur digital', 'Digital marketer'],
        ['writer', 'Rédacteur', 'Writer'],
        ['editor', 'Correcteur / éditeur', 'Editor'],
        ['translator', 'Traducteur', 'Translator'],
        ['voice_over', 'Voix off', 'Voice-over artist'],
        ['va', 'Assistant virtuel', 'Virtual assistant'],
        ['data_entry', 'Saisie de données', 'Data-entry provider'],
        ['bookkeeper', 'Aide-comptable', 'Bookkeeper'],
        ['biz_consultant', 'Consultant business', 'Business consultant'],
        ['admin_assistant', 'Assistant administratif', 'Administrative assistant'],
        ['caterer', 'Traiteur', 'Caterer'],
        ['event_decorator', 'Décorateur d’événement', 'Event decorator'],
        ['travel_planner', 'Organisateur de voyage', 'Travel planner'],
        ['personal_shopper', 'Personal shopper', 'Personal shopper'],
        ['delivery', 'Livreur', 'Delivery provider'],
        ['printing', 'Imprimerie', 'Printing provider'],
      ],
      [],
    ),
  ],
  serviceModes: [
    mode('my_place', 'À mon local', 'At my location'),
    mode('customer_place', 'Chez le client', 'At the customer’s location'),
    mode('online', 'En ligne', 'Online'),
    mode('multiple', 'Plusieurs options', 'Multiple options'),
  ],
};

export const WORKSPACE_TYPES: WorkspaceTypeDef[] = [
  DIGITAL,
  ARTISANS,
  BEAUTY,
  SPORT,
  TUTORS,
  MUSIC,
  INFLUENCERS,
  OTHER,
];

export const getWorkspaceType = (key: string | null | undefined): WorkspaceTypeDef | null =>
  WORKSPACE_TYPES.find((w) => w.key === key) ?? null;

/** Flatten all specialties for a type with alias-based search. */
export interface SpecialtyRow {
  groupKey: string;
  groupLabel: Bilingual;
  key: string;
  label: Bilingual;
  aliases: string[];
}

export function flattenSpecialties(type: WorkspaceTypeDef): SpecialtyRow[] {
  const out: SpecialtyRow[] = [];
  for (const g of type.groups) {
    for (const s of g.specialties) {
      out.push({
        groupKey: g.key,
        groupLabel: g.label,
        key: `${g.key}:${s.key}`,
        label: s.label,
        aliases: s.aliases ?? [],
      });
    }
  }
  return out;
}

/** All suggested services across the groups that match selected specialties. */
export function suggestedServicesFor(
  type: WorkspaceTypeDef,
  selectedSpecialtyKeys: string[],
): { key: string; label: Bilingual }[] {
  const groupsInvolved = new Set(selectedSpecialtyKeys.map((k) => k.split(':')[0]));
  const out: { key: string; label: Bilingual }[] = [];
  const seen = new Set<string>();
  for (const g of type.groups) {
    if (!groupsInvolved.has(g.key)) continue;
    for (const s of g.suggestedServices) {
      const key = `${g.key}:${s.key}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ key, label: s.label });
    }
  }
  return out;
}

export const MAX_SPECIALTIES = 5;
