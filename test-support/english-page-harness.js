// Minimal DOM + google.script.run fake that executes the real inline script of
// apps-script/English.html so rapid-click behaviour can be tested in Node.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../apps-script/English.html', import.meta.url), 'utf8');
const script = new vm.Script(html.match(/<script>([\s\S]*?)<\/script>/i)[1], { filename: 'English.html' });

function createElement(id, attributes, page) {
  const classes = new Set((attributes.match(/class="([^"]*)"/) || [, ''])[1].split(/\s+/).filter(Boolean));
  const element = {
    id,
    _text: '',
    // Browsers coerce assigned text to a string.
    get textContent() {
      return this._text;
    },
    set textContent(value) {
      this._text = String(value);
    },
    value: '',
    disabled: /\sdisabled(\s|>|=|$)/.test(attributes),
    onclick: null,
    dataset: {},
    style: {},
    classList: {
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name),
      contains: (name) => classes.has(name),
      toggle: (name, force) => {
        const on = force === undefined ? !classes.has(name) : force;
        if (on) classes.add(name);
        else classes.delete(name);
        return on;
      },
    },
    get className() {
      return [...classes].join(' ');
    },
    set className(value) {
      classes.clear();
      String(value).split(/\s+/).filter(Boolean).forEach((name) => classes.add(name));
    },
    get innerHTML() {
      return this._html || '';
    },
    set innerHTML(value) {
      this._html = String(value);
      if (/id="answer-input"/.test(value)) page.elements['answer-input'] = createElement('answer-input', '', page);
    },
    focus() {},
    // Behaves like a user click: hidden or disabled controls cannot be clicked.
    click() {
      if (this.disabled || classes.has('hidden')) return false;
      if (this.onclick) this.onclick();
      return true;
    },
  };
  return element;
}

export function openEnglishPage() {
  const page = {
    elements: {},
    calls: [],
    intervals: [],
    now: 0,
    selectedChoice: null,
  };

  const markup = html.slice(0, html.search(/<script>/i));
  for (const match of markup.matchAll(/<(\w+)([^>]*\sid="([^"]+)"[^>]*)>/g)) {
    page.elements[match[3]] = createElement(match[3], match[2], page);
  }

  function runner(handlers = {}) {
    return new Proxy({}, {
      get(_, name) {
        if (name === 'withSuccessHandler') return (fn) => runner({ ...handlers, success: fn });
        if (name === 'withFailureHandler') return (fn) => runner({ ...handlers, failure: fn });
        return (...args) => {
          page.calls.push({ name, args: JSON.parse(JSON.stringify(args)), ...handlers });
        };
      },
    });
  }

  const document = {
    hidden: false,
    getElementById: (id) => page.elements[id] || null,
    querySelector: (selector) => (
      /name="choice"/.test(selector) && page.selectedChoice ? { value: page.selectedChoice } : null
    ),
    addEventListener() {},
  };

  const context = vm.createContext({
    document,
    window: {},
    google: { script: { run: runner() } },
    performance: { now: () => page.now },
    setInterval: (fn) => page.intervals.push(fn),
    setTimeout: (fn) => fn,
    clearTimeout() {},
    console,
  });
  script.runInContext(context);

  page.el = (id) => page.elements[id];
  page.click = (id) => page.elements[id].click();
  page.pending = (name) => page.calls.filter((call) => call.name === name && !call.settled);
  page.callsTo = (name) => page.calls.filter((call) => call.name === name);
  page.respond = (call, result) => {
    call.settled = true;
    call.success(JSON.parse(JSON.stringify(result)));
  };
  page.fail = (call, error = new Error('NetworkError: Connection failure due to HTTP 0')) => {
    call.settled = true;
    call.failure(error);
  };
  page.tick = (ms) => {
    page.now += ms;
    page.intervals.forEach((fn) => fn());
  };
  return page;
}

export function bootstrapData(overrides = {}) {
  return {
    student: { studentId: 'stu_1', familyId: 'fam_1', displayName: 'Student' },
    catalogVersion: 'fixture.1',
    savingPool: 0,
    todayEnglishEarned: 0,
    rewardConfigured: true,
    dailyCap: 100,
    lesson: {
      lessonId: 'lesson-1',
      revision: 1,
      contentId: 'lesson-1@r1',
      displayName: 'Fixture lesson',
      words: [
        { wordId: 'w-apple', revision: 1, contentId: 'w-apple@r1', english: 'apple', chinese: '蘋果' },
        { wordId: 'w-book', revision: 1, contentId: 'w-book@r1', english: 'book', chinese: '書' },
      ],
    },
    quiz: [
      { questionId: 'q-apple', revision: 1, contentId: 'q-apple@r1', kind: 'ZH_TO_EN', sourceType: 'CURRENT', prompt: '蘋果' },
      { questionId: 'q-book', revision: 1, contentId: 'q-book@r1', kind: 'ZH_TO_EN', sourceType: 'PRIOR', prompt: '書' },
    ],
    ...overrides,
  };
}
