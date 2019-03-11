#!/usr/bin/env node

const fs = require('fs-extra')
const path = require('path')
const chalk = require('chalk')
const childProcess = require('child_process')
const root = process.env.npm_config_prefix

if (!process.env.npm_config_save_exact) {
  process.exit(0)
}

console.log('Installing GIT respository')
console.log()

spawn('git', ['-C', root, 'init'])
  .then(function() {
    const dependencies = [
      'eslint',
      'eslint-config-prettier',
      'eslint-config-standard',
      'eslint-plugin-import',
      'eslint-plugin-node',
      'eslint-plugin-promise',
      'eslint-plugin-standard',
      'husky',
      'jest',
      'jest-runner-eslint',
      'lint-staged',
      'prettier',
    ]

    console.log()
    console.log('Installing dependencies:')
    dependencies.forEach(function(dependency) {
      console.log('- ' + dependency)
    })
    console.log()
    return npm(['install', '--save-dev'].concat(dependencies))
  })
  .then(function() {
    console.log('Copying config files')
    console.log()

    const configDir = path.resolve('./config')
    const configFiles = fs.readdirSync(configDir)
    configFiles.forEach(function(configFile) {
      fs.copyFileSync(path.join(configDir, configFile), path.join(root, configFile))
    })
  })
  .then(function() {
    console.log('Copying hello-world app')
    console.log()

    const appDir = path.resolve('./hello-world')
    return fs.copy(appDir, path.join(root, 'src'))
  })
  .then(function() {
    console.log('Stitching package.json')
    console.log()

    const packageJsonPath = path.resolve(root, 'package.json')
    const packageJson = require(path.resolve(root, 'package.json'))
    const packageJsonExtend = require('./package-extend.json')

    Object.assign(packageJson, packageJsonExtend)

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
  })
  .catch(function(reject) {
    if (reject.command) {
      console.log(
        chalk.red.bold(
          'Failed to initialize. Command ' + reject.command + ' exitted with code ' + reject.code,
        ),
      )
    } else {
      console.log(chalk.red.bold('Failed to initialize. ' + reject))
    }
    process.exit(1)
  })

function npm(args) {
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
