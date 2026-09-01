const fs = require('fs');
const vm = require('vm');

function createLocalStorage() {
  const store = new Map();
  return {
    getItem(key) { return store.has(key) ? store.get(key) : null; },
    setItem(key, value) { store.set(String(key), String(value)); },
    removeItem(key) { store.delete(String(key)); },
    clear() { store.clear(); }
  };
}

function makeDb() {
  const data = new Map();
  return {
    data,
    collection(name) {
      return {
        doc(id) {
          return {
            collection(sub) {
              return {
                doc(key) {
                  return {
                    async get() {
                      const v = data.get(`${id}/${sub}/${key}`);
                      return { exists: v !== undefined, data: () => ({ value: v }) };
                    },
                    async set(payload) {
                      data.set(`${id}/${sub}/${key}`, payload.value);
                    }
                  };
                }
              };
            }
          };
        }
      };
    }
  };
}

(async function run() {
  const source = fs.readFileSync('./shared/store.js', 'utf8');
  const document = { getElementById() { return null; } };
  const localStorage = createLocalStorage();
  const context = { console, document, localStorage, window: null };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(source, context);

  if (!context.window.Store || typeof context.window.Store.addListItem !== 'function') {
    throw new Error('Store.addListItem() is missing');
  }

  if (!context.window.Store || typeof context.window.Store.updateListItem !== 'function') {
    throw new Error('Store.updateListItem() is missing');
  }

  if (!context.window.Store || typeof context.window.Store.deleteListItem !== 'function') {
    throw new Error('Store.deleteListItem() is missing');
  }

  if (!context.window.Lists || typeof context.window.Lists.incrementProgress !== 'function') {
    throw new Error('Lists.incrementProgress() is missing');
  }

  const db = makeDb();
  context.window.Store.init(db, 'uid-1');

  const movie = await context.window.Store.addListItem({
    type: 'movie',
    name: 'Dune: Part Two',
    status: 'planned',
    current: 1,
    total: 2,
    progressMode: 'count'
  });

  const place = await context.window.Store.addListItem({
    type: 'place',
    name: 'Hội An',
    category: 'heritage',
    status: 'visited'
  });

  const place2 = await context.window.Store.addListItem({
    type: 'place',
    name: 'Mộc Coffee',
    category: 'cafe',
    status: 'wish'
  });

  const allItems = await context.window.Store.getListItems();
  if (allItems.length !== 3) {
    throw new Error(`Expected 3 list items, got ${allItems.length}`);
  }

  const movies = await context.window.Store.getListItems('movie');
  if (movies.length !== 1 || movies[0].id !== movie.id) {
    throw new Error('Expected movie filter to return exactly the movie item');
  }

  const updated = await context.window.Store.updateListItem(movie.id, {
    status: 'completed',
    progress: 100,
    updatedAt: 123456789
  });

  if (updated.status !== 'completed' || updated.progress !== 100) {
    throw new Error('Expected list item to update in place');
  }

  const selected = await context.window.Store.getListItem(movie.id);
  if (!selected || selected.status !== 'completed') {
    throw new Error('Expected updated item to be retrievable by id');
  }

  const deleted = await context.window.Store.deleteListItem(place.id);
  if (!deleted) {
    throw new Error('Expected place list item to be deleted');
  }

  const progressMovie = await context.window.Store.addListItem({
    type: 'movie',
    name: 'Interstellar',
    status: 'planned',
    season: 2,
    current: 2,
    total: 5,
    progressMode: 'episode'
  });

  const incremented = await context.window.Lists.incrementProgress(progressMovie.id, 1);
  if (incremented.current !== 3 || incremented.percent !== 60) {
    throw new Error(`Expected increment to 3/5 and 60%, got ${incremented.current}/${incremented.total} => ${incremented.percent}%`);
  }

  const capped = await context.window.Lists.incrementProgress(progressMovie.id, 10);
  if (capped.current !== capped.total || capped.current !== 5) {
    throw new Error(`Expected current to clamp to total 5, got ${capped.current}/${capped.total}`);
  }

  const remaining = await context.window.Store.getListItems();
  if (remaining.some(item => item.id === place.id)) {
    throw new Error('Place item still exists after deletion');
  }

  context.window.Store.init(db, 'uid-2');
  const crossUser = await context.window.Store.getListItems();
  if (crossUser.length !== 0) {
    throw new Error(`Expected no cross-user bleed, got ${crossUser.length} items`);
  }

  console.log('Lists foundation test passed');
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
