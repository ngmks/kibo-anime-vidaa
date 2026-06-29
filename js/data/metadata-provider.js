/* ============================================================
   metadata-provider.js — métadonnées d'anime (catalogue/recherche)
   Source par défaut : AniList GraphQL (gratuit, sans clé, CORS OK).
   ------------------------------------------------------------
   Toutes les fonctions renvoient des objets `anime` NORMALISÉS :
     { id, title, poster, banner, description, episodes, genres, score, year, status }
   => les vues ne dépendent jamais du schéma brut d'AniList.
   Pour changer de source (ex. Jikan/MAL), réimplémenter ce module
   en conservant la même forme de sortie.
   ============================================================ */

const ENDPOINT = "https://graphql.anilist.co";

const MEDIA_FIELDS = `
  id
  title { romaji english }
  coverImage { large }
  bannerImage
  description(asHtml: false)
  episodes
  genres
  averageScore
  seasonYear
  status
`;

function normalize(m) {
  if (!m) return null;
  return {
    id: m.id,
    title: m.title?.english || m.title?.romaji || "Sans titre",
    poster: m.coverImage?.large || "",
    banner: m.bannerImage || "",
    description: (m.description || "").replace(/<[^>]+>/g, "").trim(),
    episodes: m.episodes || 0,
    genres: m.genres || [],
    score: m.averageScore || null,
    year: m.seasonYear || null,
    status: m.status || null,
  };
}

async function gql(query, variables = {}) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error("AniList HTTP " + res.status);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0]?.message || "AniList error");
  return json.data;
}

/** Saison AniList courante d'après la date du jour. */
function currentSeason() {
  const now = new Date();
  const m = now.getMonth(); // 0-11
  const season = m <= 1 || m === 11 ? "WINTER" : m <= 4 ? "SPRING" : m <= 7 ? "SUMMER" : "FALL";
  const year = m === 11 ? now.getFullYear() + 1 : now.getFullYear();
  return { season, year };
}

/* ---------- API publique ---------- */

export async function trending(perPage = 20) {
  const data = await gql(
    `query ($n:Int){ Page(perPage:$n){ media(sort:TRENDING_DESC, type:ANIME){ ${MEDIA_FIELDS} } } }`,
    { n: perPage }
  );
  return data.Page.media.map(normalize);
}

export async function seasonal(perPage = 20) {
  const { season, year } = currentSeason();
  const data = await gql(
    `query ($n:Int,$s:MediaSeason,$y:Int){
       Page(perPage:$n){ media(season:$s, seasonYear:$y, sort:POPULARITY_DESC, type:ANIME){ ${MEDIA_FIELDS} } } }`,
    { n: perPage, s: season, y: year }
  );
  return data.Page.media.map(normalize);
}

export async function popular(perPage = 20) {
  const data = await gql(
    `query ($n:Int){ Page(perPage:$n){ media(sort:POPULARITY_DESC, type:ANIME){ ${MEDIA_FIELDS} } } }`,
    { n: perPage }
  );
  return data.Page.media.map(normalize);
}

export async function search(q, perPage = 24) {
  if (!q || !q.trim()) return [];
  const data = await gql(
    `query ($q:String,$n:Int){ Page(perPage:$n){ media(search:$q, type:ANIME, sort:SEARCH_MATCH){ ${MEDIA_FIELDS} } } }`,
    { q: q.trim(), n: perPage }
  );
  return data.Page.media.map(normalize);
}

export async function details(id) {
  const data = await gql(
    `query ($id:Int){ Media(id:$id, type:ANIME){ ${MEDIA_FIELDS} } }`,
    { id: Number(id) }
  );
  return normalize(data.Media);
}

/**
 * Liste des épisodes. AniList ne fournit pas toujours un détail par épisode :
 * on dérive [1..N] depuis le champ `episodes`. Si inconnu, on renvoie 1 épisode
 * (l'utilisateur ajustera selon sa source via le SourceProvider).
 */
export async function episodes(id) {
  const a = await details(id);
  const n = a.episodes && a.episodes > 0 ? a.episodes : 1;
  return Array.from({ length: n }, (_, i) => ({ number: i + 1, title: `Épisode ${i + 1}` }));
}
