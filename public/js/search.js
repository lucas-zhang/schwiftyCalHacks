$(document).ready(function(){
  var audioObject;
  $("#search").click(function(){
      var songInput = $('input#song').val();
      $.ajax({
        method: 'POST',
        url: '/search',
        data: {
            song: songInput,
            type: 'track'
        },
        success: function (response) {
            console.log(response);
            $(".result").fadeIn(3000);
            $(".title").text(response.track_names[0]);
            $(".artist").text(response.artist_names[0]);
            $(".album-image").attr('src', response.image_urls[0]);
            audioObject = new Audio(response.preview_urls[0])
        }
    });
  });

  $(".pbutton").on('click', function() {
    if ($(this).hasClass("playing")) {
      audioObject.pause();
      $(this).removeClass("playing");
      $(this).text("Play");
    } else {
      audioObject.play();
      $(this).addClass("playing");
      $(this).text("Pause");
    }
  });

})
