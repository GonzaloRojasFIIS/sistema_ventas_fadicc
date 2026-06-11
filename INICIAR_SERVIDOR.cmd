@echo off
cd /d "C:\Users\Gonzalo\Desktop\Boveda\10 PROYECTOS\10.3_proyecto_FADICC"

if exist .next (
    echo Borrando cache de Next.js...
    rmdir /s /q .next
    echo OK
)

echo.
echo Iniciando servidor...
echo Espera a que diga "Ready in ...ms"
echo Luego abre http://localhost:3000 en tu navegador
echo.

cmd /k npm run dev
