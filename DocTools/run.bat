@echo off

xcopy /v/y parse.py %pluginFolder%\DocTools\parse.py
cd %pluginFolder%\..
java -jar Paper.jar
cd plugins/DocTools
python parse.py
xcopy /v/y/f parsed.txt %~dp0\parsed.txt
cd %~dp0
parsed.txt
