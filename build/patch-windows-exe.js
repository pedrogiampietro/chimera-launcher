const fs = require('fs')
const path = require('path')
const PE = require('pe-library')
const ResEdit = require('resedit')

function patchWindowsExecutable({ executablePath, iconPath, productName, executableName }) {
  if (!fs.existsSync(executablePath)) {
    throw new Error(`Executable not found: ${executablePath}`)
  }

  if (!fs.existsSync(iconPath)) {
    throw new Error(`Icon not found: ${iconPath}`)
  }

  const executableData = fs.readFileSync(executablePath)
  const executable = PE.NtExecutable.from(executableData)
  const resources = PE.NtExecutableResource.from(executable)
  const iconFile = ResEdit.Data.IconFile.from(fs.readFileSync(iconPath))
  const iconGroupIds = ResEdit.Resource.IconGroupEntry.fromEntries(resources.entries).map(
    (entry) => entry.id
  )
  const targetIconGroupIds = iconGroupIds.length > 0 ? [...new Set(iconGroupIds)] : [101]

  for (const iconGroupId of targetIconGroupIds) {
    ResEdit.Resource.IconGroupEntry.replaceIconsForResource(
      resources.entries,
      iconGroupId,
      1033,
      iconFile.icons.map((item) => item.data)
    )
  }

  let versionInfo = ResEdit.Resource.VersionInfo.fromEntries(resources.entries)[0]
  if (!versionInfo) {
    versionInfo = ResEdit.Resource.VersionInfo.createEmpty()
  }

  versionInfo.setStringValues(
    { lang: 1033, codepage: 1200 },
    {
      FileDescription: productName,
      ProductName: productName,
      InternalName: executableName,
      OriginalFilename: `${executableName}.exe`
    }
  )
  versionInfo.outputToResourceEntries(resources.entries)

  resources.outputResource(executable)
  const updatedExecutableData = executable.generate()
  fs.writeFileSync(executablePath, Buffer.from(updatedExecutableData))
}

module.exports = {
  patchWindowsExecutable
}
