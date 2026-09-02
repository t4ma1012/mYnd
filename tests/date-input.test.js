const fs = require('fs');
const vm = require('vm');

class FakeClassList {
  constructor() { this.set = new Set(); }
  add(...names) { names.forEach(name => this.set.add(name)); }
  remove(...names) { names.forEach(name => this.set.delete(name)); }
  contains(name) { return this.set.has(name); }
  toggle(name, force) {
    if (force === undefined) {
      if (this.set.has(name)) { this.set.delete(name); return false; }
      this.set.add(name); return true;
    }
    if (force) this.set.add(name); else this.set.delete(name);
    return force;
  }
}

class FakeElement {
  constructor(tagName = 'div') {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.parentNode = null;
    this.style = {};
    this.dataset = {};
    this.classList = new FakeClassList();
    this.listeners = {};
    this.value = '';
    this.placeholder = '';
  }
  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }
  insertBefore(child, refNode) {
    const idx = refNode ? this.children.indexOf(refNode) : -1;
    child.parentNode = this;
    if (idx >= 0) this.children.splice(idx, 0, child);
    else this.children.push(child);
    return child;
  }
  setAttribute(name, value) { this.attributes ||= {}; this.attributes[name] = value; }
  getAttribute(name) { return this.attributes && this.attributes[name]; }
  addEventListener(type, handler) {
    (this.listeners[type] ||= []).push(handler);
  }
  dispatchEvent(event) {
    const handlers = this.listeners[event.type] || [];
    handlers.forEach(handler => handler.call(this, event));
    return true;
  }
  querySelector(selector) {
    return this.children.find(child => child.classList && child.classList.contains(selector.replace('.', '')))
      || null;
  }
  closest() { return this; }
}

function makeDocument() {
  const body = new FakeElement('body');
  const document = {
    body,
    createElement(tag) { return new FakeElement(tag); },
    addEventListener() {},
  };
  return document;
}

const document = makeDocument();
const context = {
  window: { document },
  document,
  console,
  Date,
  Math,
  setTimeout,
  clearTimeout,
};
context.global = context;

const source = fs.readFileSync('./shared/date-input.js', 'utf8');
vm.createContext(context);
vm.runInContext(source, context);

const input = new FakeElement('input');
context.window.DateInput.attach(input);
context.window.DateInput.setValue(input, '2025-11-24');
if (input.value !== '24/11/2025') {
  throw new Error(`Expected value to be formatted as dd/mm/yyyy, got ${input.value}`);
}
if (context.window.DateInput.getValue(input) !== '2025-11-24') {
  throw new Error('Expected DateInput.getValue() to return ISO date string');
}

const rawInput = new FakeElement('input');
context.window.DateInput.attach(rawInput);
rawInput.value = '05122026';
rawInput.dispatchEvent({ type: 'input' });
if (rawInput.value !== '05/12/2026') {
  throw new Error(`Expected typing to auto-format to dd/mm/yyyy, got ${rawInput.value}`);
}
if (context.window.DateInput.getValue(rawInput) !== '2026-12-05') {
  throw new Error('Expected typed value to parse back to ISO');
}

console.log('DateInput compatibility test passed');
