Set-StrictMode -Version Latest

function Start-BbmPackage {
    param(
        [Parameter(Mandatory = $true)]
        [string]$BranchName
    )

    git switch main
    if (-not $?) { return }

    git pull
    if (-not $?) { return }

    $existingBranch = git branch --list -- $BranchName
    if (-not $?) { return }

    if ($existingBranch) {
        Write-Host "Branch existiert bereits: $BranchName"
        Write-Host "Wechsle mit: git switch $BranchName"
        return
    }

    git switch -c $BranchName
    if (-not $?) { return }
}

function Show-BbmProof {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Files,

        [string[]]$NewFiles = @()
    )

    git status --short
    if (-not $?) { return }

    if ($Files.Count -gt 0) {
        git diff --stat -- @Files
        if (-not $?) { return }

        git diff -- @Files
        if (-not $?) { return }
    }

    if ($NewFiles.Count -gt 0) {
        git diff --cached --stat -- @NewFiles
        if (-not $?) { return }

        git diff --cached -- @NewFiles
    }
}

function Show-BbmPromptBlock {
    param(
        [Parameter(Mandatory = $true)]
        [string]$PackageName,

        [Parameter(Mandatory = $true)]
        [string]$Container,

        [Parameter(Mandatory = $true)]
        [string]$Goal,

        [Parameter(Mandatory = $true)]
        [string[]]$NonGoals,

        [Parameter(Mandatory = $true)]
        [string]$BranchName,

        [Parameter(Mandatory = $true)]
        [string]$CodexModel,

        [Parameter(Mandatory = $true)]
        [string]$Reasoning,

        [Parameter(Mandatory = $true)]
        [string]$Justification,

        [string]$CodexPrompt = "",

        [string[]]$ProofFiles = @(),

        [string[]]$ProofNewFiles = @()
    )

    Write-Output "### Repo-Abgleich"
    Write-Output "* noch offen"
    Write-Output "* vor Paketstart nicht geprueft"
    Write-Output ""
    Write-Output "### 3-Schritte-Kurzfahrplan"
    Write-Output "1. ..."
    Write-Output "2. ..."
    Write-Output "3. ..."
    Write-Output ""
    Write-Output "### Aktives Paket"
    Write-Output "- Paketname: $PackageName"
    Write-Output "- Container: $Container"
    Write-Output "- Ziel: $Goal"
    Write-Output "- Nicht-Ziele:"

    foreach ($nonGoal in $NonGoals) {
        Write-Output "  * $nonGoal"
    }

    Write-Output ""
    Write-Output "## Git-Start"
    Write-Output "git switch main"
    Write-Output "git pull"
    Write-Output "git switch -c $BranchName"
    Write-Output ""
    Write-Output "## Codex-Empfehlung"
    Write-Output "Codex-Modell: $CodexModel"
    Write-Output "Reasoning: $Reasoning"
    Write-Output "Begruendung: $Justification"
    Write-Output ""
    Write-Output "## Codex-Prompt"
    Write-Output "```text"
    Write-Output $CodexPrompt
    Write-Output "```"
    Write-Output ""
    Write-Output "## Git-Pruefbefehle"
    Write-Output "```powershell"
    Write-Output "git status --short"

    if ($ProofFiles.Count -gt 0) {
        $proofFilesLine = $ProofFiles -join " "
        Write-Output "git diff --stat -- $proofFilesLine"
        Write-Output "git diff -- $proofFilesLine"
    }

    if ($ProofNewFiles.Count -gt 0) {
        $proofNewFilesLine = $ProofNewFiles -join " "
        Write-Output "git diff --cached --stat -- $proofNewFilesLine"
        Write-Output "git diff --cached -- $proofNewFilesLine"
    }

    Write-Output "```"
}

function Complete-BbmPackage {
    param(
        [Parameter(Mandatory = $true)]
        [string]$BranchName,

        [Parameter(Mandatory = $true)]
        [string]$CommitMessage,

        [Parameter(Mandatory = $true)]
        [string[]]$Files
    )

    $currentBranch = git branch --show-current
    if (-not $?) { return }

    if ($currentBranch -ne $BranchName) {
        Write-Host "Falscher Branch aktiv: $currentBranch"
        Write-Host "Erwartet wird: $BranchName"
        Write-Host "Wechsle mit: git switch $BranchName"
        return
    }

    git add -- @Files
    if (-not $?) { return }

    git commit -m $CommitMessage
    if (-not $?) { return }

    git switch main
    if (-not $?) { return }

    git pull
    if (-not $?) { return }

    git merge --no-ff $BranchName -m "Merge branch '$BranchName'"
    if (-not $?) { return }

    git push origin main
    if (-not $?) { return }
}

function Reset-BbmPackageChanges {
    git restore .
    if (-not $?) { return }

    git restore --staged .
    if (-not $?) { return }

    git status --short
}
