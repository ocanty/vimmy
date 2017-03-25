
var gulp = require("gulp")

var fs = require("fs")
var glob = require("glob")

var runSequence = require('run-sequence');
var exec = require('child_process').exec;

var typescript = require('gulp-typescript');
var typedoc = require("gulp-typedoc");


gulp.task('build-express', function()
{
    console.log("Piping express into /build")
    gulp.src(['src/bin/**/*']).pipe(gulp.dest('build/bin'));
	gulp.src(['src/lessons/**/*']).pipe(gulp.dest('build/lessons'));
	gulp.src(['src/models/**/*']).pipe(gulp.dest('build/models'));
	gulp.src(['src/public/**/*']).pipe(gulp.dest('build/public'));
	gulp.src(['src/routes/**/*']).pipe(gulp.dest('build/routes'));
	gulp.src(['src/views/**/*']).pipe(gulp.dest('build/views'));
	gulp.src('src/app.js').pipe(gulp.dest('build/'))
});

gulp.task('build-toolchain-compiler-documentation', function()
{
    console.log("Generating documentation for toolchain compiler...")
    return gulp.src('src/toolchain/compiler/**/*.ts')
    .pipe(
        typedoc
        (
            {
                // TypeScript options (see typescript docs)
                module: "none",
                target: "es5",
                includeDeclarations: true,

                // Output options (see typedoc docs)
                out: "./doc/toolchain/compiler",
                json: "./doc/toolchain/compiler/json.json",
                
                mode: "file",
                
                // TypeDoc options (see typedoc docs)
                name: "compiler",
                theme: "default",
                ignoreCompilerErrors: false,
                version: true,
            }
        )
    );
});

gulp.task('build-toolchain-compiler', function()
{
    console.log("Compiling toolchain compiler -> public/js/toolchain/compiler.js")

    gulp.src('src/toolchain/compiler/**/*.ts')
    .pipe(
        typescript
        (
            {
                noImplicitAny: false,
                out: 'compiler.js',
                target: 'es5',
                module: 'none',
                noEmitOnError: true,
            }
        )
    )
    .pipe(gulp.dest('build/public/js/toolchain/'));
})

// Copies the operation and register definitions to C equivalents from the compiler
gulp.task('build-toolchain-vmspec', function()
{
    console.log("Generating opcode and register specification for the C VM...")
    fs.readFile('./src/toolchain/compiler/Vimmy/Spec/Spec.ts',function(err,data)
    {
        if(err){ return console.log("Can't open Spec.ts to generate specification info!") }
        
        data = data.toString()
        
        //var regSpec = data.search("enum Register")
        if(true)//regSpec)
        {
            // cut everything off so that our first match will be the enum
            //var head = data.substring(regSpec)
            //var matches = head.match(/{([^}]+)}/g)
            
            //if(!matches){ return console.log("Spec.ts format corrupted!") }
            //var cppFriendlyRegSpec = "enum RegSpec " + matches[0].replace(new RegExp("REGISTER_", 'g'),"") + ";"
            
			console.log(matches)
            // we got the registers, now the operations
            var opSpec  = data.search("this.opDictionary")
            // console.log(opSpec)
            var head = data.substring(opSpec)
            if(opSpec)
            {
                var ops = [ ]
                
                var matches = head.match(/new OpSpec\("+[a-zA-Z]*",+[\s?]+[0-9]x[0-9][0-9],/g)
                if(!matches){ return console.log("Spec.ts format corrupted!") }
                
                // new OpSpec("PUSH",0x01, <- typical match
                var OpSpec = function(mneomic, opcode)
                {
                    this.mneomic = mneomic
                    this.opcode = opcode
                }
                
                for(var i = 0; i < matches.length; i++)
                {
                    if(matches.hasOwnProperty(i))
                    {
                        var match = matches[i]
                        // console.log(match)
                        // add the left bracket to the comma
                        match = match.substring(0,match.length-1) + ")"
                        
                        // push op
                        var op = eval(match)
                        ops.push(op)
                    }
                }
                
                // build op string
                var cppFriendlyOpSpec = ""
                for(var k in ops)
                {
                    var v = ops[k]
                    
                    cppFriendlyOpSpec += "VM_DEFINE_OPERATION(" + v.mneomic + "," + v.opcode + ")\r\n"
                }
                
                
                // write the specs
                //fs.writeFileSync("./toolchain/vm/RegSpec.h",
                //    "#pragma once \n\n// WARNING: This is an automatically generated file by gulp that contains the vimmy specification from Spec.ts (the official Vimmy assembler) \n\n" + cppFriendlyRegSpec
                //)
                
                fs.writeFileSync("./src/toolchain/vm/OpSpec.h",
                    "#pragma once \n\n// WARNING: This is an automatically generated file by gulp that contains the vimmy specification from Spec.ts (the official Vimmy assembler) \n\n" + cppFriendlyOpSpec
                )
            }
        }
    })
});   


gulp.task('build-toolchain-vm', function()
{ 
    console.log("Compiling toolchain virtual machine -> public/js/toolchain/vm.js")
    var reportOptions = {
        err: true, // default = true, false means don't write err 
        stderr: true, // default = true, false means don't write stderr 
        stdout: true // default = true, false means don't write stdout 
    }
	
	// build c

    glob("src/toolchain/vm/**/*.c", function (er, files) 
    {
        
        var run_out_once = true
        
        for(var f in files)
        {
			// compile objects
            console.log("emcc -v -O3 " + files[f] + " -o src/toolchain/vm/" + f + ".bc")
            exec("emcc -v -O3 " + files[f] + " -o src/toolchain/vm/" + f + ".bc", function (err, stdout, stderr) 
                { 
                    console.log(stdout); 
                    console.log(stderr); 
                    
                    if(!err)
                    { 
                        if(run_out_once)
                        {
                            run_out_once = false

							
							// link
                            glob("./src/toolchain/vm/*.bc", function (er, efiles)
                            {
								
                                console.log("emcc -v -O3 " + efiles.join(" ") + "-o src/toolchain/vm/vm.js -s ASSERTIONS=2  -s RESERVED_FUNCTION_POINTERS=2 --preload-file ./src/toolchain/vm/data")
                                exec("emcc -v -O3 " + efiles.join(" ") + " -o src/toolchain/vm/vm.js -s ASSERTIONS=2 -s RESERVED_FUNCTION_POINTERS=2 --preload-file ./src/toolchain/vm/data", function (err, stdout, stderr) 
                                { 
                                    if(!err)
                                    {
										// pipe output and memory preinit to relevant directories
                                        gulp.src("src/toolchain/vm/vm.js").pipe(gulp.dest("build/public/js/toolchain/"))
										gulp.src("src/toolchain/vm/vm.data").pipe(gulp.dest("build/public/"))
                                        gulp.src("src/toolchain/vm/vm.js.mem").pipe(gulp.dest("build/public/"))
										
                                    }
									else
									{
										console.log(err)
									}
                                    
                                    console.log(stdout)
                                    console.log(stderr); 
                                })
                            })
							
                        }
                    }
                }
            )
        }

    })
})


gulp.task('build', function()
{
    runSequence('build-express','build-toolchain-compiler','build-toolchain-vmspec','build-toolchain-vm','watch')
})

gulp.task('run', function()
{
    exec("cd build && node ./bin/www", function (err, stdout, stderr)
	{
		if(err) console.log(err)
		console.log(stdout)
		console.log(stderr)
	})
})

gulp.task('watch', function()
{
	
	gulp.watch(['src/lessons/**/*'],['build-express'])
	gulp.watch(['src/models/**/*'],['build-express']) 
	gulp.watch(['src/public/**/*'],['build-express']) 
	gulp.watch(['src/routes/**/*'],['build-express']) 
	gulp.watch(['src/views/**/*'],['build-express'])  

    gulp.watch(['src/toolchain/compiler/**/*.ts'], ['build-toolchain-compiler','build-toolchain-vmspec']);
    gulp.watch(['src/toolchain/vm/**/*.h','src/toolchain/vm/**/*.c'], ['build-toolchain-vm']);
})
