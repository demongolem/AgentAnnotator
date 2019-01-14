IF NOT EXIST c:\files\ (
mkdir c:\files\
)

webroot="c:\inetpub\wwwroot"
cd /d %webroot%
for /F "delims=" %%i in ('dir /b') do (rmdir "%%i" /s/q || del "%%i" /s/q)
exit