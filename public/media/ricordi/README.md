# Ricordi statici

Metti qui i file multimediali usati dalla pagina `/ricordi`.

- `images/` contiene le foto fisse richiamate in `src/features/memories/data/memory-media.ts`
- `videos/` contiene i file video statici locali
- `posters/` contiene le immagini poster dei video
- `tracks/` contiene eventuali sottotitoli `.vtt`

Attenzione: tutto quello che sta in `public/` resta raggiungibile pubblicamente tramite URL.
Le note private restano protette da Supabase RLS, ma foto e video statici non sono davvero privati.
