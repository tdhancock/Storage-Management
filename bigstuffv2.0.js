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

function printLine(path, metric, threshold) {
  let stat = fs.statSync(path)
  if (stat.isFile()) {
    if (stat.size >= threshold * 1000000000) {
      if (metric) {
        console.log(
          '\n' +
            chalk.red(Path.resolve(path).split('\\').slice(0, -1).join('\\')) +
            chalk.cyanBright('\\') +
            chalk.cyanBright(Path.resolve(path).split('\\').pop()) +
            ' ' +
            convertBytes(stat.size)
        )
      } else
        console.log(
          chalk.cyanBright(
            '\n' +
              chalk.red(
                Path.resolve(path).split('\\').slice(0, -1).join('\\')
              ) +
              chalk.cyanBright('\\') +
              chalk.cyanBright(Path.resolve(path).split('\\').pop()) +
              ' ' +
              stat.size.toLocaleString()
          )
        )
    }
  }
}

let position = 0
function tick() {
  const spinningChars = `|/-\\`
  process.stdout.write(`\b${spinningChars[position % spinningChars.length]}`)
  position += 1
}

async function startGlob(path, flags) {
  const files = []
  for (const file of glob.globIterateSync(`${path}/**`, {
    ignore: 'node_modules/**',
  })) {
    try {
      stat = fs.statSync(file)
      if (
        file != '' &&
        !stat.isDirectory() &&
        stat.size >= flags[3] * 1000000000
      )
        files.push(file)
    } catch (err) {
      continue
    }
    tick()
  }
  handlePrint(files, flags, path)
}

function handlePrint(list, flags, path) {
  handleSort(list, flags[1])

  if (flags[1] == 'alpha' || flags[1] == null) {
    for (item in list) {
      if (list[item] == '') {
        printLine(path + list[item], flags[2], flags[3])
      } else {
        printLine(list[item], flags[2], flags[3])
      }
    }
    console.log('\n')
  } else if (flags[1] == 'exten') {
    for (item in list) {
      if (list[item] == '') stat = fs.statSync(path)
      else stat = fs.statSync(list[item])
      if (stat.isFile()) {
        if (list[item] == '') {
          printLine(path + list[item], flags[2], flags[3])
        } else {
          printLine(list[item], flags[2], flags[3])
        }
      }
    }
    console.log('\n')
  } else if (flags[1] == 'size') {
    for (item in list) {
      if (list[item] == '') stat = fs.statSync(path)
      else stat = fs.statSync(list[item])
      if (stat.isFile()) {
        if (list[item] == '') {
          printLine(path + list[item], flags[2], flags[3])
        } else {
          printLine(list[item], flags[2], flags[3])
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
      return fs.statSync(b).size - fs.statSync(a).size
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
  let processed = ['./', null, null, .1, null]
  let currItem
  for (let i = 0; i < args.length; i++) {
    currItem = args[i]
    nextItem = args[i + 1]

    if (currItem == '-p' || currItem == '--path') processed[0] = nextItem

    if (currItem == '-s' || currItem == '--sort') processed[1] = nextItem

    if (currItem == '-m' || currItem == '--metric') processed[2] = true

    if (currItem == '-t' || currItem == '--threshold') processed[3] = nextItem

    if (currItem == '-h' || currItem == '--help') {
      usage()
      return false
    }
  }
  return processed
}

function main() {
  console.time('time')
  let processed = processArgs(process.argv)
  if (processed != false) startGlob(processed[0], processed)
  console.timeEnd('time')
}

main()
