/**
 * Pre-filled content templates for quick product & campaign creation.
 * Leaders can pick a template instead of starting from a blank page.
 */

export interface ProductTemplate {
  id: string;
  label: string;
  emoji: string;
  description: string;
  category: string;
  fields: {
    title: string;
    description: string;
    product_type: string;
    price: number;
    is_free: boolean;
    guarantee_text?: string;
  };
}

export interface CampaignTemplate {
  id: string;
  label: string;
  emoji: string;
  description: string;
  fields: {
    title: string;
    description: string;
    goal_amount: number;
  };
}

export const productTemplates: ProductTemplate[] = [
  {
    id: 'free-guide',
    label: 'Guide gratuit (Lead Magnet)',
    emoji: '🎁',
    description: 'Un PDF gratuit pour attirer de nouveaux contacts et construire votre liste.',
    category: 'Acquisition',
    fields: {
      title: 'Guide gratuit : [Votre sujet]',
      description: 'Téléchargez ce guide exclusif pour découvrir les clés de [votre sujet]. Contenu pratique et actionnable, rédigé par des experts.\n\n✅ Accès immédiat après inscription\n✅ Format PDF, lisible sur tous les appareils\n✅ Conseils concrets et applicables dès maintenant',
      product_type: 'pdf',
      price: 0,
      is_free: true,
    },
  },
  {
    id: 'ebook',
    label: 'eBook premium',
    emoji: '📘',
    description: 'Un livre numérique complet vendu à votre audience.',
    category: 'Vente',
    fields: {
      title: '[Titre de votre eBook]',
      description: 'Un livre numérique complet de [X] pages qui vous guide pas à pas pour [objectif].\n\n📖 Ce que vous allez apprendre :\n• [Point clé 1]\n• [Point clé 2]\n• [Point clé 3]\n\n🎯 Pour qui ?\nCe livre est fait pour vous si vous êtes [cible] et que vous souhaitez [résultat attendu].',
      product_type: 'ebook',
      price: 5000,
      is_free: false,
      guarantee_text: 'Satisfait ou remboursé sous 7 jours.',
    },
  },
  {
    id: 'video-training',
    label: 'Formation vidéo',
    emoji: '🎥',
    description: 'Un cours vidéo structuré pour enseigner une compétence.',
    category: 'Formation',
    fields: {
      title: 'Formation : [Nom de la formation]',
      description: 'Maîtrisez [compétence] grâce à cette formation vidéo complète.\n\n🎬 Contenu de la formation :\n• Module 1 : [Titre] — Les fondamentaux\n• Module 2 : [Titre] — Mise en pratique\n• Module 3 : [Titre] — Stratégies avancées\n\n⏱ Durée totale : environ [X] heures\n📱 Accessible sur mobile, tablette et ordinateur',
      product_type: 'video',
      price: 15000,
      is_free: false,
      guarantee_text: 'Accès à vie. Satisfait ou remboursé sous 14 jours.',
    },
  },
  {
    id: 'audio-series',
    label: 'Série audio / Podcast',
    emoji: '🎙️',
    description: 'Du contenu audio (prédications, enseignements, podcasts).',
    category: 'Contenu',
    fields: {
      title: '[Série audio] — [Thème]',
      description: 'Écoutez cette série de [X] épisodes sur le thème de [sujet].\n\n🎧 Idéal pour écouter en déplacement\n📲 Téléchargement direct sur votre appareil\n🔄 Nouveaux épisodes ajoutés régulièrement',
      product_type: 'audio',
      price: 3000,
      is_free: false,
    },
  },
  {
    id: 'toolkit',
    label: 'Kit de ressources',
    emoji: '🧰',
    description: 'Un pack de fichiers utiles (templates, checklists, outils).',
    category: 'Outils',
    fields: {
      title: 'Kit complet : [Nom du kit]',
      description: 'Tout ce dont vous avez besoin pour [objectif] réuni dans un seul pack.\n\n📦 Ce kit contient :\n• [X] templates prêts à l\'emploi\n• [X] checklists détaillées\n• [X] guides pratiques\n• Bonus : [bonus]\n\n💡 Gagnez des heures de travail avec ces ressources professionnelles.',
      product_type: 'pdf',
      price: 7500,
      is_free: false,
    },
  },
  {
    id: 'masterclass',
    label: 'Masterclass en ligne',
    emoji: '🏆',
    description: 'Un cours premium approfondi avec certificat.',
    category: 'Formation',
    fields: {
      title: 'Masterclass : [Sujet]',
      description: 'Une masterclass exclusive animée par [Expert/Organisation] pour devenir expert en [domaine].\n\n🏅 Ce que vous obtenez :\n• [X] heures de contenu vidéo HD\n• Supports de cours téléchargeables\n• Exercices pratiques\n• Certificat de complétion\n\n🎯 Résultat garanti : à la fin de cette masterclass, vous saurez [compétence].',
      product_type: 'course',
      price: 25000,
      is_free: false,
      guarantee_text: 'Accès à vie + certificat inclus. Remboursement possible sous 30 jours.',
    },
  },
  {
    id: 'devotional',
    label: 'Dévotionnel / Méditations',
    emoji: '🙏',
    description: 'Un recueil de méditations ou réflexions spirituelles.',
    category: 'Spiritualité',
    fields: {
      title: '[X] jours de méditations — [Thème]',
      description: 'Un parcours spirituel de [X] jours pour approfondir votre relation avec Dieu sur le thème de [sujet].\n\n📅 Chaque jour comprend :\n• Un verset clé\n• Une méditation guidée\n• Une prière\n• Un défi pratique\n\n❤️ Parfait pour votre temps personnel quotidien.',
      product_type: 'pdf',
      price: 2000,
      is_free: false,
    },
  },
  {
    id: 'conference-replay',
    label: 'Replay de conférence',
    emoji: '📡',
    description: 'Le replay vidéo d\'un événement ou d\'une conférence passée.',
    category: 'Événement',
    fields: {
      title: 'Replay : [Nom de l\'événement]',
      description: 'Revivez les moments forts de [événement] avec ce replay complet en haute qualité.\n\n🎬 Inclus dans ce replay :\n• Toutes les sessions principales\n• Les moments de louange\n• Les questions-réponses\n\n⏱ Durée : environ [X] heures\n📱 Regardez quand vous voulez, où vous voulez.',
      product_type: 'video',
      price: 5000,
      is_free: false,
    },
  },
];

export const campaignTemplates: CampaignTemplate[] = [
  {
    id: 'general-fund',
    label: 'Soutien général',
    emoji: '❤️',
    description: 'Collecte de fonds pour le fonctionnement de votre organisation.',
    fields: {
      title: 'Soutenez [Nom de l\'organisation]',
      description: 'Votre don permet à [organisation] de continuer sa mission. Chaque contribution compte et fait la différence.\n\n💡 À quoi servent vos dons :\n• [Utilisation 1]\n• [Utilisation 2]\n• [Utilisation 3]\n\nMerci pour votre générosité ! 🙏',
      goal_amount: 500000,
    },
  },
  {
    id: 'project-fund',
    label: 'Projet spécifique',
    emoji: '🏗️',
    description: 'Financement d\'un projet précis avec un objectif clair.',
    fields: {
      title: 'Projet : [Nom du projet]',
      description: 'Aidez-nous à réaliser [projet] ! Nous avons besoin de votre soutien pour atteindre notre objectif.\n\n🎯 Objectif du projet :\n[Description détaillée du projet]\n\n📊 Comment seront utilisés les fonds :\n• [X]% — [Poste de dépense 1]\n• [X]% — [Poste de dépense 2]\n• [X]% — [Poste de dépense 3]\n\nChaque donateur recevra des nouvelles régulières sur l\'avancement du projet.',
      goal_amount: 2000000,
    },
  },
  {
    id: 'emergency',
    label: 'Urgence / Aide humanitaire',
    emoji: '🆘',
    description: 'Collecte d\'urgence pour une situation critique.',
    fields: {
      title: '🆘 Aide urgente : [Situation]',
      description: 'Situation d\'urgence ! [Organisation] lance un appel pour [situation].\n\n⚡ Pourquoi c\'est urgent :\n[Explication de la situation]\n\n🤝 Comment votre don aide :\n• [Impact concret 1]\n• [Impact concret 2]\n\nChaque seconde compte. Faisons la différence ensemble !',
      goal_amount: 1000000,
    },
  },
  {
    id: 'scholarship',
    label: 'Bourses & Formation',
    emoji: '🎓',
    description: 'Financer des bourses d\'études ou des formations.',
    fields: {
      title: 'Bourse : [Nom du programme]',
      description: 'Offrons l\'accès à l\'éducation et la formation à ceux qui en ont le plus besoin.\n\n🎓 Ce programme permet de :\n• Financer [X] bourses d\'études\n• Couvrir les frais de formation de [X] personnes\n• Fournir le matériel nécessaire\n\n📈 Impact prévu : [X] personnes formées d\'ici [date].',
      goal_amount: 3000000,
    },
  },
];
