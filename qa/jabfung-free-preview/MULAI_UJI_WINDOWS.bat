@echo off
setlocal
cd /d "%~dp0"
echo.
echo =========================================================
echo  SIMANTAB LAB - OCR JABFUNG GRATIS (UJI LOKAL)
echo =========================================================
echo Tidak ada Supabase atau Gemini dalam situs ini.
echo Hanya gunakan berkas contoh sintetis, bukan data ASN asli.
echo.
echo Pada komputer ini: http://localhost:8765
echo Pada Android: sambungkan ke Wi-Fi yang sama, lalu
echo buka http://ALAMAT-IP-KOMPUTER:8765
echo.
echo Alamat IP Windows:
ipconfig | findstr /R /C:"IPv4"
echo.
echo Tekan Ctrl+C untuk menghentikan server setelah selesai.
where py >nul 2>nul
if %errorlevel%==0 (
  py -3 -m http.server 8765 --bind 0.0.0.0
  goto END
)
where python >nul 2>nul
if %errorlevel%==0 (
  python -m http.server 8765 --bind 0.0.0.0
  goto END
)
echo.
echo Python belum tersedia. Instal Python gratis terlebih dahulu,
echo kemudian jalankan file MULAI_UJI_WINDOWS.bat lagi.
pause
:END
endlocal
