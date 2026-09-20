; Kundenupdate: Der alte electron-builder-Uninstaller kann bei einem Update
; mit einem nichtssagenden Exit-Code abbrechen. Ein Update darf nur dann
; fortgesetzt werden, wenn der exakt ermittelte bisherige Installationsordner
; atomar gesichert werden konnte. Dadurch werden weder fremde Prozesse beendet
; noch ein echter Dateilock uebergangen.
;
; electron-builder bindet den kundenspezifischen Include auch beim separaten
; BUILD_UNINSTALLER-Lauf ein. Die Rueckfalllogik ist jedoch ausschliesslich
; Installercode; im Uninstaller darf sie weder Variablen noch Makros anlegen.
!ifndef BUILD_UNINSTALLER
Var /GLOBAL bbmUpdateFallbackBackupDir
Var /GLOBAL bbmUpdateFallbackMoved
Var /GLOBAL bbmUpdateFallbackInstallDir
!define BBM_UPDATE_BACKUP_MARKER "bbm-update-backup.marker"
!define BBM_UPDATE_COMPLETE_MARKER "bbm-update-complete.marker"

!macro customUnInstallCheckCurrentUser
  ; Wenn customInit die exakt registrierte Altinstallation bereits atomar
  ; gesichert hat, existiert der alte Uninstaller absichtlich nicht mehr am
  ; registrierten Pfad. electron-builders Standardlauf meldet dann einen
  ; Startfehler, der nur fuer diesen belegten Sicherungsfall als erledigt gilt.
  ${if} $bbmUpdateFallbackMoved == "1"
    ClearErrors
    StrCpy $R0 0
    Goto bbmUpdateFallbackDone
  ${endif}

  ${if} $R0 != 0
    ; Die Rueckfalloperation ist ausschliesslich fuer dieselbe registrierte
    ; Installation erlaubt. Bei abweichendem Pfad bleibt der Originalfehler
    ; unveraendert bestehen.
    ; installationDir gehoert zu electron-builders installUtil.nsh und ist
    ; beim frueh eingebundenen Kunden-Makro noch nicht deklariert. Den gleichen
    ; registrierten Installationspfad lesen wir daher in eine eigene Variable.
    ReadRegStr $bbmUpdateFallbackInstallDir HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation
    StrCmp "$bbmUpdateFallbackInstallDir" "$INSTDIR" 0 bbmUpdateFallbackDone

    ; Die Sicherung liegt neben der Installation, nicht im temporaeren
    ; NSIS-Verzeichnis. Ein vorhandener Sicherungsordner wird nie ersetzt.
    StrCpy $R6 "$bbmUpdateFallbackInstallDir.bbm-update-backup"
    IfFileExists "$R6\*.*" bbmUpdateFallbackDone

    ClearErrors
    Rename "$bbmUpdateFallbackInstallDir" "$R6"
    IfErrors bbmUpdateFallbackDone

    ; Nur eine von diesem Rueckfall angelegte Sicherung darf bei einem
    ; spaeteren Setup-Lauf automatisch zurueckgestellt werden.
    ClearErrors
    FileOpen $R8 "$R6\${BBM_UPDATE_BACKUP_MARKER}" w
    IfErrors bbmUpdateFallbackRestoreOld
    FileWrite $R8 "bbm customer update backup"
    FileClose $R8

    StrCpy $bbmUpdateFallbackBackupDir "$R6"
    StrCpy $bbmUpdateFallbackMoved "1"

    ; Nur ein erfolgreicher atomarer Verschiebevorgang ersetzt den Fehlercode
    ; des alten Uninstallers. Bei einem echten Prozess- oder Dateilock bleibt
    ; Rename fehlerhaft und der Standardfehler wird weiterhin ausgegeben.
    StrCpy $R0 0
    Goto bbmUpdateFallbackDone

  bbmUpdateFallbackRestoreOld:
    ClearErrors
    Rename "$R6" "$bbmUpdateFallbackInstallDir"
  ${endif}

  bbmUpdateFallbackDone:
!macroend

!macro customInit
  ; Stuerzt ein stiller NSIS-Lauf nach dem Sichern ab, bleiben die beiden
  ; Ordner erhalten. Der naechste Kunden-Setup-Lauf stellt nur eine von diesem
  ; Rueckfall markierte Sicherung vor jedem Updateversuch wieder her.
  StrCpy $bbmUpdateFallbackMoved ""
  StrCpy $bbmUpdateFallbackBackupDir ""
  StrCpy $bbmUpdateFallbackInstallDir ""
  StrCpy $R6 "$INSTDIR.bbm-update-backup"
  IfFileExists "$R6\*.*" 0 bbmPrepareRegisteredInstallation
  IfFileExists "$R6\${BBM_UPDATE_BACKUP_MARKER}" 0 bbmCustomerInitDone

  ; Eine erfolgreiche neue Installation entfernt die Sicherung regulär. Falls
  ; allein diese Bereinigung fehlgeschlagen ist, darf die neue Installation
  ; nicht zurueckgestellt werden.
  IfFileExists "$INSTDIR\${BBM_UPDATE_COMPLETE_MARKER}" 0 bbmRecoverInterruptedInstallation
  RMDir /r "$R6"
  IfErrors bbmCustomerInitDone
  Delete "$INSTDIR\${BBM_UPDATE_COMPLETE_MARKER}"
  Goto bbmPrepareRegisteredInstallation

  bbmRecoverInterruptedInstallation:
    ; Eine Teilinstallation wird nur verschoben, nie geloescht. Ein bereits
    ; vorhandener Teilinstallationsordner wird ebenfalls nicht ersetzt.
  StrCpy $R7 "$INSTDIR.bbm-update-interrupted-new"
  IfFileExists "$R7\*.*" bbmCustomerInitDone
  ClearErrors
  Rename "$INSTDIR" "$R7"

  ClearErrors
  Rename "$R6" "$INSTDIR"
  IfErrors bbmCustomerInitDone
  Delete "$INSTDIR\${BBM_UPDATE_BACKUP_MARKER}"

  bbmPrepareRegisteredInstallation:
  ; Vor electron-builders altem dateiweisen Uninstaller sichern. Dessen
  ; NSIS-3-Lauf kann bei den historisch ausgelieferten tiefen Pfaden (> MAX_PATH)
  ; abbrechen, obwohl kein BBM-Prozess mehr laeuft. Das Verzeichnis-Rename ist
  ; atomar und wird nur fuer exakt denselben registrierten Installationspfad
  ; versucht; bei jedem Fehler bleibt der Standardpfad unangetastet.
  ReadRegStr $bbmUpdateFallbackInstallDir HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation
  StrCmp "$bbmUpdateFallbackInstallDir" "$INSTDIR" 0 bbmCustomerInitDone
  IfFileExists "$bbmUpdateFallbackInstallDir\*.*" 0 bbmCustomerInitDone
  StrCpy $R6 "$bbmUpdateFallbackInstallDir.bbm-update-backup"
  IfFileExists "$R6\*.*" bbmCustomerInitDone

  ClearErrors
  Rename "$bbmUpdateFallbackInstallDir" "$R6"
  IfErrors bbmCustomerInitDone

  ClearErrors
  FileOpen $R8 "$R6\${BBM_UPDATE_BACKUP_MARKER}" w
  IfErrors bbmPrestageRestoreOld
  FileWrite $R8 "bbm customer update backup"
  FileClose $R8

  StrCpy $bbmUpdateFallbackBackupDir "$R6"
  StrCpy $bbmUpdateFallbackMoved "1"
  Goto bbmCustomerInitDone

  bbmPrestageRestoreOld:
    ClearErrors
    Rename "$R6" "$bbmUpdateFallbackInstallDir"

  bbmCustomerInitDone:
!macroend

!macro customInstall
  ; Der Standardabschnitt hat App-Dateien, Links und Registrierung erstellt.
  ; Erst jetzt darf eine erfolgreiche Aktualisierung die Sicherung entfernen.
  ${if} $bbmUpdateFallbackMoved == "1"
    IfFileExists "$INSTDIR\${APP_EXECUTABLE_FILENAME}" 0 bbmUpdateInstallDone
    ClearErrors
    FileOpen $R8 "$INSTDIR\${BBM_UPDATE_COMPLETE_MARKER}" w
    IfErrors bbmUpdateInstallDone
    FileWrite $R8 "bbm customer update complete"
    FileClose $R8

    ; Die Sicherung liegt zunaechst neben dem langen Installationspfad. Vor
    ; der rekursiven Bereinigung wird sie deshalb atomar auf den kurzen,
    ; installer-eigenen Temp-Pfad verschoben. So kann NSIS auch historische
    ; Dateien entfernen, deren alter absoluter Pfad ueber MAX_PATH lag.
    StrCpy $R6 "$PLUGINSDIR\b"
    IfFileExists "$R6\*.*" bbmUpdateInstallDone
    ClearErrors
    Rename "$bbmUpdateFallbackBackupDir" "$R6"
    IfErrors bbmUpdateInstallDone
    RMDir /r "$R6"
    IfErrors bbmUpdateInstallDone
    Delete "$INSTDIR\${BBM_UPDATE_COMPLETE_MARKER}"
  ${endif}

  bbmUpdateInstallDone:
!macroend
!endif
