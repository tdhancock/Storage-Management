const fs = require('fs');
const { filesize } = require("filesize");

let dirSize = 0

function getSize(item) {
  const stat = fs.statSync(item)
  if (stat.isDirectory()) {
    let children = fs.readdirSync(item)
    for (child in children) {
      let childStat = fs.statSync(item + "/" + children[child])
      if (childStat.isDirectory()) getSize(item + "/" + children[child])
      else {
        dirSize += childStat.size
      }
    }
    return dirSize;
  } else {
    return stat.size;
  }
}

function walkTree(path, tabs) {
  let stat = fs.statSync(`${path}`)
  let name = path.split("/")
  if (stat.isDirectory()) {
    console.log("\n" + "\t".repeat(tabs) + name[name.length - 1] + "/ " + filesize(getSize(path), { base: 2, standard: "jedec" }))
    dirSize = 0
  }
  if (stat.isFile()) {
    console.log("\n" + "\t".repeat(tabs) + name[name.length - 1] + " " + filesize(getSize(path), { base: 2, standard: "jedec" }))
    dirSize = 0
  }
  const names = fs.readdirSync(path);
  for (let name of names) {
    let stat = fs.statSync(`${path}` + "/" + `${name}`)
    if (stat.isDirectory()) {
      walkTree(`${path}` + "/" + `${name}`, tabs + 1)
    }
    if (stat.isFile()) {
      console.log("\n" + "\t".repeat(tabs + 1) + name + " " + getSize(`${path}` + "/" + `${name}`) + " bytes")
      dirSize = 0
    }
  }
}

function main() {
  walkTree("test", 0)
}

main()