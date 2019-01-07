
let gulp = require('gulp')

let fs = require('fs')
let glob = require('glob')

let runSequence = require('run-sequence')
let exec = require('child_process').exec

let typescript = require('gulp-typescript')
let typedoc = require('gulp-typedoc')


// Copy all express related files in /build
gulp.task('build-express', function (done) {
  console.log('Piping express into /build')
  gulp.src(['src/bin/**/*']).pipe(gulp.dest('build/bin'))
  gulp.src(['src/lessons/**/*']).pipe(gulp.dest('build/lessons'))
  gulp.src(['src/models/**/*']).pipe(gulp.dest('build/models'))
  gulp.src(['src/public/**/*']).pipe(gulp.dest('build/public'))
  gulp.src(['src/routes/**/*']).pipe(gulp.dest('build/routes'))
  gulp.src(['src/views/**/*']).pipe(gulp.dest('build/views'))
  gulp.src('src/app.js').pipe(gulp.dest('build/'))

  done()
})

// Build the compiler (written in typescript) and copy to build/public/js/toolchain/compiler.js
gulp.task('build-toolchain-compiler', function (done) {
  console.log('Compiling toolchain compiler -> public/js/toolchain/compiler.js')

  gulp.src('src/toolchain/compiler/**/*.ts')
    .pipe(typescript({
      noImplicitAny: false,
      out: 'compiler.js',
      target: 'es5',
      module: 'none',
      noEmitOnError: true,
    }))
    .pipe(gulp.dest('build/public/js/toolchain/'))

  done()
})

// Copies the operation and register definitions to C equivalents from the compiler
gulp.task('build-toolchain-vmspec', function (done) {
  console.log('Generating opcode and register specification for the C VM...')

  fs.readFile('./src/toolchain/compiler/Vimmy/Spec/Spec.ts', function (err, data) {
    if (err) {
      return console.log("Can't open Spec.ts to generate specification info!")
    }

    data = data.toString()

    console.log(matches)
    // we got the registers, now the operations
    let opSpec = data.search("this.opDictionary")
    // console.log(opSpec)
    let head = data.substring(opSpec)
    if (opSpec) {
      let ops = []

      let matches = head.match(/new OpSpec\("+[a-zA-Z]*",+[\s?]+[0-9]x[0-9][0-9],/g)
      if (!matches) { return console.log("Spec.ts format corrupted!") }

      // new OpSpec("PUSH",0x01, <- typical match
      let OpSpec = function (mneomic, opcode) {
        this.mneomic = mneomic
        this.opcode = opcode
      }

      for (let i = 0; i < matches.length; i++) {
        if (matches.hasOwnProperty(i)) {
          let match = matches[i]
          // console.log(match)
          // add the left bracket to the comma
          match = match.substring(0, match.length - 1) + ')'

          // push op
          let op = eval(match)
          ops.push(op)
        }
      }

      // build op string
      let cppFriendlyOpSpec = ''
      for (let k in ops) {
        let v = ops[k]

        cppFriendlyOpSpec += 'VM_DEFINE_OPERATION(' + v.mneomic + ',' + v.opcode + ')\r\n'
      }


      // write the specs
      //fs.writeFileSync('./toolchain/vm/RegSpec.h',
      //    '#pragma once \n\n// WARNING: This is an automatically generated file by gulp that contains the vimmy specification from Spec.ts (the official Vimmy assembler) \n\n' + cppFriendlyRegSpec
      //)

      fs.writeFileSync('./src/toolchain/vm/OpSpec.h',
        '#pragma once \n\n// WARNING: This is an automatically generated file by gulp that contains the vimmy specification from Spec.ts (the official Vimmy assembler) \n\n' + cppFriendlyOpSpec
      )

      done()
    }
  })
})


gulp.task('build-toolchain-vm', function (done) {
  console.log('Compiling toolchain virtual machine -> public/js/toolchain/vm.js')
  let reportOptions = {
    err: true,    // default = true, false means don't write err
    stderr: true, // default = true, false means don't write stderr
    stdout: true  // default = true, false means don't write stdout
  }

  glob("src/toolchain/vm/**/*.c", function (er, files) {
    // compile each file into an object
    let compile_cmd = `emcc
      -v
      -O3
      -s WASM=1
      -s TOTAL_MEMORY=128MB
      -s ASSERTIONS=2
      -s RESERVED_FUNCTION_POINTERS=2
      --preload-file ./src/toolchain/vm/data
      -s "EXTRA_EXPORTED_RUNTIME_METHODS=['ccall', 'cwrap', 'addFunction','Pointer_stringify']"
      ${files.join(' ')}
      -o src/toolchain/vm/vm.js
    `.replace(/(\r\n\t|\n|\r\t)/gm, '')

    console.log(compile_cmd)
    exec(compile_cmd, function (err, stdout, stderr) {
      console.log(stdout)
      console.log(stderr)

      if(err) {
        console.log(err)
        return
      }

      // pipe output and memory preinit to relevant directories
      gulp.src('src/toolchain/vm/vm.js').pipe(gulp.dest('build/public/js/toolchain/'))
      gulp.src('src/toolchain/vm/vm.data').pipe(gulp.dest('build/public/'))
      gulp.src('src/toolchain/vm/vm.wasm').pipe(gulp.dest('build/public/js/toolchain/'))

      done()
    })

  })
})


gulp.task('run', function (done) {
  exec('cd build && node app.js', function (err, stdout, stderr) {
    if (err) console.log(err)
    console.log(stdout)
    console.log(stderr)

    done()
  })
})

gulp.task('watch', function () {
  gulp.watch(['src/lessons/**/*'], ['build-express'])
  gulp.watch(['src/models/**/*'], ['build-express'])
  gulp.watch(['src/public/**/*'], ['build-express'])
  gulp.watch(['src/routes/**/*'], ['build-express'])
  gulp.watch(['src/views/**/*'], ['build-express'])

  gulp.watch(['src/toolchain/compiler/**/*.ts'], ['build-toolchain-compiler', 'build-toolchain-vmspec'])
  gulp.watch(['src/toolchain/vm/**/*.h', 'src/toolchain/vm/**/*.c'], ['build-toolchain-vm'])
})


gulp.task('build', gulp.series(
  'build-express',
  'build-toolchain-compiler',
  'build-toolchain-vmspec',
  'build-toolchain-vm',

  function (done) {
    done()
  }
))
