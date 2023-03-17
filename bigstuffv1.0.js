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

function calculateBlockSize(bytes) {
  const blockSize = 4096;
  return Math.ceil(bytes / blockSize) * blockSize;
}

function processSort(sortArray, flag, path) {
  if (flag == 'alpha') {
    sortArray.sort()
  }
  if (flag == 'exten') {
    sortArray.sort(function(a, b) {
      let aExten = a.split('.')
      let bExten = b.split('.')
      if (aExten.length > 1 && bExten.length > 1) {
        return aExten[1].localeCompare(bExten[1])
      } else {
        return a - b
      }
      console.log(a, b)
    })
  }
  if (flag == 'size') {
    sortArray.sort(function(a, b) {
      let sizeA = getSize(`${path}` + "/" + `${a}`)
      dirSize = 0
      let sizeB = getSize(`${path}` + "/" + `${b}`)
      dirSize = 0
      return sizeB - sizeA
    })
  }
  return sortArray
}

function convertBytes(bytes) {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]

  if (bytes == 0) {
    return "0 Bytes"
  }

  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))

  if (i == 0) {
    return bytes + " " + sizes[i]
  }

  return (bytes / Math.pow(1024, i)).toFixed(1) + " " + sizes[i]
}

function printLine(path, name, tabs, metric, threshold, blocksize, type) {
  if (getSize(path) >= threshold * 1000000000) {
    if (type == 'dir') {
      if(metric && blocksize){
        console.log("\n" + "\t".repeat(tabs) + name[name.length - 1] + "/ " + convertBytes(calculateBlockSize(getSize(path))))
      }else if(metric){
        console.log("\n" + "\t".repeat(tabs) + name[name.length - 1] + "/ " + convertBytes(getSize(path)))
      }else if(blocksize){
        console.log("\n" + "\t".repeat(tabs) + name[name.length - 1] + "/ " + calculateBlockSize(getSize(path)).toLocaleString())
      }
      else console.log("\n" + "\t".repeat(tabs) + name[name.length - 1] + "/ " + getSize(path).toLocaleString())  
      dirSize = 0
    } else {
      if(metric && blocksize){
        console.log("\n" + "\t".repeat(tabs) + name + " " + convertBytes(calculateBlockSize(getSize(path))))
      }else if(metric){
        console.log("\n" + "\t".repeat(tabs) + name + " " + convertBytes(getSize(path)))
      }else if(blocksize){
        console.log("\n" + "\t".repeat(tabs) + name + " " + calculateBlockSize(getSize(path)).toLocaleString())
      }
      else console.log("\n" + "\t".repeat(tabs) + name + " " + getSize(path).toLocaleString())  
      dirSize = 0
    }
  }
}

function walkTree(path, tabs, flags) {
  let stat = fs.statSync(`${path}`)
  let name = path.split("/")
  if (stat.isDirectory()) {
    printLine(path, name, tabs, flags[2], flags[3], flags[4], 'dir')
  }
  if (stat.isFile()) {
    printLine(path, name[name.length - 1], tabs, flags[2], flags[3], flags[4], 'file')
  }
  let names = fs.readdirSync(path);
  names = processSort(names, flags[1], path)
  for (let name of names) {
    let stat = fs.statSync(`${path}` + "/" + `${name}`)
    if (stat.isDirectory()) {
      walkTree(`${path}` + "/" + `${name}`, tabs + 1, flags)
    }
    if (stat.isFile()) {
      printLine(`${path}` + "/" + `${name}`, name, tabs + 1, flags[2], flags[3], flags[4], 'file')
    }
  }
}

function usage() {
  fs.readFile('help.txt', (err, inputD) => {
    if (err) throw err
    console.log(inputD.toString())
  })
  return true;
}

function processArgs(args) {
  //'path', 'sort', 'metric', 'threshold', 'blocksize'
  let processed = ['.', null, null, 1, null]
  let currItem
  for (let i = 0; i < args.length; i++) {

    currItem = args[i]
    nextItem = args[i + 1]

    if (currItem == '-p' || currItem == '--path') processed[0] = nextItem

    if (currItem == '-s' || currItem == '--sort') processed[1] = nextItem

    if (currItem == '-m' || currItem == '--metric') processed[2] = true

    if (currItem == '-t' || currItem == '--threshold') processed[3] = nextItem

    if (currItem == '-b' || currItem == '--blocksize') processed[4] = true

    if (currItem == '-h' || currItem == '--help') {
      usage()
      return false
    }
  }
  return processed
}

function main() {
  let processed = processArgs(process.argv)
  if (processed != false) walkTree(processed[0], 0, processed)
}

main()