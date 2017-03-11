
$(document).ready(function()
{
	function insert_project(score,name,category,date,id)
	{
		$('#project-panel').append(
				"<div style='padding:0; margin:0; margin-bottom: 2px;' class='row'>" +
		  "<div class='col-sm-1' style='text-align: center'>" +
			"<button class='btn btn-sandbox text-striking vote-count'>" + score + "</button>" +
		  "</div>" + 
		  "<div style='margin-bottom: 16px;' class='col-sm-7'><a href='/projects/"+id+"'>" +
			 "<h3 style='padding:0; padding-top: 2px; margin: 0;'> " + name + " &bull; " + category + " &bull; " + moment(date).format('DD/MM/YYYY') + "</h3></a></div>" + 
		 " <div style='text-align: right' class='col-sm-4'> " + 
			"<button onclick='window.location=\"/projects/"+id+"\"' class='btn btn-sandbox bg-discover-minor'>View</button>" + 
		  "</div>" +
		"</div>"
		)
	}
	
	var category = "All"
	
	var sort = $("#sort-type").val()
	var amount = 10
	
	var update_projects = function(amount)
	{
		$.ajax({
			type: "GET",
			url: window.location + "/projects?sort=" + sort + "&amount=" + amount + "&category=" + category,
			success: function(data)
				{
					var outdata = JSON.parse(data)
					if(outdata)
					{
						var projects = outdata.projects
						
						$("#project-panel").empty()
						
						for(var n in projects)
						{
							var project = projects[n]
							var num = (sort=="views" ? project.views : project.num_votes)
							
							insert_project(num,project.name,project.category,project.created_at,project.project_id)
						}
						
						$("#project-panel").append(
						"<div class='col-sm-12' style='text-align: center'>" +
							"<button id='show-more' style='border: none; margin-left: 0 auto; margin-top: 8px; border-radius: 6px; margin-bottom: 2px; padding: 4px; border-bottom: 2px groove rgba(0,0,0,0.15); display:inline-block; width: 100%; background-color: rgba(0,0,0,0.05);'> Show More </a>"
						)
						
						$("#show-more").click(function()
						{
							console.log("showed more")
							amount = amount+10
							update_projects(amount)
						}) 
					}
					//console.log(comments)
				},
			error: function(error)
				{
					console.log("error")
		
				}
		});
	}
	
	// setting categories
	$(".category").click(function()
	{
		category = $(this).text()
		$(".category").css("background-color","rgba(0,0,0,0.10)");
		$(this).css("background-color","rgba(0,0,0,0.25)");
		
		amount = 10
		update_projects(amount);
	})
	
	// set default category
	$($(".category")[0]).click()
	
	
	
	$( "#sort-type" ).change(function() {
		sort = $("#sort-type").val()
		amount = 10
		update_projects(amount)
	});
})

