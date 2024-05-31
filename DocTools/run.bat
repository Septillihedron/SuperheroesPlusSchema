@echo off

cd %pluginFolder%\..
del plugins\DocTools\config.yml
java -jar Paper.jar
echo F | xcopy /v/y/f plugins\DocTools\config.yml %~dp0\unparsed.yml
cd %~dp0
python parse.py
parsed.json
