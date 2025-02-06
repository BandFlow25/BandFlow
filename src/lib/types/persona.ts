export type PersonaType = 'band' | 'giggoer' | 'venue' | 'studio' | 'agent';

export interface Feature {
  title: string;
  description: string;
}

export interface PersonaColors {
  icon: {
    bg: string;
    text: string;
  };
  logo: string;
  button: {
    bg: string;
    hover: string;
  };
}

export interface Persona {
  id: PersonaType;
  title: string;
  colors: PersonaColors;
  tagline: string;
  features: Feature[];
}