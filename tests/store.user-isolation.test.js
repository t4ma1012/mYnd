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
  const context = {
    console,
    document,
    localStorage,
    window: null
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(source, context);

  const db = makeDb();
  context.window.Store.init(db, 'uid-1');
  await context.window.Store.storageSetRaw('calendar-events-v1', JSON.stringify({ user: 'uid-1' }));

  const namespacedKey = 'gpx:uid-1:calendar-events-v1';
  const plainKey = 'calendar-events-v1';
  const user1Value = localStorage.getItem(namespacedKey);
  const plainValue = localStorage.getItem(plainKey);

  if (user1Value !== JSON.stringify({ user: 'uid-1' })) {
    throw new Error(`Expected namespaced key ${namespacedKey} to be written, got ${user1Value}`);
  }

  if (plainValue !== null) {
    throw new Error(`Expected plain key ${plainKey} to be avoided for user-scoped storage`);
  }

  context.window.Store.init(db, 'uid-2');
  const secondRead = await context.window.Store.storageGetRaw('calendar-events-v1');
  if (secondRead !== null) {
    throw new Error(`Expected no cross-user bleed; got ${secondRead}`);
  }

  console.log('Store isolation test passed');
})();
