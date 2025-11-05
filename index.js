// script.js (usar type="module" en index.html)
const API_RANDOM = 'https://thesimpsonsapi.com/api/characters/random';
const GALERIA = document.getElementById('galeria');
const LOADER = document.getElementById('loader');
const ERROR = document.getElementById('error');
const BTN_CARGAR = document.getElementById('cargar');
const INPUT_FILTRO = document.getElementById('filtro');
const BTN_VER_FAV = document.getElementById('ver-favoritos');
const TEMPLATE = document.getElementById('card-template');

let personajes = []; // arreglo actual mostrado
let mostrandoFavoritos = false;

function showLoader(show = true) {
  LOADER.classList.toggle('oculto', !show);
}

function showError(msg = '') {
  if (!msg) {
    ERROR.classList.add('oculto');
    ERROR.textContent = '';
    return;
  }
  ERROR.textContent = msg;
  ERROR.classList.remove('oculto');
}

// obtiene un personaje (resuelve con objeto personaje o lanza)
async function fetchPersonaje() {
  const res = await fetch(API_RANDOM);
  if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
  // la API devuelve un objeto con campos: name, image, occupation (según la doc)
  const p = await res.json();
  return p;
}

// carga 6 personajes en paralelo
async function cargarGaleria() {
  showError('');
  showLoader(true);
  GALERIA.innerHTML = '';
  mostrandoFavoritos = false;
  try {
    // crear 6 promesas de fetch
    const peticiones = Array.from({ length: 6 }, () => fetchPersonaje());
    const resultados = await Promise.all(peticiones); // falla si alguna falla
    personajes = resultados.map(normalizarPersonaje);
    renderizar(personajes);
  } catch (err) {
    console.error(err);
    showError('No se pudieron cargar los personajes. Intentá de nuevo.');
  } finally {
    showLoader(false);
  }
}

function normalizarPersonaje(raw) {
  // la API puede devolver diferente forma; normalizamos
  return {
    id: raw.id ?? `${raw.name}-${Math.random().toString(36).slice(2,8)}`,
    name: raw.name ?? 'Sin nombre',
    image: raw.image ?? raw.thumbnail ?? '',
    occupation: Array.isArray(raw.occupation) ? raw.occupation[0] ?? '' : (raw.occupation ?? ''),
    raw
  };
}

function crearCard(personaje) {
  const tpl = TEMPLATE.content.cloneNode(true);
  const article = tpl.querySelector('.card');
  const img = tpl.querySelector('.card-img');
  const nameEl = tpl.querySelector('.card-name');
  const occEl = tpl.querySelector('.card-occupation');
  const favBtn = tpl.querySelector('.fav-btn');

  img.src = personaje.image || '';
  img.alt = personaje.name;
  nameEl.textContent = personaje.name;
  occEl.textContent = personaje.occupation ? `Ocupación: ${personaje.occupation}` : '';

  // favorito
  const favs = obtenerFavoritos();
  const esFav = favs.some(f => f.id === personaje.id);
  if (esFav) favBtn.classList.add('activo');

  favBtn.addEventListener('click', () => {
    toggleFavorito(personaje, favBtn);
  });

  // click imagen abre en nueva pestaña (opcional)
  img.addEventListener('click', () => {
    if (personaje.image) window.open(personaje.image, '_blank');
  });

  return tpl;
}

function renderizar(lista) {
  GALERIA.innerHTML = '';
  if (!lista || lista.length === 0) {
    GALERIA.innerHTML = `<p>No se encontraron personajes.</p>`;
    return;
  }
  const fragment = document.createDocumentFragment();
  lista.forEach(p => {
    const nodo = crearCard(p);
    fragment.appendChild(nodo);
  });
  GALERIA.appendChild(fragment);
}

// Favoritos: guardar/leer de localStorage
const LS_KEY = 'simpsons_favs_v1';

function obtenerFavoritos() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function guardarFavoritos(arr) {
  localStorage.setItem(LS_KEY, JSON.stringify(arr));
}

function toggleFavorito(personaje, btnEl) {
  const favs = obtenerFavoritos();
  const idx = favs.findIndex(f => f.id === personaje.id);
  if (idx >= 0) {
    favs.splice(idx, 1);
    btnEl.classList.remove('activo');
  } else {
    favs.push({ id: personaje.id, name: personaje.name, image: personaje.image, occupation: personaje.occupation });
    btnEl.classList.add('activo');
  }
  guardarFavoritos(favs);
}

// filtrar por nombre (sensible mayúsc/minúsc)
function aplicarFiltro() {
  const q = INPUT_FILTRO.value.trim().toLowerCase();
  if (mostrandoFavoritos) {
    const favs = obtenerFavoritos();
    const filtrados = favs.filter(f => f.name.toLowerCase().includes(q));
    renderizar(filtrados);
  } else {
    const filtrados = personajes.filter(p => p.name.toLowerCase().includes(q));
    renderizar(filtrados);
  }
}

function verFavoritos() {
  mostrandoFavoritos = true;
  const favs = obtenerFavoritos();
  if (favs.length === 0) {
    GALERIA.innerHTML = '<p>No hay favoritos aún.</p>';
    return;
  }
  // mapear a la estructura normalizada para reusar renderizar
  const list = favs.map(f => ({ id: f.id, name: f.name, image: f.image, occupation: f.occupation }));
  renderizar(list);
}

// eventos
BTN_CARGAR.addEventListener('click', cargarGaleria);
INPUT_FILTRO.addEventListener('input', aplicarFiltro);
BTN_VER_FAV.addEventListener('click', verFavoritos);

// carga inicial
cargarGaleria();
async function cargarGaleria() {
  showError('');
  showLoader(true);
  GALERIA.innerHTML = '';
  mostrandoFavoritos = false;

const promesas = Array.from({ length: 6 }, () => 
    fetchPersonaje().then(
    data => ({ status: 'fulfilled', value: data }),
    err => ({ status: 'rejected', reason: err })
    )
);

const resultados = await Promise.all(promesas);
}
