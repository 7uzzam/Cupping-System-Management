; ═══════════════════════════════════════════════════════════════════════════
; NajjarTech — Hijama Management System
; Custom NSIS installer / uninstaller (electron-builder assisted)
; ═══════════════════════════════════════════════════════════════════════════

!include "LogicLib.nsh"
!include "WinMessages.nsh"
!include "FileFunc.nsh"
!include "installer-branding.nsh"

; User data folder — must match electron/main.js USER_DATA_FOLDER
!define NT_USER_DATA_NAME "Cupping Center"
!define NT_APP_EXE "Hijama Management System.exe"

Var NT_UninstallMode
; 0 = program only (keep data)   1 = complete removal

Var NT_InstallMode
; 0 = update (keep data)
; 1 = clean install + wipe data after local backup
; 2 = clean install + keep data (reinstall app only)

Var NT_BackupPath

; ─── Kill running app before deleting locked userData ───
!macro NT_KillAppProcessBody
  DetailPrint "Stopping ${NT_APP_EXE} if running..."
  nsExec::ExecToLog 'taskkill /F /IM "${NT_APP_EXE}" /T'
  Pop $0
  Sleep 1500
!macroend

Function un.NT_KillAppProcess
  !insertmacro NT_KillAppProcessBody
FunctionEnd

Function NT_KillAppProcess
  !insertmacro NT_KillAppProcessBody
FunctionEnd

!macro NT_ForceRemoveDirBody
  Push $R9
  StrCpy $R9 0
nt_fr_retry:
  IfFileExists "$R8\*.*" 0 nt_fr_done
    RMDir /r /REBOOTOK "$R8"
    IntOp $R9 $R9 + 1
    IntCmp $R9 3 nt_fr_done nt_fr_retry nt_fr_done
    Sleep 800
    Goto nt_fr_retry
nt_fr_done:
  Pop $R9
!macroend

Function NT_ForceRemoveDirImpl
  Pop $R8
  !insertmacro NT_ForceRemoveDirBody
FunctionEnd

Function un.NT_ForceRemoveDirImpl
  Pop $R8
  !insertmacro NT_ForceRemoveDirBody
FunctionEnd

!macro NT_ForceRemoveDir PATH
  Push "${PATH}"
  Call NT_ForceRemoveDirImpl
!macroend

!macro unNT_ForceRemoveDir PATH
  Push "${PATH}"
  Call un.NT_ForceRemoveDirImpl
!macroend

; ─── Backup user data before clean install (rename — frees canonical path) ───
Function NT_BackupUserData
  Push $R2
  Push $R3
  Push $R4
  Push $R5
  Push $R6
  Push $R7
  Push $R8
  StrCpy $NT_BackupPath ""
  IfFileExists "$APPDATA\${NT_USER_DATA_NAME}\*.*" 0 nt_backup_skip
    ${GetTime} "" "L" $R2 $R3 $R4 $R5 $R6 $R7 $R8
    StrCpy $NT_BackupPath "$APPDATA\${NT_USER_DATA_NAME}-preinstall-archived-$R4$R3$R2-$R6$R7"
    ClearErrors
    Rename "$APPDATA\${NT_USER_DATA_NAME}" "$NT_BackupPath"
    IfErrors 0 nt_backup_renamed
      CreateDirectory "$NT_BackupPath"
      DetailPrint "Rename failed — copying user data to $NT_BackupPath"
      CopyFiles /SILENT "$APPDATA\${NT_USER_DATA_NAME}\*" "$NT_BackupPath\"
      !insertmacro NT_ForceRemoveDir "$APPDATA\${NT_USER_DATA_NAME}"
      Goto nt_backup_done
    nt_backup_renamed:
      DetailPrint "User data archived (renamed) to: $NT_BackupPath"
    nt_backup_done:
  nt_backup_skip:
  Pop $R8
  Pop $R7
  Pop $R6
  Pop $R5
  Pop $R4
  Pop $R3
  Pop $R2
FunctionEnd

; ─── Wipe user data for fresh start (only if backup/rename failed) ───
Function NT_WipeUserDataForCleanInstall
  Call NT_KillAppProcess
  IfFileExists "$APPDATA\${NT_USER_DATA_NAME}\*.*" 0 nt_wipe_legacy_only
    !insertmacro NT_ForceRemoveDir "$APPDATA\${NT_USER_DATA_NAME}"
  nt_wipe_legacy_only:
  !insertmacro NT_ForceRemoveDir "$LOCALAPPDATA\${NT_USER_DATA_NAME}"
  !insertmacro NT_ForceRemoveDir "$APPDATA\com.tadawi.cuppingcenter"
  !insertmacro NT_ForceRemoveDir "$LOCALAPPDATA\com.tadawi.cuppingcenter"
  !insertmacro NT_ForceRemoveDir "$APPDATA\Hijama Management System"
  !insertmacro NT_ForceRemoveDir "$LOCALAPPDATA\Hijama Management System"
FunctionEnd

; ─── Installer: existing version check ───
Function NT_ChooseInstallMode
  ReadRegStr $R0 HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" "UninstallString"
  StrCmp $R0 "" 0 nt_im_found
  ReadRegStr $R0 HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" "UninstallString"
  StrCmp $R0 "" nt_im_done
nt_im_found:
  ReadRegStr $R1 HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" "DisplayVersion"
  StrCmp $R1 "" 0 nt_im_prompt
  ReadRegStr $R1 HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" "DisplayVersion"
  StrCmp $R1 "" 0 nt_im_prompt
  StrCpy $R1 "?"
nt_im_prompt:
  ; Silent /S installs cannot show dialogs — default to update (preserve data)
  IfSilent nt_im_update nt_im_prompt_gui
nt_im_prompt_gui:
  MessageBox MB_YESNO|MB_ICONQUESTION "Existing version $R1 found.$\r$\n$\r$\nYES = Update and keep all data$\r$\nNO = Clean install with local backup first" IDYES nt_im_update IDNO nt_im_clean
  Abort

nt_im_update:
  StrCpy $NT_InstallMode "0"
  Return

nt_im_clean:
  Call NT_BackupUserData
  StrCmp $NT_BackupPath "" 0 nt_im_clean_backup
  MessageBox MB_OK|MB_ICONINFORMATION "No user data folder found - proceeding with fresh install."
  StrCpy $NT_InstallMode "1"
  Return

nt_im_clean_backup:
  DetailPrint "Backup saved to: $NT_BackupPath"
  MessageBox MB_YESNO|MB_ICONQUESTION "Backup completed.$\r$\nSee install log for folder path.$\r$\n$\r$\nYES = Fresh start - wipe data, backup kept$\r$\nNO = Keep data - reinstall app only" IDYES nt_im_wipe IDNO nt_im_keep
  Abort

nt_im_wipe:
  StrCpy $NT_InstallMode "1"
  Return

nt_im_keep:
  StrCpy $NT_InstallMode "2"
  Return

nt_im_done:
FunctionEnd

!macro customInit
  StrCpy $NT_InstallMode "0"
  StrCpy $NT_BackupPath ""
  Call NT_ChooseInstallMode
!macroend

!macro customWelcomePage
  !define MUI_WELCOMEPAGE_TITLE "${BRAND_WELCOME_TITLE}"
  !define MUI_WELCOMEPAGE_TITLE_3LINES
  !define MUI_WELCOMEPAGE_TEXT "${BRAND_WELCOME_TEXT}"
  !insertmacro MUI_PAGE_WELCOME
!macroend

!macro customFinishPage
  !define MUI_FINISHPAGE_TITLE "${BRAND_FINISH_TITLE}"
  !define MUI_FINISHPAGE_TEXT "${BRAND_FINISH_TEXT}"
  !define MUI_FINISHPAGE_RUN
  !define MUI_FINISHPAGE_RUN_TEXT "${BRAND_FINISH_RUN}"
  !insertmacro MUI_PAGE_FINISH
!macroend

!macro customInstall
  DetailPrint "Installing ${BRAND_PRODUCT} - ${BRAND_COMPANY}"
  ${If} $NT_InstallMode == "1"
    Call NT_WipeUserDataForCleanInstall
    ${If} $NT_BackupPath != ""
      DetailPrint "Previous data backed up at: $NT_BackupPath"
    ${EndIf}
  ${EndIf}
!macroend

!macro customUnWelcomePage
  !define MUI_WELCOMEPAGE_TITLE "Uninstall Hijama Management System"
  !define MUI_WELCOMEPAGE_TEXT "Remove the program.$\r$\n$\r$\nLicense data is ALWAYS permanently deleted on uninstall.$\r$\nCenter business data can be archived to a folder named CenterName-Date under AppData."
  !insertmacro MUI_UNPAGE_WELCOME
!macroend

Function un.NT_ChooseUninstallMode
  StrCpy $NT_UninstallMode "0"
  ; Silent /S uninstall — archive center data, always wipe license (default)
  IfSilent nt_un_keep nt_un_interactive
nt_un_interactive:
  MessageBox MB_YESNO|MB_ICONQUESTION "Remove Hijama Management System from this computer?$\r$\n$\r$\nLicense data will ALWAYS be permanently deleted." IDYES nt_un_step2 IDNO nt_un_abort

nt_un_step2:
  MessageBox MB_YESNO|MB_ICONQUESTION "Archive center business data?$\r$\n$\r$\nYES = Save center data to AppData\CenterName-Date (license removed from archive)$\r$\nNO = Delete ALL data with no archive" IDYES nt_un_keep IDNO nt_un_complete

  nt_un_keep:
    StrCpy $NT_UninstallMode "0"
    Return

  nt_un_complete:
    StrCpy $NT_UninstallMode "1"
    Return

  nt_un_abort:
    Abort
FunctionEnd

!macro customUnInit
  StrCpy $NT_UninstallMode "0"
  Call un.NT_ChooseUninstallMode
!macroend

Function un.NT_RunUninstallPrep
  Push $R0
  Push $R1
  Call un.NT_KillAppProcess
  Sleep 1000
  Call un.NT_KillAppProcess
  StrCpy $R0 "1"
  StrCpy $NT_BackupPath ""
  IfFileExists "$INSTDIR\${NT_APP_EXE}" 0 nt_prep_skip
    StrCpy $R1 '"$INSTDIR\${NT_APP_EXE}" --uninstall-prep'
    ${If} $NT_UninstallMode == "1"
      StrCpy $R1 '"$INSTDIR\${NT_APP_EXE}" --uninstall-prep --uninstall-full'
    ${EndIf}
    DetailPrint "Running license wipe and center archive: $R1"
    nsExec::ExecToLog $R1
    Pop $R0
    DetailPrint "Uninstall prep exit code: $R0"
  nt_prep_skip:
  Pop $R1
  Exch $R0
FunctionEnd

Function un.NT_ArchiveOneFolder
  ; $R7 = source path, $R6 = archive suffix timestamp
  Push $R5
  IfFileExists "$R7\*.*" 0 nt_aof_done
    StrCpy $R5 "$R7-archived-$R6"
    ClearErrors
    Rename "$R7" "$R5"
    IfErrors 0 nt_aof_renamed
      CreateDirectory "$R5"
      CopyFiles /SILENT "$R7\*.*" "$R5\"
      RMDir /r /REBOOTOK "$R7"
    nt_aof_renamed:
    DetailPrint "Archived: $R5"
    StrCmp $NT_BackupPath "" 0 nt_aof_done
    StrCpy $NT_BackupPath "$R5"
  nt_aof_done:
  Pop $R5
FunctionEnd

Function un.NT_ForceWipeAllUserData
  Call un.NT_KillAppProcess
  Sleep 1200
  Call un.NT_KillAppProcess
  Sleep 800
  Call un.NT_KillAppProcess
  DetailPrint "Force-removing all known userData folders (license must not survive)..."

  !insertmacro unNT_ForceRemoveDir "$APPDATA\${NT_USER_DATA_NAME}"
  !insertmacro unNT_ForceRemoveDir "$LOCALAPPDATA\${NT_USER_DATA_NAME}"
  !insertmacro unNT_ForceRemoveDir "$APPDATA\com.tadawi.cuppingcenter"
  !insertmacro unNT_ForceRemoveDir "$LOCALAPPDATA\com.tadawi.cuppingcenter"
  !insertmacro unNT_ForceRemoveDir "$APPDATA\Hijama Management System"
  !insertmacro unNT_ForceRemoveDir "$LOCALAPPDATA\Hijama Management System"
  !insertmacro unNT_ForceRemoveDir "$APPDATA\NajjarTech"
  !insertmacro unNT_ForceRemoveDir "$LOCALAPPDATA\NajjarTech"
  !insertmacro unNT_ForceRemoveDir "$APPDATA\hijama-management-system"
  !insertmacro unNT_ForceRemoveDir "$LOCALAPPDATA\hijama-management-system"
  !insertmacro unNT_ForceRemoveDir "$DOCUMENTS\Hijama Management System"
  !insertmacro unNT_ForceRemoveDir "$DOCUMENTS\Cupping Center"

  !ifdef APP_PRODUCT_FILENAME
    !insertmacro unNT_ForceRemoveDir "$APPDATA\${APP_PRODUCT_FILENAME}"
    !insertmacro unNT_ForceRemoveDir "$LOCALAPPDATA\${APP_PRODUCT_FILENAME}"
  !endif

  !ifdef APP_PACKAGE_NAME
    !insertmacro unNT_ForceRemoveDir "$APPDATA\${APP_PACKAGE_NAME}"
    !insertmacro unNT_ForceRemoveDir "$LOCALAPPDATA\${APP_PACKAGE_NAME}"
  !endif

  ; Verify canonical license path is gone — retry once if still present
  IfFileExists "$APPDATA\${NT_USER_DATA_NAME}\*.*" 0 nt_fw_verify_ok
    DetailPrint "WARNING: $APPDATA\${NT_USER_DATA_NAME} still present — retrying wipe..."
    Call un.NT_KillAppProcess
    Sleep 1500
    !insertmacro unNT_ForceRemoveDir "$APPDATA\${NT_USER_DATA_NAME}"
    !insertmacro unNT_ForceRemoveDir "$LOCALAPPDATA\${NT_USER_DATA_NAME}"
  nt_fw_verify_ok:
FunctionEnd

Function un.NT_RemoveAppDataIfNeeded
  Push $R0
  Call un.NT_RunUninstallPrep
  Pop $R0
  ; Always force-delete active userData paths — prep alone may fail on locked LevelDB files
  Call un.NT_ForceWipeAllUserData
  IntCmp $R0 0 nt_un_prep_ok nt_un_prep_fallback nt_un_prep_fallback

nt_un_prep_ok:
  DetailPrint "License wiped; center data archived if requested."
  ; Second pass in case a late write recreated the folder
  Call un.NT_ForceWipeAllUserData
  Return

nt_un_prep_fallback:
  DetailPrint "Uninstall prep failed ($R0) — falling back to folder archive/remove..."

  Call un.NT_KillAppProcess
  Sleep 800
  Call un.NT_KillAppProcess

  ${If} $NT_UninstallMode == "1"
    ; Full removal requested — do NOT archive leftovers; force-delete only
    DetailPrint "Full removal mode — deleting leftovers without archive..."
    Call un.NT_ForceWipeAllUserData
    Goto nt_un_fallback_done
  ${EndIf}

  Push $R0
  Push $R1
  Push $R2
  Push $R3
  Push $R4
  Push $R5
  Push $R6
  Push $R7
  StrCpy $NT_BackupPath ""
  ${GetTime} "" "L" $R0 $R1 $R2 $R3 $R4 $R5 $R6
  StrCpy $R6 "$R2$R1$R0-$R4$R5"

  StrCpy $R7 "$APPDATA\${NT_USER_DATA_NAME}"
  Call un.NT_ArchiveOneFolder

  StrCpy $R7 "$LOCALAPPDATA\${NT_USER_DATA_NAME}"
  Call un.NT_ArchiveOneFolder

  StrCpy $R7 "$APPDATA\com.tadawi.cuppingcenter"
  Call un.NT_ArchiveOneFolder

  StrCpy $R7 "$LOCALAPPDATA\com.tadawi.cuppingcenter"
  Call un.NT_ArchiveOneFolder

  StrCpy $R7 "$APPDATA\Hijama Management System"
  Call un.NT_ArchiveOneFolder

  StrCpy $R7 "$LOCALAPPDATA\Hijama Management System"
  Call un.NT_ArchiveOneFolder

  StrCpy $R7 "$APPDATA\NajjarTech"
  Call un.NT_ArchiveOneFolder

  StrCpy $R7 "$LOCALAPPDATA\NajjarTech"
  Call un.NT_ArchiveOneFolder

  StrCpy $R7 "$APPDATA\hijama-management-system"
  Call un.NT_ArchiveOneFolder

  StrCpy $R7 "$LOCALAPPDATA\hijama-management-system"
  Call un.NT_ArchiveOneFolder

  StrCpy $R7 "$DOCUMENTS\Hijama Management System"
  Call un.NT_ArchiveOneFolder

  StrCpy $R7 "$DOCUMENTS\Cupping Center"
  Call un.NT_ArchiveOneFolder

  !ifdef APP_PRODUCT_FILENAME
    StrCpy $R7 "$APPDATA\${APP_PRODUCT_FILENAME}"
    Call un.NT_ArchiveOneFolder
    StrCpy $R7 "$LOCALAPPDATA\${APP_PRODUCT_FILENAME}"
    Call un.NT_ArchiveOneFolder
  !endif

  !ifdef APP_PACKAGE_NAME
    StrCpy $R7 "$APPDATA\${APP_PACKAGE_NAME}"
    Call un.NT_ArchiveOneFolder
    StrCpy $R7 "$LOCALAPPDATA\${APP_PACKAGE_NAME}"
    Call un.NT_ArchiveOneFolder
  !endif

  Pop $R7
  Pop $R6
  Pop $R5
  Pop $R4
  Pop $R3
  Pop $R2
  Pop $R1
  Pop $R0

  !ifdef APP_ID
    DeleteRegKey HKCU "Software\${APP_ID}"
  !endif
  !ifdef APP_GUID
    DeleteRegKey HKCU "Software\Classes\${APP_GUID}"
  !endif

  ${If} $NT_BackupPath != ""
    DetailPrint "Fallback archive folder: $NT_BackupPath"
  ${EndIf}
  ; After archive rename, wipe any leftover canonical paths again
  Call un.NT_ForceWipeAllUserData
  DetailPrint "Fallback cleanup completed."
nt_un_fallback_done:
FunctionEnd

!macro customUnInstall
  Call un.NT_RemoveAppDataIfNeeded
!macroend
