
// stolen from sandbox.js
var addDataVar = function(type,_name,_val)
{
	var name = _name
	var val = _val
	
	$("#vm-data-input").append('<div class="row"> \
	<div class="col-sm-2 col-variable"><input placeholder="Data Name" type="text" data-uid="' +this.dataUid+ '" data-type="' + type + '" value="' + name + '" style="width: 100%" class="input-variable variable-name"/></div> \
	<div class="col-sm-8 col-variable"><input placeholder="Data" type="text" data-uid="' +this.dataUid+ '" data-type="' + type + '" value="' + val + '" style="width: 100%" class="input-variable variable-type"/></div> \
	<div class="col-sm-2 col-variable"> \
	<button class="btn btn-sandbox btn-variable">Remove</button>'
	+ 
	(
		type=="sprite" 
		? 
			'<input type="file" id="variable-file-' + this.dataUid + '" class="btn btn-sandbox btn-variable" style="position:absolute;top:-1000px"></input>' + 
			'<button class="btn btn-sandbox btn-variable">Change</button>' 
		: 
			""
	) + '</div></div>')
	
	// scroll to bottom to show added data type
	$("#vm-data-input").animate({ scrollTop: $('#vm-data-input').prop("scrollHeight")}, 1);
	this.dataUid = this.dataUid + 1
}

$(document).ready(function()
{
	// Setup editor
	this.Editor = CodeMirror.fromTextArea(document.getElementById("code-entry"),{
		lineNumbers: true,
		theme: "base16-dark",
		mode: "gas",
		readOnly: true
	});
	
	var _self = this
	
	// Get code dropped by the server
	var setDropped = false
	var setOnDrop = function()
	{
		if(typeof window.vimmyDroppedCode !== 'undefined' && typeof window.vimmyDroppedData !== 'undefined' && !setDropped)
		{
			_self.Editor.getDoc().setValue(window.vimmyDroppedCode.toLowerCase());
			dropSetCode = true

			for(var n in window.vimmyDroppedData)
			{
				var datavar = window.vimmyDroppedData[n]
				addDataVar(datavar.type,datavar.name,datavar.value)
			}
			setDropped = true
		}
		else
		{
			setTimeout(setOnDrop,1000)
		}
		
	}
	setOnDrop()
	
	$("#post-comment").click(function()
	{
		$.ajax({
			type: "POST",
			url: window.location + "/comments/add",
			data: {data:$("#comment-entry").val()},
			success: function(data)
				{
					location.reload()
				},
			error: function(error)
				{
					var show_error = function()
					{
						$("#post-comment").text(error.responseText)
						setTimeout(function(){ $("#post-comment").text("Post Comment") },3000)
					}
					
					show_error()
				}
		});

	})
	
	$("#btn-plusone").click(function()
	{

		$.ajax({
			type: "POST",
			url: window.location + "/upvote",
			success: function(data)
				{
					location.reload()
				},
			error: function(error)
				{
					var show_error = function()
					{
						$("#btn-plusone").text(error.responseText)
						setTimeout(function(){ $("#btn-plusone").text("+1") },3000)
					}
					
					show_error()
				}
		});
	})
	
	// get comments
	var sort = $("#sort-type").val()
	var amount = 10
	
	var update_comments = function(amount)
	{
		$.ajax({
			type: "GET",
			url: window.location + "/comments?sort=" + sort + "&amount=" + amount,
			success: function(data)
				{
					var outdata = JSON.parse(data)
					if(outdata)
					{
						var comments = outdata.comments
						$("#comment-row").empty()
						
						for(var n in comments)
						{
							var comment = comments[n]
							$("#comment-row").append(
								"<div class='col-sm-12 comment'>" +
								"<button id=" + comment.comment_id + " class='btn btn-sandbox text-striking'>" + comment.score + "</button>" +
								"<span> &bull; <a href='/users/" + comment.poster.user_id + "'>" + comment.poster.display_name + "</a> &bull; " + moment(comment.posted_at).format('DD/MM/YYYY') + "</span>" + "<p>" + comment.comment + "</p>"
							)
							
	
							$("#" + comment.comment_id).click(function()
							{
								
								var _self = this
								$.ajax({type: "POST",
								url: window.location + "/comments/" + $(this).attr("id") + "/upvote",
								success: function(data)
								{
									console.log(data)
									$(_self).text(data)
									$(_self).off("click")
								}
								})
							})
						}
						
						$("#comment-row").append(
						"<div class='col-sm-12' style='text-align: center'>" +
							"<button id='show-more' style='border: none; margin: 0 auto; margin-bottom: 2px; padding: 4px; border-bottom: 2px groove rgba(0,0,0,0.15); display:inline-block; width: 100%; background-color: rgba(0,0,0,0.20);'> Show More </a>"
						)
						
						$("#show-more").click(function()
						{
							console.log("showed more")
							amount = amount+10
							update_comments(amount)
						})
					}
					console.log(comments)
				},
			error: function(error)
				{
					console.log("error")
		
				}
		});
	}
	update_comments(10)
	
	
	$( "#sort-type" ).change(function() {
		sort = $("#sort-type").val()
		amount = 10
		update_comments(amount)
	});
	

	
})