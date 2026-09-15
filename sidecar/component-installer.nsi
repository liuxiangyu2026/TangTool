Unicode true
SetCompressor /SOLID lzma
RequestExecutionLevel user
!include MUI2.nsh
!include LogicLib.nsh

Name "TangTool Document Runtime ${RUNTIME_VERSION}"
OutFile "${RUNTIME_OUTPUT}"
InstallDir "$LOCALAPPDATA\TangTool\DocumentRuntime\${RUNTIME_VERSION}"
!define COMPONENT_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\TangToolDocumentRuntime-${RUNTIME_VERSION}"
!define MUI_ABORTWARNING
!define MUI_ICON "${RUNTIME_ICON}"
!define MUI_UNICON "${RUNTIME_ICON}"
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "SimpChinese"
!insertmacro MUI_LANGUAGE "English"

LangString RuntimeFailed 1033 "The document component could not start. Please reinstall the matching component."
LangString RuntimeFailed 2052 "文档组件无法启动，请重新安装对应平台的组件。"
LangString InvalidLocation 1033 "Unexpected component directory. Uninstall cancelled."
LangString InvalidLocation 2052 "组件目录不匹配，已取消卸载。"

Function .onInit
  ; 固定当前用户目录；不依赖主程序目录，不需要系统 Python，也不接受自定义 /D 路径。
  StrCpy $INSTDIR "$LOCALAPPDATA\TangTool\DocumentRuntime\${RUNTIME_VERSION}"
  !insertmacro MUI_LANGDLL_DISPLAY
FunctionEnd

Section "Document Runtime"
  SetOutPath "$INSTDIR"
  File /r "${RUNTIME_SOURCE}\*"
  nsExec::ExecToStack /TIMEOUT=20000 '"$INSTDIR\tangtool-markitdown.exe" --check'
  Pop $0
  Pop $1
  ${If} $0 != 0
  ${OrIf} $1 != "TangToolDocumentRuntime:${RUNTIME_VERSION}:x86_64-pc-windows-msvc"
    IfSilent +2
    MessageBox MB_OK|MB_ICONSTOP "$(RuntimeFailed)"
    SetErrorLevel 3
    Abort
  ${EndIf}
  WriteUninstaller "$INSTDIR\uninstall.exe"
  WriteRegStr HKCU "${COMPONENT_KEY}" "DisplayName" "TangTool Document Runtime ${RUNTIME_VERSION}"
  WriteRegStr HKCU "${COMPONENT_KEY}" "DisplayVersion" "${RUNTIME_VERSION}"
  WriteRegStr HKCU "${COMPONENT_KEY}" "Publisher" "TangTool"
  WriteRegStr HKCU "${COMPONENT_KEY}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "${COMPONENT_KEY}" "UninstallString" '$\"$INSTDIR\uninstall.exe$\"'
  WriteRegDWORD HKCU "${COMPONENT_KEY}" "NoModify" 1
  WriteRegDWORD HKCU "${COMPONENT_KEY}" "NoRepair" 1
SectionEnd

Section "Uninstall"
  ; 只移除自身固定版本目录；主程序、偏好、其他组件版本和用户文档不在此路径。
  StrCmp "$INSTDIR" "$LOCALAPPDATA\TangTool\DocumentRuntime\${RUNTIME_VERSION}" allowed
  IfSilent +2
  MessageBox MB_OK|MB_ICONSTOP "$(InvalidLocation)"
  SetErrorLevel 4
  Abort
  allowed:
  Delete "$INSTDIR\tangtool-markitdown.exe"
  RMDir /r "$INSTDIR\_internal"
  Delete "$INSTDIR\uninstall.exe"
  RMDir "$INSTDIR"
  DeleteRegKey HKCU "${COMPONENT_KEY}"
SectionEnd
