!include nsDialogs.nsh
!include LogicLib.nsh
!include WordFunc.nsh
!include "${__FILEDIR__}\generated\runtime.nsh"

Var TangToolDocWanted
Var TangToolDocCheckbox
Var TangToolDocLabel
Var TangToolWebLabel
Var TangToolWebReady
Var TangToolDocReady

LangString TTPrerequisites 1033 "Runtime requirements"
LangString TTPrerequisites 2052 "运行环境检查"
LangString TTPrerequisitesHint 1033 "Install missing requirements, then click Next to check again."
LangString TTPrerequisitesHint 2052 "安装缺少的组件后，点击下一步重新检测。"
LangString TTWebReady 1033 "WebView2: ready"
LangString TTWebReady 2052 "WebView2：已安装"
LangString TTWebMissing 1033 "WebView2: not installed (required)"
LangString TTWebMissing 2052 "WebView2：未安装（必需）"
LangString TTWebDownload 1033 "Open Microsoft's WebView2 download page"
LangString TTWebDownload 2052 "打开微软 WebView2 官方下载页面"
LangString TTDocOptional 1033 "Install the optional document conversion component"
LangString TTDocOptional 2052 "安装文档转换组件（可选）"
LangString TTDocHint 1033 "Download and install it separately if selected. Other tools work without it."
LangString TTDocHint 2052 "勾选后请单独下载安装；不勾选可继续，不影响其他工具。"
LangString TTDocDownload 1033 "Download the TangTool document component installer"
LangString TTDocDownload 2052 "下载 TangTool 文档组件安装包"
LangString TTDocReady 1033 "Document component: ready"
LangString TTDocReady 2052 "文档转换组件：已就绪"
LangString TTDocMissing 1033 "Document component: missing or incompatible"
LangString TTDocMissing 2052 "文档转换组件：未安装或不兼容"
LangString TTWebBlock 1033 "Install Microsoft WebView2 Runtime first, then click Next again."
LangString TTWebBlock 2052 "请先安装 Microsoft WebView2 Runtime，再点击下一步重新检测。"
LangString TTDocBlock 1033 "Install the document component, or uncheck the optional component to continue."
LangString TTDocBlock 2052 "请先安装文档组件；也可取消勾选，安装后再从文档工具页下载。"

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

Function TangToolCheckDocument
  StrCpy $TangToolDocReady 0
  IfFileExists "$LOCALAPPDATA\TangTool\DocumentRuntime\${DOCUMENT_RUNTIME_VERSION}\tangtool-markitdown.exe" 0 done
  nsExec::ExecToStack /TIMEOUT=20000 '"$LOCALAPPDATA\TangTool\DocumentRuntime\${DOCUMENT_RUNTIME_VERSION}\tangtool-markitdown.exe" --check'
  Pop $0
  Pop $1
  ${If} $0 == 0
  ${AndIf} $1 == "${DOCUMENT_RUNTIME_TOKEN}"
    StrCpy $TangToolDocReady 1
  ${EndIf}
  done:
FunctionEnd

Function TangToolRefreshPrerequisites
  Call TangToolCheckWebView
  Call TangToolCheckDocument
  ${If} $TangToolWebReady == 1
    ${NSD_SetText} $TangToolWebLabel "$(TTWebReady)"
  ${Else}
    ${NSD_SetText} $TangToolWebLabel "$(TTWebMissing)"
  ${EndIf}
  ${If} $TangToolDocReady == 1
    ${NSD_SetText} $TangToolDocLabel "$(TTDocReady)"
  ${Else}
    ${NSD_SetText} $TangToolDocLabel "$(TTDocMissing)"
  ${EndIf}
FunctionEnd

Function TangToolOpenWebView
  Pop $0
  ExecShell "open" "https://developer.microsoft.com/microsoft-edge/webview2/#download-section"
FunctionEnd

Function TangToolOpenDocument
  Pop $0
  ExecShell "open" "${DOCUMENT_RUNTIME_URL}"
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
  ${NSD_CreateCheckbox} 0 51u 100% 16u "$(TTDocOptional)"
  Pop $TangToolDocCheckbox
  ${If} $TangToolDocWanted == 1
    ${NSD_Check} $TangToolDocCheckbox
  ${EndIf}
  ${NSD_CreateLabel} 0 74u 100% 26u "$(TTDocHint)"
  Pop $0
  ${NSD_CreateLabel} 0 104u 100% 14u "$(TTDocMissing)"
  Pop $TangToolDocLabel
  ${NSD_CreateLink} 0 125u 100% 14u "$(TTDocDownload)"
  Pop $0
  ${NSD_OnClick} $0 TangToolOpenDocument
  Call TangToolRefreshPrerequisites
  nsDialogs::Show
FunctionEnd

Function TangToolPrerequisitesLeave
  ${NSD_GetState} $TangToolDocCheckbox $TangToolDocWanted
  Call TangToolRefreshPrerequisites
  ${If} $TangToolWebReady != 1
    MessageBox MB_OK|MB_ICONEXCLAMATION "$(TTWebBlock)"
    Abort
  ${EndIf}
  ${If} $TangToolDocWanted == 1
  ${AndIf} $TangToolDocReady != 1
    MessageBox MB_OK|MB_ICONEXCLAMATION "$(TTDocBlock)"
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
  ${If} $TangToolDocWanted == 1
    Call TangToolCheckDocument
    ${If} $TangToolDocReady != 1
      IfSilent +2
      MessageBox MB_OK|MB_ICONEXCLAMATION "$(TTDocBlock)"
      SetErrorLevel 3
      Abort
    ${EndIf}
  ${EndIf}
!macroend
