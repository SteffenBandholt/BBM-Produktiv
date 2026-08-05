import RestarbeitenScreen from "../../src/renderer/modules/restarbeiten/screens/RestarbeitenScreen.js";
import { bindDevelopmentUiEditorOpenButtonRef } from "../../src/renderer/app/coreShellNavigation.js";
import {
  createM80RegistrationDescriptor,
  handleM80EditorRequest,
  resetM80PilotWorkingStatesForDiagnostic,
  setM80DiagnosticRegistryRevision,
} from "../../src/renderer/ui-editor/m80HostAdapter.js";
import { getM80Ref } from "../../src/renderer/ui-editor/m80Refs.js";

export function renderRestarbeitenRegistration() {
  resetM80PilotWorkingStatesForDiagnostic();
  const screen = new RestarbeitenScreen({ projectId: "m80-1-project", project: { id: "m80-1-project" } });
  const root = screen.render();
  const launcher = document.createElement("button");
  root.appendChild(launcher);
  bindDevelopmentUiEditorOpenButtonRef({ scopeId: "restarbeiten.header.root", button: launcher });
  return {
    root,
    registration: createM80RegistrationDescriptor(),
    getRef: (id) => getM80Ref(id),
    request: (payload) => handleM80EditorRequest(payload),
    setDiagnosticRegistryRevision: (value) => setM80DiagnosticRegistryRevision(value),
    registrationDescriptor: () => createM80RegistrationDescriptor(),
  };
}
