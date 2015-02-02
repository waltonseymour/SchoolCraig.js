(function() {
  "use strict";

  $('.dropdown-menu').click(function (e) {
    e.stopPropagation();
  });

  $('.dropdown-toggle').click(function () {
    setTimeout(function(){
      $('#login-email').focus();
    }, 0);
  });

  $('#signup-modal').on('shown.bs.modal', function (e) {
    $('#signup-email').focus();
  })

  $('#signup-form').parsley({
    successClass: 'success',
    errorClass: 'error'
  });

  $('#login-dropdown-menu').parsley({
    successClass: 'success',
    errorClass: 'error'
  });

  $('#signup-form').submit(signup);

  $('#login-dropdown-menu').submit(function(){
    login();
    return false;
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
}());