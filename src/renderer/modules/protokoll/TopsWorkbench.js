import { TopsWorkbench as BaseTopsWorkbench } from "../../tops/components/TopsWorkbench.js";
import { getM80Ref, registerM80Ref } from "../../ui-editor/m80Refs.js";

export class TopsWorkbench extends BaseTopsWorkbench {
  constructor(options = {}) {
    super(options);
    this._rebuildCounterTargets();
    this._registerUiEditorCounterRefs();
  }

  _rebuildCounterTargets() {
    const editbox = this.sharedEditboxCore?.editbox;
    if (!editbox) return;

    const rebuild = (wrap, counter, input) => {
      if (!wrap || !counter || !input) return;
      counter.classList.add("bbm-tops-editbox-remaining");
      counter.setAttribute("data-bbm-protokoll-counter-target", "true");

      // SharedEditboxCore hatte die Anzeige historisch in das Label verschoben.
      // Für den UI-Editor ist sie wieder ein eigenständiges Geschwisterziel:
      // Label -> Restzeichen -> Eingabefeld.
      if (counter.parentElement !== wrap || counter.nextSibling !== input) {
        wrap.insertBefore(counter, input);
      }
    };

    rebuild(editbox.shortWrap, editbox.shortCounter, editbox.shortInput);
    rebuild(editbox.longWrap, editbox.longCounter, editbox.longInput);
  }

  _registerUiEditorCounterRefs() {
    const editbox = this.sharedEditboxCore?.editbox;
    if (!editbox) return;

    this._rebuildCounterTargets();

    if (!getM80Ref("protokoll.edit.short.counter")) {
      registerM80Ref("protokoll.edit.short.counter", editbox.shortCounter);
    }
    if (!getM80Ref("protokoll.edit.long.counter")) {
      registerM80Ref("protokoll.edit.long.counter", editbox.longCounter);
    }
  }

  setState(...args) {
    const result = super.setState(...args);
    this._registerUiEditorCounterRefs();
    return result;
  }
}

export { SharedEditboxCore } from "./SharedEditboxCore.js";
export { WorkbenchMetaColumn } from "./WorkbenchMetaColumn.js";
export { WorkbenchShellFrame } from "./WorkbenchShellFrame.js";
export { WorkbenchActionDraftState } from "./WorkbenchActionDraftState.js";
