@echo off

if "%1"=="build" (
    npm run build
) else if "%1"=="watch" (
    npm run watch
) else (
    echo Error: Only 'build' and 'watch' are allowed.
    exit /b 1
)

endlocal
