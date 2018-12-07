
<img src="https://raw.githubusercontent.com/ocanty/vimmy/master/src/public/img/vimmy-logo.png" width="160" height="80" />

The Educational Virtual Machine
====

###### _Please note: This was written before I had a formal computer science education._

Screenshots:
----
![](https://i.imgur.com/BhfWOjy.png)
![](https://i.imgur.com/92CER48.png)
![](https://i.imgur.com/7NGZEde.png)
![](https://i.imgur.com/WX6kzz0.png)
![](https://i.imgur.com/HMBWMUf.png)
![](https://i.imgur.com/rrsdZrr.png)

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
* Make hardware devices modular (i.e not global C pointers as they are now, will also allow for more devices)
* Modular hardware add/remove in sandbox
* Code clean-up
* Remove hidden instructions, add LEA
* Document how the instructions/flag modifications work
* Optimize compiler/disassembler
* Fix assertions


    
