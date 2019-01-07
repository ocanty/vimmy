
// adds a data variable to the data box
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

  // Get code dropped by the server, in a loop
  var setDropped = false
  var setOnDrop = function()
  {
    if(typeof window.vimmyDroppedCode !== 'undefined' && typeof window.vimmyDroppedData !== 'undefined' && !setDropped)
    {
      // decode base64 code and set the editor
      _self.Editor.getDoc().setValue(window.atob(window.vimmyDroppedCode));
      // we got the code stop looping
      dropSetCode = true

      // process all the data and add each one
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
  setOnDrop() // start checking for dropped code

  // when the user hits post comment
  $("#post-comment").click(function()
  {
    // send comment or return error
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

  // send upvote or return error
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
    // request comments based off sort param and amount
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

            // push each comment that was requested
            for(var n in comments)
            {
              var comment = comments[n]
              $("#comment-row").append(
                "<div class='col-sm-12 comment'>" +
                "<button id=" + comment.comment_id + " class='btn btn-sandbox text-striking'>" + comment.score + "</button>" +
                "<span> &bull; <a href='/users/" + comment.poster.user_id + "'>" + comment.poster.display_name + "</a> &bull; " + moment(comment.posted_at).format('DD/MM/YYYY') + "</span>" + "<p>" + comment.comment + "</p>"
              )

              // comment upvoting
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

            // add the show more button
            $("#comment-row").append(
            "<div class='col-sm-12' style='text-align: center'>" +
              "<button id='show-more' style='border: none; margin: 0 auto; margin-bottom: 2px; padding: 4px; border-bottom: 2px groove rgba(0,0,0,0.15); display:inline-block; width: 100%; background-color: rgba(0,0,0,0.20);'> Show More </a>"
            )

            // if that is clicked request the comments again + 10 in amount
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
  // draw 10 comments on page load
  update_comments(10)
  
  // update the sort type if the user changes it and request the new comments
  $( "#sort-type" ).change(function() {
    sort = $("#sort-type").val()
    amount = 10
    update_comments(amount)
  });



})
