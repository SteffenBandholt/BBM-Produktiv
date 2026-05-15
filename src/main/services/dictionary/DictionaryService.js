const DEFAULT_CATEGORY = "Bau";
let _defaultDictionaryRepo = null;

function _getDefaultDictionaryRepo() {
  if (!_defaultDictionaryRepo) {
    _defaultDictionaryRepo = require("../../db/dictionaryRepo");
  }
  return _defaultDictionaryRepo;
}

const DEFAULT_BASE_ENTRIES = Object.freeze([
  { entryType: "correction", wrongText: "rohrbau", correctText: "Rohbau" },
  { entryType: "correction", wrongText: "schalung", correctText: "Schalung" },
  { entryType: "correction", wrongText: "bewehrung", correctText: "Bewehrung" },
  { entryType: "correction", wrongText: "betonage", correctText: "Betonage" },
  { entryType: "correction", wrongText: "freigabe", correctText: "Freigabe" },
  { entryType: "correction", wrongText: "nachtrag", correctText: "Nachtrag" },
  { entryType: "correction", wrongText: "schacht hoehen", correctText: "Schachth\u00f6hen" },
  { entryType: "correction", wrongText: "schachthoehen", correctText: "Schachth\u00f6hen" },
  { entryType: "correction", wrongText: "schachthohen", correctText: "Schachth\u00f6hen" },
  { entryType: "correction", wrongText: "sohlen", correctText: "Sohlen" },
  { entryType: "correction", wrongText: "absteckung", correctText: "Absteckung" },
  { entryType: "correction", wrongText: "geruestpruefung", correctText: "Ger\u00fcstpr\u00fcfung" },
  { entryType: "correction", wrongText: "geruest pruefung", correctText: "Ger\u00fcstpr\u00fcfung" },
  { entryType: "correction", wrongText: "statik", correctText: "Statik" },
  { entryType: "correction", wrongText: "bauzaun", correctText: "Bauzaun" },
]);

class DictionaryService {
  constructor({ repo } = {}) {
    const resolvedRepo = repo || _getDefaultDictionaryRepo();
    if (!resolvedRepo) throw new Error("DictionaryService: repo required");
    this.repo = resolvedRepo;
    this._seeded = false;
  }

  ensureSeeded() {
    if (this._seeded) return;
    this.repo.seedBaseEntries(DEFAULT_BASE_ENTRIES);
    this._seeded = true;
  }

  listEntries(filters = {}) {
    this.ensureSeeded();
    return this.repo.listEntries({
      ...filters,
      category: DEFAULT_CATEGORY,
    });
  }

  createEntry(payload = {}) {
    this.ensureSeeded();
    return this.repo.createEntry({
      ...payload,
      category: DEFAULT_CATEGORY,
      source: payload.source || "user",
    });
  }

  updateEntry(id, patch = {}) {
    this.ensureSeeded();
    return this.repo.updateEntry(id, {
      ...patch,
      category: DEFAULT_CATEGORY,
    });
  }

  setEntryActive(id, active) {
    this.ensureSeeded();
    return this.repo.setEntryActive(id, active);
  }

  deleteEntry(id) {
    this.ensureSeeded();
    return this.repo.deleteEntry(id);
  }

  applyCorrectionsToText(text) {
    this.ensureSeeded();
    return this.repo.applyCorrectionsToText(text);
  }
}

function createDictionaryService(options = {}) {
  return new DictionaryService(options);
}

module.exports = {
  DEFAULT_BASE_ENTRIES,
  DEFAULT_CATEGORY,
  DictionaryService,
  createDictionaryService,
};
