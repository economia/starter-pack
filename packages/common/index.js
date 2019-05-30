#!/usr/bin/env node

const fs = require('fs-extra')
const path = require('path')
const chalk = require('chalk')
const root = process.env.npm_config_prefix

if (!process.env.npm_config_save_exact) {
  process.exit(0)
}

try {
  // Copy common files

  console.log('Copying common files')
  console.log()

  const fileDir = path.resolve('./files')
  const commonFiles = fs.readdirSync(fileDir)
  commonFiles.forEach(function(commonFile) {
    fs.copyFileSync(path.join(fileDir, commonFile), path.join(root, commonFile))
  })

  // Build JSConfig from common parts
  console.log('Stitching package.json')
  console.log()

  const packageJsonPath = path.resolve(root, 'package.json')
  const packageJson = require(packageJsonPath)
  const packageJsonExtend = require('./package-extend.json')

  Object.assign(packageJson, packageJsonExtend)

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
} catch (reject) {
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
}
