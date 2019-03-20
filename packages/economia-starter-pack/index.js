#!/usr/bin/env node

const os = require('os')
const fs = require('fs-extra')
const path = require('path')
const chalk = require('chalk')
const semver = require('semver')
const childProcess = require('child_process')
const validateProjectName = require('validate-npm-package-name')

// Check if update is available
const pkg = require('./package.json')
const updateNotifier = require('update-notifier')
updateNotifier({ pkg }).notify()

const program = require('commander')

program
  .version(pkg.version)
  .command('start <projectName>')
  .description('Create new Economia project')
  .option('--starter <alternative-package>', 'different version of starter pack')
  .option('--common <alternative-common>', 'different version of common files pack')
  .option('--template <template>', 'default to javascript')
  .action(function(projectName, cmd) {
    start(projectName, cmd.starter, cmd.common, cmd.template)
  })

program.parse(process.argv)

function start(projectName, starter, common, template) {
  const npmInfo = checkNpmVersion()
  if (!npmInfo.hasMinNpm) {
    console.log(
      chalk.yellow(
        'You are using npm ' + npmInfo.npmVersion + '. Please update to npm 6 or higher.',
      ),
    )
  }

  const rootPath = process.cwd()
  const projectPath = path.resolve(projectName)

  const invalidNameErrors = validateProjectName(projectName).errors
  if (invalidNameErrors) {
    console.log(chalk.red.bold('Cannot initialize project "' + projectName + '" because:'))
    invalidNameErrors.forEach(function(error) {
      console.log('- ' + error)
    })
    process.exit(1)
  }

  if (fs.existsSync(path.join(rootPath, projectName))) {
    console.log(
      chalk.red.bold(
        'Cannot initialize project ' +
          projectName +
          ' because directory or file of the same name already exists!',
      ),
    )
    process.exit(1)
  }

  console.log(`Creating a new Economia project in ${chalk.green(projectPath)}.`)

  fs.ensureDirSync(projectName)

  const packageJson = {
    name: projectName,
    version: '0.1.0',
    private: true,
  }
  fs.writeFileSync(
    path.join(projectPath, 'package.json'),
    JSON.stringify(packageJson, null, 2) + os.EOL,
  )

  let templatePackage
  templatePackage = starter || '@it-economia/economia-starter-pack'
  templatePackage += '-template-' + template

  let commonPackage = common || '@it-economia/economia-starter-pack-common'

  npm(['install', '--save', '--save-exact', commonPackage, templatePackage], projectName)
    .then(function() {
      console.log('Cleaning up')
      console.log()
      return npm(['remove', '--save', '@it-economia/economia-starter-pack'], projectPath)
    })
    .catch(handleError)
}

function handleError(reject) {
  console.log(
    chalk.red.bold(
      'Failed to initialize. Command ' + reject.command + ' exitted with code ' + reject.code,
    ),
  )
  process.exit(1)
}

function checkNpmVersion() {
  let npmVersion = null
  let hasMinNpm = null
  try {
    npmVersion = childProcess
      .execSync('npm --version')
      .toString()
      .trim()
    hasMinNpm = semver.gte(npmVersion, '6.0.0')
  } catch (err) {
    // ignore
  }
  return {
    hasMinNpm: hasMinNpm,
    npmVersion: npmVersion,
  }
}

function npm(args, root) {
  const fullArgs = args.concat(['--loglevel', 'error', '--prefix', root])

  return spawn('npm', fullArgs)
}

function spawn(command, args) {
  return new Promise((resolve, reject) => {
    const child = childProcess.spawn(command, args, { stdio: 'inherit' })
    child.on('close', code => {
      if (code !== 0) {
        // eslint-disable-next-line prefer-promise-reject-errors
        reject({
          command: command + ' ' + args.join(' '),
          code: code,
        })
        return
      }
      resolve()
    })
  })
}
