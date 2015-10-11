var socket = io();

$('document').ready(function(){
  console.log("chatroom.js started");
  var audioObjects;

  $("#search_button").click(function(){
    var text = $("#song-text").val();
    if (text.length == 0){
      return false;
    }
    $("#search-results").empty();
    $.ajax({
      type: "POST",
      url: "/search",
      data: {'song' : text},
      success: function(data){
        console.log(data);
        audioObjects = [];
        for (var i = 0; i < data.track_names.length; i++) {
          var title = data.track_names[i];
          var artist_name = data.artist_names[i];
          var artist_id = data.artist_ids[i];
          var image_url = data.image_urls[i];
          var preview_url = data.preview_urls[i];
          audioObjects.push(new Audio(preview_url));
          console.log("preview url is: " + preview_url);
        $("#search-results").append('<div class="row"><div class="col-md-3"><img class="album-image"></div><div class="col-md-6"><p class="song-title">' + title +'</p><p class="artist-name">' + artist_name +'</p></div><div class = "col-md-3"><span class="glyphicon glyphicon-play pbutton" data-id="' + i.toString() + '"> </span> <button class="song-select" preview-url="' + preview_url + '" data-id=" ' + artist_id + ' ">Select Song</button> </div></div>');
        }
      }
    });
  });
    
    $(document).on('click', '.pbutton',function(){
      console.log('pbutton clicked');
      var index = $(this).attr('data-id');
      console.log(index);
      if ($(this).hasClass("glyphicon-play")) {
        $(this).removeClass("glyphicon-play");
        $(this).addClass("glyphicon-pause");
        audioObjects[index].pause();

      } else {
          $(this).removeClass("glyphicon-pause");
          $(this).addClass("glyphicon-play");
          audioObjects[index].play();
      }
    });


    $(document).on('click', '.song-select',function(){
      console.log("song select called");
      $("#search-results").empty();

      var artist_id = $(this).attr('data-id');
      var preview_url = $(this).attr('preview-url');
      var artist_name = $(this).parents('p.artist_name').text();
      socket.emit('music upload', preview_url);
      $.ajax({
        type: "GET",
        url: "/generateChoices",
        data: {'artist_id' : artist_id, 'artist_name' : artist_name},
        success: function(data){
          var i;
          var index;
          var usedInts = new Set();
          var choices = ['A.', 'B.', 'C.', 'D.', 'E.'];
          var count = 0;

          while(true){
            break;
            console.log("in while loop");
            if (usedInts.length == 5){
              break;
            }
            i = Math.floor((Math.random() * 5));
            if (!usedInts.has(i)){
              count++;
              usedInts.add(i);
              $("#quiz").append('<p id=" ' + data.artist_ids[i] +' "> ' + choices[count] + '   ' + data.artist_names[i] + '</p>');
            }
          } /*end while */
        
        } /*End Success*/
    
      });

    });
  });
