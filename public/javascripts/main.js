"use strict";

$('.post').click(function(event){
  // handle displaying post here
});



$('#logout').click(logout);

function logout(){
  $.ajax({
    url: 'users/deauth', // the presigned URL
    type: 'POST',
    success: function() { location.reload(); },
    error: function(err) { console.log("login failed");}
  });
}
