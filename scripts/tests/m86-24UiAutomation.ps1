param(
    [Parameter(Mandatory = $true)][int]$ProcessId,
    [ValidateSet("Dump", "SelectTarget", "ReadSelection", "ClickWidthMinus", "ClickWidthPlus", "ClickHeightMinus", "ClickHeightPlus", "ClickSave", "BeginClose", "ClickSaveDialog", "RestarbeitenSave")][string]$Action = "Dump",
    [ValidateRange(1, 300)][int]$Count = 1
)

Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
Add-Type @"
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;
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
    for ($index = 0; $index -lt $Count; $index += 1) {
        Click-Control $widthMinus
        if ($Count -gt 1) { Start-Sleep -Milliseconds 75 }
    }
    Start-Sleep -Milliseconds 400
    [ordered]@{ action = $Action; clicked = $widthMinus.Current.Name; clickCount = $Count; characterCode = [int][char]$widthMinus.Current.Name[0]; buttonCount = $minusButtons.Count } | ConvertTo-Json -Depth 3 -Compress
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
    for ($index = 0; $index -lt $Count; $index += 1) {
        Click-Control $widthPlus
        if ($Count -gt 1) { Start-Sleep -Milliseconds 75 }
    }
    Start-Sleep -Milliseconds 400
    [ordered]@{ action = $Action; clicked = $widthPlus.Current.Name; clickCount = $Count; characterCode = [int][char]$widthPlus.Current.Name[0]; buttonCount = $plusButtons.Count } | ConvertTo-Json -Depth 3 -Compress
    exit 0
}

if ($Action -eq "ClickHeightMinus") {
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
    if ($minusButtons.Count -lt 2) { throw "Hoehen-Minus ist fuer das ausgewaehlte Ziel nicht sichtbar (gefunden: $($minusButtons.Count))." }
    $heightMinus = $minusButtons | Sort-Object { $_.Current.BoundingRectangle.X } | Select-Object -Last 1
    Activate-Window $window
    for ($index = 0; $index -lt $Count; $index += 1) {
        Click-Control $heightMinus
        if ($Count -gt 1) { Start-Sleep -Milliseconds 75 }
    }
    Start-Sleep -Milliseconds 400
    [ordered]@{ action = $Action; clicked = $heightMinus.Current.Name; clickCount = $Count; characterCode = [int][char]$heightMinus.Current.Name[0]; buttonCount = $minusButtons.Count } | ConvertTo-Json -Depth 3 -Compress
    exit 0
}

if ($Action -eq "ClickHeightPlus") {
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
    if ($plusButtons.Count -lt 2) { throw "Hoehen-Plus ist fuer das ausgewaehlte Ziel nicht sichtbar (gefunden: $($plusButtons.Count))." }
    $heightPlus = $plusButtons | Sort-Object { $_.Current.BoundingRectangle.X } | Select-Object -Last 1
    Activate-Window $window
    for ($index = 0; $index -lt $Count; $index += 1) {
        Click-Control $heightPlus
        if ($Count -gt 1) { Start-Sleep -Milliseconds 75 }
    }
    Start-Sleep -Milliseconds 400
    [ordered]@{ action = $Action; clicked = $heightPlus.Current.Name; clickCount = $Count; characterCode = [int][char]$heightPlus.Current.Name[0]; buttonCount = $plusButtons.Count } | ConvertTo-Json -Depth 3 -Compress
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
            $text.Current.Name.StartsWith("Kurztext", [System.StringComparison]::Ordinal) -or
            $text.Current.Name.StartsWith("Nachkommastellen verringern", [System.StringComparison]::Ordinal) -or
            $text.Current.Name.StartsWith("Nachkommastellen erh", [System.StringComparison]::Ordinal) -or
            $text.Current.Name.StartsWith("+Position", [System.StringComparison]::Ordinal) -or
            $text.Current.Name.StartsWith("Proberechnung", [System.StringComparison]::Ordinal)) { $matching += $text.Current.Name }
        if ($text.Current.Name.StartsWith("Ungespeichert", [System.StringComparison]::Ordinal) -or
            $text.Current.Name.StartsWith("Gespeichert", [System.StringComparison]::Ordinal) -or
            $text.Current.Name.StartsWith("Zuletzt", [System.StringComparison]::Ordinal)) { $status += $text.Current.Name }
    }
    [ordered]@{ action = $Action; matching = $matching; status = $status } | ConvertTo-Json -Depth 3 -Compress
    exit 0
}

if ($Action -eq "ClickSave") {
    $buttonCondition = New-Object System.Windows.Automation.PropertyCondition(
        [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
        [System.Windows.Automation.ControlType]::Button
    )
    $buttons = $window.FindAll([System.Windows.Automation.TreeScope]::Descendants, $buttonCondition)
    $saveButton = $null
    foreach ($button in $buttons) {
        if ($button.Current.Name -eq "Speichern" -and $button.Current.IsEnabled -and -not $button.Current.IsOffscreen) { $saveButton = $button; break }
    }
    if ($null -eq $saveButton) { throw "Der sichtbare Speichern-Button ist nicht verfuegbar." }
    Activate-Window $window
    Click-Control $saveButton
    Start-Sleep -Milliseconds 1000
    [ordered]@{ action = $Action; clicked = $saveButton.Current.Name; enabled = $saveButton.Current.IsEnabled } | ConvertTo-Json -Depth 3 -Compress
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
