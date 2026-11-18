/** Point d'entrée : en-tête, routes, favoris et comparateur globaux. */
import { route, start, href } from './core/router.js';
import { $, $$, on, toast } from './core/dom.js';
import { toggleFavori, toggleComparaison, favoris, comparaison, subscribe } from './core/store.js';

route('/', () => import('./pages/home.js'));
route('/formations', () => import('./pages/formations.js'));
route('/formation/:ifc', () => import('./pages/formation.js'));
route('/carte', () => import('./pages/carte.js'));
route('/statistiques', () => import('./pages/stats.js'));
route('/insertion', () => import('./pages/insertion.js'));
route('/comparer', () => import('./pages/comparer.js'));
route('/guide', () => import('./pages/guide.js'));
route('/methode', () => import('./pages/methode.js'));

const NAV = [['/formations', 'Formations'], ['/carte', 'Carte'], ['/statistiques', 'Candidatures'], ['/insertion', 'Insertion'], ['/comparer', 'Comparateur'], ['/guide', 'Guide'], ['/methode', 'Méthode']];

function renderHeader(path) {
  const cur = '/' + (path.split('/')[1] ?? '');
  const n = comparaison().length;
  $('#nav').innerHTML = NAV.map(([p, l]) => `<a href="${href(p)}"${p === cur || (p === '/formations' && cur === '/formation') ? ' aria-current="page"' : ''}>${l}${p === '/comparer' && n ? `<span class="fav-count" aria-label="${n} formation(s) à comparer">${n}</span>` : ''}</a>`).join('');
  $('#nav').classList.remove('open'); $('#burger').setAttribute('aria-expanded', 'false');
}

/** Met à jour l'état visuel de tous les boutons favori / comparer présents. */
function syncButtons() {
  const fav = new Set(favoris()), cmp = new Set(comparaison());
  $$('[data-fav]').forEach((b) => { const o = fav.has(b.dataset.fav); b.setAttribute('aria-pressed', o); b.textContent = o ? '♥ Favori' : '♡ Favori'; });
  $$('[data-cmp]').forEach((b) => { const o = cmp.has(b.dataset.cmp); b.setAttribute('aria-pressed', o); b.textContent = o ? '✓ Comparé' : 'Comparer'; });
}

let lastPath = '/';
subscribe(() => { renderHeader(lastPath); syncButtons(); });
on(document, 'click', '[data-fav]', (e, b) => toast(toggleFavori(b.dataset.fav) ? 'Ajouté aux favoris (enregistré dans ce navigateur)' : 'Retiré des favoris'));
on(document, 'click', '[data-cmp]', (e, b) => {
  const r = toggleComparaison(b.dataset.cmp);
  toast({ added: 'Ajouté au comparateur', removed: 'Retiré du comparateur', full: '3 formations au maximum dans le comparateur' }[r]);
});
$('#burger').addEventListener('click', (e) => { const o = $('#nav').classList.toggle('open'); e.currentTarget.setAttribute('aria-expanded', o); });

if (typeof echarts === 'undefined') {
  $('#app').innerHTML = '<div class="wrap" style="padding-top:48px"><div class="state err" role="alert"><h2>La bibliothèque de graphiques n’a pas pu se charger</h2><p>Rechargez la page. Si le problème continue, vérifiez que le dossier <code>vendor/</code> est présent.</p></div></div>';
} else {
  start($('#app'), (p) => { lastPath = p; renderHeader(p); syncButtons(); });
}
