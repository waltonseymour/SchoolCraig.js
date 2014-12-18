"use strict";

$('.dropdown-toggle').dropdown();
$('.dropdown-menu').click(function (e) {
  e.stopPropagation();
});

$('#login-submit').click(login);

$('#login-password').keydown(function(e) {
  var key = e.which;
  if (key == 13) {
    login();
  }
});

function login(){
  var data = {email: $('#login-email').val(), password: $('#login-password').val()};
  $.ajax({
    url: 'http://localhost:3000/users/auth', // the presigned URL
    type: 'POST',
    data: data,
    success: function() { location.reload(); },
    error: function(err) { console.log("login failed");}
  });
  
}
