export interface Item {
  id: string;

  // Display name = auto-generated from [color] [modifier] [type]
  type: string;
  color?: string;
  modifier?: string;

  // Hidden metadata
  brand?: string;
  size?: string;
  notes?: string;

  // Classification
  category: 'tops' | 'bottoms' | 'shoes' | 'outerwear' | 'accessories' | 'hats';
  status: 'owned' | 'packed' | 'wishlist' | 'retired';
  tags?: string[];

  image?: string;

  // Legacy — kept for backward compat, auto-generated from structured fields
  name?: string;
}

export interface Outfit {
  id: string;
  date: string;
  image: string;
  description: string;
  items: string[]; // item IDs
  location?: string;
}

export interface VoteTally {
  outfit_id: string;
  hot: number;
  not: number;
  total: number;
  hot_rate: number;
}

export interface ItemStats {
  item_id: string;
  name: string;
  category: string;
  appearances: number;
  hot_rate: number;
}

export interface ItemPairSynergy {
  item_a: string;
  item_b: string;
  name_a: string;
  name_b: string;
  hot_rate_together: number;
  hot_rate_avg_apart: number;
  synergy: number; // positive = better together, negative = clash
  appearances: number;
}
