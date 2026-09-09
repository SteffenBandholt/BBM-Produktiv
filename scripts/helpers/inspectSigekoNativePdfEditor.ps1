param(
  [Parameter(Mandatory=$true)][int]$ManagerProcessId,
  [Parameter(Mandatory=$true)][string]$ReportPath,
  [Parameter(Mandatory=$true)][string]$ScreenshotPath
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$root = [System.Windows.Automation.AutomationElement]::RootElement
$processCondition = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ProcessIdProperty, $ManagerProcessId)
$tabCondition = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::TabItem)
$deadline = [DateTime]::UtcNow.AddSeconds(30)
$window = $null
$tab = $null
while ([DateTime]::UtcNow -lt $deadline -and $null -eq $tab) {
  $windows = $root.FindAll([System.Windows.Automation.TreeScope]::Children, $processCondition)
  foreach ($candidate in $windows) {
    $tabs = $candidate.FindAll([System.Windows.Automation.TreeScope]::Descendants, $tabCondition)
    foreach ($candidateTab in $tabs) {
      if ($candidateTab.Current.Name -eq 'PDF-Ausgabe') { $window = $candidate; $tab = $candidateTab; break }
    }
    if ($null -ne $tab) { break }
  }
  if ($null -eq $tab) { Start-Sleep -Milliseconds 150 }
}
if ($null -eq $tab) { throw 'Production editor exposes no PDF-Ausgabe tab in the launched manager process.' }
$selection = [System.Windows.Automation.SelectionItemPattern]$tab.GetCurrentPattern([System.Windows.Automation.SelectionItemPattern]::Pattern)
$selection.Select()
if (-not $selection.Current.IsSelected) { throw 'Native PDF-Ausgabe tab was not selected.' }
$contentDeadline = [DateTime]::UtcNow.AddSeconds(15)
$visibleNames = @()
do {
  $all = $window.FindAll([System.Windows.Automation.TreeScope]::Descendants, [System.Windows.Automation.Condition]::TrueCondition)
  $visibleNames = @($all | Where-Object { -not $_.Current.IsOffscreen -and $_.Current.Name } | ForEach-Object { $_.Current.Name } | Select-Object -Unique)
  $populated = ($visibleNames -contains 'PDF neu erzeugen') -and @($visibleNames | Where-Object { $_ -like '*Vorank*' }).Count -gt 0
  if (-not $populated) { Start-Sleep -Milliseconds 150 }
} while (-not $populated -and [DateTime]::UtcNow -lt $contentDeadline)
if (-not $populated) { throw ('Native PDF editor has no active pre-notification registry: ' + ($visibleNames -join ' | ')) }
$desktop = [System.Windows.Forms.SystemInformation]::VirtualScreen
$bitmap = New-Object System.Drawing.Bitmap($desktop.Width, $desktop.Height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
try {
  $graphics.CopyFromScreen($desktop.Left, $desktop.Top, 0, 0, $bitmap.Size)
  $bitmap.Save($ScreenshotPath, [System.Drawing.Imaging.ImageFormat]::Png)
} finally { $graphics.Dispose(); $bitmap.Dispose() }
@{ verified = $true; processId = $ManagerProcessId; windowTitle = $window.Current.Name; selectedTab = $tab.Current.Name;
   selected = $selection.Current.IsSelected; visibleNames = $visibleNames; screenshot = [System.IO.Path]::GetFileName($ScreenshotPath);
   scope = 'Actual production native window and tab selection; layout regeneration is verified separately.' } |
  ConvertTo-Json -Depth 5 | Set-Content -Path $ReportPath -Encoding UTF8
