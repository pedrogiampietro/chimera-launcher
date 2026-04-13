!macro customInstall
  Delete "$INSTDIR\eldera-launcher.exe"
  Delete "$INSTDIR\electron.exe"
  Delete "$DESKTOP\eldera-launcher.lnk"
  Delete "$SMPROGRAMS\Eldera\eldera-launcher.lnk"
!macroend

!macro customUnInstall
  Delete "$INSTDIR\eldera-launcher.exe"
  Delete "$INSTDIR\electron.exe"
  Delete "$DESKTOP\eldera-launcher.lnk"
  Delete "$SMPROGRAMS\Eldera\eldera-launcher.lnk"
!macroend
