
<img src="https://raw.githubusercontent.com/ocanty/vimmy/master/src/public/img/vimmy-logo.png" width="160" height="80" />

Vimmy: The Educational Virtual Machine
====

Significant Areas:
----

**src/toolchain/**         Contains compiler (TypeScript) & virtual machine (C)

**src/public/js/sandbox.js** VM integration + sandbox control

**app.js** Backend entrypoint

**src/routes/** Backend Rendering/Handling Logic

**src/lessons/** Lessons in Markdown

**src/models/** Database Models/Schemas

**src/views/** Templates for pages

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
    SESSION_SECRET=<secret>
    
    cd build
    node ./bin/www
    
Future Plans:
----

* Make hardware devices modular (i.e not global C pointers as they are no, will also allow for more devices)
* Modular hardware add/remove in sandbox
* Code clean-up

    