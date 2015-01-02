"use strict";

$('.dropdown-toggle').dropdown();
$('.dropdown-menu').click(function (e) {
  e.stopPropagation();
});

$('#signup-form').parsley({
  successClass: 'success',
  errorClass: 'error'
});

$('#signup-form').submit(signup);

$('#login-submit').click(login);

$('#login-password').keydown(function(e) {
  var key = e.which;
  if (key == 13) {
    login();
  }
});

function signup() {
  var data = {email: $('#signup-email').val(), password: $('#signup-password').val()};
  $.ajax({
    url: 'users',
    type: 'POST',
    data: data,
    success: function() { location.reload(); },
    error: function(err) { console.log("login failed");}
  });
}

function login(){
  var data = {email: $('#login-email').val(), password: $('#login-password').val()};
  $.ajax({
    url: 'users/auth',
    type: 'POST',
    data: data,
    success: function() { location.reload(); },
    error: function(err) { console.log("login failed");}
  });
}
