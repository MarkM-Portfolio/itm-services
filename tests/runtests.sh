echo 'Running Governor tests'

export TEST_SUITE=governor

cd /usr/src/app/tests/

node ./lib-tests/jasmine-runner.js
