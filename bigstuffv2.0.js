const fs = require('fs')
const Path = require('path')
const chalk = require('chalk')
const glob = require('glob')

function convertBytes(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']

  if (bytes == 0) {
    return '0 Bytes'
  }

  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))

  if (i == 0) {
    return bytes + ' ' + sizes[i]
  }

  return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i]
}

function getSize(item) {
  const stat = fs.statSync(item)
  if (stat.isDirectory()) {
    let children = fs.readdirSync(item)
    for (child in children) {
      let childStat = fs.statSync(item + '/' + children[child])
      if (childStat.isDirectory()) getSize(item + '/' + children[child])
      else {
        dirSize += childStat.size
      }
    }
    return dirSize
  } else {
    return stat.size
  }
}

dirSize = 0

function printLine(path, tabs, metric, threshold) {
  let stat = fs.statSync(`${path}`)
  if (stat.isDirectory()) {
    if (getSize(path) >= threshold * 1000000000) {
      if (metric) {
        console.log(
          chalk.green('\n' + '\t'.repeat(tabs) + Path.resolve(path) + '\\ ')
        )
      } else
        console.log(
          chalk.green('\n' + '\t'.repeat(tabs) + Path.resolve(path) + '\\ ')
        )
      dirSize = 0
    }
  }
  if (stat.isFile()) {
    if (stat.size >= threshold * 1000000000) {
      if (metric) {
        console.log(
          chalk.cyanBright(
            '\n' +
              '\t'.repeat(tabs) +
              Path.resolve(path) +
              ' ' +
              convertBytes(stat.size)
          )
        )
      } else
        console.log(
          chalk.cyanBright(
            '\n' +
              '\t'.repeat(tabs) +
              Path.resolve(path) +
              ' ' +
              stat.size.toLocaleString()
          )
        )
      dirSize = 0
    }
  }
}

async function startGlob(path, flags) {
  const files = await glob(`${path}/**`, { ignore: 'node_modules/**' })
  handlePrint(files, flags, path)
}

function handlePrint(list, flags, path) {
  handleSort(list, flags[1])

  if (flags[1] == 'alpha' || flags[1] == null) {
    for (item in list) {
      if (list[item] == '') {
        printLine(
          path + list[item],
          0,
          flags[2],
          flags[3]
        )
      } else {
        printLine(
          list[item],
          list[item].split('\\').length,
          flags[2],
          flags[3]
        )
      }
    }
    console.log('\n')
  } else if (flags[1] == 'exten') {
    console.log(
      '\nFiles in order of extension, alphabetical. Directories excluded because they have no extension'
    )
    for (item in list) {
      if (list[item] == '') stat = fs.statSync(path)
      else stat = fs.statSync(list[item])
      if (stat.isFile()) {
        if (list[item] == '') {
          printLine(path + list[item], 0, flags[2], flags[3])
        } else {
          printLine(list[item], 0, flags[2], flags[3])
        }
      }
    }
    console.log('\n')
  } else if (flags[1] == 'size') {
    console.log(
      "\nFiles in order of size, largest to smallest. Directories excluded because with globbing we aren't doing size"
    )
    for (item in list) {
      if (list[item] == '') stat = fs.statSync(path)
      else stat = fs.statSync(list[item])
      if (stat.isFile()) {
        if (list[item] == '') {
          printLine(path + list[item], 0, flags[2], flags[3])
        } else {
          printLine(list[item], 0, flags[2], flags[3])
        }
      }
    }
    console.log('\n')
  }
}

function handleSort(list, type) {
  if (type == 'alpha') {
    return list.sort()
  } else if (type == 'exten') {
    return list.sort(function (a, b) {
      return a
        .split('/')
        .pop()
        .split('.')
        .pop()
        .localeCompare(b.split('/').pop().split('.').pop())
    })
  } else if (type == 'size') {
    return list.sort(function (a, b) {
      if (a == '') statA = fs.statSync('./')
      else statA = fs.statSync(a)
      if (b == '') statB = fs.statSync('./')
      else statB = fs.statSync(b)
      if (statA.isFile() && statB.isFile()) {
        let sizeA = fs.statSync(a).size
        let sizeB = fs.statSync(b).size
        return sizeB - sizeA
      }
    })
  } else return list.sort()
}

function findLangLoc() {
  let lang = null
  let loc = null
  for (let item in process.argv) {
    if (process.argv[item].includes('lang')) {
      lang = process.argv[item].split('=')[1]
    } else if (process.argv[item].includes('loc')) {
      loc = process.argv[item].split('=')[1]
    }
  }
  return [lang, loc]
}

function usage() {
  let pref = findLangLoc()
  if (pref[0] != null && pref[1] != null) {
    fs.readFile(
      `help.${pref[0]}.${pref[1].toUpperCase()}.txt`,
      (err, inputD) => {
        if (err)
          console.log('\nNo help file for specified language and locale\n')
        else console.log(inputD.toString())
      }
    )
  } else if (process.env.lang) {
    let lang = process.env.lang.split('.')[0].split('_')[0]
    let loc = process.env.lang.split('.')[0].split('_')[1]
    fs.readFile(`help.${lang}.${loc}.txt`, (err, inputD) => {
      if (err) console.log('\nNo help file for specified language and locale\n')
      else console.log(inputD.toString())
    })
  } else {
    fs.readFile('help.en.US.txt', (err, inputD) => {
      if (err) throw err
      console.log(inputD.toString())
    })
  }
  return true
}

function processArgs(args) {
  //'path', 'sort', 'metric', 'threshold', 'blocksize'
  let processed = ['./', null, null, -1, null]
  let currItem
  for (let i = 0; i < args.length; i++) {
    currItem = args[i]
    nextItem = args[i + 1]

    if (currItem == '-p' || currItem == '--path') processed[0] = nextItem

    if (currItem == '-s' || currItem == '--sort') processed[1] = nextItem

    if (currItem == '-m' || currItem == '--metric') processed[2] = true

    if (currItem == '-t' || currItem == '--threshold') processed[3] = nextItem

    //Blocksize, deprecated
    // if (currItem == '-b' || currItem == '--blocksize') processed[4] = true

    if (currItem == '-h' || currItem == '--help') {
      usage()
      return false
    }
  }
  return processed
}

function main() {
  let processed = processArgs(process.argv)
  if (processed != false) startGlob(processed[0], processed)
}

main()
