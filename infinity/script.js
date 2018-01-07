
function startGame() {
  $("#TutContainer").html("<h4 class=\"scoree text-center\"> <span  class=\"pull-left\">Health: <span id=\"health\">100</span> </span>Score <span id=\"minutes\">0</span><span class=\"pull-right\"><button class=\"button btn  btn-lg\" type=\"button\"  id=\"mute\"> <span class=\"fa fa-volume-up\"></span> </button></span></h4>");
//  setInterval(setTime, 1000);
$("#mute").click( function()
         {
           if (  $('#bgsound').prop("paused") == false) {
              $('#bgsound').trigger("pause");
                document.getElementById('exp').src = 'exp.mp3';

          } else {
                $('#bgsound').trigger("play");
                  document.getElementById('exp').src = '';

          }


         }
    );
  $.getScript('scriptGame.js');
}

  $("#play").click( function()
           {
             startGame();
           }
      );
