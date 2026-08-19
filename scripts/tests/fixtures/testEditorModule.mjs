import {
  m83Component,
  m83DomainButton,
  m83Element,
  m83Slot,
} from "../../../src/renderer/ui-editor/m83ComponentContract.js";

const header = m83Element({ id: "test-editor.header.root", name: "Test-Kopfbereich", type: "root", role: "layout", parentId: null, order: 10 });
const headerText = m83Element({ id: "test-editor.header.text", name: "Test-Überschrift", type: "label", role: "content", parentId: header.id, order: 11 });
const list = m83Element({ id: "test-editor.list.root", name: "Test-Listenbereich", type: "root", role: "content", parentId: null, order: 20 });
const listItem = m83Element({ id: "test-editor.list.item", name: "Test-Listenelement", type: "componentPart", role: "content", parentId: list.id, order: 21, hasVisibleText: true });
const edit = m83Element({ id: "test-editor.edit.root", name: "Test-Bearbeitungsbereich", type: "root", role: "layout", parentId: null, order: 30 });
const field = m83Element({ id: "test-editor.edit.field", name: "Neutrales Testfeld", type: "field", role: "content", fieldKind: "display", parentId: edit.id, order: 31 });
const action = m83DomainButton({ id: "test-editor.edit.action", name: "Neutrale Testschaltfläche", parentId: edit.id, order: 32, actionKind: "none", componentKind: "testOnly" });

function component(componentId, scopeId, elements) {
  return m83Component({
    componentId,
    scopeId,
    requiredSlots: elements.map((entry) => entry.id),
    slots: elements.map((entry) => m83Slot(entry.id, entry)),
  });
}

export const testEditorModuleRegistration = Object.freeze({
  registryOrder: 1,
  scopeGroupId: "module-test-editor",
  layoutStorageKey: "module-test-editor",
  registryVersion: 1,
  scopeIds: Object.freeze(["test-editor.header.root", "test-editor.list.root", "test-editor.edit.root"]),
  componentContracts: Object.freeze([
    component("test-editor.header", "test-editor.header.root", [header, headerText]),
    component("test-editor.list", "test-editor.list.root", [list, listItem]),
    component("test-editor.edit", "test-editor.edit.root", [edit, field, action]),
  ]),
  launchers: Object.freeze([Object.freeze({
    componentId: "test-editor.header",
    scopeId: "test-editor.header.root",
    elementId: "test-editor.edit.action",
  })]),
});
