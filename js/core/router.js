/** Routeur par hash : #/chemin?cle=valeur. Chaque route fournit render(ctx) -> { html, mount?, destroy?, title }. */
let current = null;
const routes = [];

export const route = (pattern, loader) => {
  const keys = []; const re = new RegExp('^' + pattern.replace(/:([a-z]+)/g, (_, k) => (keys.push(k), '([^/]+)')) + '$');
  routes.push({ re, keys, loader });
};
export function parseHash() {
  const raw = location.hash.slice(1) || '/';
  const [path, qs = ''] = raw.split('?');
  return { path: decodeURI(path), query: Object.fromEntries(new URLSearchParams(qs)) };
}
export const href = (path, query = {}) => {
  const qs = new URLSearchParams(Object.entries(query).filter(([, v]) => v !== '' && v != null && v !== false)).toString();
  return `#${path}${qs ? '?' + qs : ''}`;
};
/** Met à jour la requête de l'adresse sans recharger la page (filtres partagés par lien). */
export function replaceQuery(query) {
  const { path } = parseHash();
  history.replaceState(null, '', href(path, query));
}
export function navigate(path, query) { location.hash = href(path, query); }

export async function start(outlet, onChange) {
  const go = async () => {
    const { path, query } = parseHash();
    current?.destroy?.(); current = null;
    for (const r of routes) {
      const m = r.re.exec(path); if (!m) continue;
      const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
      outlet.innerHTML = '<div class="wrap" style="padding-top:48px"><div class="skel" style="height:40px;width:40%"></div><div class="skel" style="height:320px;margin-top:24px"></div></div>';
      try {
        const page = await (await r.loader()).default({ params, query });
        current = page;
        outlet.innerHTML = page.html;
        outlet.firstElementChild?.classList.add('fade-in');
        document.title = page.title ? `${page.title} · Master Lab` : 'Master Lab';
        page.mount?.(outlet);
      } catch (e) {
        console.error(e);
        outlet.innerHTML = `<div class="wrap" style="padding-top:48px"><div class="state err" role="alert"><h2>Impossible d'afficher cette page</h2><p>${String(e.message || e).replace(/</g, '&lt;')}</p><p><button class="btn" onclick="location.reload()">Réessayer</button></p></div></div>`;
      }
      onChange?.(path); window.scrollTo(0, 0); outlet.focus({ preventScroll: true });
      return;
    }
    outlet.innerHTML = '<div class="wrap" style="padding-top:48px"><div class="state"><h2>Page introuvable</h2><p><a href="#/">Retour à l\'accueil</a></p></div></div>';
    onChange?.(path);
  };
  window.addEventListener('hashchange', go);
  await go();
}
