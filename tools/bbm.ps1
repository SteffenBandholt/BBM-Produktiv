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

    git switch -c $BranchName
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
}

function Reset-BbmPackageChanges {
    git restore .
    git restore --staged .
    git status --short
}