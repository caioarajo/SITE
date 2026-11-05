@echo off
rem Abre o FigCraft pronto para o Claude Code (MCP na porta 47800), com acesso so a esta pasta.
start "" "%LOCALAPPDATA%\Programs\figcraft\figcraft.exe" --control 47800 --automation-read-root "%~dp0." --automation-write-root "%~dp0."
