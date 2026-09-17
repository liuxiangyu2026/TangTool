!include nsDialogs.nsh
!include LogicLib.nsh
!include WordFunc.nsh

Var TangToolWebLabel
Var TangToolWebReady

LangString TTPrerequisites 1033 "Runtime requirements"
LangString TTPrerequisites 2052 "运行环境检查"
LangString TTPrerequisitesHint 1033 "Install WebView2 if missing, then click Next to check again."
LangString TTPrerequisitesHint 2052 "如未安装 WebView2，请先安装后点击下一步重新检测。"
LangString TTWebReady 1033 "WebView2: ready"
LangString TTWebReady 2052 "WebView2：已安装"
LangString TTWebMissing 1033 "WebView2: not installed (required)"
LangString TTWebMissing 2052 "WebView2：未安装（必需）"
LangString TTWebDownload 1033 "Open Microsoft's WebView2 download page"
LangString TTWebDownload 2052 "打开微软 WebView2 官方下载页面"
LangString TTWebBlock 1033 "Install Microsoft WebView2 Runtime first, then click Next again."
LangString TTWebBlock 2052 "请先安装 Microsoft WebView2 Runtime，再点击下一步重新检测。"

; Hook 文件在默认页面之前载入；增加独立检查页，不复制或替换 Tauri 的升级/卸载模板。
Page custom TangToolPrerequisitesCreate TangToolPrerequisitesLeave

Function TangToolCheckWebView
  StrCpy $TangToolWebReady 0
  SetRegView 32
  ReadRegStr $0 HKLM "SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" "pv"
  ${VersionCompare} "$0" "0.0.0.0" $1
  ${If} $0 != ""
  ${AndIf} $1 == 1
    StrCpy $TangToolWebReady 1
  ${EndIf}
  ReadRegStr $0 HKCU "Software\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" "pv"
  ${VersionCompare} "$0" "0.0.0.0" $1
  ${If} $0 != ""
  ${AndIf} $1 == 1
    StrCpy $TangToolWebReady 1
  ${EndIf}
  SetRegView 64
FunctionEnd

Function TangToolRefreshPrerequisites
  Call TangToolCheckWebView
  ${If} $TangToolWebReady == 1
    ${NSD_SetText} $TangToolWebLabel "$(TTWebReady)"
  ${Else}
    ${NSD_SetText} $TangToolWebLabel "$(TTWebMissing)"
  ${EndIf}
FunctionEnd

Function TangToolOpenWebView
  Pop $0
  ExecShell "open" "https://developer.microsoft.com/microsoft-edge/webview2/#download-section"
FunctionEnd

Function TangToolPrerequisitesCreate
  !insertmacro MUI_HEADER_TEXT "$(TTPrerequisites)" "$(TTPrerequisitesHint)"
  nsDialogs::Create 1018
  Pop $0
  ${If} $0 == error
    Abort
  ${EndIf}
  ${NSD_CreateLabel} 0 0 100% 18u "$(TTWebMissing)"
  Pop $TangToolWebLabel
  ${NSD_CreateLink} 0 22u 100% 14u "$(TTWebDownload)"
  Pop $0
  ${NSD_OnClick} $0 TangToolOpenWebView
  Call TangToolRefreshPrerequisites
  nsDialogs::Show
FunctionEnd

Function TangToolPrerequisitesLeave
  Call TangToolRefreshPrerequisites
  ${If} $TangToolWebReady != 1
    MessageBox MB_OK|MB_ICONEXCLAMATION "$(TTWebBlock)"
    Abort
  ${EndIf}
FunctionEnd

!macro NSIS_HOOK_PREINSTALL
  ; 再查一次，覆盖静默安装及用户在前置页之后卸载运行时的情况。
  Call TangToolCheckWebView
  ${If} $TangToolWebReady != 1
    IfSilent +2
    MessageBox MB_OK|MB_ICONEXCLAMATION "$(TTWebBlock)"
    SetErrorLevel 2
    Abort
  ${EndIf}
!macroend
