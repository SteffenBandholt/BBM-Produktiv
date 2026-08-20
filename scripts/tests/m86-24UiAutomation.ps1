param(
    [Parameter(Mandatory = $true)][int]$ProcessId,
    [ValidateSet("Dump", "SelectTarget", "ReadSelection", "ClickWidthMinus", "ClickWidthPlus", "BeginClose", "ClickSaveDialog", "RestarbeitenSave", "PdfEditSave", "PdfInspect", "PdfColumn5", "PdfColumnDrag", "PdfColumn0", "PdfColumn9", "PdfColumnInspect", "PdfSeparatorsOn", "PdfSeparatorsOff", "PdfSeparatorsReset", "PdfSeparatorsInspect")][string]$Action = "Dump",
    [string]$TracePath = ""
)

if (-not [string]::IsNullOrWhiteSpace($TracePath)) {
    Set-Content -LiteralPath $TracePath -Value "$(Get-Date -Format o) automation-start process=$ProcessId action=$Action"
}

function Write-AutomationTrace([string]$Message) {
    if (-not [string]::IsNullOrWhiteSpace($TracePath)) {
        Add-Content -LiteralPath $TracePath -Value "$(Get-Date -Format o) $Message"
    }
}

Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
Add-Type @"
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
public static class M8624Mouse {
    [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr window);
    [DllImport("user32.dll")] public static extern bool BringWindowToTop(IntPtr window);
    [DllImport("user32.dll")] public static extern bool ShowWindowAsync(IntPtr window, int command);
    [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] public static extern bool MoveWindow(IntPtr window, int x, int y, int width, int height, bool repaint);
    public delegate bool EnumWindowsProc(IntPtr window, IntPtr parameter);
    [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc callback, IntPtr parameter);
    [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr window, StringBuilder text, int count);
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr window, out uint processId);
    [DllImport("user32.dll")] public static extern void mouse_event(uint flags, uint dx, uint dy, uint data, UIntPtr extraInfo);
    [DllImport("user32.dll")] public static extern void keybd_event(byte key, byte scan, uint flags, UIntPtr extraInfo);
    public static void Click(int x, int y) {
        SetCursorPos(x, y);
        mouse_event(0x0002, 0, 0, 0, UIntPtr.Zero);
        mouse_event(0x0004, 0, 0, 0, UIntPtr.Zero);
    }
    public static void Drag(int startX, int startY, int endX, int endY) {
        SetCursorPos(startX, startY);
        mouse_event(0x0002, 0, 0, 0, UIntPtr.Zero);
        for (var step = 1; step <= 12; step++) {
            SetCursorPos(startX + ((endX - startX) * step / 12), startY + ((endY - startY) * step / 12));
            Thread.Sleep(25);
        }
        mouse_event(0x0004, 0, 0, 0, UIntPtr.Zero);
    }
    public static bool Activate(int windowHandle) {
        var handle = new IntPtr(windowHandle);
        ShowWindowAsync(handle, 9);
        BringWindowToTop(handle);
        SetForegroundWindow(handle);
        return GetForegroundWindow() == handle;
    }
    public static void Resize(int windowHandle, int width, int height) { MoveWindow(new IntPtr(windowHandle), 0, 0, width, height, true); }
    public static void CloseActiveWindow() {
        keybd_event(0x12, 0, 0, UIntPtr.Zero);
        keybd_event(0x73, 0, 0, UIntPtr.Zero);
        keybd_event(0x73, 0, 0x0002, UIntPtr.Zero);
        keybd_event(0x12, 0, 0x0002, UIntPtr.Zero);
    }
    public static void ActivateFocusedControl() {
        keybd_event(0x20, 0, 0, UIntPtr.Zero);
        keybd_event(0x20, 0, 0x0002, UIntPtr.Zero);
    }
    public static int FindWindow(int processId, string titlePrefix) {
        IntPtr found = IntPtr.Zero;
        EnumWindows((window, parameter) => {
            uint owner;
            GetWindowThreadProcessId(window, out owner);
            if (owner != processId) return true;
            var text = new StringBuilder(512);
            GetWindowText(window, text, text.Capacity);
            if (text.ToString().StartsWith(titlePrefix, StringComparison.Ordinal)) { found = window; return false; }
            return true;
        }, IntPtr.Zero);
        return found.ToInt32();
    }
    public static string[] WindowTitles(int processId) {
        var titles = new List<string>();
        EnumWindows((window, parameter) => {
            uint owner;
            GetWindowThreadProcessId(window, out owner);
            if (owner == processId) {
                var text = new StringBuilder(512);
                GetWindowText(window, text, text.Capacity);
                if (text.Length > 0) titles.Add(text.ToString());
            }
            return true;
        }, IntPtr.Zero);
        return titles.ToArray();
    }
}
"@

$root = [System.Windows.Automation.AutomationElement]::RootElement
$processCondition = New-Object System.Windows.Automation.PropertyCondition(
    [System.Windows.Automation.AutomationElement]::ProcessIdProperty,
    $ProcessId
)
$window = $null
for ($attempt = 0; $attempt -lt 120 -and $null -eq $window; $attempt += 1) {
    $window = $root.FindFirst([System.Windows.Automation.TreeScope]::Children, $processCondition)
    if ($null -eq $window) { Start-Sleep -Milliseconds 100 }
}
if ($null -eq $window) { throw "UI-Editor-Fenster fuer Prozess $ProcessId wurde nicht gefunden." }

function Find-Control([string]$Name, [System.Windows.Automation.ControlType]$ControlType) {
    $nameCondition = New-Object System.Windows.Automation.PropertyCondition(
        [System.Windows.Automation.AutomationElement]::NameProperty,
        $Name
    )
    $typeCondition = New-Object System.Windows.Automation.PropertyCondition(
        [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
        $ControlType
    )
    $condition = New-Object System.Windows.Automation.AndCondition($nameCondition, $typeCondition)
    $window.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $condition)
}

function Find-VisibleControl([string]$Name, [System.Windows.Automation.ControlType]$ControlType) {
    $nameCondition = New-Object System.Windows.Automation.PropertyCondition(
        [System.Windows.Automation.AutomationElement]::NameProperty,
        $Name
    )
    $typeCondition = New-Object System.Windows.Automation.PropertyCondition(
        [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
        $ControlType
    )
    $condition = New-Object System.Windows.Automation.AndCondition($nameCondition, $typeCondition)
    foreach ($control in $window.FindAll([System.Windows.Automation.TreeScope]::Descendants, $condition)) {
        if (-not $control.Current.IsOffscreen -and $control.Current.IsEnabled) { return $control }
    }
    return $null
}

function Find-NamedControl([string]$Name) {
    $nameCondition = New-Object System.Windows.Automation.PropertyCondition(
        [System.Windows.Automation.AutomationElement]::NameProperty,
        $Name
    )
    $window.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $nameCondition)
}

function Invoke-Control([System.Windows.Automation.AutomationElement]$Control) {
    if ($null -eq $Control) { throw "Erwartetes UI-Steuerelement fehlt." }
    $pattern = $null
    if (-not $Control.TryGetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern, [ref]$pattern)) {
        throw "Steuerelement '$($Control.Current.Name)' unterstuetzt InvokePattern nicht."
    }
    $pattern.Invoke()
}

function Click-Control([System.Windows.Automation.AutomationElement]$Control) {
    if ($null -eq $Control) { throw "Erwartetes UI-Steuerelement fehlt." }
    $bounds = $Control.Current.BoundingRectangle
    [M8624Mouse]::Click(
        [int][Math]::Round($bounds.X + ($bounds.Width / 2)),
        [int][Math]::Round($bounds.Y + ($bounds.Height / 2))
    )
}

function Activate-Window([System.Windows.Automation.AutomationElement]$TargetWindow) {
    $focused = $false
    for ($attempt = 0; $attempt -lt 10 -and -not $focused; $attempt += 1) {
        $focused = [M8624Mouse]::Activate($TargetWindow.Current.NativeWindowHandle)
        try { $TargetWindow.SetFocus() } catch { }
        Start-Sleep -Milliseconds 100
    }
    if (-not $focused) {
        [M8624Mouse]::ShowWindowAsync([IntPtr]$TargetWindow.Current.NativeWindowHandle, 9) | Out-Null
        [M8624Mouse]::BringWindowToTop([IntPtr]$TargetWindow.Current.NativeWindowHandle) | Out-Null
        try { $TargetWindow.SetFocus() } catch { }
    }
}

function Find-ButtonPrefix([System.Windows.Automation.AutomationElement]$SearchRoot, [string]$Prefix) {
    $buttonCondition = New-Object System.Windows.Automation.PropertyCondition(
        [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
        [System.Windows.Automation.ControlType]::Button
    )
    $buttons = $SearchRoot.FindAll([System.Windows.Automation.TreeScope]::Descendants, $buttonCondition)
    foreach ($button in $buttons) {
        if ($button.Current.Name.StartsWith($Prefix, [System.StringComparison]::Ordinal)) { return $button }
    }
    return $null
}

function Select-Control([System.Windows.Automation.AutomationElement]$Control) {
    if ($null -eq $Control) { throw "Erwartetes Auswahl-Steuerelement fehlt." }
    $pattern = $null
    if (-not $Control.TryGetCurrentPattern([System.Windows.Automation.SelectionItemPattern]::Pattern, [ref]$pattern)) {
        throw "Steuerelement '$($Control.Current.Name)' unterstuetzt SelectionItemPattern nicht."
    }
    $pattern.Select()
}

function Expand-Control([System.Windows.Automation.AutomationElement]$Control) {
    if ($null -eq $Control) { throw "Erwartetes Baum-Steuerelement fehlt." }
    $pattern = $null
    if ($Control.TryGetCurrentPattern([System.Windows.Automation.ExpandCollapsePattern]::Pattern, [ref]$pattern)) {
        if ($pattern.Current.ExpandCollapseState -ne [System.Windows.Automation.ExpandCollapseState]::Expanded) { $pattern.Expand() }
    }
}

function Find-PdfTreeItem([string]$LabelPrefix) {
    $treeId = New-Object System.Windows.Automation.PropertyCondition(
        [System.Windows.Automation.AutomationElement]::AutomationIdProperty,
        "PdfElementTree"
    )
    $tree = $window.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $treeId)
    if ($null -eq $tree) { throw "PDF-Elementbaum fehlt." }
    $treeItemType = New-Object System.Windows.Automation.PropertyCondition(
        [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
        [System.Windows.Automation.ControlType]::TreeItem
    )
    $textType = New-Object System.Windows.Automation.PropertyCondition(
        [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
        [System.Windows.Automation.ControlType]::Text
    )
    foreach ($item in $tree.FindAll([System.Windows.Automation.TreeScope]::Descendants, $treeItemType)) {
        $label = $item.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $textType)
        if ($null -ne $label -and $label.Current.Name.StartsWith($LabelPrefix, [System.StringComparison]::Ordinal)) { return $item }
    }
    return $null
}

function Open-RestarbeitenPdfTree {
    Write-AutomationTrace "window-found"
    Activate-Window $window
    $pdfTab = Find-Control "PDF-Ausgabe" ([System.Windows.Automation.ControlType]::TabItem)
    $treeId = New-Object System.Windows.Automation.PropertyCondition(
        [System.Windows.Automation.AutomationElement]::AutomationIdProperty,
        "PdfElementTree"
    )
    $tree = $null
    for ($attempt = 0; $attempt -lt 6 -and $null -eq $tree; $attempt += 1) {
        Select-Control $pdfTab
        Click-Control $pdfTab
        Start-Sleep -Milliseconds 500
        $tree = $window.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $treeId)
    }
    if ($null -eq $tree) { throw "PDF-Elementbaum fehlt nach sichtbarer Tab-Auswahl." }
    Write-AutomationTrace "pdf-tab-selected"
    foreach ($name in @("Restarbeitenliste", "A4-Seite quer", "Seiteninhalt")) {
        $item = Find-PdfTreeItem $name
        if ($null -eq $item) { throw "PDF-Baumziel '$name' fehlt." }
        Expand-Control $item
        Start-Sleep -Milliseconds 150
    }
    $table = Find-PdfTreeItem "Restarbeiten-Tabelle"
    if ($null -eq $table) { throw "PDF-Baumziel 'Restarbeiten-Tabelle' fehlt." }
    Expand-Control $table
    Start-Sleep -Milliseconds 300
    return $table
}

function Save-And-RegeneratePdf {
    $buttonsType = New-Object System.Windows.Automation.PropertyCondition(
        [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
        [System.Windows.Automation.ControlType]::Button
    )
    $save = $null
    foreach ($button in $window.FindAll([System.Windows.Automation.TreeScope]::Descendants, $buttonsType)) {
        if ($button.Current.Name -eq "Speichern" -and -not $button.Current.IsOffscreen -and $button.Current.IsEnabled) { $save = $button; break }
    }
    Invoke-Control $save
    Write-AutomationTrace "save-invoked"
    Start-Sleep -Milliseconds 900
    $regenerate = Find-Control "PDF neu erzeugen" ([System.Windows.Automation.ControlType]::Button)
    Invoke-Control $regenerate
    Write-AutomationTrace "pdf-regeneration-invoked"
    Start-Sleep -Milliseconds 1800
}

if ($Action -in @("PdfSeparatorsOn", "PdfSeparatorsOff", "PdfSeparatorsReset", "PdfSeparatorsInspect")) {
    $table = Open-RestarbeitenPdfTree
    $option = Find-PdfTreeItem "Senkrechte Spaltentrennlinien"
    if ($null -eq $option) { throw "PDF-Baumziel 'Senkrechte Spaltentrennlinien' fehlt." }
    Select-Control $option
    Write-AutomationTrace "separator-option-selected"
    Start-Sleep -Milliseconds 500
    $visibility = Find-Control "Sichtbarkeit EIN/AUS" ([System.Windows.Automation.ControlType]::Button)
    if ($null -eq $visibility) { throw "Universelle PDF-Sichtbarkeitsbedienung fehlt." }
    $toggleCount = 0
    $resetInvoked = $false
    if ($Action -eq "PdfSeparatorsOn") {
        Invoke-Control $visibility
        Write-AutomationTrace "separator-toggled-off"
        Start-Sleep -Milliseconds 700
        Save-And-RegeneratePdf
        Select-Control $option
        Start-Sleep -Milliseconds 400
        $visibility = Find-Control "Sichtbarkeit EIN/AUS" ([System.Windows.Automation.ControlType]::Button)
        Start-Sleep -Milliseconds 500
        Invoke-Control $visibility
        $toggleCount = 2
        Write-AutomationTrace "separator-toggled-on"
        Start-Sleep -Milliseconds 700
        Save-And-RegeneratePdf
    } elseif ($Action -eq "PdfSeparatorsOff") {
        Invoke-Control $visibility
        $toggleCount = 1
        Write-AutomationTrace "separator-toggled-off"
        Start-Sleep -Milliseconds 700
        Save-And-RegeneratePdf
    } elseif ($Action -eq "PdfSeparatorsReset") {
        $original = Find-Control "Original" ([System.Windows.Automation.ControlType]::Button)
        Invoke-Control $original
        $resetInvoked = $true
        Write-AutomationTrace "separator-reset-pdf-baseline"
        Start-Sleep -Milliseconds 700
        Save-And-RegeneratePdf
    }
    $buttonType = New-Object System.Windows.Automation.PropertyCondition(
        [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
        [System.Windows.Automation.ControlType]::Button
    )
    $resetControls = @()
    foreach ($button in $window.FindAll([System.Windows.Automation.TreeScope]::Descendants, $buttonType)) {
        if ($button.Current.Name.Contains("Original") -or $button.Current.Name.Contains("zurücksetzen")) {
            $bounds = $button.Current.BoundingRectangle
            $resetControls += [ordered]@{
                name = $button.Current.Name
                automationId = $button.Current.AutomationId
                offscreen = $button.Current.IsOffscreen
                enabled = $button.Current.IsEnabled
                bounds = [ordered]@{ x = $bounds.X; y = $bounds.Y; width = $bounds.Width; height = $bounds.Height }
            }
        }
    }
    [ordered]@{
        action = $Action
        table = "Restarbeiten-Tabelle"
        option = "Senkrechte Spaltentrennlinien"
        treeIdentityPresent = $null -ne (Find-PdfTreeItem "Senkrechte Spaltentrennlinien")
        visibilityControl = $visibility.Current.Name
        toggleCount = $toggleCount
        resetInvoked = $resetInvoked
        resetControls = $resetControls
    } | ConvertTo-Json -Depth 4 -Compress
    exit 0
}

if ($Action -in @("PdfColumn5", "PdfColumnDrag", "PdfColumn0", "PdfColumn9", "PdfColumnInspect")) {
    $table = Open-RestarbeitenPdfTree
    $columnLabels = @("Nr", "Klasse", "Gegenstand", "Ort", "Einheit/Raum", "Fertig bis/Status", "Verantwortlich", "erledigt am", "Notiz/Massnahmen")
    foreach ($columnLabel in $columnLabels) {
        if ($null -eq (Find-PdfTreeItem $columnLabel)) { throw "Aktuelle Restarbeiten-Spalte '$columnLabel' fehlt im PDF-Baum." }
    }
    $number = Find-PdfTreeItem "Nr"
    Select-Control $number
    Write-AutomationTrace "number-column-selected"
    Start-Sleep -Milliseconds 500
    $input = Find-Control "PDF-Spaltenbreite in Millimetern" ([System.Windows.Automation.ControlType]::Edit)
    if ($null -eq $input) { throw "Direkte PDF-Spaltenbreiten-Eingabe fehlt." }
    $valuePattern = $null
    if (-not $input.TryGetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern, [ref]$valuePattern)) {
        throw "Direkte PDF-Spaltenbreiten-Eingabe unterstuetzt ValuePattern nicht."
    }
    $beforeValue = $valuePattern.Current.Value
    $dragReport = $null
    if ($Action -eq "PdfColumnDrag") {
        $regenerateBeforeDrag = Find-Control "PDF neu erzeugen" ([System.Windows.Automation.ControlType]::Button)
        Invoke-Control $regenerateBeforeDrag
        Write-AutomationTrace "pdf-regenerated-before-drag"
        Start-Sleep -Milliseconds 2500
        Select-Control $number
        Start-Sleep -Milliseconds 500
        $thumb = Find-NamedControl "Rechte PDF-Spaltenkante ziehen"
        Activate-Window $window
        $dragSource = "thumb"
        if ($null -ne $thumb) {
            $scrollPattern = $null
            if ($thumb.TryGetCurrentPattern([System.Windows.Automation.ScrollItemPattern]::Pattern, [ref]$scrollPattern)) { $scrollPattern.ScrollIntoView() }
            Start-Sleep -Milliseconds 300
            $bounds = $thumb.Current.BoundingRectangle
            if ($bounds.Width -le 0 -or $bounds.Height -le 0 -or $thumb.Current.IsOffscreen) { throw "Spaltenkanten-Thumb ist nicht sichtbar." }
            $startX = [int][Math]::Round($bounds.X + ($bounds.Width / 2))
            $startY = [int][Math]::Round($bounds.Y + ($bounds.Height / 2))
        } else {
            $imageId = New-Object System.Windows.Automation.PropertyCondition(
                [System.Windows.Automation.AutomationElement]::AutomationIdProperty,
                "PdfPageImage"
            )
            $pageImage = $window.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $imageId)
            if ($null -eq $pageImage) {
                $previewId = New-Object System.Windows.Automation.PropertyCondition(
                    [System.Windows.Automation.AutomationElement]::AutomationIdProperty,
                    "PdfPreviewColumn"
                )
                $preview = $window.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $previewId)
                $imageType = New-Object System.Windows.Automation.PropertyCondition(
                    [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
                    [System.Windows.Automation.ControlType]::Image
                )
                if ($null -ne $preview) { $pageImage = $preview.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $imageType) }
            }
            if ($null -eq $pageImage) { throw "Sichtbare native PDF-Seite fuer den Kanten-Mauszug fehlt." }
            $pageBounds = $pageImage.Current.BoundingRectangle
            $currentWidth = [double]::Parse($beforeValue.Replace(',', '.'), [System.Globalization.CultureInfo]::InvariantCulture)
            $startX = [int][Math]::Round($pageBounds.X + ((12 + $currentWidth) / 297) * $pageBounds.Width)
            $startY = [int][Math]::Round($pageBounds.Y + (116 / 210) * $pageBounds.Height)
            $dragSource = "selected-column-right-edge"
        }
        [M8624Mouse]::Drag($startX, $startY, $startX + 3, $startY)
        Write-AutomationTrace "column-thumb-dragged-physically:${dragSource}:${startX}:${startY}"
        Start-Sleep -Milliseconds 900
        $dragReport = [ordered]@{ startX = $startX; startY = $startY; endX = $startX + 3; endY = $startY; physicalMouse = $true; source = $dragSource }
        Save-And-RegeneratePdf
    } elseif ($Action -ne "PdfColumnInspect") {
        $requested = if ($Action -eq "PdfColumn5") { "5" } elseif ($Action -eq "PdfColumn0") { "0" } else { "9" }
        $valuePattern.SetValue($requested)
        Write-AutomationTrace "column-width-entered:$requested"
        $apply = Find-Control "PDF-Spaltenbreite anwenden" ([System.Windows.Automation.ControlType]::Button)
        Invoke-Control $apply
        Write-AutomationTrace "column-width-applied:$requested"
        Start-Sleep -Milliseconds 900
        Save-And-RegeneratePdf
    }
    $inputAfter = Find-Control "PDF-Spaltenbreite in Millimetern" ([System.Windows.Automation.ControlType]::Edit)
    $afterValue = $null
    if ($null -ne $inputAfter) {
        $afterPattern = $null
        if ($inputAfter.TryGetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern, [ref]$afterPattern)) { $afterValue = $afterPattern.Current.Value }
    }
    [ordered]@{
        action = $Action
        table = "Restarbeiten-Tabelle"
        columns = $columnLabels
        selected = "Nr"
        treeIdentityPresent = $null -ne (Find-PdfTreeItem "Nr")
        inputBefore = $beforeValue
        inputAfter = $afterValue
        drag = $dragReport
    } | ConvertTo-Json -Depth 5 -Compress
    exit 0
}

if ($Action -in @("PdfEditSave", "PdfInspect")) {
    Write-AutomationTrace "window-found"
    Activate-Window $window
    $pdfTab = Find-Control "PDF-Ausgabe" ([System.Windows.Automation.ControlType]::TabItem)
    Write-AutomationTrace "pdf-tab-found"
    Click-Control $pdfTab
    Write-AutomationTrace "pdf-tab-clicked"
    Start-Sleep -Milliseconds 1200
    foreach ($name in @("Restarbeitenliste", "A4-Seite quer", "Seiteninhalt")) {
        $item = Find-PdfTreeItem $name
        if ($null -eq $item) { throw "PDF-Baumziel '$name' fehlt." }
        Expand-Control $item
        Write-AutomationTrace "expanded:$name"
        Start-Sleep -Milliseconds 150
    }
    $table = Find-PdfTreeItem "Restarbeiten-Tabelle"
    Expand-Control $table
    Select-Control $table
    Write-AutomationTrace "table-selected"
    Start-Sleep -Milliseconds 500

    $columnLabels = @("Nr", "Klasse", "Gegenstand", "Ort", "Einheit/Raum", "Fertig bis/Status", "Verantwortlich", "erledigt am", "Notiz/Massnahmen")
    foreach ($columnLabel in $columnLabels) {
        if ($null -eq (Find-PdfTreeItem $columnLabel)) { throw "Aktuelle Restarbeiten-Spalte '$columnLabel' fehlt im PDF-Baum." }
    }
    foreach ($legacyColumnLabel in @("Kurztext", "Langtext", "Haus", "Geschoss", "Raum", "Status/Ampel")) {
        if ($null -ne (Find-PdfTreeItem $legacyColumnLabel)) { throw "Inaktive Restarbeiten-Einzelspalte '$legacyColumnLabel' ist noch im PDF-Baum sichtbar." }
    }
    Write-AutomationTrace "current-columns-verified"

    $listType = New-Object System.Windows.Automation.PropertyCondition(
        [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
        [System.Windows.Automation.ControlType]::ListItem
    )
    $listItems = $window.FindAll([System.Windows.Automation.TreeScope]::Descendants, $listType)
    Write-AutomationTrace "boundary-items-found:$($listItems.Count)"
    $boundaryTextType = New-Object System.Windows.Automation.PropertyCondition(
        [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
        [System.Windows.Automation.ControlType]::Text
    )
    $boundary = $null
    foreach ($item in $listItems) {
        $itemTexts = @()
        foreach ($itemText in $item.FindAll([System.Windows.Automation.TreeScope]::Descendants, $boundaryTextType)) { $itemTexts += $itemText.Current.Name }
        $candidateText = ($itemTexts -join " | ")
        Write-AutomationTrace "boundary-candidate:$($item.Current.Name):$candidateText"
        if ($item.Current.Name.Contains("table.column.number") -and $item.Current.Name.Contains("table.column.class")) { $boundary = $item; break }
    }
    if ($null -eq $boundary) { throw "Erste Restarbeiten-Spaltengrenze fehlt." }
    Select-Control $boundary
    Write-AutomationTrace "boundary-selected"
    Start-Sleep -Milliseconds 250

    $beforeTexts = @()
    $textType = New-Object System.Windows.Automation.PropertyCondition(
        [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
        [System.Windows.Automation.ControlType]::Text
    )
    foreach ($text in $window.FindAll([System.Windows.Automation.TreeScope]::Descendants, $textType)) {
        if ($text.Current.Name.Contains("mm") -and -not $text.Current.IsOffscreen) { $beforeTexts += $text.Current.Name }
    }
    Write-AutomationTrace "before-values-read"

    if ($Action -eq "PdfEditSave") {
        $move = Find-Control "PDF-Spaltengrenze nach rechts" ([System.Windows.Automation.ControlType]::Button)
        Invoke-Control $move
        Write-AutomationTrace "boundary-moved"
        Start-Sleep -Milliseconds 500
        $buttonsType = New-Object System.Windows.Automation.PropertyCondition(
            [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
            [System.Windows.Automation.ControlType]::Button
        )
        $save = $null
        foreach ($button in $window.FindAll([System.Windows.Automation.TreeScope]::Descendants, $buttonsType)) {
            if ($button.Current.Name -eq "Speichern" -and -not $button.Current.IsOffscreen -and $button.Current.IsEnabled) { $save = $button; break }
        }
        Invoke-Control $save
        Write-AutomationTrace "save-invoked"
        Start-Sleep -Milliseconds 800
        $regenerate = Find-Control "PDF neu erzeugen" ([System.Windows.Automation.ControlType]::Button)
        Invoke-Control $regenerate
        Write-AutomationTrace "pdf-regeneration-invoked"
        Start-Sleep -Milliseconds 1800
    }

    $afterTexts = @()
    foreach ($text in $window.FindAll([System.Windows.Automation.TreeScope]::Descendants, $textType)) {
        if ($text.Current.Name.Contains("mm") -and -not $text.Current.IsOffscreen) { $afterTexts += $text.Current.Name }
    }
    Write-AutomationTrace "after-values-read"
    [ordered]@{ action = $Action; table = "Restarbeiten-Tabelle"; columns = $columnLabels; boundary = "Nr | Klasse"; before = $beforeTexts; after = $afterTexts } | ConvertTo-Json -Depth 4 -Compress
    exit 0
}

if ($Action -eq "SelectTarget") {
    $selectionButton = Find-ButtonPrefix $window "Ziel in App"
    $active = $false
    for ($attempt = 0; $attempt -lt 3 -and -not $active; $attempt += 1) {
        Activate-Window $window
        Click-Control $selectionButton
        Start-Sleep -Milliseconds 500
        $textCondition = New-Object System.Windows.Automation.PropertyCondition(
            [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
            [System.Windows.Automation.ControlType]::Text
        )
        $texts = $window.FindAll([System.Windows.Automation.TreeScope]::Descendants, $textCondition)
        foreach ($text in $texts) {
            if ($text.Current.Name.StartsWith("Hover zeigt", [System.StringComparison]::Ordinal)) { $active = $true; break }
        }
    }
    if (-not $active) { throw "Sichtbarer Zielauswahl-Button hat den Auswahlmodus nicht aktiviert." }
    [ordered]@{ action = $Action; clicked = $selectionButton.Current.Name; selectionActive = $active } | ConvertTo-Json -Depth 3 -Compress
    exit 0
}

if ($Action -eq "ClickWidthMinus") {
    $typeCondition = New-Object System.Windows.Automation.PropertyCondition(
        [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
        [System.Windows.Automation.ControlType]::Button
    )
    $buttons = $window.FindAll([System.Windows.Automation.TreeScope]::Descendants, $typeCondition)
    $minusButtons = @()
    foreach ($button in $buttons) {
        $name = $button.Current.Name
        if ($name.Length -eq 1 -and ([int][char]$name[0]) -in @(45, 8722)) { $minusButtons += $button }
    }
    if ($minusButtons.Count -lt 2) { throw "Breiten-/Hoehen-Minus ist fuer das ausgewaehlte Ziel nicht sichtbar (gefunden: $($minusButtons.Count))." }
    $widthMinus = $minusButtons | Sort-Object { $_.Current.BoundingRectangle.X } | Select-Object -First 1
    Activate-Window $window
    Click-Control $widthMinus
    Start-Sleep -Milliseconds 400
    [ordered]@{ action = $Action; clicked = $widthMinus.Current.Name; characterCode = [int][char]$widthMinus.Current.Name[0]; buttonCount = $minusButtons.Count } | ConvertTo-Json -Depth 3 -Compress
    exit 0
}

if ($Action -eq "ClickWidthPlus") {
    $typeCondition = New-Object System.Windows.Automation.PropertyCondition(
        [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
        [System.Windows.Automation.ControlType]::Button
    )
    $buttons = $window.FindAll([System.Windows.Automation.TreeScope]::Descendants, $typeCondition)
    $plusButtons = @()
    foreach ($button in $buttons) {
        $name = $button.Current.Name
        if ($name.Length -eq 1 -and ([int][char]$name[0]) -eq 43) { $plusButtons += $button }
    }
    if ($plusButtons.Count -lt 2) { throw "Breiten-/Hoehen-Plus ist fuer das ausgewaehlte Ziel nicht sichtbar (gefunden: $($plusButtons.Count))." }
    $widthPlus = $plusButtons | Sort-Object { $_.Current.BoundingRectangle.X } | Select-Object -First 1
    Activate-Window $window
    Click-Control $widthPlus
    Start-Sleep -Milliseconds 400
    [ordered]@{ action = $Action; clicked = $widthPlus.Current.Name; characterCode = [int][char]$widthPlus.Current.Name[0]; buttonCount = $plusButtons.Count } | ConvertTo-Json -Depth 3 -Compress
    exit 0
}

if ($Action -eq "ReadSelection") {
    $textCondition = New-Object System.Windows.Automation.PropertyCondition(
        [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
        [System.Windows.Automation.ControlType]::Text
    )
    $texts = $window.FindAll([System.Windows.Automation.TreeScope]::Descendants, $textCondition)
    $matching = @()
    $status = @()
    foreach ($text in $texts) {
        if ($text.Current.Name.StartsWith("Fertig bis", [System.StringComparison]::Ordinal) -or
            $text.Current.Name.StartsWith("Kurztext", [System.StringComparison]::Ordinal)) { $matching += $text.Current.Name }
        if ($text.Current.Name.StartsWith("Ungespeichert", [System.StringComparison]::Ordinal) -or
            $text.Current.Name.StartsWith("Gespeichert", [System.StringComparison]::Ordinal) -or
            $text.Current.Name.StartsWith("Zuletzt", [System.StringComparison]::Ordinal)) { $status += $text.Current.Name }
    }
    [ordered]@{ action = $Action; matching = $matching; status = $status } | ConvertTo-Json -Depth 3 -Compress
    exit 0
}

if ($Action -eq "BeginClose") {
    $closeButton = Find-ButtonPrefix $window "Schlie"
    $closeName = $closeButton.Current.Name
    $closeEnabled = $closeButton.Current.IsEnabled
    if (-not $closeEnabled) { throw "Der sichtbare Schliessen-Button ist deaktiviert." }
    $windowPattern = $null
    if (-not $window.TryGetCurrentPattern([System.Windows.Automation.WindowPattern]::Pattern, [ref]$windowPattern)) {
        throw "Das sichtbare Editorfenster unterstuetzt WindowPattern.Close nicht."
    }
    $windowPattern.Close()
    [ordered]@{ action = $Action; closeRequested = $closeName; closeEnabled = $closeEnabled } | ConvertTo-Json -Depth 3 -Compress
    exit 0
}

if ($Action -eq "ClickSaveDialog") {
    $dialog = $null
    for ($attempt = 0; $attempt -lt 100 -and $null -eq $dialog; $attempt += 1) {
        $dialogHandle = [M8624Mouse]::FindWindow($ProcessId, "Ungespeicherte")
        if ($dialogHandle -ne 0) { $dialog = [System.Windows.Automation.AutomationElement]::FromHandle([IntPtr]$dialogHandle) }
        if ($null -eq $dialog) { Start-Sleep -Milliseconds 100 }
    }
    if ($null -eq $dialog) {
        $windowNames = [M8624Mouse]::WindowTitles($ProcessId)
        [ordered]@{ action = $Action; dialogFound = $false; windows = $windowNames } | ConvertTo-Json -Depth 3 -Compress
        exit 0
    }
    $saveButton = Find-ButtonPrefix $dialog "Speichern und fortfahren"
    $dialogName = $dialog.Current.Name
    $saveName = $saveButton.Current.Name
    Activate-Window $dialog
    Click-Control $saveButton
    Start-Sleep -Milliseconds 500
    [ordered]@{ action = $Action; dialogFound = $true; dialog = $dialogName; saveClicked = $saveName } | ConvertTo-Json -Depth 3 -Compress
    exit 0
}

function Describe-Control([System.Windows.Automation.AutomationElement]$Element) {
    $bounds = $Element.Current.BoundingRectangle
    [ordered]@{
        name = $Element.Current.Name
        automationId = $Element.Current.AutomationId
        controlType = $Element.Current.ControlType.ProgrammaticName
        className = $Element.Current.ClassName
        enabled = $Element.Current.IsEnabled
        bounds = [ordered]@{ x = $bounds.X; y = $bounds.Y; width = $bounds.Width; height = $bounds.Height }
    }
}

$all = $window.FindAll([System.Windows.Automation.TreeScope]::Descendants, [System.Windows.Automation.Condition]::TrueCondition)
$controls = @()
foreach ($control in $all) {
    if (-not [string]::IsNullOrWhiteSpace($control.Current.Name) -or -not [string]::IsNullOrWhiteSpace($control.Current.AutomationId)) {
        $controls += Describe-Control $control
    }
}
[ordered]@{ action = $Action; window = Describe-Control $window; controls = $controls } | ConvertTo-Json -Depth 8 -Compress
