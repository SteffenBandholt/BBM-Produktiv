export class WorkbenchShellFrame {
  constructor() {
    this.root = document.createElement("div");
    this.root.className = "bbm-tops-workbench";
    this.root.dataset.hasSelection = "false";
    this.root.dataset.isReadOnly = "false";
    this.root.dataset.isMoveMode = "false";

    this.header = document.createElement("div");
    this.header.className = "bbm-tops-workbench-header";

    this.leftHeaderTitle = document.createElement("div");
    this.leftHeaderTitle.className = "bbm-tops-workbench-left-title";

    this.headerAddActions = document.createElement("div");
    this.headerAddActions.className = "bbm-tops-workbench-add-wrap";

    this.headerPrimaryActions = document.createElement("div");
    this.headerPrimaryActions.className = "bbm-tops-workbench-action-wrap";

    this.header.append(
      this.leftHeaderTitle,
      this.headerAddActions,
      this.headerPrimaryActions,
    );

    this.body = document.createElement("div");
    this.body.className = "bbm-tops-workbench-body";

    this.left = document.createElement("div");
    this.left.className = "bbm-tops-workbench-left";

    this.gutter = document.createElement("div");
    this.gutter.className = "bbm-tops-workbench-gutter";
    this.gutter.setAttribute("aria-hidden", "true");
  }

  mount(rightColumnRoot) {
    this.body.append(this.left, this.gutter, rightColumnRoot);
    this.root.append(this.header, this.body);
  }
}
