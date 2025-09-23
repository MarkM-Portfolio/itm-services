@Library('quickstart') _

qs {
    plugin = 'loopback'
    artifacts = 'tests/reports/**/*'
    htmlReports = [[allowMissing: false, alwaysLinkToLastBuild: false,
        keepAll: false, reportDir: 'tests/reports/coverage/lcov-report',
        reportFiles: 'index.html', reportName: 'Coverage Report']]
    junitReports = 'tests/reports/*i*/*.xml'
    slackNotify = [teamDomain: 'ibm-ics', channel: '#ic-alert-itm', token: 'd37SMxybUymsgE430vSCs58W']
    dockerRegistry = 'connections-docker.artifactory.cwp.pnp-hcl.com'
    nodejsVersion = 'nodejs18'

/* Stage scripts & commands */
    resources = ['scripts/docker/docker_utils.sh']

  // build
    beforeBuildScript = 'scripts/npm/npm_install_clean.sh'
    buildScript = 'scripts/npm_build.sh'

  // test
    testScript = 'scripts/test_unit.sh'
    afterTestCommand = 'npm run check:lint'

  // docker
    dockerScript = 'scripts/docker_build.sh'

  // validate
    validateScript = 'scripts/test_api.sh'
}
