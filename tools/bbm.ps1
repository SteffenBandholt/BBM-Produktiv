Set-StrictMode -Version Latest

function Test-BbmGitSpecialState {
    $gitDir = git rev-parse --git-dir
    if (-not $?) { return $true }

    foreach ($statePath in @(
        (Join-Path $gitDir "MERGE_HEAD"),
        (Join-Path $gitDir "REVERT_HEAD"),
        (Join-Path $gitDir "CHERRY_PICK_HEAD"),
        (Join-Path $gitDir "rebase-apply"),
        (Join-Path $gitDir "rebase-merge")
    )) {
        if (Test-Path $statePath) {
            return $true
        }
    }

    return $false
}

function Test-BbmWorkingTreeClean {
    $status = git status --short --untracked-files=all
    if (-not $?) { return $false }

    return @($status).Count -eq 0
}

function Test-BbmGitDiffExists {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Paths,

        [switch]$Cached
    )

    if ($Paths.Count -eq 0) {
        return $false
    }

    if ($Cached) {
        git diff --cached --quiet -- @Paths
    } else {
        git diff --quiet -- @Paths
    }

    $exitCode = $LASTEXITCODE
    if ($exitCode -gt 1) { return $false }

    return $exitCode -eq 1
}

function Test-BbmLocalBranchExists {
    param(
        [Parameter(Mandatory = $true)]
        [string]$BranchName
    )

    $existingBranch = git branch --list -- $BranchName
    if (-not $?) { return $false }

    return [bool]$existingBranch
}

function Start-BbmPackage {
    param(
        [Parameter(Mandatory = $true)]
        [string]$BranchName
    )

    if (Test-BbmGitSpecialState) {
        Write-Host "Git-Sonderzustand aktiv. Bitte Merge/Rebase/Cherry-Pick/Revert zuerst abschliessen oder abbrechen."
        return
    }

    if (-not (Test-BbmWorkingTreeClean)) {
        Write-Host "Working Tree ist nicht sauber. Bitte uncommittete, unstaged oder untracked Aenderungen zuerst bereinigen."
        return
    }

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

function bbm-start {
    if (Test-BbmGitSpecialState) {
        Write-Host "Git-Sonderzustand aktiv. Bitte Merge/Rebase/Cherry-Pick/Revert zuerst abschliessen oder abbrechen."
        return
    }

    if (-not (Test-BbmWorkingTreeClean)) {
        Write-Host "Working Tree ist nicht sauber. Bitte uncommittete, unstaged oder untracked Aenderungen zuerst bereinigen."
        return
    }

    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $baseBranchName = "phase12-$timestamp"

    for ($suffix = 0; $suffix -le 9; $suffix++) {
        $branchName = if ($suffix -eq 0) {
            $baseBranchName
        } else {
            "$baseBranchName-$suffix"
        }

        if (Test-BbmLocalBranchExists -BranchName $branchName) {
            continue
        }

        Start-BbmPackage -BranchName $branchName
        if (-not $?) { return }

        $currentBranch = git branch --show-current
        if (-not $?) { return }

        if ($currentBranch -eq $branchName) {
            Write-Host "Branch angelegt: $branchName"
            Write-Host "Den Paketinhalt klaeren wir danach im Chat."
            return
        }

        if (Test-BbmLocalBranchExists -BranchName $branchName) {
            continue
        }

        Write-Host "bbm-start konnte den Branch nicht anlegen. Bitte Git-Zustand pruefen."
        return
    }

    Write-Host "Kein freier Branchname gefunden. Bitte spaeter erneut versuchen."
}

function Show-BbmProof {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Files,

        [string[]]$NewFiles = @()
    )

    $fileList = @($Files | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
    $newFileList = @($NewFiles | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })

    if (($fileList.Count -eq 0) -and ($newFileList.Count -eq 0)) {
        Write-Host "Keine gueltigen Dateien fuer die BBM-Pruefung uebergeben."
        return
    }

    git status --short
    if (-not $?) { return }

    if ($fileList.Count -gt 0) {
        if (Test-BbmGitDiffExists -Paths $fileList) {
            git diff --stat -- @fileList
            if (-not $?) { return }

            git diff -- @fileList
            if (-not $?) { return }
        } else {
            Write-Host "Keine unstaged Diffs fuer die angegebenen Files gefunden."
        }
    }

    if ($newFileList.Count -gt 0) {
        if (Test-BbmGitDiffExists -Paths $newFileList -Cached) {
            git diff --cached --stat -- @newFileList
            if (-not $?) { return }

            git diff --cached -- @newFileList
            if (-not $?) { return }
        } else {
            Write-Host "Keine cached Diffs fuer die angegebenen NewFiles gefunden."
        }
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
    Write-Output "* Paketname: $PackageName"
    Write-Output "* Container: $Container"
    Write-Output "* Ziel: $Goal"
    Write-Output "* Nicht-Ziele:"
    foreach ($nonGoal in $NonGoals) {
        Write-Output "  * $nonGoal"
    }
    Write-Output ""
    Write-Output "## Git-Start"
    Write-Output '```powershell'
    Write-Output "git switch main"
    Write-Output "git pull"
    Write-Output "git switch -c $BranchName"
    Write-Output '```'
    Write-Output ""
    Write-Output "## Codex-Empfehlung"
    Write-Output "Codex-Modell: $CodexModel"
    Write-Output "Reasoning: $Reasoning"
    Write-Output "Begruendung: $Justification"
    Write-Output ""
    Write-Output "## Codex-Prompt"
    Write-Output '```text'
    Write-Output $CodexPrompt
    Write-Output '```'
    Write-Output ""
    Write-Output "## Git-Pruefbefehle"
    Write-Output '```powershell'
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

    Write-Output '```'
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

    if (Test-BbmGitSpecialState) {
        Write-Host "Git-Sonderzustand aktiv. Bitte Merge/Rebase/Cherry-Pick/Revert zuerst abschliessen oder abbrechen."
        return
    }

    $fileStatus = git status --short --untracked-files=all -- @Files
    if (-not $?) { return }

    if (-not $fileStatus) {
        Write-Host "Keine Aenderungen in den angegebenen Dateien gefunden."
        return
    }

    git add -- @Files
    if (-not $?) { return }

    git commit -m $CommitMessage
    if (-not $?) { return }

    if (-not (Test-BbmWorkingTreeClean)) {
        Write-Host "Working Tree ist nach dem Commit nicht sauber. Bitte vor dem Switch bereinigen."
        return
    }

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
