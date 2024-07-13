@echo off

cd %pluginFolder%\..
del plugins\DocTools\config.yml
java -jar paper-1.21-44.jar
echo F | xcopy /v/y/f plugins\DocTools\config.yml %~dp0\unparsed.yml
cd %~dp0
python parse.py
parsed.json
