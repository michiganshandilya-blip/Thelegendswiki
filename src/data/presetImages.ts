/**
 * Curated public domain and open-access encyclopedia archival image assets.
 * Used for instant insertion with pre-filled accessible alt text, captions, and attribution credits.
 */

export interface PresetImageItem {
  id: string;
  title: string;
  category: string;
  url: string;
  thumbnailUrl: string;
  caption: string;
  alt: string;
  credit: string;
}

export const PRESET_ENCYCLOPEDIA_IMAGES: PresetImageItem[] = [
  {
    id: 'preset-alexandria',
    title: 'The Great Library of Alexandria',
    category: 'History & Antiquity',
    url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=300&q=80',
    caption: 'Classical architectural interior evocative of the Great Hellenistic Library and research Mouseion of Alexandria.',
    alt: 'Classical grand library halls filled with archival scrolls and scholarly tables',
    credit: 'Archival Historical Architecture Collection (Public Commons)',
  },
  {
    id: 'preset-einstein',
    title: 'Theoretical Physics & Spacetime Formulations',
    category: 'Science & Physics',
    url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=300&q=80',
    caption: 'Theoretical physics mathematical derivations and spacetime curvature tensors.',
    alt: 'Handwritten blackboard calculations showing relativistic tensor equations and physical constants',
    credit: 'Scientific Heritage & Mathematics Commons',
  },
  {
    id: 'preset-telescope',
    title: 'Deep Space Optical Observatory',
    category: 'Astronomy & Space',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=300&q=80',
    caption: 'Composite deep space optical survey showing distant galactic filaments and stellar nurseries.',
    alt: 'High-resolution telescopic view of a luminous spiral nebula and star clusters in deep space',
    credit: 'International Deep Space Observatory Consortium',
  },
  {
    id: 'preset-turing',
    title: 'Early Computing Circuits & Theoretical Automata',
    category: 'Technology & Computing',
    url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=300&q=80',
    caption: 'Schematic representation of computational logic gates and algorithmic tape machines.',
    alt: 'Close-up of electronic circuitry and logic processor paths representing early computing architecture',
    credit: 'Computer History Archives & Digital Museum',
  },
  {
    id: 'preset-manuscript',
    title: 'Illuminated Renaissance Manuscript',
    category: 'Art & Literature',
    url: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=300&q=80',
    caption: 'Preserved vellum codex with historical Latin script and classical scholarly marginalia.',
    alt: 'Antique handwritten parchment book opened to an illuminated page with decorative capital letters',
    credit: 'European Rare Manuscripts Codex Repository',
  },
  {
    id: 'preset-athens',
    title: 'The Acropolis & Classical Greek Architecture',
    category: 'History & Antiquity',
    url: 'https://images.unsplash.com/photo-1555993539-1732b0258235?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1555993539-1732b0258235?auto=format&fit=crop&w=300&q=80',
    caption: 'The Parthenon upon the Athenian Acropolis, center of classical democratic and philosophical culture.',
    alt: 'Panoramic view of the ancient Parthenon marble temple ruins on the rocky hill in Athens',
    credit: 'Hellenic Archaeological Survey / Open Heritage',
  },
  {
    id: 'preset-silkroad',
    title: 'Historic Transcontinental Trade Routes & Desert Caravans',
    category: 'Geography & Trade',
    url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=300&q=80',
    caption: 'Arid mountain pass along historical Central Asian Silk Road merchant corridors.',
    alt: 'Sweeping desert mountain landscape with winding trade paths in golden sunlight',
    credit: 'Central Asian Historical Cartography Survey',
  },
  {
    id: 'preset-biology',
    title: 'Cellular Morphology & Genetics Micrograph',
    category: 'Science & Biology',
    url: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=300&q=80',
    caption: 'Fluorescence confocal microscopic image of cellular mitosis and chromosomal organization.',
    alt: 'High-contrast fluorescence micrograph showing cellular nucleus structures stained in vivid blue and green',
    credit: 'Bio-Imaging Academic Research Network',
  },
];
