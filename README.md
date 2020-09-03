
<img src="https://raw.githubusercontent.com/ocanty/vimmy/master/src/public/img/vimmy-logo.png" width="160" height="80" />

The Educational Virtual Machine
====

Screenshots:
----
![](https://i.imgur.com/BhfWOjy.png)
![](https://i.imgur.com/92CER48.png)
![](https://i.imgur.com/7NGZEde.png)
![](https://i.imgur.com/WX6kzz0.png)
![](https://i.imgur.com/HMBWMUf.png)
![](https://i.imgur.com/rrsdZrr.png)

Won these awards:
* CoderDojo CoolestProjects.org 2017 - Best Website
* eir Junior Spiders 2017 - Grand Prize
* eir Junior Spiders 2017 - Best Concept
* eir Junior Spiders 2017 - Creative Web Coding

Significant Areas:
----

**src/toolchain/**         Contains compiler (TypeScript) & virtual machine (C)

**src/public/js/sandbox.js** VM integration + sandbox control

**app.js** Backend entrypoint

**src/routes/** Backend Rendering/Handling Logic

**src/lessons/** Lessons in Markdown

**src/models/** Database Models/Schemas

**src/views/** Views for pages

Building:
----
    git clone <this repo>
    cd <this repo>
    sudo npm install
    gulp build
    
    touch .env
    
    Insert the following data with your favourite text editor
    
    DATABASE=<db>
    AUTH0_CLIENT_ID=<id>
    AUTH0_DOMAIN=<domain>
    AUTH0_CLIENT_SECRET=<secret>
    AUTH0_CALLBACK_URL=<callback url>
	PORT=<listen port>
    SESSION_SECRET=<secret>
	GOOGLE_TRACKING_ID=<analytics id>
    
    cd build
    node app.js
    
Future Plans:
----

* Fix express-session SessionStore (i.e use postgres session-store)
* Modular hardware add/remove in sandbox
* Remove hidden instructions, add LEA
* Document how the instructions/flag modifications work
* Optimize compiler/disassembler
* Fix assertions

ISA Documentation:
----

**Instruction format primer**

This was intentionally made incredibly simple and easily read (rather than using bitfields) to help users understand the encoded instruction

	/**
	 * Instruction layout explained
	 * Instructions are variable sizes
	 * 0xABCD 0xEFGH 0xIJ
	 *
	 * 0xAB   -> specifies operation (AB is the opcode)
	 *
	 * 0xCD   -> specifies operand types (see operands.c)
	 *           where C is the type of destination
	 *           and D is type of src
	 *
	 * 0xEF   -> if a register is in the instruction,
	 *           E will be the dest register
	 *           F will be the source register
	 *           If the immediate value uses a register offset, (either in src or dst)
	 *           that register will be in their respective slot
	 *
	 * 0xGHIJ -> Constant value / immediate value
	 *           OR
	 *           Two's complement signed value for reg-offset i.e. [a+0x100],
	 *
	 * Example encoding:
	 * 03  12  10  00  01   ::::::::::    mov a, 1
	 * ^   ^   ^        ^---> constant value
	 * |   |   |---> register 1 (reg), 0 (not used)
	 * |   |---> operand types, 1 (reg), 2 (immediate value)
	 * |---> opcode
	 *
	 * enum OperandTypeEncoded
	 * {
	 *     NONE = 0x0,
	 *     REGISTER = 0x1,                     //  r, Register notation: a,b,c, ...
	 *     CONSTANT = 0x2,                     //  c, Any parseInt(...,10) literal except negatives: 1, 0x1, ...
	 *     MEMORY_REGISTER = 0x3,              //  [reg]
	 *     MEMORY_REGISTER_DISPLACEMENT = 0x4, //  [reg+offset] [reg-offset]
	 *     MEMORY_CONSTANT = 0x5               //  [number]
	 * };
	 **/


    
