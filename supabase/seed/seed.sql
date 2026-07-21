-- Idempotent seed for Giallo-Aria. Safe to run multiple times (ON CONFLICT).
-- Categories used across the impostor + question modes.

insert into categories (slug, nome, icona, game_types, ordine) values
  ('animali', 'Animali', '🐾', array['impostore'], 1),
  ('cibo', 'Cibo', '🍕', array['impostore'], 2),
  ('luoghi', 'Luoghi', '🗺️', array['impostore'], 3),
  ('professioni', 'Professioni', '👩‍⚕️', array['impostore'], 4),
  ('film-serie', 'Film e serie', '🎬', array['impostore'], 5),
  ('oggetti', 'Oggetti', '📦', array['impostore'], 6),
  ('sport', 'Sport', '⚽', array['impostore'], 7),
  ('tecnologia', 'Tecnologia', '💻', array['impostore'], 8),
  ('musica', 'Musica', '🎸', array['impostore'], 9),
  ('viaggi', 'Viaggi', '✈️', array['impostore'], 10),
  ('scuola', 'Scuola', '🎒', array['impostore'], 11),
  ('personaggi', 'Personaggi famosi', '⭐', array['impostore'], 12)
on conflict (slug) do update
  set nome = excluded.nome, icona = excluded.icona,
      game_types = excluded.game_types, ordine = excluded.ordine;

-- Categories for Obbligo o Verità.
insert into categories (slug, nome, icona, game_types, ordine) values
  ('ov-divertente', 'Divertente', '😄', array['obbligo-o-verita'], 20),
  ('ov-personale', 'Personale', '💭', array['obbligo-o-verita'], 21),
  ('ov-amicizia', 'Amicizia', '🤝', array['obbligo-o-verita'], 22),
  ('ov-scuola', 'Scuola', '🎒', array['obbligo-o-verita'], 23),
  ('ov-relazioni', 'Relazioni', '💞', array['obbligo-o-verita'], 24),
  ('ov-creativita', 'Creatività', '🎨', array['obbligo-o-verita'], 25),
  ('ov-recitazione', 'Recitazione', '🎭', array['obbligo-o-verita'], 26),
  ('ov-movimento', 'Movimento', '🕺', array['obbligo-o-verita'], 27),
  ('ov-imbarazzante', 'Imbarazzante', '😳', array['obbligo-o-verita'], 28),
  ('ov-conoscersi', 'Conoscersi meglio', '🔎', array['obbligo-o-verita'], 29),
  ('ov-gruppo', 'Gruppo', '👥', array['obbligo-o-verita'], 30),
  ('ov-coppie', 'Coppie', '💑', array['obbligo-o-verita'], 31),
  ('ov-famiglia', 'Famiglia', '🏠', array['obbligo-o-verita'], 32)
on conflict (slug) do update
  set nome = excluded.nome, icona = excluded.icona,
      game_types = excluded.game_types, ordine = excluded.ordine;

-- Categories for Indovina la parola.
insert into categories (slug, nome, icona, game_types, ordine) values
  ('gtw-animali', 'Animali', '🐾', array['indovina-la-parola'], 40),
  ('gtw-cibo', 'Cibo', '🍕', array['indovina-la-parola'], 41),
  ('gtw-luoghi', 'Luoghi', '🗺️', array['indovina-la-parola'], 42),
  ('gtw-professioni', 'Professioni', '👩‍⚕️', array['indovina-la-parola'], 43),
  ('gtw-oggetti', 'Oggetti', '📦', array['indovina-la-parola'], 44),
  ('gtw-sport', 'Sport', '⚽', array['indovina-la-parola'], 45),
  ('gtw-tecnologia', 'Tecnologia', '💻', array['indovina-la-parola'], 46),
  ('gtw-musica', 'Musica', '🎸', array['indovina-la-parola'], 47),
  ('gtw-film-serie', 'Film e serie', '🎬', array['indovina-la-parola'], 48),
  ('gtw-viaggi', 'Viaggi', '✈️', array['indovina-la-parola'], 49),
  ('gtw-scuola', 'Scuola', '🎒', array['indovina-la-parola'], 50),
  ('gtw-natura', 'Natura', '🌿', array['indovina-la-parola'], 51),
  ('gtw-azioni', 'Azioni', '🏃', array['indovina-la-parola'], 52),
  ('gtw-personaggi', 'Personaggi', '🎭', array['indovina-la-parola'], 53),
  ('gtw-casa', 'Casa', '🏠', array['indovina-la-parola'], 54),
  ('gtw-corpo', 'Corpo umano', '🖐️', array['indovina-la-parola'], 55)
on conflict (slug) do update
  set nome = excluded.nome, icona = excluded.icona,
      game_types = excluded.game_types, ordine = excluded.ordine;

-- The full official Italian content set is bundled in the app under
-- src/features/content/*.ts so that local gameplay works with zero network.
-- Run `npm run db:seed` to load that same content into game_content
-- (idempotent on a natural key) when you want the backend / admin tools to
-- manage it. See docs/SUPABASE_SETUP.md § 44.8.
