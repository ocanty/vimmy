// Runs on sandbox.pug
// Be sure to load toolchain/compiler.js before this file and toolchain/vm.js after this file
// toolchain/vm.js will fire the code that executes the code in this file when it is loaded

var Vimmy = Vimmy || { }

// Class that controls data displayed on the VM frontend page and integrates with the compiled VM
Vimmy.Integration = function()
{
	var _self = this
	
	console.log(Vimmy)
	
	// Check if code was dropped by the server
	var _self = this
	
	// Setup editor
	this.Editor = CodeMirror.fromTextArea(document.getElementById("code-entry"),{
		lineNumbers: true,
		theme: "base16-dark",
		mode: "gas",
		readOnly: window.vimmyRunMode
	});
	
	// Set up event listeners to tell the user to save if they have changed code in the editor
	_self.confirmOnPageExit = function (e) 
	{
		// If we haven't been passed the event get the window.event
		e = e || window.event;

		var message = 'Are you sure you want to leave this page without saving your progress?';

		// For IE6-8 and Firefox prior to version 4
		if (e) 
		{
			e.returnValue = message;
		}

		// For Chrome, Safari, IE8+ and Opera 12+
		return message;
	};
		
		
	window.onbeforeunload = _self.confirmOnPageExit;
	// Set default code value
	
	if(!window.vimmyRunMode)
	{
		this.Editor.getDoc().setValue(
			'start: mov a,1\n' +
			'mov a,[a+1]\n' +
			'mov a,3\n' +
			'mov a,4\n' +
			'mov a,5\n' +
			'mov a,6\n' +
			'jmp start'.toLowerCase());
	}
	else	
	{
		this.Editor.getDoc().setValue("Loading project...")
	}
	
	// Set up event listeners to tell the user to save if they have changed code in the editor
	this.Editor.on("change",function(cm,change)
	{
		window.onbeforeunload = _self.confirmOnPageExit;
	});
	
	var setDropped = false
	var setOnDrop = function()
	{
		if(typeof window.vimmyDroppedCode !== 'undefined' && typeof window.vimmyDroppedData !== 'undefined' && !setDropped)
		{
			//_self.Editor.off('change');
			_self.Editor.getDoc().setValue(window.vimmyDroppedCode.toLowerCase());
			//_self.Editor.on('change');
			dropSetCode = true
			
			window.onbeforeunload = null; // remove the "are we saved" for this change as this is the initial text
			
			$("#vm-data-input").empty()
			
			for(var n in window.vimmyDroppedData)
			{
				var datavar = window.vimmyDroppedData[n]
				_self.addDataVar(datavar.type,datavar.name,datavar.value)
			}
			setDropped = true
		}
		else
		{
			setTimeout(setOnDrop,1000)
		}
		
	}
	setOnDrop()

	
	// Data
	
	// Data image conversion -> upload file -> base64 -> rgb888 -> rgb565
	$(document).on("change","input", function()
	{
		var element = this
		var elementjq = $(element)
		if(elementjq.attr("type") == "file")
		{
			var input = element
			// http://stackoverflow.com/questions/4459379/preview-an-image-before-it-is-uploaded
			if (input.files && input.files[0]) 
			{
				var reader = new FileReader();

				reader.onload = function (e) 
				{
					// we have a base64 url, to do image manipulating we need a canvas
					var c = document.createElement("canvas")
					var ctx = c.getContext("2d")
					var img = new Image();
					img.src = e.target.result
					
					img.onload = function(e)
					{
						// Use canvas to get pixels
						ctx.width = img.width
						ctx.height = img.height
						ctx.drawImage(img,0,0)
						var imageData = ctx.getImageData(0,0,img.width,img.height)
						var data = imageData.data
						c.remove()
						
						
						// Convert pixels
						var compat_ptr = 0
						var vm_compat_data = new Uint16Array(img.width*img.height)
						
						
						for(var i=0; i<data.length; i+=4)
						{
							var red = data[i];
							var green = data[i+1];
							var blue = data[i+2];
							var alpha = data[i+3];
							
							// rgb888 to rgb565
							vm_compat_data[compat_ptr] = ((((red>>3)<<11) | ((green>>2)<<5) | (blue>>3)))
							compat_ptr++;
						}
						
						var testcopy = new Uint8Array(vm_compat_data.buffer)
						var outstr = ""
						
						// we need to collect two bytes at a time and reverse them for the endianess
						var prev = 0
						var odd = 0
						for(var i = 0; i < testcopy.length; i++)
						{
							//if(!odd)
							//{
							//	prev = _self.numberToHexStr(testcopy[i])
							//	odd = 1
							//}
							//else
							//{
							//	outstr = outstr + _self.numberToHexStr(testcopy[i]) + prev
							//	odd = 0
							//}
							
							outstr += _self.numberToHexStr(testcopy[i])
						}
						


					
						var variable_inputs = elementjq.parent().parent().find(".col-variable > input")
						// $(variable_inputs[0]).val("sprite" + img.width + "x" + img.height + "_" + Math.round(Math.random()*50).toString())
						$(variable_inputs[1]).val(outstr)
						
					}
				}
				
				reader.readAsDataURL(input.files[0])
				
			}
		}
	})
	
/* 	_self.addDataVar("number","number_test",7)
	_self.addDataVar("string","string_asd","hey")
	_self.addDataVar("bytearray","bytearray_bytearray","AABB")
	_self.addDataVar("sprite","sprite_test2","DDEE")
	_self.addDataVar("constant","constant_ayy","2312") */
	
	// beautiful implementation
	// http://stackoverflow.com/a/8084248/1924602
	var randStr = function() { return (Math.random() + 1).toString(36).substring(2,7); }
	
	$("#btn-add-sprite").click(		function(){ _self.addDataVar("sprite","sprite_"+randStr(),"Click change to insert sprite") })
	$("#btn-add-number").click(  	function(){ _self.addDataVar("number","number_"+randStr(),"0") })
	$("#btn-add-constant").click(	function(){ _self.addDataVar("constant","constant_"+randStr(),"0") })
	$("#btn-add-string").click(		function(){ _self.addDataVar("string","string_"+randStr(),"Hello world!") })
	$("#btn-add-bytearray").click(	function(){ _self.addDataVar("bytearray","bytearray_"+randStr(),"AABBCCDDEEFF0011223344") })
	
	// When a user hits assemble
	$("#btn-assemble-run").click(function(){ _self.onClickAssemble(_self,true) })
	
	$("#btn-assemble").click(function(){ _self.onClickAssemble(_self,false) })
	
	// Saving and publishing
	$("#btn-save").click(function()
	{
		var vars  = { }
		if(!window.vimmyPostUrl)
		{
			vars = { 
					name: $("#input-name").val(),
					category: $("#select-category").val(),
					code: _self.Editor.getDoc().getValue(),
					data: JSON.stringify(_self.buildDataTable())
				}
		}
		else
		{
			vars = { 
					code: _self.Editor.getDoc().getValue(),
					data: JSON.stringify(_self.buildDataTable())
				}
		}
		
		console.log(vars)
		window.onbeforeunload = null;
		$.ajax({
			type: "POST",
			url: window.vimmyPostUrl || "/create/sandbox/save",
			data: vars,
			success: function(data)
				{
					window.location = data
				},
			error: function(error)
				{
					var show_error = function()
					{
						$("#btn-save").text(error.responseText)
						setTimeout(function(){ $("#btn-save").text("Save") },3000)
					}
					
					show_error()
				}
		});
	})
		
	
	// Compiler messages
	// Clear compiler result box (+ push header)
	this.clearMessages();
	
	// VM Control Buttons
	$("#btn-vm-reset").click(function()
    {
		_self.vm_reset(_self.vm_ptr)
		_self.doDisassembly()
    })
	
	$("#btn-vm-play").click(function()
    {
		// pause if playing, play if paused
		if(_self.vm_get_status(_self.vm_ptr) > 0) _self.vm_set_status(_self.vm_ptr,0)
		else _self.vm_set_status(_self.vm_ptr,2)
    })
	
	$("#btn-vm-stepone").click(function()
    {
		_self.vm_set_status(_self.vm_ptr,1)
    })
	
	// Keyboard, arrows utf-8 values (utf-16)
	$.keyboard.keyaction.uparrow = function(base)		{ if(_self.vm_get_status(_self.vm_ptr) > 0){ _self.vmhw_keyboard_keypress(0x2191); } };
	$.keyboard.keyaction.downarrow = function(base)	{ if(_self.vm_get_status(_self.vm_ptr) > 0){ _self.vmhw_keyboard_keypress(0x2190); } }; // 	0x2190
	$.keyboard.keyaction.leftarrow = function(base)	{ if(_self.vm_get_status(_self.vm_ptr) > 0){ _self.vmhw_keyboard_keypress(0x2193); } };
	$.keyboard.keyaction.rightarrow = function(base)	{ if(_self.vm_get_status(_self.vm_ptr) > 0){ _self.vmhw_keyboard_keypress(0x2192); } };
	
	$('#vm-keyboard').keyboard(
	{

		// set this to ISO 639-1 language code to override language set by the layout
		// http://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
		// language defaults to "en" if not found
		language     : null,  // string or array
		rtl          : false, // language direction right-to-left

		// *** choose layout ***
		layout       : 'custom',
		 display: {
			'leftarrow'   : '\u2190', // Diamond
			'rightarrow'  : '\u2192',
			'uparrow' : '\u2191',
			'downarrow' : '\u2193'
		},
		layout: 'custom',
			customLayout: {
				'normal': [
					'` 1 2 3 4 5 6 7 8 9 0 - = {bksp}',
					'{tab} q w e r t y u i o p [ ] \\',
					'a s d f g h j k l ; \' {enter}',
					'{shift} z x c v b n m , . / {shift}',
					'{space}  {leftarrow} {rightarrow} {uparrow} {downarrow}'
				],
				'shift': [
					'~ ! @ # $ % ^ & * ( ) _ + {bksp}',
					'{tab} Q W E R T Y U I O P { } |',
					'A S D F G H J K L : " {enter}',
					'{shift} Z X C V B N M < > ? {shift}',
					'{space}  {leftarrow} {rightarrow} {uparrow} {downarrow}'
				]
			},
		position: false,

		// allow jQuery position utility to reposition the keyboard on window resize
		reposition : false,

		// preview added above keyboard if true, original input/textarea used if false
		usePreview : false,

		// if true, the keyboard will always be visible
		alwaysOpen : true,

		// give the preview initial focus when the keyboard becomes visible
		initialFocus : true,
		// Avoid focusing the input the keyboard is attached to
		noFocus : false,

		// if true, keyboard will remain open even if the input loses focus.
		stayOpen : true,

		// Prevents the keyboard from closing when the user clicks or
		// presses outside the keyboard. The `autoAccept` option must
		// also be set to true when this option is true or changes are lost
		userClosed : false,

		// if true, keyboard will not close if you press escape.
		ignoreEsc : false,

		// if true, keyboard will only closed on click event instead of mousedown or
		// touchstart. The user can scroll the page without closing the keyboard.
		closeByClickEvent : false,

		// Message added to the key title while hovering, if the mousewheel plugin exists
		wheelMessage : 'Use mousewheel to see other keys',

		css : {
			// input & preview
			input          : 'ui-widget-content ui-corner-all',
			// keyboard container
			container      : 'ui-widget-content ui-widget ui-corner-all ui-helper-clearfix',
			// keyboard container extra class (same as container, but separate)
			popup: '',
			// default state
			buttonDefault  : 'btn btn-sandbox',
			// hovered button
			buttonHover    : 'ui-state-hover',
			// Action keys (e.g. Accept, Cancel, Tab, etc); replaces "actionClass"
			buttonAction   : 'ui-state-active',
			// used when disabling the decimal button {dec}
			buttonDisabled : 'ui-state-disabled',
			// empty button class name {empty}
			buttonEmpty    : 'ui-keyboard-empty'
		},

		// *** Useability ***
		// Auto-accept content when clicking outside the keyboard (popup will close)
		autoAccept : false,
		// Auto-accept content even if the user presses escape
		// (only works if `autoAccept` is `true`)
		autoAcceptOnEsc : false,

		// Prevents direct input in the preview window when true
		lockInput : false,

		// Prevent keys not in the displayed keyboard from being typed in
		restrictInput : false,
		// Additional allowed characters while restrictInput is true
		restrictInclude : '', // e.g. 'a b foo \ud83d\ude38'

		// Check input against validate function, if valid the accept button
		// is clickable; if invalid, the accept button is disabled.
		acceptValid : true,
		// Auto-accept when input is valid; requires `acceptValid`
		// set `true` & validate callback
		autoAcceptOnValid : false,

		// if acceptValid is true & the validate function returns a false, this option
		// will cancel a keyboard close only after the accept button is pressed
		cancelClose : true,

		// Use tab to navigate between input fields
		tabNavigation : false,

		// press enter (shift-enter in textarea) to go to the next input field
		enterNavigation : false,
		// mod key options: 'ctrlKey', 'shiftKey', 'altKey', 'metaKey' (MAC only)
		// alt-enter to go to previous; shift-alt-enter to accept & go to previous
		enterMod : 'altKey',

		// if true, the next button will stop on the last keyboard input/textarea;
		// prev button stops at first
		// if false, the next button will wrap to target the first input/textarea;
		// prev will go to the last
		stopAtEnd : true,

		// Set this to append the keyboard immediately after the input/textarea it
		// is attached to. This option works best when the input container doesn't
		// have a set width and when the "tabNavigation" option is true
		appendLocally : true,

		// Append the keyboard to a desired element. This can be a jQuery selector
		// string or object
		appendTo : $("#keyboard-holder"),

		// If false, the shift key will remain active until the next key is (mouse)
		// clicked on; if true it will stay active until pressed again
		stickyShift : true,

		// caret placed at the end of any text when keyboard becomes visible
		caretToEnd : false,

		// Prevent pasting content into the area
		preventPaste : true,

		// caret stays this many pixels from the edge of the input
		// while scrolling left/right; use "c" or "center" to center
		// the caret while scrolling
		scrollAdjustment : 10,

		// Set the max number of characters allowed in the input, setting it to
		// false disables this option
		maxLength : 0,

		// allow inserting characters @ caret when maxLength is set
		maxInsert : false,

		// Mouse repeat delay - when clicking/touching a virtual keyboard key, after
		// this delay the key will start repeating
		repeatDelay : 500,

		// Mouse repeat rate - after the repeatDelay, this is the rate (characters
		// per second) at which the key is repeated. Added to simulate holding down
		// a real keyboard key and having it repeat. I haven't calculated the upper
		// limit of this rate, but it is limited to how fast the javascript can
		// process the keys. And for me, in Firefox, it's around 20.
		repeatRate : 20,

		// resets the keyboard to the default keyset when visible
		resetDefault : false,

		// Event (namespaced) on the input to reveal the keyboard. To disable it,
		// just set it to an empty string ''.
		openOn : 'ready',

		// When the character is added to the input
		keyBinding : 'mousedown',

		// enable/disable mousewheel functionality
		// enabling still depends on the mousewheel plugin
		useWheel : true,

		// combos (emulate dead keys)
		// http://en.wikipedia.org/wiki/Keyboard_layout#US-International
		// if user inputs `a the script converts it to à, ^o becomes ô, etc.
		useCombos : true,

		// *** Methods ***
		// Callbacks - add code inside any of these callback functions as desired
		initialized   : function(e, keyboard, el) {},
		beforeVisible : function(e, keyboard, el) {},
		visible       : function(e, keyboard, el) {},
		beforeInsert  : function(e, keyboard, el, textToAdd) { if(_self.vm_get_status(_self.vm_ptr) > 0){  console.log(textToAdd,textToAdd.charCodeAt(0)); _self.vmhw_keyboard_keypress(textToAdd.charCodeAt(0));  } return textToAdd; },
		change        : function(e, keyboard, el) {},
		beforeClose   : function(e, keyboard, el, accepted) {},
		accepted      : function(e, keyboard, el) {},
		canceled      : function(e, keyboard, el) {},
		restricted    : function(e, keyboard, el) {},
		hidden        : function(e, keyboard, el) {},

		// called instead of base.switchInput
		switchInput : function(keyboard, goToNext, isAccepted) {},

		// used if you want to create a custom layout or modify the built-in keyboard
		create : function(keyboard) { return keyboard.buildKeyboard(); },

		// build key callback (individual keys)
		buildKey : function( keyboard, data ) {
		/*
		data = {
		  // READ ONLY
		  // true if key is an action key
		  isAction : [boolean],
		  // key class name suffix ( prefix = 'ui-keyboard-' ); may include
		  // decimal ascii value of character
		  name     : [string],
		  // text inserted (non-action keys)
		  value    : [string],
		  // title attribute of key
		  title    : [string],
		  // keyaction name
		  action   : [string],
		  // HTML of the key; it includes a <span> wrapping the text
		  html     : [string],
		  // jQuery selector of key which is already appended to keyboard
		  // use to modify key HTML
		  $key     : [object]
		}
		*/
		return data;
		},

		// this callback is called just before the "beforeClose" to check the value
		// if the value is valid, return true and the keyboard will continue as it
		// should (close if not always open, etc)
		// if the value is not value, return false and the clear the keyboard value
		// ( like this "keyboard.$preview.val('');" ), if desired
		// The validate function is called after each input, the "isClosing" value
		// will be false; when the accept button is clicked, "isClosing" is true
		validate : function(keyboard, value, isClosing) {
		return true;
		}

		}
	);
	
	//////////////////////////////////////////////////
	// Setup screen
	//////////////////////////////////////////////////
	var c = document.getElementById("vm-screen");
	this.Canvas = c.getContext("2d");
	
	var vimmy_splash = new Image();
	vimmy_splash.src="/img/vimmy-logo.png"
	vimmy_splash.onload = function()
	{
		_self.Canvas.fillRect(0,0,256,256)
		// _self.Canvas.drawImage(vimmy_splash,16,16,128,64)
		
		// _self.Canvas.fillStyle = "white"
		// _self.Canvas.fillText("waiting for ROM",128,128);
	}
	
	//////////////////////////////////////////////////
	// Build memory table
	//////////////////////////////////////////////////
	var tbody = $("#vm-mem-view-primary")
    var startaddr = 0x0
    for(var i = 0; i < 14; i++)
    {   
		// build table
        tbody.append("<tr>" +
            "<th valign=\"middle\">" + "0x" + this.numberToHexStr(startaddr) + "<br/></th>   " +
            "<td valign=\"middle\">??</td>       " +
            "<td valign=\"middle\">??</td>       " +
            "<td valign=\"middle\">??</td>       " +
            "<td valign=\"middle\">??</td>       " +
            "<td valign=\"middle\">??</td>       " +
            "<td valign=\"middle\">??</td>       " +
            "<td valign=\"middle\">??</td>       " +
            "<td valign=\"middle\">??</td>       " +
            "<td valign=\"middle\">??</td>       " +
        + "</tr>")
        
        startaddr += 0x10
    }
	
	// Set memMap preview location to the default rom load point because the user is lazy
	_self.memMapAddr = 0xFFF
	
	// When the user edits the memory map address, this updates the variable that is read by the debug loop
	$("#vm-mem-view-addr-primary").on("change", function() 
	{
        var addr = parseInt($("#vm-mem-view-addr-primary").val())
        
        if(addr != NaN){ _self.memMapAddr = addr }
    });
	
	
	//////////////////////////////////////////////////
	// Setup VM
	//////////////////////////////////////////////////
	this.vm_init        = Module.cwrap('vm_init','number')
	this.vm_reset       = Module.cwrap('vm_reset','null',['number'])
	this.vm_get_status  = Module.cwrap('vm_get_status','number',['number'])
	this.vm_set_status  = Module.cwrap('vm_set_status','null',['number','number'])
	this.vm_cycle       = Module.cwrap('vm_cycle','null',['number'])
	this.vm_deinit      = Module.cwrap('vm_deinit','null',['number'])
	this.vm_get_mem_ptr = Module.cwrap('vm_get_mem_ptr','number',['number'])
	this.vmhw_interrupter_queue_interrupt = Module.cwrap("vmhw_interrupter_queue_interrupt","null",["number"])
	
	this.vmhw_keyboard_keypress = Module.cwrap('vmhw_keyboard_keypress','null',['number'])
	this.vmhw_gpu_get_screen_ptr = Module.cwrap('vmhw_gpu_get_screen_ptr','number')
	
	this.vm_get_dasm_string  = Module.cwrap('vm_get_dasm_string','null',['number','number'])
	
	// Getters for each possible reg in the frontend
	var reg = [ "A", "B", "C", "D", /*"AH", "AL","BH","BL",*/"PC","SP","BP","SF","CF"]
	
	for(var n in reg)
	{
		var name = "vm_get_" + reg[n]
		this[name] = Module.cwrap(name,'number',['number'])
		
		if(!this[name]){ console.log("FAILED reg getter ",name) }
	}
	
	// Init vm and save the vm_state* ptr that is used on most vm_* calls
	this.vm_ptr = this.vm_init()
	console.log("vm_state* ptr:",this.vm_ptr || console.log("FAILED vm_ptr is NULL"))
	
	// Get pointer to the VM's memory array in emscripten's heap
	this.vm_mem_ptr = this.vm_get_mem_ptr(this.vm_ptr) || console.log("FAILED vm_mem_ptr is NULL")
	console.log("vm memory ptr:",this.vm_mem_ptr)
	
	this.vm_scr_ptr = this.vmhw_gpu_get_screen_ptr()
	console.log("vm scr ptr:",this.vm_scr_ptr);
	
	// Debugging
	this.debugCycle()
	
	// see psot cycle hook below, for vsync-like simulation
	//this.gpuCycle()
	
}

Vimmy.Integration.prototype.dataUid = 0
Vimmy.Integration.prototype.addDataVar = function(type,_name,_val)
{
	// var change
	var _self = this
	// data-toggle="tooltip" title="ASD")
	var name = _name
	var val = _val
	
	$("#vm-data-input").append('<div class="row"> \
	<div class="col-sm-2 col-variable" data-toggle="tooltip" title="' + type + '"><input placeholder="Data Name" type="text" data-uid="' +this.dataUid+ '" data-type="' + type + '" value="' + name + '" style="width: 100%" class="input-variable variable-name"/></div> \
	<div class="col-sm-8 col-variable"><input placeholder="Data" type="text" data-uid="' +this.dataUid+ '" data-type="' + type + '" value="' + val + '" style="width: 100%" class="input-variable variable-type"/></div> \
	<div class="col-sm-2 col-variable"> \
	<button class="btn btn-sandbox btn-variable" onclick="$(this).parent().parent().remove();">Remove</button>' 
	+ 
	(
		type=="sprite" 
		? 
			'<input type="file" id="variable-file-' + this.dataUid + '" class="btn btn-sandbox btn-variable" style="position:absolute;top:-1000px"></input>' + 
			'<button class="btn btn-sandbox btn-variable" onclick="$(\'#variable-file-' + this.dataUid +'\').click()">Change</button>' 
		: 
			""
	) + '</div></div>')
	
	// scroll to bottom to show added data type
	$("#vm-data-input").animate({ scrollTop: $('#vm-data-input').prop("scrollHeight")}, 1);
	this.dataUid = this.dataUid + 1
}

// Builds a table from the data elements
Vimmy.Integration.prototype.buildDataTable = function()
{
	var table = { }
	var rows = $("#vm-data-input").find(".row").each(function(i)
	{
		table[i] = { 
			type: $($($(this).find(".col-variable")[0]).find("input")[0]).attr("data-type"),
			name: $($($(this).find(".col-variable")[0]).find("input")[0]).val(),
			value: $($($(this).find(".col-variable")[1]).find("input")[0]).val()
		}
	})
	
	return table
}

Vimmy.Integration.prototype.numberToHexStr = function(number)
{
	if(number < 0xF)
    {
        return "0" + number.toString(16).toUpperCase()
    }
    
    return number.toString(16).toUpperCase()
}

Vimmy.Integration.prototype.hexStringToArray = function(string)
{
	f
}

Vimmy.Integration.prototype.arrayToString = function(string)
{
	var ret = new Uint8Array(0xFFFF)
}



Vimmy.Integration.prototype.clearMessages = function()
{
    $("#compiler-messages").children(".msg").each(function(){ this.remove() })
	// push header
	this.pushInfo(":: vimmyVM Assembler :: waiting for input ::")
}

Vimmy.Integration.prototype.pushError = function(str)
{
	// http://stackoverflow.com/questions/10503606/scroll-to-bottom-of-div-on-page-load-jquery
    $("#compiler-messages").append("<div class=\"msg msg-error\">" + str + "</div>")
	// scroll to bottom
	$("#compiler-messages").animate({ scrollTop: $('#compiler-messages').prop("scrollHeight")}, 1);
}

Vimmy.Integration.prototype.pushInfo = function(str)
{
    $("#compiler-messages").append("<div class=\"msg msg-info\">" + str + "</div>")
	$("#compiler-messages").animate({ scrollTop: $('#compiler-messages').prop("scrollHeight")}, 1);
}

// loads a rom onto the emscripten heap where the vm's memory is
Vimmy.Integration.prototype.loadROM = function(rom,load_addr)
{
	console.log("loading rom ")
	// todo optimize, currently does a 1by1 copy
	var t = 0
	for(var n in rom)
	{
		var c = rom[n]
		Module.HEAPU8[this.vm_mem_ptr+load_addr+t] = c
		t+=1
	}
	
	//console.log(Module.HEAPU8)
}

Vimmy.Integration.prototype.onClickAssemble = function(_this,run)
{
	this.clearMessages()
    console.log(this)
	this.pushInfo("Verifying data before assembling...");
	
	// Build data block
	// The data block is stored in the ROM at loc 0, (loaded in at loc 0x0100)
	// it fills up until 0x0FFF where code begins
	var data_ptr = 0 // the end address of the current data stored in datablock
	var datalabels = { }
	var datablock = new Uint8Array(0x0FFF-0x0100); // added to rom at 0x0100
	var table = this.buildDataTable()
	var labels = { }
	var data_error = false
	
	// go through the table and convert into data 
	for(var k in table)
	{
		var obj = table[k]
		console.log(obj)
		if(obj.name.match(/\d/) != null)
		{
			data_error = true; this.pushError("Data :: numbers in datanames are not allowed: " + obj.name)
		}
		
		switch(obj.type)
		{
			// convert number to two 8bit and place in data
			case "number":
				var val = parseInt(obj.value)
				if(!val){ data_error = true; this.pushError("Data :: invalid number " + obj.name)}
				
				labels[obj.name] = 0x100 + data_ptr
				datablock[data_ptr+1] = (val>>8)&0xFF
				datablock[data_ptr+2] = val&0xFF
				data_ptr = data_ptr + 3
				
			break
			
			case "constant":
				var val = parseInt(obj.value)
				if(!val){ data_error = true; this.pushError("Data :: invalid constant " + obj.name)}
				
				labels[obj.name] = val
			break
			
			// convert to ascii
			case "string":
				var str = obj.value
				labels[obj.name] = 0x100 + data_ptr
				for(var i =0; i < str.length; i++)
				{
					datablock[data_ptr] = str.charCodeAt(i)
					data_ptr = data_ptr + 1
				}
				
				// null terminate
				datablock[data_ptr] = 0x0
				data_ptr = data_ptr + 1
			break
			
			// convert hex to data
			case "sprite":
				var str = obj.value
				labels[obj.name] = 0x100 + data_ptr
				for(var i =0; i < str.length; i += 2)
				{
					var hex = "0x"+str.substring(i,i+2)
					if(parseInt(hex,16) == NaN){ data_error = true; this.pushError("Data :: invalid sprite " + obj.name)}
					datablock[data_ptr] = parseInt(hex,16)
					data_ptr = data_ptr + 1
				}
			break;
			
			// convert hex to data
			case "bytearray":
				var str = obj.value
				labels[obj.name] = 0x100 + data_ptr
				for(var i =0; i < str.length; i += 2)
				{
					var hex = "0x"+str.substring(i,i+2)
					if(parseInt(hex,16) == NaN){ data_error = true; this.pushError("Data :: invalid bytearray " + obj.name)}
					datablock[data_ptr] = parseInt(hex,16)
					data_ptr = data_ptr + 1
				}
			break
		}
	}
	
	if(data_ptr>(0xFFF-0x100))
	{
		this.pushError("Data :: Too much data! Exceeding size limit of 0x" + this.numberToHexStr(0xFFF-0x100))
		data_error = true
	}
	
	console.log(labels)
	
	
	if(data_error) // data bad
	{
		this.pushError("Data error");
	}
	else
	{
		var compiler = compiler || new Vimmy.Assembler.Compiler
		var tokenizer = tokenizer || new Vimmy.Assembler.Tokenizer
		
		var compileResult = compiler.compile(tokenizer.tokenize(this.Editor.getDoc().getValue().toLowerCase()),true,labels);
		
		for(var n in compileResult.compileMessages)
		{
			var msg = compileResult.compileMessages[n].message
			
			switch(compileResult.compileMessages[n].type)
			{
				// see doc/toolchain/compiler/enums/vimmy.assembler.compilemessagetype.html
				case 0: this.pushInfo(msg); break;
				case 2: this.pushError(msg); break;
			}
		}
		
		// if there wasn't a compilation error
		if(!compileResult.error && (run==true))
		{
			// reset the vm -> clear memory/registers/etc
			this.vm_reset(this.vm_ptr)
			
			// setup the rom
			// add the data
			var rom_with_data = new Uint8Array(compileResult.ROM.binary.length+0xF00)
			rom_with_data.set(new Uint8Array(datablock.buffer),0)
			rom_with_data.set(new Uint8Array(compileResult.ROM.binary.buffer),0xF00)
			
			// load our rom at data entry, 
			this.loadROM(rom_with_data,0x00FF)
			this.debugLabels = compileResult.labels
			
			// disassemble the rom 
			this.doDisassembly()
			
			// set the vm to run in continous step mode
			this.vm_set_status(this.vm_ptr,2)
			
			// start the vm cycle
			try {
				this.vm_cycle(this.vm_ptr)
			}
			catch(e)
			{
				console.log(e)
			}
		}
		else
		{
			this.vm_set_status(this.vm_ptr,0)
		}
	}
}

// Runs through the entire memory set of the virtual machine and attempts to disassemble any instructions
Vimmy.Integration.prototype.doDisassembly = function()
{
	var tbody = $("#vm-dasm-primary")
	tbody.empty();
	
	var dasm = Module._malloc(0xFFFF)
	this.vm_get_dasm_string(this.vm_ptr,dasm)
	var dasmstr = Module.Pointer_stringify(dasm)
	
	if(dasmstr)
	{
		var dasmarr = dasmstr.split("\n")
		for (var i = 0; i < dasmarr.length; i++) 
		{
			if(i%2)
			{
				tbody.append("<tr><th valign=\"middle\">" + dasmarr[i-1] + "</th><td valign=\"left\">" + dasmarr[i] +"</td></tr>")
			}
		}
	}
	
	Module._free(dasm)
	
}

// window.requestAnimFrame = (function(){
  // return  window.requestAnimationFrame       || 
          // window.webkitRequestAnimationFrame || 
          // window.mozRequestAnimationFrame    || 
          // window.oRequestAnimationFrame      || 
          // window.msRequestAnimationFrame     || 
          // function( callback ){
            // window.setTimeout(callback, 1000 / 60);
          // };
// })();

var fadeframes = [ ]

Vimmy.Integration.prototype.gpuCycle = function()
{
	var _self = this
	//requestAnimFrame(function(){ _self.gpuCycle() })
	
	this.gpuCycleBuffer = this.gpuCycleBuffer || new Uint8ClampedArray(256*256*4)
	// RGB565 -> RGB888
	var x = 0
	var color = 0
	var i = 0
 	while(i < (256*256)*2)
	{
		color = (Module.HEAPU8[this.vm_scr_ptr+i] << 8) | (Module.HEAPU8[this.vm_scr_ptr+i+1]);
		
		i+=2;
		this.gpuCycleBuffer[x] 	 = 	((((color >> 11) & 0x1F) * 527) + 23) >> 6;  // r
		this.gpuCycleBuffer[x+1] = ((((color >> 5) & 0x3F) * 259) + 33) >> 6;   // g
		this.gpuCycleBuffer[x+2] = (((color & 0x1F) * 527) + 23) >> 6;          // b	
		this.gpuCycleBuffer[x+3] = 255
		x+=4
		
	}
	
	this.gpuCycleImage = new ImageData(this.gpuCycleBuffer,256,256)
	this.Canvas.putImageData(this.gpuCycleImage,0,0)

}

Vimmy.Integration.prototype.signedToUnsigned = function(num)
{
	return (new Uint16Array([num]))[0]
}

// shows debug info like reg/callstack/memory
Vimmy.Integration.prototype.debugCycle = function()
{
	var _self = this
	setTimeout(function(){ _self.debugCycle() },10)

	if(_self.vm_ptr)
	{
		// Control button glyphs depending on if VM is running or not
		var status = this.vm_get_status(this.vm_ptr)
		$("#vm-button-play-icon").removeClass("glyphicon-pause glyphicon-play")
		switch(status)
		{
			case 0: $("#vm-button-play-icon").addClass("glyphicon-play"); break;
			case 1: $("#vm-button-play-icon").addClass("glyphicon-pause"); break;
			case 2: $("#vm-button-play-icon").addClass("glyphicon-pause"); break;
		}
		
		// Build mem table off current memory view
		var lastaddr = this.memMapAddr
		// Don't update as regulalary as other stuff -> lags firefox
 		this.memMapLastUpdate = (this.memMapLastUpdate+1) || 1
		
		if(this.memMapLastUpdate > 100)
		{
			// Update memory only once per second
			$("#vm-mem-view-primary > tr").each(function() {
				var tr = $(this)
				
				tr.children("th").each(function()
				{
					var th = $(this)
					th.text("0x" + _self.numberToHexStr(lastaddr))
					
				})
				
				tr.children("td").each(function()
				{
					var td = $(this)
					
					var hi = Module.HEAPU8[_self.vm_mem_ptr+lastaddr]
					
					td.text(_self.numberToHexStr((hi)))
					
					lastaddr += 0x01
				});
			})
			
			// Update stack preview
			//<span class="stack-var" id="svar-1">0x0000 (__hello)</span>
			$("#stack-box-primary").empty()
			$("#stack-box-primary").append("<div class=\"stack-var\">Stack</div>")
			// walk the stack using the stackptr
			var bottomstack_signed = _self.vm_get_SP(_self.vm_ptr);
			var bottomstack_unsigned = _self.signedToUnsigned(bottomstack_signed)//regval_signed>>>0 // js quirk
			//console.log(bottomstack_unsigned)
			// dont show stackoverflows or we will lag the browser to shit
			for(var bottomstack = 0xFFFE; bottomstack > Math.max(bottomstack_unsigned,0xFFFE-0x200); bottomstack -= 2)
			{
				// 28bit -> 16bit
				var valuehi = Module.HEAP8[_self.vm_mem_ptr+bottomstack]
				var valuelo = Module.HEAP8[_self.vm_mem_ptr+bottomstack+1]
				
				var value = (valuehi << 8) | (valuelo & 0xff)
				//todo investigate infinite loops
				$("#stack-box-primary").append("<div class=\"stack-var\">&emsp;" +
				"0x" + _self.numberToHexStr(bottomstack) + "&emsp;" +
				value.toString() + "&emsp;" + _self.signedToUnsigned(value) + "&emsp;0x" + _self.numberToHexStr(_self.signedToUnsigned(value)) + "</div>")
			}
			
			this.memMapLastUpdate = 0
		}
		
			
		// Update register preview values
		$(".register-box").each(function(){
			var reg = $(this).children(".register-id")
			var val_signed = $(this).children(".value:nth(0)") // text 
			var val_unsigned = $(this).children(".value:nth(1)")
			var val_hex = $(this).children(".value:nth(2)")
			
			var regval_signed = _self["vm_get_"+reg.text()](_self.vm_ptr) // gives unsigned
			var regval_unsigned = _self.signedToUnsigned(regval_signed)//regval_signed>>>0 // js quirk
			
			val_signed.text(regval_signed)
			val_unsigned.text(regval_unsigned)
			val_hex.text("0x"+_self.numberToHexStr((regval_unsigned)))
			
		})
		
		// Show current instruction on dasm
		$('#vm-dasm-primary th').each(function(){ $(this).css('background-color','rgba(0,0,0,0)') })
		$('#vm-dasm-primary th').filter(function() 
		{
			return (parseInt($(this).text()) == _self.vm_get_PC(_self.vm_ptr));
		}).css('background-color', 'red');
	}

	
}


// Called when the Emscripten enviroment is ready
Vimmy.onEmscriptenRuntimeInitialized = function()
{
	Vimmy._integration = new Vimmy.Integration();
	
	// Error handling
	window.onerror = function abortZeroCatch(errorMsg, url, lineNumber) {
		if(errorMsg.search("abort(0)"))
		{
		   Vimmy._integration.pushError("An error occured, you may have called an invalid location or overwritten memory that is vital to the VM's operation. Checking the value of PC or looking at the stack may help you to solve this issue. If the VM fails to respond after this message, it is advised that you refresh the page, after saving any changes you may have made. ")
		}
	}
	
	var panic_handler = Runtime.addFunction(function(s) {
	   Vimmy._integration.pushError(Pointer_stringify(s))
	   Module.ccall("abort","null");
    });
	
	var counter = 0
	// estimated cycles are 100*60 cycles a second,
	// verify in vm.c for future reference
	// we do this because asking the VM user to do vsync themselves with inconsistent requestAnimFrame FPS is a pain in the ass
	// so we just use the post cycle hook to draw the screen 60 times a second, using the cycle times we are already aware about
	// note if cycle times in vm.c ever change, you must update this or you will have the display running at a different target FPS
	var post_cycle_hook = Runtime.addFunction(function(s) {
		counter = counter + 1
		// counter % 60000 = 1fps
		// counter % 1000 = 60fps
		if((counter%100)==0) // update screen at 1fps
		{
			Vimmy._integration.gpuCycle();
		}
    });
	
	if(panic_handler && post_cycle_hook)
	{
		Module.ccall('vm_register_panic_handler', // name of C function
			'null', // return type
			['number','number'], // argument types
			[Vimmy._integration.vm_ptr, panic_handler]
		); // arguments
		
		Module.ccall('vm_register_post_cycle_hook', // name of C function
			'null', // return type
			['number','number'], // argument types
			[Vimmy._integration.vm_ptr, post_cycle_hook]
		); // arguments
	}
}
	

var Module = { onRuntimeInitialized: function() {
	Vimmy.onEmscriptenRuntimeInitialized();
} };