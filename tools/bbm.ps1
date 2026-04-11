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
