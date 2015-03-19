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
  });

  // custom student email validation
  window.ParsleyValidator.addValidator('student',
  function (val) {
    return /.edu$/.test(val);
  }, 32)
  .addMessage('en', 'student', 'This should be a valid student email');

  $('#signup-form').parsley({
    successClass: 'success',
    errorClass: 'error'
  });

  $('#login-dropdown-menu').parsley({
    successClass: 'success',
    errorClass: 'error'
  });

  $('#signup-form').submit(function(){
    signup();
    return false;
  });

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
      success: function(){
        $('#signup-modal').modal('hide');
        swal("Success!", "Please check your email to confirm your account.", "success");
      },
      error: function(err) {
        console.log("signup failed");
        $('#signup-modal').modal('hide');
        swal("Error!", "Please make sure you have not already signed up with this email.", "error");
      }
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
