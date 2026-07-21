import type { GameSlug } from "@/types/domain";
import type { PlayingCardVariant } from "@/components/ui";

// Card-face assignment for each game mode. Typography and colour are the
// imagery — no emoji, no icon-above-title layouts. Kept deterministic and
// original (no copied brand assignments).
export interface GameCardStyle {
  variant: PlayingCardVariant;
  // Large stacked display title, one array item per line.
  titolo: string[];
  rotate: 0 | 1 | 2 | 3 | 4;
}

export const CARD_STYLE: Record<GameSlug, GameCardStyle> = {
  impostore: { variant: "red-outline", titolo: ["L’IM-", "POSTORE"], rotate: 1 },
  "chi-e-piu-probabile": { variant: "sky", titolo: ["CHI È PIÙ", "PROBABILE?"], rotate: 3 },
  "obbligo-o-verita": { variant: "lemon", titolo: ["OBBLIGO", "O VERITÀ?"], rotate: 0 },
  preferiresti: { variant: "violet-outline", titolo: ["PREFE-", "RIRESTI?"], rotate: 4 },
  "non-ho-mai": { variant: "mint", titolo: ["NON HO", "MAI…"], rotate: 2 },
  sfide: { variant: "tangerine", titolo: ["SFIDE"], rotate: 1 },
  categorie: { variant: "cobalt", titolo: ["CATE-", "GORIE"], rotate: 3 },
  "indovina-chi": { variant: "lavender", titolo: ["INDOVINA", "CHI"], rotate: 0 },
  "parola-proibita": { variant: "violet-outline", titolo: ["PAROLA", "PROIBITA"], rotate: 2 },
  "indovina-la-parola": { variant: "tangerine", titolo: ["INDOVINA", "LA PAROLA"], rotate: 4 },
};
