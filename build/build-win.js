const { spawnSync } = require('child_process')
const path = require('path')
const { patchWindowsExecutable } = require('./patch-windows-exe')

const projectDir = path.resolve(__dirname, '..')
const executableName = 'Eldera'
const productName = 'Eldera'
const executablePath = path.join(projectDir, 'dist', 'win-unpacked', `${executableName}.exe`)
const iconPath = path.join(projectDir, 'build', 'icon.ico')

run('npm', ['run', 'build:app'])
run('npx', ['electron-builder', '--dir', '--win'])

patchWindowsExecutable({
  executablePath,
  iconPath,
  productName,
  executableName
})

run('npx', ['electron-builder', '--win', '--prepackaged', path.join('dist', 'win-unpacked')])

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: projectDir,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  })

  if (result.status !== 0) {
    process.exit(result.status || 1)
  }
}
